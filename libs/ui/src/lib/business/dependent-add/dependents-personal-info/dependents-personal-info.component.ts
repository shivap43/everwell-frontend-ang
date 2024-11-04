/* eslint-disable no-underscore-dangle */
import {
    Component,
    OnInit,
    Input,
    OnDestroy,
    EventEmitter,
    Output,
    AfterViewChecked,
    ChangeDetectorRef,
    ElementRef,
    ViewChild,
} from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from "@angular/forms";
import {
    MemberService,
    County,
    AccountService,
    DependentContact,
    StaticService,
    HideReadOnlyElementSetting,
    MemberIdentifierType,
    DependentVerification,
    GenderDetails,
    SSNMask,
} from "@empowered/api";
import { UtilService, StaticUtilService } from "@empowered/ngxs-store";
import { ConfirmationDialogData } from "../../confirmation-dialog/confirmation-dialog.model";
import { Store, Select } from "@ngxs/store";
import { Subscription, Subject, Observable, forkJoin } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { DependentExitDialogComponent } from "../dependent-exit-dialog/dependent-exit-dialog.component";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { NgxMaskPipe } from "ngx-mask";
import { switchMap, filter, takeUntil } from "rxjs/operators";
import { SetActiveDependentId, DependentListState, SharedState, RegexDataType } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    ConfigName,
    SSN_MIN_LENGTH,
    TpiSSOModel,
    BeneficiaryType,
    AppSettings,
    VerificationStatus,
    Address,
    ContactType,
    CountryState,
    TobaccoStatus,
    Vocabulary,
    Relations,
    MemberDependent,
} from "@empowered/constants";

const DEPENDENT_PERSONAL_INFO_TAB_INDEX = 0;
const HEIGHT_CONVERSION_FACTOR = 12;

export interface CustomFields {
    CUSTOM: string;
    CUSTOMER_INFORMATION_FILE_NUMBER: string;
    EMPLOYEE_ID: string;
    SSN: string;
}

interface TobaccoUser {
    name: string;
    value: string;
}
@Component({
    selector: "empowered-dependents-personal-info",
    templateUrl: "./dependents-personal-info.component.html",
    styleUrls: ["./dependents-personal-info.component.scss"],
    providers: [DatePipe],
})
export class DependentsPersonalInfoComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild("zipInput") zipInput: ElementRef;
    @Input() tpiSSODetails: TpiSSOModel;
    title = "dependent";
    suffixes: string[];
    states: CountryState[];
    counties: County[];
    countries: string[];
    heightFeets = AppSettings.HEIGHTINFEET;
    heightInches = AppSettings.HEIGHTININCH;
    ethnicities: string[];
    genders: GenderDetails[];
    relations: Relations[];
    maritalStatuses: string[];
    citizenships: string[];
    languagePreferences: string[];
    tobaccoUsers: TobaccoUser[];
    verificationStatusList = [VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED, VerificationStatus.REJECTED];
    dependentVerificationStatus: DependentVerification;
    statusVerified = "VERIFIED";
    statusUnverified = "UNVERIFIED";
    statusRejected = "REJECTED";
    statusApprove = "APPROVE";
    statusReject = "REJECT";
    isHomeAddressSameAsEmployee = false;
    isStudent: boolean;
    initialAddress: DependentContact;
    emptyAddress: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    contact: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    employeeAddress: Address;
    initialFormValues: MemberDependent;
    personalInfoForm: FormGroup;
    memberId: number;
    MpGroup = 0;
    beneficiaryEnum = BeneficiaryType;
    heightInFeet: number;
    heightInInch: number;
    dependentResponse: MemberDependent = null;
    dependentContact: DependentContact;
    maxDate = new Date();
    previousMinDate = new Date();
    minDate: Date;
    private readonly unsubscribe$ = new Subject<void>();
    memberAddress: DependentContact;
    dependentAddress: DependentContact;
    memberIdentifierTypes: MemberIdentifierType[] = [];
    dependentSsn: string;
    validationConfigurations = [];
    editForm: boolean;
    addForm: boolean;
    checkAlert = false;
    isLoading: boolean;
    navigationFlag: boolean;
    showErrorMessage: boolean;
    errorMessage: string;
    errorMessageArray = [];
    SPOUSE_MIN_AGE = AppSettings.SPOUSE_MIN_AGE;
    CHILD_MAX_AGE = AppSettings.CHILD_MAX_AGE;
    isMemberAndDependentAddressSame: boolean;
    isSaved: boolean;
    customIdFields: CustomFields;
    dependentContactForEdit: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    submitPersonalInfoForm: FormGroup;
    isMaskedTrue: boolean;
    isPartiallyMasked: boolean;
    isFullyMasked: boolean;
    isFullyVisible: boolean;
    maskedSSNReadonly: boolean;
    maskedSSNValue: string;
    unmaskedSSNValue: string;
    maskedSSN: string;
    portal: string;
    isMember: boolean;
    initialCustomIDs = {};
    SSN = "ssn";
    SPOUSE = "spouse";
    CHILD = "child";
    BODY = "body";
    PROFILE = "profile";
    STUDENT = "student";
    FORMVALIDATIONPATH = "portal.member.form.personalInfoForm.*";
    HOMEADDRESSSAMEASEMPLOYEE = "homeAddressSameAsEmployee";
    FORBIDDEN = "forbidden";
    REQUIRED = "required";
    NAME = "name";
    FIRSTNAME = "firstName";
    LASTNAME = "lastName";
    ADDRESS = "address";
    ZIP = "zip";
    COUNTYID = "countyId";
    HIDDEN = "hidden";
    READONLY = "readonly";
    SSNID = "1";
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    BIRTHDATE = "birthDate";
    DISABLED = "disabled";
    CITY = "city";
    ADDRESS1 = "address1";
    nameWithHypenApostrophesValidation: RegExp;
    invalidSSNValidation: RegExp;
    isFormValueChange = false;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        maidenName: true,
        nickname: true,
        homeAddressSameAsEmployee: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        countyId: true,
        country: true,
        birthDate: true,
        gender: true,
        dependentRelationId: true,
        birthState: true,
        heightFeet: true,
        heightInch: true,
        height: true,
        weight: true,
        ethnicity: true,
        maritalStatus: true,
        citizenship: true,
        driversLicenseNumber: true,
        driversLicenseState: true,
        languagePreference: true,
        tobaccoStatus: true,
        medicareEligibility: true,
        dependentOrder: true,
        disabled: true,
        handicapped: true,
        hiddenFromEmployee: true,
        verified: true,
        ineligibleForCoverage: true,
        courtOrdered: true,
        student: true,
        school: true,
        ssn: true,
        verificationStatus: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        id: false,
        firstName: false,
        middleName: false,
        lastName: false,
        suffix: false,
        maidenName: false,
        nickname: false,
        homeAddressSameAsEmployee: false,
        address1: false,
        address2: false,
        city: false,
        state: false,
        zip: false,
        countyId: false,
        country: false,
        birthDate: false,
        gender: false,
        dependentRelationId: false,
        birthState: false,
        heightFeet: false,
        heightInch: false,
        height: false,
        weight: false,
        ethnicity: false,
        maritalStatus: false,
        citizenship: false,
        driversLicenseNumber: false,
        driversLicenseState: false,
        languagePreference: false,
        tobaccoStatus: false,
        medicareEligibility: false,
        dependentOrder: false,
        disabled: false,
        handicapped: false,
        hiddenFromEmployee: false,
        verified: false,
        ineligibleForCoverage: false,
        courtOrdered: false,
        student: false,
        school: false,
        ssn: false,
        verificationStatus: false,
    };
    ssnErrorMessage = "";
    ssnMaxLength = 11;
    ssnMaskedLength = 5;
    zipMinLength = 5;
    zipMaximumLength = 10;
    @Input() routeMemberId: number;
    @Input() routeDependentId: number;
    @Output() updateFirstName: EventEmitter<string> = new EventEmitter();
    @Output() updateLastName: EventEmitter<string> = new EventEmitter();
    @Output() dependentSaved: EventEmitter<boolean> = new EventEmitter();
    allowNavigation: Subject<boolean>;
    isAddress1Mandatory = true;
    isCityMandatory = true;
    langStrings = {};
    requiredFields = [];
    isDateInvalid = false;
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    regexSubscription: Subscription;
    readonly UNKNOWN = "UNKNOWN";
    isTpi = false;
    @Input() tabIndex: number;

    constructor(
        private readonly _memberService: MemberService,
        private readonly _staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly _accountService: AccountService,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly cd: ChangeDetectorRef,
        private readonly languageService: LanguageService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly utilService: UtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.isSaved = false;
        this.saveTpiDependentInfo();
    }

    /**
     * To fetch the language strings from database
     */
    getLanguageStrings(): void {
        const primaryLanguageValues = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.members.dependent.personalInfo.title",
            "primary.portal.common.show",
            "primary.portal.common.hide",
            "primary.portal.members.personalLabel.tobaccoText",
            "primary.portal.members.personalLabel.nonTobaccoText",
            "primary.portal.members.personalLabel.undefinedText",
            "primary.portal.common.placeholderSelect",
            "primary.portal.common.optional",
            "primary.portal.members.dependent.personalInfo.firstName",
            "primary.portal.members.dependent.personalInfo.middleName",
            "primary.portal.members.dependent.personalInfo.lastName",
            "primary.portal.members.dependent.personalInfo.maidenName",
            "primary.portal.members.dependent.personalInfo.nickName",
            "primary.portal.members.dependent.personalInfo.streetAddress1",
            "primary.portal.members.dependent.personalInfo.streetAddress2",
            "primary.portal.members.dependent.personalInfo.city",
            "primary.portal.members.dependent.personalInfo.zip",
            "primary.portal.members.dependent.personalInfo.birthDate",
            "primary.portal.members.dependent.personalInfo.weight",
            "primary.portal.members.dependent.personalInfo.optionYes",
            "primary.portal.members.dependent.personalInfo.ariaUndoChanges",
            "primary.portal.members.dependent.personalInfo.ariaSave",
            "primary.portal.members.dependent.personalInfo.ariaSaved",
            "primary.portal.common.save",
            "primary.portal.common.doNotSave",
            "primary.portal.census.manualEntry.zipErrorMsg",
            "primary.portal.common.select",
        ]);
        const secondaryLanguageValues = this.languageService.fetchSecondaryLanguageValues([
            "secondary.portal.members.dependent.personalInfo.tabChangeMsg",
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.members.requiredField",
        ]);
        this.langStrings = Object.assign([], primaryLanguageValues, secondaryLanguageValues);
    }
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.getLanguageStrings();
        this.isTpi = this.route.snapshot["_routerState"].url.indexOf(AppSettings.TPI) !== -1;
        if (this.isTpi) {
            this.MpGroup = this.tpiSSODetails.user.groupId;
            this.memberId = this.tpiSSODetails.user.memberId;
        } else {
            this.MpGroup = this.store.selectSnapshot(DependentListState.groupId);
            this.memberId = this.store.selectSnapshot(DependentListState.memberId);
        }
        this.isFullyVisible = true;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.getUserType();
        this.checkAlert = true;
        this.isLoading = true;
        this.hideErrorAlertMessage();
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.invalidSSNValidation = new RegExp(this.validationRegex.INVALID_SSN);
        this.initializationCalls();
        this.checkDependentId();
        this.initialAddress = this.emptyAddress;
        this.isDateInvalid = true;
        this.addTobaccoStatus();
        this.staticUtilService
            .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
            .pipe(filter(Boolean), takeUntil(this.unsubscribe$))
            .subscribe((config: SSNMask) => {
                this.isPartiallyMasked = config === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = config === SSNMask.FULLY_MASKED;
                this.isFullyVisible = config === SSNMask.FULLY_VISIBLE;
            });
    }

    /**
     * To check dependent Id
     */
    checkDependentId(): void {
        this.routeDependentId = this.store.selectSnapshot(DependentListState.activeDependentId);
        if (this.routeDependentId) {
            this.isLoading = true;
            this.getMemberDependent();
            this.editForm = true;
            this.dependentSaved.emit(true);
            this.addForm = false;
            this.getDependentContact(this.memberId, this.routeDependentId.toString(), this.MpGroup);
            this.getDependentVerificationStatus();
        } else {
            this.initialFormValues = {} as MemberDependent;
            this.editForm = false;
            this.addForm = true;
            this.configureAddress1AndCity();
        }
    }

    /**
     * Initial method calls
     */
    initializationCalls(): void {
        this.getMemberIdentifierType();
        this.getMemberAddress();
        this.constructFormControls();
        this.getDropdownValuesFromAPI();
        this.createListners();
        this.getConfigurations();
        this.getEmployeeLanguage();
    }

    /**
     * To add tobacco status
     */
    addTobaccoStatus(): void {
        this.tobaccoUsers = [
            {
                name: TobaccoStatus.TOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.tobaccoText"],
            },
            {
                name: TobaccoStatus.NONTOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.nonTobaccoText"],
            },
            {
                name: TobaccoStatus.UNDEFINED,
                value: this.langStrings["primary.portal.members.personalLabel.undefinedText"],
            },
        ];
    }
    /**
     * ng lifecycle hook
     * It will detect the changes
     */
    ngAfterViewChecked(): void {
        this.cd.detectChanges();
    }

    /**
     * To get the user type if its member or not
     */
    getUserType(): void {
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
        } else {
            this.isMember = false;
        }
    }

    /**
     * To change the action to Edit when user clicks on Edit
     */
    changeAddEditAction(): void {
        this.editForm = true;
        this.addForm = false;
    }

    /**
     * To fetch the address of member
     */
    getMemberAddress(): void {
        this._memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (address: DependentContact) => {
                    this.memberAddress = address[this.BODY];
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * To compare the address of member and dependent
     * @param memberAddress Provides the member address
     * @param dependentAddress Provides the dependent address
     */
    compareMemberAndDependentAddress(memberAddress: DependentContact, dependentAddress: DependentContact): boolean {
        const memberAddr = memberAddress.address;
        const dependentAddr = dependentAddress.address;
        const keys = new Set(Object.keys(memberAddr).concat(Object.keys(dependentAddr)));
        let flag = true;
        keys.forEach((key) => {
            if (
                (memberAddr[key] === undefined && dependentAddr[key] !== null) ||
                (dependentAddr[key] === undefined && memberAddr[key] !== null)
            ) {
                flag = false;
            } else if (memberAddr[key] && dependentAddr[key] && memberAddr[key] !== dependentAddr[key]) {
                flag = false;
            }
        });
        return flag;
    }

    /**
     * Initialization of personal form control
     */
    constructFormControls(): void {
        this.personalInfoForm = this.fb.group({
            id: [""],
            name: this.constructNameControl(),
            homeAddressSameAsEmployee: [""],
            address: this.constructAddressControl(),
            birthDate: [""],
            gender: ["", { updateOn: "blur" }],
            dependentRelationId: [""],
            profile: this.constructProfileControl(),
            customID: this.fb.group({}),
            verificationStatus: ["", { updateOn: "blur" }],
            state: [""],
        });
    }

    /**
     * To get custom Id from personal info form
     */
    get customIDAliases(): FormGroup {
        return this.personalInfoForm.get("customID") as FormGroup;
    }

    /**
     * Method to form name control
     * @returns FormGroup
     */
    constructNameControl(): FormGroup {
        return this.fb.group(
            {
                firstName: ["", Validators.compose([Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)])],
                middleName: ["", Validators.pattern(this.validationRegex.MIDDLENAME)],
                lastName: ["", Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
                suffix: [""],
                maidenName: ["", Validators.pattern(this.validationRegex.NAME)],
                nickname: ["", Validators.pattern(this.validationRegex.NAME)],
            },
            { updateOn: "blur" },
        );
    }

    /**
     * Method to form address control
     * @returns FormGroup
     */
    constructAddressControl(): FormGroup {
        return this.fb.group({
            address1: [
                "",
                {
                    validators: Validators.compose([
                        Validators.pattern(this.validationRegex.ADDRESS),
                        Validators.maxLength(AppSettings.MAX_LENGTH_100),
                    ]),
                    updateOn: "blur",
                },
            ],
            address2: [
                "",
                {
                    validators: Validators.compose([
                        Validators.pattern(this.validationRegex.ADDRESS),
                        Validators.maxLength(AppSettings.MAX_LENGTH_100),
                    ]),
                    updateOn: "blur",
                },
            ],
            city: [
                "",
                {
                    validators: Validators.compose([
                        Validators.pattern(this.validationRegex.CITY),
                        Validators.maxLength(AppSettings.MAX_LENGTH_100),
                    ]),
                    updateOn: "blur",
                },
            ],
            state: [""],
            zip: ["", Validators.pattern(this.validationRegex.ZIP_CODE)],
            countyId: ["", { updateOn: "blur" }],
            country: ["", { updateOn: "blur" }],
        });
    }

    /**
     * Method to form profile control
     * @returns FormGroup
     */
    constructProfileControl(): FormGroup {
        return this.fb.group({
            birthState: ["", { updateOn: "blur" }],
            heightFeet: ["", { updateOn: "blur" }],
            heightInch: ["", { updateOn: "blur" }],
            height: ["", { updateOn: "blur" }],
            weight: ["", Validators.pattern(this.validationRegex.WEIGHT)],
            ethnicity: ["", { updateOn: "blur" }],
            maritalStatus: ["", { updateOn: "blur" }],
            citizenship: ["", { updateOn: "blur" }],
            driversLicenseNumber: ["", { updateOn: "blur" }],
            driversLicenseState: ["", { updateOn: "blur" }],
            languagePreference: [Vocabulary.ENGLISH, { updateOn: "blur" }],
            tobaccoStatus: ["", { updateOn: "blur" }],
            medicareEligibility: ["", { updateOn: "blur" }],
            dependentOrder: ["", { updateOn: "blur" }],
            disabled: [""],
            handicapped: ["", { updateOn: "blur" }],
            hiddenFromEmployee: ["", { updateOn: "blur" }],
            verified: [VerificationStatus.UNVERIFIED, { updateOn: "blur" }],
            ineligibleForCoverage: ["", { updateOn: "blur" }],
            courtOrdered: ["", { updateOn: "blur" }],
            student: [""],
            school: ["", { updateOn: "blur" }],
        });
    }

    /**
     * Add validations to form controls
     * @param regiForm Form Group
     */
    settingValidations(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (key === this.ADDRESS1 || key === this.CITY) {
                return;
            }
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.REQUIRED)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = false;
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = true;
            }
        });
    }

    /**
     * To add validation configurations to form controls
     * @param key Form control name
     * @param validationString Validation data
     */
    getValidationValueForKey(key: string, validationString: string): boolean {
        let flag = false;
        this.validationConfigurations.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === validationString.toLowerCase()
            ) {
                flag = true;
                this.requiredFields.push(element);
            }
        });
        return flag;
    }

    /**
     * To check if the form controls are mandatory to answer
     * @param control Form control name
     */
    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.personalInfoForm.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    /**
     * To fetch values for drop down list from API
     */
    getDropdownValuesFromAPI(): void {
        // TODO: Need to get these values form common store
        this._staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.states = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._staticService
            .getSuffixes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.suffixes = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._staticService
            .getCountries()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.countries = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._staticService
            .getEthnicities()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.ethnicities = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this.getDropDownValues();
    }

    /**
     * To get the drop down values from API
     */
    getDropDownValues(): void {
        this._staticService
            .getGenders()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.genders = this._memberService.refactorGenders(res);
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._staticService
            .getMaritalStatuses()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.maritalStatuses = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._staticService
            .getUSCitizenshipOptions()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.citizenships = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
        this._accountService
            .getDependentRelations(this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.relations = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * Call getVocabulary API to fetch language preferences
     */
    getEmployeeLanguage(): void {
        this._accountService
            .getVocabularies(this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.languagePreferences = Response;
            });
    }

    /**
     * To pre populate home address
     */
    populateHomeAddress(): void {
        if (this.isHomeAddressSameAsEmployee) {
            if (this.memberAddress) {
                this.getCounties(this.memberAddress.address.state);
            }
            this.personalInfoForm.controls.address.disable();
        } else {
            this.personalInfoForm.controls.address.enable();
            if (this.dependentAddress) {
                this.getCounties(this.dependentAddress.address.state);
            }
        }
    }

    /**
     * To fetch the counties from getCounties API
     * @param stateCode It will give the state code
     */
    getCounties(stateCode: string): void {
        if (stateCode) {
            this.isLoading = true;
            this._staticService
                .getCounties(stateCode)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        this.counties = res;
                        if ((this.editForm || this.addForm) && this.personalInfoForm.controls.homeAddressSameAsEmployee.value) {
                            this.patchMemberAddress();
                        }
                        this.isLoading = false;
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                );
        } else {
            this.counties = [];
        }
    }

    /**
     * To patch the member address
     */
    patchMemberAddress(): void {
        if (this.memberAddress) {
            this.personalInfoForm.patchValue({ address: this.memberAddress.address });
        }
    }

    /**
     * This function will be called on click of save button
     */
    onSubmit(): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        const stateAbbr = this.personalInfoForm.get(this.HOMEADDRESSSAMEASEMPLOYEE).value
            ? this.memberAddress.address.state
            : this.personalInfoForm.value.address.state;
        this.personalInfoForm.get("state").setValue(stateAbbr);
        this.submitPersonalInfoForm = this.personalInfoForm;
        this.customIdFields = this.submitPersonalInfoForm.value.customID;
        delete this.submitPersonalInfoForm.value.customID;
        if (this.submitPersonalInfoForm.valid) {
            this.isLoading = true;
            this.submitPersonalInfoForm.value.name.firstName = this.submitPersonalInfoForm.value.name.firstName.trim();
            this.submitPersonalInfoForm.value.name.lastName = this.submitPersonalInfoForm.value.name.lastName.trim();
            this._memberService.changeFirstName(this.submitPersonalInfoForm.value.name.firstName);
            this._memberService.changeLastName(this.submitPersonalInfoForm.value.name.lastName);
            this.submitPersonalInfoForm.value.profile.height = this.getHeightInInches(
                this.submitPersonalInfoForm.value.profile.heightFeet,
                this.submitPersonalInfoForm.value.profile.heightInch,
            );
            if (this.submitPersonalInfoForm.value.homeAddressSameAsEmployee) {
                this.contact.address = this.memberAddress.address;
            } else {
                this.contact.address = this.submitPersonalInfoForm.value.address;
            }
            this.deleteSubmitFormValues();
            this.submitPersonalInfoForm.value.birthDate = this.dateFormatter(this.submitPersonalInfoForm.value.birthDate);
            this.addDependentForm(returnFlag);
        } else {
            this.validateAllFormFields(this.submitPersonalInfoForm);
            returnFlag.next(false);
        }
        return returnFlag.asObservable();
    }

    /**
     * Delete the values in submit personal info form
     */
    deleteSubmitFormValues(): void {
        delete this.submitPersonalInfoForm.value.homeAddressSameAsEmployee;
        delete this.submitPersonalInfoForm.value.id;
        delete this.submitPersonalInfoForm.value.address;
        delete this.submitPersonalInfoForm.value.verificationStatus;
        Object.keys(this.submitPersonalInfoForm.value.profile).forEach((key) => {
            if (this.submitPersonalInfoForm.value.profile[key] === null || this.submitPersonalInfoForm.value.profile[key] === "") {
                delete this.submitPersonalInfoForm.value.profile[key];
            }
        });
    }

    /**
     * To add or edit dependent form
     * @param returnFlag Subject<boolean>
     */
    addDependentForm(returnFlag: Subject<boolean>): void {
        if (this.addForm) {
            this.createMemberDependent()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((flag) => {
                    returnFlag.next(flag);
                    this.submitPersonalInfoForm.markAsPristine();
                });
        }
    }

    /**
     * To format the date
     * @param date Date as input
     */
    dateFormatter(date: Date): string {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }

    /**
     * To validate the form fields if they are touched
     * @param formGroup Personal info form group
     */
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * To create the member dependent on click of Save
     */
    createMemberDependent(): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        this._memberService
            .createMemberDependent(this.personalInfoForm.value, this.memberId, this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    const dependentId = res.headers
                        .get(AppSettings.API_RESP_HEADER_LOCATION)
                        .substring(res.headers.get(AppSettings.API_RESP_HEADER_LOCATION).lastIndexOf("/") + 1);
                    this.dependentSaved.emit(true);
                    this.initialFormValues = this.utilService.copy(this.personalInfoForm.value);
                    this.routeDependentId = parseInt(dependentId, 10);
                    this.store.dispatch(new SetActiveDependentId(this.routeDependentId));
                    this.changeAddEditAction();
                    this.dependentVerificationStatus = {
                        verificationAction: "",
                        documentIds: [],
                    };
                    this.updateDependentVerificationStatus();
                    this.UpdateDependentContactandCustomeID(this.contact, dependentId)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((flag) => {
                            this.showErrorMessage = false;
                            returnFlag.next(flag);
                            this.showErrorMessage = false;
                            this.isFullyVisible = true;
                        });
                },
                (err) => {
                    this.isLoading = false;
                    this.showErrorAlertMessage(err);
                    returnFlag.next(false);
                },
            );
        return returnFlag.asObservable();
    }

    /**
     * To fetch dependent verification status
     */
    getDependentVerificationStatus(): void {
        this._memberService
            .getDependentVerificationStatus(this.memberId, this.routeDependentId, this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.dependentVerificationStatus = res;
                    if (this.dependentVerificationStatus.verificationStatus.toLowerCase() !== "unspecified") {
                        this.verificationStatusList = this.verificationStatusList.filter((x) => x !== "UNVERIFIED");
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * To update dependent verification status
     */
    updateDependentVerificationStatus(): void {
        if (this.personalInfoForm.value.profile.verified.toLowerCase() === this.statusVerified.toLowerCase()) {
            this.dependentVerificationStatus.verificationAction = this.statusApprove;
        } else if (this.personalInfoForm.value.profile.verified.toLowerCase() === this.statusRejected.toLowerCase()) {
            this.dependentVerificationStatus.verificationAction = this.statusReject;
        }
        if (this.dependentVerificationStatus.verificationStatus) {
            delete this.dependentVerificationStatus.verificationStatus;
        }
        if (this.personalInfoForm.value.profile.verified.toLowerCase() !== this.statusUnverified.toLowerCase()) {
            this._memberService
                .updateDependentVerificationStatus(this.memberId, this.routeDependentId, this.dependentVerificationStatus, this.MpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        if (this.personalInfoForm.value.profile.verified !== this.statusUnverified) {
                            this.verificationStatusList = this.verificationStatusList.filter((x) => x !== this.statusUnverified);
                        }
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                );
        }
    }

    /**
     * To update contact details and customId of the dependent
     * And if isTPI true then close the dialog of add spouse
     * @param contact Contact details of dependent
     * @param dependentId Dependent Id of dependent
     * @returns Observable<boolean> if save dependent api return success
     * response then observable of true else observable of false
     */
    UpdateDependentContactandCustomeID(contact: DependentContact, dependentId: string): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        let ObservableList: Observable<any>[] = [];
        ObservableList.push(this.getSaveDependentContactObserver(contact, dependentId));
        ObservableList = ObservableList.concat(this.getDependentcustomIdsObserver(dependentId));
        forkJoin(ObservableList)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.initialAddress.address = this.utilService.copy(contact.address);
                    this.isLoading = false;
                    returnFlag.next(true);
                    this.isSaved = true;
                    this.isFormValueChange = false;
                    if (this.unmaskedSSNValue) {
                        this.dependentSsn = this.unmaskedSSNValue.replace(/-/g, "");
                    }
                    if (this.isTpi) {
                        this.empoweredModalService.closeDialog();
                        this._memberService.setReinstatementPopupStatus(true);
                    }
                },
                (Error) => {
                    this.isLoading = false;
                    returnFlag.next(false);
                    this.showErrorAlertMessage(Error);
                },
            );
        return returnFlag.asObservable();
    }

    /**
     * To fetch custom id observer of dependent
     * @param dependentId Dependent ID
     */
    getDependentcustomIdsObserver(dependentId: string): Observable<string>[] {
        const ObservableList: Observable<any>[] = [];
        Object.keys(this.customIdFields).forEach((key) => {
            if (key === this.SSN.toUpperCase()) {
                const customId = this.getIdentifierId(key);
                let customIDValueArray = [];
                let customIDValue = null;
                if (key === this.SSN.toUpperCase()) {
                    if (this.customIdFields[key]) {
                        if (this.unmaskedSSNValue) {
                            customIDValueArray = this.matchRegex(this.unmaskedSSNValue);
                        } else {
                            customIDValueArray = this.matchRegex(this.customIdFields[key]);
                        }
                        customIDValue = customIDValueArray.join("-");
                    } else {
                        customIDValue = null;
                    }
                } else {
                    customIDValue = this.customIdFields[key];
                }
                if (customIDValue && customIDValue !== null && customIDValue.replace(/-/g, "") !== this.dependentSsn) {
                    ObservableList.push(
                        this._memberService.saveDependentIdentifier(
                            this.memberId,
                            dependentId,
                            customId,
                            this.MpGroup,
                            customIDValue,
                            true,
                        ),
                    );
                } else if (this.editForm && (customIDValue === "" || customIDValue === null) && this.dependentSsn) {
                    ObservableList.push(
                        this._memberService.deleteDependentIdentifier(
                            this.memberId,
                            this.routeDependentId.toString(),
                            customId,
                            this.MpGroup,
                        ),
                    );
                }
            } else {
                const customId = this.getIdentifierId(key);
                const customIDValue: string = this.customIdFields[key];
                if (customIDValue && customIDValue !== this.initialCustomIDs[key]) {
                    this._memberService
                        .saveDependentIdentifier(this.memberId, dependentId, customId, this.MpGroup, customIDValue)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(
                            (res) => {
                                this.initialCustomIDs[key] = customIDValue;
                                this.isLoading = false;
                            },
                            (err) => {
                                this.showErrorAlertMessage(err);
                                this.isLoading = false;
                            },
                        );
                } else if (this.initialCustomIDs[key] && !customIDValue) {
                    this._memberService
                        .deleteDependentIdentifier(this.memberId, this.routeDependentId.toString(), customId, this.MpGroup)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(
                            (r) => {
                                this.initialCustomIDs[key] = "";
                            },
                            (err) => {
                                this.isLoading = false;
                            },
                        );
                }
            }
        });
        return ObservableList;
    }

    /**
     * Method to check if the string matches the regex
     * @param value - string
     * returns array of matches
     */
    matchRegex(value: string): string[] {
        return value.match(/.{1,3}/g);
    }

    /**
     * To save contact details of dependent
     * @param contact Contact details of dependent
     * @param dependentId Dependent ID
     */
    getSaveDependentContactObserver(contact: DependentContact, dependentId: string): Observable<any> {
        if (contact.address === undefined) {
            contact.address = this.memberAddress.address;
        }
        Object.keys(contact.address).forEach((key) => {
            if (contact.address[key] === "" || contact.address[key] === null) {
                contact.address[key] = null;
            }
        });
        return this._memberService.saveDependentContact(contact, this.memberId, dependentId.toString(), this.MpGroup);
    }

    /**
     * To hide alert messages
     */
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }

    /**
     * To show alert messages
     * @param err Error details
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === AppSettings.API_RESP_400 && error[this.DETAILS].length > 0) {
            if (error[this.DETAILS][0].code === "zip.stateMismatch") {
                this.showMismMtchStateError();
                return;
            }
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    /**
     * To show error on state mismatch
     */
    showMismMtchStateError(): void {
        this.personalInfoForm.get("address").get("zip").setErrors({ mismatch: true });
    }

    /**
     * To fetch data of member dependents
     */
    getMemberDependent(): void {
        this._memberService
            .getMemberDependent(this.routeMemberId, this.routeDependentId, true, this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    const response = res;
                    this._memberService.changeFirstName(res.name.firstName);
                    this._memberService.changeLastName(res.name.lastName);
                    this.getHeightInFeetsAndInches(response.profile.height);
                    response.profile.heightFeet = this.heightInFeet;
                    if (this.heightInInch) {
                        response.profile.heightInch = this.heightInInch;
                    } else {
                        response.profile.heightInch = null;
                    }
                    this.personalInfoForm.patchValue(response);
                    this.dependentResponse = response;
                    this.personalInfoForm.patchValue(this.dependentResponse);
                    this.initialFormValues = this.utilService.copy(this.dependentResponse);
                    if (response.ssn) {
                        this.checkForSSNConfiguration();
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * To get dependent identifier data
     */
    getDependentIdentifier(): void {
        this.memberIdentifierTypes.forEach((element) => {
            if (!(element.type === this.SSN.toUpperCase())) {
                const customId = this.getIdentifierId(element.type);
                this._memberService
                    .getDependentIdentifier(this.memberId, this.routeDependentId.toString(), customId, this.MpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res: string) => {
                            const elementType = element.type;
                            this.customIDAliases.get(elementType).patchValue(res);

                            this.initialCustomIDs[elementType] = res;
                        },
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            }
        });
    }

    /**
     * To get dependent contact
     * @param memberId Member id
     * @param dependentId Dependent id
     * @param mpGroup mpGroup id
     */
    getDependentContact(memberId: number, dependentId: string, mpGroup: number): void {
        this._memberService
            .getDependentContact(this.memberId, dependentId, this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    const response = res;
                    this.dependentContactForEdit = res;
                    this.initialAddress = response;
                    this.dependentAddress = response;
                    this.personalInfoForm.patchValue({ address: this.dependentAddress.address });
                    this.isMemberAndDependentAddressSame = this.compareMemberAndDependentAddress(this.memberAddress, this.dependentAddress);
                    this.getCounties(this.dependentAddress.address.state);
                    this.personalInfoForm.patchValue({
                        homeAddressSameAsEmployee: this.isMemberAndDependentAddressSame,
                    });
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Convert height in inches
     * @param heightInFeet Height in feet
     * @param heightInInch Height in inches
     */
    getHeightInInches(heightInFeet: number, heightInInch: number): number {
        return heightInFeet * HEIGHT_CONVERSION_FACTOR + heightInInch;
    }

    /**
     * Convert height in feet and inches
     * @param height Height of user
     */
    getHeightInFeetsAndInches(height: number): void {
        this.heightInFeet = Math.floor(height / HEIGHT_CONVERSION_FACTOR);
        this.heightInInch = height % HEIGHT_CONVERSION_FACTOR;
    }

    /**
     * To revert form data
     */
    revertForm(): void {
        this.personalInfoForm.reset();
        this.personalInfoForm.patchValue(this.initialFormValues);
        this.personalInfoForm.patchValue({ address: this.initialAddress.address });
        this.personalInfoForm.markAsPristine();
        this.personalInfoForm.patchValue({
            homeAddressSameAsEmployee: this.compareMemberAndDependentAddress(this.memberAddress, this.initialAddress),
        });
        this.getDependentIdentifier();
        this.checkForSSNConfiguration();
        this.isSaved = false;
        this.isFormValueChange = false;
        this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
        this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
    }

    /**
     * To get the birth date of dependent
     */
    checkDependentBirthDate(): void {
        this.maxDate = new Date();
        this.minDate = null;
        const year = this.maxDate.getFullYear();
        const month = this.maxDate.getMonth();
        const day = this.maxDate.getDate();
        const spouseId = this.relations.filter((dep) => dep.relationType.toLowerCase() === this.SPOUSE)[0].id;
        const childId = this.relations.filter((dep) => dep.relationType.toLowerCase() === this.CHILD)[0].id;
        if (this.personalInfoForm.value.dependentRelationId === spouseId) {
            this.maxDate = new Date(year - this.SPOUSE_MIN_AGE, month, day);
        } else if (this.personalInfoForm.value.dependentRelationId === childId) {
            if (this.personalInfoForm.get(this.PROFILE).get(this.DISABLED).value) {
                this.minDate = null;
            } else {
                this.minDate = new Date(year - this.CHILD_MAX_AGE, month, day);
            }
            this.maxDate = new Date();
        }
        this.personalInfoForm.controls[this.BIRTHDATE].markAsTouched();
    }

    /**
     * To fetch member identifier type
     */
    getMemberIdentifierType(): void {
        this._memberService
            .getMemberIdentifierTypes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.memberIdentifierTypes.push(...res);
                    this.memberIdentifierTypes = this.memberIdentifierTypes.filter((x) => x.dependentEligible === true);
                    this.memberIdentifierTypes.forEach((item) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
                        item.type.toLowerCase() === this.SSN.toLowerCase()
                            ? this.customIDAliases.addControl(item.type, this.fb.control("", Validators.pattern(this.validationRegex.SSN)))
                            : this.customIDAliases.addControl(item.type, this.fb.control(""));
                    });
                    if (this.editForm) {
                        this.getDependentIdentifier();
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * To get identifier id
     * @param identifierType Provide identifier type
     */
    getIdentifierId(identifierType: string): number {
        const identifierId = this.memberIdentifierTypes.filter((x) => x.type === identifierType);
        return identifierId[0].id;
    }

    /**
     * To fetch configurations
     */
    getConfigurations(): void {
        this._staticService
            .getConfigurations(this.FORMVALIDATIONPATH, this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.validationConfigurations = res;
                    this.settingValidations(this.personalInfoForm);
                    if (this.addForm) {
                        this.isLoading = false;
                    }
                },
                (err) => {
                    if (this.addForm) {
                        this.isLoading = false;
                    }
                },
            );
    }

    /**
     * This function will open an alert of confirmation dialog
     */
    openAlert(): void {
        if (this.personalInfoForm.dirty) {
            this.checkAlert = false;
            const dialogData: ConfirmationDialogData = {
                title: "",
                content: this.langStrings["secondary.portal.members.dependent.personalInfo.tabChangeMsg"].replace(
                    "#name",
                    `${this.personalInfoForm.get(this.NAME).get(this.FIRSTNAME).value} ${
                        this.personalInfoForm.get(this.NAME).get(this.LASTNAME).value
                    }`,
                ),
                primaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.save"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.doNotSave"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
            };

            this.dialog.open(DependentExitDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }

    /**
     * Action to be taken on confirmation dialog
     * @param isSave If the form is saved or not
     */
    OnConfirmDialogAction(isSave: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (isSave) {
            this.onSubmit()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((flag) => {
                    this.navigationFlag = flag;
                    this.allowNavigation.next(this.navigationFlag);
                    this.allowNavigation.complete();
                });
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }

    /**
     * This function will create listeners
     */
    createListners(): void {
        this.personalInfoForm
            .get(this.PROFILE)
            .get(this.STUDENT)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isStudent = res;
            });

        this.personalInfoForm
            .get(this.HOMEADDRESSSAMEASEMPLOYEE)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isHomeAddressSameAsEmployee = res;
                this.configureAddress1AndCity();
                this.populateHomeAddress();
            });

        this.personalInfoForm
            .get(this.BIRTHDATE)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (this.personalInfoForm.get(this.BIRTHDATE).value) {
                    this.checkDependentBirthDate();
                }
            });

        this.personalInfoForm
            .get(this.NAME)
            .get(this.FIRSTNAME)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.updateFirstName.emit(res);
            });

        this.personalInfoForm
            .get(this.NAME)
            .get(this.LASTNAME)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.updateLastName.emit(res);
            });

        this.personalInfoForm
            .get(this.PROFILE)
            .get(this.DISABLED)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.checkDependentBirthDate();
            });

        this.personalInfoForm
            .get(this.ADDRESS)
            .get(this.ZIP)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (res && !this.personalInfoForm.controls.homeAddressSameAsEmployee.value) {
                    this.personalInfoForm.controls.address.get(this.COUNTYID).enable();
                } else {
                    this.personalInfoForm.controls.address.get(this.COUNTYID).disable();
                }
            });
    }

    /**
     * To configure address and city of user
     */
    configureAddress1AndCity(): void {
        if (!this.isHomeAddressSameAsEmployee) {
            this.getAddressControl(this.ADDRESS1).setValidators(
                Validators.compose([Validators.required, this.getAddressControl(this.ADDRESS1).validator]),
            );
            this.getAddressControl(this.CITY).setValidators(
                Validators.compose([Validators.required, this.getAddressControl(this.CITY).validator]),
            );
        } else {
            this.getAddressControl(this.ADDRESS1).setValidators(
                Validators.compose([Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(AppSettings.MAX_LENGTH_100)]),
            );
            this.getAddressControl(this.CITY).setValidators(
                Validators.compose([Validators.pattern(this.validationRegex.CITY), Validators.maxLength(AppSettings.MAX_LENGTH_100)]),
            );
        }
        this.getAddressControl(this.ADDRESS1).updateValueAndValidity();
        this.getAddressControl(this.CITY).updateValueAndValidity();
        const address1Validator = this.getAddressControl(this.ADDRESS1).validator({} as AbstractControl);
        this.isAddress1Mandatory = address1Validator && address1Validator.required;
        const isCityValidator = this.getAddressControl(this.CITY).validator({} as AbstractControl);
        this.isCityMandatory = isCityValidator && isCityValidator.required;
    }

    /**
     * Address form control
     * @param control Form control
     */
    getAddressControl(control: string): FormControl {
        return this.personalInfoForm.get(this.ADDRESS).get(control) as FormControl;
    }

    /**
     * Toggle for SSN masking
     * @param maskedFlag To check masked ssn or unmasked ssn
     */
    ssnMaskingToggler(maskedFlag: boolean): void {
        if (this.customIDAliases.get(this.SSN.toUpperCase()).valid) {
            this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
        }
        if (!this.isFullyVisible && this.customIDAliases.get(this.SSN.toUpperCase()).valid) {
            if (maskedFlag) {
                this.isMaskedTrue = false;
                this.unmaskedSSNValue = this.unmaskedSSNValue.replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.unmaskedSSNValue);
                this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.maskedSSNValue);
                this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
            }
        }
    }

    /**
     * To check SSN configuration
     */
    checkForSSNConfiguration(): void {
        this.isPartiallyMasked = false;
        this.isFullyMasked = false;
        this.isFullyVisible = false;
        this.maskedSSNReadonly = false;
        this._staticService
            .getConfigurations("group.portal.employee.ssn.visibility", this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.isMaskedTrue = true;
                if (Response.length > 0 && Response[0].value === "PARTIALLY_MASKED") {
                    this.isPartiallyMasked = true;
                } else if (Response.length > 0 && Response[0].value === "FULLY_MASKED") {
                    this.isFullyMasked = true;
                } else if (Response.length > 0 && Response[0].value === "FULLY_VISIBLE") {
                    this.isFullyVisible = true;
                    this.isMaskedTrue = false;
                }
            });
        this.getMaskedSSN(true);
        this.getMaskedSSN(false);
        this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
        this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
    }

    /**
     * To set SSN value
     */
    setSSNOnView(): void {
        if (this.isFullyMasked || this.isPartiallyMasked) {
            this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.maskedSSNValue);
            this.maskedSSN = this.maskedSSNValue;
        } else if (this.isFullyVisible) {
            this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.unmaskedSSNValue);
            this.maskedSSN = this.unmaskedSSNValue;
        }
        this.isLoading = false;
    }

    /**
     * Masking of SSN
     */
    maskSSN(): void {
        const unmaskedUserInput = this.customIDAliases.get(this.SSN.toUpperCase()).value;
        if (unmaskedUserInput) {
            this.customIDAliases
                .get(this.SSN.toUpperCase())
                .setValidators([Validators.minLength(SSN_MIN_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN)]);
            this.customIDAliases.get(this.SSN.toUpperCase()).markAsTouched({ onlySelf: true });
            this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
        }
        this.isFullyVisible = !this.customIDAliases.get(this.SSN.toUpperCase()).valid || !(this.isPartiallyMasked || this.isFullyMasked);
        const ssnFormValue = unmaskedUserInput ? unmaskedUserInput.replace(/-/g, "") : "";
        if (ssnFormValue.length === SSN_MIN_LENGTH && !this.isFullyVisible && this.customIDAliases.get(this.SSN.toUpperCase()).valid) {
            let tempMask = "";
            const SsnFormValue = this.customIDAliases.get(this.SSN.toUpperCase()).value.replace(/-/g, "");
            if (SsnFormValue !== this.unmaskedSSNValue) {
                const lengthUnmaskedSSN = SsnFormValue.length;
                tempMask = "XXX-XX-" + SsnFormValue.slice(this.ssnMaskedLength, lengthUnmaskedSSN);
                this.maskedSSNValue = tempMask;
                this.unmaskedSSNValue = SsnFormValue;
                this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.maskedSSNValue);
                this.isMaskedTrue = true;
                this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
                this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
                this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
            }
        } else if (this.customIDAliases.get(this.SSN.toUpperCase()).value === "") {
            this.isFullyVisible = true;
        }
    }

    /**
     * To validate numbers
     * @param event zip text field keyboard event
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }

    /**
     * To fetch masked SSN
     */
    getMaskedSSN(maskingFlag: boolean): void {
        this.isLoading = true;
        this.maskedSSNReadonly = false;
        if (maskingFlag) {
            this.maskedSSNReadonly = true;
        }
        const memberIdentifierTypeSSN = this.memberIdentifierTypes.filter((x) => x.type.toLowerCase() === this.SSN.toLowerCase());
        memberIdentifierTypeSSN.forEach((element) => {
            if (element.type === this.SSN.toUpperCase()) {
                this._memberService
                    .getDependentIdentifier(this.memberId, this.routeDependentId.toString(), element.id, this.MpGroup, maskingFlag)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (data) => {
                            if (maskingFlag) {
                                this.maskedSSNValue = data;
                            } else {
                                this.unmaskedSSNValue = data.replace(/-/g, "");
                                this.dependentSsn = data.replace(/-/g, "");
                            }
                            if (this.maskedSSNValue && this.unmaskedSSNValue) {
                                this.setSSNOnView();
                            }
                        },
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            }
        });
    }

    /**
     * To transform date into mask format
     * @param event Event that occurs on birth date date picker
     */
    transform(event: KeyboardEvent): void {
        const elem = event.target as HTMLInputElement;
        elem.value = this.maskPipe.transform(elem.value, AppSettings.DATE_MASK_FORMAT);
    }

    /**
     * Validate date entered by user
     * @param control Form control
     * @param form FormGroup Name
     * @param event Date picker value
     */
    validateDate(control: string, form: string, event: string): string {
        let language: string;
        if (
            (this.personalInfoForm.controls[control].value === null || this.personalInfoForm.controls[control].value === "") &&
            event !== ""
        ) {
            language = this.langStrings["secondary.portal.common.invalidDateFormat"];
        }
        if (!this.personalInfoForm.controls[control].value) {
            this.personalInfoForm.controls[control].setErrors({ required: true });
            language = this.langStrings["secondary.portal.members.requiredField"];
        }
        return language;
    }
    /**
     * To check the zip code
     * This function is used to validate state and zip code.
     * @returns void
     */
    checkZipCode(): void {
        const value = this.zipInput.nativeElement.value;
        const addressForm = this.personalInfoForm.get("address");
        const zipFormControl = addressForm.get("zip");
        const stateValue = addressForm.get("state").value;
        if ((value.length === this.zipMaximumLength || value.length === this.zipMinLength) && stateValue !== "") {
            this.isLoading = true;
            this._staticService
                .validateStateZip(stateValue, value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.isLoading = false;
                        if (response.status === AppSettings.API_RESP_204) {
                            zipFormControl.setErrors(null);
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                        if (error.status === AppSettings.API_RESP_400) {
                            zipFormControl.setErrors({ zipMismatch: true });
                            zipFormControl.markAsTouched();
                        }
                    },
                );
        }
    }

    /**
     * This method is used to save dependent personal info if user clicks on save in tpi dependent pop-up
     */
    saveTpiDependentInfo(): void {
        this._memberService.isSaveDependentClicked
            .pipe(
                filter(
                    (isSubmitted) =>
                        isSubmitted !== undefined &&
                        isSubmitted !== null &&
                        isSubmitted !== false &&
                        this.tabIndex === DEPENDENT_PERSONAL_INFO_TAB_INDEX,
                ),
                switchMap((isSubmitted) => this.onSubmit()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.checkAlert = false;
        this._memberService.onSubmitDependent(false);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
