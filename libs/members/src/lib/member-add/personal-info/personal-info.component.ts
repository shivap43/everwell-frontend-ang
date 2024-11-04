import { DatePipe, TitleCasePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { Router } from "@angular/router";
import {
    AccountService,
    AflacService,
    BenefitsOfferingService,
    County,
    DriverLicenseState,
    EnrollmentService,
    GenderDetails,
    HideReadOnlyElementSetting,
    MemberIdentifier,
    MemberIdentifierTypeIDs,
    MemberService,
    PreferredLang,
    SSNMask,
    StaticService,
    TobaccoUserOption,
} from "@empowered/api";
import { EmpoweredModalService, SharedService, TPIRestrictionsForHQAccountsService } from "@empowered/common-services";

import {
    Accounts,
    ADDRESS_OPTIONS,
    AddressConfig,
    AppSettings,
    BooleanConst,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ConfigName,
    ContactType,
    DateFormats,
    Enrollments,
    MemberDependent,
    MemberProfile,
    MemberProfileChanges,
    Permission,
    PersonalAddress,
    Portals,
    ProfileChangesConfirmModel,
    Relationship,
    SSN_FORMAT,
    SSN_MIN_LENGTH,
} from "@empowered/constants";
import { DATE_FNS_FORMATS, DateFnsDateAdapter, DateService } from "@empowered/date";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import {
    AccountInfoState,
    AddMemberInfo,
    Member,
    MemberInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import {
    AddressVerificationComponent,
    ConfirmationDialogComponent,
    ConfirmationDialogData,
    ConfirmSsnService,
    CustomValidation,
    DependentAddressUpdateModalComponent,
    ProfileChangesConfirmPromptComponent,
    SsnFormatPipe,
    validateStateAndZipCode,
} from "@empowered/ui";
import { UserService } from "@empowered/user";
import { Select, Store } from "@ngxs/store";
import deepEqual from "fast-deep-equal";
import { NgxMaskPipe } from "ngx-mask";
import { BehaviorSubject, combineLatest, EMPTY, forkJoin, Observable, of, Subject, Subscription } from "rxjs";
import { catchError, distinctUntilChanged, filter, finalize, map, mergeMap, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { DropVasCoverageComponent } from "./../drop-vas-coverage/drop-vas-coverage.component";

const ELIGIBLE_EMPLOYEE_AGE = 14;
const AGE_DIFFERENCE_ZERO = 0;
const EMPLOYEE_MAX_AGE = 1900;
const DATE_FORMAT = "DD";
const CONTROLS_STRING = "controls";
const SELF_ENROLLMENT_DISABLED_FIELDS_CONFIG = "aflac.producer.selfEnrollment.disabled_fields";
const NAME = "name";
const ADDRESS = "address";
const SSN = "ssn";
const CONFIRM_SSN_INPUT_FIELD_NAME = "confirmSSN";
const SSN_LENGTH = 9;
const VAS_STATE_ID = "ID";
const VAS_STATE_MN = "MN";
const REASON_TYPE_OTHER = "OTHER";
const CHECK_LENGTH_ZERO = 0;
const RADIX_VALUE = 10;
const SELECT = "Select";
const DIRECT = "direct";
const HEIGHT_FT = "heightFt";
const HEIGHT_INCHES = "heightInches";
const ACCOUNT_NUMBER_CONFIG = "aflac.producer.selfEnrollment.accountNumbers";
const NAME_MAX_LENGTH = 60;
const IS_PRIMARY_ADDRESS = "isPrimaryAddress";
const FT_UNIT = 12;
const ITIN = "ITIN";

interface DateFormat {
    parse: {
        dateInput: string;
    };
    display: {
        dateInput: string;
        monthYearLabel: string;
        dateA11yLabel: string;
        monthYearA11yLabel: string;
    };
}
const MY_FORMATS: DateFormat = {
    parse: {
        dateInput: AppSettings.DATE_FORMAT_MM_DD_YYYY_1,
    },
    display: {
        dateInput: AppSettings.DATE_FORMAT_MM_DD_YYYY_1,
        monthYearLabel: AppSettings.MONTH_YEAR_FORMAT,
        dateA11yLabel: DATE_FORMAT,
        monthYearA11yLabel: AppSettings.MONTH_YEAR_FORMAT,
    },
};

@Component({
    selector: "empowered-personal-info",
    templateUrl: "./personal-info.component.html",
    styleUrls: ["./personal-info.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FNS_FORMATS },
    ],
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
    @ViewChild("zipInput") zipInput: ElementRef;
    @ViewChild("stateInput") stateInput: MatSelect;
    allowNavigation: Subject<boolean>;
    ssnErrorMessage = "";
    regiForm: FormGroup;
    states: any[];
    suffixes: string[];
    countries: string[];
    counties: County[];
    selectedStateCode: string;
    genders: GenderDetails[];
    martialStatus: string[];
    ethnicities: string[];
    citizenshipOptions: string[];
    driverLicenseStatus: DriverLicenseState;
    preferredLang: PreferredLang;
    defaultPreferredLang;
    tobaccoUserOptions: any[];
    driverLicenceOptions: any[];
    preferredLangOptions: any[];
    langStrings = {};
    state: Member;
    @Select(MemberInfoState) memberState$: Observable<Member>;
    editProfileModel: any;
    editAddressModel: any;
    editObject = null;
    regiControls: any;
    heightFeets = AppSettings.MEMBER_HEIGHTINFEET;
    heightInches = AppSettings.MEMBER_HEIGHTININCH;
    ftSelect = SELECT;
    inchSelect = SELECT;
    permissionEnum = Permission;
    checkCount = 0;
    regiFormValueChanges$: any;
    errorMessage: string;
    maskedSSN: string;
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    test = false;
    checkAlert = false;
    navigationFlag: boolean;
    isLoading: boolean;
    isSaved = false;
    isMaskedTrue: boolean;
    isPartiallyMasked: boolean;
    isFullyMasked: boolean;
    isFullyVisible: boolean;
    maskedSSNReadonly: boolean;
    maskedSSNValue: string;
    unmaskedSSNValue: string;
    unmaskedUserInput: string;
    identifierIDSSN: number;
    nameWithHypenApostrophesValidation: RegExp;
    verificationInformation: { zip: string; verifiedEmail: string; verifiedPhone: string };
    validationConfigurations = [];

    hideFieldElementSetting: HideReadOnlyElementSetting = {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        maidenName: true,
        nickname: true,
        isPrimaryAddress: false,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        countyId: true,
        country: true,
        birthDate: true,
        birthState: true,
        ssn: true,
        heightFt: true,
        heightInches: true,
        weight: true,
        ethnicity: true,
        gender: true,
        maritalStatus: true,
        citizenship: true,
        driversLicenseNumber: true,
        driversLicenseState: true,
        languagePreference: true,
        tobaccoStatus: true,
        medicareEligibility: true,
        dependentOrder: true,
        username: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        id: false,
        firstName: false,
        middleName: false,
        lastName: false,
        suffix: false,
        maidenName: false,
        nickname: false,
        isPrimaryAddress: false,
        address1: false,
        address2: false,
        city: false,
        state: false,
        zip: false,
        countyId: false,
        country: false,
        birthDate: false,
        birthState: false,
        ssn: false,
        heightFt: false,
        heightInches: false,
        weight: false,
        ethnicity: false,
        gender: false,
        maritalStatus: false,
        citizenship: false,
        driversLicenseNumber: false,
        driversLicenseState: false,
        languagePreference: false,
        tobaccoStatus: false,
        medicareEligibility: false,
        dependentOrder: false,
        username: false,
    };
    languageSecondaryStrings: Record<string, string>;
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];
    isValidZip = false;
    formConfigurations: any;
    userIsProducerAdmin: boolean;
    portal: string;
    requiredFields = [];
    ssnMaxLength = 11;
    zipMinLength = 5;
    zipMaximumLength = 10;
    ssnModified: boolean;
    homeContactData: any;
    workContactData: any;
    isDateInvalid = false;
    empAgeLimitError = false;
    isFormValueChange = false;
    driverLicenseMaxLength = 20;
    ssnMaskedLength = 5;
    readonly UNKNOWN = "UNKNOWN";
    readonly IS_OVERALL_ADDRESS_VERIFICATION = "general.feature.enable.aflac.api.address_validation";
    readonly CONFIG_USERNAME_MIN_LENGTH = "general.data.username.length.minimum";
    readonly CONFIG_USERNAME_MAX_LENGTH = "general.data.username.length.maximum";
    isOverallAddressVerification: boolean;
    suggestedAddress: PersonalAddress;
    providedAddress: PersonalAddress;
    addressMessage: string[] = [];
    selectedAddress: string;
    addressResp = false;
    subscriptions: Subscription[] = [];
    isAddressChanged: boolean;
    isAddressSame: PersonalAddress;
    USERNAME_MIN_LENGTH: number;
    USERNAME_MAX_LENGTH: number;
    disableFormFields = false;
    isSsnDeleted = false;

    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    regexSubscription: Subscription;
    isAflacReadOnly = false;
    isPartialEdit = false;
    private readonly unsubscribe$ = new Subject<void>();
    @Output() enableAll = new EventEmitter();
    @Output() enableWork = new EventEmitter();
    @Output() enableContact = new EventEmitter();
    isAgentSelfEnrolled = false;
    agentEnrollmentArray: string[] = [];
    displayVasPlans: string[] = [];
    memberState: string;
    enrollmentInfo: Enrollments[] = [];
    deleteVasProduct: boolean;
    isDirect = false;
    isEnrollmentOpen: boolean;
    accountNumber: number;
    selfEnrollmentAccountNumbers: string[];
    selfEnrollmentAccount = false;
    isVestedAgent: boolean;
    showSelectInch = true;
    showSelectFeet = true;
    isInchDisabled: boolean;
    thirdPartyPlatformsEnabled = false;
    accountInfo: Accounts;
    currentProfileData = new Map<string, string>();
    updatedProfileData = new Map<string, string>();
    hasCifNumber = false;
    saveChanges = false;
    languageStrings = {
        lastName: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.lastName"),
        firstName: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.firstName"),
        ssn: this.language.fetchPrimaryLanguageValue("primary.portal.member.ssn_itin"),
        gender: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.gender"),
        streetAddress1: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.streetAddress1"),
        streetAddress2: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.streetAddress2"),
        city: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.city"),
        state: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.state"),
        zip: this.language.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.zip"),
    };
    isStandaloneDemographicEnabled: boolean;
    // Emits when a valid SSN is input.
    private readonly latestValidSSNSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    private readonly latestValidSSN$ = this.latestValidSSNSubject$.asObservable().pipe(distinctUntilChanged());

    // Emits when the user inputs a value in the SSN field.
    private readonly ssnManualInputSubject$: Subject<string> = new Subject<string>();

    // Emits when the form is saved.
    private readonly formSavedSubject$: Subject<boolean> = new Subject<boolean>();
    ssnConfirmationEnabled = false;
    dependentList: MemberDependent[];

    private enableDependentAddressModal: boolean = null;

    constructor(
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly utilService: UtilService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
        private readonly titleCase: TitleCasePipe,
        private readonly tpiRestrictionsService: TPIRestrictionsForHQAccountsService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly aflacService: AflacService,
        private readonly ssnPipe: SsnFormatPipe,
        private readonly confirmSsnService: ConfirmSsnService,
        private readonly dateService: DateService,
    ) {
        this.portal = this.store.selectSnapshot(SharedState.portal);
    }

    /*
        Component life cycle hook
        OnInit
        Setting the following modal properties:
        1. getLanguageStrings(): Fetch Languages from DB.
        2. getSecondaryLanguageStrings(): Fetch secondary Languages from DB.
        3. initializeForm(): To create form with FormBuilder.
        4. checkTPIRestrictions(): To check TPI restrictions for aflac hq accounts based on portal
        5. checkForUserType(): To check user type based on portal.
        6. loadDropdowns(): To Fetch drop down values for fields.
        7. checkAgentSelfEnrolled() :- Get if the Agent is SelfEnrolled or not and return a boolean value
        8. cacheConfigValue(SELF_ENROLLMENT_DISABLED_FIELDS_CONFIG):- to get the key from config
        9.checkForVestedAgents() :- check for Vested agents and make controls readonly
        10.cacheConfigValue(ConfigName.SSN_MASKING_CONFIG) :- to get ssn masking config.
    */
    ngOnInit(): void {
        this.isInchDisabled = true;
        if (this.router.url.indexOf(DIRECT) >= 0) {
            this.isDirect = true;
        }
        if (!this.isDirect && this.portal !== Portals.MEMBER) {
            this.accountNumber = this.store.selectSnapshot(AccountInfoState).accountInfo.accountNumber
                ? this.store.selectSnapshot(AccountInfoState).accountInfo.accountNumber
                : null;
        }
        this.sharedService
            .getStateZipFlag()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.isLoading = resp;
            });
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isAgentSelfEnrolled = response;
            });
        combineLatest([
            this.staticUtilService.cacheConfigValue(SELF_ENROLLMENT_DISABLED_FIELDS_CONFIG),
            this.staticUtilService.cacheConfigValue(ACCOUNT_NUMBER_CONFIG),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([selfEnrollmentKey, accountNumber]) => {
                this.agentEnrollmentArray = selfEnrollmentKey?.replace(/\s/g, "").split(",");
                this.selfEnrollmentAccountNumbers = accountNumber.split(",");
                if (this.accountNumber && this.selfEnrollmentAccountNumbers.includes(this.accountNumber.toString())) {
                    this.selfEnrollmentAccount = true;
                }
            });
        this.accountService
            .getAccount()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((accountInfo) => {
                this.accountInfo = accountInfo;
            });
        this.getLanguageStrings();
        this.getSecondaryLanguageStrings();
        this.store
            .dispatch(new LoadSecondaryLandingLanguage("secondary.*"))
            .pipe(take(1))
            .subscribe(() => {
                this.getSecondaryLanguageStrings();
            });
        this.regex$.pipe(take(1)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.tobaccoUserOptions = [
            {
                name: TobaccoUserOption.TOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.tobaccoText"],
            },
            {
                name: TobaccoUserOption.NONTOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.nonTobaccoText"],
            },
            {
                name: TobaccoUserOption.UNDEFINED,
                value: this.langStrings["primary.portal.members.personalLabel.undefinedText"],
            },
        ];
        this.driverLicenceOptions = [DriverLicenseState.F, DriverLicenseState.M, DriverLicenseState.U];
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.initializeForm();
        this.memberState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state: Member) => {
            this.state = { ...state };
            this.validate();
        });
        this.checkTPIRestrictions(this.portal);
        this.checkForUserType();
        this.checkCount = 0;
        this.checkAlert = true;
        this.isFullyVisible = true;
        this.loadDropdowns();
        this.regiForm.valueChanges
            .pipe(
                map(() => this.regiForm.getRawValue()),
                distinctUntilChanged((previousChange, currentChange) => deepEqual(previousChange, currentChange)),
                tap(() => this.onSaved(false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.ssnModified = false;
        this.isDateInvalid = true;
        this.staticUtilService
            .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
            .pipe(filter(Boolean), takeUntil(this.unsubscribe$))
            .subscribe((config: SSNMask) => {
                this.isPartiallyMasked = config === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = config === SSNMask.FULLY_MASKED;
                this.isFullyVisible = config === SSNMask.FULLY_VISIBLE;
            });
        this.checkForVestedAgents();
        this.checkFormDisable();
        this.getPlanYears();
        this.regiForm.controls.profile
            .get(HEIGHT_FT)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((heightFt) => {
                if (heightFt === SELECT) {
                    this.regiForm.controls.profile.patchValue({
                        heightInches: SELECT,
                    });
                    this.inchSelect = SELECT;
                    this.isInchDisabled = true;
                } else if (heightFt || heightFt === 0) {
                    this.isInchDisabled = false;
                }
                this.checkHeight();
            });
        this.regiForm.controls.profile
            .get(HEIGHT_INCHES)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((heightIn) => {
                this.checkHeight();
            });

        // Config to check if Standalone Demographic Change is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));

        // Get Dependents
        this.memberService
            .getMemberDependents(this.state.activeMemberId, false, Number(this.accountNumber))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependents) => {
                this.dependentList = dependents;
            });

        this.initializeEnableDependentAddressModal();
    }

    private initializeEnableDependentAddressModal(): void {
        this.staticUtilService
            .cacheConfigValue(AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL)
            .pipe(filter(Boolean), takeUntil(this.unsubscribe$))
            .subscribe((enableDependentAddressModal: string) => {
                this.enableDependentAddressModal = enableDependentAddressModal.toLowerCase() === BooleanConst.TRUE;
            });
    }

    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        this.store
            .select(SharedState.hasPermission(Permission.CENSUS_MEMBER_UPDATE))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isVestedAgent = !response;
                this.getReadOnlyHiddenValidation(this.regiForm);
            });
    }

    checkForUserType(): void {
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.userIsProducerAdmin = false;
        } else {
            this.userIsProducerAdmin = true;
        }
    }

    loadDropdowns(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.states = Response;
            });
        this.staticService
            .getSuffixes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.suffixes = Response;
            });
        this.staticService
            .getGenders()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.genders = this.memberService.refactorGenders(Response);
            });
        this.staticService
            .getEthnicities()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.ethnicities = Response;
            });
        this.staticService
            .getCountries()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.countries = Response;
            });
        this.staticService
            .getMaritalStatuses()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.martialStatus = Response;
            });
        this.staticService
            .getUSCitizenshipOptions()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.citizenshipOptions = Response;
            });
        this.accountService
            .getVocabularies(this.state.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.preferredLangOptions = Response;
            });
    }
    /**
     * Constructs the personal info form and assigns initial values and validators to each field.
     */
    initializeForm(): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const validator = new CustomValidation();
        this.regiForm = this.fb.group({
            id: [""],
            name: this.fb.group(
                {
                    firstName: [
                        "",
                        [Validators.maxLength(NAME_MAX_LENGTH), Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
                    ],
                    middleName: ["", [Validators.maxLength(NAME_MAX_LENGTH), Validators.pattern(this.validationRegex.NAME)]],
                    lastName: [
                        "",
                        [Validators.maxLength(NAME_MAX_LENGTH), Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
                    ],
                    suffix: [""],
                    maidenName: ["", [Validators.pattern(this.validationRegex.NAME), Validators.maxLength(NAME_MAX_LENGTH)]],
                    nickname: ["", [Validators.pattern(this.validationRegex.NAME), Validators.maxLength(NAME_MAX_LENGTH)]],
                },
                { updateOn: "blur" },
            ),
            isPrimaryAddress: [{ value: true, disabled: true }],
            birthDate: [null, { updateOn: "blur" }],
            gender: [null, { updateOn: "blur" }],
            address: this.fb.group({
                address1: ["", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(100)]],
                address2: ["", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(100)]],
                city: ["", [Validators.pattern(this.validationRegex.NAME_WITH_SPACE_BETWEEN_WORDS), Validators.maxLength(100)]],
                state: [],
                zip: ["", Validators.pattern(this.validationRegex.ZIP_CODE)],
                countyId: [{ value: "", disabled: true }],
                country: [],
            }),
            ssn: [""],
            username: ["", Validators.pattern(this.validationRegex.MEMBER_PROFILE_USERNAME)],
            profile: this.fb.group(
                {
                    birthState: [],
                    height: [],
                    heightFt: [],
                    heightInches: [],
                    weight: ["", [Validators.pattern(this.validationRegex.WEIGHT)]],
                    ethnicity: [],
                    maritalStatus: [],
                    citizenship: [],
                    driversLicenseNumber: ["", [Validators.maxLength(20), Validators.pattern(this.validationRegex.DRIVERLICENSENUMBER)]],
                    driversLicenseState: [{ value: "", disabled: true }],
                    languagePreference: [PreferredLang.ENGLISH],
                    tobaccoStatus: [],
                    medicareEligibility: [],
                    dependentOrder: ["", [Validators.maxLength(20), Validators.pattern(this.validationRegex.DEPENDENTORDER)]],
                    correspondenceLocation: [ContactType.HOME],
                },
                { updateOn: "blur" },
            ),
        });

        this.subcribeToFormChanges();
        this.regiControls = this.regiForm.controls;
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.SSN_CONFIRMATION_ENABLED)
            .pipe(
                filter<boolean>(Boolean),
                tap(() => {
                    this.ssnConfirmationEnabled = true;
                    this.setupConfirmSSNField();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method is to set validation for fields as per primary config.
     * If isReadOnly flag is set to false, then we are not set validation.
     * @param formGroup formGroup name as this.regiForm.
     * @returns void
     */
    settingValidations(formGroup: FormGroup): void {
        this.isLoading = true;
        this.state.configurations.payload.personal.forEach((element) => {
            Object.keys(formGroup.controls).forEach((field) => {
                const control = formGroup.get(field);
                if (control[CONTROLS_STRING]) {
                    for (const subField in control[CONTROLS_STRING]) {
                        if (subField && element.name.split(".").pop() === subField && element.value === this.REQUIRED) {
                            this.getValidationValueForKey(subField, this.REQUIRED);
                            if (control[CONTROLS_STRING][subField].validator) {
                                if (!this.isAflacReadOnly && !this.isPartialEdit) {
                                    control[CONTROLS_STRING][subField].setValidators([
                                        Validators.required,
                                        control[CONTROLS_STRING][subField].validator,
                                    ]);
                                } else {
                                    control[CONTROLS_STRING][subField].setValidators(null);
                                }
                            } else if (!this.isAflacReadOnly && !this.isPartialEdit) {
                                control[CONTROLS_STRING][subField].setValidators([Validators.required]);
                            } else {
                                control[CONTROLS_STRING][subField].setValidators(null);
                            }
                            control[CONTROLS_STRING][subField].updateValueAndValidity();
                        }
                    }
                } else if (element.name.split(".").pop() === field && element.value === this.REQUIRED) {
                    this.getValidationValueForKey(field, this.REQUIRED);
                    if (!this.isAflacReadOnly && !this.isPartialEdit) {
                        if (control.validator) {
                            control.setValidators([Validators.required, control.validator]);
                        } else {
                            control.setValidators([Validators.required]);
                        }
                    } else {
                        control.setValidators(null);
                    }
                    control.updateValueAndValidity();
                }
            });
        });
        this.enableFields();
        this.getReadOnlyHiddenValidation(this.regiForm);
    }

    /**
     * This method is to enable fields and set isFullyVisible as true if activeMemberId is present.
     * Based on activeMemberId we call checkOperation() to get Member Information
     * @returns void
     */
    enableFields(): void {
        if (this.state.activeMemberId) {
            this.enableAll.emit(true);
            this.isFullyVisible = true;
            this.checkOperation();
        } else {
            this.isLoading = false;
        }
    }

    /**
     * This method is set validation as hidden and readonly as per config.
     * If isAflacReadOnly or isPartialEdit flag is true then we need modify the fields s read-only.
     * @param regiForm form group
     * @returns void
     */
    getReadOnlyHiddenValidation(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(regiForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            } else if (this.isAflacReadOnly || this.isPartialEdit || this.isVestedAgent) {
                this.modifyFieldsReadOnlyAccess(key);
            }
        });
    }
    getValidationValueForKey(key: any, validationString: string): boolean {
        let flag = false;

        this.state.configurations?.payload?.personal?.forEach((element) => {
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
    /* Added as mat-datepicker does not validate the dates when user clicks
    outside the box, this is require to call validation explicitly */
    @HostListener("click")
    checkBirthDateChange(): any {
        this.empAgeLimitError = false;
        if (this.regiForm.value.birthDate) {
            this.checkBirthDate("change", { value: this.regiForm.value.birthDate });
        }
    }
    checkBirthDate(type: string, event: any): void {
        const hireDate = this.dateService.toDate(this.state.memberInfo["workInformation"].hireDate);
        const birthDate = this.dateService.toDate(this.datePipe.transform(this.regiForm.get("birthDate").value, AppSettings.DATE_FORMAT));
        const diffYears = hireDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = hireDate.getMonth() - birthDate.getMonth();
        const dayDiff = hireDate.getDate() - birthDate.getDate();
        if (
            this.regiForm.get("birthDate") &&
            this.regiForm.get("birthDate").value &&
            !this.calculateAge(this.dateService.toDate(this.regiForm.get("birthDate").value))
        ) {
            this.regiForm.get("birthDate").setErrors({ required: true });
            this.empAgeLimitError = true;
        } else if (birthDate.getFullYear() < EMPLOYEE_MAX_AGE) {
            this.regiForm.get("birthDate").setErrors({ maxAgeError: true });
        } else {
            this.birthDateAndHireDateDiff(diffYears, monthDiff, dayDiff);
        }
    }

    birthDateAndHireDateDiff(diffYears: number, monthDiff: number, dayDiff: number): boolean {
        let returnValue = false;
        if (diffYears < ELIGIBLE_EMPLOYEE_AGE) {
            returnValue = this.setYearError();
        } else if (diffYears === ELIGIBLE_EMPLOYEE_AGE) {
            if (monthDiff < AGE_DIFFERENCE_ZERO) {
                returnValue = this.setYearError();
            } else if (monthDiff === AGE_DIFFERENCE_ZERO && dayDiff < AGE_DIFFERENCE_ZERO) {
                returnValue = this.setYearError();
            }
        }

        return returnValue;
    }

    setYearError(): boolean {
        this.regiForm.get("birthDate").setErrors({ hireDateMisMatch: true });
        return true;
    }
    onCancel = () => {
        this.regiForm.reset();
    };

    /**
     * This method is to set driversLicenseState field as enable or disable.
     * @returns void
     */
    enableDriversLicenseState(): void {
        if (
            this.regiControls.profile.get("driversLicenseNumber").value &&
            this.regiControls.profile.get("driversLicenseNumber").valid &&
            !this.isAflacReadOnly
        ) {
            this.regiControls.profile.get("driversLicenseState").enable();
        } else {
            this.regiControls.profile.get("driversLicenseState").disable();
        }
        this.regiForm.updateValueAndValidity();
    }
    /**
     * This method is to set SSN field as enable or disable.
     * @returns void
     */
    enableSSN(): void {
        if (
            this.regiForm.controls.ssn.value &&
            (this.regiForm.controls.ssn.disabled || this.regiForm.controls.ssn.valid) &&
            this.isPartialEdit
        ) {
            this.regiControls.ssn.disable();
        } else {
            combineLatest([
                this.staticUtilService.hasPermission(Permission.RESTRICT_SSN),
                this.staticUtilService.hasPermission(Permission.TPP_RESTRICTED_PERMISSION),
                this.staticUtilService.hasPermission(Permission.PRODUCER_READ_SSN),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([restrict, tppRestrictedAccess, ssnEnable]) => {
                    if ((restrict || (tppRestrictedAccess && this.accountInfo.thirdPartyPlatformsEnabled)) && !ssnEnable) {
                        this.regiControls.ssn.disable();
                    } else {
                        this.regiControls.ssn.enable();
                    }
                });
        }
        this.regiForm.updateValueAndValidity();
    }
    /**
     * This method is to set countyId field as enable or disable.
     * @returns void
     */
    enableCounty(): void {
        if (this.regiControls.address.get("zip").valid && !this.isAflacReadOnly && !this.isPartialEdit) {
            this.regiControls.address.get("countyId").enable();
        } else {
            this.regiControls.address.get("countyId").disable();
        }
        this.regiForm.updateValueAndValidity();
    }
    fetchCounty(): void {
        const state = this.regiControls.address.get("state").value;
        if (state) {
            this.staticService
                .getCounties(state)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((Response) => {
                    this.counties = Response;
                });
        } else {
            this.counties = [];
        }
    }

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
                if (field === CONFIRM_SSN_INPUT_FIELD_NAME) {
                    // This is a temporary fix to work around an open issue with forms:
                    // https://github.com/angular/angular/issues/10887
                    (control.statusChanges as EventEmitter<string>).emit("TOUCHED");
                }
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * This function is called on ngSubmit to submit form data
     * @param form member profile form
     * @param valid to check for validation.
     */
    onSubmit(form: FormGroup, valid: boolean): void {
        if (this.hasCifNumber && this.isStandaloneDemographicEnabled) {
            this.submitForm(form, valid).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.getUpdatedSSNValue();
            this.saveFormData(form, valid).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    /**
     * set updated form changes data
     */
    submitForm(form: FormGroup, valid: boolean): Observable<boolean> {
        if (!valid) {
            return of(null);
        }
        this.setFormChanges();
        return this.openConfirmChangesModal(form, valid);
    }

    /**
     * Function to get the updated SSN value
     * @return updated ssn
     */
    getUpdatedSSNValue(): string {
        const regiSSNControl = this.regiForm.get(MemberProfileChanges.SSN);
        const currentSSN = this.currentProfileData.get(MemberProfileChanges.SSN);
        const unmaskedSSN = regiSSNControl.touched && regiSSNControl.value ? this.unmaskedSSNValue.replace(/-/g, "") : null;
        this.isSsnDeleted = regiSSNControl.touched && currentSSN !== unmaskedSSN && regiSSNControl.value === "";
        return regiSSNControl.touched && currentSSN !== unmaskedSSN ? `${this.languageStrings.ssn} : ${regiSSNControl.value}` : null;
    }

    /**
     * Function to get the updated gender value
     * @return updated gender
     */
    getUpdatedGenderValue(): string {
        const regiGenderControl = this.regiForm.get(MemberProfileChanges.GENDER);
        const currentGender = this.currentProfileData.get(MemberProfileChanges.GENDER);
        return regiGenderControl.touched && currentGender !== regiGenderControl.value
            ? `${this.languageStrings.gender} : ${regiGenderControl.value}`
            : null;
    }

    /**
     * set updated form changes data
     */
    setFormChanges(): void {
        this.saveChanges = false;
        const regiLastNameControl = this.regiForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.LASTNAME);
        const currentLastName = this.currentProfileData.get(MemberProfileChanges.LASTNAME);
        const lastName =
            regiLastNameControl.touched && currentLastName !== regiLastNameControl.value
                ? `${this.languageStrings.lastName} : ${regiLastNameControl.value}`
                : null;
        const regiFirstNameControl = this.regiForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.FIRSTNAME);
        const currentFirstName = this.currentProfileData.get(MemberProfileChanges.FIRSTNAME);
        const firstName =
            regiFirstNameControl.touched && currentFirstName !== regiFirstNameControl.value
                ? `${this.languageStrings.firstName} : ${regiFirstNameControl.value}`
                : null;
        const ssn = this.getUpdatedSSNValue();
        const gender = this.getUpdatedGenderValue();
        const regiAddress1Control = this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS1);
        const currentAddress1 = this.currentProfileData.get(MemberProfileChanges.ADDRESS1);
        const address1 =
            regiAddress1Control.touched && currentAddress1 !== regiAddress1Control.value
                ? `${this.languageStrings.streetAddress1} : ${regiAddress1Control.value}`
                : null;
        const regiAddress2Control = this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS2);
        const currentAddress2 = this.currentProfileData.get(MemberProfileChanges.ADDRESS2);
        const address2 =
            regiAddress2Control.touched && currentAddress2 !== regiAddress2Control.value
                ? `${this.languageStrings.streetAddress2} : ${regiAddress2Control.value}`
                : null;
        const regiCityControl = this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.CITY);
        const currentCity = this.currentProfileData.get(MemberProfileChanges.CITY);
        const city =
            regiCityControl.touched && currentCity !== regiCityControl.value
                ? `${this.languageStrings.city} : ${regiCityControl.value}`
                : null;
        const regiStateControl = this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.STATE);
        const currentState = this.currentProfileData.get(MemberProfileChanges.STATE);
        const state =
            regiStateControl.touched && currentState !== regiStateControl.value
                ? `${this.languageStrings.state} : ${regiStateControl.value}`
                : null;
        const regiZipControl = this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ZIP);
        const currentZip = this.currentProfileData.get(MemberProfileChanges.ZIP);
        const zip =
            regiZipControl.touched && currentZip !== regiZipControl.value ? `${this.languageStrings.zip} : ${regiZipControl.value}` : null;
        this.setProfileData(
            {
                firstName,
                lastName,
                ssn,
                gender,
                address1,
                address2,
                city,
                state,
                zip,
            },
            this.updatedProfileData,
        );
    }

    /**
     * get the data for profile changes confirmation
     * @returns string of updated demographic info
     */
    getProfileChangesData(): string[] {
        const updatedData: string[] = [];
        for (const key of this.updatedProfileData.keys()) {
            if (this.updatedProfileData.get(key) !== null) {
                updatedData.push(this.updatedProfileData.get(key));
            }
        }
        return updatedData;
    }

    /**
     * This function is used to open the confirmation prompt
     * @param form member profile form
     * @param valid to check for validation.
     * @returns Observable<boolean> return flag based on submit response
     */
    openConfirmChangesModal(form: FormGroup, valid: boolean): Observable<boolean> {
        if (!this.getProfileChangesData().length) {
            return this.saveFormData(form, valid);
        }
        return this.empoweredModalService
            .openDialog(ProfileChangesConfirmPromptComponent, {
                data: {
                    data: this.getProfileChangesData(),
                    isAgentAssisted: false,
                },
            })
            .afterClosed()
            .pipe(
                filter((isSaved) => !!isSaved),
                switchMap((data) => {
                    this.saveChanges = true;
                    this.setProfileData(
                        {
                            firstName: this.regiForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.FIRSTNAME).value,
                            lastName: this.regiForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.LASTNAME).value,
                            ssn:
                                this.regiForm.get(MemberProfileChanges.SSN).value && this.unmaskedSSNValue
                                    ? this.unmaskedSSNValue.replace(/-/g, "")
                                    : null,
                            gender: this.regiForm.get(MemberProfileChanges.GENDER).value,
                            address1: this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS1).value,
                            address2: this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS2).value,
                            city: this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.CITY).value,
                            state: this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.STATE).value,
                            zip: this.regiForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ZIP).value,
                        },
                        this.currentProfileData,
                    );
                    this.updatedProfileData.clear();
                    return this.saveFormData(form, valid);
                }),
            );
    }

    /**
     * This function is used to save member data
     * @param form member profile form
     * @param valid to check for validation.
     * @returns Observable<boolean> return flag based on submit response
     */
    saveFormData(form: any, valid: boolean): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        this.isAddressChanged = this.regiForm.get("address").dirty;

        this.checkBirthDateChange();
        if (valid) {
            this.isLoading = true;
            this.checkCount = 2;

            const isDateIndependentFormControls = this.isDateIndependentFormControls();
            this.regiForm.markAsPristine();
            const unmodifiedResult: MemberProfile = Object.assign({}, form);
            unmodifiedResult["workInformation"] = this.state.memberInfo["workInformation"];
            const modifiedResult: MemberProfile = Object.assign({}, form);
            const model = this.transformPersonalData(modifiedResult, unmodifiedResult);
            model["workInformation"] = this.state.memberInfo["workInformation"];

            for (const key in this.editObject.address) {
                if (!(key in model.address)) {
                    model.address[key] = this.editObject.address[key];
                }
            }
            for (const key in this.editObject.profile) {
                if (!(key in model.profile)) {
                    model.profile[key] = this.editObject.profile[key];
                }
            }
            for (const key in this.editObject.workInformation) {
                if (!(key in model.workInformation)) {
                    model.workInformation[key] = this.editObject.workInformation[key];
                }
            }
            const contactModel: any = {
                address: form.address,
            };
            const contactdetailModel = {
                memberId: 0,
                contactType: ContactType.HOME,
                contactModel: contactModel,
                mpGroupId: this.state.mpGroupId.toString(),
            };
            if (this.state.activeMemberId) {
                model.id = this.state.activeMemberId;
                const payload = { ...model };
                if (payload.username === "" || payload.username === this.editProfileModel.username) {
                    payload.username = null;
                }
                Object.keys(model.name).forEach((key) => {
                    if (payload.name[key] === "") {
                        payload.name[key] = null;
                    }
                });
                Object.keys(model.profile).forEach((key) => {
                    if (payload.profile[key] === "") {
                        payload.profile[key] = null;
                    }
                });
                payload.verificationInformation = {
                    ...this.verificationInformation,
                    zipCode: payload.address.zip,
                };
                delete payload.address;
                if (this.unmaskedSSNValue) {
                    this.updateMemberSSN(this.unmaskedSSNValue);
                }
                this.memberService
                    .updateMember(payload, this.state.mpGroupId.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            let profile = { ...unmodifiedResult.profile };
                            profile = model.profile;
                            unmodifiedResult.profile = { ...profile };
                            let name = { ...unmodifiedResult.name };
                            name = model.name;
                            unmodifiedResult.name = { ...name };
                            unmodifiedResult["workAddress"] = this.workContactData ? this.workContactData : null;
                            unmodifiedResult.verificationInformation = payload.verificationInformation;
                            contactdetailModel.memberId = this.state.activeMemberId;
                            if (!this.userIsProducerAdmin && !this.isAgentSelfEnrolled) {
                                this.userService.setUserCredential({
                                    name: model.name,
                                    memberId: this.state.activeMemberId,
                                    groupId: +this.state.mpGroupId,
                                });
                            }
                            this.store.dispatch(
                                new AddMemberInfo({
                                    memberInfo: unmodifiedResult,
                                    activeMemberId: this.state.activeMemberId,
                                    mpGroupId: this.state.mpGroupId.toString(),
                                }),
                            );
                            if (!form.ssn) {
                                this.isFullyVisible = true;
                            }

                            this.saveContactDetails(contactdetailModel)
                                .pipe(
                                    switchMap((res) => {
                                        returnFlag.next(res);
                                        this.isLoading = false;
                                        // Checks a subset of the FormControls in order to importAflacPolicies earlier than Shop Page load
                                        if (isDateIndependentFormControls) {
                                            // Third parameter is an optional value that controls if overrideImportAllowedTime is used
                                            return this.aflacService.importAflacPolicies(
                                                this.state.activeMemberId,
                                                +this.state.mpGroupId,
                                                true,
                                            );
                                        }
                                        return of(null);
                                    }),
                                    takeUntil(this.unsubscribe$),
                                )
                                .subscribe();
                            this.errorMessage = null;
                        },
                        (error) => {
                            if (error) {
                                if (error.error.details && error.error.details.map((detail) => detail.field).indexOf("username") >= 0) {
                                    this.regiForm.controls.username.setErrors({
                                        apiError: this.language.fetchSecondaryLanguageValue(
                                            `secondary.portal.members.api.${error.error.status}.${error.error.code}.username`,
                                        ),
                                    });
                                } else {
                                    this.showErrorAlertMessage(error, `${payload.name.firstName} ${payload.name.lastName}`);
                                }
                            } else {
                                this.errorMessage = null;
                            }
                            this.isLoading = false;
                            returnFlag.next(false);
                        },
                    );
            } else {
                this.memberService
                    .createMember(model, +this.state.mpGroupId.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (data: any) => {
                            const memberId = data.headers
                                .get(AppSettings.API_RESP_HEADER_LOCATION)
                                .substring(data.headers.get(AppSettings.API_RESP_HEADER_LOCATION).lastIndexOf("/") + 1);
                            contactdetailModel.memberId = memberId;
                            this.store.dispatch(
                                new AddMemberInfo({
                                    memberInfo: model,
                                    activeMemberId: memberId,
                                    mpGroupId: this.state.mpGroupId.toString(),
                                }),
                            );
                            if (!form.ssn) {
                                this.isFullyVisible = true;
                            }
                            this.saveContactDetails(contactdetailModel)
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe((res) => {
                                    returnFlag.next(res);
                                });
                            this.enableWork.emit(true);
                            this.errorMessage = null;
                        },
                        (error) => {
                            if (error) {
                                this.showErrorAlertMessage(error, `${model.name.firstName} ${model.name.lastName}`);
                            } else {
                                this.errorMessage = null;
                            }
                            this.isLoading = false;
                            returnFlag.next(false);
                        },
                    );
            }
        } else {
            this.validateAllFormFields(this.regiForm);
            returnFlag.next(false);
        }
        return returnFlag.asObservable();
    }

    /**
     * Given an array of FormControls, checks if any of those controls have been edited by the user
     * @param {FormControl[]} [formControlsToCheckForPristine] FormControl elements that determine if time stamp should be overwritten
     * @returns {boolean} boolean showing if any of the FormControls in the passed FormControl[] have been edited by the user
     */
    isDateIndependentFormControls(): boolean {
        // Initial values of each FormControl to be passed to isDateIndependentFormControls method
        const controlsListIndependentOfImportAllowedTime: (AbstractControl | undefined)[] = [
            this.regiForm.controls.name.get("firstName"),
            this.regiForm.controls.name.get("lastName"),
            this.regiForm.get("birthDate"),
            this.regiForm.get("gender"),
            this.regiForm.get("ssn"),
            this.regiForm.controls.address.get("zip"),
        ];
        return controlsListIndependentOfImportAllowedTime.some((control) => !control?.pristine);
    }

    /**
     * method to update member SSN in beneficiary
     * @param ssn member ssn value
     */
    updateMemberSSN(ssn: string): void {
        this.memberService
            .getMemberBeneficiaries(this.state.activeMemberId, +this.state.mpGroupId, false)
            .pipe(
                filter(
                    (beneficiaries) =>
                        beneficiaries.length && beneficiaries.some((beneficiary) => beneficiary.relationshipToMember === Relationship.SELF),
                ),
                map((beneficiaries) => beneficiaries.find((beneficiary) => beneficiary.relationshipToMember === Relationship.SELF)),
                switchMap((response) =>
                    this.memberService.updateMemberBeneficiary(this.state.activeMemberId, +this.state.mpGroupId, response.id, {
                        ...response,
                        ssn: ssn,
                    }),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * This function is used to save member contact
     * @param contactdetailModel member contact data
     * @returns Observable<boolean>
     */
    saveContactDetails(contactdetailModel: any): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        this.homeContactData.addressValidationDate = undefined;
        this.verifyAddressDetails(contactdetailModel.contactModel.address)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (!res) {
                    return of(res);
                }
                this.homeContactData.address =
                    this.selectedAddress === AppSettings.TEMPORARY_ADDRESS
                        ? this.utilService.copy(this.providedAddress)
                        : this.utilService.copy(this.suggestedAddress);
                this.regiForm.patchValue({ address: this.homeContactData.address });
                Object.keys(this.homeContactData.address).forEach((key) => {
                    if (this.homeContactData.address[key] === "") {
                        this.homeContactData.address[key] = null;
                    }
                });
                this.getMemberEnrollments()
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((resp) => {
                        if (this.deleteVasProduct) {
                            this.deleteEnrollment();
                            this.memberService
                                .saveMemberContact(
                                    contactdetailModel.memberId,
                                    contactdetailModel.contactType,
                                    this.homeContactData,
                                    contactdetailModel.mpGroupId,
                                )
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe(
                                    (result) => {
                                        this.isAddressSame = this.homeContactData.address;
                                        this.errorMessage = null;
                                        this.saveMemberIdentifier();
                                        returnFlag.next(true);
                                    },
                                    (error) => {
                                        if (error) {
                                            this.showErrorAlertMessage(error);
                                        } else {
                                            this.errorMessage = null;
                                        }
                                        returnFlag.next(false);
                                    },
                                );
                        } else {
                            this.memberService
                                .saveMemberContact(
                                    contactdetailModel.memberId,
                                    contactdetailModel.contactType,
                                    this.homeContactData,
                                    contactdetailModel.mpGroupId,
                                )
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe(
                                    (result) => {
                                        this.isAddressSame = this.homeContactData.address;
                                        this.errorMessage = null;
                                        this.saveMemberIdentifier();
                                        returnFlag.next(true);
                                    },
                                    (error) => {
                                        if (error) {
                                            this.showErrorAlertMessage(
                                                error,
                                                `${this.editObject.name.firstName} ${this.editObject.name.lastName}`,
                                            );
                                        } else {
                                            this.errorMessage = null;
                                        }
                                        returnFlag.next(false);
                                    },
                                );
                        }
                    });
                return undefined;
            });
        return returnFlag.asObservable();
    }
    /**
     * Method to save SSN when SSN is added or updated.
     */
    saveMemberIdentifier(): void {
        const ssnToBePassed = this.unmaskedUserInput || this.unmaskedSSNValue;
        if (
            this.editAddressModel &&
            this.editProfileModel &&
            (this.editProfileModel.ssn === ssnToBePassed || this.editProfileModel.ssn === this.unmaskedSSNValue) &&
            !this.isSsnDeleted
        ) {
            this.onSaved(true);
            this.enableSSN();
            this.isFormValueChange = false;
            return;
        }
        if (!this.regiForm.value.ssn && this.unmaskedSSNValue) {
            this.deleteMemberIdentifier();
            this.onSaved(true);
            this.enableSSN();
            this.isFormValueChange = false;
            this.isFullyVisible = true;
        } else if (
            (this.regiForm.value.ssn && this.isFullyVisible) ||
            (this.editProfileModel && this.unmaskedSSNValue !== this.editProfileModel.ssn)
        ) {
            const memberIdentifier: MemberIdentifier = {
                id: this.state.activeMemberId,
                memberIdentifierTypeId: MemberIdentifierTypeIDs.ID,
                value: ssnToBePassed,
                version: null,
                ssnConfirmed: this.ssnConfirmationEnabled || undefined,
            };
            this.memberService
                .updateMemberIdentifier(memberIdentifier, +this.state.mpGroupId)
                .pipe(
                    catchError((error: HttpErrorResponse) => {
                        this.onSaved(false);
                        this.isFormValueChange = true;
                        if (error.status === ClientErrorResponseCode.RESP_404) {
                            return this.memberService.saveMemberIdentifier(memberIdentifier, +this.state.mpGroupId);
                        }
                        if (error.status === ClientErrorResponseCode.RESP_409 && error.error.code === AppSettings.DUPLICATE) {
                            this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.api.ssn.duplicate"];
                        } else {
                            this.showErrorAlertMessage(error);
                        }
                        return EMPTY;
                    }),
                    tap((_) => {
                        this.onSaved(true);
                        this.enableSSN();
                        this.isFormValueChange = false;
                        this.ssnModified = true;
                        this.checkForSSNConfiguration();
                        this.regiForm.controls.ssn.setErrors(null);
                        this.regiForm.controls.ssn.clearValidators();
                        this.changeDetectorRef.detectChanges();
                        this.isLoading = false;
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Method to delete SSN when SSN is removed from the field.
     */
    deleteMemberIdentifier(): void {
        this.memberService
            .deleteMemberIdentifier(this.state.activeMemberId, this.identifierIDSSN, +this.state.mpGroupId)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error: HttpErrorResponse) => {
                    if (error.status === ClientErrorResponseCode.RESP_404) {
                        return of(null);
                    }
                    this.showErrorAlertMessage(error);
                    return undefined;
                }),
                tap((deleteMemberResponse) => {
                    this.isFullyVisible = true;
                    this.isMaskedTrue = false;
                }),
            )
            .subscribe();
    }

    dateFormatter(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }
    /**
     * transforming all personal info data while submitting personal information
     * @param model { MemberProfile } it's containing personal info related data
     * @param unmodifiedResult { MemberProfile } it's containing personal info unmodified data
     * @returns {MemberProfile} personal info data
     */
    transformPersonalData(model: MemberProfile, unmodifiedResult: MemberProfile): MemberProfile {
        let data = { ...model };
        const profile = { ...data.profile };
        data.name.firstName = data.name.firstName.trim();
        data.name.lastName = data.name.lastName.trim();
        data.birthDate = this.dateFormatter(model.birthDate);
        data["workInformation"] =
            unmodifiedResult.workInformation && unmodifiedResult.workInformation !== {} ? unmodifiedResult.workInformation : {};
        const calcHeight =
            model.profile.heightFt || model.profile.heightInches
                ? Math.floor(model.profile.heightFt * FT_UNIT + model.profile.heightInches)
                : model.profile.height;
        profile.height = calcHeight;
        profile.weight = Math.floor(model.profile.weight);
        profile.weight = !profile.weight ? null : profile.weight;
        if (!(model.ssn && model.ssn.length)) {
            delete data.ssn;
        } else if (this.state.activeMemberId && this.editObject) {
            data = this.updateProfileObject(data, model);
        }
        const correspondanceLocationValue = this.regiForm.get(IS_PRIMARY_ADDRESS).value ? ContactType.HOME : ContactType.WORK;
        profile.correspondenceLocation = correspondanceLocationValue;
        data.profile = { ...profile };
        delete data.profile.heightFt;
        delete data.profile.heightInches;
        delete data.id;
        delete data.isPrimaryAddress;
        return data;
    }

    /**
     * Function to transform member data if activeMemberId is true
     * @param data instance of member profile object
     * @param model actual data for member profile
     * @returns member profile object with modified property
     */
    updateProfileObject(data: MemberProfile, model: MemberProfile): MemberProfile {
        let ssnValue = "";
        if (this.editObject.ssn === this.unmaskedSSNValue) {
            ssnValue = !this.regiControls.ssn.touched || this.regiControls.ssn.value.length > SSN_LENGTH ? this.editObject.ssn : model.ssn;
            data.ssn = ssnValue;
        } else {
            ssnValue = this.unmaskedSSNValue;
            data.ssn = ssnValue;
        }
        if (!ssnValue) {
            delete data.ssn;
        } else {
            if (ssnValue.includes("-")) {
                data.ssn = ssnValue.replace(/-/g, "");
            }
            data.ssnConfirmed = this.ssnConfirmationEnabled || undefined;
        }
        return data;
    }
    validate(): void {
        if (this.state.configurations && this.state.configurations.payload && this.regiForm && this.checkCount === 0) {
            this.formConfigurations = this.state.configurations.payload.personal;
            this.settingValidations(this.regiForm);
        }
    }
    /**
     * function to fetch member contact data
     * @param profileData profile data information
     * @return void
     */
    fetchMemberContacts(profileData: MemberProfile): void {
        this.homeContactData = {};
        if (profileData) {
            this.isLoading = true;
            forkJoin([
                this.memberService.getMemberContact(this.state.activeMemberId, ContactType.HOME, this.state.mpGroupId.toString()),
                this.memberService
                    .getMemberContact(this.state.activeMemberId, ContactType.WORK, this.state.mpGroupId)
                    .pipe(catchError((error) => of(error))),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (result) => {
                        this.isLoading = false;
                        const data = result[0].body;
                        this.homeContactData = data;
                        // eslint-disable-next-line no-prototype-builtins
                        if (data && data.hasOwnProperty(AppSettings.ADDRESS)) {
                            data.address["address1"] = data.address.address1 ? data.address.address1 : null;
                            data.address["address2"] = data.address.address2 ? data.address.address2 : null;
                            data.address["city"] = data.address.city ? data.address.city : null;
                            data.address["countyId"] = data.address.countyId ? data.address.countyId.toString() : null;
                            data.address["country"] = data.address.country ? data.address.country : null;
                            data.address["state"] = data.address.state ? data.address.state : null;
                            this.editAddressModel = data.address;
                        }
                        this.editObject = { ...this.editProfileModel, ...{ address: this.editAddressModel } };
                        const workInfo = { ...this.editObject.workInformation };
                        workInfo["payrollFrequencyId"] = this.editObject.workInformation.payrollFrequencyId
                            ? this.editObject.workInformation.payrollFrequencyId.toString()
                            : undefined;
                        workInfo["organizationId"] = this.editObject.workInformation.organizationId
                            ? this.editObject.workInformation.organizationId.toString()
                            : undefined;
                        this.editObject.workInformation = { ...workInfo };
                        if (
                            this.editObject.workInformation.termination &&
                            Object.entries(this.editObject.workInformation.termination).length !== 0
                        ) {
                            const termination = { ...this.editObject.workInformation.termination };
                            termination["terminationCodeId"] = this.editObject.workInformation.termination.terminationCodeId
                                ? this.editObject.workInformation.termination.terminationCodeId.toString()
                                : undefined;
                            this.editObject.workInformation.termination = { ...termination };
                        }
                        this.regiForm.reset({
                            ...this.regiForm.getRawValue(),
                            ...{ address: this.editObject.address },
                        });
                        if (this.isAgentSelfEnrolled || this.selfEnrollmentAccount) {
                            this.getAgentReadOnlyValidation(this.regiForm);
                        }
                        if (this.editObject.profile.correspondenceLocation) {
                            if (this.editObject.profile.correspondenceLocation === ContactType.HOME) {
                                this.regiForm.get("isPrimaryAddress").setValue(true);
                                this.regiForm.get("isPrimaryAddress").disable();
                            } else {
                                this.regiForm.get("isPrimaryAddress").setValue(false);
                                this.regiForm.get("isPrimaryAddress").enable();
                            }
                        } else {
                            this.editObject.profile["correspondenceLocation"] = ContactType.HOME;
                            this.regiForm.get("isPrimaryAddress").setValue(true);
                            this.regiForm.get("isPrimaryAddress").disable();
                        }
                        this.regiForm.updateValueAndValidity();
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: this.editObject,
                                activeMemberId: this.state.activeMemberId,
                                mpGroupId: this.state.mpGroupId,
                            }),
                        );
                        this.fetchCounty();
                        this.enableCounty();
                        this.fetchWorkContactData(result[1].body);
                        const currentData: ProfileChangesConfirmModel = {
                            lastName: this.regiForm.get("name").get("lastName").value,
                            firstName: this.regiForm.get("name").get("firstName").value,
                            ssn: this.regiForm.get("ssn").value,
                            address1: this.regiForm.get("address").get("address1").value,
                            address2: this.regiForm.get("address").get("address2").value,
                            city: this.regiForm.get("address").get("city").value,
                            state: this.regiForm.get("address").get("state").value,
                            zip: this.regiForm.get("address").get("zip").value,
                            gender: this.regiForm.get("gender").value,
                        };
                        this.setProfileData(currentData, this.currentProfileData);
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        }
    }

    fetchWorkContactData(workContactData: any): void {
        this.isLoading = true;
        this.isLoading = false;
        this.enableContact.emit(true);
        this.workContactData = workContactData;
        this.editObject = { ...this.editProfileModel, ...{ workAddress: this.workContactData } };
        this.store.dispatch(
            new AddMemberInfo({
                memberInfo: this.editObject,
                activeMemberId: this.state.activeMemberId,
                mpGroupId: this.state.mpGroupId,
            }),
        );
    }

    /**
     * Fetches member info and patches profile form with it
     */
    checkOperation(): void {
        this.isLoading = true;
        this.checkCount = 1;
        this.editObject = {};
        combineLatest([
            this.memberService.getMember(this.state.activeMemberId, true, this.state.mpGroupId.toString()),
            this.staticUtilService.cacheConfigValue(this.IS_OVERALL_ADDRESS_VERIFICATION),
            this.staticUtilService.cacheConfigValue(this.CONFIG_USERNAME_MIN_LENGTH),
            this.staticUtilService.cacheConfigValue(this.CONFIG_USERNAME_MAX_LENGTH),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([result, addressVerification, usernameMinLength, usernameMaxLength]) => {
                    this.errorMessage = null;
                    this.isLoading = false;
                    this.editProfileModel = result.body;
                    this.editProfileModel.birthDate = this.utilService.getCurrentTimezoneOffsetDate(result.body.birthDate);
                    this.verificationInformation = this.editProfileModel.verificationInformation;
                    if (this.editProfileModel.workInformation) {
                        this.editProfileModel.workInformation.organizationId = this.editProfileModel.workInformation.organizationId
                            ? this.editProfileModel.workInformation.organizationId.toString()
                            : this.editProfileModel.workInformation.organizationId;
                        this.editProfileModel.workInformation.payrollFrequencyId = this.editProfileModel.workInformation.payrollFrequencyId
                            ? this.editProfileModel.workInformation.payrollFrequencyId.toString()
                            : this.editProfileModel.workInformation.payrollFrequencyId;
                    }
                    this.editObject = {
                        ...this.editProfileModel,
                        ...{ address: this.editAddressModel },
                    };
                    this.regiForm.reset(this.editObject);
                    if (this.editObject.profile.height) {
                        const heightFtValue = this.regiControls.profile.get("heightFt");
                        const heightInValue = this.regiControls.profile.get("heightInches");
                        heightFtValue.setValue(Math.floor(this.editObject.profile.height / 12));
                        heightInValue.setValue(this.editObject.profile.height % 12);
                        this.showSelectFeet = heightFtValue.value === undefined || Number(heightFtValue.value) < 0;
                        this.showSelectInch = heightInValue.value === undefined || Number(heightInValue.value) < 0;
                    }
                    this.regiForm.updateValueAndValidity();
                    this.enableDriversLicenseState();
                    this.enableSSN();
                    this.fetchMemberContacts(result.body);
                    if (this.editObject.ssn) {
                        this.checkForSSNConfiguration();
                    }
                    if (this.editObject.profile.correspondenceLocation) {
                        if (this.editObject.profile.correspondenceLocation === ContactType.HOME) {
                            this.regiForm.get("isPrimaryAddress").setValue(true);
                            this.regiForm.get("isPrimaryAddress").disable();
                        } else {
                            this.regiForm.get("isPrimaryAddress").setValue(false);
                            this.regiForm.get("isPrimaryAddress").enable();
                        }
                    } else {
                        this.editObject.profile["correspondenceLocation"] = ContactType.HOME;
                        this.regiForm.get("isPrimaryAddress").setValue(true);
                        this.regiForm.get("isPrimaryAddress").disable();
                    }
                    this.isOverallAddressVerification = addressVerification && addressVerification.toLowerCase() === "true";
                    this.USERNAME_MIN_LENGTH = +usernameMinLength;
                    this.USERNAME_MAX_LENGTH = +usernameMaxLength;
                    this.regiForm.controls.username.setValidators([
                        Validators.minLength(this.USERNAME_MIN_LENGTH),
                        Validators.maxLength(this.USERNAME_MAX_LENGTH),
                        Validators.pattern(this.validationRegex.MEMBER_PROFILE_USERNAME),
                        // Username is optional unless it is initially defined.
                        ...(result.body.username && !this.isDirect ? [Validators.required] : []),
                    ]);
                    this.regiForm.controls.username.disable();
                    if (this.isDirect || this.accountInfo?.thirdPartyPlatformsEnabled) {
                        this.regiForm.controls.username.setValue("");
                    }
                    this.regiForm.updateValueAndValidity();
                    this.store.dispatch(
                        new AddMemberInfo({
                            memberInfo: this.editObject,
                            activeMemberId: this.state.activeMemberId,
                            mpGroupId: this.state.mpGroupId.toString(),
                        }),
                    );
                    this.hasCifNumber = !!this.editProfileModel?.customerInformationFileNumber;
                },
                (error) => {
                    this.isLoading = false;
                    if (error) {
                        this.errorMessage = this.langStrings["primary.portal.members.personalValidationMsg.unsavedErrorMessage"];
                    } else {
                        this.errorMessage = null;
                    }
                },
            );
    }

    /**
     * Function to add form data to map for comparison
     * @param data data which is to stored
     * @param dataMap map where the member data is to be updated
     */
    setProfileData(data: ProfileChangesConfirmModel, dataMap: Map<string, string>): void {
        dataMap.set("lastName", data.lastName);
        dataMap.set("firstName", data.firstName);
        dataMap.set("ssn", data.ssn);
        dataMap.set("address1", data.address1);
        dataMap.set("address2", data.address2);
        dataMap.set("city", data.city);
        dataMap.set("state", data.state);
        dataMap.set("zip", data.zip);
        dataMap.set("gender", data.gender);
    }

    /**
     * Function to calculate age
     * @param birthDate birth date
     */
    calculateAge(birthDate: Date): number {
        const currentDate = new Date();
        if (birthDate < currentDate) {
            let age = currentDate.getFullYear() - birthDate.getFullYear();
            const month = currentDate.getMonth() - birthDate.getMonth();
            if (month < 0 || (month === 0 && currentDate.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age >= ELIGIBLE_EMPLOYEE_AGE) {
                return age;
            }
            return null;
        }
        return null;
    }

    /**
     * Saves the masked or unmasked SSN value
     * @param maskingFlag whether to mask the SSN or not
     */
    getMaskedSSN(maskingFlag: boolean): void {
        this.isLoading = true;
        this.maskedSSNReadonly = false;
        if (maskingFlag) {
            this.maskedSSNReadonly = true;
        }

        this.memberService
            .getMemberIdentifierTypes()
            .pipe(
                takeUntil(this.unsubscribe$),
                mergeMap((result) => result),
                filter((res) => res.type === "SSN"),
                tap((resp) => (this.identifierIDSSN = resp.id)),
                mergeMap((response) =>
                    this.memberService.getMemberIdentifier(
                        this.state.activeMemberId,
                        response.id,
                        maskingFlag,
                        +this.state.mpGroupId.toString(),
                    ),
                ),
                filter(([memberIdentifier]) => !!memberIdentifier),
                tap(
                    ([memberIdentifier]) => {
                        const ssn: string = memberIdentifier.value;
                        if (!this.editProfileModel) {
                            this.editProfileModel = {};
                        }
                        if (maskingFlag) {
                            this.maskedSSNValue = ssn;
                        } else {
                            this.editProfileModel["ssn"] = ssn;
                            this.onLatestValidSSNUpdate(ssn);
                        }
                        if (this.maskedSSNValue && this.unmaskedSSNValue) {
                            this.setSSNOnView();
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                        this.isFullyVisible = true;
                    },
                ),
            )
            .subscribe();
    }
    subcribeToFormChanges(): void {
        this.regiFormValueChanges$ = this.regiForm.valueChanges;
    }

    /**
     * Component lifecycle hook
     * OnDestroy
     * Unsubscribe all subscriptions after component gets destroyed.
     * @returns void
     */
    ngOnDestroy(): void {
        this.checkAlert = false;
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    revertForm(): void {
        if (this.state.activeMemberId) {
            this.checkOperation();
            this.regiForm.patchValue(this.editObject);
            if (this.maskedSSN) {
                this.onLatestValidSSNUpdate(this.editObject.ssn);
                this.checkForSSNConfiguration();
            }
        } else {
            this.regiForm.reset();
            this.regiForm.get("isPrimaryAddress").setValue(true);
            this.regiForm.updateValueAndValidity();
        }
        this.isFormValueChange = false;
        this.isAddressChanged = false;
        this.regiForm.markAsPristine();
        this.regiForm.controls.ssn.setErrors(null);
        this.formSavedSubject$.next(true);
    }
    checkCorrespondenceLocation(event: any): void {
        if (event.checked) {
            this.regiControls.profile.get("correspondenceLocation").setValue(ContactType.HOME);
            this.regiControls.isPrimaryAddress.disable();
            this.regiControls.isPrimaryAddress.setValue(true);
        } else {
            this.regiControls.isPrimaryAddress.enable();
            this.regiControls.isPrimaryAddress.setValue(false);
            this.regiControls.address.get("isPrimaryAddress").setValue(ContactType.WORK);
        }
        this.regiForm.updateValueAndValidity();
        this.regiForm.markAsDirty();
    }

    /**
     * Opens the exit confirmation modal
     */
    openAlert(): void {
        if (this.regiForm.dirty) {
            this.checkAlert = false;
            const memberInfo = this.store.selectSnapshot(MemberInfoState.getMemberInfo);
            const memberName = (memberInfo && memberInfo.name && `${memberInfo.name.firstName} ${memberInfo.name.lastName}`) || "";
            if (this.hasCifNumber && this.isStandaloneDemographicEnabled) {
                this.setFormChanges();
            }
            const dialogData: ConfirmationDialogData = {
                title: "",
                // eslint-disable-next-line max-len
                content: `${this.langStrings["primary.portal.members.commonLabel.savesUpdatesTo"]} ${memberName}${this.langStrings["primary.portal.members.commomLabel.profileBeforeExiting"]}`,
                primaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.save"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.doNotSave"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
                profileChangesData: this.getProfileChangesData(),
                isStandaloneDemographicEnabled: this.isStandaloneDemographicEnabled,
            };

            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }
    OnConfirmDialogAction(isSave: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (isSave) {
            this.saveFormData(this.regiForm.value, this.regiForm.valid)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.navigationFlag = res;
                    this.allowNavigation.next(this.navigationFlag);
                    this.allowNavigation.complete();
                });
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }

    checkForSSNConfiguration(): void {
        this.isPartiallyMasked = false;
        this.isFullyMasked = false;
        this.isFullyVisible = false;
        this.maskedSSNReadonly = false;
        this.isMaskedTrue = true;
        this.staticService
            .getConfigurations("group.portal.employee.ssn.visibility", parseFloat(this.state.mpGroupId))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                if (Response.length > 0 && Response[0].value === "PARTIALLY_MASKED") {
                    this.isPartiallyMasked = true;
                    this.isFullyVisible = false;
                } else if (Response.length > 0 && Response[0].value === "FULLY_MASKED") {
                    this.isPartiallyMasked = true;
                    this.isFullyMasked = true;
                } else if (Response.length > 0 && Response[0].value === "FULLY_VISIBLE") {
                    this.isFullyVisible = true;
                    this.isMaskedTrue = false;
                }
            });
        this.getMaskedSSN(true);
        this.getMaskedSSN(false);
        this.regiForm.controls.ssn.setErrors(null);
        this.regiForm.controls.ssn.clearValidators();
    }

    setSSNOnView(): void {
        if (this.isFullyMasked || this.isPartiallyMasked) {
            this.regiControls["ssn"].setValue(this.maskedSSNValue);
            this.maskedSSN = this.maskedSSNValue;
        } else if (this.isFullyVisible) {
            this.regiControls["ssn"].setValue(this.unmaskedSSNValue);
            this.maskedSSN = this.unmaskedSSNValue;
        }
        if (this.ssnModified) {
            this.onSaved(true);
            this.isFormValueChange = false;
        }
        this.isLoading = false;
        if (this.regiControls.confirmSSN) {
            if (this.editProfileModel.ssnConfirmed) {
                this.regiControls.confirmSSN.setValue(this.unmaskedSSNValue);
            } else if (!this.isSaved) {
                this.regiControls.confirmSSN.enable();
            }
            this.regiControls.confirmSSN.markAsPristine();
        }
    }

    /**
     *
     * @param event zip text field keyboard event
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }

    /**
     * This method is used to toggle the view of ssn number into input field.
     * @param maskedFlag boolean flag;
     * @returns void
     */
    ssnMaskingToggler(maskedFlag: boolean): void {
        const ssnDigitsPattern = new RegExp(this.validationRegex.SSN_DIGITS);
        if (this.regiForm.controls.ssn.valid) {
            this.regiForm.controls.ssn.clearValidators();
        }
        if (this.regiForm.controls.ssn.value && this.regiForm.controls.ssn.valid && !this.isAflacReadOnly) {
            if (maskedFlag) {
                if (this.isPartialEdit && this.editObject.ssn) {
                    this.isMaskedTrue = true;
                } else {
                    this.isMaskedTrue = false;
                    this.onLatestValidSSNUpdate(this.unmaskedSSNValue.replace(ssnDigitsPattern, "$1-$2-$3"));
                    this.regiControls["ssn"].setValue(this.unmaskedSSNValue);
                    this.regiForm.controls.ssn.updateValueAndValidity();
                }
            } else {
                this.isMaskedTrue = true;
                this.regiControls["ssn"].setValue(this.maskedSSNValue);
                this.regiForm.controls.ssn.updateValueAndValidity();
            }
        }
    }

    /**
     * This function is used to mask SSN
     */
    maskSSN(): void {
        this.regiForm.controls.ssn.setValue(this.maskPipe.transform(this.regiForm.value.ssn, SSN_FORMAT));
        this.unmaskedUserInput = this.regiForm.value.ssn;
        if (this.unmaskedUserInput) {
            this.regiForm.controls.ssn.setValidators([
                Validators.minLength(SSN_MIN_LENGTH),
                Validators.pattern(this.validationRegex.UNMASKSSN_ITIN),
            ]);
            this.regiForm.controls.ssn.markAsTouched({ onlySelf: true });
            this.regiForm.controls.ssn.updateValueAndValidity();
        }
        this.isFullyVisible = !this.regiForm.controls.ssn.valid || !(this.isPartiallyMasked || this.isFullyMasked);
        const ssnFormValue = this.unmaskedUserInput ? this.unmaskedUserInput.replace(/-/g, "") : "";
        if (ssnFormValue.length === SSN_MIN_LENGTH && !this.isFullyVisible && this.regiForm.controls.ssn.valid) {
            let tempMask = "";
            if (ssnFormValue !== this.unmaskedSSNValue) {
                const lengthUnmaskedSSN = ssnFormValue.length;
                tempMask = "XXX-XX-" + ssnFormValue.slice(this.ssnMaskedLength, lengthUnmaskedSSN);
                this.maskedSSNValue = tempMask;
                if (ssnFormValue[0] !== "X") {
                    this.onLatestValidSSNUpdate(ssnFormValue);
                }
                this.regiForm.controls.ssn.setValue(this.maskedSSNValue);
                this.isMaskedTrue = true;
                this.regiForm.controls.ssn.clearValidators();
                this.regiForm.controls.ssn.updateValueAndValidity();
                this.regiForm.controls.ssn.setErrors(null);
            }
        } else if (!this.unmaskedUserInput) {
            this.isFullyVisible = true;
        } else {
            this.regiForm.controls.ssn.setValue(this.unmaskedUserInput);
        }
    }

    /**
     * This function is used to display error message
     * @param err api error
     * @param name employee name.
     */
    showErrorAlertMessage(err: Error, name?: string): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS]?.length > 0) {
            if (error[this.DETAILS][0].code === "zip.stateMismatch") {
                this.showMismMtchStateError();
                return;
            }
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else if (
            error.status === ClientErrorResponseCode.RESP_400 &&
            error.message === this.languageSecondaryStrings["secondary.portal.members.errorMessage.invalidSSN"]
        ) {
            this.regiForm.get("ssn").setErrors({ pattern: true });
            this.regiForm.get("ssn").markAsTouched();
            this.regiForm.updateValueAndValidity();
            this.regiForm.markAsDirty();
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            if (error.details && error.details.length && error.code !== ClientErrorResponseType.DUPLICATE) {
                this.errorMessage = error.details[0].message;
            } else if (error.details?.length && (error.details[0].field === SSN.toUpperCase() || error.details[0].field === ITIN)) {
                this.errorMessage = this.langStrings["primary.portal.members.api.ssn_itin.duplicate.nonMmp"].replace(
                    "##identifier##",
                    error.details[0].field,
                );
            } else {
                this.errorMessage = this.languageSecondaryStrings[
                    "secondary.portal.register.personalInfo.api.duplicateMemberError"
                ].replace("##name##", this.titleCase.transform(name));
            }
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    showMismMtchStateError(): void {
        this.regiForm.get("address").get("zip").setErrors({ mismatch: true });
    }

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.personal.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        if ((this.regiForm.get(control).value === null || this.regiForm.get(control).value === "") && event !== "") {
            return this.languageSecondaryStrings["secondary.portal.common.invalidDateFormat"];
        }
        if (!this.regiForm.get(control).value) {
            this.regiForm.get(control).setErrors({ required: true });
            return this.languageSecondaryStrings["secondary.portal.members.requiredField"];
        }
        return undefined;
    }
    /**
     *
     * This function is used for validating state and zip code
     * @returns void
     */
    checkZipCode(): void {
        const value = this.zipInput.nativeElement.value;
        const addressForm = this.regiForm.get("address");
        const zipFormControl = addressForm.get("zip");
        this.memberState = this.stateInput.value;
        if (this.stateInput.value === undefined) {
            this.memberState = addressForm.get("state").value;
        }
        this.subscriptions.push(validateStateAndZipCode(this.memberState, value, zipFormControl, this.staticService, this.sharedService));
    }
    /**
     * This function is used to get language from db
     */
    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.show",
            "primary.portal.common.hide",
            "primary.portal.common.undoChanges",
            "primary.portal.common.saved",
            "primary.portal.common.save",
            "primary.portal.common.doNotSave",
            "primary.portal.common.selectFt",
            "primary.portal.common.selectIn",
            "primary.portal.common.optional",
            "primary.portal.members.commonLabel.savesUpdatesTo",
            "primary.portal.members.commomLabel.profileBeforeExiting",
            "primary.portal.members.personalLabel.personInfo",
            "primary.portal.members.personalLabel.firstName",
            "primary.portal.members.personalLabel.middleName",
            "primary.portal.members.personalLabel.lastName",
            "primary.portal.members.personalLabel.maidenName",
            "primary.portal.members.personalLabel.nickName",
            "primary.portal.members.personalLabel.streetAddress1",
            "primary.portal.members.personalLabel.streetAddress2",
            "primary.portal.members.personalLabel.city",
            "primary.portal.members.personalLabel.zip",
            "primary.portal.members.personalLabel.birthdate",
            "primary.portal.members.personalLabel.weight",
            "primary.portal.members.personalLabel.driverLicense",
            "primary.portal.members.personalLabel.username",
            "primary.portal.members.personalLabel.tobaccoText",
            "primary.portal.members.personalLabel.nonTobaccoText",
            "primary.portal.members.personalLabel.undefinedText",
            "primary.portal.members.personalLabel.dependantUser",
            "primary.portal.members.personalLabel.medicareEligibleCheck",
            "primary.portal.members.personalLabel.tobaccoUser",
            "primary.portal.members.personalLabel.preferredLanguage",
            "primary.portal.members.personalLabel.driverLicenseState",
            "primary.portal.members.personalLabel.martialStatus",
            "primary.portal.members.personalLabel.citizenship",
            "primary.portal.members.personalLabel.gender",
            "primary.portal.member.ssn_itin",
            "primary.portal.members.personalLabel.raceOrEthnicity",
            "primary.portal.members.personalLabel.height",
            "primary.portal.members.personalLabel.birthState",
            "primary.portal.members.personalLabel.dateFormat",
            "primary.portal.members.personalLabel.country",
            "primary.portal.members.personalLabel.county",
            "primary.portal.members.personalLabel.state",
            "primary.portal.members.personalLabel.AptOrUnit",
            "primary.portal.members.personalLabel.select",
            "primary.portal.members.personalLabel.myPrimaryAddress",
            "primary.portal.members.personalLabel.suffix",
            "primary.portal.members.personalValidationMsg.unsavedErrorMessage",
            "primary.portal.members.personalValidationMsg.ssnMsg2",
            "primary.portal.members.personalValidationMsg.ssnMsg1",
            "primary.portal.members.personalValidationMsg.maxlength100",
            "primary.portal.members.personalValidationMsg.streetAddress1",
            "primary.portal.members.workLabel.primaryAddressCheck",
            "primary.portal.census.manualEntry.zipErrorMsg",
            "primary.portal.common.city.patternError",
            "primary.portal.formPageQuestion.genericMinLengthValidation",
            "primary.portal.deleteCoverage.reason",
            "primary.portal.members.workLabel.customerPrimaryAddress",
            "primary.portal.members.personalLabel.heightFeet",
            "primary.portal.members.personalLabel.heightInches",
            "primary.portal.common.inches",
            "primary.portal.common.feet",
            "primary.portal.members.api.ssn_itin.duplicate.nonMmp",
            "primary.portal.members.ssn.confirm",
        ]);
    }

    getSecondaryLanguageStrings(): void {
        this.languageSecondaryStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.members.personalValidationMsg.dependantOrder",
            "secondary.portal.members.api.ssn.duplicate",
            "secondary.portal.members.requiredField",
            "secondary.portal.members.selectionRequired",
            "secondary.portal.members.personalValidationMsg.driverLicense",
            "secondary.portal.members.personalValidationMsg.weight",
            "secondary.portal.members.personalValidationMsg.employeeAgeLimit",
            "secondary.portal.members.situsMistmatchError",
            "secondary.portal.members.personalValidationMsg.zip",
            "secondary.portal.members.personalValidationMsg.city",
            "secondary.portal.members.personalValidationMsg.streetAddress2",
            "secondary.portal.members.personalValidationMsg.nickNameMsg2",
            "secondary.portal.members.personalValidationMsg.nickNameMsg1",
            "secondary.portal.members.personalValidationMsg.maidenNameMsg2",
            "secondary.portal.members.personalValidationMsg.maidenNameMsg1",
            "secondary.portal.members.personalValidationMsg.lastNameMsg2",
            "secondary.portal.members.personalValidationMsg.lastNameMsg1",
            "secondary.portal.members.personalValidationMsg.middleName",
            "secondary.portal.members.personalValidationMsg.firstNameMsg2",
            "secondary.portal.members.personalValidationMsg.firstNameMsg1",
            "secondary.portal.members.personalValidationMsg.usernameLength",
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.members.workValidationMsg.employeeAgeLimit",
            "secondary.portal.members.personalValidationMsg.birthAndHireDateDifference",
            "secondary.portal.census.manualEntry.employeeMaxAge",
            "secondary.portal.register.personalInfo.api.duplicateMemberError",
            "secondary.portal.members.personalValidationMsg.usernamePattern",
            "secondary.portal.applicationFlow.demographics.invalidHeight",
            "secondary.portal.members.errorMessage.invalidSSN",
        ]);
    }

    /**
     * This method will update the verified address.
     * @param providedAddress  user provided address.
     * @returns Observable of boolean depending on verifyAddress API response
     */
    verifyAddressDetails(providedAddress: PersonalAddress): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        const addressFormValue = this.regiForm.get("address").value;
        this.providedAddress = providedAddress;
        if (this.isAddressSame && this.isAddressSame === addressFormValue) {
            this.isAddressChanged = true;
        }
        if (!this.isOverallAddressVerification || !this.isAddressChanged) {
            this.selectedAddress = AppSettings.TEMPORARY_ADDRESS;
            this.isLoading = false;
            return of(true);
        }
        this.isAddressSame = addressFormValue;
        this.memberService
            .verifyMemberAddress(providedAddress)
            .pipe(
                tap((resp) => {
                    this.homeContactData.addressValidationDate = new Date();
                    if (resp.matched) {
                        this.selectedAddress = AppSettings.TEMPORARY_ADDRESS;
                        returnFlag.next(true);
                    }
                }),
                filter((resp) => resp.matched === false),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (resp) => {
                    this.addressResp = false;
                    this.isLoading = false;
                    this.suggestedAddress = resp.suggestedAddress;
                    if (resp.matched) {
                        return of(true);
                    }
                    this.openModal(AppSettings.ADDRESS_BOTH_OPTION)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => returnFlag.next(res));
                    return undefined;
                },
                (error) => {
                    this.addressMessage = [];
                    this.addressResp = true;
                    this.isLoading = false;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.homeContactData.addressValidationDate = new Date();
                        if (error.error && error.error.details) {
                            error.error.details.map((item) => this.addressMessage.push(item.message));
                        } else {
                            this.addressMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                            );
                        }
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.addressMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                        );
                    } else if (error.error.details.length) {
                        this.addressMessage.push(error.error.details[0].message);
                    }

                    this.openModal(ADDRESS_OPTIONS.SINGLE, error.status)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => returnFlag.next(res));
                },
            );
        return returnFlag.asObservable();
    }

    /**
     * This method will open the address-verify modal.
     * @param option  model option.
     * @param errorStatus API error status
     * @returns Observable of boolean according to closed confirm address dialog response
     */
    openModal(option: string, errorStatus?: number): Observable<boolean> {
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.providedAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });

        return addressDialog.afterClosed().pipe(
            switchMap((elementData) => {
                this.selectedAddress = elementData.data.selectedAddress;

                if (!elementData.data.isVerifyAddress) {
                    return of(false);
                }

                if (!this.dependentList?.length || !this.enableDependentAddressModal) {
                    return of(true);
                }

                this.empoweredModalService.openDialog(DependentAddressUpdateModalComponent, {
                    width: "667px",
                    data: {
                        memberId: this.state.activeMemberId,
                        memberAddress:
                            this.selectedAddress === AppSettings.TEMPORARY_ADDRESS ? this.providedAddress : this.suggestedAddress,
                    },
                });

                return of(true);
            }),
            finalize(() => {
                this.closeModal();
            }),
        );
    }

    /**
     * Ths method will handle the form disable if user doesn't have permission.
     * @returns void
     */
    checkFormDisable(): void {
        this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.state.mpGroupId.toString())
            .pipe(
                filter(
                    ([isRestricted, accountData]) => isRestricted && accountData.thirdPartyPlatformsEnabled && !this.isAgentSelfEnrolled,
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.regiForm.disable();
                this.disableFormFields = true;
            });
    }
    /**
     * This method will close address-verify modal.
     * @returns void
     */
    closeModal(): void {
        this.addressResp = false;
    }

    /**
     * This method will set isAflacReadOnly boolean flag based on response of canAccessTPIRestrictedModuleInHQAccount.
     * settingValidations() and getReadOnlyHiddenValidation() method will handle validation for fields.
     * If portal is producer then we will get array of boolean flag and assign response to global variable in component
     * @param portal string producer/member.
     * @returns void
     */
    checkTPIRestrictions(portal: string): void {
        this.tpiRestrictionsService
            .canEditMemberProfile(
                Permission.AFLAC_HQ_MEMBER_PROFILE_EDIT_CONFIG,
                Permission.AFLAC_HQ_PRODUCER_PROFILE_EDIT_PERMISSION,
                Permission.AFLAC_HQ_PRODUCER_PROFILE_PARTIAL_EDIT_PERMISSION,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([memberCanEdit, producerCanEdit, producerCanPartiallyEdit]) => {
                if (portal === Portals.MEMBER) {
                    this.isAflacReadOnly = !memberCanEdit;
                } else if (portal === Portals.PRODUCER) {
                    this.isAflacReadOnly = !producerCanEdit && !producerCanPartiallyEdit && !this.isDirect;
                    this.isPartialEdit = producerCanPartiallyEdit && !this.isDirect;
                }
                this.settingValidations(this.regiForm);
                this.getReadOnlyHiddenValidation(this.regiForm);
            });
    }
    /**
     * This method is set validation as non-editable and readonly as per config.
     * If isAgentSelfEnrolled and it is from MAU file, then we need to modify the fields to be read-only.
     * @param regiForm form group
     * @returns void
     */
    getAgentReadOnlyValidation(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            const formControls = regiForm.controls[key];
            if ((key === NAME || key === ADDRESS) && formControls instanceof FormGroup) {
                const formGroupControls = formControls["controls"];
                if (this.agentEnrollmentArray.length > 0) {
                    Object.keys(formGroupControls).forEach((selfEnrollmentKey) => {
                        if (this.agentEnrollmentArray.indexOf(selfEnrollmentKey) !== -1 && formGroupControls[selfEnrollmentKey].value) {
                            formGroupControls[selfEnrollmentKey].disable();
                            this.modifyFieldsReadOnlyAccess(selfEnrollmentKey);
                        }
                    });
                }
            } else if (
                key === SSN &&
                this.agentEnrollmentArray.length > 0 &&
                this.agentEnrollmentArray.indexOf(key) !== -1 &&
                formControls.value
            ) {
                formControls.disable();
                this.modifyFieldsReadOnlyAccess(key);
            }
        });
    }

    /**
     * This method is to set field as read-only by modifying readOnlyFieldElementSetting Object.
     * In case of partial edit we need to handle ssn field if no value present against the same.
     * @param key formControl string for this.regiForm
     * @returns void
     */
    modifyFieldsReadOnlyAccess(key: string): void {
        const readOnlyFieldObj = this.utilService.copy(this.readOnlyFieldElementSetting);
        if (this.isAflacReadOnly || this.isVestedAgent) {
            readOnlyFieldObj[key] = true;
        } else if (this.isPartialEdit) {
            readOnlyFieldObj[key] = key !== "ssn" || this.editObject.ssn;
        } else if (this.isAgentSelfEnrolled) {
            readOnlyFieldObj[key] = true;
        } else if (this.selfEnrollmentAccount) {
            readOnlyFieldObj[key] = true;
        } else {
            readOnlyFieldObj[key] = false;
        }
        this.readOnlyFieldElementSetting = readOnlyFieldObj;
    }
    /**
     * This function is used to open vas coverage warning popup
     *  @returns Observable<void>
     */
    openDropVasCoveragePopup(): Observable<void> {
        return this.empoweredModalService
            .openDialog(DropVasCoverageComponent, {
                data: {
                    vasPlans: this.displayVasPlans,
                    firstName: this.regiControls.name.get("firstName").value,
                    portal: this.portal,
                },
            })
            .afterClosed()
            .pipe(
                tap((resp) => {
                    this.deleteVasProduct = true;
                }),
            );
    }
    /**
     * This function is used to get member enrollment whose status is pending
     * @returns Observable<void>
     */
    getMemberEnrollments(): Observable<void> {
        return this.enrollmentsService.searchMemberEnrollments(this.state.activeMemberId, parseInt(this.state.mpGroupId, RADIX_VALUE)).pipe(
            switchMap((data) => this.setDataToForm(data)),
            catchError((error) => of(error)),
        );
    }
    /**
     * This function is used to arrange data to be display on vas coverage popup
     * @param data Enrollment data.
     * @returns Observable<void>
     */
    setDataToForm(data: Enrollments[]): Observable<void> {
        this.deleteVasProduct = false;
        const currentDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
        this.displayVasPlans = [];
        this.enrollmentInfo = [];
        if (data) {
            data.forEach((value) => {
                if (
                    value.plan.product.valueAddedService &&
                    this.isEnrollmentOpen &&
                    (this.memberState === VAS_STATE_ID || this.memberState === VAS_STATE_MN)
                ) {
                    this.enrollmentInfo.push(value);
                    this.displayVasPlans.push(value.plan.product.name);
                }
            });
            if (this.displayVasPlans.length) {
                return this.openDropVasCoveragePopup();
            }
        }
        return of(null);
    }

    /**
     * This function is used to delete vas product
     */
    deleteEnrollment(): void {
        const voidRequest = {
            reason: REASON_TYPE_OTHER,
            comment: this.langStrings["primary.portal.deleteCoverage.reason"],
        };
        this.enrollmentInfo.forEach((value) => {
            this.subscriptions.push(
                this.enrollmentsService
                    .voidCoverage(this.state.activeMemberId, value.id, parseInt(this.state.mpGroupId, RADIX_VALUE), voidRequest)
                    .subscribe(),
            );
        });
    }
    /**
     * This function is used to get plan years
     */
    getPlanYears(): void {
        const currentDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
        this.benefitsOfferingService
            .getPlanYears(parseInt(this.state.mpGroupId, RADIX_VALUE), false, true)
            .pipe(
                filter((resp) => resp && resp.length > CHECK_LENGTH_ZERO),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((resp) => {
                resp.forEach((value) => {
                    if (value.enrollmentPeriod.expiresAfter >= currentDate && value.enrollmentPeriod.effectiveStarting <= currentDate) {
                        this.isEnrollmentOpen = true;
                    }
                });
            });
    }

    /**
     *  Checks and sets invalid error for height on change
     */
    checkHeight(): void {
        const heightft = this.regiForm.controls.profile.get(HEIGHT_FT);
        const heightIn = this.regiForm.controls.profile.get(HEIGHT_INCHES);
        heightft.setErrors(null);
        heightIn.setErrors(null);
        if (heightft.value === 0 && heightIn.value === 0) {
            heightft.setErrors({ invalid: true });
            heightIn.setErrors({ invalid: true });
        }
        if (
            (heightft.value || heightft.value === 0) &&
            (heightIn.value === null || heightIn.value === undefined || heightIn.value === SELECT)
        ) {
            heightIn.setErrors({ required: true });
        }
        if (heightft.value === SELECT && (heightIn.value === null || heightIn.value === undefined || heightIn.value === SELECT)) {
            heightIn.setErrors(null);
        }
    }

    /**
     * Emits the latest valid unmasked SSN input.
     *
     * @param value latest valid unmasked SSN
     */
    onLatestValidSSNUpdate(value: string): void {
        this.unmaskedSSNValue = value;
        this.latestValidSSNSubject$.next(this.ssnPipe.transform(value, new RegExp(this.validationRegex.SSN_SPLIT_FORMAT)));
    }

    /**
     * Emits a value indicating whether the form was saved or has unsaved values.
     *
     * @param value whether the form was saved (true) or has unsaved values (false)
     */
    onSaved(value: boolean): void {
        this.isSaved = value;
        this.formSavedSubject$.next(value);
    }

    /**
     * Emits SSN input value.
     *
     * @param value SSN input value
     */
    onSSNInputChange(value: string): void {
        this.isFormValueChange = true;
        this.ssnManualInputSubject$.next(value);
    }

    /**
     * Initializes the confirm SSN field and sets up listeners to enable/disable it.
     */
    setupConfirmSSNField(): void {
        this.regiForm.addControl(
            CONFIRM_SSN_INPUT_FIELD_NAME,
            this.fb.control({ value: "", disabled: true }, { validators: [Validators.required] }),
        );
        const confirmSSN = this.regiControls.confirmSSN;
        this.confirmSsnService
            .updateValidators(confirmSSN, this.latestValidSSN$, this.regiControls.ssn.statusChanges.pipe(distinctUntilChanged()))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.confirmSsnService
            .updateControl(confirmSSN, this.latestValidSSN$, this.ssnManualInputSubject$)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.confirmSsnService
            .disableControl(confirmSSN, this.formSavedSubject$.asObservable())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }
}
