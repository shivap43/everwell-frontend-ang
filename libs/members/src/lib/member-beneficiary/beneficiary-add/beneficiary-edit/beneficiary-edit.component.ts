import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from "@angular/core";
import { StaticService, MemberService, HideReadOnlyElementSetting, GenderDetails, SSNMask } from "@empowered/api";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { NgxMaskPipe } from "ngx-mask";

import {
    ConfigName,
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    ClientErrorResponseType,
    BeneficiaryType,
    AppSettings,
    Address,
    ContactType,
    CountryState,
    ContactInfo,
    MemberContact,
} from "@empowered/constants";
import { filter, switchMap, map, takeUntil } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    MemberBeneficiaryListModel,
    MemberBeneficiaryListState,
    SetBeneficiaryId,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { MembersBusinessService } from "@empowered/ui";

const ADDRESS = "address";
const PHONE_GRP_NAME = "phoneNumbers";
const PHONE_NUMBER = "phoneNumber";
const IS_MOBILE = "isMobile";
const ADDRESS_1 = "address1";
const PHONE_NUMBER_FORM_CONTROL = "phonenumber";
const CITY = "city";
const CHECK_BENEFICIARY_NAME = "name";
const VALIDATE_SSN = "SSN";
const ITIN = "ITIN";
const SSN_MAX_LENGTH = 11;
const SSN_Masked_Length = 5;

@Component({
    selector: "empowered-beneficiary-edit",
    templateUrl: "./beneficiary-edit.component.html",
    styleUrls: ["./beneficiary-edit.component.scss"],
    providers: [DatePipe],
})
export class BeneficiaryEditComponent implements OnInit, OnDestroy {
    @Input() beneficiaryObjId: number;
    @Input() beneficiaryObjType: string;
    @Output() done = new EventEmitter<boolean>();
    beneficiaryType: any[];
    initialFormValues: any;
    beneficiaryObj: any;
    isLoading: boolean;
    currentBeneficiaryType: string;
    beneficiaryEnum = BeneficiaryType;
    phoneMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    memberId: number;
    MpGroup: number;
    suffixes: string[];
    genders$: Observable<GenderDetails[]> = this.staticService
        .getGenders()
        .pipe(map((genders: string[]) => this.memberService.refactorGenders(genders)));
    states: CountryState[];
    isSaved: boolean;
    maxDate: Date = new Date();
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    errorMessageArray = [];
    showErrorMessage: boolean;
    errorMessage: string;
    contactInfoTitle: string;
    state: MemberBeneficiaryListModel;
    portal: string;
    validationRegex: any;
    isMemberPortal: boolean;
    relationshipMemberLabel: string;
    HOMEADDRESSSAMEASEMPLOYEE = "homeAddressSameAsEmployee";
    isHomeAddressSameAsEmployee: boolean;
    memberAddress: ContactInfo;
    @Select(MemberBeneficiaryListState) memberState$: Observable<MemberBeneficiaryListModel>;
    @Select(SharedState.regex) regex$: Observable<any>;
    beneficiaryEditForm: FormGroup;
    nameWithHypenApostrophesValidation: RegExp;
    // phone number types
    phoneNumberTypes = [ContactType.HOME, ContactType.WORK];
    invalidSSNValidation: any;
    MAX_LENGTH_ADDRESS = 100;
    MAX_LENGTH_CITY = 100;
    MAX_LENGTH_EMAIL = 60;
    zipMinLength = 5;
    zipMaximumLength = 9;
    memberContactError: string;
    requiredFields = [];
    HIDDEN = "hidden";
    READONLY = "readonly";
    REQUIRED = "required";
    isDateInvalid = false;
    isBirthdateRequired = false;
    isFormValueChange = false;
    onLoadAddressForm: Address;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        beneficiaryType: true,
        firstName: true,
        middleName: true,
        lastName: true,
        maidenName: true,
        suffix: true,
        gender: true,
        birthDate: true,
        ssn: true,
        relationshipToMember: true,
        details: true,
        homeAddressSameAsEmployee: true,
        state: true,
        zip: true,
        organizationName: true,
        taxId: true,
        trustName: true,
        trustAgreementDate: true,
        trusteeFirstName: true,
        trusteeLastName: true,
        trusteeSuffix: true,
        address1: true,
        address2: true,
        city: true,
        email: true,
        phoneNumber: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        beneficiaryType: false,
        firstName: false,
        middleName: false,
        lastName: false,
        suffix: false,
        gender: false,
        birthDate: false,
        ssn: false,
        relationshipToMember: false,
        details: false,
        homeAddressSameAsEmployee: false,
        state: false,
        zip: false,
        organizationName: false,
        taxId: false,
        trustName: false,
        trustAgreementDate: false,
        trusteeFirstName: false,
        trusteeLastName: false,
        trusteeSuffix: false,
        address1: false,
        address2: false,
        city: false,
        email: false,
        phoneNumber: false,
    };
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.common.optional",
        "primary.portal.members.beneficiaryEdit.individualFirstName",
        "primary.portal.members.beneficiaryEdit.individualMiddleName",
        "primary.portal.members.beneficiaryEdit.individualLastName",
        "primary.portal.members.beneficiaryEdit.individualMaidenName",
        "primary.portal.members.beneficiaryEdit.individualBirthDate",
        "primary.portal.members.beneficiaryEdit.individualSSN",
        "primary.portal.members.beneficiaryEdit.individualRelationToEmp",
        "primary.portal.members.beneficiaryEdit.individualDetail",
        "primary.portal.members.beneficiaryEdit.organizationName",
        "primary.portal.members.beneficiaryEdit.organizationTaxID",
        "primary.portal.members.beneficiaryEdit.organizationDetail",
        "primary.portal.members.beneficiaryEdit.trustName",
        "primary.portal.members.beneficiaryEdit.trustAgreementDate",
        "primary.portal.members.beneficiaryEdit.trustFirstName",
        "primary.portal.members.beneficiaryEdit.trustLastName",
        "primary.portal.members.beneficiaryEdit.trustDetails",
        "primary.portal.members.beneficiaryEdit.streetAddress1",
        "primary.portal.members.beneficiaryEdit.streetAddress2",
        "primary.portal.members.beneficiaryEdit.city",
        "primary.portal.members.beneficiaryEdit.zip",
        "primary.portal.members.beneficiaryEdit.contactEmail",
        "primary.portal.members.beneficiaryEdit.contactPhone",
        "primary.portal.members.beneficiaryEdit.ariaUndoChanges",
        "primary.portal.members.beneficiaryEdit.ariaSave",
        "primary.portal.members.beneficiaryEdit.ariaSaved",
        "primary.portal.members.beneficiaryEdit.individualTitle",
        "primary.portal.members.beneficiaryEdit.organizationTitle",
        "primary.portal.members.beneficiaryEdit.trustTitle",
        "primary.portal.common.back",
        "primary.portal.common.undoChanges",
        "primary.portal.common.save",
        "primary.portal.common.saved",
        "primary.portal.common.show",
        "primary.portal.common.hide",
        "primary.portal.members.beneficiaryAdd.completeAddress",
        "primary.portal.members.api.ssn.duplicate.nonMmp",
        "primary.portal.member.ssn_itin",
    ]);

    INDIVIDUAL_EDIT_FORM: FormGroup;
    CHARITY_EDIT_FORM: FormGroup;
    TRUST_EDIT_FORM: FormGroup;
    customPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnMaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnUnmaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: null }, 0: { pattern: new RegExp("\\d") } };
    isMaskedTrue: boolean;
    isShowHideButtonVisible: boolean;
    isSSNValue: boolean;
    samePrimaryAddressLabel: string;
    incompleteAddress = false;
    empFirstName: string;
    ssnMaxLength = SSN_MAX_LENGTH;
    unmaskedSSNValue: string;
    maskedSSNValue: string;
    isFullyVisible = false;
    isFullyMasked = false;
    isPartiallyMasked = false;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly modalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {
        this.beneficiaryType = Object.keys(BeneficiaryType).map((key) => ({
            value: BeneficiaryType[key],
            name: key,
        }));
        this.memberId = this.store.selectSnapshot(MemberBeneficiaryListState.memberId);
        this.MpGroup = this.store.selectSnapshot(MemberBeneficiaryListState.groupId);
        this.isSaved = false;

        this.hideErrorAlertMessage();
    }

    /**
     * Initialize configurations and load data upon which this component depends.
     * Populate form fields and set up form validation.
     */
    ngOnInit(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
                this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
                this.invalidSSNValidation = new RegExp(this.validationRegex.INVALID_SSN);
            }
        });

        this.isLoading = true;
        this.currentBeneficiaryType = this.beneficiaryEnum[this.beneficiaryObjType];
        this.checkUserType();
        this.getRelationShipMemberLabel();
        this.intializeForm();
        this.bindFormGroup();
        this.getMemberBeneficiary();
        this.isHomeAddressSameAsEmployee = false;
        this.getStates();
        this.getSuffixes();
        this.getSSNConfiguration();
        this.store.dispatch(new SetBeneficiaryId(this.beneficiaryObjId));
        this.isDateInvalid = true;
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
                if (ssnConfig === "PARTIALLY_MASKED") {
                    this.isMaskedTrue = true;
                    this.isShowHideButtonVisible = true;
                    this.isPartiallyMasked = true;
                } else if (ssnConfig === "FULLY_MASKED") {
                    this.isMaskedTrue = true;
                    this.isFullyMasked = true;
                } else if (ssnConfig === "FULLY_VISIBLE") {
                    this.isShowHideButtonVisible = false;
                    this.isMaskedTrue = false;
                    this.isFullyVisible = true;
                }
                this.isPartiallyMasked = ssnConfig === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = ssnConfig === SSNMask.FULLY_MASKED;
                this.isFullyVisible = ssnConfig === SSNMask.FULLY_VISIBLE;
            });
        if (this.INDIVIDUAL_EDIT_FORM.controls.ssn) {
            this.INDIVIDUAL_EDIT_FORM.controls.ssn.setErrors(null);
            this.INDIVIDUAL_EDIT_FORM.controls.ssn.clearValidators();
        }
    }
    /**
     * method to do masking and unmasking as per condition
     * executes while blur and click of show and hide link
     * @param isMasked boolean value to check mask
     */
    ssnMaskingToggler(isMasked: boolean): void {
        this.INDIVIDUAL_EDIT_FORM.controls.ssn.clearValidators();
        this.INDIVIDUAL_EDIT_FORM.controls.ssn.setValidators(Validators.pattern(this.validationRegex.UNMASKSSN_ITIN));
        if (!this.INDIVIDUAL_EDIT_FORM.controls.ssn.value) {
            this.unmaskedSSNValue = "";
        }
        if (!this.isFullyVisible && this.INDIVIDUAL_EDIT_FORM.controls.ssn.valid) {
            if (isMasked) {
                this.unmaskedSSNValue = (this.unmaskedSSNValue || "").replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.isMaskedTrue = false;
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.setValue(this.unmaskedSSNValue);
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.clearValidators();
                this.INDIVIDUAL_EDIT_FORM.get("ssn").setValidators([
                    Validators.minLength(SSN_MAX_LENGTH),
                    Validators.pattern(this.validationRegex.UNMASKSSN_ITIN),
                ]);
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.markAsTouched({ onlySelf: true });
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.ssnMaxLength = SSN_MAX_LENGTH;
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.setValue(this.maskedSSNValue);
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.setErrors(null);
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.clearValidators();
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.updateValueAndValidity();
            }
        }
        this.isSSNValue = Boolean(this.INDIVIDUAL_EDIT_FORM.controls.ssn.value);
        this.customPattern = isMasked || !this.beneficiaryEditForm.controls.ssn?.valid ? this.ssnUnmaskedPattern : this.ssnMaskedPattern;
        this.isMaskedTrue = !(isMasked || !this.beneficiaryEditForm.controls.ssn?.valid);
    }
    /**
     * method to detect changes om keyup in order to hide button on deletng value from ssn field
     */
    onSSNValueChange(): void {
        this.isSSNValue = Boolean(this.beneficiaryEditForm.controls.ssn.value);
    }

    /**
     * initializing form
     */
    intializeForm(): void {
        const UPDATE_ON_CHANGE = { updateOn: "change" };
        this.INDIVIDUAL_EDIT_FORM = this.fb.group({
            type: ["", { updateOn: "blur" }],
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
            gender: ["", { updateOn: "blur" }],
            ssn: ["", { validators: Validators.pattern(new RegExp(this.validationRegex.UNMASKSSN_ITIN)) }],
            birthDate: ["", { updateOn: "blur" }],
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
        this.enableCellTypeCheck();
        this.CHARITY_EDIT_FORM = this.fb.group(
            {
                type: [""],
                organizationName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                details: [""],
                taxId: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.TAXID))])],
                contact: this.fb.group({
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
                                Validators.pattern(new RegExp(this.validationRegex.CITY)),
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
                }),
            },
            { updateOn: "blur" },
        );
        this.TRUST_EDIT_FORM = this.fb.group(
            {
                type: [""],
                trustName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                trustAgreementDate: [""],
                details: [""],
                trustee: this.fb.group({
                    firstName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                    lastName: ["", Validators.compose([Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED))])],
                    suffix: [""],
                }),
                contact: this.fb.group({
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
                                Validators.pattern(new RegExp(this.validationRegex.CITY)),
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
                }),
            },
            { updateOn: "blur" },
        );
    }

    /**
     * Enable the cell type checkbox if user enters valid phone number on phone field.
     * @returns void
     */
    enableCellTypeCheck(): void {
        const phoneNumberCtrl = this.INDIVIDUAL_EDIT_FORM.controls.contact.get(PHONE_GRP_NAME);
        phoneNumberCtrl
            .get(PHONE_NUMBER)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((phoneNumber) => {
                if (phoneNumber && phoneNumberCtrl.get(PHONE_NUMBER).valid) {
                    phoneNumberCtrl.get(IS_MOBILE).enable();
                } else {
                    phoneNumberCtrl.get(IS_MOBILE).patchValue(false);
                    phoneNumberCtrl.get(IS_MOBILE).disable();
                }
            });
    }

    /**
     *
     * @param event zip text field keyboard event
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }

    /**
     * Get the details of beneficiary.
     * @returns void
     */
    getMemberBeneficiary(): void {
        this.memberService
            .getMemberBeneficiary(this.memberId, this.MpGroup, this.beneficiaryObjId, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.beneficiaryObj = data;
                    this.getMemberAddress();
                    this.getContactInfoTitle();
                    this.beneficiaryEditForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((Res) => {
                        this.hideErrorAlertMessage();
                        this.isSaved = false;
                    });
                },
                (Error) => {
                    this.isLoading = false;
                    this.showErrorAlertMessage(Error);
                },
            );
    }

    dateFormatter(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }

    getContactInfoTitle(): void {
        if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
            this.contactInfoTitle = this.language.fetchPrimaryLanguageValue(
                "primary.portal.members.beneficiaryEdit.individualContactInfoTitle",
            );
        } else if (this.currentBeneficiaryType === this.beneficiaryEnum.CHARITY) {
            this.contactInfoTitle = this.language.fetchPrimaryLanguageValue(
                "primary.portal.members.beneficiaryEdit.charityContactInfoTitle",
            );
        } else if (this.currentBeneficiaryType === this.beneficiaryEnum.TRUST) {
            this.contactInfoTitle = this.language.fetchPrimaryLanguageValue("primary.portal.members.beneficiaryEdit.trustContactInfoTitle");
        }
    }
    checkUserType(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
    }
    configureBeneficiary(object: unknown): void {
        Object.keys(object).forEach((key) => {
            if (object[key] instanceof Object) {
                this.configureBeneficiary(object[key]);
            } else if (!object[key] && object[key] !== false) {
                object[key] = null;
            }
        });
    }

    /**
     * Update the address as employee address.
     * @param isEmpAddress: true, if user selects employee address checkbox.
     * @returns void.
     */
    onEmpAddressChange(isEmpAddress: boolean): void {
        if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
            this.isHomeAddressSameAsEmployee = isEmpAddress;
            this.populateEmployeeAddress();
        }
    }

    /**
     * Populate the beneficiary address same as employee address
     * @returns void
     */
    populateEmployeeAddress(): void {
        this.beneficiaryEditForm.controls.contact.get(ADDRESS).reset();
        if (this.isHomeAddressSameAsEmployee) {
            this.beneficiaryEditForm.controls.contact.get(ADDRESS).disable();
            this.setMemberAddressToBeneficiary(this.memberAddress);
        } else {
            this.beneficiaryEditForm.controls.contact.get(ADDRESS).enable();
            this.beneficiaryEditForm.controls.contact.get(ADDRESS).reset();
        }
    }

    /**
     * Update the beneficiary address same as member address
     * @param contactDetails: Member contact details
     * @returns void
     */
    setMemberAddressToBeneficiary(contactDetails: ContactInfo): void {
        if (contactDetails) {
            this.beneficiaryEditForm.patchValue({
                contact: {
                    address: contactDetails.address,
                },
            });
        } else {
            this.beneficiaryEditForm.patchValue({
                homeAddressSameAsEmployee: false,
            });
        }
    }
    /**
     * This method is used to assign relationship to member label value
     */
    getRelationShipMemberLabel(): void {
        this.memberService
            .getMember(this.memberId, false, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    const memberDetails = response.body;
                    if (memberDetails && memberDetails.name) {
                        this.empFirstName = memberDetails.name.firstName;
                        this.relationshipMemberLabel = this.language
                            .fetchPrimaryLanguageValue("primary.portal.members.beneficiaryEdit.individualRelationToEmpName")
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
     * To check if address is complete or not, if not then disable the form control and provide hint to user
     * @param memberAddress Member address of type Contact Info
     */
    checkCompleteAddress(memberAddress: ContactInfo): void {
        const memAddress = memberAddress.address;
        if (!(memAddress.address1 && memAddress.city && memAddress.state && memAddress.zip)) {
            this.beneficiaryEditForm.controls[this.HOMEADDRESSSAMEASEMPLOYEE]?.disable();
            this.beneficiaryObj.homeAddressSameAsEmployee = false;
            this.incompleteAddress = true;
        }
    }

    /**
     * Get the member details.
     * @returns void
     */
    getMemberAddress(): void {
        this.memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (address: MemberContact) => {
                    this.memberAddress = address["body"];
                    this.checkCompleteAddress(this.memberAddress);
                    const isBothAddressSame = this.compareAddresses(this.memberAddress, this.beneficiaryObj.contact);
                    this.beneficiaryObj.homeAddressSameAsEmployee = isBothAddressSame;
                    this.bindValuesToControls();
                    if (isBothAddressSame) {
                        this.beneficiaryEditForm.controls.contact.get(ADDRESS).disable();
                    }
                    this.beneficiaryEditForm.patchValue({
                        homeAddressSameAsEmployee: isBothAddressSame,
                    });
                    this.isLoading = false;
                },
                (err) => {
                    this.memberContactError = this.language.fetchPrimaryLanguageValue(
                        "primary.portal.members.beneficiary.memberContactLoadError",
                    );
                    this.isLoading = false;
                },
            );
    }
    compareAddresses(memberAddress: ContactInfo, beneficaryAddress: ContactInfo): boolean {
        const memberAddr = memberAddress.address;
        const beneficaryAddr = beneficaryAddress.address;
        const keys = new Set(Object.keys(beneficaryAddr).concat(Object.keys(memberAddr)));
        const COUNTRY = "country";
        const COUNTYID = "countyId";
        let flag = true;
        keys.forEach((key) => {
            // TODO We are not comaparing country and countyid in beneficiary
            if (!(key === COUNTRY || key === COUNTYID)) {
                if ((!memberAddr[key] && !!beneficaryAddr[key]) || (!beneficaryAddr[key] && !!memberAddr[key])) {
                    flag = false;
                } else if (memberAddr[key] && beneficaryAddr[key] && memberAddr[key] !== beneficaryAddr[key]) {
                    flag = false;
                }
            }
        });
        return flag;
    }

    /**
     * Saves beneficiary info
     */
    saveBeneficiary(): void {
        if (this.beneficiaryEditForm.valid && !this.isSaved) {
            this.beneficiaryObj = this.beneficiaryEditForm.getRawValue();
            this.beneficiaryObj.ssn = this.unmaskedSSNValue;
            this.configureBeneficiary(this.beneficiaryObj);
            let isAddressChanged = false;
            if (this.onLoadAddressForm !== this.beneficiaryEditForm.controls.contact.get(ADDRESS).value) {
                isAddressChanged = true;
            }
            const skipAddressValidation: boolean = this.currentBeneficiaryType !== this.beneficiaryEnum.INDIVIDUAL || !isAddressChanged;
            if (this.currentBeneficiaryType === this.beneficiaryEnum.CHARITY) {
                this.beneficiaryObj.name = this.beneficiaryObj.organizationName;
            } else if (this.currentBeneficiaryType === this.beneficiaryEnum.TRUST) {
                this.beneficiaryObj.name = this.beneficiaryObj.trustName;
                if (this.beneficiaryObj.trustAgreementDate) {
                    this.beneficiaryObj.trustAgreementDate = this.dateFormatter(this.beneficiaryObj.trustAgreementDate);
                }
            }

            this.beneficiaryObj.contact["emailAddresses"] = this.beneficiaryObj.contact.emailAddresses.email
                ? [
                      {
                          email: this.beneficiaryObj.contact.emailAddresses.email,
                          type: "PERSONAL",
                      },
                  ]
                : [];
            const phone = this.beneficiaryObj.contact.phoneNumbers;
            this.beneficiaryObj.contact["phoneNumbers"] = phone.phoneNumber
                ? [
                      {
                          phoneNumber: phone.phoneNumber,
                          type: phone.type,
                          isMobile: phone.isMobile ? phone.isMobile : false,
                      },
                  ]
                : [];

            if (this.currentBeneficiaryType === this.beneficiaryEnum.INDIVIDUAL) {
                if (this.beneficiaryObj.birthDate) {
                    this.beneficiaryObj.birthDate = this.dateFormatter(this.beneficiaryObj.birthDate);
                }
                if (this.beneficiaryObj.homeAddressSameAsEmployee) {
                    this.beneficiaryObj.contact["address"] = {
                        address1: this.memberAddress.address.address1,
                        address2: this.memberAddress.address.address2,
                        city: this.memberAddress.address.city,
                        state: this.memberAddress.address.state,
                        zip: this.memberAddress.address.zip,
                    };
                } else {
                    this.beneficiaryObj.contact["address"] = {
                        address1: this.beneficiaryObj.contact.address.address1,
                        address2: this.beneficiaryObj.contact.address.address2,
                        city: this.beneficiaryObj.contact.address.city,
                        state: this.beneficiaryObj.contact.address.state,
                        zip: this.beneficiaryObj.contact.address.zip,
                    };
                }
                this.configureBeneficiary(this.beneficiaryObj.contact);
            }
            this.membersBusinessService
                .verifyAddress(
                    this.beneficiaryObj.contact.address,
                    this.memberService,
                    this.modalService,
                    this.language,
                    this.staticUtilService,
                    skipAddressValidation,
                )
                .pipe(
                    filter(Boolean),
                    switchMap((address) =>
                        this.memberService.updateMemberBeneficiary(
                            this.memberId,
                            this.MpGroup,
                            this.store.selectSnapshot(MemberBeneficiaryListState.memberBeneficiaryId),
                            {
                                ...this.beneficiaryObj,
                                contact: { ...this.beneficiaryObj.contact, address },
                            },
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (Response) => {
                        this.setIntialValues();
                        this.beneficiaryEditForm.reset();
                        this.beneficiaryEditForm.patchValue(this.initialFormValues);
                        this.beneficiaryEditForm.markAsPristine();
                        this.isFormValueChange = false;
                        this.onLoadAddressForm = this.beneficiaryEditForm.controls.contact.get(ADDRESS).value;
                        this.maskValue();
                        this.ssnMaskingToggler(false);
                        this.isSaved = true;
                    },
                    (Error) => {
                        if (
                            Error.status === AppSettings.API_RESP_409 &&
                            Error.error.code === AppSettings.DUPLICATE &&
                            Error.error.details &&
                            Error.error.details.some((detail) => detail.field === "ssn")
                        ) {
                            this.errorMessage = this.languageStrings["primary.portal.members.api.ssn.duplicate.nonMmp"];
                            this.showErrorMessage = true;
                        } else {
                            this.showErrorAlertMessage(Error);
                        }
                    },
                );
        }
    }
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }

    /**
     * This method is called when there will be duplicate beneficiary's name error
     * @returns beneficiary's name in the form of string
     */
    getBeneficiaryName(): string {
        if (this.INDIVIDUAL_EDIT_FORM.controls.name.value.firstName) {
            return `${this.INDIVIDUAL_EDIT_FORM.controls.name.value.firstName} ${this.INDIVIDUAL_EDIT_FORM.controls.name.value.lastName}`;
        }
        if (this.TRUST_EDIT_FORM.value) {
            return this.TRUST_EDIT_FORM.controls.trustName.value;
        }
        return "";
    }

    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length) {
            if (error.details[0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                this.errorMessage = this.language.fetchPrimaryLanguageValue(error.details[0].message);
            } else if (
                error.details[0].code === ClientErrorResponseType.DUPLICATE &&
                error.details[0].field.toLowerCase() === CHECK_BENEFICIARY_NAME
            ) {
                this.errorMessage = this.language
                    .fetchSecondaryLanguageValue("secondary.portal.members.api.duplicate.beneficiary")
                    .replace("#beneficiaryname", this.getBeneficiaryName());
            } else if (
                error.details[0].code === ClientErrorResponseType.DUPLICATE &&
                error.details[0].field.toUpperCase() === VALIDATE_SSN
            ) {
                this.showErrorMessage = false;
                this.INDIVIDUAL_EDIT_FORM.controls.ssn.setErrors({ duplicate: true });
            } else {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.members.api.${error.details[0].status} ${error.details[0].code} ${error.details[0].field}`,
                );
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.DUPLICATE) {
            if (error.details && error.details.some((detail) => detail.field.toUpperCase() === VALIDATE_SSN)) {
                this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.members.api.ssn.duplicate.nonMmp");
            } else if (error.details && error.details.some((detail) => detail.field.toUpperCase() === ITIN)) {
                this.errorMessage = this.language
                    .fetchPrimaryLanguageValue("primary.portal.members.api.ssn_itin.duplicate.nonMmp")
                    .replace("##identifier##", ITIN);
            } else {
                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.members.api.duplicate.beneficiary");
            }
        } else if (error.code === AppSettings.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                "secondary.portal.members.api." + error.status + "." + error.code,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
        }
    }
    cancelBeneficiary(): void {
        this.done.emit(true);
    }
    getStates(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (value) => {
                    this.states = value;
                },
                (error) => error,
            );
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

    /**
     * Method used to set the initial values of the form fields
     */
    setIntialValues(): void {
        this.initialFormValues = this.utilService.copy(this.beneficiaryObj);
        this.initialFormValues["organizationName"] = this.beneficiaryObj.name;
        this.initialFormValues["trustName"] = this.beneficiaryObj.name;
        this.initialFormValues["details"] = this.beneficiaryObj.details;
        this.initialFormValues.contact.phoneNumbers =
            this.beneficiaryObj.contact.phoneNumbers.length > 0 ? this.beneficiaryObj.contact.phoneNumbers[0] : "";
        this.initialFormValues.contact.emailAddresses["email"] =
            this.beneficiaryObj.contact.emailAddresses.length > 0 ? this.beneficiaryObj.contact.emailAddresses[0].email : "";
    }
    /**
     * to bind values to form controls and checking for ssn value
     */
    bindValuesToControls(): void {
        this.setIntialValues();
        this.beneficiaryEditForm.patchValue(this.initialFormValues);
        this.isSSNValue = Boolean(this.initialFormValues.ssn);
        this.onLoadAddressForm = this.beneficiaryEditForm.value.contact.address;
        this.maskValue();
        this.ssnMaskingToggler(false);
    }
    bindFormGroup(): void {
        switch (this.beneficiaryEnum[this.beneficiaryObjType]) {
            case this.beneficiaryEnum.INDIVIDUAL:
                this.beneficiaryEditForm = this.INDIVIDUAL_EDIT_FORM;
                break;
            case this.beneficiaryEnum.CHARITY:
                this.beneficiaryEditForm = this.CHARITY_EDIT_FORM;
                break;
            case this.beneficiaryEnum.TRUST:
                this.beneficiaryEditForm = this.TRUST_EDIT_FORM;
                break;
            default:
                this.beneficiaryEditForm = null;
        }
        this.validate();
    }
    validate(): void {
        this.memberState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state: MemberBeneficiaryListModel) => {
            this.state = { ...state };
            if (this.state.configurations && this.state.configurations.payload) {
                this.settingValidations(this.beneficiaryEditForm);
            }
        });
    }
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
                this.requiredFields.push(key);
            }
            this.getValidationForKey(key, this.HIDDEN);
            this.getValidationForKey(key, this.READONLY);
        });
    }
    /**
     * This method is used to make the form field required or optional based on configuration value set in DB
     * @param key: string, form control name
     * @param validationString: string, field type(required, hidden, readonly)
     * @returns boolean, based on flag value we are making the field mandatory or non-mandatory.
     */
    getValidationForKey(key: string, validationString: string): boolean {
        let flag = false;
        this.state.configurations.payload.forEach((element) => {
            const elementName = element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase();
            if (
                this.currentBeneficiaryType === this.beneficiaryEnum.TRUST &&
                (elementName === ADDRESS_1 || elementName === PHONE_NUMBER_FORM_CONTROL || elementName === CITY)
            ) {
                flag = false;
            } else if (elementName === key.toLowerCase() && element.value.toLowerCase() === validationString.toLowerCase()) {
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
    isOptionalField(key: string): boolean {
        // As include doesn't work in IE11
        return !(this.requiredFields.indexOf(key) >= 0);
    }

    setvaluesToConfigurationFields(validationString: string, key: string): void {
        this.hideFieldElementSetting[key] = !(validationString === this.HIDDEN);
        this.readOnlyFieldElementSetting[key] = validationString === this.READONLY;
        if (validationString === this.REQUIRED) {
            this.requiredFields.push(key);
        }
    }

    /**
     * Undo the changes done by user
     * @returns void
     */
    revertForm(): void {
        const addressCtrl = this.beneficiaryEditForm.controls.contact.get(ADDRESS);
        this.isSaved = false;
        this.isFormValueChange = false;
        this.beneficiaryEditForm.reset();
        this.beneficiaryEditForm.patchValue(this.initialFormValues);
        if (this.initialFormValues && this.initialFormValues.homeAddressSameAsEmployee) {
            addressCtrl.disable();
        } else {
            addressCtrl.enable();
        }
        this.beneficiaryEditForm.markAsPristine();
        this.getSSNConfiguration();
        this.beneficiaryEditForm.controls.ssn.clearValidators();
        this.beneficiaryEditForm.controls.ssn.setErrors(null);
        this.maskValue();
        this.ssnMaskingToggler(false);
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
        if ((this.beneficiaryEditForm.get(control).value === null || this.beneficiaryEditForm.get(control).value === "") && event !== "") {
            return this.language.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat");
        }
        if (!this.beneficiaryEditForm.get(control).value && this.isBirthdateRequired) {
            this.beneficiaryEditForm.get(control).setErrors({ required: true });
            return this.language.fetchSecondaryLanguageValue("secondary.portal.members.requiredField");
        }
        if (
            this.dateService.checkIsAfter(
                this.dateService.toDate(this.INDIVIDUAL_EDIT_FORM.controls.birthDate.value || ""),
                this.dateService.toDate(this.maxDate),
            )
        ) {
            return this.language.fetchPrimaryLanguageValue(
                "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate",
            );
        }
        return undefined;
    }

    /**
     * Masks SSN, partially/fully
     */
    maskValue(): void {
        const ssnControl = this.beneficiaryEditForm.controls.ssn;
        this.isFullyVisible = ssnControl?.valid ? !(this.isPartiallyMasked || this.isFullyMasked) : true;
        if (!this.isFullyMasked && ssnControl?.value && ssnControl?.valid) {
            let tempMask = "";
            const ssnFormValue = ssnControl.value.replace(/-/g, "");
            const lengthUnmaskedSSN = ssnFormValue.length;
            tempMask = "XXX-XX-" + ssnFormValue.slice(SSN_Masked_Length, lengthUnmaskedSSN);
            this.maskedSSNValue = tempMask;
            this.unmaskedSSNValue = ssnFormValue;
            ssnControl.setValue(this.maskedSSNValue);
            this.isMaskedTrue = true;
            ssnControl.clearValidators();
            ssnControl.updateValueAndValidity();
            ssnControl.setErrors(null);
        } else if (ssnControl?.value === "") {
            this.isFullyVisible = true;
        }
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
