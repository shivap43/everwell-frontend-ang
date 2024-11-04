import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators, NgForm } from "@angular/forms";
import { MemberService, StaticService, HideReadOnlyElementSetting, GenderDetails, SSNMask } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { AddBeneficiary } from "./beneficiary-model/add-beneficiary.model";
import { Subscription, Observable, of, defer, iif, Subject } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { MemberModel, SharedState, RegexDataType, MemberBeneficiary } from "@empowered/ngxs-store";
import { MemberBeneficiary as Beneficiary, MemberContact } from "@empowered/constants";

import {
    ConfigName,
    MASK_SSN_FORMAT,
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    PhoneNumber,
    ClientErrorResponseType,
    AddressConfig,
    BeneficiaryType,
    AppSettings,
    Address,
    ContactType,
    CountryState,
    Email,
    Phone,
} from "@empowered/constants";
import { NgxMaskPipe } from "ngx-mask";
import { filter, switchMap, map, tap, catchError, finalize, takeUntil } from "rxjs/operators";
import { MembersBusinessService } from "../../services/members-business.service";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const DUPLICATE_CHECK = "duplicate";
const VALIDATE_SSN = "SSN";
const CHECK_BENEFICIARY_NAME = "name";
const PARTIALLY_MASKED_SSN = "PARTIALLY_MASKED";
const FULLY_MASKED_SSN = "FULLY_MASKED";
const FULLY_VISIBLE_SSN = "FULLY_VISIBLE";
const ADDRESS = "address";
const SUBMIT = "Submit";
const PERSONAL = "PERSONAL";
const ITIN = "itin";
const SSN_MAX_LENGTH = 11;
const SSN_Mask_Length = 5;
@Component({
    selector: "empowered-beneficiary-add",
    templateUrl: "./beneficiary-add.component.html",
    styleUrls: ["./beneficiary-add.component.scss"],
    providers: [DatePipe],
})
export class BeneficiaryAddComponent implements OnInit, OnDestroy {
    beneficiaryObj: AddBeneficiary;
    currentBeneficiaryType: string;
    memberId: number;
    MpGroup: number;
    states: CountryState[];
    suffixes: string[];
    beneficiaryType: any[];
    beneficiaryEnum = BeneficiaryType;
    maxDate: Date = new Date();
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    zipMinLength = 5;
    zipMaximumLength = 9;
    // phone number types
    phoneNumberTypes = [ContactType.HOME, ContactType.WORK];
    // same as employee address
    samePrimaryAddressLabel: string;

    phoneMaxLength = PhoneNumber.MAX_LENGTH;
    // TODO: please have this in config
    MAX_LENGTH_ADDRESS = 100;
    MAX_LENGTH_CITY = 100;
    MAX_LENGTH_EMAIL = 60;

    errorMessageArray = [];
    showErrorMessageInAlert: boolean;
    errorMessage: string;
    beneficiaryAddForm: FormGroup;
    storeSubscriber: Subscription;
    staticSubscriber: Subscription;
    getMemberContactSubsciber: Subscription;
    createBeneficiarySubsciber: Subscription;
    getMembeDetailsSubscriber: Subscription;
    state: MemberModel;
    HOMEADDRESSSAMEASEMPLOYEE = "homeAddressSameAsEmployee";
    isHomeAddressSameAsEmployee: boolean;
    memberAddress: MemberContact;
    memberContactError: string;
    portal: string;
    isMemberPortal: boolean;
    relationshipMemberLabel: string;
    @Select(MemberBeneficiary) memberState$: Observable<MemberModel>;
    @Select(SharedState.regex) regex$: Observable<any>;
    nameWithHypenApostrophesValidation: RegExp;
    validationRegex: RegexDataType;
    customPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnMaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnUnmaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: null }, 0: { pattern: new RegExp("\\d") } };
    isMaskedTrue: boolean;
    isShowHideButtonVisible: boolean;
    isBirthdateRequired = false;
    isBirthdateInvalid = false;
    isSSNValue: boolean;
    subscriptions: Subscription[] = [];
    genders$: Observable<GenderDetails[]> = this.staticService
        .getGenders()
        .pipe(map((genders: string[]) => this.memberService.refactorGenders(genders)));
    ssnFormat = MASK_SSN_FORMAT;
    languageStrings = {
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect"),
        firstName: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.firstName"),
        lastName: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.lastName"),
        relationshipToMember: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.relationshipToMember"),
        organizationName: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.organizationName"),
        trustName: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.trustName"),
        trustAgreementDate: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.trustAgreementDate"),
        trusteeFirstName: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.trusteeFirstName"),
        zip: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.zip"),
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.members.beneficiaryEdit.ariaCancel"),
        ariaSave: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.ariaSave"),
        modalTitle: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.title"),
        modalClose: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
        aboutBeneficiary: this.language.fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.aboutBeneficiary"),
    };
    INDIVIDUAL_TYPE_FORM: FormGroup;
    CHARITY_TYPE_FORM: FormGroup;
    TRUST_TYPE_FORM: FormGroup;
    requiredFields = [];
    HIDDEN = "hidden";
    READONLY = "readonly";
    REQUIRED = "required";
    OPTIONAL = "optional";
    isLoading: boolean;
    invalidSSNValidation: RegExp;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        beneficiaryType: true,
        firstName: true,
        lastName: true,
        suffix: true,
        relationshipToMember: true,
        homeAddressSameAsEmployee: true,
        state: true,
        zip: true,
        organizationName: true,
        trustName: true,
        trustAgreementDate: true,
        trusteeFirstName: true,
        trusteeLastName: true,
        trusteeSuffix: true,
        ssn: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        beneficiaryType: false,
        firstName: false,
        lastName: false,
        suffix: false,
        relationshipToMember: false,
        homeAddressSameAsEmployee: false,
        state: false,
        zip: false,
        organizationName: false,
        trustName: false,
        trustAgreementDate: false,
        trusteeFirstName: false,
        trusteeLastName: false,
        trusteeSuffix: false,
        ssn: false,
    };
    ssnOptionalField: boolean;
    stateOptionalField: boolean;
    individualSSN: string;
    languageStringArray: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.show",
        "primary.portal.common.hide",
        "primary.portal.census.manualEntry.isMobilenumber",
        "primary.portal.census.manualEntry.phoneType",
        "primary.portal.members.beneficiaryEdit.individualContactInfoTitle",
        "primary.portal.members.beneficiaryAdd.completeAddress",
        "primary.portal.members.api.ssn.duplicate.nonMmp",
        "primary.portal.member.ssn_itin",
        "primary.portal.members.api.ssn_itin.duplicate.nonMmp",
    ]);
    incompleteAddress = false;
    empFirstName: string;
    ssnMaxLength = SSN_MAX_LENGTH;
    isFormValueChange = false;
    unmaskedSSNValue: string;
    maskedSSNValue: string;
    isFullyVisible = false;
    isFullyMasked = false;
    isPartiallyMasked = false;
    addForm: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly dialogRef: MatDialogRef<BeneficiaryAddComponent>,
        public memberService: MemberService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly modalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {
        this.beneficiaryType = Object.keys(this.beneficiaryEnum).map((key) => ({
            value: BeneficiaryType[key],
            name: key,
        }));
        this.memberId = this.store.selectSnapshot(MemberBeneficiary.getMemberId);
        this.MpGroup = this.store.selectSnapshot(MemberBeneficiary.getMpGroup);
        this.checkUserType();
        this.getRelationShipMemberLabel();
        this.getMemberAddress();
        this.isHomeAddressSameAsEmployee = false;
        this.validate();
        this.hideErrorAlertMessage();
    }

    /**
     * Init life cycle hook of angular.
     * Called at a time of component initialization.
     * @returns void
     */
    ngOnInit(): void {
        this.excludeBeneficiaryType(BeneficiaryType.ESTATE);
        // eslint-disable-next-line max-len
        this.individualSSN = `${this.languageStrings["primary.portal.members.beneficiaryEdit.individualSSN"]} ${this.languageStrings["primary.portal.common.optional"]}`;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal*"));
        this.ssnOptionalField = false;
        this.stateOptionalField = false;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
                this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
                this.invalidSSNValidation = new RegExp(this.validationRegex.INVALID_SSN);
            }
        });
        this.membersBusinessService
            .getSpinnerStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (this.isLoading = response));

        this.getStates();
        this.getSuffixes();
        this.createListner();
        this.initForm();
        this.getConfigurations();
        this.isSsnOptionField();
        this.isStateOptionField();
        this.getSSNConfiguration();
        this.isBirthdateInvalid = true;
    }
    getConfigurations(): void {
        this.isLoading = true;
        this.staticService
            .getConfigurations("user.beneficiary_type.charity.enabled", this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    if (res[0].value.toLowerCase() === "false") {
                        this.beneficiaryType = this.beneficiaryType.filter((x) => x.name.toLowerCase() !== "charity");
                    }
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * It will exclude beneficiary type from beneficiary types array.
     * @param beneficiaryType {string} beneficiary type
     * @returns void
     */
    excludeBeneficiaryType(beneficiaryType: string): void {
        this.beneficiaryType = this.beneficiaryType.filter((type) => type.value !== beneficiaryType);
    }

    checkUserType(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
    }

    /**
     * This method is used to create beneficiary form.
     * @returns void.
     */
    initForm(): void {
        const UPDATE_ON_CHANGE = { updateOn: "change" };
        this.INDIVIDUAL_TYPE_FORM = this.fb.group({
            beneficiaryType: ["INDIVIDUAL", Validators.required],
            name: this.fb.group(
                {
                    firstName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                    lastName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                    middleName: ["", Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))],
                    suffix: [""],
                    maidenName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME))])],
                },
                { updateOn: "blur" },
            ),

            birthDate: ["", { updateOn: "blur" }],
            gender: ["", { updateOn: "blur" }],
            ssn: ["", Validators.pattern(new RegExp(this.validationRegex.UNMASKSSN_ITIN))],
            relationshipToMember: [
                "",
                {
                    updateOn: "blur",
                    validators: Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED)),
                },
            ],
            details: ["", { updateOn: "blur", validators: Validators.pattern(new RegExp(this.validationRegex.ADDRESS)) }],
            homeAddressSameAsEmployee: [""],
            contact: this.fb.group(
                {
                    address: this.fb.group({
                        address1: [
                            "",
                            Validators.compose([
                                Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                                Validators.maxLength(this.MAX_LENGTH_ADDRESS),
                            ]),
                        ],
                        address2: [
                            "",
                            Validators.compose([
                                Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                                Validators.maxLength(this.MAX_LENGTH_ADDRESS),
                            ]),
                        ],
                        city: [
                            "",
                            Validators.compose([
                                Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_BETWEEN_WORDS)),
                                Validators.maxLength(this.MAX_LENGTH_CITY),
                            ]),
                        ],
                        countryid: [""],
                        country: [""],
                        state: [""],
                        zip: ["", UPDATE_ON_CHANGE],
                    }),
                    phoneNumbers: this.fb.group({
                        phoneNumber: ["", Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))],
                        type: [ContactType.HOME],
                        isMobile: [{ value: false, disabled: true }],
                    }),
                    emailAddresses: this.fb.group({
                        email: [
                            "",
                            Validators.compose([
                                Validators.pattern(new RegExp(this.validationRegex.EMAIL)),
                                Validators.maxLength(this.MAX_LENGTH_EMAIL),
                            ]),
                        ],
                    }),
                },
                { updateOn: "blur" },
            ),
        });
        this.CHARITY_TYPE_FORM = this.fb.group(
            {
                beneficiaryType: ["", Validators.required],
                organizationName: [
                    "",
                    Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_NUM_SPECIAL_CHAR))]),
                ],

                contact: this.fb.group({
                    address: this.fb.group({
                        state: [""],
                        zip: ["", UPDATE_ON_CHANGE],
                    }),
                }),
            },
            { updateOn: "blur" },
        );
        this.enableCellTypeCheck();
        this.TRUST_TYPE_FORM = this.fb.group(
            {
                beneficiaryType: ["", Validators.required],
                trustName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                trustAgreementDate: [""],
                trustee: this.fb.group({
                    firstName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME))])],
                    lastName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME))])],
                    suffix: [""],
                }),
                contact: this.fb.group({
                    address: this.fb.group({
                        state: [""],
                        zip: ["", UPDATE_ON_CHANGE],
                    }),
                }),
            },
            { updateOn: "blur" },
        );
        this.getValidationForKey("beneficiaryType", this.REQUIRED);
        this.getValidationForKey("beneficiaryType", this.HIDDEN);
        this.getValidationForKey("beneficiaryType", this.READONLY);
        this.beneficiaryAddForm = this.fb.group({
            beneficiaryType: ["", { updateOn: "blur", validators: Validators.required }],
            homeAddressSameAsEmployee: [""],
            contact: this.fb.group(
                {
                    address: this.fb.group({
                        state: [""],
                        zip: [""],
                    }),
                },
                { updateOn: "blur" },
            ),
        });
    }

    /**
     * Enable the cell type checkbox if user enters valid phone number on phone field.
     * @returns void
     */
    enableCellTypeCheck(): void {
        const phoneNumberCtrl = this.INDIVIDUAL_TYPE_FORM.get("contact").get("phoneNumbers");
        phoneNumberCtrl
            .get("phoneNumber")
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((phoneNumber) => {
                if (phoneNumber && phoneNumberCtrl.get("phoneNumber").valid) {
                    phoneNumberCtrl.get("isMobile").enable();
                } else {
                    phoneNumberCtrl.get("isMobile").patchValue(false);
                    phoneNumberCtrl.get("isMobile").disable();
                }
            });
    }

    /**
     * Populates the address of member if member's address is complete else disables the form control
     */
    createListner(): void {
        if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
            if (
                this.memberAddress.address.address1 &&
                this.memberAddress.address.city &&
                this.memberAddress.address.state &&
                this.memberAddress.address.zip
            ) {
                this.beneficiaryAddForm
                    .get(this.HOMEADDRESSSAMEASEMPLOYEE)
                    .valueChanges.pipe(takeUntil(this.unsubscribe$))
                    .subscribe((res) => {
                        this.isHomeAddressSameAsEmployee = res;
                        this.populateEmployeeAddress();
                    });
            } else {
                this.isHomeAddressSameAsEmployee = false;
                this.beneficiaryAddForm.controls[this.HOMEADDRESSSAMEASEMPLOYEE].disable();
                this.incompleteAddress = true;
            }
        }
    }
    dateFormatter(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }

    /**
     * Populate the beneficiary address same as employee address
     * @returns void
     */
    populateEmployeeAddress(): void {
        const address = this.beneficiaryAddForm.controls.contact.get(ADDRESS);
        if (this.isHomeAddressSameAsEmployee) {
            address.reset();
            address.disable();
            this.setMemberAddressToBeneficiary();
        } else {
            this.beneficiaryAddForm.controls.contact.get(ADDRESS).enable();
            address.reset();
        }
    }
    getMemberAddress(): void {
        this.getMemberContactSubsciber = this.memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (address: MemberContact) => {
                    this.memberAddress = address["body"];
                },
                () => {
                    this.memberContactError = this.language.fetchPrimaryLanguageValue(
                        "primary.portal.members.beneficiary.memberContactLoadError",
                    );
                },
            );
    }
    /**
     * This method is used to assign relationship to member label value
     */
    getRelationShipMemberLabel(): void {
        this.getMembeDetailsSubscriber = this.memberService.getMember(this.memberId, false, this.MpGroup.toString()).subscribe(
            (response) => {
                const memberDetails = response.body;
                if (memberDetails && memberDetails.name) {
                    this.empFirstName = memberDetails.name.firstName;
                    this.relationshipMemberLabel = this.language
                        .fetchPrimaryLanguageValue("primary.portal.members.addBeneficiary.relationshipToMemberName")
                        .replace("#empName", memberDetails.name.firstName);
                    this.samePrimaryAddressLabel = this.language
                        .fetchPrimaryLanguageValue("primary.portal.members.beneficiaryEdit.samePrimaryAddress")
                        .replace("##employeeFirstName##", memberDetails.name.firstName);
                }
            },
            () => {},
        );
    }

    /**
     * Update the beneficiary contacts if member address is available.
     * @returns void
     */
    setMemberAddressToBeneficiary(): void {
        if (this.memberAddress) {
            this.beneficiaryAddForm.patchValue({
                contact: {
                    address: this.memberAddress.address,
                },
            });
        } else {
            this.beneficiaryAddForm.patchValue({
                homeAddressSameAsEmployee: false,
            });
        }
    }
    /**
     *
     * @param event zip text field keyboard event
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }
    // To Check State is Getting Updated or not
    validate(): void {
        this.storeSubscriber = this.memberState$.subscribe((state: MemberModel) => {
            this.state = { ...state };
        });
    }

    /**
     * Method used to set proper validation for the form controls
     * @param regiForm beneficiary add form group
     */
    settingValidations(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key] as FormGroup);
            } else if (this.getValidationForKey(key, this.REQUIRED)) {
                if (key === "birthDate") {
                    this.isBirthdateRequired = true;
                }
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            }
            this.getValidationForKey(key, this.HIDDEN);
            this.getValidationForKey(key, this.READONLY);
            this.getValidationForKey(key, this.OPTIONAL);
        });
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    /**
     * This method validates dates.
     * @param control: string, form control name
     * @param event: string, the date value entered
     * @returns language string on the basis of error response.
     */
    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        if ((this.beneficiaryAddForm.get(control).value === null || this.beneficiaryAddForm.get(control).value === "") && event !== "") {
            return this.language.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat");
        }
        if (!this.beneficiaryAddForm.get(control).value && this.isBirthdateRequired) {
            this.beneficiaryAddForm.get(control).setErrors({ required: true });
            return this.language.fetchSecondaryLanguageValue("secondary.portal.members.requiredField");
        }
        if (this.dateService.checkIsAfter(this.dateService.toDate(this.INDIVIDUAL_TYPE_FORM.controls.birthDate.value), this.maxDate)) {
            return this.language.fetchPrimaryLanguageValue(
                "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate",
            );
        }
        return undefined;
    }
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessageInAlert = false;
    }
    /** This method is called when there will be duplicate beneficiary's name error
     * @returns beneficiary's name in the form of string
     */
    getBeneFiciaryName(): string {
        if (this.INDIVIDUAL_TYPE_FORM.controls.name.value.firstName !== "") {
            return this.INDIVIDUAL_TYPE_FORM.controls.name.value.firstName + " " + this.INDIVIDUAL_TYPE_FORM.controls.name.value.lastName;
        }
        if (this.TRUST_TYPE_FORM.value !== "") {
            return this.TRUST_TYPE_FORM.controls.trustName.value;
        }
        return "";
    }
    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessageInAlert = true;
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length) {
            if (error.details[0].code === DUPLICATE_CHECK && error.details[0].field.toLowerCase() === CHECK_BENEFICIARY_NAME) {
                this.errorMessage = this.language
                    .fetchSecondaryLanguageValue("secondary.portal.members.api.duplicate.beneficiary")
                    .replace("#beneficiaryname", this.getBeneFiciaryName());
            } else if (error.details[0].code === DUPLICATE_CHECK && error.details[0]?.field?.toUpperCase() === VALIDATE_SSN) {
                this.showErrorMessageInAlert = false;
                this.INDIVIDUAL_TYPE_FORM.controls.ssn.setErrors({ duplicate: true });
            } else if (error.details[0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                this.errorMessage = this.language.fetchPrimaryLanguageValue(error.details[0].message);
            } else {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
                );
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.DUPLICATE) {
            if (error.details && error.details.some((detail) => detail.field.toUpperCase() === VALIDATE_SSN)) {
                this.errorMessage = this.languageStringArray["primary.portal.members.api.ssn.duplicate.nonMmp"];
            } else if (error.details && error.details.some((detail) => detail.field.toUpperCase() === ITIN)) {
                this.errorMessage = this.languageStringArray["primary.portal.members.api.ssn_itin.duplicate.nonMmp"].replace(
                    "##identifier##",
                    ITIN,
                );
            } else {
                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.members.api.duplicate.beneficiary");
            }
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    getValidationForKey(key: string, validationString: string): boolean {
        let flag = false;
        this.state.configurations.payload.forEach((element) => {
            const elementName = element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase();
            if (elementName === key.toLowerCase() && element.value.toLowerCase() === validationString.toLowerCase()) {
                if (elementName === "firstname" || elementName === "lastname" || elementName === "suffix") {
                    // As include doesn't work in IE11
                    if (element.name.indexOf("trustee") >= 0 && this.currentBeneficiaryType === this.beneficiaryEnum.TRUST) {
                        flag = true;
                        const trusteeKey =
                            elementName === "firstname"
                                ? "trusteeFirstName"
                                : elementName === "lastname"
                                ? "trusteeLastName"
                                : "trusteeSuffix";

                        this.setvaluesToConfigurationFields(validationString, trusteeKey);
                    } else if (!(element.name.indexOf("trustee") >= 0) && this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
                        flag = true;
                        this.setvaluesToConfigurationFields(validationString, key);
                    }
                } else {
                    flag = true;
                    this.setvaluesToConfigurationFields(validationString, key);
                }
            }
        });

        return flag;
    }

    setvaluesToConfigurationFields(validationString: string, key: string): void {
        this.hideFieldElementSetting[key] = !(validationString === this.HIDDEN);
        this.readOnlyFieldElementSetting[key] = validationString === this.READONLY;
        if (validationString === this.REQUIRED) {
            this.requiredFields.push(key);
        }
    }

    /**
     * Called on change of beneficiary selection.
     * @param $event - type of beneficiary
     * @param form - Beneficiary form ref
     * @returns void
     */
    onChange($event: string, form: NgForm): void {
        if (this.currentBeneficiaryType === this.beneficiaryEnum[$event]) {
            return;
        }
        this.currentBeneficiaryType = this.beneficiaryEnum[$event];
        switch (this.beneficiaryEnum[$event]) {
            case this.beneficiaryEnum.CHARITY:
                this.beneficiaryAddForm = this.CHARITY_TYPE_FORM;
                this.beneficiaryAddForm.reset({ beneficiaryType: "CHARITY" });
                break;
            case this.beneficiaryEnum.TRUST:
                this.beneficiaryAddForm = this.TRUST_TYPE_FORM;
                this.beneficiaryAddForm.reset({ beneficiaryType: "TRUST" });
                break;
            case this.beneficiaryEnum.INDIVIDUAL:
                this.beneficiaryAddForm = this.INDIVIDUAL_TYPE_FORM;
                this.beneficiaryAddForm.reset({
                    beneficiaryType: "INDIVIDUAL",
                    contact: {
                        phoneNumbers: {
                            type: "HOME",
                            isMobile: false,
                        },
                    },
                });
                break;
            default:
        }
        this.createListner();
        this.requiredFields = [];
        this.settingValidations(this.beneficiaryAddForm);
        this.beneficiaryAddForm.controls["beneficiaryType"].patchValue($event);
        this.beneficiaryAddForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((Res) => {
            this.hideErrorAlertMessage();
        });
        form.resetForm(this.beneficiaryAddForm.value);
    }
    getSuffixes(): void {
        this.staticService
            .getSuffixes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (value) => {
                    this.suffixes = value;
                },
                (error) => error,
            );
    }
    getStates(): void {
        this.staticSubscriber = this.staticService.getStates().subscribe(
            (value) => {
                this.states = value;
            },
            (error) => error,
        );
    }

    /**
     * Save beneficiary details.
     */
    save(): void {
        if (this.beneficiaryAddForm.valid) {
            this.isLoading = true;
            this.beneficiaryObj = this.beneficiaryAddForm.getRawValue();
            this.beneficiaryObj.ssn = this.unmaskedSSNValue;
            const skipAddressValidation: boolean = this.currentBeneficiaryType !== this.beneficiaryEnum.INDIVIDUAL;
            const beneObject: Beneficiary = {
                type: this.beneficiaryObj.beneficiaryType,
            };
            this.setBeneficiaryAddress(beneObject);
            this.setBeneficiaryInfo(beneObject);
            (
                (skipAddressValidation && of(beneObject.contact.address)) ||
                this.staticUtilService
                    .cacheConfigEnabled(AddressConfig.ADDRESS_VALIDATION)
                    .pipe(switchMap((addressValidationEnabled) => this.verifyAddress(addressValidationEnabled, beneObject)))
            )
                .pipe(
                    filter<Address>(Boolean),
                    switchMap((address) => {
                        this.isLoading = true;
                        return this.memberService.createMemberBeneficiary(this.memberId, this.MpGroup, {
                            ...beneObject,
                            contact: { ...beneObject.contact, address },
                            name:
                                this.currentBeneficiaryType === this.beneficiaryEnum.TRUST
                                    ? this.beneficiaryObj.trustName
                                    : beneObject.name,
                        });
                    }),
                    tap(() => this.dialogRef.close(SUBMIT)),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return of(null);
                    }),
                    finalize(() => (this.isLoading = false)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Verify beneficiary's address.
     * @param addressValidationEnabled address validation config status
     * @param beneObject beneficiary to be saved
     * @returns observable of Address
     */
    verifyAddress(addressValidationEnabled: boolean, beneObject: Beneficiary): Observable<Address> {
        return iif(
            () => addressValidationEnabled,
            this.memberService.verifyMemberAddress(beneObject.contact.address).pipe(
                switchMap((verifiedAddress) =>
                    iif(
                        () => verifiedAddress && verifiedAddress.matched,
                        of(beneObject.contact.address),
                        defer(() => {
                            this.isLoading = false;
                            return this.membersBusinessService.confirmAddress(
                                this.modalService,
                                this.language,
                                beneObject.contact.address,
                                verifiedAddress,
                            );
                        }),
                    ),
                ),
                catchError((error) => {
                    this.isLoading = false;
                    return this.membersBusinessService.confirmAddress(
                        this.modalService,
                        this.language,
                        beneObject.contact.address,
                        null,
                        error,
                    );
                }),
            ),
            of(beneObject.contact.address),
        );
    }

    /**
     * Set beneficiary address.
     * @param beneObject beneficiary to be saved
     */
    setBeneficiaryAddress(beneObject: Beneficiary): void {
        if (this.beneficiaryObj.homeAddressSameAsEmployee) {
            beneObject.contact = {
                address: this.memberAddress.address,
            };
        } else if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
            beneObject.contact = {
                address: this.beneficiaryObj.contact.address,
            };
        } else {
            beneObject.contact = {
                address: {
                    state: this.beneficiaryObj.contact.address.state,
                    zip: this.beneficiaryObj.contact.address.zip,
                },
            };
        }
    }

    /**
     * Set various beneficiary properties.
     * @param beneObject beneficiary to be saved
     */
    setBeneficiaryInfo(beneObject: Beneficiary): void {
        if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
            if (this.beneficiaryObj.birthDate) {
                beneObject.birthDate = this.dateFormatter(this.beneficiaryObj.birthDate);
            }
            if (this.beneficiaryObj.gender) {
                beneObject.gender = this.beneficiaryObj.gender;
            }
            beneObject.name = {
                firstName: this.beneficiaryObj.name.firstName.trim(),
                lastName: this.beneficiaryObj.name.lastName.trim(),
                middleName: this.beneficiaryObj.name.middleName,
                suffix: this.beneficiaryObj.name.suffix,
                maidenName: this.beneficiaryObj.name.maidenName,
            };
            beneObject.relationshipToMember = this.beneficiaryObj.relationshipToMember;
            if (this.beneficiaryObj.ssn) {
                beneObject.ssn = this.beneficiaryObj.ssn;
            }
            if (this.beneficiaryObj.relationshipToMember) {
                beneObject.relationshipToMember = this.beneficiaryObj.relationshipToMember;
            }
            if (this.beneficiaryObj.details) {
                beneObject.details = this.beneficiaryObj.details;
            }
            this.beneficiaryContactDetails(beneObject);
        } else if (this.currentBeneficiaryType === this.beneficiaryEnum.TRUST) {
            beneObject.trustAgreementDate = this.dateFormatter(this.beneficiaryObj.trustAgreementDate);
            beneObject.trustee = {
                firstName: this.beneficiaryObj.trustee.firstName,
                lastName: this.beneficiaryObj.trustee.lastName,
                suffix: this.beneficiaryObj.trustee.suffix,
            };
        } else if (this.currentBeneficiaryType === this.beneficiaryEnum.CHARITY) {
            beneObject.name = {
                firstName: this.beneficiaryObj.organizationName,
                lastName: "",
            };
        }
    }

    /**
     * Set beneficiary's contact details.
     * @param beneObject beneficiary to be saved
     */
    beneficiaryContactDetails(beneObject: Beneficiary): void {
        if (this.beneficiaryObj.contact) {
            if (this.beneficiaryObj.contact.emailAddresses) {
                const email = this.beneficiaryObj.contact.emailAddresses as unknown as Email;
                beneObject.contact.emailAddresses =
                    email && email.email
                        ? [
                              {
                                  email: email.email,
                                  type: PERSONAL,
                                  primary: true,
                              },
                          ]
                        : [];
            }
            if (this.beneficiaryObj.contact.phoneNumbers) {
                const phone = this.beneficiaryObj.contact.phoneNumbers as unknown as Phone;
                beneObject.contact.phoneNumbers =
                    phone && phone.phoneNumber
                        ? [
                              {
                                  phoneNumber: phone.phoneNumber,
                                  type: phone.type,
                                  isMobile: phone.isMobile,
                              },
                          ]
                        : [];
            }
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    isSsnOptionField(): void {
        this.ssnOptionalField = !(this.requiredFields.indexOf("ssn") >= 0);
    }

    /**
     * This function is used to check whether the field is optional or not
     */
    isStateOptionField(): void {
        this.stateOptionalField = this.requiredFields.indexOf("state") >= 0;
    }

    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.storeSubscriber) {
            this.storeSubscriber.unsubscribe();
        }
        if (this.staticSubscriber) {
            this.staticSubscriber.unsubscribe();
        }
        if (this.createBeneficiarySubsciber) {
            this.createBeneficiarySubsciber.unsubscribe();
        }
        if (this.getMemberContactSubsciber) {
            this.getMemberContactSubsciber.unsubscribe();
        }
        if (this.getMembeDetailsSubscriber) {
            this.getMembeDetailsSubscriber.unsubscribe();
        }
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * to get ssn config value
     */
    getSSNConfiguration(): void {
        this.isPartiallyMasked = false;
        this.isFullyMasked = false;
        this.isFullyVisible = false;
        this.staticUtilService
            .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((ssnConfig) => {
                if (ssnConfig === PARTIALLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                    this.isPartiallyMasked = true;
                    this.isShowHideButtonVisible = true;
                } else if (ssnConfig === FULLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                    this.isFullyMasked = true;
                } else if (ssnConfig === FULLY_VISIBLE_SSN) {
                    this.isShowHideButtonVisible = false;
                    this.isMaskedTrue = false;
                    this.isFullyVisible = true;
                }
                this.isPartiallyMasked = ssnConfig === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = ssnConfig === SSNMask.FULLY_MASKED;
                this.isFullyVisible = ssnConfig === SSNMask.FULLY_VISIBLE;
            });

        if (this.beneficiaryAddForm.controls.ssn) {
            this.beneficiaryAddForm.controls.ssn.setErrors(null);
            this.beneficiaryAddForm.controls.ssn.clearValidators();
        }
    }
    /**
     * method to do masking and unmasking as per condition
     * executes while blur and click of show and hide link
     * @param isMasked boolean value to check mask
     */
    ssnMaskingToggler(isMasked: boolean): void {
        this.beneficiaryAddForm.controls.ssn.clearValidators();
        this.beneficiaryAddForm.controls.ssn.setValidators(Validators.pattern(this.validationRegex.UNMASKSSN_ITIN));
        if (!this.beneficiaryAddForm.controls.ssn.value) {
            this.unmaskedSSNValue = "";
        }
        if (!this.isFullyVisible && this.beneficiaryAddForm.controls.ssn.valid) {
            if (isMasked) {
                this.unmaskedSSNValue = (this.unmaskedSSNValue || "").replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.isMaskedTrue = false;
                this.beneficiaryAddForm.controls.ssn.setValue(this.unmaskedSSNValue);
                this.beneficiaryAddForm.controls.ssn.clearValidators();
                this.beneficiaryAddForm
                    .get("ssn")
                    .setValidators([Validators.minLength(SSN_MAX_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)]);
                this.beneficiaryAddForm.controls.ssn.markAsTouched({ onlySelf: true });
                this.beneficiaryAddForm.controls.ssn.updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.ssnMaxLength = SSN_MAX_LENGTH;
                this.beneficiaryAddForm.controls.ssn.setValue(this.maskedSSNValue);
                this.beneficiaryAddForm.controls.ssn.setErrors(null);
                this.beneficiaryAddForm.controls.ssn.clearValidators();
                this.beneficiaryAddForm.controls.ssn.updateValueAndValidity();
            }
        }
        this.isSSNValue = Boolean(this.INDIVIDUAL_TYPE_FORM.controls.ssn.value);
    }
    /**
     * method to detect changes on keyup in order to hide button on deleting value from ssn field
     */
    onSSNValueChange(): void {
        this.isSSNValue = Boolean(this.INDIVIDUAL_TYPE_FORM.controls.ssn.value);
        this.INDIVIDUAL_TYPE_FORM.controls.ssn.markAsTouched();
    }

    isOptionalField(key: string): boolean {
        // As include doesn't work in IE11
        return !(this.requiredFields.indexOf(key) >= 0);
    }
    /**
     * Masks SSN, partially/fully
     */
    maskValue(): void {
        const ssnControl = this.beneficiaryAddForm.controls.ssn;
        this.isFullyVisible = ssnControl.valid ? !(this.isPartiallyMasked || this.isFullyMasked) : true;
        if (!this.isFullyMasked && ssnControl.value && ssnControl.valid) {
            let tempMask = "";
            const ssnFormValue = ssnControl.value.replace(/-/g, "");
            const lengthUnmaskedSSN = ssnFormValue.length;
            tempMask = "XXX-XX-" + ssnFormValue.slice(SSN_Mask_Length, lengthUnmaskedSSN);
            this.maskedSSNValue = tempMask;
            this.unmaskedSSNValue = ssnFormValue;
            ssnControl.setValue(this.maskedSSNValue);
            this.isMaskedTrue = true;
            ssnControl.clearValidators();
            ssnControl.updateValueAndValidity();
            ssnControl.setErrors(null);
        } else if (ssnControl.value === "") {
            this.isFullyVisible = true;
        }
    }
}
