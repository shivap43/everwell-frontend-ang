import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { filter, takeUntil, switchMap, tap, finalize, catchError, first, distinctUntilChanged, map, delay } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter, HostListener, Input } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Store, Select } from "@ngxs/store";
import { BehaviorSubject, Observable, Subscription, Subject, forkJoin, of, combineLatest, iif } from "rxjs";
import { WorkClassPopupComponent } from "./work-class-popup/work-class-popup.component";
import { WorkSalaryPopupComponent } from "./work-salary-popup/work-salary-popup.component";
import { ConfirmationDialogData, ConfirmationDialogComponent, AddressVerificationComponent } from "@empowered/ui";
import {
    ClassType,
    ClassNames,
    County,
    MemberService,
    Organization,
    SalaryType,
    StaticService,
    TerminationCode,
    Regions,
    SalarylClassRegionPreferences,
    AccountProfileService,
    Configuration,
    AccountService,
    HideReadOnlyElementSetting,
    MemberIdentifierType,
    CommonService,
    MemberClassType,
    MemberIdentifier,
    MemberIdentifierTypeIDs,
    MemberIdentifierTypeTypes,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NgxMaskPipe } from "ngx-mask";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from "@angular/material/core";
import {
    Permission,
    ConfigName,
    ADDRESS_OPTIONS,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    JOB_TITLE_MAX_LENGTH,
    JOB_DESCRIPTION_MAX_LENGTH,
    JOB_FIELD_MAX_LENGTH,
    DateFormats,
    PayFrequency,
    PartnerId,
    Salary,
    AppSettings,
    Portals,
    CarrierId,
    PersonalAddress,
    RatingCode,
    ContactType,
    CountryState,
    MemberProfile,
    WorkInformation,
    GroupAttribute,
} from "@empowered/constants";
import { Router } from "@angular/router";
import { SalaryUpdateConfirmationComponent } from "./salary-update-confirmation/salary-update-confirmation.component";
import { DateService, DATE_FNS_FORMATS, DateFnsDateAdapter } from "@empowered/date";
import { format } from "date-fns";
import {
    AccountProfileBusinessService,
    TPIRestrictionsForHQAccountsService,
    SharedService,
    EmpoweredModalService,
} from "@empowered/common-services";
import {
    AccountInfoState,
    AddMemberInfo,
    Member,
    MemberInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

const AGE_DIFFERENCE_ZERO = 0;
const ELIGIBLE_EMPLOYEE_AGE = 14;
const DATE_FORMAT = "DD";
const CORPORATE_DEPARTMENT_DEFAULT_ID = "1";
const ADDITIONAL_FACTOR = 1;
const SECONDS_IN_DAY = 86400000;
const RADIX_TEN = 10;
const PAST_DATE_CHECK_STRING = "past";
const FUTURE_DATE_CHECK_STRING = "future";
const TERMINATION_DATE_CONTROL = "terminationDate";
const TERMINATION_NOTES_MAX_LENGTH = 1000;
const CONTROLS_STRING = "controls";
const UNSPECIFIED = "UNSP";
const SSN = "ssn";
const EMPLOYEE_ID = "EMPLOYEE_ID";
const ADDRESS = "address";
const STATE = "state";
const HIRE_DATE = "hireDate";
const IS_PRIMARY_ADDRESS = "isPrimaryAddress";
const DIRECT = "direct";
const DIRECT_EMPLOYEE = "customers";
const EMPLOYEE = "employees";
const OCCUPATION = "occupation";
const SALARY_ACTUAL = "salaryActual";
const SALARY_BENEFIT = "salaryBenefit";
const DIGITS_AFTER_DECIMAL_POINT = 2;
const DAY = "day";
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

@Component({
    selector: "empowered-work-info",
    templateUrl: "./work-info.component.html",
    styleUrls: ["./work-info.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FNS_FORMATS },
    ],
})
export class WorkInfoComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    state: any;
    @Select(MemberInfoState) memberState$: Observable<Member>;
    @Input() isDirect: boolean;
    @Input() isEmployerNameFieldEnabled: boolean;
    @Input() isEmployerNameFieldReadOnly: boolean;
    allowNavigation: Subject<boolean>;
    readonly IS_OVERALL_ADDRESS_VERIFICATION = "general.feature.enable.aflac.api.address_validation";
    isOverallAddressVerification: boolean;
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();

    getRegionsSubscriber: Subscription;
    getClassTypesSubscriber: Subscription;
    getMemberClassNamesSubscriber: Subscription;
    saveMemberContactSubscriber: Subscription;
    getMemberSalariesSubscriber: Subscription;
    getMemberIdentifierSubscriber: Subscription;
    saveEmployeeIdIdentifier: Subscription;
    createOrganizationSubscriber: Subscription;

    memberId: number;
    mpGroupId: string;
    portal: string;
    empIdIdentifierID: number;
    editWorkForm: FormGroup;
    memberWorkForm: FormGroup;
    memberWorkControls: any;
    states: CountryState[];
    countries: string[];
    counties: County[];
    classTypes: ClassType[];
    classNames: ClassNames[];
    organizations: Organization[];
    payrollFrequencies: PayFrequency[];
    terminationCodes: TerminationCode[];
    regionTypes: any = [];
    salaryType: string[];
    configurations: Configuration[];
    editObject: any = {};
    initialFormValues: any;
    errorMessage: string;
    updateState: any;
    permissionEnum = Permission;
    salaryBody: Salary;

    dataSourceActualSalary: { next: (arg0: Salary[]) => void };
    dataSourceBenefitSalary: { next: (arg0: Salary[]) => void };
    dataSourceRegion: { next: (arg0: Regions[]) => void };

    dataActualSalary: Salary[] = [];
    dataBenefitSalary: Salary[] = [];
    dataAllSalary: Salary[] = [];
    sourceForClassData = [];
    sourceForRegionData = [];
    displayedColumnsSalary: SalarylClassRegionPreferences[];
    displayedColumnsClass: SalarylClassRegionPreferences[];
    displayedColumnsRegion: SalarylClassRegionPreferences[];

    actualSalary = "ACTUAL";
    benefitSalary = "BENEFIT";
    addFunctionality = "Add";
    editFunctionality = "Edit";
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    displayFlag = false;
    maskingFlag = true;
    terminationFlag = false;
    isFormValueChange = false;
    checkCount = 0;
    workCount = 0;
    checkAlert: boolean;
    isLoading: boolean;
    navigationFlag: boolean;
    userIsProducerAdmin: boolean;
    hireDateLessThen14 = false;
    hireDateIsFutureDate = false;
    terminationDateBeforeHireDate = false;
    terminationDateIsFutureDate = false;
    terminationDateIsPastDate = false;
    differenceInDaysWhenTerminationDateBeforeHireDate = "";
    differenceInDaysWhenTerminationDateIsFuture = "";
    differenceInDaysWhenTerminationDateBeforeCurrentDate = "";
    isSaved = false;
    isZeroState: boolean;
    workContactData: any;
    getGroupAttributesByNameArray = [];
    isOrganizationFieldRequired = false;
    isEmployeeIdFieldRequired = false;
    benefitSalaryTableKey = "benifitSalaryTable";
    benefitSalaryTable = "benefitSalaryTable";
    newlyCreatedDepartmentID = null;
    maxNewDeptIdLength = 4;
    employeeIdMaxLength: number;
    providedAddress: PersonalAddress;
    addressResp = false;
    suggestedAddress: PersonalAddress;
    addressMessage: string[];
    selectedAddress: string;
    isAddressChanged: boolean;
    isAddressFormTouched: boolean;
    isAddressSame: PersonalAddress;
    ORGANIZATION_LABEL_LANGUAGE_KEY = "primary.portal.members.workLabel.organization";
    configurableTerminationDayRange: number;
    displayValidFutureDate: string;
    displayValidPastDate: string;
    terminationDateError = "";
    validDisplayDate: string;
    employerNameRequiredFieldError = false;
    hoursPerWeek: number;
    displayTooltipMsg: string;
    nameWithHypenApostrophesValidation: RegExp;
    languageSecondaryStrings: Record<string, string> = this.langService.fetchSecondaryLanguageValues([
        "secondary.portal.members.workValidationMsg.unableLoadSalaries",
        "secondary.portal.members.workValidationMsg.noLocation",
        "secondary.portal.members.workValidationMsg.noStates",
        "secondary.portal.members.workValidationMsg.noCountries",
        "secondary.portal.members.workValidationMsg.noOrg",
        "secondary.portal.members.workValidationMsg.noPayrollFrequency",
        "secondary.portal.members.workValidationMsg.noTerminationDate",
        "secondary.portal.members.workValidationMsg.noRegions",
        "secondary.portal.members.workValidationMsg.noClassNames",
        "secondary.portal.members.workValidationMsg.noClasses",
        "secondary.portal.members.workValidationMsg.noCounties",
        "secondary.portal.members.workValidationMsg.noSalary",
        "secondary.portal.members.workValidationMsg.noSaveDetails",
        "secondary.portal.members.workValidationMsg.required",
        "secondary.portal.common.invalidDateFormat",
        "secondary.portal.members.situsMistmatchError",
        "secondary.portal.members.selectionRequired",
        "secondary.portal.members.workValidationMsg.employeeAgeLimit",
        "secondary.portal.members.workValidationMsg.termination.cannotBeMoreThan",
        "secondary.portal.members.workValidationMsg.termination.daysInTheFuture",
        "secondary.portal.members.workValidationMsg.customIDPatternMsg",
        "secondary.portal.members.workValidationMsg.requiredAction",
        "secondary.portal.members.requiredField",
        "secondary.portal.members.workValidationMsg.newDepartmentError",
        "secondary.portal.common.work.errHoursPerWeekDecimal",
        "secondary.portal.common.work.errHoursPerWeekMax",
        "secondary.portal.common.work.errHoursPerWeekMin",
        "secondary.portal.members.workValidationMsg.termination.beforeHireDate",
        "secondary.portal.members.api.400.badParameter.comment",
        "secondary.portal.census.manualEntry.duplicateEmployeeID",
        "secondary.portal.applicationFlow.demographics.minHours",
        "secondary.portal.members.personalValidationMsg.zip",
        "secondary.portal.departmentNumber.duplicate",
    ]);

    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.member.terminate.dateBefore",
        "primary.portal.applicationFlow.payments.paymentFrequency",
        "primary.portal.member.terminate.dateAfter",
        "primary.portal.members.workLabel.organizationTooltipMessage",
        "primary.portal.members.workLabel.benefitSalaryTooltipMessage",
        "primary.portal.members.commonLabel.savesUpdatesTo",
        "primary.portal.members.commomLabel.profileBeforeExiting",
        "primary.portal.common.save",
        "primary.portal.common.doNotSave",
        "primary.portal.members.workLabel.actualSalary",
        "primary.portal.members.workLabel.addClass",
        "primary.portal.members.workLabel.editClass",
        "primary.portal.members.workLabel.addSalary",
        "primary.portal.members.workLabel.editSalary",
        "primary.portal.members.workLabel.addBenefitSalary",
        "primary.portal.members.workLabel.editBenefitSalary",
        "primary.portal.members.workLabel.select",
        "primary.portal.members.workLabel.workInfo",
        "primary.portal.members.workLabel.terminationComments",
        "primary.portal.members.workLabel.warningAfterTermination",
        "primary.portal.members.workLabel.jobDuties",
        "primary.portal.members.workLabel.streetAddress1",
        "primary.portal.members.workLabel.streetAddress2",
        "primary.portal.members.workLabel.city",
        "primary.portal.members.workLabel.zip",
        "primary.portal.members.workLabel.hireDate",
        "primary.portal.members.workLabel.terminationDate",
        "primary.portal.members.workLabel.jobTitle",
        "primary.portal.common.show",
        "primary.portal.common.hide",
        "primary.portal.common.edit",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.common.undoChanges",
        "primary.portal.common.saved",

        "primary.portal.members.workLabel.primaryAddressCheck",
        "primary.portal.members.workLabel.myPrimaryAddress",
        "primary.portal.members.workLabel.streetAddress1",
        "primary.portal.common.optional",
        "primary.portal.members.workValidationMsg.streetAddress1",
        "primary.portal.members.workLabel.streetAddress2",
        "primary.portal.members.workLabel.floorOrSuite",
        "primary.portal.members.workValidationMsg.streetAddress2",
        "primary.portal.members.workLabel.city",
        "primary.portal.members.workValidationMsg.city",
        "primary.portal.members.workLabel.state",
        "primary.portal.members.workLabel.select",
        "primary.portal.members.workLabel.zip",
        "primary.portal.members.workValidationMsg.zip",
        "primary.portal.members.workLabel.county",
        "primary.portal.members.workLabel.country",
        "primary.portal.members.workLabel.hireDate",
        "primary.portal.members.workLabel.dateFormat",
        "primary.portal.members.workLabel.terminationDate",
        "primary.portal.members.workLabel.terminationCode",
        "primary.portal.members.workLabel.payrollFrequency",
        "primary.portal.members.workLabel.compensation",
        "primary.portal.members.workLabel.hoursPerYear",
        "primary.portal.members.workLabel.type",
        "primary.portal.members.workLabel.hourlySalary",
        "primary.portal.members.workLabel.annualSalary",
        "primary.portal.members.workLabel.startDate",
        "primary.portal.members.workLabel.endDate",
        "primary.portal.members.workLabel.ongoing",
        "primary.portal.members.workLabel.manage",
        "primary.portal.members.workLabel.benefitSalary",
        "primary.portal.members.workLabel.classType",
        "primary.portal.members.workLabel.className",
        "primary.portal.members.workLabel.region",
        "primary.portal.members.workLabel.regionName",
        "primary.portal.members.workLabel.ongoing",
        "primary.portal.members.workLabel.hoursPerWeek",
        "primary.portal.members.workLabel.newDepartmentID",
        "primary.portal.members.workLabel.newDepartmentIdHint",
        "primary.portal.members.workLabel.addNewDepartmentID",
        "primary.portal.members.workLabel.undefined",
        "primary.portal.census.manualEntry.zipErrorMsg",
        "primary.portal.common.city.patternError",
        "primary.portal.members.workLabel.departmentPeoRating",
        "primary.portal.members.workLabel.employeeIdRemoved",
        "primary.portal.members.workLabel.alreadyEnrollInAPlan",
        "primary.portal.direct.addCustomer.employerName",
        "primary.portal.members.workLabel.memberIdentifierType.customerIdNumber",
        "primary.portal.common.custIdNumber",
        "primary.portal.pda.form.employerName",
    ]);
    memberIdentifierTypes: MemberIdentifierType[] = [];
    customIdFields: any;

    hideFieldElementSetting: HideReadOnlyElementSetting = {
        id: true,
        isPrimaryAddress: false,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        countyId: true,
        country: true,
        hireDate: true,
        terminationDate: true,
        terminationCodeId: true,
        terminationComments: true,
        organizationId: true,
        occupation: true,
        occupationDescription: true,
        empID: true,
        customID: true,
        cifNumber: true,
        payrollFrequencyId: true,
        benefitSalaryTable: true,
        hoursPerWeek: true,
        employerName: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        id: false,
        isPrimaryAddress: false,
        address1: false,
        address2: false,
        city: false,
        state: false,
        zip: false,
        countyId: false,
        country: false,
        hireDate: false,
        terminationDate: false,
        terminationCodeId: false,
        terminationComments: false,
        organizationId: false,
        occupation: false,
        occupationDescription: false,
        empID: false,
        customID: false,
        cifNumber: false,
        payrollFrequencyId: false,
        hoursPerWeek: false,
        employerName: false,
    };

    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];

    isMaskedTrue = true;
    initialCustomIDs = {};
    actualSalaryIsRequired: boolean;
    actualSalaryIsRequiredError: boolean;
    benefitSalaryIsRequired: boolean;
    benefitSalaryIsRequiredError: boolean;
    ACTUAL_SALARY_KEY = "portal.member.form.work.actualSalaryTable";
    BENEFIT_SALARY_KEY = "portal.member.form.work.benifitSalaryTable";
    requiredFields = [];
    isDateInvalid = false;
    hireDateDaysConfig: number;
    HIRE_DATE_CONFIG_CONSTANT = "broker.group_portal.employee.hire_date.future_days_allowed";
    TERMINATE_DAY_RANGE_CONFIG = "portal.member.terminate.dayRange";
    validationRegex: any;
    TRUE = "true";
    @Select(SharedState.regex) regex$: Observable<any>;
    @Output() enableContact = new EventEmitter();
    isMember = false;
    employeeIdNumber = "Employee ID Number";
    zipConst = "zip";
    stateConst = STATE;
    isAflacUSer: boolean;
    groupPartnerId: number;
    addNewDepartmentFlag = false;
    readonly PARENT_ID = 1;
    readonly ADD_NEW = "ADD_NEW";
    readonly CORPORATE = "Corporate";
    readonly UNDEFINED = "Undefined";
    SALARY_ACTION_EDIT = "edit";
    SALARY_ACTION_ADD = "add";
    hoursPerWeekMaxConfig: number;
    hoursPerWeekMinConfig: number;
    hoursPerWeekMoreThanMaxErrorMsg: string;
    hoursPerWeekMoreThanMinErrorMsg: string;
    departmentLabel: string;
    isAccountRatingCodePEO: boolean;
    peoDepartments: ClassNames[];
    isAflacReadOnly = false;
    isPartialEdit = false;
    disableFormFields = false;
    directPayrollFrequencies = [2, 5, 10, 12];
    showMonAlert = false;
    getMemberInfo: MemberProfile;
    isEmployeeIdMandatory = false;
    showHoursPerWeekAlert = false;
    isHoursPerWeekMandatory = false;
    isVestedAgent: boolean;
    isSelfEnrollment = false;
    STATE_CONTROL_VALUE = "state";
    ADDRESS_1_CONTROL_VALUE = "address1";
    isOccupationRequired: boolean;
    formInitialized = false;
    hasCifNumber = false;
    isInProfile = false;
    isSalaryAddOrEdit = false;
    totalWeeksInYear = 52;
    max_length = JOB_FIELD_MAX_LENGTH;
    readonly CIF_ID = 4;
    readonly cifNumber = MemberIdentifierTypeTypes.CIF_NUMBER;
    readonly aflacGuid = MemberIdentifierTypeTypes.AFLAC_GUID;
    salary: number;
    annualSalaryMin: number;
    annualSalaryMax: number;
    memberIdentifierTypes$: Observable<MemberIdentifierType[] | [MemberIdentifierType[], any]>;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly staticService: StaticService,
        private readonly memberService: MemberService,
        private readonly accountProfileService: AccountProfileService,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly changeDetectorRefs: ChangeDetectorRef,
        private readonly datePipe: DatePipe,
        private readonly langService: LanguageService,
        private readonly utilService: UtilService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly accountProfileservice: AccountProfileService,
        private readonly staticUtilService: StaticUtilService,
        private readonly commonService: CommonService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountProfileBusinessService: AccountProfileBusinessService,
        private readonly tpiRestrictionsService: TPIRestrictionsForHQAccountsService,
        private readonly sharedService: SharedService,
        private readonly router: Router,
        private readonly dateService: DateService,
    ) {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
                this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
            }
        });
        this.getStateManagement();
        // This new function is added to fetch latest account information.
        this.getAccountDetails();
        this.salaryType = [SalaryType.ANNUAL, SalaryType.HOURLY];
        this.checkAlert = true;
        this.displayedColumnsSalary = [
            SalarylClassRegionPreferences.ANNUAL_SALARY,
            SalarylClassRegionPreferences.HOURS_PER_YEAR,
            SalarylClassRegionPreferences.TYPE,
            SalarylClassRegionPreferences.START_DATE,
            SalarylClassRegionPreferences.END_DATE,
            SalarylClassRegionPreferences.MANAGE,
        ];
        this.displayedColumnsClass = [
            SalarylClassRegionPreferences.NAME,
            SalarylClassRegionPreferences.START_DATE,
            SalarylClassRegionPreferences.END_DATE,
            SalarylClassRegionPreferences.MANAGE,
        ];
        this.displayedColumnsRegion = [
            SalarylClassRegionPreferences.NAME,
            SalarylClassRegionPreferences.START_DATE,
            SalarylClassRegionPreferences.END_DATE,
        ];
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMember = this.portal === AppSettings.PORTAL_MEMBER;
        if (!this.router.url.includes(DIRECT)) {
            this.checkTPIRestrictions(this.portal);
        }
        this.checkForUserType();
        this.initializeWorkForm();
    }

    /*
        Component life cycle hook
        OnInit
        Setting the following modal properties:
        1. hideErrorAlertMessage() -> to hide alert messages when component gets initialized.
        2. getConfigurations -> fetched from getConfigurations API.
        3. getDropdownData -> to fetch drop down values for state field from static service.
        4. getIdentifierTypesSubscriber -> to fetch identifier types.
        5. getGroupAttributesByNameSubscriber -> to fetch group attribute by name according to account.
        6. getLanguages -> to fetch department label based on group partner ID (Department / Organization).
        7. getConfigurations -> to fetch configuration for termination day's range.
        8. getStateZipFlag-> to get boolean value based on the state and zip validation response.
        9. checkAgentSelfEnrolled() :- check if the Agent is SelfEnrolled or not and return a boolean value()
        10.checkForVestedAgents() :- check for Vested agents and make controls readonly
        11. getMemberWorkContact() : get member contact of work type.
        12. initializeSelfEnrollFlag() : function to initialize the self enrolled flag
    */
    ngOnInit(): void {
        this.isLoading = true;
        this.checkCount = 0;
        this.actualSalaryIsRequired = false;
        this.actualSalaryIsRequiredError = false;
        this.benefitSalaryIsRequired = false;
        this.benefitSalaryIsRequiredError = false;
        this.initializeSelfEnrollFlag();
        this.hideErrorAlertMessage();
        this.getConfigurations();
        this.getDropdownData();
        if (this.userIsProducerAdmin) {
            this.getClassTypesAndNames()
                .pipe(
                    filter((resp) => resp !== undefined && resp !== null),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((resp) => {
                    this.setClassTypeData(resp);
                });
        }
        this.getMemberInfo = this.store.selectSnapshot(MemberInfoState.getMemberInfo);
        this.isEmployeeIdMandatory = this.getMemberInfo.workInformation?.employeeIdRequired;
        this.isHoursPerWeekMandatory = this.getMemberInfo.workInformation?.hoursPerWeekRequired;
        this.isDateInvalid = true;
        this.memberIdentifierTypes$ = forkJoin([this.getIdentifierTypesSubscriber(), this.getGroupAttributesByNameSubscriber()]).pipe(
            tap(([identifierTypes, groupAttributes]: [MemberIdentifierType[], any]) => {
                this.getGroupAttributesByName(groupAttributes);
            }),
            switchMap(([identifierTypes, groupAttributes]: [MemberIdentifierType[], any]) => this.getIdentifierTypes(identifierTypes)),
            delay(1000),
            tap(() => this.getMemberIdentifier()),
            takeUntil(this.unsubscribe$),
        );
        this.checkForVestedAgents();
        this.checkFormDisable();
        this.getMemberWorkContact();
        const toolTipMessage = this.languageStrings["primary.portal.members.workLabel.organizationTooltipMessage"];
        if (this.isDirect) {
            this.displayTooltipMsg = toolTipMessage.replace(EMPLOYEE, DIRECT_EMPLOYEE);
        } else {
            this.displayTooltipMsg = toolTipMessage;
        }
        this.isOccupationRequired = this.isRequiredField(OCCUPATION);
    }
    /**
     * Function to initialize the self enroll flag
     * @returns void
     */
    initializeSelfEnrollFlag(): void {
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isSelfEnrollment = response;
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
                this.getReadOnlyHiddenValidation(this.memberWorkForm);
            });
    }
    /**
     * @description handles the input event of the employer name input field
     * @param ev {target: {value: string}} the event from the input field
     */
    employerNameInputHandler(ev: { target: { value: string } }): void {
        this.isFormValueChange = true;
        this.employerNameRequiredFieldError = this.isDirect && ev.target.value.trim() === "";
        if (this.employerNameRequiredFieldError) {
            this.memberWorkForm.controls.workInformation.get("employerName").setValue(ev.target.value.trim());
        }
    }
    /**
     * This function is to fetch account details to fetch latest updated account information.
     * On account information response we will fetch drop down values as per rating code(PEO Department/Department ID).
     */
    getAccountDetails(): void {
        // The getAccount API will give account information by passing mpGroupId.
        this.accountService
            .getAccount(this.mpGroupId)
            .pipe(
                switchMap((accountDetails) => {
                    if (accountDetails) {
                        this.groupPartnerId = accountDetails.partnerId;
                        this.isAflacUSer = accountDetails.partnerId === PartnerId.AFLAC;
                        this.isAccountRatingCodePEO = accountDetails.ratingCode === RatingCode.PEO;
                        return iif(
                            () => this.isAccountRatingCodePEO,
                            this.accountProfileBusinessService.getEmployeePEOClasses(this.mpGroupId, CarrierId.AFLAC),
                            this.accountProfileBusinessService.getOrganizationData(
                                this.mpGroupId,
                                this.isAflacUSer,
                                this.CORPORATE,
                                this.UNDEFINED,
                            ),
                        );
                    }
                    return undefined;
                }),
                switchMap((data) => {
                    /**
                     * The data is assign based on boolean flag isAccountRatingCodePEO
                     * if isAccountRatingCodePEO is true then data assign to this.peoDepartments
                     * if isAccountRatingCodePEO is false then data assign to this.organizations
                     */
                    if (this.isAccountRatingCodePEO) {
                        // filteredPeoClasses will gives us PEO classes by removing UNSP peo class from response.
                        const filteredPeoClasses = this.utilService.copy(data).filter((peoElement) => peoElement.name !== UNSPECIFIED);
                        if (filteredPeoClasses.length) {
                            this.peoDepartments = filteredPeoClasses;
                        } else {
                            this.peoDepartments = data;
                        }
                        this.setPEOClassData();
                        if (this.organizationIDAliases.value === CORPORATE_DEPARTMENT_DEFAULT_ID) {
                            this.organizationIDAliases.setValue(null);
                        }
                        this.organizationIDAliases.setValidators(Validators.required);
                        this.workInformationAliases.updateValueAndValidity();
                    } else {
                        this.organizations = data;
                    }
                    return this.commonService.getLanguages(
                        this.ORGANIZATION_LABEL_LANGUAGE_KEY,
                        undefined,
                        undefined,
                        this.groupPartnerId.toString(),
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (response) => {
                    this.departmentLabel = response[0].value;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * @description gets the group attributes for the employee
     * @param result array to check the group attributes
     */
    getGroupAttributesByName(result: any): void {
        this.getGroupAttributesByNameArray = result;
        if (this.getGroupAttributesByNameArray.length) {
            this.isOrganizationFieldRequired =
                this.TRUE === this.getGroupAttributesByNameArray.find((x) => x.attribute === AppSettings.IS_DEPARTMENT_ID_REQUIRED).value;
            this.isEmployeeIdFieldRequired =
                this.TRUE === this.getGroupAttributesByNameArray.find((x) => x.attribute === AppSettings.IS_EMPLOYEE_ID_REQUIRED).value;
        }
        if (this.isOrganizationFieldRequired) {
            if (this.organizationIDAliases.value === CORPORATE_DEPARTMENT_DEFAULT_ID) {
                this.organizationIDAliases.setValue(null);
            }
            this.organizationIDAliases.setValidators(Validators.required);
        }
    }

    getGroupAttributesByNameSubscriber(): Observable<GroupAttribute[]> {
        return this.accountService.getGroupAttributesByName(
            [AppSettings.IS_DEPARTMENT_ID_REQUIRED, AppSettings.IS_EMPLOYEE_ID_REQUIRED],
            +this.mpGroupId,
        );
    }

    /**
     * Function call to get configs from the database
     */
    getConfigurations(): void {
        combineLatest([
            this.staticUtilService.fetchConfigs(
                [this.HIRE_DATE_CONFIG_CONSTANT, this.TERMINATE_DAY_RANGE_CONFIG],
                parseFloat(this.mpGroupId),
            ),
            this.staticUtilService.cacheConfigs([
                this.IS_OVERALL_ADDRESS_VERIFICATION,
                ConfigName.EMPLOYEE_ID_MAX_LENGTH,
                ConfigName.MIN_HOURS_PER_WEEK,
                ConfigName.MAX_HOURS_PER_WEEK,
                ConfigName.GENERAL_EMPLOYEE_SALARY_ANNUAL_MIN,
                ConfigName.GENERAL_EMPLOYEE_SALARY_ANNUAL_MAX,
            ]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([response, [isOverallAddressVerification, employeeIdMaxLength, minValue, maxValue, annualMinValue, annualMaxValue]]) => {
                    if (response.length) {
                        this.hireDateDaysConfig = parseInt(response[0].value, RADIX_TEN);
                        this.configurableTerminationDayRange = parseInt(response[1].value, RADIX_TEN);
                    }

                    this.isOverallAddressVerification = this.staticUtilService.isConfigEnabled(isOverallAddressVerification);
                    this.employeeIdMaxLength = +employeeIdMaxLength?.value;

                    // Operations for minValue, maxValue, annualMinValue, annualMaxValue
                    this.hoursPerWeekMinConfig = +minValue?.value;
                    this.hoursPerWeekMaxConfig = +maxValue?.value;
                    this.annualSalaryMin = +annualMinValue?.value;
                    this.annualSalaryMax = +annualMaxValue?.value;
                    if (!this.isHoursPerWeekMandatory) {
                        this.hoursPerWeekControl.setValidators([
                            Validators.pattern(this.validationRegex.HOURSPERWEEK),
                            Validators.min(this.hoursPerWeekMinConfig),
                            Validators.max(this.hoursPerWeekMaxConfig),
                        ]);
                    } else {
                        this.hoursPerWeekControl.setValidators([
                            Validators.required,
                            Validators.pattern(this.validationRegex.HOURSPERWEEK),
                            Validators.min(this.hoursPerWeekMinConfig),
                            Validators.max(this.hoursPerWeekMaxConfig),
                        ]);
                    }
                    this.hoursPerWeekMoreThanMaxErrorMsg = this.languageSecondaryStrings[
                        "secondary.portal.common.work.errHoursPerWeekMax"
                    ].replace("##MAXHOURS##", String(this.hoursPerWeekMaxConfig));

                    this.hoursPerWeekMoreThanMinErrorMsg = this.languageSecondaryStrings[
                        "secondary.portal.common.work.errHoursPerWeekMin"
                    ].replace("##MINHOURS##", String(this.hoursPerWeekMinConfig));
                },
            );
    }

    checkForUserType(): void {
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.userIsProducerAdmin = false;
        } else {
            this.userIsProducerAdmin = true;
        }
    }

    /**
     * Get member info and configurations from store and apply to form accordingly.
     */
    getStateManagement(): void {
        this.memberState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state: Member) => {
            this.state = this.utilService.copy(state);
            this.memberId = this.state.activeMemberId;
            this.mpGroupId = this.state?.mpGroupId;
            this.configurations = this.state.configurations;
            if (this.state.configurations && this.state.configurations.payload && this.memberWorkForm && this.checkCount === 0) {
                this.settingValidations(this.memberWorkForm);
            }
        });
    }

    /**
     * Function to edit the member work information related data such as address,salary etc.
     * Marks form as pristine and indicates form has been initialized once done.
     * @param activeMemberId current active member id
     * @returns void
     */
    editMemberDataSync(activeMemberId: number): void {
        this.checkCount = 1;
        this.workContactData = {};
        const workInformation: WorkInformation = { ...this.state.memberInfo.workInformation };
        if (this.state.memberInfo.workAddress !== undefined) {
            this.workContactData = this.state.memberInfo.workAddress;
            this.editObject[ADDRESS] = this.workContactData ? this.workContactData.address : null;
            if (this.editObject.address && this.editObject.address.countyId) {
                const address = { ...this.editObject.address };
                address.countyId = address.countyId.toString();
                this.editObject.address = { ...address };
                this.memberWorkControls.address.get("countyId").enable();
                this.memberWorkForm.updateValueAndValidity();
            }
            if (this.editObject.address && !this.isSalaryAddOrEdit) {
                this.memberWorkForm.patchValue({
                    ...this.memberWorkForm.value,
                    ...{ address: this.editObject.address },
                });
                this.updateStateSelection(this.editObject.address.state);
                this.enableCounty();
            }
        }
        if (this.userIsProducerAdmin || this.isSelfEnrollment) {
            this.isLoading = true;
            this.getMemberSalariesSubscriber = this.memberService
                .getSalaries(activeMemberId, !this.maskingFlag, this.state?.mpGroupId.toString())
                .pipe(
                    map((salaries) =>
                        salaries.map((salary) => ({
                            ...salary,
                            masked: true,
                            ongoing: this.checkActiveSalary(salary.validity.expiresAfter),
                        })),
                    ),
                    tap((memberSalaries) => {
                        this.dataAllSalary = memberSalaries;
                        this.editObject[SALARY_ACTUAL] = [];
                        this.editObject[SALARY_BENEFIT] = [];
                        let isActiveSalary = false;
                        memberSalaries.forEach((salary) => {
                            if (salary.type === this.actualSalary) {
                                this.editObject[SALARY_ACTUAL].push(salary);
                                if (!isActiveSalary && ((salary.hoursPerYear && memberSalaries.length) || salary.hoursPerYear === 0)) {
                                    this.hoursPerWeek = salary.hoursPerYear / this.totalWeeksInYear;
                                    if (!this.isSalaryAddOrEdit) {
                                        this.memberWorkForm.controls.workInformation.patchValue({
                                            hoursPerWeek: this.hoursPerWeek.toFixed(DIGITS_AFTER_DECIMAL_POINT),
                                        });
                                        this.memberWorkForm.updateValueAndValidity();
                                    }
                                }
                            } else {
                                this.editObject[SALARY_BENEFIT].push(salary);
                            }
                            isActiveSalary = memberSalaries.ongoing;
                        });
                        this.dataActualSalary = this.editObject.salaryActual;
                        this.dataActualSalary.forEach((salary) => (salary["masked"] = true));
                        this.dataSourceActualSalary = new BehaviorSubject(this.dataActualSalary);
                        this.actualSalaryIsRequiredError = false;

                        this.dataBenefitSalary = this.editObject.salaryBenefit;
                        this.dataBenefitSalary.forEach((salary) => (salary["masked"] = true));
                        this.dataSourceBenefitSalary = new BehaviorSubject(this.dataBenefitSalary);
                        this.benefitSalaryIsRequiredError = false;
                        // It will get execute if salary does not has length or has only one annual salary entry
                        if (
                            this.state.memberInfo.workInformation &&
                            (!memberSalaries.length || (memberSalaries.length === 1 && !memberSalaries[0]?.hoursPerYear))
                        ) {
                            this.getHoursPerWeekFromProfile();
                            // memberWorkForm is reset in the above function, hence we need to populate employer name
                            this.checkAndPopulateEmployerName();
                        } else {
                            this.editObject["workInformation"] = {};
                        }
                    }),
                    catchError((error) => {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.unableLoadSalaries"];
                        return of(error);
                    }),
                    finalize(() => {
                        if (!this.isSalaryAddOrEdit) {
                            this.memberWorkForm.markAsPristine();
                        }
                        this.formInitialized = true;
                    }),
                    first(),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                );
        }
        if (this.state.memberInfo.workInformation !== undefined) {
            if (this.isLoading && !this.isInProfile) {
                workInformation.hoursPerWeek = null;
            }
            if (isNaN(workInformation.hoursPerWeek)) {
                workInformation.hoursPerWeek = null;
            }
            if (workInformation.hireDate) {
                workInformation.hireDate = this.utilService.getCurrentTimezoneOffsetDate(workInformation.hireDate.toString());
            }
            this.editObject.workInformation = { ...workInformation };
            if (
                this.userIsProducerAdmin &&
                this.state.memberInfo.workInformation.termination &&
                this.state.memberInfo.workInformation.termination.terminationDate
            ) {
                this.terminationFlag = true;
                const edit = { ...this.editObject.workInformation };
                edit.terminationCodeId = this.state.memberInfo.workInformation.termination.terminationCodeId.toString();
                edit.terminationDate = this.state.memberInfo.workInformation.termination.terminationDate;
                edit.terminationComments = this.state.memberInfo.workInformation.termination.comment;
                delete edit.termination;
                this.editObject.workInformation = edit;
                this.disableTerminationFields();
            }
            if (!this.isSalaryAddOrEdit) {
                this.memberWorkForm.reset({
                    ...this.memberWorkForm.value,
                    workInformation: this.editObject.workInformation,
                });
                this.checkAndPopulateEmployerName();
            } else if (this.isFormValueChange) {
                this.memberWorkForm.markAsDirty();
            }
        } else {
            this.editObject.workInformation = null;
        }
        this.checkCorrespondence();
        if (!this.getMemberSalariesSubscriber) {
            this.memberWorkForm.markAsPristine();
            this.formInitialized = true;
        }
    }

    /**
     * This method is used to disable termination fields
     * @returns void
     */
    disableTerminationFields() {
        const terminationDate = this.state.memberInfo?.workInformation?.termination?.terminationDate;
        const terminationComments = this.state.memberInfo?.workInformation?.termination?.terminationComments;
        const terminationCode = this.state.memberInfo.workInformation.termination.terminationCodeId;
        this.memberWorkForm.controls.workInformation.get("terminationDate").setValue(terminationDate);
        this.memberWorkForm.controls.workInformation.get("terminationDate").disable();
        this.memberWorkForm.controls.workInformation.get("terminationComments").setValue(terminationComments);
        this.memberWorkForm.controls.workInformation.get("terminationComments").disable();
        this.memberWorkForm.controls.workInformation.get("terminationCodeId").setValue(terminationCode);
        this.memberWorkForm.controls.workInformation.get("terminationCodeId").disable();
        if (this.terminationFlag) {
            const hireDate = this.state.memberInfo?.workInformation?.hireDate;
            this.memberWorkForm.controls.workInformation.get("hireDate").setValue(hireDate);
            this.memberWorkForm.controls.workInformation.get("hireDate").disable();
        } else {
            this.memberWorkForm.controls.workInformation.get("hireDate").enable();
        }
    }

    /**
     * This method is used to check ongoing salary
     * @param expiresAfter salary end date
     * @returns boolean
     */
    checkActiveSalary(expiresAfter: string): boolean {
        return !expiresAfter || this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(expiresAfter));
    }

    /**
     * This method is used to get hoursPerWeek when no salaries data available.
     * @returns void
     */
    getHoursPerWeekFromProfile(): void {
        const workInformation: WorkInformation = { ...this.state.memberInfo.workInformation };
        if (workInformation?.hoursPerWeek) {
            workInformation.hoursPerWeek = parseFloat(workInformation.hoursPerWeek.toFixed(DIGITS_AFTER_DECIMAL_POINT));
        }
        if (isNaN(workInformation.hoursPerWeek)) {
            workInformation.hoursPerWeek = null;
        }
        this.isInProfile = true;
        this.editObject["workInformation"] = { ...workInformation };
        // made type of workInformation of editObject compatible to the workInformation form group of memberWorkForm
        const edit = { ...this.editObject.workInformation };
        edit.terminationCodeId = workInformation.termination.terminationCodeId?.toString();
        edit.terminationDate = workInformation.termination.terminationDate;
        edit.terminationComments = workInformation.termination.terminationComments;
        delete edit.termination;
        this.editObject.workInformation = edit;
        if (!this.isSalaryAddOrEdit) {
            this.memberWorkForm.reset(
                {
                    ...this.memberWorkForm.getRawValue(),
                    workInformation: this.editObject.workInformation,
                },
                { emitEvent: false },
            );
        } else if (this.isFormValueChange) {
            this.memberWorkForm.markAsDirty();
        }
    }

    /**
     * This method is to check correspondence location and manage field isPrimaryAddress.
     * @returns void
     */
    checkCorrespondence(): void {
        if (this.state.memberInfo.profile.correspondenceLocation) {
            if (
                this.state.memberInfo.profile.correspondenceLocation === ContactType.HOME &&
                !this.isAflacReadOnly &&
                !this.isPartialEdit &&
                !this.isVestedAgent
            ) {
                this.memberWorkControls.address.get("isPrimaryAddress").setValue(false);
                this.memberWorkForm.controls.address.get("isPrimaryAddress").enable();
            } else {
                this.memberWorkControls.address.get("isPrimaryAddress").setValue(true);
                this.memberWorkForm.controls.address.get("isPrimaryAddress").disable();
            }
            this.memberWorkForm.updateValueAndValidity();
        } else {
            this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noLocation"];
        }
    }

    /**
     * This function is used to set default PEO class in PEO Department field.
     * @returns void
     */
    setPEOClassData(): void {
        const workInformationData = this.state.memberInfo.workInformation;
        if (workInformationData && workInformationData.departmentNumber && workInformationData.industryCode) {
            const selectedPeoClass = this.peoDepartments.find(
                (x) => x.name === workInformationData.departmentNumber && x.riskClass === workInformationData.industryCode,
            );
            if (selectedPeoClass) {
                this.organizationIDAliases.patchValue(selectedPeoClass);
            }
        }
    }
    /*
     *This function is used to fetch states drop down data
     */
    getDropdownData(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.states = Response;
                },
                () => {
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noStates"];
                },
            );
        this.staticService
            .getCountries()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.countries = Response;
                },
                () => {
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noCountries"];
                },
            );
        this.accountService
            .getPayFrequencies()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    if (this.isDirect) {
                        this.payrollFrequencies = Response.filter(
                            (payrollFrequency) => this.directPayrollFrequencies.indexOf(payrollFrequency.id) >= 0,
                        );
                    } else {
                        this.payrollFrequencies = Response;
                    }
                },
                () => {
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noPayrollFrequency"];
                },
            );
        this.accountService
            .getTerminationCodes(this.state?.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.terminationCodes = Response;
                },
                () => {
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noTerminationDate"];
                },
            );
        if (this.userIsProducerAdmin) {
            this.memberService
                .getMemberRegionTypes(this.memberId, this.state?.mpGroupId.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (Response) => {
                        for (const instance in Response) {
                            if (instance) {
                                const tableData = { name: instance, sourceData: Response[instance] };
                                this.regionTypes.push(tableData);
                            }
                        }
                    },
                    () => {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noRegions"];
                    },
                );
        }
    }

    /**
     * API call to fetch member identifier types
     * @returns Observable<MemberIdentifierType[]>
     */
    getIdentifierTypesSubscriber(): Observable<MemberIdentifierType[]> {
        return this.memberService.getMemberIdentifierTypes();
    }

    /**
     * To check if the employee id field is empty on blur
     */
    employeeIdChanges(): void {
        if (!this.customIDAliases.get(EMPLOYEE_ID).value) {
            this.showMonAlert = true;
        } else {
            this.showMonAlert = false;
        }
    }

    /**
     * To get the member identifiers types and create form controls
     * @param result Member Identifier Type
     */
    getIdentifierTypes(result: MemberIdentifierType[]): Observable<MemberIdentifierType[]> {
        this.memberIdentifierTypes = result;
        this.memberIdentifierTypes = this.memberIdentifierTypes.filter((x) => x.type !== SSN.toUpperCase());
        this.memberIdentifierTypes.forEach((item) => {
            if (item.type === EMPLOYEE_ID) {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
                (this.isEmployeeIdFieldRequired || this.isEmployeeIdMandatory) && !this.isMember
                    ? this.customIDAliases.addControl(
                          item.type,
                          this.formBuilder.control("", [Validators.required, Validators.pattern(this.validationRegex.ALPHANUMERIC)]),
                      )
                    : this.customIDAliases.addControl(
                          item.type,
                          this.formBuilder.control("", Validators.pattern(this.validationRegex.ALPHANUMERIC)),
                      );
            } else if (item.type === this.aflacGuid) {
                this.customIDAliases.addControl(
                    item.type,
                    this.formBuilder.control("", Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_HYPHEN)),
                );
            } else {
                this.customIDAliases.addControl(
                    item.type,
                    this.formBuilder.control("", Validators.pattern(this.validationRegex.ALPHANUMERIC)),
                );
            }
        });
        this.settingValidations(this.memberWorkForm);
        return of(this.memberIdentifierTypes);
    }

    /**
     * This function is used to get class type and class name
     * @returns Observable<ClassType[]>
     */
    getClassTypesAndNames(): Observable<ClassType[]> {
        return this.accountProfileService.getClassTypes(this.state?.mpGroupId.toString());
    }

    /**
     * This function is used to arrange class type data
     * @param classTypeData ClassType[]s
     */
    setClassTypeData(classTypeData: ClassType[]): void {
        this.classTypes = [];
        this.editObject["classTypes"] = [];
        this.classTypes = classTypeData.filter((classType) => classType.visible);
        this.classTypes.forEach((classTypeVal) => this.getPreExistingClasses(classTypeVal.id));
        this.isLoading = false;
        this.changeDetectorRefs.detectChanges();
    }

    getPreExistingClasses(classTypeId: number): void {
        this.memberService
            .getMemberClassType(this.memberId, classTypeId, this.state?.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.editObject["classTypes"].push({ classTypeId: classTypeId, data: Response });
                    for (const type of this.classTypes) {
                        if (type.id === classTypeId) {
                            type["classDetails"] = new BehaviorSubject([]);
                            type.classDetails.next(Response);
                        }
                    }
                },
                () => {
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noClasses"];
                },
            );
    }

    /**
     * Set address and work info form sections and their controls, some with validators.
     * Subscribe to state value changes for zip code input.
     */
    initializeWorkForm(): void {
        this.memberWorkForm = this.formBuilder.group({
            address: this.formBuilder.group({
                isPrimaryAddress: [false],
                address1: ["", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(100)]],
                address2: ["", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(100)]],
                city: ["", [Validators.pattern(this.validationRegex.NAME_WITH_SPACE_BETWEEN_WORDS), Validators.maxLength(100)]],
                state: [""],
                zip: [""],
                countyId: [{ value: "", disabled: true }],
                country: [""],
            }),
            workInformation: this.formBuilder.group(
                {
                    employerName: ["", this.router.url.includes(DIRECT) ? Validators.required : [Validators.maxLength(100)]],
                    hireDate: [""],
                    terminationDate: [""],
                    terminationCodeId: ["", Validators.max(100)],
                    terminationComments: ["", Validators.maxLength(TERMINATION_NOTES_MAX_LENGTH)],
                    organizationId: [""],
                    occupation: ["", [Validators.maxLength(JOB_TITLE_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_TITLE)]],
                    occupationDescription: [
                        "",
                        [Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_DESCRIPTION)],
                    ],
                    employeeCustomID: this.formBuilder.group({}),
                    payrollFrequencyId: [""],
                    hoursPerWeek: [""],
                    newDepartmentId: [""],
                },
                { updateOn: "blur" },
            ),
        });
        this.memberWorkControls = this.memberWorkForm.controls;
        // subscribe to state value updates to pass along to zip code input for match validation
        this.memberWorkForm
            .get(ADDRESS)
            .get(STATE)
            .valueChanges.pipe(
                tap((value: string) => this.stateControlValueSubject$.next(value)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.memberWorkForm
            .get(ADDRESS)
            .get(this.zipConst)
            .valueChanges.pipe(
                distinctUntilChanged(),
                tap((value) => (this.isFormValueChange = this.formInitialized)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * To check if the hoursperweek field is empty on blur
     */
    hoursPerWeekChanges(): void {
        this.showHoursPerWeekAlert = !this.workInformationAliases.get("hoursPerWeek").value;
    }
    /**
     * Abstracting as it's used multiple places
     * @returns FormGroup of workInformation object
     */
    get workInformationAliases(): FormGroup {
        return this.memberWorkForm.get("workInformation") as FormGroup;
    }
    /**
     * Abstracting as it's used multiple places
     * @returns FormControl of workInformation object
     */
    get organizationIDAliases(): FormControl {
        return this.workInformationAliases.get("organizationId") as FormControl;
    }
    /**
     * Abstracting as it's used multiple places
     * @returns FormGroup of workInformation object
     */
    get customIDAliases(): FormGroup {
        return this.workInformationAliases.get("employeeCustomID") as FormGroup;
    }
    /**
     * Abstracting as it's used multiple places
     * @returns FormControl of workInformation object
     */
    get hoursPerWeekControl(): FormControl {
        return this.workInformationAliases.get("hoursPerWeek") as FormControl;
    }

    /**
     * This method is to set validation for fields as per primary config.
     * If isReadOnly flag is set to false, then we are not set validation.
     * @param formGroup formGroup name as this.memberWorkForm
     * @returns void
     */
    settingValidations(formGroup: FormGroup): void {
        this.state.configurations.payload.work.forEach((element) => {
            if (element.name === this.ACTUAL_SALARY_KEY && element.value === this.REQUIRED) {
                this.actualSalaryIsRequired = true;
            }
            if (element.name === this.BENEFIT_SALARY_KEY && element.value === this.REQUIRED) {
                this.benefitSalaryIsRequired = true;
            }
            Object.keys(formGroup.controls).forEach((field) => {
                const control = formGroup.get(field);
                if (control[CONTROLS_STRING]) {
                    for (const subField in control[CONTROLS_STRING]) {
                        if (subField && element.name.split(".").pop() === subField && element.value === this.REQUIRED) {
                            this.getValidationValueForKey(subField, this.REQUIRED);
                            if (control[CONTROLS_STRING][subField].validator) {
                                if (!this.isAflacReadOnly) {
                                    control[CONTROLS_STRING][subField].setValidators([
                                        Validators.required,
                                        control[CONTROLS_STRING][subField].validator,
                                    ]);
                                } else {
                                    control[CONTROLS_STRING][subField].setValidators(null);
                                }
                            } else if (!this.isAflacReadOnly) {
                                control[CONTROLS_STRING][subField].setValidators([Validators.required]);
                            } else {
                                control[CONTROLS_STRING][subField].setValidators(null);
                            }
                            control[CONTROLS_STRING][subField].updateValueAndValidity();
                        }
                    }
                } else if (element.name.split(".").pop() === field && element.value === this.REQUIRED) {
                    this.getValidationValueForKey(field, this.REQUIRED);
                    if (!this.isAflacReadOnly) {
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
        if (this.memberId && this.state.memberInfo.workInformation) {
            this.workCount += 1;
            if (this.workCount === 1) {
                this.editMemberDataSync(this.memberId);
            }
        }
        this.getReadOnlyHiddenValidation(this.memberWorkForm);
        this.checkCorrespondence();
    }

    /**
     * This method is set validation as hidden and readonly as per config.
     * If isAflacReadOnly or isPartialEdit flag is true then we need modify the fields s read-only.
     * @param memberWorkForm form group
     * @returns void
     */
    getReadOnlyHiddenValidation(memberWorkForm: FormGroup): void {
        this.hideFieldElementSetting[this.benefitSalaryTable] = !this.getValidationValueForKey(this.benefitSalaryTableKey, this.HIDDEN);
        Object.keys(memberWorkForm.controls).forEach((key) => {
            if (memberWorkForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(memberWorkForm.controls[key] as FormGroup);
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
        this.state.configurations.payload.work.forEach((element) => {
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
     * This method is to set validation messages as per field errors(Required, touched).
     * @param formGroupName formGroup name string
     * @param fieldName formControl name string
     * @returns boolean value to validateMessage
     */
    validateMessage(formGroupName: string, fieldName: string): boolean | undefined {
        if (this.memberWorkControls) {
            let fieldNameControl: any;
            if (!this.isAflacReadOnly) {
                if (formGroupName) {
                    fieldNameControl = this.memberWorkControls[formGroupName].get(fieldName);
                } else {
                    fieldNameControl = this.memberWorkForm.get(fieldName);
                }
                return fieldNameControl.touched && fieldNameControl.errors && fieldNameControl.errors.required;
            }
            return false;
        }
        return undefined;
    }

    /* Added as mat-datepicker does not validate the dates when user clicks
    outside the box, this is require to call validation explicitly */
    @HostListener("click")
    checkHireDateChange(): any {
        if (this.memberWorkForm.value.workInformation.hireDate) {
            this.validatehireDateChange({ value: this.memberWorkForm.value.workInformation.hireDate });
        }
        if (
            this.memberWorkForm.value.workInformation.termination &&
            this.memberWorkForm.value.workInformation.termination.terminationDate
        ) {
            this.validateTerminationDate({
                value: this.memberWorkForm.value.workInformation.termination.terminationDate,
            });
        }
    }

    validatehireDateChange(event: any): void {
        if (this.hireDateDaysConfig && event.value && event.value.toString() !== AppSettings.INVALID_DATE) {
            const hireDate = this.dateService.toDate(this.utilService.getCurrentTimezoneOffsetDate(event.value));
            let today = new Date();
            today = this.addToDate(today, this.hireDateDaysConfig);
            this.hireDateIsFutureDate = false;
            this.hireDateLessThen14 = false;
            this.memberWorkForm.controls.workInformation.get("hireDate").setErrors(null);
            if (hireDate <= today) {
                const birthDate = this.dateService.toDate(this.state.memberInfo.birthDate);
                const diffYears = hireDate.getFullYear() - birthDate.getFullYear();
                const monthDiff = hireDate.getMonth() - birthDate.getMonth();
                const dayDiff = hireDate.getDate() - birthDate.getDate();
                this.birthDateAndHireDateDiff(diffYears, monthDiff, dayDiff);
            } else {
                this.hireDateIsFutureDate = true;
                this.memberWorkForm.controls.workInformation.get("hireDate").setErrors({
                    incorrect: true,
                });
            }
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
        this.memberWorkForm.controls.workInformation.get("hireDate").setErrors({
            incorrect: true,
        });
        this.hireDateLessThen14 = true;
        return true;
    }

    addToDate(date: Date, days: number): Date {
        if (date && days) {
            date.setDate(date.getDate() + days);
        }
        return date;
    }
    /**
     * @description Calculate the difference in days
     * @param date1 starting date
     * @param date2 ending date
     * @returns {number}-the difference in days
     */
    calculateDifferenceInDays(date1: Date, date2: Date): number {
        return Math.floor((date1.getTime() - date2.getTime()) / SECONDS_IN_DAY + ADDITIONAL_FACTOR);
    }
    /**
     * @description To create the valid date window and display
     * @param checkString to check termination date is in past or future
     * @returns {void}
     */
    displayValidTerminationDate(checkString: string): void {
        const validDate = new Date();
        if (checkString === PAST_DATE_CHECK_STRING) {
            validDate.setDate(new Date().getDate() - this.configurableTerminationDayRange);
        } else if (checkString === FUTURE_DATE_CHECK_STRING) {
            validDate.setDate(new Date().getDate() + this.configurableTerminationDayRange);
        }
        this.validDisplayDate = validDate.getMonth() + ADDITIONAL_FACTOR + "/" + validDate.getDate() + "/" + validDate.getFullYear();
        if (checkString === PAST_DATE_CHECK_STRING) {
            this.terminationDateError = this.languageStrings["primary.portal.member.terminate.dateAfter"].replace(
                "##validDate##",
                this.validDisplayDate,
            );
            this.terminationDateIsPastDate = true;
            this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors({ incorrect: true });
        } else if (checkString === FUTURE_DATE_CHECK_STRING) {
            this.terminationDateError = this.languageStrings["primary.portal.member.terminate.dateBefore"].replace(
                "##validDate##",
                this.validDisplayDate,
            );
            this.terminationDateIsFutureDate = true;
            this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors({ incorrect: true });
        }
    }
    /**
     * @description Function to Validate the given date and set the exact error message
     * @param differenceInDays difference in days between two dates
     * @param checkString to check Termination date is in past or future
     * @returns {void}
     */
    validateDisplayDate(differenceInDays: number, checkString: string): void {
        if (differenceInDays > this.configurableTerminationDayRange) {
            this.displayValidTerminationDate(checkString);
        } else if (checkString === PAST_DATE_CHECK_STRING) {
            this.terminationDateBeforeHireDate = false;
            this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors(null);
        } else if (checkString === FUTURE_DATE_CHECK_STRING) {
            this.terminationDateIsFutureDate = false;
            this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors(null);
        }
    }

    validateTerminationDate(event: any): void {
        if (event.value && event.value.toString() !== AppSettings.INVALID_DATE) {
            this.differenceInDaysWhenTerminationDateBeforeHireDate = "";
            this.differenceInDaysWhenTerminationDateIsFuture = "";
            this.differenceInDaysWhenTerminationDateBeforeCurrentDate = "";
            this.terminationDateBeforeHireDate = false;
            this.terminationDateIsFutureDate = false;
            this.terminationDateIsPastDate = false;
            this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors(null);
            const terminationDate = this.dateService.toDate(this.datePipe.transform(event.value, AppSettings.DATE_FORMAT));
            const hireDate = this.dateService.toDate(this.memberWorkForm.value.workInformation.hireDate);
            const today = new Date();
            terminationDate.setHours(0, 0, 0);
            hireDate.setHours(0, 0, 0);
            today.setHours(0, 0, 0);
            if (terminationDate < today) {
                if (terminationDate < hireDate) {
                    this.differenceInDaysWhenTerminationDateBeforeHireDate = this.calculateDifferenceInDays(
                        hireDate,
                        terminationDate,
                    ).toFixed(0);
                    this.terminationDateBeforeHireDate = true;
                    this.memberWorkForm.controls.workInformation.get(TERMINATION_DATE_CONTROL).setErrors({ incorrect: true });
                } else {
                    this.differenceInDaysWhenTerminationDateBeforeCurrentDate = Math.floor(
                        (today.getTime() - terminationDate.getTime()) / SECONDS_IN_DAY,
                    ).toFixed(0);
                    this.validateDisplayDate(+this.differenceInDaysWhenTerminationDateBeforeCurrentDate, PAST_DATE_CHECK_STRING);
                }
            } else {
                this.differenceInDaysWhenTerminationDateIsFuture = this.calculateDifferenceInDays(terminationDate, today).toFixed(0);
                this.validateDisplayDate(+this.differenceInDaysWhenTerminationDateIsFuture, FUTURE_DATE_CHECK_STRING);
            }
        }
    }

    /**
     * This method is to set countyId field as enable or disable.
     * @returns void
     */
    enableCounty(): void {
        if (
            this.memberWorkForm.controls.address &&
            this.memberWorkForm.get(ADDRESS).get(STATE).valid &&
            !this.isAflacReadOnly &&
            !this.isPartialEdit
        ) {
            this.memberWorkForm.controls.address.get("countyId").enable();
            this.memberWorkForm.updateValueAndValidity();
        } else {
            this.memberWorkForm.controls.address.get("countyId").disable();
            this.memberWorkForm.updateValueAndValidity();
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
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    get formControls(): any {
        return this.memberWorkForm.controls;
    }
    /**
     * This method is used to check the member address.
     * @param event to check primary address checkbox is checked or not.
     */
    defaultAddressCheck(event: any): void {
        if (event.checked) {
            this.memberWorkControls.address.get("isPrimaryAddress").setValue(true);
        } else {
            this.memberWorkForm.value.address = {};
            this.memberWorkForm.reset(this.memberWorkForm.value);
        }
        this.memberWorkForm.markAsDirty();
        this.isFormValueChange = true;
    }

    getRowFromActualSalaryTableShow(rowData: any): void {
        let row: any;
        for (row in this.dataActualSalary) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.dataActualSalary.hasOwnProperty(row) && this.dataActualSalary[row] === rowData) {
                this.dataActualSalary[row].manage = true;
            } else {
                this.dataActualSalary[row].manage = false;
            }
        }
    }

    getRowFromActualSalaryTableHide(rowData: any): void {
        let row: any;
        for (row in this.dataActualSalary) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.dataActualSalary.hasOwnProperty(row) && this.dataActualSalary[row] === rowData) {
                this.dataActualSalary[row].manage = false;
            } else {
                this.dataActualSalary[row].manage = true;
            }
        }
    }

    getRowFromBenefitSalaryTableShow(rowData: any): void {
        let row: any;
        for (row in this.dataBenefitSalary) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.dataBenefitSalary.hasOwnProperty(row) && this.dataBenefitSalary[row] === rowData) {
                this.dataBenefitSalary[row].manage = true;
            } else {
                this.dataBenefitSalary[row].manage = false;
            }
        }
    }

    getRowFromBenefitSalaryTableHide(rowData: any): void {
        let row: any;
        for (row in this.dataBenefitSalary) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.dataBenefitSalary.hasOwnProperty(row) && this.dataBenefitSalary[row] === rowData) {
                this.dataBenefitSalary[row].manage = false;
            } else {
                this.dataBenefitSalary[row].manage = true;
            }
        }
    }

    getRowFromClassTableShow(rowData: any): void {
        let row: any;
        for (row in this.sourceForClassData) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.sourceForClassData.hasOwnProperty(row) && this.sourceForClassData[row] === rowData) {
                this.sourceForClassData[row].manage = true;
            } else {
                this.sourceForClassData[row].manage = false;
            }
        }
    }

    getRowFromClassTableHide(rowData: any): void {
        let row: any;
        for (row in this.sourceForClassData) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.sourceForClassData.hasOwnProperty(row) && this.sourceForClassData[row] === rowData) {
                this.sourceForClassData[row].manage = false;
            } else {
                this.sourceForClassData[row].manage = true;
            }
        }
    }

    actualSalaryRowHoverIn(): void {
        this.displayFlag = true;
    }

    actualSalaryRowHoverOut(): void {
        this.displayFlag = false;
    }

    /**
     * get counties for the selected state
     * @param event selected state
     * @return Returns void
     */
    updateStateSelection(event: string): void {
        if (event !== undefined && event !== null && event.length > 0) {
            this.staticService
                .getCounties(event.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (Response) => {
                        this.counties = Response;
                        this.enableCounty();
                    },
                    () => {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noCounties"];
                    },
                );
        } else {
            this.counties = [];
        }
    }

    updateManageSelection(): void {
        this.openDialogSalary("actualSalary");
    }

    salaryMaskingToggler(rowIndex: number, typeOfSalary: string, rowData: any): void {
        if (typeOfSalary === this.actualSalary) {
            this.dataActualSalary[rowIndex].masked = !this.dataActualSalary[rowIndex].masked;
            if (!this.dataActualSalary[rowIndex].unmaskedAnnualSalary) {
                this.showHideSalalry(this.dataActualSalary, rowIndex, rowData, typeOfSalary);
            }
        } else {
            this.dataBenefitSalary[rowIndex].masked = !this.dataBenefitSalary[rowIndex].masked;
            if (!this.dataBenefitSalary[rowIndex].unmaskedAnnualSalary) {
                this.showHideSalalry(this.dataBenefitSalary, rowIndex, rowData, typeOfSalary);
            }
        }
    }

    showHideSalalry(dataOfTable: Salary[], rowIndex: number, rowData: any, typeOfSalary: string): void {
        this.isLoading = true;
        const rowId = rowData.id;
        this.memberService
            .getSalary(this.memberId, false, rowId, this.state?.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((salary) => {
                const annualSalary = salary && salary.annualSalary ? salary.annualSalary : 0;
                dataOfTable[rowIndex]["unmaskedAnnualSalary"] = parseFloat(annualSalary).toFixed(2).toString();
                if (typeOfSalary === this.actualSalary) {
                    this.dataActualSalary = dataOfTable;
                } else {
                    this.dataBenefitSalary = dataOfTable;
                }
                this.isLoading = false;
            });
    }
    /**
     * This function is used to open salary Dialog to add salary
     *  @param dialogFor class type label
     *  @param rowData member class type data
     */
    openDialogSalary(dialogFor: string, rowData?: any): void {
        if (rowData !== undefined) {
            this.memberService
                .getSalary(this.memberId, !this.maskingFlag, rowData.id, this.state?.mpGroupId.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (salary) => {
                        rowData = salary;
                        const dialogRef = this.dialog.open(WorkSalaryPopupComponent, {
                            width: "700px",
                            data: {
                                title:
                                    dialogFor === "actualSalary"
                                        ? this.languageStrings["primary.portal.members.workLabel.editSalary"]
                                        : this.languageStrings["primary.portal.members.workLabel.editBenefitSalary"],
                                fieldType: this.salaryType,
                                editRowData: rowData,
                                allSalaries: this.dataAllSalary,
                                type: dialogFor === "actualSalary" ? this.actualSalary : this.benefitSalary,
                                action: this.SALARY_ACTION_EDIT,
                                salary: this.memberWorkControls.workInformation.get("hoursPerWeek").value,
                            },
                        });
                        dialogRef
                            .afterClosed()
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(() => {
                                this.getMemberSalariesSubscriber = this.memberService
                                    .getSalaries(this.memberId, !this.maskingFlag, this.state?.mpGroupId.toString())
                                    .pipe(takeUntil(this.unsubscribe$))
                                    .subscribe((Response) => {
                                        this.dataAllSalary = Response;
                                        this.dataActualSalary = [];
                                        this.dataBenefitSalary = [];
                                        this.dataSourceActualSalary = new BehaviorSubject([]);
                                        this.dataSourceBenefitSalary = new BehaviorSubject([]);
                                        for (const instance of Response) {
                                            if (instance.type === this.actualSalary) {
                                                this.dataActualSalary.push(instance);
                                            } else {
                                                this.dataBenefitSalary.push(instance);
                                            }
                                        }
                                        for (const actSal of this.dataActualSalary) {
                                            actSal["masked"] = true;
                                        }
                                        for (const benSal of this.dataBenefitSalary) {
                                            benSal["masked"] = true;
                                        }
                                        this.updateHoursPerWeek();
                                        const activeSalary = this.dataAllSalary.find(
                                            (currentSalary) =>
                                                !currentSalary.validity.expiresAfter ||
                                                this.dateService.getIsAfterOrIsEqual(
                                                    new Date(
                                                        format(
                                                            this.dateService.toDate(currentSalary.validity.expiresAfter),
                                                            DateFormats.YEAR_MONTH_DAY,
                                                        ),
                                                    ),
                                                    this.dateService.toDate(format(new Date(), DateFormats.YEAR_MONTH_DAY)),
                                                ),
                                        );
                                        if (!activeSalary?.hourlyWage) {
                                            this.hoursPerWeekControl.setErrors(null);
                                        }
                                        this.dataSourceActualSalary.next(this.dataActualSalary);
                                        this.dataSourceBenefitSalary.next(this.dataBenefitSalary);
                                    });
                                this.isSalaryAddOrEdit = true;
                                this.editMemberDataSync(this.memberId);
                            });
                    },
                    () => {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noSalary"];
                    },
                );
        } else {
            const dialogRef = this.dialog.open(WorkSalaryPopupComponent, {
                width: "700px",
                data: {
                    title:
                        dialogFor === "actualSalary"
                            ? this.languageStrings["primary.portal.members.workLabel.addSalary"]
                            : this.languageStrings["primary.portal.members.workLabel.addBenefitSalary"],
                    fieldType: this.salaryType,
                    editRowData: rowData,
                    allSalaries: this.dataAllSalary,
                    type: dialogFor === "actualSalary" ? this.actualSalary : this.benefitSalary,
                    action: this.SALARY_ACTION_ADD,
                    salary: this.memberWorkControls.workInformation.get("hoursPerWeek").value,
                },
            });
            dialogRef
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((salaryData) => {
                    if (salaryData) {
                        this.getMemberSalariesSubscriber = this.memberService
                            .getSalaries(this.memberId, !this.maskingFlag, this.state?.mpGroupId.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((Response) => {
                                this.dataAllSalary = Response;
                                this.dataActualSalary = [];
                                this.dataBenefitSalary = [];
                                this.dataSourceActualSalary = new BehaviorSubject([]);
                                this.dataSourceBenefitSalary = new BehaviorSubject([]);
                                for (const instance of Response) {
                                    if (instance.type === this.actualSalary) {
                                        this.dataActualSalary.push(instance);
                                    } else {
                                        this.dataBenefitSalary.push(instance);
                                    }
                                }
                                for (const actSal of this.dataActualSalary) {
                                    actSal["masked"] = true;
                                }
                                for (const benSal of this.dataBenefitSalary) {
                                    benSal["masked"] = true;
                                }
                                this.updateHoursPerWeek();
                                this.dataSourceActualSalary.next(this.dataActualSalary);
                                this.dataSourceBenefitSalary.next(this.dataBenefitSalary);
                                this.actualSalaryIsRequiredError = false;
                                this.benefitSalaryIsRequiredError = false;
                            });
                        this.isSalaryAddOrEdit = true;
                        this.editMemberDataSync(this.memberId);
                    }
                });
        }
    }

    /**
     * This function is used to update HoursPerWeek value
     */
    updateHoursPerWeek(): void {
        const currentHourlySalary = this.dataActualSalary.find(
            (salary) =>
                salary.hourlyWage &&
                (!salary.validity.expiresAfter ||
                    this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(format(new Date(salary.validity.expiresAfter), "yyyy-MM-dd")),
                        this.dateService.toDate(format(new Date(), "yyyy-MM-dd")),
                    )),
        );
        if (currentHourlySalary) {
            this.salary = +(currentHourlySalary?.hoursPerYear / this.totalWeeksInYear).toFixed(DIGITS_AFTER_DECIMAL_POINT);
            if (isNaN(this.salary)) {
                this.salary = 0;
            }
        }
    }

    /**
     * This function is used to display class name in class type dropdown.
     * @param dialogFor class type label
     * @param classTypeId class type id
     * @param rowData member class type data
     */
    getDropdownDataClassNames(dialogFor: string, classTypeId: string, rowData?: MemberClassType): void {
        this.isLoading = true;
        this.getMemberClassNamesSubscriber = this.accountProfileService
            .getClasses(classTypeId, this.state?.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    // filteredPeoClasses will gives us PEO classes by removing UNSP peo class from response.
                    const filteredPeoClasses = this.utilService.copy(Response).filter((peoElement) => peoElement.name !== UNSPECIFIED);
                    if (filteredPeoClasses.length) {
                        this.classNames = filteredPeoClasses;
                    } else {
                        this.classNames = Response;
                    }

                    this.openDialogClass(dialogFor, classTypeId, rowData);
                },
                () => {
                    this.isLoading = false;
                    this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noClasses"];
                },
            );
    }

    /**
     * This function is used to open work class popup
     * @param dialogFor popup label
     * @param classTypeId class type id
     * @param rowData input data of work class popup
     */
    openDialogClass(dialogFor: string, classTypeId: string, rowData?: MemberClassType): void {
        this.isLoading = false;
        let searchPEOClassName: string;
        const dialogRef = this.dialog.open(WorkClassPopupComponent, {
            width: "700px",
            data: {
                title: rowData
                    ? this.languageStrings["primary.portal.members.workLabel.editClass"] + ` ${dialogFor}`
                    : this.languageStrings["primary.portal.members.workLabel.addClass"] + ` ${dialogFor}`,
                classTypeId: classTypeId,
                classNames: this.classNames,
                editRowData: rowData,
                state: this.state,
                allClasses: this.classTypes,
            },
        });

        dialogRef
            .afterClosed()
            .pipe(
                tap((data) => (searchPEOClassName = data.data.classData.name)),
                switchMap(() => this.memberService.getMember(this.state.activeMemberId, true, this.state?.mpGroupId.toString())),
                tap((data) => {
                    this.memberWorkForm.patchValue({
                        workInformation: {
                            payrollFrequencyId: data.body.workInformation.payrollFrequencyId.toString(),
                        },
                    });
                    this.memberWorkForm.updateValueAndValidity();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.getClassTypesAndNames()
                    .pipe(
                        filter((resp) => resp !== undefined && resp !== null),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe((resp) => {
                        this.setClassTypeData(resp);
                    });
                const selectedPeoClass = this.peoDepartments.find((x) => x.name === searchPEOClassName);
                if (selectedPeoClass) {
                    this.organizationIDAliases.patchValue(selectedPeoClass);
                    this.saveWork(this.memberWorkForm.value);
                }

                this.changeDetectorRefs.detectChanges();
                this.getMemberClassNamesSubscriber.unsubscribe();
            });
    }

    updateKeyValueInObj(originalObj: unknown, keyToCreate: string, valueToUpdate: any): void {
        Object.defineProperty(originalObj, keyToCreate, {
            value: valueToUpdate,
            writable: true,
        });
    }
    /**
     * function to create new organization
     * @param form - The form details
     * @return observable of boolean which decides whether to save new department or not.
     */
    saveNewDepartment(form: any): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        const payload = {
            name: this.workInformationAliases.get("newDepartmentId").value,
            code: this.workInformationAliases.get("newDepartmentId").value,
            parentId: this.PARENT_ID,
        };

        this.createOrganizationSubscriber = this.accountProfileservice
            .createOrganization(payload)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    const eleArray = Response.headers.get("location").split("/");
                    const newDepartmentId = parseInt(eleArray[eleArray.length - 1], RADIX_TEN);
                    this.newlyCreatedDepartmentID = newDepartmentId;
                    this.addNewDepartmentFlag = false;
                    this.getAccountDetails();
                    this.saveWork(form)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => {
                            returnFlag.next(res);
                        });
                },
                (error) => {
                    if (error.error.status === ClientErrorResponseCode.RESP_409 && error.error.code === ClientErrorResponseType.DUPLICATE) {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.departmentNumber.duplicate"];
                    } else {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.noSaveDetails"];
                    }
                    returnFlag.next(false);
                },
            );
        return returnFlag.asObservable();
    }

    /**
     * This function is used to  trigger updateSalary and to subscribe
     * @param form - The form details
     * @param isTabChanged - indicates whether the flow is from switching tabs (personal/work/contacts)
     * @returns void
     */
    triggerUpdateSalary(form: MemberProfile, isTabChanged?: boolean): void {
        const currentSalaryInfo = this.dataActualSalary.find((salaryInfo) => salaryInfo.ongoing && salaryInfo.hourlyWage);
        if (currentSalaryInfo) {
            const annualSalary = this.hoursPerWeekControl.value * +currentSalaryInfo.hourlyWage * this.totalWeeksInYear;
            if (annualSalary < this.annualSalaryMin) {
                this.hoursPerWeekControl.setErrors({ salaryLessThanMin: true });
            } else if (annualSalary > this.annualSalaryMax) {
                this.hoursPerWeekControl.setErrors({ salaryMoreThanMax: true });
            }
        }
        this.updateSalary(form)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (isTabChanged) {
                    this.navigationFlag = res;
                    this.allowNavigation.next(this.navigationFlag);
                    this.allowNavigation.complete();
                }
            });
    }

    /**
     * This function is used to update the current salary if hours per week value is changed
     * @param form - The form details
     * @returns observable of boolean, flag to allow potentially pending navigation
     */
    updateSalary(form: MemberProfile): Observable<boolean> {
        let activeSalary: Salary;
        let lastSalary: Salary;
        this.isAddressFormTouched = Object.keys(this.memberWorkControls.address.controls).some(
            (key) => key !== IS_PRIMARY_ADDRESS && this.memberWorkControls.address.get(key).value,
        );
        if (!this.isAddressFormTouched) {
            Object.keys(this.memberWorkControls.address.controls).forEach((key) => {
                this.memberWorkForm.controls.address.get(key).clearValidators();
                this.memberWorkForm.controls.address.get(key).setErrors(null);
                this.memberWorkForm.controls.address.get(key).markAsUntouched();
            });
            this.memberWorkForm.controls.address.get(this.zipConst).setValue("");
            this.memberWorkForm.updateValueAndValidity();
        } else {
            this.settingValidations(this.memberWorkForm);
            if (!this.memberWorkForm.controls.address.get(this.zipConst).value) {
                this.memberWorkForm.controls.address.get(this.zipConst).setValue("");
            }
        }
        if (this.memberWorkForm.valid) {
            this.isAddressChanged = this.memberWorkForm.controls.address.dirty;
        }
        return this.memberService.getSalaries(this.memberId, !this.maskingFlag, this.state?.mpGroupId.toString()).pipe(
            tap((salaries) => {
                lastSalary = salaries[salaries.length - 1];
                activeSalary = salaries.find(
                    (salary) =>
                        !salary.validity.expiresAfter ||
                        this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(salary.validity.expiresAfter)),
                );
            }),
            switchMap(() => {
                if (
                    activeSalary &&
                    this.memberWorkForm.valid &&
                    +form.workInformation.hoursPerWeek !==
                        +(activeSalary.hoursPerYear / this.totalWeeksInYear).toFixed(DIGITS_AFTER_DECIMAL_POINT) &&
                    activeSalary.hourlyWage
                ) {
                    return this.empoweredModalService.openDialog(SalaryUpdateConfirmationComponent).afterClosed();
                }
                return of(true);
            }),
            switchMap(() => this.onSubmit(form)),
            switchMap(() => {
                if (!!activeSalary && !!activeSalary.hourlyWage) {
                    this.isLoading = true;
                    this.salaryBody = {
                        type: activeSalary.type,
                        validity: {
                            effectiveStarting: activeSalary.validity.effectiveStarting,
                            expiresAfter: activeSalary.validity.expiresAfter,
                        },
                    };
                    this.salaryBody.annualSalary = (
                        +form.workInformation.hoursPerWeek *
                        +activeSalary.hourlyWage *
                        this.totalWeeksInYear
                    ).toString();
                    this.salaryBody.hoursPerYear = form.workInformation.hoursPerWeek
                        ? +form.workInformation.hoursPerWeek * this.totalWeeksInYear
                        : +form.workInformation.hoursPerWeek;
                    this.salaryBody.hourlyWage = activeSalary.hourlyWage;
                    this.salaryBody["id"] = activeSalary.id;
                    const salaryIndex = this.dataActualSalary.findIndex((salary) => salary.id === activeSalary.id);
                    this.dataActualSalary[salaryIndex].hoursPerYear = +this.salaryBody.hoursPerYear;
                    this.dataActualSalary[salaryIndex].annualSalary = this.salaryBody.annualSalary;
                    this.dataActualSalary[salaryIndex].unmaskedAnnualSalary = parseFloat(this.salaryBody.annualSalary).toFixed(
                        DIGITS_AFTER_DECIMAL_POINT,
                    );
                    this.dataSourceActualSalary.next(this.dataActualSalary);
                } else if (
                    lastSalary &&
                    (!lastSalary?.hourlyWage || this.dateService.isBefore(this.dateService.toDate(lastSalary.validity.expiresAfter)))
                ) {
                    // We are recalculating hoursPerYear value If salary is annual or hourly expired salary
                    this.isLoading = true;
                    this.salaryBody = {
                        type: lastSalary.type,
                        validity: {
                            effectiveStarting: lastSalary.validity.effectiveStarting,
                            expiresAfter: lastSalary.validity.expiresAfter,
                        },
                    };
                    this.salaryBody.annualSalary = lastSalary.annualSalary;
                    if (lastSalary.hourlyWage) {
                        this.salaryBody.hourlyWage = lastSalary.hourlyWage;
                    }
                    this.salaryBody.hoursPerYear = form.workInformation.hoursPerWeek
                        ? +form.workInformation.hoursPerWeek * this.totalWeeksInYear
                        : +form.workInformation.hoursPerWeek;
                    this.salaryBody["id"] = lastSalary.id;
                }
                if (this.salaryBody) {
                    return this.memberService
                        .updateSalary(this.memberId, this.salaryBody, this.mpGroupId)
                        .pipe(finalize(() => (this.isLoading = false)));
                }
                return of(true);
            }),
        );
    }
    /**
     * Save info in form according to the modifications made on department
     * and allow navigation when it is pending.
     *
     * @param form containing employee's work info
     * @returns observable of boolean, flag to allow potentially pending navigation
     */
    onSubmit(form: any): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        if (this.memberWorkForm.valid) {
            const validZip = this.memberWorkForm.controls.address.get(this.zipConst).valid;
            if (this.addNewDepartmentFlag) {
                this.saveNewDepartment(form)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((res) => {
                        if (res) {
                            this.memberWorkForm.controls.workInformation.get("newDepartmentId").clearValidators();
                            this.memberWorkForm.controls.workInformation.get("newDepartmentId").reset();
                            this.organizationIDAliases.setValue(this.newlyCreatedDepartmentID.toString());
                        }
                        returnFlag.next(res);
                    });
            } else if (validZip) {
                this.saveWork(form)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((res) => {
                        returnFlag.next(res);
                    });
            }
            return returnFlag.asObservable();
        }
        this.markFormGroupControlsTouched(this.memberWorkForm);

        return returnFlag.asObservable();
    }
    /**
     * @description Save work info of employee
     * @param form containing employee's work info
     * @param newDepartmentID id of department if new department is created
     * @returns observable of boolean, flag to allow potentially pending navigation
     */
    saveWork(form: any, newDepartmentID?: number): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        this.checkForTableValidation();
        this.checkHireDateChange();
        const memberConditionFlag = this.isMember
            ? !this.memberWorkForm.errors && this.memberWorkForm.controls.address.valid && this.memberWorkForm.valid
            : !this.isMember && this.memberWorkForm.valid;
        if (memberConditionFlag && !this.actualSalaryIsRequiredError && !this.benefitSalaryIsRequiredError) {
            this.customIdFields = form.workInformation.employeeCustomID;
            delete form.workInformation.employeeCustomID;
            this.errorMessage = null;
            this.showMonAlert = false;
            this.checkCount = 2;
            const formData: MemberProfile = Object.assign({}, this.memberWorkForm.getRawValue());
            const contactModel: any = {
                address: formData.address,
            };
            const contactDetailModel = {
                memberId: this.memberId,
                contactType: ContactType.WORK,
                contactModel: contactModel,
                mpGroupId: this.mpGroupId,
            };
            this.updateState = { ...this.state.memberInfo };
            const profile = { ...this.updateState.profile };
            if (contactModel.address && contactModel.address.isPrimaryAddress) {
                profile.correspondenceLocation = ContactType.WORK;
            } else {
                profile.correspondenceLocation = ContactType.HOME;
            }
            this.updateState.profile = { ...profile };
            const model = this.transformWorkData(formData, this.newlyCreatedDepartmentID);
            if (!this.isAccountRatingCodePEO) {
                delete model.workInformation.departmentNumber;
                delete model.workInformation.industryCode;
            } else {
                delete model.workInformation.organizationId;
            }
            if (!this.userIsProducerAdmin) {
                delete model.workInformation.termination;
            }
            this.updateState.workInformation = { ...model.workInformation };
            model.birthDate = this.formatDate(model.birthDate);
            this.isLoading = true;
            this.memberService
                .updateMember(model, this.mpGroupId)
                .pipe(
                    tap((res) => {
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: this.updateState,
                                activeMemberId: this.memberId,
                                mpGroupId: this.mpGroupId,
                            }),
                        );
                        this.enableContact.emit(true);
                        Object.keys(contactDetailModel.contactModel.address).forEach((key) => {
                            if (
                                contactDetailModel.contactModel.address[key] === "" ||
                                contactDetailModel.contactModel.address[key] === null
                            ) {
                                contactDetailModel.contactModel.address[key] = null;
                            }
                        });
                    }),
                    switchMap((res) => this.saveContactDetails(contactDetailModel)),
                    tap((res) => {
                        returnFlag.next(res);
                        this.isSaved = true;
                        this.isFormValueChange = false;
                    }),
                    finalize(() => (this.isLoading = false)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (resp) => {
                        this.memberWorkForm.markAsPristine();
                        this.memberService.setMemberHireDate = model.workInformation.hireDate;
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                        returnFlag.next(false);
                    },
                );
        } else {
            this.isSaved = false;
            this.isFormValueChange = true;
            this.validateAllFormFields(this.memberWorkForm);
            returnFlag.next(false);
        }
        return returnFlag.asObservable();
    }

    /**
     * This function is used to update class type
     * @returns Observable<HttpResponse<void>>
     */
    updateClass(): Observable<HttpResponse<void>> {
        const workInformationData = this.state.memberInfo.workInformation;
        if (workInformationData && workInformationData.departmentNumber && workInformationData.industryCode) {
            const selectedPeoClass = this.peoDepartments.find(
                (x) => x.name === workInformationData.departmentNumber && x.riskClass === workInformationData.industryCode,
            );
            if (selectedPeoClass) {
                this.organizationIDAliases.patchValue(selectedPeoClass);
                const data = {
                    id: selectedPeoClass.id,
                    name: selectedPeoClass.name,
                    validity: {
                        effectiveStarting: this.classTypes[1].classDetails.value[0].validity.effectiveStarting,
                        expiresAfter: "",
                    },
                };
                this.isLoading = true;
                return this.memberService.updateMemberClass(this.memberId, this.classTypes[1].id, data, this.mpGroupId);
            }
        }
        return of(null);
    }

    /**
     * This method will open the address-verify modal.
     * @param option  modal option.
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
                if (elementData.data.isVerifyAddress) {
                    return of(true);
                }
                this.closeModal();
                return of(false);
            }),
        );
    }
    /**
     * This method will close address-verify modal.
     * @returns void
     */
    closeModal(): void {
        this.addressResp = false;
    }
    /**
     * This method will update the verified address.
     * @param providedAddress  user provided address.
     * @returns observable of boolean, flag to allow potentially pending navigation
     */
    verifyAddressDetails(providedAddress: PersonalAddress): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        const addressFormValue = this.memberWorkForm.controls.address.value;
        this.providedAddress = providedAddress;
        if (!this.isAddressFormTouched) {
            return of(false);
        }
        if (this.isAddressSame && this.isAddressSame === addressFormValue) {
            this.isAddressChanged = true;
        }
        if (!this.isOverallAddressVerification || !this.isAddressChanged) {
            this.selectedAddress = AppSettings.TEMPORARY_ADDRESS;
            return of(true);
        }
        this.isAddressSame = addressFormValue;
        this.memberService
            .verifyMemberAddress(providedAddress)
            .pipe(
                tap((resp) => {
                    this.workContactData.addressValidationDate = new Date();
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
                    this.openModal(AppSettings.ADDRESS_BOTH_OPTION)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => returnFlag.next(res));
                },
                (error) => {
                    this.addressMessage = [];
                    this.addressResp = true;
                    this.isLoading = false;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.workContactData.addressValidationDate = new Date();
                        if (error.error.details) {
                            error.error.details.map((item) => this.addressMessage.push(item.message));
                        } else {
                            this.addressMessage.push(
                                this.langService.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                            );
                        }
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.addressMessage.push(
                            this.langService.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                        );
                    } else {
                        this.addressMessage.push(
                            this.langService.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code),
                        );
                    }
                    this.openModal(ADDRESS_OPTIONS.SINGLE, error.status)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => returnFlag.next(res));
                },
            );
        return returnFlag.asObservable();
    }

    /** *
     * This function is used to save member contact details
     * @param contactDetailModel contact detail model
     * @returns observable of boolean which decides whether to save contact details or not
     */
    saveContactDetails(contactDetailModel: any): Observable<boolean> {
        const workAddr = { ...this.workContactData };
        workAddr.address = contactDetailModel.contactModel.address;
        this.workContactData = { ...workAddr };
        const returnFlag = new Subject<boolean>();
        this.workContactData.addressValidationDate = undefined;
        this.verifyAddressDetails(contactDetailModel.contactModel.address)
            .pipe(
                switchMap((res) => {
                    if (!res) {
                        return of(res);
                    }
                    this.workContactData.address =
                        this.selectedAddress === AppSettings.TEMPORARY_ADDRESS
                            ? this.utilService.copy(this.providedAddress)
                            : this.utilService.copy(this.suggestedAddress);
                    Object.keys(this.workContactData.address).forEach((key) => {
                        if (this.workContactData.address[key] === "") {
                            this.workContactData.address[key] = null;
                        }
                    });
                    return this.memberService.saveMemberContact(
                        contactDetailModel.memberId,
                        contactDetailModel.contactType,
                        this.workContactData,
                        contactDetailModel.mpGroupId,
                    );
                }),
                switchMap((res) => this.saveMemberCustomIds()),
                switchMap((res) => this.updateClass()),
                switchMap((res) => this.getClassTypesAndNames()),

                tap((res) => {
                    if (res) {
                        this.setClassTypeData(res);
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    this.isAddressSame = this.workContactData.address;
                    this.isFormValueChange = false;
                    const updateState = { ...this.updateState };
                    if (!updateState.workAddress) {
                        updateState["workAddress"] = {};
                    }
                    updateState.workAddress = this.workContactData;
                    this.updateState = { ...updateState };
                    this.store.dispatch(
                        new AddMemberInfo({
                            memberInfo: this.updateState,
                            activeMemberId: this.memberId,
                            mpGroupId: this.mpGroupId,
                        }),
                    );

                    this.memberWorkForm.patchValue(
                        {
                            ...this.memberWorkForm.value,
                            ...{ address: updateState.workAddress.address },
                        },
                        {
                            emitEvent: false,
                        },
                    );
                    this.memberWorkForm.updateValueAndValidity({ emitEvent: false });
                    this.enableContact.emit(true);
                    this.memberWorkForm.markAsPristine();
                    this.isSaved = true;
                    this.isFormValueChange = false;
                    returnFlag.next(true);
                },
                (error) => {
                    this.isSaved = false;
                    this.isFormValueChange = true;
                    if (error.status && error.status === AppSettings.API_RESP_409) {
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.census.manualEntry.duplicateEmployeeID"];
                    } else {
                        this.showErrorAlertMessage(error);
                    }
                    returnFlag.next(false);
                },
            );
        return returnFlag.asObservable();
    }

    /**
     * This function is used get custom id value
     * @param key custom id fields key {string}
     * @returns string
     */
    getCustomIDValue(key: string): string {
        let customIDValueArray = [];
        let customIDValue: string;
        if (key.toLowerCase() === SSN) {
            if (this.customIdFields[key]) {
                customIDValueArray = this.customIdFields[key].match(/.{1,3}/g);
                customIDValue = customIDValueArray.join("-");
            } else {
                customIDValue = null;
            }
        } else if (key.toUpperCase() === EMPLOYEE_ID) {
            customIDValue = this.customIDAliases.get(EMPLOYEE_ID).value;
        } else {
            customIDValue = this.customIdFields[key];
        }
        return customIDValue;
    }

    /**
     * This function is used to save member custom ids
     * @returns Observable<MemberIdentifier>
     */
    saveMemberCustomIds(): Observable<MemberIdentifier> {
        let returnValue: Observable<MemberIdentifier>;
        if (this.customIdFields) {
            Object.keys(this.customIdFields).forEach((key) => {
                const customId = this.getIdentifierId(key);
                const customIDValue = this.getCustomIDValue(key);
                if (customIDValue && customIDValue !== this.initialCustomIDs[key]) {
                    const memberIdentifier: MemberIdentifier = {
                        id: this.memberId,
                        memberIdentifierTypeId: customId,
                        value: customIDValue,
                        version: null,
                    };
                    returnValue = this.memberService.updateMemberIdentifier(memberIdentifier, +this.mpGroupId).pipe(
                        catchError((error: HttpErrorResponse) => {
                            if (error.status === ClientErrorResponseCode.RESP_404) {
                                return this.memberService.saveMemberIdentifier(memberIdentifier, +this.mpGroupId);
                            }
                            this.showErrorAlertMessage(error);
                            return undefined;
                        }),
                    );
                }
                if (
                    (this.initialCustomIDs[key] && !customIDValue) ||
                    (this.initialCustomIDs[key] === undefined && customIDValue === "" && customId === MemberIdentifierTypeIDs.TYPE)
                ) {
                    returnValue = this.memberService.deleteMemberIdentifier(this.memberId, customId, +this.mpGroupId).pipe(
                        catchError((error: HttpErrorResponse) => {
                            if (error.status === ClientErrorResponseCode.RESP_404) {
                                return of(null);
                            }
                            this.showErrorAlertMessage(error);
                            return undefined;
                        }),
                    );
                }
            });
        }
        return returnValue ? returnValue : of(null);
    }

    getIdentifierId(identifierType: string): number {
        const identifierId = this.memberIdentifierTypes.filter((x) => x.type === identifierType);
        return identifierId[0].id;
    }

    /**
     * This function is used to get the member identifier
     */
    getMemberIdentifier(): void {
        this.memberIdentifierTypes.forEach((element) => {
            const customId = this.getIdentifierId(element.type);
            this.memberService
                .getMemberIdentifier(this.memberId, customId, false, +this.mpGroupId)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    filter(([memberIdentifier]) => !!memberIdentifier),
                    tap(
                        ([memberIdentifier]) => {
                            this.hasCifNumber = [this.hasCifNumber, customId === this.CIF_ID].includes(true);
                            const elementType = element.type;
                            this.customIDAliases.patchValue({ [elementType]: memberIdentifier.value });
                            this.initialCustomIDs[elementType] = memberIdentifier.value;
                        },
                        () => {
                            this.isLoading = false;
                        },
                    ),
                )
                .subscribe();
        });
    }
    /**
     * to transform work profile data
     * @param formData
     * @param newDepartmentID
     * @return object for work data with transformed value
     */
    transformWorkData(formData: any, newDepartmentID?: any): any {
        const data = this.dateFormatter(formData);
        if (data.workInformation.hoursPerWeek) {
            const hoursPerWeekInfo = parseFloat(data.workInformation.hoursPerWeek).toFixed(DIGITS_AFTER_DECIMAL_POINT);
            data.workInformation.hoursPerWeek = hoursPerWeekInfo;
        }
        return {
            id: this.memberId,
            name: this.updateState.name,
            birthDate: this.state.memberInfo.birthDate,
            gender: this.state.memberInfo.gender,
            workInformation: {
                hoursPerWeek: parseFloat(data.workInformation.hoursPerWeek),
                employerName: data.workInformation.employerName,
                occupation: data.workInformation.occupation,
                occupationDescription: data.workInformation.occupationDescription,
                hireDate: data.workInformation.hireDate,
                organizationId: newDepartmentID ? newDepartmentID : data.workInformation.organizationId,
                departmentNumber: this.organizationIDAliases.value
                    ? this.organizationIDAliases.value.name
                    : data.workInformation.departmentNumber,
                industryCode: this.organizationIDAliases.value
                    ? this.organizationIDAliases.value.riskClass
                    : data.workInformation.industryCode,
                payrollFrequencyId: data.workInformation.payrollFrequencyId,
                termination: {
                    terminationCodeId: data.workInformation.terminationCodeId,
                    terminationDate: data.workInformation.terminationDate,
                    comment: data.workInformation.terminationComments,
                },
                employeeId: this.customIdFields ? this.customIdFields.EMPLOYEE_ID : null,
            },
            profile: this.updateState.profile,
        };
    }

    dateFormatter(workFormData: any): any {
        workFormData.workInformation.hireDate = this.datePipe.transform(workFormData.workInformation.hireDate, AppSettings.DATE_FORMAT);
        workFormData.workInformation.terminationDate = this.datePipe.transform(
            workFormData.workInformation.terminationDate,
            AppSettings.DATE_FORMAT,
        );
        return workFormData;
    }

    formatDate(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }
    /**
     * This method resets work info form
     */
    revertForm(): void {
        Object.keys(this.memberWorkControls.address.controls).forEach((key) => {
            this.memberWorkForm.controls.address.get(key).clearValidators();
            this.memberWorkForm.controls.address.get(key).setErrors(null);
            this.memberWorkForm.controls.address.get(key).markAsUntouched();
        });
        this.memberWorkForm.updateValueAndValidity();
        this.isSalaryAddOrEdit = false;
        this.memberWorkForm.reset();
        this.editMemberDataSync(this.state.activeMemberId);
        this.getMemberIdentifier();
        this.memberWorkForm.markAsPristine();
        this.isFormValueChange = false;
        this.isAddressChanged = false;
    }

    openAlert(): void {
        if (this.memberWorkForm.dirty) {
            this.checkAlert = false;
            const dialogData: ConfirmationDialogData = {
                title: "",
                content: `${this.languageStrings["primary.portal.members.commonLabel.savesUpdatesTo"]} ${
                    this.state.activeMemberId ? this.state.memberInfo.name.firstName : ""
                } ${this.state.activeMemberId ? this.state.memberInfo.name.lastName : ""} ${
                    this.languageStrings["primary.portal.members.commomLabel.profileBeforeExiting"]
                }`,
                primaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.common.save"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.common.doNotSave"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
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
            this.triggerUpdateSalary(this.memberWorkForm.value, true);
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }
    /**
     * Function to display error message received from api
     * @param err: Error - the error response from api
     */
    showErrorAlertMessage(err: Error): void {
        const MIN_HOURS_ERROR = "Must work at least";
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS]) {
            if (error[this.DETAILS][0].code === "zip.stateMismatch") {
                return;
            }
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage =
                error.message.indexOf(MIN_HOURS_ERROR) > -1
                    ? error.message
                    : this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }

    checkForTableValidation(): void {
        this.actualSalaryIsRequiredError = false;
        this.benefitSalaryIsRequiredError = false;
        if (this.userIsProducerAdmin) {
            if (this.dataActualSalary.length === 0 && this.actualSalaryIsRequired) {
                this.actualSalaryIsRequiredError = true;
            }
            if (this.dataBenefitSalary.length === 0 && this.benefitSalaryIsRequired) {
                this.benefitSalaryIsRequiredError = true;
            }
        }
    }

    /**
     * Determines if form control is configured as required.
     * @param control form control name
     * @returns whether form field is required
     */
    isRequiredField(control: string): boolean {
        return this.requiredFields.some((e) => e.name === `portal.member.form.work.${control}`);
    }

    /**
     * Marks all controls in a form group as touched. Recursively traverses into deeper layers (controls of nested form groups).
     * @param formGroup the form group to touch
     */
    markFormGroupControlsTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls)
            .map((x) => formGroup.controls[x] as AbstractControl | FormGroup)
            .forEach((control) => {
                control.markAsTouched({ onlySelf: true });

                if ("controls" in control) {
                    this.markFormGroupControlsTouched(control);
                }
            });
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    /**
     * It is used to validate the hire date
     * @param control is of type string and used to define type of date
     * @param form is of type string and used to define form name
     * @param event is of type any used to define the field value
     * @param iteration is of type string and used as iteration and it is an optional
     * @return string message for an error
     */
    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        if (
            (this.memberWorkForm.controls.workInformation.get(control).value === null ||
                this.memberWorkForm.controls.workInformation.get(control).value === "") &&
            event !== ""
        ) {
            return this.languageSecondaryStrings["secondary.portal.common.invalidDateFormat"];
        }
        if (!this.memberWorkForm.controls.workInformation.get(control).value && control === HIRE_DATE && this.isRequiredField(HIRE_DATE)) {
            this.memberWorkForm.controls.workInformation.get(control).setErrors({ required: true });
            return this.languageSecondaryStrings["secondary.portal.members.workValidationMsg.required"];
        }
        if (
            this.memberWorkForm.value.workInformation.hireDate &&
            this.memberWorkForm.value.workInformation.hireDate !== AppSettings.INVALID_DATE &&
            event !== ""
        ) {
            this.validatehireDateChange({ value: this.memberWorkForm.value.workInformation.hireDate });
        }
        if (
            this.memberWorkForm.value.workInformation.terminationDate &&
            this.memberWorkForm.value.workInformation.terminationDate !== AppSettings.INVALID_DATE &&
            event !== ""
        ) {
            this.validateTerminationDate({
                value: this.memberWorkForm.value.workInformation.terminationDate,
            });
        }
        return undefined;
    }
    /**
     * This function changes the department id
     * @param event selected state
     * @return Returns void
     */
    departmentChanged(event: any): void {
        if (this.isAflacUSer) {
            this.addNewDepartmentFlag = event.value === this.ADD_NEW;
            this.isFormValueChange = true;
            if (this.addNewDepartmentFlag) {
                this.workInformationAliases
                    .get("newDepartmentId")
                    .setValidators([Validators.required, Validators.pattern(this.validationRegex.DEPARTMENT_ID)]);
            }
        }
    }

    /**
     * Ths method will handle the form disable if user doesn't have permission.
     * @returns void
     */
    checkFormDisable(): void {
        combineLatest([
            this.sharedService.checkAgentSelfEnrolled(),
            this.utilService
                .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.state?.mpGroupId.toString())
                .pipe(filter(([isRestricted, accountData]) => isRestricted && accountData.thirdPartyPlatformsEnabled)),
        ])
            .pipe(
                filter(([isAgentSelfEnrolled]) => !isAgentSelfEnrolled),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([isAgentSelfEnrolled]) => {
                this.memberWorkForm.disable();
                this.disableFormFields = true;
            });
    }
    /**
     * This method will set isAflacReadOnly boolean flag based on response of canAccessTPIRestrictedModuleInHQAccount.
     * settingValidations() and getReadOnlyHiddenValidation() method will handle validation for fields
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
                    this.isAflacReadOnly = !producerCanEdit && !producerCanPartiallyEdit;
                    this.isPartialEdit = producerCanPartiallyEdit;
                    this.settingValidations(this.memberWorkForm);
                }
                this.getReadOnlyHiddenValidation(this.memberWorkForm);
            });
    }

    /**
     * This method is to set field as read-only by modifying readOnlyFieldElementSetting Object.
     * @param key formControl string for this.memberWorkForm
     * @returns void
     */
    modifyFieldsReadOnlyAccess(key: string): void {
        const readOnlyFieldObj = this.utilService.copy(this.readOnlyFieldElementSetting);
        readOnlyFieldObj[key] = this.isAflacReadOnly || this.isPartialEdit || this.isVestedAgent;
        this.readOnlyFieldElementSetting = readOnlyFieldObj;
    }
    /**
     * This function is used to get memberWork contact
     */
    getMemberWorkContact(): void {
        this.isLoading = true;
        this.memberService
            .getMemberContact(this.memberId, ContactType.WORK, this.mpGroupId)
            .pipe(
                catchError((error) => of(error)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (resp) => {
                    this.workContactData = resp.body;
                    this.memberWorkForm.patchValue(
                        {
                            ...this.memberWorkForm.value,
                            address: this.workContactData?.address,
                        },
                        {
                            emitEvent: false,
                        },
                    );
                    if (this.workContactData?.address) {
                        const state = { ...this.state.memberInfo };
                        state.workAddress = { ...this.workContactData };
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: state,
                                activeMemberId: this.memberId,
                                mpGroupId: this.mpGroupId,
                            }),
                        );
                    }
                    this.memberWorkForm.updateValueAndValidity({ emitEvent: false });
                    this.updateStateSelection(this.workContactData?.address);
                    this.enableCounty();
                    this.memberWorkForm.markAsPristine();
                },
                () => {},
                () => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * This function is used to limit the user entry hours per week field to decimal places
     * @param event: keypress event
     */
    validateNumber(event: HTMLInputElement): void {
        event.value = this.utilService.formatDecimalNumber(event.value);
    }

    /**
     * Trims hours per week field with just decimal point to proper value
     * If the value entered is 50. it will become 50
     * @param event :HTMLInput Event which used to capture event.target
     */
    updateValueValidity(event: HTMLInputElement): void {
        const value = parseFloat(event.value);
        if (value >= 0) {
            this.memberWorkForm.controls.workInformation.get("hoursPerWeek").setValue(value.toString());
        }
    }

    /**
     * If employerName field config is ON and group category is not in special types,
     * then populate the accountName of the group as employer name
     */
    checkAndPopulateEmployerName(): void {
        if (!this.isDirect && this.isEmployerNameFieldEnabled && this.isEmployerNameFieldReadOnly) {
            const employerName =
                this.state.memberInfo?.workInformation?.employerName || this.store.selectSnapshot(AccountInfoState.getAccountInfo)?.name;
            this.memberWorkForm.controls.workInformation.get("employerName").setValue(employerName);
            this.memberWorkForm.controls.workInformation.get("employerName").disable();
        }
    }

    /**
     * @description unsubscribing all the subscriptions
     * @returns {void}
     */
    ngOnDestroy(): void {
        this.checkAlert = false;
        if (this.getMemberSalariesSubscriber !== undefined) {
            this.getMemberSalariesSubscriber.unsubscribe();
        }
        if (this.allowNavigation) {
            this.allowNavigation.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
