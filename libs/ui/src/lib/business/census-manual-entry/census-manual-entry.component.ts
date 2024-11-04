import { HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, ViewChild, Optional, Inject, OnDestroy, ElementRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
    MemberService,
    StaticService,
    AccountProfileService,
    EmailTypes,
    AccountService,
    GenderDetails,
    CommonService,
    DependentContact,
    BenefitsOfferingService,
    ClassNames,
    ApprovalRequest,
    ValidateMemberProfile,
    MemberIdentifier,
    AuthenticationService,
} from "@empowered/api";
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Store, Select } from "@ngxs/store";

import { DatePipe, TitleCasePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { forkJoin, Observable, of, Subscription, Subject, combineLatest, iif } from "rxjs";
import { catchError, tap, map, startWith, flatMap, takeUntil, switchMap, delay, withLatestFrom, take } from "rxjs/operators";
import { MatStepper } from "@angular/material/stepper";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from "@angular/material/core";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import {
    Permission,
    ClientErrorResponseCode,
    ConfigName,
    SHOP_SUCCESS,
    SECOND_IN_MILLISECONDS,
    BooleanConst,
    Salary,
    PartnerId,
    AppSettings,
    PhoneContactTypes,
    EnrollmentMethod,
    Portals,
    CarrierId,
    RatingCode,
    ContactType,
    CountryState,
    CorrespondenceType,
    MemberProfile,
    VerificationInformation,
    MemberDependent,
    Accounts,
    MemberContact,
} from "@empowered/constants";
import { AccountProfileBusinessService, SharedService } from "@empowered/common-services";
import {
    EnrollmentMethodModel,
    EnrollmentMethodStateModel,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    EnrollmentMethodState,
    IsQleShop,
    AccountListState,
    AddGroup,
    SharedState,
    SetRegex,
} from "@empowered/ngxs-store";
import { ConfirmAddressDialogComponent } from "../../components/confirm-address-dialog/confirm-address-dialog.component";
import { UtilService, StaticUtilService, DualPlanYearService } from "@empowered/ngxs-store";
import { EnrollmentMethodComponent } from "../../components/enrollment-method/enrollment-method.component";
import { validateStateAndZipCode } from "../address-verification/address-verification.component";
import { DateFnsDateAdapter, DATE_FNS_FORMATS, DateService } from "@empowered/date";

const ADD_ONE_TO_MONTH = 1;
const AGE_DIFFERENCE_ZERO = 0;
const DATE_FORMAT = "DD";
const ANNUAL_SALARY = "annualSalary";
const NOT_IN_RANGE_ERROR = "not_in_range";
const ACTUAL = "ACTUAL";
const MIN_DATE_LENGTH = 8;
const TWO_DIGITS_YEAR_LENGTH = 2;
const MAX_YEAR_BIRTH_DATE = 99;
const NINTEEN_YEAR = "19";
const TWENTY_YEAR = "20";
const DATE_INDEX = 1;
const SPOUSE_RELATION_ID = 1;
const DEPARTMENT_ERROR = "workInformation.departmentNumbers";
const DEPENDENT_FORM = "DependentForm";
const FORM_CONTROLS = "controls";
const BIRTH_DATE_CONTROL = "birthDate";
const FORM_VALUE = "value";
const GENDER_FORM_CONTROL = "gender";
const DEPENDENT_RELATIONS_ID_FORM_CONTROL = "dependentRelationId";
const STATE_FORM_CONTROL = "state";
const ZIP_FORM_CONTROL = "zip";
const WORK_INFO_FORM = "workInfoForm";
const EMPLOYEE_FORM = "employeeForm";
const DEPENDENTS_INFO_FORM = "dependentsForm";
const PROSPECT = "prospect";
const CHECK_ZERO_INDEX = 0;
const CHECK_ONE_INDEX = 1;
const INVALID_EMAIL_DOMAIN = "ValidEmail";
const FIRST_NAME_MSG = "secondary.portal.members.personalValidationMsg.firstNameMsg1";
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";
const NEW_EMPLOYEE = "newEmployee";
const MIN_SALARY = 9000;
const MAX_SALARY = 999999999.99;
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

export interface Details {
    id: any;
    employeeId: any;
}
export interface DialogPermissionData {
    canOnlyCreateTestMember: boolean;
    canCreateTestMember: boolean;
    canCreateMember: boolean;
    isQuoteShopPage: boolean;
    mpGroupId: number;
}
export const MY_FORMATS: DateFormat = {
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

const ACCOUNT_DETAILS_RESPONSE_INDEX = 2;

@Component({
    selector: "empowered-census-manual-entry",
    templateUrl: "./census-manual-entry.component.html",
    styleUrls: ["./census-manual-entry.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FNS_FORMATS },
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class CensusManualEntryComponent implements OnInit, OnDestroy {
    @ViewChild("empForm") empForm;
    @ViewChild("deptForm") deptForm;
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("stepper") stepper: MatStepper;
    @ViewChild("birthDatePickerInput") birthDatePickerInput: ElementRef;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    display = true;
    private unsubscribe$ = new Subject<void>();
    workInfoForm: FormGroup;
    employeeForm: FormGroup;
    dependentsForm: FormGroup;
    employeesDepartments: any[];
    employeeGenders: GenderDetails[];
    genderError = false;
    duplicateDependentError = false;
    employeeStates: any[];
    employeeStateOptions: Observable<string[]>;
    phoneNumberTypes: string[];
    mpGroup: number;
    stateZip: string;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    phoneMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    changeStepper: number;
    disableCheckBox = true;
    validStatus = 0;
    enableDependentFlag = false;
    changedName = "";
    memberObject: MemberProfile;
    dependentsCount = 0;
    saveAndShopFlag = false;
    dependentsReleation = [];
    zipFlag = false;
    dependentObj: any[] = [];
    memberId: string;
    dependentRelationId: number;
    contactInfo: any;
    stateAbr: any;
    step1 = 1;
    step2 = 2;
    step3 = 3;
    salaryInfo: Salary;
    memberIdentifierId = "";
    identifierTypeId = 2;
    dateFormat = AppSettings.DATE_FORMAT;
    zipError = false;
    errorMessage: any;
    EnrollmentDialogRef: any;
    errorResponse: boolean;
    dependentResponse: boolean;
    dependentErr: any;
    workInfoResponse: boolean;
    workInfoMsg: any;
    emailAddressType = EmailTypes.PERSONAL;
    dependentsFormMap: string[] = [];
    deepCopyDependent = [];
    dependentsId = [];
    totalDependentsCount = 1;
    selectLabel: string;
    stepPosition = 0;
    emailDomainError = "";
    isMemberContactSaved = false;
    workinfoflag: boolean;
    englishLabel: string;
    today = new Date();
    minDate: Date;
    maxHireDate = new Date();
    isSpouseSelected = [];
    spouseFormName: string;
    updateMemberFlag = false;
    updateDependentFlag = false;
    isDependentRequired = false;
    validWorkInfoForm = false;
    updateMemberSaved = false;
    createSalarySaved = false;
    createMemberIdentifierSaved = false;
    isPersonalInfoChanged = false;
    dependentContactInfo: any;
    isEmpDOBInvalid = false;
    isWorkInfoHireDate = false;
    isEmployeeFormSubmit = false;
    isDependentFormInvalid = false;
    isWorkInfoFormInvalid = false;
    dependentDOB = false;
    dependentContactSaved = false;
    relationshipType: any[] = [];
    minimumSubscriberAge: number;
    minimumSpouseAge: number;
    minimumFutureDays: number;
    dependentZipFlag = true;
    employeeZipFlag = true;
    isHqAccount = false;
    isTpiAccount = false;
    showDependentsConfig = true;
    showAddDependents = true;
    restrictAddDependents = false;
    isLoading = false;
    isEmailOptional = false;
    maxEmployeeAge = 1900;
    relationshipTypes: any[] = [
        {
            value: 1,
            type: "Spouse",
        },
        {
            value: 2,
            type: "Child",
        },
    ];
    configurationSubscriber: Subscription;
    unpluggedFeatureFlag: boolean;
    subscriptions: Subscription[] = [];
    isMobile: boolean;
    maxChildAge: number;
    readonly permissionEnum = Permission;
    languageStrings = {
        firstName: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.firstName"),
        employeeRelationship: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.employeeRelationship"),
        state: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.state"),
        phoneType: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.phoneType"),
        preferredLanguage: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.preferredLanguage"),
        department: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.department"),
        annualSalary: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.annualSalary"),
        gender: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.gender"),
        hoursWeek: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.hoursWeek"),
        hireDate: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.hireDate"),
        employeeID: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.employeeID"),
        lastName: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.lastName"),
        birthdate: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.birthdate"),
        zip: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.zip"),
        emailAddress: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.emailAddress"),
        phoneNumber: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.phoneNumber"),
        addDependent: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.addDependent"),
        addAnotherdependent: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.addAnotherdependent"),
        stepperSaveshop: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.stepperSave&shop"),
        ariaClose: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
        ariaEdit: this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        ariaNext: this.language.fetchPrimaryLanguageValue("primary.portal.common.next"),
        ariaBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
        ariaRemove: this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        ariaSave: this.language.fetchPrimaryLanguageValue("primary.portal.common.save"),
        isTestEmp: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.istestEmployee"),
    };
    languageStringsArray: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.workLabel.select",
        "primary.portal.census.manualEntry.title",
        "primary.portal.census.manualEntry.licensedModal.title",
        "primary.portal.census.manualEntry.dependentsTitle",
        "primary.portal.census.manualEntry.workinfoTitle",
        "primary.portal.census.manualEntry.addNewDepartmentId",
        "primary.portal.census.manualEntry.undefined",
        "primary.portal.census.manualEntry.newDepartmentId",
        "primary.portal.census.manualEntry.newDepartmentIdHint",
        "primary.portal.census.manualEntry.notSaved",
        "primary.portal.common.optional",
        "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
        "primary.portal.members.mappPolicyDeliveryMsgElectronic",
        "primary.portal.members.mmpPolicyDeliveryMsgPaper",
        "primary.portal.members.mappPolicyDeliveryMsgPaper",
        "primary.portal.census.manualEntry.salaryNotInRange",
        "primary.portal.census.manualEntry.newHire",
        "primary.portal.census.manualEntry.accountProfile",
        "primary.portal.census.manualEntry.departmentPeoRating",
        "primary.portal.common.selectionRequired",
        "primary.portal.members.dependentValidationMsg.birthDateMsg2",
        "primary.portal.members.dependentValidationMsg.WIState",
        "primary.portal.common.stronglyRecommended",
        "primary.portal.common.stronglyRecommended.email.tooltip",
        "primary.portal.common.employee",
        "primary.portal.census.manualEntry.workInfo.error.workZipRequired",
        "primary.portal.direct.addCustomer.workInfo.error.zipLength",
        "primary.portal.direct.addCustomer.workInfo.error.workStateRequired",
        "primary.portal.census.manualEntry.workStateZipCheckbox",
        "primary.portal.pda.form.employerName",
    ]);
    langStrings: Record<string, string>;
    portal: string;
    portalTypeAdminVal = "ADMIN";
    isShopEnabled = true;
    canCreateMember: boolean;
    canCreateTestMember: boolean;
    canOnlyCreateTestMember: boolean;
    isQuoteShopPage: boolean;
    dataTobePrepopulated: any;
    ELECTRONIC = CorrespondenceType.ELECTRONIC;
    PAPER = CorrespondenceType.PAPER;
    sistusStateData: any;
    situsState: any;
    credentails: any;
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    enrollmentState: EnrollmentMethodStateModel;
    routerAfterLogin: string;
    preferredLangOptions: any[];
    isEmployeeIdRequired = false;
    groupPartnerId: number;
    annualSalaryOptional = true;
    hoursPerWeekOptional = true;
    hoursPerWeekError = "";
    annualSalaryError = "";
    isAflacUSer: boolean;
    addNewDepartmentFlag = false;
    readonly PARENT_ID = 1;
    readonly ADD_NEW = "ADD_NEW";
    readonly CORPORATE = "Corporate";
    readonly UNDEFINED = "Undefined";
    readonly UNSPECIFIED = "UNSP";
    secondaryLanguageStrings: Record<string, string>;
    readonly UNKNOWN: "UNKNOWN";
    hoursPerWeekMinConfig: number;
    hoursPerWeekMaxConfig: number;
    hoursPerWeekMoreThanMaxErrorMsg: string;
    hoursPerWeekMoreThanMinErrorMsg: string;
    departmentLabel: string;
    isDepartmentRequired = false;
    storedState: CountryState[];
    newDepartmentId: number;
    isDepartmentIdCreated = false;
    isProducer = false;
    isAccountRatingCodePEO: boolean;
    classTypeId: number;
    peoDepartments: ClassNames[];
    previousDateChangeValue: Date | string;
    verificationInfo: VerificationInformation;
    DEPARTMENT_LABEL_LANGUAGE_KEY = "primary.portal.census.manualEntry.department";
    accountDetails: Accounts;
    benefitsOffered: ApprovalRequest[];
    isFutureDate: boolean;
    employeeIdMaxLength: number;
    isProspect = false;
    stateChildMaxAge: number;
    WI_STATE = "WI";
    CHILD_MAX_AGE_INDEX = 1;
    isStateWI = false;
    stronglyRecommendedEmailConfig$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.STRONGLY_RECOMMEND_EMAIL);
    emailToolTip: string;
    additionalEmailLabel: string;
    workAddressSameAsAccount: boolean;
    worksiteLocationEnabled$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.WORKSITE_LOCATION_ENABLED);
    isEmployerNameFieldEnabled = false;
    isEmployerNameFieldReadOnly = true;
    constructor(
        private readonly fb: FormBuilder,
        private readonly accountProfileservice: AccountProfileService,
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly userService: UserService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly datePipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly route: ActivatedRoute,
        private readonly dialogRef: MatDialogRef<CensusManualEntryComponent>,
        private readonly utilService: UtilService,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: DialogPermissionData,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly commonService: CommonService,
        private readonly sharedService: SharedService,
        private readonly titleCase: TitleCasePipe,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly accountProfileBusinessService: AccountProfileBusinessService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly authenticationService: AuthenticationService,
        private readonly dateService: DateService,
    ) {
        this.fetchLanguageStrings();
        this.mpGroup = this.dialogData.mpGroupId;
        forkJoin([
            this.store.dispatch(new SetRegex()),
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*")),
            this.accountService.getAccount(this.mpGroup.toString()),
        ])
            .pipe(
                flatMap((data) => {
                    this.accountDetails = data[ACCOUNT_DETAILS_RESPONSE_INDEX];
                    return this.regex$;
                }),
                tap((data) => {
                    this.isLoading = true;
                    if (data) {
                        this.validationRegex = data;
                        this.isLoading = false;
                    }
                }),
                switchMap(() => this.sharedService.isEmployerNameFieldEnabled(this.mpGroup)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([isEmployerNameFieldEnabled, isEmployerNameFieldReadOnly]) => {
                this.isEmployerNameFieldEnabled = isEmployerNameFieldEnabled;
                this.isEmployerNameFieldReadOnly = isEmployerNameFieldReadOnly;
                this.initializeForms();
            });
    }

    /**
     * This is initial function to get unpluggedFeature,route after login,user credentials, account type and dependent relations.
     */
    ngOnInit(): void {
        this.stronglyRecommendedEmailConfig$.pipe(takeUntil(this.unsubscribe$)).subscribe((config) => {
            this.additionalEmailLabel = config
                ? this.languageStringsArray["primary.portal.common.stronglyRecommended"]
                : this.languageStringsArray["primary.portal.common.optional"];
            this.emailToolTip = this.languageStringsArray["primary.portal.common.stronglyRecommended.email.tooltip"].replace(
                "##Type##",
                this.languageStringsArray["primary.portal.common.employee"],
            );
        });
        this.isMobile = false;
        this.unpluggedFeatureFlag = false;
        this.showAddDependentButton();
        this.routerAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        this.getCredentials();
        this.isLoading = true;
        this.isProspect = this.router.url.includes(PROSPECT);
        this.getDependentRelations();
        this.sharedService
            .getStateZipFlag()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.isLoading = resp;
            });
        this.benefitsService
            .getApprovalRequests(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.benefitsOffered = resp;
                this.isShopEnabled = !!this.benefitsOffered?.length;
            });
    }
    fetchSecondaryLanguages(): void {
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.census.manualEntry.requiredField",
            "secondary.portal.census.manualEntry.invalidDateFormat",
            "secondary.portal.census.manualEntry.employeeMinHireAge",
            "secondary.portal.census.manualEntry.employeeMaxHire",
            "secondary.portal.census.manualEntry.futureDate",
            "secondary.portal.census.manualEntry.birthDateError",
            "secondary.portal.census.manualEntry.employeeMaxAge",
            "secondary.portal.census.manualEntry.spouseValidAge",
            "secondary.portal.census.manualEntry.maxChildAge",
            "secondary.portal.census.manualEntry.hoursPerWeekMoreThan45",
            "secondary.portal.census.manualEntry.spouseMaxAge",
            "secondary.portal.census.manualEntry.mustBePastDate",
            "secondary.portal.common.sorryPermissionDenied",
            "secondary.portal.common.memberAlreadyExists",
            "secondary.portal.common.internalServerError",
            "secondary.portal.census.manualEntry.birthdateMustBePastOrPresent",
            "secondary.portal.census.manualEntry.spouseIsYoung",
            "secondary.portal.census.manualEntry.dependentChildNotMoreThan26",
            "secondary.portal.census.manualEntry.duplicateEmployeeID",
            "secondary.portal.census.manualEntry.workhourRange",
            "secondary.portal.census.manualEntry.provideSalaryWorkHours",
            "secondary.portal.census.manualEntry.memberTooYoung",
            "secondary.portal.register.personalInfo.badParameter",
            "secondary.portal.common.work.errHoursPerWeekMax",
            "secondary.portal.common.work.errHoursPerWeekMin",
            "secondary.portal.common.work.errHoursPerWeekDecimal",
            "secondary.portal.census.manualEntry.400.badParameter.emailAddresses",
            "secondary.portal.census.manualEntry.400.badParameter.phoneNumbers",
            "secondary.portal.register.personalInfo.api.duplicateMemberError",
            "secondary.portal.census.manualEntry.departmentSizeError",
            "secondary.portal.census.manualEntry.duplicateDependentError",
            FIRST_NAME_MSG,
        ]);
    }

    /**
     * This function is used to get the min and max length for username field from config.
     * @returns void
     */
    getHoursPerWeekConfiguration(): void {
        this.staticUtilService
            .cacheConfigs([
                ConfigName.MIN_HOURS_PER_WEEK,
                ConfigName.MAX_HOURS_PER_WEEK,
                ConfigName.CHILD_MAX_AGE,
                ConfigName.EMPLOYEE_ID_MAX_LENGTH,
                ConfigName.CHILDREN_MAX_AGE,
            ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([minValue, maxValue, childAge, maxEmployeeId, stateChildMaxAge]) => {
                this.hoursPerWeekMinConfig = +minValue?.value;
                this.hoursPerWeekMaxConfig = +maxValue?.value;
                this.maxChildAge = +childAge?.value;
                this.employeeIdMaxLength = +maxEmployeeId?.value;
                this.workInfoForm.controls.hoursPerWeek.setValidators([
                    Validators.pattern(this.validationRegex.HOURSPERWEEK),
                    Validators.min(this.hoursPerWeekMinConfig),
                    Validators.max(this.hoursPerWeekMaxConfig),
                ]);
                const stateMaxAge = stateChildMaxAge.value.split(",").find((state) => state.includes(this.WI_STATE));
                this.stateChildMaxAge = stateMaxAge ? +stateMaxAge.split("=")[this.CHILD_MAX_AGE_INDEX] : null;
                this.hoursPerWeekMoreThanMaxErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errHoursPerWeekMax"
                ].replace("##MAXHOURS##", String(this.hoursPerWeekMaxConfig));
                this.hoursPerWeekMoreThanMinErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errHoursPerWeekMin"
                ].replace("##MINHOURS##", String(this.hoursPerWeekMinConfig));
            });
    }

    /**
     * initializes the forms for this component
     */
    initializeForms(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal === this.portalTypeAdminVal) {
            this.isShopEnabled = false;
        } else {
            this.isShopEnabled = true;
        }
        if (this.portal === AppSettings.PORTAL_PRODUCER) {
            this.isProducer = true;
        }
        this.canOnlyCreateTestMember = this.dialogData.canOnlyCreateTestMember;
        this.canCreateTestMember = this.dialogData.canCreateTestMember;
        this.canCreateMember = this.dialogData.canCreateMember;
        this.isQuoteShopPage = this.dialogData.isQuoteShopPage;
        this.sistusStateData = this.store.selectSnapshot(AccountListState.getGroup);
        this.fetchSecondaryLanguages();
        if (this.accountDetails) {
            this.groupPartnerId = this.accountDetails.partnerId;
            this.isAccountRatingCodePEO = this.accountDetails.ratingCode === RatingCode.PEO;
            iif(
                () => this.isAccountRatingCodePEO,
                this.accountProfileBusinessService.getEmployeePEOClasses(this.mpGroup.toString(), CarrierId.AFLAC),
                this.accountProfileBusinessService.getOrganizationData(
                    this.mpGroup.toString(),
                    this.isAflacUSer,
                    this.CORPORATE,
                    this.UNDEFINED,
                ),
            )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    /**
                     * The data is assign based on boolean flag isAccountRatingCodePEO
                     * if isAccountRatingCodePEO is true then data assign to this.peoDepartments
                     * if isAccountRatingCodePEO is false then data assign to this.organizations
                     */
                    if (this.isAccountRatingCodePEO) {
                        // filteredPeoClasses will gives us PEO classes by removing UNSP peo class from response.
                        const filteredPeoClasses = this.utilService.copy(data).filter((peoElement) => peoElement.name !== this.UNSPECIFIED);
                        if (filteredPeoClasses.length) {
                            this.peoDepartments = filteredPeoClasses;
                        } else {
                            this.peoDepartments = data;
                        }
                    } else {
                        this.employeesDepartments = data;
                        this.employeesDepartments = this.employeesDepartments.filter((depart) => depart.name !== this.UNDEFINED);
                        this.isWorkInfoHireDate = true;
                    }
                });
            this.workInfoData();
            this.getHoursPerWeekConfiguration();
            this.commonService
                .getLanguages(this.DEPARTMENT_LABEL_LANGUAGE_KEY, undefined, undefined, this.groupPartnerId.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((languages) => {
                    this.departmentLabel = languages[0].value;
                });
            this.isAflacUSer = this.groupPartnerId === PartnerId.AFLAC;
            if (this.isAflacUSer) {
                this.getGroupAttributes();
            }
        }
        if (this.sistusStateData) {
            if (this.sistusStateData.state) {
                this.situsState = this.sistusStateData.state;
            } else if (this.sistusStateData.situs) {
                this.situsState = this.sistusStateData.situs.state.abbreviation;
            } else {
                this.situsState = this.accountDetails.situs.state.abbreviation;
            }
        }
        this.phoneNumberTypes = [ContactType.HOME, ContactType.WORK];
        this.changeStepper = 1;
        this.selectLabel = this.language.fetchPrimaryLanguageValue("primary.portal.common.select");
        this.englishLabel = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.dropdownEngish");
        this.getConfigs();
        this.employeeForm = this.fb.group({
            firstName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            lastName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            birthDate: ["", Validators.required],
            genderName: ["", Validators.required],
            state: ["", [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: ["", [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            emailAddress: ["", Validators.pattern(this.validationRegex.EMAIL)],
            phoneNumber: ["", Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))],
            phoneType: [ContactType.HOME],
            cellType: [{ value: false, disabled: true }],
            testEmployee: [{ value: this.canOnlyCreateTestMember, disabled: this.canOnlyCreateTestMember }],
            deliveryPreferance: [CorrespondenceType.ELECTRONIC],
            languagePreference: ["ENGLISH"],
        });
        this.dependentsForm = this.fb.group({});
        this.getEmployeeState();
        this.getEmployeeGender();
        this.getEmployeeLanguage();
        this.isEmpDOBInvalid = true;
        if (this.isQuoteShopPage) {
            this.dataTobePrepopulated = this.store.selectSnapshot(EnrollmentMethodState.getGenericContactInfo);
            this.employeeForm.controls.state.setValue(this.dataTobePrepopulated.state);
            this.employeeForm.controls.zip.setValue(this.dataTobePrepopulated.zip);
            this.employeeForm.controls.birthDate.setValue(this.dataTobePrepopulated.birthDate);
            this.employeeForm.controls.gender.setValue(this.dataTobePrepopulated.gender);
        }
    }

    /**
     * This function is used to get dependent relations form accountService.
     * @returns void
     */
    getDependentRelations(): void {
        /**
         * passing mpGroup to getDependentRelations api to get dependent relations.
         */
        this.accountService
            .getDependentRelations(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.dependentsReleation = res;
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }
    getGroupAttributes(): void {
        this.accountService
            .getGroupAttributesByName([AppSettings.IS_EMPLOYEE_ID_REQUIRED, AppSettings.IS_DEPARTMENT_ID_REQUIRED], this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp && resp.length) {
                    resp.forEach((attribute, index) => {
                        if (attribute && attribute.attribute === AppSettings.IS_EMPLOYEE_ID_REQUIRED) {
                            if (attribute.value.toString() === AppSettings.TRUE) {
                                this.isEmployeeIdRequired = true;
                                this.workInfoForm.controls.employeeId.setValidators([
                                    Validators.required,
                                    Validators.pattern(this.validationRegex.EMPLOYEE_ID),
                                ]);
                            } else if (attribute.value.toString() === AppSettings.FALSE) {
                                this.isEmployeeIdRequired = false;
                                this.workInfoForm.controls.employeeId.setValidators(Validators.pattern(this.validationRegex.EMPLOYEE_ID));
                            }
                        }
                        if (
                            attribute &&
                            attribute.attribute === AppSettings.IS_DEPARTMENT_ID_REQUIRED &&
                            attribute.value.toString() === AppSettings.TRUE
                        ) {
                            this.isDepartmentRequired = true;
                            this.workInfoForm.controls.department.setValidators([Validators.required]);
                        }
                    });
                }
            });
    }
    getCredentials(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((res: any) => {
            this.credentails = res;
        });
    }

    /**
     * Function to fetch configs from database
     */
    getConfigs(): void {
        combineLatest([
            this.staticUtilService.fetchConfigs(
                [
                    ConfigName.MINIMUM_SUBSCRIBER_AGE,
                    ConfigName.SPOUSE_MINIMUM_AGE,
                    ConfigName.FUTURE_DAYS_ALLOWED_FOR_NEW_HIRE_DATE,
                    ConfigName.UNPLUGGED_CONFIG,
                ],
                this.mpGroup,
            ),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([[minimumSubscriberAge, minimumSpouseAge, minimumFutureDays, unpluggedFeatureFlag]]) => {
                this.minimumSubscriberAge = parseInt(minimumSubscriberAge.value, 10);
                this.minimumSpouseAge = +minimumSpouseAge.value;
                this.minimumFutureDays = parseInt(minimumFutureDays.value, 10);
                this.maxHireDate.setDate(this.maxHireDate.getDate() + this.minimumFutureDays);

                // Check for Unplugged feature
                this.unpluggedFeatureFlag = this.staticUtilService.isConfigEnabled(unpluggedFeatureFlag);
            });
    }
    workInfoData(value?: number): void {
        this.workInfoForm = this.fb.group({
            hireDate: ["", Validators.required],
            employeeId: [""],
            hoursPerWeek: [
                "",
                [
                    Validators.pattern(this.validationRegex.HOURSPERWEEK),
                    Validators.min(this.hoursPerWeekMinConfig),
                    Validators.max(this.hoursPerWeekMaxConfig),
                ],
            ],
            annualSalary: [
                "",
                [Validators.pattern(this.validationRegex.ANNUAL_SALARY), Validators.min(MIN_SALARY), Validators.max(MAX_SALARY)],
            ],
            department: [value],
        });
        this.addWorkStateAndZipFormControls();
        if (this.isAccountRatingCodePEO) {
            this.workInfoForm.controls.department.setValidators(Validators.required);
            this.workInfoForm.controls.department.updateValueAndValidity();
        }
        if (this.isEmployerNameFieldEnabled) {
            // If employerName field config is enabled, then add employerName control
            this.workInfoForm.addControl(
                "employerName",
                this.fb.control(
                    {
                        value: this.isEmployerNameFieldReadOnly ? this.accountDetails.name : "",
                        disabled: this.isEmployerNameFieldReadOnly,
                    },
                    this.isEmployerNameFieldReadOnly ? Validators.nullValidator : [Validators.maxLength(100)],
                ),
            );
        }
    }

    /**
     * Creates the dependent info form
     * @returns created form
     */
    addDependentForm(): FormGroup {
        return this.fb.group({
            firstName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            lastName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            birthDate: ["", [Validators.required, Validators.pattern(this.validationRegex.GENERAL_DATE)]],
            gender: ["", Validators.required],
            state: [this.employeeForm.controls.state.value, [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: [this.employeeForm.controls.zip.value, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            dependentRelationId: ["", Validators.required],
        });
    }

    /**
     * This function is used for validating state and zip code
     * @param value : zip code value
     * @param currentForm : current form group
     */
    checkZipCode(value: string, currentForm?: FormGroup): void {
        this.subscriptions.push(
            validateStateAndZipCode(currentForm.value.state, value, currentForm.controls.zip, this.staticService, this.sharedService),
        );
    }

    /**
     * This function is used for validating work state and zip code
     * @param state work state value
     * @param zip work zip value
     */
    checkWorkZipCode(state: string, zip: string): void {
        if (state && zip) {
            this.subscriptions.push(
                validateStateAndZipCode(state, zip, this.workInfoForm.controls.zip, this.staticService, this.sharedService),
            );
        }
        if (state && !zip) {
            this.workInfoForm.controls.zip.setErrors({ workZipRequired: true });
        }
        if (!state && zip) {
            this.workInfoForm.controls.state.setErrors({ workStateRequired: true });
        }
        if (zip && zip.length !== 5 && zip.length !== 9) {
            this.workInfoForm.controls.zip.setErrors({ length: true });
        }
        if (!zip && !state) {
            this.workInfoForm.controls.state.reset();
            this.workInfoForm.controls.zip.reset();
        }
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    getDependentId(response: any[]): void {
        let length = this.dependentsId.length ? this.dependentsId.length : 0;
        response.forEach((resp) => {
            const dependentId = parseInt(resp.headers.get("location").split("/")[7], 10);
            this.dependentsId[length] = dependentId;
            length++;
        });
    }

    /**
     * determine whether a number belongs to a mobile phone
     * @param evt indicates whether the cellType checkbox is checked
     */
    cellType(evt: any): void {
        this.isMobile = evt.checked;
    }
    phoneNumberValid(): void {
        if (this.employeeForm.controls["phoneNumber"].invalid && this.employeeForm.controls["phoneNumber"].value === "") {
            this.employeeForm.controls["cellType"].disable();
        } else {
            this.employeeForm.controls["cellType"].enable();
        }
    }

    /**
     * This method will be called on occurance of duplicate contact error for saveMemberContact()
     * @param erresp it is http error response
     * @returns language string on the basis of error response.
     */
    duplicateContactError(erresp: HttpErrorResponse): string {
        if (erresp.error.details && erresp.error.details.length && erresp.error.details[0].code) {
            return this.secondaryLanguageStrings[
                `secondary.portal.census.manualEntry.${erresp.status}.${erresp.error.code}.${erresp.error.details[0].field}`
            ];
        }
        return this.secondaryLanguageStrings["secondary.portal.register.personalInfo.badParameter"];
    }
    /**
     * Method to get employee state
     */
    getEmployeeState(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((states) => {
                this.employeeStates = states;
                this.employeeStateOptions = this.employeeForm.get(STATE_FORM_CONTROL).valueChanges.pipe(
                    startWith(""),
                    map((value) => this.filteredState(value)),
                );
            });
    }

    private filteredState(value: string): string[] | undefined {
        if (this.employeeStates) {
            const filterValue = value.toLowerCase();
            return this.employeeStates.filter((option) => option.abbreviation.toLowerCase().indexOf(filterValue) === 0);
        }
        return undefined;
    }

    getEmployeeGender(): void {
        this.staticService
            .getGenders()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((genders) => {
                this.employeeGenders = this.memberService.refactorGenders(genders);
            });
    }

    getEmployeeLanguage(): void {
        this.accountService
            .getVocabularies(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.preferredLangOptions = Response;
            });
    }
    stepChanged(event: any): void {
        this.changedName = `: ${this.employeeForm.controls.firstName.value} ${this.employeeForm.controls.lastName.value}`;
        if (this.employeeForm.get("testEmployee").value) {
            this.changedName = `${this.changedName} (${this.langStrings["primary.portal.census.manualEntry.test"]})`;
        }
        if (event.selectedIndex === 0) {
            this.changeStepper = this.step1;
        } else if (event.selectedIndex === 1) {
            this.changeStepper = this.step2;
            if (!this.showAddDependents) {
                this.step3 = this.step2;
                this.buttonClicked();
            }
        } else {
            this.changeStepper = this.step3;
        }
    }
    /**
     * @description function executed on clicking back button
     */
    onClickBack(): void {
        if (this.isMobile) {
            this.employeeForm.controls["cellType"].setValue(true);
        } else {
            this.employeeForm.controls["cellType"].setValue(false);
        }
        if (this.changeStepper === this.step2) {
            this.changeStepper = this.step1;
            this.errorResponse = false;
        } else {
            this.changeStepper = this.step2;
            this.dependentResponse = false;
        }
    }

    /**
     * check error message for employee form data
     * @param formControlName form control data
     * @returns error message
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        if (formControlName === "genderName" || formControlName === STATE_FORM_CONTROL) {
            return this.employeeForm.controls[formControlName].hasError("required") ? "primary.portal.common.selectionRequired" : "";
        }
        return this.employeeForm.controls[formControlName].hasError("required") ? "primary.portal.common.requiredField" : "";
    }

    /**
     * check error message for dependents form data
     * @param iteration position of form control
     * @param formControlName form control data
     * @returns error message
     */
    getDependentsFormErrorMessage(iteration: string, formControlName: string): string {
        if (
            formControlName === DEPENDENT_RELATIONS_ID_FORM_CONTROL ||
            formControlName === STATE_FORM_CONTROL ||
            formControlName === GENDER_FORM_CONTROL
        ) {
            return this.dependentsForm.controls[iteration][FORM_CONTROLS][formControlName].hasError("required")
                ? "primary.portal.common.selectionRequired"
                : "";
        }
        return this.dependentsForm.controls[iteration][FORM_CONTROLS][formControlName].hasError("required")
            ? "primary.portal.common.requiredField"
            : "";
    }
    getWorkInfoFormErrorMessage(formControlName: string): string {
        return this.workInfoForm.controls[formControlName].hasError("required") ? "primary.portal.common.selectionRequired" : "";
    }

    onClickOnRemove(value: string): void {
        this.dependentsForm.removeControl(value);
        const index = this.dependentsFormMap.indexOf(value);
        this.dependentsFormMap.splice(index, 1);
        this.dependentsCount--;
        this.relationshipType.splice(index, 1);
        this.isDependentFormInvalid = false;
        this.dependentResponse = false;
        this.genderError = false;
        this.duplicateDependentError = false;
        this.workInfoResponse = false;
        if (this.dependentsCount === 0) {
            this.enableDependentFlag = false;
        }
        this.updateSpouseSelection(value);
    }
    markFormGroupTouched(formGroup: FormGroup): void {
        (Object as any).values(formGroup.controls).forEach((control) => {
            if (!(control.value && control.value !== "")) {
                control.markAsTouched();
            }

            if (control.controls) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /**
     * get error message for name entered
     * @param form form  data
     * @param control form control data
     * @param iteration position of form control
     * @returns error message
     */
    getNameErrorMessages(form: string, control: string, iteration?: string): string | undefined {
        switch (form) {
            case EMPLOYEE_FORM:
                if (
                    (this.isEmployeeFormSubmit || this.employeeForm.controls[control].touched) &&
                    !this.employeeForm.controls[control].value
                ) {
                    return "primary.portal.common.requiredField";
                }
                if (
                    this.employeeForm.controls[control].value.startsWith("-") ||
                    this.employeeForm.controls[control].value.startsWith("'") ||
                    this.employeeForm.controls[control].value.endsWith("-") ||
                    this.employeeForm.controls[control].value.endsWith("'")
                ) {
                    return this.employeeForm.controls[control].hasError("pattern")
                        ? "secondary.portal.members.personalValidationMsg.firstNameMsg2"
                        : "";
                }
                return this.employeeForm.controls[control].hasError("pattern") ? FIRST_NAME_MSG : "";
            case DEPENDENTS_INFO_FORM:
                this.dependentDOB = true;
                if (this.isDependentFormInvalid && !this.dependentsForm.controls[iteration][FORM_CONTROLS][control].value) {
                    return "primary.portal.common.requiredField";
                }
                if (
                    this.dependentsForm.controls[iteration][FORM_CONTROLS][control].value.startsWith("-") ||
                    this.dependentsForm.controls[iteration][FORM_CONTROLS][control].value.startsWith("'") ||
                    this.dependentsForm.controls[iteration][FORM_CONTROLS][control].value.endsWith("-") ||
                    this.dependentsForm.controls[iteration][FORM_CONTROLS][control].value.endsWith("'")
                ) {
                    return this.dependentsForm.controls[iteration][FORM_CONTROLS][control].hasError("pattern")
                        ? "secondary.portal.census.manualEntry.hyphenandapostrophes"
                        : "";
                }
                return this.dependentsForm.controls[iteration][FORM_CONTROLS][control].hasError("pattern") ? FIRST_NAME_MSG : "";
        }
        return undefined;
    }
    /**
     * Method to validate dependent birth date
     * @param control : control of birth date form field
     * @param form : name of the form
     * @param event : value of birth date form control
     * @param iteration : iteration of the form controls
     * @returns {string} error message if date is invalid
     */
    validateDependentDate(control: string, form: string, event: string, iteration?: string): string | undefined {
        const dateLength: boolean = event.length === this.dateFormat.length;
        const dependentFormControl = this.dependentsForm.controls[iteration][FORM_CONTROLS];
        if (!event && (!dependentFormControl[BIRTH_DATE_CONTROL].value || dependentFormControl[BIRTH_DATE_CONTROL].value === "")) {
            dependentFormControl[BIRTH_DATE_CONTROL].setErrors({ required: true });
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.requiredField"];
        }
        dependentFormControl[control].setErrors({ invalid: true });
        if (dateLength && (dependentFormControl[control].value === null || dependentFormControl[control].value === "") && event !== "") {
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.invalidDateFormat"];
        }
        if (dateLength) {
            const dependentDOB = this.dateService.toDate(dependentFormControl[control].value);
            return this.dateValidation(dependentDOB, form, iteration, control);
        }
        return undefined;
    }

    /**
     * Method to validate date
     * @param control : control of date form field
     * @param form : name of the form
     * @param event : value of date form control
     * @param iteration : iteration of the form controls
     * @returns {string} error message if date is invalid
     */
    validateDate(control: string, form: string, event: string, iteration?: string): string | undefined {
        const dateLength: boolean = event.length === this.dateFormat.length;
        switch (form) {
            case EMPLOYEE_FORM: {
                const dateInput = this.dateService.toDate(this.employeeForm.controls[control].value);
                const month = dateInput.getMonth() + ADD_ONE_TO_MONTH;
                if (this.isEmployeeFormSubmit && !this.employeeForm.controls[control].value) {
                    this.employeeForm.controls.birthDate.setErrors({ required: true });
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.requiredField"];
                }
                this.employeeForm.controls.birthDate.setErrors({ invalid: true });
                if (
                    dateLength &&
                    (this.employeeForm.controls[control].value === null || this.employeeForm.controls[control].value === "" || !month) &&
                    event !== ""
                ) {
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.invalidDateFormat"];
                }
                if (dateLength) {
                    return this.dateValidation(dateInput, form);
                }
                break;
            }
            case DEPENDENTS_INFO_FORM:
                return this.validateDependentDate(control, form, event, iteration);
            case WORK_INFO_FORM:
                if (this.isWorkInfoFormInvalid && !this.workInfoForm.controls.hireDate.value) {
                    this.workInfoForm.controls.hireDate.setErrors({ required: true });
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.requiredField"];
                }
                this.workInfoForm.controls.hireDate.setErrors({ invalid: true });
                if (
                    dateLength &&
                    (this.workInfoForm.controls.hireDate.value === null || this.workInfoForm.controls.hireDate.value === "") &&
                    event !== ""
                ) {
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.invalidDateFormat"];
                }
                if (dateLength) {
                    const hireDate = this.dateService.toDate(this.workInfoForm.controls.hireDate.value);
                    return this.dateValidation(hireDate, form);
                }
                break;
        }
        return undefined;
    }

    /**
     * This method does the validations for Hire Date
     * @param dateInput is the date chosen by the user as hire date
     * @param form form data
     * @param iteration position of form control
     * @param control form control data
     * @returns language string that specifies hire date
     */
    validateHireDate(dateInput: Date, form: string, iteration?: string, control?: string): string {
        const dob = this.dateService.toDate(this.employeeForm.controls.birthDate.value);
        const diffYears = dateInput.getFullYear() - dob.getFullYear();
        const monthDiff = dateInput.getMonth() - dob.getMonth();
        const dayDiff = dateInput.getDate() - dob.getDate();
        if (
            dateInput.getFullYear() - dob.getFullYear() <= this.minimumSubscriberAge &&
            this.birthDateAndHireDateDiff(diffYears, monthDiff, dayDiff)
        ) {
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.employeeMinHireAge"];
        }
        if (dateInput > this.maxHireDate) {
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.employeeMaxHire"];
        }
        this.isFutureDate = this.today < dateInput;
        this.workInfoForm.controls.hireDate.setErrors(null);
        return null;
    }
    /**
     * Method to find dependent child max age
     * @param iteration : iteration of the form control
     * @returns {number} dependent child max age
     */
    getMaxChildAge(iteration: string): number {
        const state = this.dependentsForm.controls[iteration][FORM_CONTROLS].state.value;
        if (state && state === this.WI_STATE) {
            this.isStateWI = true;
            return this.stateChildMaxAge;
        }
        this.isStateWI = false;
        return this.maxChildAge;
    }
    /**
     * method to check error in dependent child age
     * @returns {string} error message for dependent child age error
     */
    checkDependentChildAgeError(): string {
        if (this.isStateWI) {
            return this.languageStringsArray["primary.portal.members.dependentValidationMsg.WIState"].replace(
                "##stateChildMaxAge##",
                String(this.stateChildMaxAge),
            );
        }
        return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.maxChildAge"];
    }
    /**
     * Method to validate date based on form
     * @param dateInput : input value of date form field
     * @param form : name of the form
     * @param iteration : iteration of the form controls
     * @param control : control of date form field
     * @returns {string} error message if date is invalid
     */
    dateValidation(dateInput: Date, form: string, iteration?: string, control?: string): string | null | undefined {
        const diffYears = this.today.getFullYear() - dateInput.getFullYear();
        const childAge = this.dateService.getDifferenceInYears(this.today, this.dateService.toDate(dateInput));
        const monthDiff = this.today.getMonth() - dateInput.getMonth();
        const dayDiff = this.today.getDate() - dateInput.getDate();

        this.minDate = null;

        if (dateInput <= this.today && !(dateInput.getMonth() + 1 && dateInput.getDate() && dateInput.getFullYear())) {
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.invalidDateFormat"];
        }
        if (form === WORK_INFO_FORM) {
            return this.validateHireDate(dateInput, form, iteration, control);
        }
        if (this.today < dateInput) {
            return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.futureDate"];
        }
        if (form === EMPLOYEE_FORM) {
            if (
                this.today.getFullYear() - dateInput.getFullYear() <= this.minimumSubscriberAge &&
                this.birthDateAndHireDateDiff(diffYears, monthDiff, dayDiff)
            ) {
                return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.birthDateError"].replace(
                    "#birthdate",
                    this.minimumSubscriberAge.toString(),
                );
            }
            if (dateInput.getFullYear() < this.maxEmployeeAge) {
                return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.employeeMaxAge"];
            }
            this.employeeForm.controls.birthDate.setErrors(null);
            return null;
        }
        if (form === DEPENDENTS_INFO_FORM) {
            const relation = this.dependentsForm.controls[iteration][FORM_CONTROLS][DEPENDENT_RELATIONS_ID_FORM_CONTROL].value;
            const maxChildAge = this.getMaxChildAge(iteration);
            if (relation && relation === SPOUSE_RELATION_ID) {
                if (
                    this.today.getFullYear() - dateInput.getFullYear() <= this.minimumSpouseAge &&
                    this.birthDateAndHireDateDiff(diffYears, monthDiff, dayDiff)
                ) {
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.spouseValidAge"] + this.minimumSpouseAge;
                }
                if (dateInput.getFullYear() < this.maxEmployeeAge) {
                    return this.secondaryLanguageStrings["secondary.portal.census.manualEntry.spouseMaxAge"];
                }
            } else if (relation && relation !== SPOUSE_RELATION_ID && childAge >= maxChildAge) {
                this.minDate = this.dateService.getYearOfBirthFromToday(maxChildAge);
                return this.checkDependentChildAgeError();
            }
            this.dependentsForm.controls[iteration][FORM_CONTROLS][control].setErrors(null);
            return null;
        }
        return undefined;
    }
    /**
     * This method is used to calculate the valid  employee age.
     * @param diffYears Difference of current year and employee birth year
     * @param monthDiff Difference of current month and employee birth month
     * @param dayDiff  Difference of current date and employee birth date
     * @returns It returns the boolean value. If employee age is valid then return false or for invalid age it returns true;
     */
    birthDateAndHireDateDiff(diffYears: number, monthDiff: number, dayDiff: number): boolean {
        if (diffYears < this.minimumSubscriberAge) {
            return true;
        }
        if (diffYears === this.minimumSubscriberAge) {
            if (monthDiff < AGE_DIFFERENCE_ZERO) {
                return true;
            }
            if (monthDiff === AGE_DIFFERENCE_ZERO && dayDiff < AGE_DIFFERENCE_ZERO) {
                return true;
            }
        }
        return false;
    }
    buttonClicked(): void {
        if (this.changeStepper === 1) {
            this.empForm.ngSubmit.emit();
            this.markFormGroupTouched(this.employeeForm);
        }
        if (this.changeStepper === 2 && this.dependentsFormMap.length) {
            this.deptForm.ngSubmit.emit();
            this.markFormGroupTouched(this.dependentsForm);
        }
        this.OnClickNext();
    }

    /**
     * Method to check form validity and validate dependents/member
     */
    OnClickNext(): void {
        this.duplicateDependentError = false;
        this.changedName = ": " + this.employeeForm.controls.firstName.value + " " + this.employeeForm.controls.lastName.value;
        if (this.changeStepper === 1) {
            if (this.employeeForm.invalid || this.employeeForm.controls.birthDate.value === "") {
                this.employeeForm.controls.birthDate.setErrors({ required: true });
                const firstElementWithError = document.querySelector(".ng-invalid");
                if (firstElementWithError) {
                    firstElementWithError.scrollIntoView({ behavior: "smooth" });
                }
                this.employeeForm.controls.birthDate.setErrors(null);
                this.isEmployeeFormSubmit = true;
                this.isDependentFormInvalid = false;
                this.isWorkInfoFormInvalid = false;
            } else if (this.zipFlag === false) {
                const empState = this.employeeForm.controls.state.value;
                this.stateAbr = this.employeeForm.controls.state.value;
                const empZip = this.employeeForm.controls.zip.value;
                this.dependentsForm.patchValue({
                    state: empState,
                    zip: empZip,
                });
                this.isLoading = true;
                if (!this.updateMemberFlag) {
                    this.validateMember(false);
                } else {
                    this.saveEmployeeInformation();
                }
            }
        } else if (this.changeStepper === this.step2) {
            this.dependentDOB = true;
            this.stepPosition = this.step1;
            if (this.dependentsForm.invalid) {
                this.isEmployeeFormSubmit = false;
                this.isDependentFormInvalid = true;
                this.isWorkInfoFormInvalid = false;
                this.validStatus++;
                this.genderError = true;
                this.isDependentRequired = true;
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = false;
                }
            } else if (this.checkDuplicateDependent()) {
                this.isEmployeeFormSubmit = false;
                this.isDependentFormInvalid = true;
                this.isWorkInfoFormInvalid = false;
                this.validStatus++;
                this.duplicateDependentError = true;
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = false;
                }
            } else if (this.dependentsFormMap.length) {
                this.isLoading = true;
                if (!this.updateDependentFlag) {
                    this.validateDependentInfo(true);
                } else {
                    this.isLoading = false;
                    this.validStatus++;
                    this.changeStepper = this.step3;
                    this.stepPosition = this.step2;
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                }
            } else if (!this.dependentsFormMap.length) {
                this.validStatus++;
                this.changeStepper = this.step3;
                this.stepPosition = this.step2;
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = true;
                }
            }
        }
    }
    /**
     * Method to enable dependent form
     */
    enableDependent(): void {
        this.dependentsCount++;
        this.enableDependentFlag = true;
        const form = DEPENDENT_FORM + (this.totalDependentsCount - 1);
        this.dependentsForm.addControl(form, this.addDependentForm());
        this.relationshipType[form] = this.relationshipTypes;
        this.dependentsFormMap.push(form);
    }
    addAnotherDependent(): void {
        this.isLoading = true;
        this.validateDependentInfo(false);
    }

    /**
     * Checking for duplicate dependent in list.
     * @returns boolean flag for having duplicate dependent
     */
    checkDuplicateDependent(): boolean {
        const dependentList: MemberDependent[] = this.dependentsFormMap.map((form) =>
            this.getDependentForm(this.dependentsForm.controls[form][FORM_CONTROLS]),
        );
        return dependentList.some(
            (dependent) =>
                dependentList.filter(
                    (record) =>
                        (record.dependentRelationId === dependent.dependentRelationId &&
                            record.dependentRelationId === SPOUSE_RELATION_ID) ||
                        (record.name.firstName === dependent.name.firstName &&
                            record.name.lastName === dependent.name.lastName &&
                            record.birthDate === dependent.birthDate),
                ).length > 1,
        );
    }

    /**
     * function to create new organization
     */
    saveNewDepartment(): void {
        const payload = {
            name: this.workInfoForm.controls.newDepartmentId.value,
            code: this.workInfoForm.controls.newDepartmentId.value,
            parentId: this.PARENT_ID,
        };
        this.accountProfileservice
            .createOrganization(payload)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    const eleArray = Response.headers.get("location").split("/");
                    this.newDepartmentId = +eleArray[eleArray.length - 1];
                    this.isDepartmentIdCreated = true;
                    if (!this.updateMemberFlag) {
                        this.validateMember(true);
                    } else {
                        this.saveEmployeeInformation();
                    }
                },
                (error) => {
                    this.workInfoMsg = this.languageStringsArray["primary.portal.census.manualEntry.notSaved"];
                },
            );
    }
    /**
     * set the route url and redirect to the employee profile based on portal and account type
     */
    nevigateToPersonalInfo(): void {
        if (this.errorResponse === false && this.memberId != null) {
            let url = "";
            const portal = this.portal.toLowerCase();
            if (this.credentails && this.credentails.producerId) {
                const subUrl = this.isProspect ? `/${PROSPECT}` : "";
                url = `/${portal}/payroll${subUrl}/${this.mpGroup}/member/${this.memberId}/memberadd`;
            } else if (this.credentails && this.credentails.adminId) {
                url = `/${portal}/accountList/${this.mpGroup}/member/${this.memberId}/memberadd`;
            }
            this.router
                .navigate(
                    this.isProspect ? [url] : [url, { id: this.memberId, mpGroupId: this.mpGroup }],
                    this.isProspect ? { relativeTo: this.route } : { skipLocationChange: true },
                )
                .finally(() => {
                    this.isLoading = false;
                    this.dialogRef.close();
                });
        }
    }

    checkRadioButtonValidations(control: any): any {
        if (control.value) {
            return null;
        }
        if (!control.value) {
            return { require: true };
        }
    }
    /**
     * This function is used for validating state and zip code
     * @param value zip code value
     * @param index dependent form index
     */
    checkDependentZip(value: string, index: number): void {
        const controlName = this.dependentsFormMap[index];
        const state = this.dependentsForm.controls[`${controlName}`][FORM_CONTROLS][STATE_FORM_CONTROL][FORM_VALUE];
        this.subscriptions.push(
            validateStateAndZipCode(
                state,
                value,
                this.dependentsForm.controls[`${controlName}`][FORM_CONTROLS][ZIP_FORM_CONTROL],
                this.staticService,
                this.sharedService,
            ),
        );
    }
    onClickSaveAndShop(saveAndShop: boolean): void {
        this.isWorkInfoFormInvalid = true;
        this.validateHoursPerWeek();
        this.validateAnnualSalary();
        this.workInfoMsg = "";
        this.workInfoResponse = false;
        if (this.workInfoForm.invalid || this.workInfoForm.controls.hireDate.value === "") {
            this.workinfoflag = true;
            this.isEmployeeFormSubmit = false;
            this.isDependentFormInvalid = false;
            this.isWorkInfoFormInvalid = true;
            this.markFormGroupTouched(this.workInfoForm);
        } else {
            this.saveAndShopFlag = saveAndShop;
            this.isWorkInfoHireDate = true;
            const annualSalary = this.workInfoForm.controls.annualSalary.value;
            const hoursPerWeek = this.workInfoForm.controls.hoursPerWeek.value;
            if (
                (annualSalary !== "" && annualSalary !== null && hoursPerWeek === "") ||
                ((annualSalary === "" || annualSalary === null) && hoursPerWeek !== "")
            ) {
                this.workInfoResponse = true;
                this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.census.manualEntry.provideSalaryWorkHours"];
            } else {
                this.isLoading = true;
                if (this.addNewDepartmentFlag && !this.isDepartmentIdCreated) {
                    this.saveNewDepartment();
                } else if (!this.updateMemberFlag) {
                    this.validateMember(true);
                } else {
                    this.saveEmployeeInformation();
                }
            }
        }
    }
    updateSpouse(index: number, relation: string, formName: string): void {
        if (relation === "Spouse" && !this.isSpouseSelected.length) {
            this.isSpouseSelected[0] = index;
            this.spouseFormName = formName;
        } else if (index === this.isSpouseSelected[0] && relation !== "Spouse") {
            this.isSpouseSelected.splice(0, 1);
            this.spouseFormName = "";
        }
    }
    updateSpouseSelection(formName: string): void {
        if (formName === this.spouseFormName) {
            this.isSpouseSelected.splice(0, 1);
            this.spouseFormName = "";
        }
    }

    /**
     *  Navigate to the shop page.
     *
     * @param details employee information
     */
    specificShopNav(details: Details): void {
        const producerPortal = Portals.PRODUCER.toLowerCase();
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (details.id) {
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(details.id));
            this.store.dispatch(new SetMemberInfo(details));
            if (this.isShopEnabled) {
                if (
                    !(
                        this.specificEnrollmentObj &&
                        (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                        this.specificEnrollmentObj.mpGroup &&
                        this.specificEnrollmentObj.mpGroup === this.mpGroup &&
                        this.visitedMpGroupStateObj.indexOf(this.mpGroup.toString()) >= 0
                    )
                ) {
                    this.isLoading = false;
                    this.dialog.open(EnrollmentMethodComponent, {
                        backdropClass: "backdrop-blur",
                        maxWidth: "600px", // 600px max-width based on the definition in abstract.
                        panelClass: "shopping-experience",
                        data: {
                            mpGroup: this.mpGroup,
                            detail: details,
                            route: this.route,
                            stateAbbr: this.situsState,
                            openingFrom: NEW_EMPLOYEE,
                        },
                    });
                    this.closePopup();
                } else {
                    const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                    this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                    if (
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                    ) {
                        this.memberService
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    if (result) {
                                        if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                            this.dialog.open(EnrollmentMethodComponent, {
                                                backdropClass: "backdrop-blur",
                                                maxWidth: "600px", // 600px max-width based on the definition in abstract.
                                                panelClass: "shopping-experience",
                                                data: {
                                                    mpGroup: this.mpGroup,
                                                    detail: details,
                                                    route: this.route,
                                                    stateAbbr: this.situsState,
                                                    openingFrom: NEW_EMPLOYEE,
                                                },
                                            });
                                        } else {
                                            this.openConfirmAddressDialogForShop(details, currentEnrollmentObj);
                                        }
                                    }
                                    this.isLoading = false;
                                    this.closePopup();
                                },
                                (_error) => {
                                    this.isLoading = false;
                                    this.closePopup();
                                },
                            );
                    } else {
                        this.portal = "/" + this.portal.toLowerCase();
                        this.memberService
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(details.id));
                                    this.store.dispatch(new SetMemberInfo(details));
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentState: this.enrollmentState.currentEnrollment.enrollmentState,
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                            enrollmentCity: currentEnrollmentObj.enrollmentCity,
                                        }),
                                    );
                                    if (result) {
                                        if (!this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr)) {
                                            this.sharedService.changeProducerNotLicensedInEmployeeState(
                                                !this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr),
                                            );
                                        } else {
                                            this.sharedService.changeProducerNotLicensedInEmployeeState(false);
                                        }
                                    }
                                    this.routeToShop(producerPortal, currentEnrollmentObj.mpGroup, details.id, true);
                                    this.isLoading = false;
                                    this.closePopup();
                                },
                                (_error) => {
                                    this.isLoading = false;
                                    this.closePopup();
                                },
                            );
                    }
                }
            } else {
                this.routeToShop(producerPortal, this.mpGroup.toString(), details.id);
                this.closePopup();
            }
        }
    }
    closePopup(): void {
        this.dialogRef.close({ action: "close" });
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - details of member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: Details, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroup, purpose: "shop" },
        });
        confirmAddressDialogRef
            .afterClosed()
            .pipe(take(1))
            .subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    const port = this.portal.toLowerCase();
                    this.routeToShop(port, currentEnrollmentObj.mpGroup, details.id);
                }
            });
    }
    onPreferenceChange(deliveryPreference: any): void {
        if (deliveryPreference.value === CorrespondenceType.ELECTRONIC) {
            this.isEmailOptional = false;
            this.employeeForm.controls.emailAddress.setErrors({ required: true });
            if (this.isEmployeeFormSubmit) {
                this.employeeForm.controls.emailAddress.markAsTouched();
            }
        } else if (this.employeeForm.controls.deliveryPreferance.value === CorrespondenceType.PAPER) {
            this.isEmailOptional = true;
            this.employeeForm.controls.emailAddress.setErrors(null);
            this.employeeForm.controls.emailAddress.markAsUntouched();
            this.employeeForm.controls.emailAddress.setValidators([Validators.pattern(this.validationRegex.EMAIL)]);
        }
    }
    fetchLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.census.manualEntry.onlyCreateTestTooltip",
            "primary.portal.census.manualEntry.createTestTooltip",
            "primary.portal.census.manualEntry.test",
        ]);
    }

    /**
     * Make annual salary mandatory if hours per week field has valid value and annual salary is empty
     */
    validateAnnualSalary(): void {
        if (
            this.workInfoForm.controls.hoursPerWeek.value &&
            !this.workInfoForm.controls.annualSalary.value &&
            this.workInfoForm.controls.hoursPerWeek.valid
        ) {
            this.workInfoForm.controls.annualSalary.setValidators([
                Validators.required,
                Validators.min(MIN_SALARY),
                Validators.max(MAX_SALARY),
                Validators.pattern(this.validationRegex.ANNUAL_SALARY),
            ]);
            this.annualSalaryOptional = false;
            this.annualSalaryError = this.language.fetchSecondaryLanguageValue("secondary.portal.census.manualEntry.annualSalaryRequired");
        } else if (
            this.workInfoForm.controls.hoursPerWeek.value &&
            this.workInfoForm.controls.annualSalary.value &&
            this.workInfoForm.controls.annualSalary.invalid
        ) {
            this.workInfoForm.controls.annualSalary.setValidators([
                Validators.pattern(this.validationRegex.ANNUAL_SALARY),
                Validators.required,
                Validators.min(MIN_SALARY),
                Validators.max(MAX_SALARY),
            ]);
            this.annualSalaryOptional = false;
            this.annualSalaryError = this.language.fetchSecondaryLanguageValue("secondary.portal.members.workValidationMsg.between");
        } else {
            this.workInfoForm.controls.annualSalary.clearValidators();
            this.workInfoForm.controls.annualSalary.setValidators([
                Validators.pattern(this.validationRegex.ANNUAL_SALARY),
                Validators.min(MIN_SALARY),
                Validators.max(MAX_SALARY),
            ]);
            this.annualSalaryOptional = true;
        }
        this.workInfoForm.controls.annualSalary.updateValueAndValidity();
    }

    /**
     * Make hours per week mandatory if annual salary field has valid value and hours per week is empty
     */
    validateHoursPerWeek(): void {
        if (
            this.workInfoForm.controls.annualSalary.value &&
            !this.workInfoForm.controls.hoursPerWeek.value &&
            this.workInfoForm.controls.annualSalary.valid
        ) {
            this.workInfoForm.controls.hoursPerWeek.setValidators([
                Validators.required,
                Validators.pattern(this.validationRegex.HOURSPERWEEK),
                Validators.min(this.hoursPerWeekMinConfig),
                Validators.max(this.hoursPerWeekMaxConfig),
            ]);
            this.hoursPerWeekOptional = false;
            this.hoursPerWeekError = this.language.fetchSecondaryLanguageValue("secondary.portal.census.manualEntry.hoursPerWeekRequired");
        } else {
            this.workInfoForm.controls.hoursPerWeek.clearValidators();
            this.workInfoForm.controls.hoursPerWeek.setValidators([
                Validators.pattern(this.validationRegex.HOURSPERWEEK),
                Validators.min(this.hoursPerWeekMinConfig),
                Validators.max(this.hoursPerWeekMaxConfig),
            ]);
            this.workInfoForm.controls.annualSalary.setValidators([
                Validators.min(MIN_SALARY),
                Validators.max(MAX_SALARY),
                Validators.pattern(this.validationRegex.ANNUAL_SALARY),
            ]);
            this.hoursPerWeekOptional = true;
        }
        this.workInfoForm.controls.hoursPerWeek.updateValueAndValidity();
        this.workInfoForm.controls.annualSalary.updateValueAndValidity();
    }

    departmentChanged(event: any): void {
        if (this.isAflacUSer) {
            this.addNewDepartmentFlag = event.value === this.ADD_NEW;
            if (this.addNewDepartmentFlag) {
                this.workInfoForm.addControl(
                    "newDepartmentId",
                    this.fb.control("", [Validators.required, Validators.pattern(this.validationRegex.DEPARTMENT_ID)]),
                );
            } else {
                this.workInfoForm.removeControl("newDepartmentId");
            }
        }
    }
    showErrorAlertMessage(err: Error): string {
        const error = err["error"];
        let errorMessage;
        if (error.status === AppSettings.API_RESP_403) {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.common.sorryPermissionDenied"];
        } else if (error.status === AppSettings.API_RESP_409) {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.common.memberAlreadyExists"];
        } else if (error.status === AppSettings.API_RESP_500) {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.common.internalServerError"];
        } else if (error.status === AppSettings.API_RESP_400) {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.register.personalInfo.badParameter"];
        } else {
            errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
        return errorMessage;
    }
    /**
     * Method to validate member information
     * @param isWorkTab - To differentiate where this method is being called
     */
    validateMember(isWorkTab: boolean): void {
        const validateMember: ValidateMemberProfile = this.initializeMemberObject(isWorkTab);
        this.memberService
            .validateMember(validateMember, this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.errorResponse = false;
                    if (isWorkTab) {
                        this.saveEmployeeInformation();
                    } else {
                        this.isLoading = false;
                        this.validStatus++;
                        this.stepPosition = this.step1;
                        this.changeStepper = this.step2;
                        if (this.progressIndicator.selected !== undefined) {
                            this.progressIndicator.selected.completed = true;
                        }
                    }
                },
                (error) => {
                    this.isLoading = false;
                    this.errorResponse = true;
                    if (error.error.status === AppSettings.API_RESP_400) {
                        if (isWorkTab) {
                            this.workTabErrorHandling(error);
                        } else if (error.error.details && error.error.details[0].code === INVALID_EMAIL_DOMAIN) {
                            this.errorResponse = false;
                            this.employeeForm.controls.emailAddress.setErrors({ domain: true });
                            this.emailDomainError = this.language.fetchPrimaryLanguageValue(error.error.details[0].message);
                        } else {
                            this.errorMessage = this.language.fetchPrimaryLanguageValue(error.error.details[0].message);
                        }
                    } else if (error.error.status === AppSettings.API_RESP_409) {
                        if (error.error.details && error.error.details.length) {
                            this.errorMessage = error.error.details[0].message;
                        } else {
                            this.errorMessage = this.secondaryLanguageStrings[
                                "secondary.portal.register.personalInfo.api.duplicateMemberError"
                            ].replace(
                                "##name##",
                                this.titleCase.transform(`${validateMember.name.firstName} ${validateMember.name.lastName}`),
                            );
                        }
                    } else {
                        this.showErrorAlertMessage(error);
                    }
                },
            );
    }
    /**
     * Method to validate member information
     * @param onNext - To differentiate where this method is being called
     */
    validateDependentInfo(onNext: boolean): void {
        const formControlName: string = this.dependentsFormMap[this.dependentsFormMap.length - 1];
        const dependentObjs: MemberDependent = this.getDependentForm(this.dependentsForm.controls[formControlName][FORM_CONTROLS]);
        this.memberService
            .validateDependent(dependentObjs, this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.dependentResponse = false;
                    this.isLoading = false;
                    if (onNext) {
                        this.validStatus++;
                        this.dependentContactSaved = true;
                        this.changeStepper = this.step3;
                        this.stepPosition = this.step2;
                        if (this.progressIndicator.selected !== undefined) {
                            this.progressIndicator.selected.completed = true;
                        }
                    } else {
                        this.addAnotherDependentForm();
                    }
                },
                (error) => {
                    this.isLoading = false;
                    this.dependentResponse = true;
                    this.dependentErr = "";
                    if (error.error.status === ClientErrorResponseCode.RESP_400) {
                        this.setFieldValidator(error, formControlName);
                    } else {
                        this.dependentErr = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${error.error["status"]}.${error.error["code"]}`,
                        );
                    }
                },
            );
    }
    /**
     * sets api error validations on fields
     * @param error error message from api
     * @param formControlName form control name
     */
    setFieldValidator(error: HttpErrorResponse, formControlName: string): void {
        error.error.details.forEach((detail) => {
            this.dependentErr += (this.dependentErr && ", ") + detail.message;
            (this.dependentsForm.controls[formControlName] as FormGroup).controls[detail.field].setErrors({
                apiError: true,
            });
        });
    }
    /**
     * Method to add another dependent form
     */
    addAnotherDependentForm(): void {
        this.totalDependentsCount++;
        this.dependentsCount++;
        const form = DEPENDENT_FORM + (this.totalDependentsCount - 1);
        this.dependentsForm.addControl(form, this.addDependentForm());
        if (this.dependentsFormMap.length) {
            const type = [...this.relationshipTypes];
            this.dependentsFormMap.forEach((value) => {
                const val = this.dependentsForm.controls[`${value}`][FORM_CONTROLS][DEPENDENT_RELATIONS_ID_FORM_CONTROL][FORM_VALUE];
                if (val === 1) {
                    type.splice(type.indexOf(type.find((ele) => ele.value === 1)), 1);
                }
            });
            this.relationshipType[form] = type;
        }
        this.dependentsFormMap.push(form);
    }
    /**
     * Method to save member information
     */
    saveEmployeeInformation(): void {
        this.workInfoMsg = "";
        const memberObject: ValidateMemberProfile = this.initializeMemberObject(true);
        const saveMemberApi: Observable<HttpResponse<MemberProfile>> = !this.updateMemberFlag
            ? this.memberService.createMember(memberObject as MemberProfile, this.mpGroup).pipe(
                  withLatestFrom(this.store.select(AccountListState.getGroup)),
                  tap(([, account]) => this.store.dispatch(new AddGroup({ ...account, employeeCount: account.employeeCount + 1 }))),
                  map(([createMemberResponse]) => createMemberResponse),
              )
            : this.memberService.updateMember(memberObject as MemberProfile, this.mpGroup.toString(), this.memberId);
        saveMemberApi
            .pipe(
                tap(
                    (response) => {
                        if (response instanceof HttpResponse) {
                            this.memberId = response.headers.get("location").split("/")[5];
                            this.updateMemberFlag = true;
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                        this.workInfoResponse = true;
                        this.updateMemberFlag = false;
                        this.workInfoMsg = this.showErrorAlertMessage(error);
                    },
                ),
                switchMap(() => this.saveMemberContactObservables()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    this.memberService.updateMemberList(true);
                    if (this.dependentsFormMap.length) {
                        this.saveMemberDependents();
                    } else {
                        this.saveEmployeeWorkInformation();
                    }
                },
                (error) => {
                    this.isLoading = false;
                    this.isMemberContactSaved = false;
                    this.workInfoResponse = true;
                    this.handleCreateMemberError(error);
                },
            );
    }
    /**
     * Method to handle create/update member api error
     * @param error - API error to be handled
     */
    handleCreateMemberError(error: HttpErrorResponse): void {
        if (error.status === AppSettings.API_RESP_400) {
            this.workInfoMsg = this.duplicateContactError(error);
        } else if (error.status === AppSettings.API_RESP_409) {
            this.workInfoMsg = error.error.details && error.error.details.length && error.error.details[0].message;
        } else if (error.status === AppSettings.API_RESP_500) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.internalServerError");
        } else if (error.status === AppSettings.API_RESP_403) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.permissionDenied");
        } else {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
    }
    /**
     * Method to create saveMemberContact observables
     * @returns an observable holding the save member contact API observable
     */
    saveMemberContactObservables(): Observable<void> {
        const saveMemberContactObservables: Observable<void>[] = [];
        const memberHomeContactInfo: MemberContact = {
            address: {
                state: this.employeeForm.controls.state.value,
                zip: this.employeeForm.controls.zip.value,
            },
        };
        if (this.employeeForm.controls.emailAddress.value) {
            memberHomeContactInfo.emailAddresses = [
                {
                    email: this.employeeForm.controls.emailAddress.value,
                    type: EmailTypes.PERSONAL,
                    primary: true,
                    verified: true,
                },
            ];
        }
        if (this.employeeForm.controls.phoneNumber.value) {
            const phoneNumbers = [
                {
                    phoneNumber: this.employeeForm.controls.phoneNumber.value,
                    type: this.employeeForm.controls.phoneType.value,
                    primary: true,
                    isMobile: this.isMobile,
                    verified: true,
                },
            ];
            if (this.employeeForm.controls.phoneType.value === PhoneContactTypes.HOME) {
                memberHomeContactInfo.phoneNumbers = phoneNumbers;
            } else {
                const memberWorkContactInfo = {
                    address: null,
                    phoneNumbers: phoneNumbers,
                };
                saveMemberContactObservables.push(
                    this.memberService.saveMemberContact(+this.memberId, ContactType.WORK, memberWorkContactInfo, this.mpGroup.toString()),
                );
            }
        }
        if (this.workInfoForm.controls.zip?.value) {
            saveMemberContactObservables.push(this.saveMemberWorkStateAndZip());
        }
        saveMemberContactObservables.push(
            this.memberService.saveMemberContact(+this.memberId, ContactType.HOME, memberHomeContactInfo, this.mpGroup.toString()),
        );
        return saveMemberContactObservables[CHECK_ZERO_INDEX].pipe(
            delay(saveMemberContactObservables.length > CHECK_ONE_INDEX ? SECOND_IN_MILLISECONDS : 0),
            switchMap((res) => {
                if (saveMemberContactObservables.length > CHECK_ONE_INDEX) {
                    return saveMemberContactObservables[CHECK_ONE_INDEX];
                }
                return of(null);
            }),
        );
    }
    /**
     * Method to save member work state and zip information
     * @returns Observable of void
     */
    saveMemberWorkStateAndZip(): Observable<void> {
        const workAddress = {
            state: this.workInfoForm.controls.state?.value as string,
            zip: this.workInfoForm.controls.zip?.value as string,
        };
        const memberWorkInfoDetails = {
            address: workAddress,
        };
        return this.memberService.saveMemberContact(+this.memberId, ContactType.WORK, memberWorkInfoDetails, this.mpGroup.toString());
    }
    /**
     * Method to save member dependents information
     */
    saveMemberDependents(): void {
        if (this.updateDependentFlag) {
            this.updateDependents();
        } else {
            const createDependentObservables: Observable<HttpResponse<Response>>[] = [];
            this.dependentsFormMap.forEach((ele, idx) => {
                const dependentObjs: MemberDependent = this.getDependentForm(this.dependentsForm.controls[ele][FORM_CONTROLS]);
                createDependentObservables.push(this.memberService.createMemberDependent(dependentObjs, +this.memberId, this.mpGroup));
                this.dependentObj.push(dependentObjs);
            });

            this.saveDependents(createDependentObservables);
        }
    }
    /**
     * Method to update member dependents info
     */
    updateDependents(): void {
        this.deepCopyDependent.forEach((element, idx) => {
            const index: number = this.dependentsFormMap.indexOf(element);
            if (index === -1) {
                const dependentId: string = this.dependentsId.splice(idx, 1).pop();
                this.memberService
                    .deleteMemberDependent(+this.memberId, dependentId, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((resp) => {});
                this.deepCopyDependent.splice(idx, 1);
            }
        });
        const createDependentObservables: Observable<HttpResponse<Response>>[] = [];
        this.dependentsFormMap.forEach((ele, idx) => {
            const index: number = this.deepCopyDependent.indexOf(ele);
            if (index === -1) {
                const dependentObjs: MemberDependent = this.getDependentForm(this.dependentsForm.controls[ele][FORM_CONTROLS]);
                createDependentObservables.push(this.memberService.createMemberDependent(dependentObjs, +this.memberId, this.mpGroup));
            }
        });
        if (createDependentObservables.length) {
            forkJoin(createDependentObservables)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.dependentResponse = false;
                        this.updateDependentFlag = true;
                        this.getDependentId(resp);
                        this.deepCopyDependent = this.utilService.copy(this.dependentsFormMap);
                        this.saveDependentsContactInfo();
                    },
                    (error) => {},
                );
        } else {
            const dependentsObservables: Observable<unknown>[] = [];
            this.dependentObj.forEach((obj, index) => {
                dependentsObservables.push(
                    this.memberService.updateMemberDependent(obj, +this.memberId, this.dependentsId[index], this.mpGroup),
                );
            });
            forkJoin(dependentsObservables)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.saveDependentsContactInfo();
                    },
                    () => {},
                );
        }
    }
    /**
     * Method to call saveMemberDependents API
     * @param createDependentObservables - Array of observables to call saveMemberDependent api
     */
    saveDependents(createDependentObservables: Observable<HttpResponse<Response>>[]): void {
        forkJoin(createDependentObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.getDependentId(resp);
                    this.workInfoResponse = false;
                    this.updateDependentFlag = true;
                    this.deepCopyDependent = this.utilService.copy(this.dependentsFormMap);
                    this.saveDependentsContactInfo();
                },
                (error) => {
                    this.updateDependentFlag = false;
                    if (error.status === ClientErrorResponseCode.RESP_409) {
                        this.isLoading = false;
                        this.workInfoResponse = true;
                        this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.census.manualEntry.duplicateDependentError"];
                    } else {
                        this.workTabErrorHandling(error);
                    }
                },
            );
    }
    /**
     * Method to save member dependents contact information
     */
    saveDependentsContactInfo(): void {
        const dependetsContactInfo: DependentContact[] = [];
        this.dependentsFormMap.forEach((element) => {
            const dependentContactObjs: DependentContact = {
                address: {
                    state: this.dependentsForm.controls[`${element}`][FORM_CONTROLS][STATE_FORM_CONTROL][FORM_VALUE],
                    zip: this.dependentsForm.controls[`${element}`][FORM_CONTROLS][ZIP_FORM_CONTROL][FORM_VALUE],
                },
            };
            dependetsContactInfo.push(dependentContactObjs);
        });
        const dependentContactObservables: Observable<unknown>[] = [];
        this.dependentsId.forEach((element, index) => {
            dependentContactObservables.push(
                this.memberService.saveDependentContact(dependetsContactInfo[index], +this.memberId, element.toString(), this.mpGroup),
            );
        });
        this.saveDependentsContact(dependentContactObservables);
    }
    /**
     * Method to call saveDependentContact API
     * @param dependentContactObservables - Array of observables to call saveDependentContact api
     */
    saveDependentsContact(dependentContactObservables: Observable<unknown>[]): void {
        forkJoin(dependentContactObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.workInfoResponse = false;
                    this.dependentContactSaved = true;
                    this.saveEmployeeWorkInformation();
                },
                (erroresp) => {
                    this.dependentContactSaved = false;
                    this.workTabErrorHandling(erroresp);
                },
            );
    }
    /**
     * Method to handle api error for work tab
     * @param erroresp - API error to be handled
     */
    workTabErrorHandling(erroresp: HttpErrorResponse): void {
        this.isLoading = false;
        this.workInfoResponse = true;
        if (erroresp.status === AppSettings.API_RESP_400) {
            if (erroresp.error.details && erroresp.error.details.length && erroresp.error.details[0].field === DEPARTMENT_ERROR) {
                this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.census.manualEntry.departmentSizeError"];
            } else {
                this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.register.personalInfo.badParameter"];
            }
        } else if (erroresp.status === AppSettings.API_RESP_403) {
            this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.common.sorryPermissionDenied"];
        } else if (erroresp.status === AppSettings.API_RESP_500) {
            this.workInfoMsg = this.secondaryLanguageStrings["secondary.portal.common.internalServerError"];
        } else if (erroresp.status === AppSettings.API_RESP_409) {
            this.workInfoMsg = erroresp.error.details && erroresp.error.details.length && erroresp.error.details[0].message;
        } else {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
    }
    /**
     * Method to save member's work information
     */
    saveEmployeeWorkInformation(): void {
        const workObservable: Observable<HttpErrorResponse>[] = [];
        if (this.workInfoForm.controls.employeeId.value) {
            this.memberIdentifierId = this.workInfoForm.controls.employeeId.value;
            workObservable.push(this.getMemberIdentifierObservable());
        }
        if (this.workInfoForm.controls.annualSalary.value || this.workInfoForm.controls.hoursPerWeek.value) {
            const salary: Salary = {
                type: ACTUAL,
                annualSalary: this.workInfoForm.controls.annualSalary.value,
                hoursPerYear: AppSettings.WEEKS_IN_YEAR * this.workInfoForm.controls.hoursPerWeek.value,
                validity: {
                    effectiveStarting: this.datePipe.transform(this.workInfoForm.controls.hireDate.value, this.dateFormat),
                    expiresAfter: "",
                },
            };

            this.salaryInfo = this.utilService.copy(salary);
            workObservable.push(this.getSalaryObservable());
        }
        if (!workObservable.length) {
            this.navigateAfterCreateMember();
        } else {
            forkJoin(workObservable)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((results) => {
                    const isError: boolean = results.some((res) => res !== null && res.error);
                    if (!isError) {
                        this.workInfoResponse = false;
                        this.navigateAfterCreateMember();
                    } else {
                        this.isLoading = false;
                    }
                });
        }
    }
    /**
     * Method to get createSalary observable
     * @returns {Observable<HttpErrorResponse>}
     */
    getSalaryObservable(): Observable<HttpErrorResponse> {
        return this.memberService.createSalary(+this.memberId, this.salaryInfo, this.mpGroup.toString()).pipe(
            tap((resp) => {
                this.createSalarySaved = true;
            }),
            catchError((error) => {
                this.createSalarySaved = false;
                this.workInfoResponse = true;
                let errorMsg = "";
                if (error.status === ClientErrorResponseCode.RESP_400) {
                    if (error.error.details && error.error.details.length) {
                        if (error.error.details[0].field === ANNUAL_SALARY && error.error.details[0].code === NOT_IN_RANGE_ERROR) {
                            errorMsg = this.languageStringsArray["primary.portal.census.manualEntry.salaryNotInRange"];
                        }
                    } else {
                        errorMsg = this.secondaryLanguageStrings["secondary.portal.register.personalInfo.badParameter"];
                    }
                } else {
                    errorMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
                }
                this.workInfoMsg = this.workInfoMsg === "" ? errorMsg : `${this.workInfoMsg}, ${errorMsg}`;
                return of(error);
            }),
        );
    }
    /**
     * Method to get saveMemberIdentifier observable
     * @returns {Observable<HttpErrorResponse>}
     */
    getMemberIdentifierObservable(): Observable<HttpErrorResponse> {
        const memberIdentifier: MemberIdentifier = {
            id: Number(this.memberId),
            memberIdentifierTypeId: this.identifierTypeId,
            value: this.memberIdentifierId,
            version: null,
        };
        return this.memberService.saveMemberIdentifier(memberIdentifier, this.mpGroup).pipe(
            tap((resp) => {
                this.createMemberIdentifierSaved = true;
            }),
            catchError((error) => {
                this.createMemberIdentifierSaved = false;
                this.workInfoResponse = true;
                let errorMsg = "";
                if (error.status === ClientErrorResponseCode.RESP_400) {
                    errorMsg = this.secondaryLanguageStrings["secondary.portal.register.personalInfo.badParameter"];
                } else if (error.status === ClientErrorResponseCode.RESP_409) {
                    errorMsg = this.secondaryLanguageStrings["secondary.portal.census.manualEntry.duplicateEmployeeID"];
                } else {
                    errorMsg = this.showErrorAlertMessage(error);
                }
                this.workInfoMsg = this.workInfoMsg ? errorMsg : `${this.workInfoMsg}, ${errorMsg}`;
                return of(error);
            }),
        );
    }
    /**
     * Method to navigate user after creating member
     */
    navigateAfterCreateMember(): void {
        this.workInfoResponse = false;
        if (this.progressIndicator.selected !== undefined) {
            this.progressIndicator.selected.completed = true;
        }
        this.dualPlanYearService.genericShopOeQLeNavigate(Number(this.memberId), Number(this.mpGroup));
        this.benefitsService
            .getPlanYears(this.mpGroup, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYearsData) => this.store.dispatch(new IsQleShop({ planYearsData })));
        this.store.dispatch(new SetMemberIdentity(+this.memberId));
        const data: Details = { id: this.memberId, employeeId: this.memberIdentifierId };
        if (this.saveAndShopFlag) {
            this.specificShopNav(data);
        } else if (!this.saveAndShopFlag) {
            this.store.dispatch(new SetMemberIdentity(data.id));
            this.store.dispatch(new SetMemberInfo(data));
            this.nevigateToPersonalInfo();
        }
    }
    /**
     * Method to initialize member object
     * @param isWorkTab - Determines where this method is being called
     * @returns memberObject of type MemberProfile
     */
    initializeMemberObject(isWorkTab: boolean): ValidateMemberProfile {
        const memberObject: ValidateMemberProfile = {
            name: {
                firstName: this.employeeForm.controls.firstName.value.trim(),
                lastName: this.employeeForm.controls.lastName.value.trim(),
            },
            birthDate: this.dateService.toDate(
                this.utilService.getCurrentTimezoneOffsetDate(this.employeeForm.controls.birthDate.value.toString()),
            ),
            gender: this.employeeForm.controls.genderName.value,
            profile: {
                languagePreference: this.employeeForm.controls.languagePreference.value,
            },
            // verificationInformation is used to send to endpoint with createMember
            verificationInformation: {
                zipCode: this.employeeForm.controls.zip.value,
                verifiedEmail: this.employeeForm.controls.emailAddress.value,
                verifiedPhone: this.employeeForm.controls.phoneNumber.value,
            },
        };
        if (isWorkTab) {
            this.updateMemberObjForWorkTab(memberObject);
        } else {
            if (this.employeeForm.controls.emailAddress.value) {
                memberObject.email = this.employeeForm.controls.emailAddress.value;
            }
            if (this.employeeForm.controls.phoneNumber.value) {
                memberObject.phoneNumber = this.employeeForm.controls.phoneNumber.value;
            }
        }
        if (this.canCreateTestMember) {
            memberObject["profile"] = {
                languagePreference: this.employeeForm.controls.languagePreference.value,
                test: this.employeeForm.get("testEmployee").value,
            };
        }
        if (this.isQuoteShopPage) {
            memberObject["profile"] = {
                languagePreference: this.employeeForm.controls.languagePreference.value,
                correspondenceType: this.employeeForm.controls.deliveryPreferance.value,
            };
        }
        // If Employer name field config is enabled then populate the memberObject with employerName
        if (this.isEmployerNameFieldEnabled && this.workInfoForm.controls.employerName?.value) {
            memberObject.workInformation = {
                ...memberObject.workInformation,
                employerName: this.workInfoForm.controls.employerName?.value,
            };
        }
        return memberObject;
    }

    /**
     * This function is used to modify memberObj based on isAccountRatingCodePEO boolean value
     * @param memberObject - previously initialize member object of type MemberProfile
     * @returns void
     */
    updateMemberObjForWorkTab(memberObject: ValidateMemberProfile): void {
        const hoursPerWeekControl = this.workInfoForm.controls.hoursPerWeek;
        memberObject.workInformation = {
            hireDate: this.datePipe.transform(this.workInfoForm.controls.hireDate.value, this.dateFormat),
            hoursPerWeek: hoursPerWeekControl.valid && hoursPerWeekControl.value ? hoursPerWeekControl.value : null,
        };
        if (this.isAccountRatingCodePEO) {
            Object.assign(memberObject.workInformation, {
                departmentNumber: this.workInfoForm.controls.department.value ? this.workInfoForm.controls.department.value.name : null,
                industryCode: this.workInfoForm.controls.department.value ? this.workInfoForm.controls.department.value.riskClass : null,
            });
        } else {
            Object.assign(memberObject.workInformation, {
                organizationId: this.addNewDepartmentFlag ? this.newDepartmentId : this.workInfoForm.controls.department.value,
            });
        }
    }

    /**
     * Redirects to Rules
     * @return Returns void
     */
    goToRules(): void {
        this.dialogRef.close();
        this.router.navigate([`${this.routerAfterLogin}/payroll/${this.mpGroup}/dashboard/profile/rules`]);
    }
    /**
     * This function is used to limit the user entry hours per week field to decimal places
     * @param event: keypress event
     */
    validateNumber(event: HTMLInputElement): void {
        event.value = this.utilService.formatDecimalNumber(event.value);
    }
    /**
     * Method to pre populate year in birth date based on conditions
     * @param input - date input of birth date field
     * @returns formatted date based on conditions
     */
    formatDate(input: string): Date | string {
        let res: Date | string = "";
        const maxYear: number = this.today.getFullYear() - this.minimumSubscriberAge;
        if (this.birthDatePickerInput && this.birthDatePickerInput.nativeElement.value.length === MIN_DATE_LENGTH) {
            const last2Digits: string = maxYear.toString().slice(-TWO_DIGITS_YEAR_LENGTH);
            const parts: string[] = this.birthDatePickerInput.nativeElement.value.replace(/\./g, "/").replace(/-/g, "/").split("/");
            const year: string = parts[TWO_DIGITS_YEAR_LENGTH];
            if (year.length === TWO_DIGITS_YEAR_LENGTH && +year > +last2Digits && +year <= MAX_YEAR_BIRTH_DATE) {
                res = new Date(+(NINTEEN_YEAR + year), +parts[0] - DATE_INDEX, +parts[DATE_INDEX]);
            } else if (year.length === TWO_DIGITS_YEAR_LENGTH && +year <= +last2Digits && +year >= 0) {
                res = new Date(+(TWENTY_YEAR + year), +parts[0] - DATE_INDEX, +parts[DATE_INDEX]);
            }
        } else if (input || this.employeeForm.controls.birthDate.value) {
            res = this.datePipe.transform(input ? input : this.employeeForm.controls.birthDate.value, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            this.employeeForm.controls.birthDate.setValue(res);
            return res;
        }
        if (!res && this.birthDatePickerInput && this.birthDatePickerInput.nativeElement.value.length === this.dateFormat.length) {
            res = this.dateService.toDate(this.birthDatePickerInput.nativeElement.value);
        }
        if (!res) {
            res = new Date();
        }
        this.employeeForm.controls.birthDate.setValue(res);
        return this.datePipe.transform(res, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }

    /**
     * Creates object to be passed to create and update dependent endpoints in the request body
     *
     * @param formControls has dependent's info
     * @returns dependent info in the required format
     */
    getDependentForm(formControls: { [key: string]: AbstractControl }): MemberDependent {
        return {
            name: {
                firstName: formControls.firstName.value.trim(),
                lastName: formControls.lastName.value.trim(),
            },
            birthDate: this.datePipe.transform(formControls.birthDate.value, this.dateFormat),
            gender: formControls.gender.value,
            dependentRelationId: +formControls.dependentRelationId.value,
            state: formControls.state.value,
        };
    }
    /**
     * Trims hours per week field with just decimal point to proper value
     * @param event :HTMLInput Event which used to capture event.target
     */
    trimDecimalPoint(event: HTMLInputElement): void {
        const value = parseFloat(event.value);
        if (value >= 0) {
            this.workInfoForm.get("hoursPerWeek").setValue(value.toString());
        }
    }
    /**
     * This function hides or shows the add Dependents button based on permissions and other conditions
     */
    showAddDependentButton(): void {
        forkJoin([
            this.accountService.getAccount(this.mpGroup.toString()),
            this.staticService.getConfigurations(ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_CREATE_DEPENDENTS, this.mpGroup),
            this.accountService.getGroupAttributesByName([HQ_ACCOUNT], this.mpGroup),
            this.authenticationService.permissions$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountInfo, permissionConfig, groupAttribute, permissions]) => {
                this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
                this.showDependentsConfig = permissionConfig[0].value === TRUE_VALUE;
                this.isHqAccount = groupAttribute[0].attribute === HQ_ACCOUNT && groupAttribute[0].value === BooleanConst.TRUE;
                if (permissions.length > 0) {
                    this.restrictAddDependents = Boolean(permissions.some((d) => String(d) === Permission.RESTRICT_ADD_DEPENDENTS));
                }
                this.showAddDependents = !(
                    this.isTpiAccount &&
                    !this.isHqAccount &&
                    this.restrictAddDependents &&
                    this.showDependentsConfig
                );
            });
    }

    /**
     * Route to the shop page.
     *
     * @param portal current portal (producer/admin/member)
     * @param mpGroup group ID
     * @param employeeId employee's ID
     * @param relativeTo whether to use root URI to use for relative navigation
     */
    routeToShop(portal: string, mpGroup: string, employeeId: string, relativeTo = false): void {
        this.router.navigate(
            [portal, "payroll", mpGroup, "member", employeeId, "enrollment", "quote-shop", mpGroup, "specific", employeeId],
            relativeTo ? { relativeTo: this.route } : undefined,
        );
    }

    /**
     * determine whether a worksite address is same as account
     * @param matCheckboxChange indicates whether checkbox is checked or not
     */
    worksiteAddressSelectionChange(matCheckboxChange: boolean): void {
        this.workAddressSameAsAccount = matCheckboxChange;
        if (this.workAddressSameAsAccount) {
            this.workInfoForm?.controls.state.disable();
            this.workInfoForm?.controls.state.patchValue(this.accountDetails?.situs?.state.abbreviation);
            this.workInfoForm?.controls.zip.disable();
            this.workInfoForm?.controls.zip.patchValue(this.accountDetails?.situs?.zip);
        } else {
            this.workInfoForm?.controls.state.enable();
            this.workInfoForm?.controls.state.reset();
            this.workInfoForm?.controls.zip.enable();
            this.workInfoForm?.controls.zip.reset();
        }
    }

    addWorkStateAndZipFormControls(): void {
        this.worksiteLocationEnabled$.pipe(takeUntil(this.unsubscribe$)).subscribe((config) => {
            if (config) {
                this.workAddressSameAsAccount = true;
                this.workInfoForm.addControl("worksiteSameAsAccount", new FormControl(this.workAddressSameAsAccount));
                this.workInfoForm.addControl(
                    "state",
                    new FormControl({ value: this.accountDetails?.situs?.state.abbreviation, disabled: this.workAddressSameAsAccount }),
                );
                this.workInfoForm.addControl(
                    "zip",
                    new FormControl({ value: this.accountDetails?.situs?.zip, disabled: this.workAddressSameAsAccount }),
                );
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
