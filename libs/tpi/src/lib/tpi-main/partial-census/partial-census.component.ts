/**
 * This component is used to check whether all the required fields of an employee are completed to proceed for the enrollment
 * This component data will come into picture only if there are any required fields
 * If there is no required field, this component data will be skipped
 */
import { Component, OnInit, OnDestroy, ElementRef, HostBinding } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import {
    MemberService,
    AccountProfileService,
    Organization,
    AccountService,
    EmailTypes,
    ShoppingService,
    CoreService,
    ClassNames,
    AflacService,
    BenefitsOfferingService,
    ProductSelection,
    DependentContact,
} from "@empowered/api";
import { Store } from "@ngxs/store";
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from "@angular/forms";
import { tap, switchMap, filter, takeUntil, catchError, mergeMap, map, distinctUntilChanged, startWith, take } from "rxjs/operators";
import { MatRadioChange } from "@angular/material/radio";
import { MatSelectChange } from "@angular/material/select";
import { Subject, of, Observable, combineLatest, iif } from "rxjs";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import {
    TPIState,
    RegexDataType,
    SetRegex,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
    AccountInfoState,
    SharedState,
    filterNullValues,
} from "@empowered/ngxs-store";
import { SetUserContactData } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { EnrollmentState } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import {
    ConfirmSsnService,
    SsnFormatPipe,
    ProfileChangesConfirmPromptComponent,
    CustomValidation,
    AddressVerificationComponent,
} from "@empowered/ui";

import {
    CarrierId,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ConfigName,
    DateFormats,
    JOB_DESCRIPTION_MAX_LENGTH,
    JOB_FIELD_MAX_LENGTH,
    JOB_TITLE_MAX_LENGTH,
    TpiSSOModel,
    Salary,
    AppSettings,
    PhoneContactTypes,
    EnrollmentMethod,
    GroupAttribute,
    RatingCode,
    ContactType,
    PlanOffering,
    Product,
    ProductOffering,
    CorrespondenceType,
    MemberProfile,
    PhoneContact,
    EmailContact,
    UserContactParameters,
    Accounts,
    ClientErrorResponseDetailCodeType,
    MemberContact,
    DateFnsFormat,
    DateFormat,
    BooleanConst,
    GroupAttributeEnum,
    MemberDependent,
    AddressConfig,
    VerifiedAddress,
    PersonalAddress,
    ADDRESS_OPTIONS,
} from "@empowered/constants";
import { AccountProfileBusinessService, TpiServices, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

// component level constants
const CORPORATE = "Corporate";
const INCOME_CONTROL_NAME = "income";
const INCOME_RADIO_VALUE_ONE = "ANNUAL";
const CHAR_MAX_LENGTH_50 = 50;
const CHAR_MAX_LENGTH_200 = 200;
const CHAR_MAX_LENGTH_EMAIL_60 = 60;
const LENGTH_ZERO = 0;
const CHAR_CODE_ASCII_VALUE_8 = 8;
const CHAR_CODE_ASCII_VALUE_48 = 48;
const CHAR_CODE_ASCII_VALUE_57 = 57;
const ELIGIBLE_EMPLOYEE_AGE = 18;
const TOTAL_HRS_FOR_YOUNGER_EMP = 1508;
const MIN_MAX_CONFIG_REGEX_VALUE = /,/g;
const CONTROL_OCCUPATION = "occupation";
const CONTROL_OCCUPATION_DESCRIPTION = "occupationDescription";
const CONTROL_ORGANIZATION = "organizationId";
const CONTROL_CORRESPONDENCE = "correspondenceType";
const LENGTH_TEN = 10;
const LENGTH_ONE = 1;
const FACE_TO_FACE_API_VALUE = "FACE_TO_FACE";
const ACTUAL_SALARY_TYPE = "ACTUAL";
const HOURS_PER_YEAR_SALARY_ZERO = 0;
const SHOP = "tpi/shop";
const EXIT = "tpi/exit";
const CONFIRM_ADDRESS = "tpi/confirm-address";
const ENROLLMENT_METHOD = "tpi/enrollment-method";
const DEFAULT_PARENT_DEPARTMENT_CODE_ID = 1;
const EXPAND_ID = "plan.productId";
const INCOME_RADIO_VALUE_TWO = "BENEFIT";
const UNSPECIFIED = "UNSP";
const DAYS = "days";
const REPLACE_TAG_HIRE_DATE = "##hireDate##";
const REPLACE_TAG_DAY_DIFFERENCE = "##numberOfDays##";
const DECIMAL_PLACE = 2;
const COVERAGE = "tpi/coverage-summary";
const SSN_LENGTH_VALIDATION = 11;
const SSN_INPUT_FIELD = "SSN";
const ITIN_INPUT_FIELD = "ITIN";
const CONFIRM_SSN_INPUT_FIELD_NAME = "confirmSSN";
const INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL = "error.detail.displayText.getPlanOfferings.400.producer.tooOld";
const INVALID_AGE_ERROR_KEY_MEMBER_PORTAL = "error.detail.displayText.getPlanOfferings.400.member.tooOld";
const BOOLEAN_TRUE = "TRUE";
const ADDRESS_BOTH_OPTION = "bothOption";
const API_RESP_400 = 400;
const API_RESP_500 = 500;

@Component({
    selector: "empowered-partial-census",
    templateUrl: "./partial-census.component.html",
    styleUrls: ["./partial-census.component.scss"],
})
export class PartialCensusComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    tpiLnlMode = false;
    ssoAuthData: TpiSSOModel;
    // This variable array is used to store all primary language strings
    languageStrings: Record<string, string>;
    // This variable array is used to store all secondary language strings
    languageSecondaryStrings: Record<string, string>;
    // This formGroup variable contains all form details of the component
    partialCensusForm: FormGroup;
    // This variable is used to store member id
    memberId: number;
    // This variable is used to store mpGroup id or account id
    mpGroup: string;
    // This variable is used to store Member full profile from member service
    memberInfo: MemberProfile;
    // This variable array is used to store member contact details from member service
    memberContactInfo: MemberContact;
    // This variable array is used to store member contact details from member service
    memberContactDetails: MemberContact;
    // This variable tells us whether either of the contact details are filled or not
    isAnyContactFilled = true;
    // This variable represents whether spinner is loading or not
    isSpinnerLoading: boolean;
    // This variable represents whether spinner is loading or not
    isLoading: boolean;
    // This variable represents whether error is present/occurred or not
    error: boolean;
    // This variable is used to store error messages
    errorMessage: string;
    // This variable array is used to store member salary details
    memberSalaries: Salary[] = [];
    // This variable represents whether the form submitted or not
    isFormSubmitted: boolean;
    // This behavior subject for unsubscribing all subscriptions
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    // This variable array is used to store all organization / departments from static service
    organizations: Organization[] = [];
    // This variable defines whether logged-in partner is Aflac or Non-aflac
    isAflacUser: boolean;
    // This variable is used to store hours per week minimum value from configuration
    hoursPerWeekMinConfig: number;
    // This variable is used to store hours per week maximum value from configuration
    hoursPerWeekMaxConfig: number;
    // This variable is used to store maximum hours per week error message
    hoursPerWeekMoreThanMaxErrorMsg: string;
    // This variable is used to store minimum hours per week error message
    hoursPerWeekLessThanMinErrorMsg: string;
    // This variable is used to store all regex validations of type RegexDataType
    validationRegex: RegexDataType;
    // This variable is used to represent whether tpi is in agent-assisted flow or not
    isAgentAssistedFlow: boolean;
    // This variable is used to represent whether occupation field is required or not
    isOccupationFieldRequired: boolean;
    // This variable is used to represent whether Street Address field is required or not
    isStreetAddressRequired: boolean;
    // This variable is used to represent whether occupationDescription field is required or not
    isOccupationDescriptionFieldRequired: boolean;
    // This variable is used to represent whether organization field is required or not
    isOrganizationFieldRequired: boolean;
    isEBS: boolean;
    // This variable is used to represent whether employeeID field is required or not
    isEmployeeIdFieldRequired: boolean;
    // This variable is used to represent minimum value of annual salary
    annualSalaryMin: number;
    // This variable is used to represent maximum value of annual salary
    annualSalaryMax: number;
    // This variable is used to store minimum hourly rate value from configuration
    hourlyRateMinConfig: number;
    // This variable is used to store maximum hourly rate value from configuration
    hourlyRateMaxConfig: number;
    // This variable is used to store minimum weeks per year value from configuration
    weeksPerYearMinConfig: number;
    // This variable is used to store maximum weeks per year value from configuration
    weeksPerYearMaxConfig: number;
    // This variable is used to store maximum hourly rate error message
    hourlyRateMoreThanMaxErrorMsg: string;
    // This variable is used to store minimum hourly rate error message
    hourlyRateLessThanMinErrorMsg: string;
    // This variable is used to store maximum weeks per year error message
    weeksPerYearMoreThanMaxErrorMsg: string;
    // This variable is used to store minimum weeks per year error message
    weeksPerYearLessThanMinErrorMsg: string;
    // This variable is used to store younger employee hours per year error message
    youngerEmployeeHoursPerYearErr: string;
    // This variable represents whether income contains low value than configured or not
    isIncomeHasLowValue: boolean;
    // This variable stores the boolean value from config which represents to enable or skip this component
    enableTpiPartialCensus: string;
    payLogixEnabled: boolean;
    // This variable is used to store maximum length of phone number
    phoneNumberLength: number = AppSettings.PHONE_NUM_MAX_LENGTH;
    // This variable to used enable / hide salary fields
    enableSalaryFields: boolean;
    // This variable is used to assign and compare value in html
    readonly correspondenceType = CorrespondenceType;
    // This variable represents whether any plan is self-assisted or not
    anySelfAssistedProducts: boolean;
    // This variable is used to represent whether employerName field is required or not
    isEmployerNameFieldRequired: boolean;
    // This variable will store undefined department id tooltip value
    undefinedDepartmentTooltipValue: string;
    // This variable is used check employer name field config
    isEmployerNameFieldEnabled: boolean;
    // This variable is used check if the account type is allowed to add employer name
    isEmployerNameFieldReadOnly: boolean;
    readonly ADD_NEW_DEPARTMENT_ID = "ADD_NEW_DEPARTMENT";
    private readonly ssnManualInputSubject$: Subject<string> = new Subject<string>();
    addNewDepartmentFlag: boolean;
    newlyCreatedDepartment: string;
    minSalaryRequiredProducts: string[] = [];
    allPlanOfferings: PlanOffering[] = [];
    productSpecificMinSalary: number;
    annualSalaryMinMaxErrorMessage: string;
    enrollmentState: string;
    productDetail: Product;
    invalidErrorMsgState = false;
    invalidErrorMsgAge = false;
    accountDetails: Accounts;
    peoDepartments: ClassNames[];
    isAccountRatingCodePEO = false;
    departmentFieldLabel: string;
    ssnLengthValidation = SSN_LENGTH_VALIDATION;
    isSSNMandatoryConfigEnabled: boolean;
    existingCoverageUpdateRequired: boolean;
    max_length = JOB_FIELD_MAX_LENGTH;
    agInfoMessage: string;
    referenceDate: string;
    productChoices: ProductSelection[];
    isPlanOfferingsLoaded = false;
    ssnConfirmationEnabled = false;
    relaxSSNForTestMember = true;
    accountName: string;
    dependents: MemberDependent[];
    isMemberCIF: boolean = false;
    isStandaloneDemographicEnabled: boolean;
    SELF_SERVICE = EnrollmentMethod.SELF_SERVICE;
    addressValidationSwitch: boolean;
    enableDependentUpdateAddressModal: boolean;
    addressRespDetails: boolean;
    addressVerificationMessages: string[] = [];
    address: any;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is instance of LanguageService
     * @param memberService is instance of MemberService
     * @param store is instance of Store
     * @param formBuilder is the instance of FormBuilder
     * @param accountProfileService is instance of AccountProfileService
     * @param staticUtilService is instance of StaticUtilService
     * @param elementRef is instance of ElementRef
     * @param utilService is instance of UtilService
     * @param accountService is instance of AccountService
     * @param router is instance of Router
     * @param datePipe is instance of DatePipe
     * @param tpiService is instance of TpiServices
     * @param shoppingService is instance of ShoppingService
     * used to call @method getPrimaryLanguageKeys which loads primary key values
     * used to call @method getSecondaryLanguageKeys which loads secondary key values
     */
    constructor(
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly formBuilder: FormBuilder,
        private readonly accountProfileService: AccountProfileService,
        private readonly staticUtilService: StaticUtilService,
        private readonly elementRef: ElementRef,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly datePipe: DatePipe,
        private readonly tpiService: TpiServices,
        private readonly shoppingService: ShoppingService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly coreService: CoreService,
        private readonly accountProfileBusinessService: AccountProfileBusinessService,
        private readonly sharedService: SharedService,
        private readonly aflacService: AflacService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly confirmSsnService: ConfirmSsnService,
        private readonly ssnFormatPipe: SsnFormatPipe,
        private readonly dateService: DateService,
        private readonly customValidation: CustomValidation,
    ) {
        this.getPrimaryLanguageKeys();
    }
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method loadLanguageAndServiceCalls
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.loadLanguageAndServiceCalls();
        this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        if (this.ssoAuthData.productId) {
            this.getProductDetails(this.ssoAuthData.productId);
        }
        this.tpiService.setIsAgeError(false);
        this.getConfigForAddress();
    }
    /**
     *  Function will provide the product detail based on product id
     *  @param productId product id passed in TPI URL
     *  @returns void
     */
    getProductDetails(productId: number): void {
        this.coreService
            .getProduct(productId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productDetail) => {
                this.productDetail = productDetail;
            });
    }
    /**
     * This method is used to fetch all secondary language strings from language service
     */
    getSecondaryLanguageKeys(): void {
        this.languageSecondaryStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.common.work.errHoursPerWeekMax",
            "secondary.portal.common.work.errHoursPerWeekMin",
            "secondary.portal.common.work.errHourlyRateMax",
            "secondary.portal.members.contactValidationMsg.maxlength60",
            "secondary.portal.members.contactValidationMsg.invalidEmail",
            "secondary.portal.members.contactValidationMsg.emailRequired",
            "secondary.portal.common.work.errHoursPerWeekDecimal",
            "secondary.portal.members.contactValidationMsg.invalidPhoneNumber",
            "secondary.portal.common.work.errWeekPerYearMax",
            "secondary.portal.common.work.errWeekPerYearMin",
            "secondary.portal.common.work.errHourlyRateMin",
            "secondary.portal.common.work.errHoursPerYearDOB",
            "secondary.portal.tpiEnrollment.errorOccupation.pattern",
            "secondary.portal.census.manualEntry.newDepartmentIdError",
            "secondary.portal.tpiEnrollment.partialCensus.errorSalary",
            "secondary.portal.tpiEnrollment.stateNotAvailable",
            "secondary.portal.tpiEnrollment.hireDateInFuture",
            "secondary.portal.tpiEnrollment.producer.tooOld.singleProduct",
            "secondary.portal.tpiEnrollment.member.tooOld.singleProduct",
            "secondary.portal.common.maxLength200",
            "secondary.portal.common.maxLength50",
            "secondary.portal.members.api.email.restrictedDomain.errorMessage",
        ]);
    }
    /**
     * This method is used to fetch all primary language strings from language service
     */
    getPrimaryLanguageKeys(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.tpiEnrollment.streetAddressOne",
            "primary.portal.tpiEnrollment.streetAddressTwo",
            "primary.portal.tpiEnrollment.tpiValidationMsg.streetAddres1",
            "primary.portal.common.optional",
            "primary.portal.callCenter.aptUnit",
            "primary.portal.tpiEnrollment.reviewResidentAddress",
            "primary.portal.tpiEnrollment.addressChangeConfirmation",
            "primary.portal.tpiEnrollment.selfService.addressConfirmation",
            "primary.portal.tpiEnrollment.jobTitle",
            "primary.portal.tpiEnrollment.jobDuties",
            "primary.portal.tpiEnrollment.employeeID",
            "primary.portal.tpiEnrollment.departmentID",
            "primary.portal.tpiEnrollment.income",
            "primary.portal.tpiEnrollment.annual",
            "primary.portal.tpiEnrollment.hourly",
            "primary.portal.tpiEnrollment.contactType",
            "primary.portal.tpiEnrollment.homePhone",
            "primary.portal.tpiEnrollment.cellPhone",
            "primary.portal.tpiEnrollment.email",
            "primary.portal.tpiEnrollment.deliveryPreference",
            "primary.portal.common.placeholderSelect",
            "primary.portal.common.invalidEmailAddress",
            "primary.portal.common.continue",
            "primary.portal.common.back",
            "primary.portal.common.requiredField",
            "primary.portal.common.placeholderSelect",
            "primary.portal.common.selectionRequired",
            "primary.portal.tpiEnrollment.exit",
            "primary.portal.members.mappPolicyDeliveryMsgElectronic",
            "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
            "primary.portal.members.mappPolicyDeliveryMsgPaper",
            "primary.portal.members.mmpPolicyDeliveryMsgPaper",
            "primary.portal.setPrices.dollar",
            "primary.portal.tpi.partialCensus.organisation",
            "primary.portal.tpi.partialCensus.hoursPerWeek",
            "primary.portal.tpi.partialCensus.hourlyRate",
            "primary.portal.tpi.partialCensus.weeksPerYear",
            "primary.portal.tpi.partialCensus.emailRequired",
            "primary.portal.tpi.partialCensus.electronic",
            "primary.portal.tpi.partialCensus.paper",
            "primary.portal.tpi.partialCensus.equalTo",
            "primary.portal.tpi.partialCensus.undefined",
            "primary.portal.tpi.partialCensus.incomeQualify",
            "primary.portal.tpi.partialCensus.completeProfile",
            "primary.portal.tpiEnrollment.annualIncome",
            "primary.portal.tpi.partialCensus.departmentId",
            "primary.portal.tpiEnrollment.member.department.undefined",
            "primary.portal.census.manualEntry.addNewDepartmentId",
            "primary.portal.census.manualEntry.newDepartmentId",
            "primary.portal.census.manualEntry.newDepartmentIdHint",
            "primary.portal.members.mmpPaperPolicyDelivery",
            "primary.portal.members.mmpElectronicPolicyDelivery",
            "primary.portal.census.manualEntry.departmentPeoRating",
            "primary.portal.member.ssn_itin",
            "primary.portal.members.beneficiaryValidationMsg.streetAddress1",
            "primary.portal.partialCensus.ProducerPortalInfoMessage",
            "primary.portal.members.contactLabel.phoneNumber",
            "primary.portal.tpi.MemberPortalInfoMessage",
            "primary.portal.pda.form.employerName",
            "primary.portal.direct.addCustomer.employerName",
        ]);
    }
    /**
     * used to @dispatch secondaryLanguages into store
     * used to call @method initiateForm which initiates the @var partialCensusForm form group
     * used to call @method getGroupInfoFromStore which gathers memberId and MP-Group
     * used to call @method getMinAndMaxConfiguration which gathers min, max value of hoursPerWeek from configurations
     * used to call @method setValidationsForHourlyRate which sets validations for hourlyRate
     * used to call @method setValidatorsForHoursPerWeek which sets validations for hoursPerWeek
     * used to call @method setValidationsForWeekPerYear which sets validations for weeks per year
     * used to call @api getOrganizations and stores in @var organizations
     * used to call @method getMemberInfo which returns Observable<Salaries[]>
     */
    loadLanguageAndServiceCalls(): void {
        this.store
            .dispatch(new LoadSecondaryLandingLanguage("secondary.*"))
            .pipe(
                switchMap(() => this.store.select(SharedState.regex)),
                tap((data) => {
                    if (data) {
                        this.validationRegex = data;
                    }
                }),
                tap((res) => {
                    this.getSecondaryLanguageKeys();
                    this.initiateForm();
                    this.getGroupInfoFromStore();
                }),
                switchMap((res) =>
                    this.store.selectSnapshot(AccountInfoState.getMpGroupId) === this.mpGroup.toString()
                        ? this.store.select(AccountInfoState.getAccountInfo)
                        : this.accountService.getAccount(this.mpGroup.toString()),
                ),
                tap((accountDetails) => {
                    if (accountDetails) {
                        this.isAccountRatingCodePEO = accountDetails.ratingCode === RatingCode.PEO;
                        this.accountName = accountDetails.name;
                    }
                }),
                switchMap((res) =>
                    iif(
                        () => this.isAccountRatingCodePEO,
                        this.accountProfileBusinessService.getEmployeePEOClasses(this.mpGroup.toString(), CarrierId.AFLAC),
                        this.accountProfileService.getOrganizations(this.mpGroup),
                    ),
                ),
                tap((res) => (this.isAccountRatingCodePEO ? this.arrangePEOOrganization(res) : this.arrangeOrganization(res))),
                switchMap(() => this.getMemberInfo()),
                switchMap(() => this.getGroupAttributesByNameSubscriber()),
                tap((data) => {
                    this.getGroupAttributesByName(data);
                }),
                mergeMap(() => this.getMinAndMaxConfiguration()),
                switchMap(() => this.getTpiAvailabilityConfig()),
                tap((res) => (this.enableTpiPartialCensus = res)),
                switchMap(() => this.getPayLogixConfig()),
                tap((value) => (this.payLogixEnabled = BOOLEAN_TRUE === value)),
                switchMap(() => this.sharedService.isSSNRequiredForPartialCensus(+this.mpGroup)),
                tap((isSSNMandatoryConfigEnabled: boolean) => (this.isSSNMandatoryConfigEnabled = isSSNMandatoryConfigEnabled)),
                switchMap(() =>
                    this.staticUtilService
                        .cacheConfigs([ConfigName.SSN_CONFIRMATION_ENABLED, ConfigName.RELAX_SSN_FOR_TEST_MEMBER])
                        .pipe(take(1)),
                ),
                tap(([ssnConfirmationEnabled, relaxSSNForTestMember]) => {
                    this.ssnConfirmationEnabled = this.staticUtilService.isConfigEnabled(ssnConfirmationEnabled);
                    this.relaxSSNForTestMember = this.staticUtilService.isConfigEnabled(relaxSSNForTestMember);
                }),
                switchMap(() => this.sharedService.isEmployerNameFieldEnabled(+this.mpGroup)),
                tap(([isEmployerNameFieldEnabled, isEmployerNameFieldReadOnly]) => {
                    this.isEmployerNameFieldEnabled = isEmployerNameFieldEnabled;
                    this.isEmployerNameFieldReadOnly = isEmployerNameFieldReadOnly;
                }),
                switchMap(() => this.memberService.getMemberDependents(this.memberId, true, +this.mpGroup)),
                tap((dependents) => (this.dependents = dependents)),
                catchError((error) => of(error)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    if (this.enableTpiPartialCensus && this.enableTpiPartialCensus.toLowerCase() === AppSettings.FALSE) {
                        if (this.memberInfo.workInformation.termination.terminationDate) {
                            this.router.navigate([COVERAGE]);
                        } else {
                            this.router.navigate([SHOP]);
                        }
                    }
                    if (this.memberInfo) {
                        this.patchDefaultPreferenceValueAndDepartment();
                        this.setRequiredFieldValidations();
                        if (
                            this.isSSNMandatoryConfigEnabled &&
                            (!this.memberInfo?.ssn || (this.ssnConfirmationEnabled && !this.memberInfo?.ssnConfirmed))
                        ) {
                            this.setupConfirmSSNField();
                        }
                    }
                    this.isSpinnerLoading = false;
                    this.error = false;
                },
                (error: HttpErrorResponse) => {
                    this.isSpinnerLoading = false;
                    this.displayDefaultError(error);
                },
            );
    }

    /**
     * @description Method to check if dependent address is empty and to update if it is empty
     * @returns void
     */
    checkDependentAddress(): void {
        this.dependents?.forEach((dependent) => {
            this.memberService
                .getDependentContact(this.memberId, dependent.id.toString(), +this.mpGroup)
                .pipe(
                    mergeMap((dependentAddress) => {
                        if (!dependentAddress.address.address1 || !dependentAddress.address.city) {
                            const dependentContact: DependentContact = { ...dependentAddress };
                            dependentContact.address.address1 = dependentAddress.address.address1
                                ? dependentAddress.address.address1
                                : this.memberContactInfo.address.address1;
                            dependentContact.address.address2 = this.memberContactInfo.address.address2 || "";
                            dependentContact.address.city = dependentAddress.address.city
                                ? dependentAddress.address.city
                                : this.memberContactInfo.address.city;
                            return this.memberService.saveDependentContact(
                                dependentContact,
                                this.memberId,
                                dependent.id.toString(),
                                +this.mpGroup,
                            );
                        }
                        return of(null);
                    }),
                    catchError(() => of(null)),
                )
                .pipe(take(1))
                .subscribe();
        });
    }
    /**
     * This method is used to patch value to the control.
     * If the correspondenceType value is present in DB, then patching that value else default value
     */
    patchDefaultPreferenceValueAndDepartment(): void {
        this.partialCensusForm.controls.deliveryPreference.patchValue(
            this.memberInfo.profile.correspondenceType ? this.memberInfo.profile.correspondenceType : CorrespondenceType.ELECTRONIC,
        );
        if (this.isOrganizationFieldRequired) {
            this.partialCensusForm.controls.departmentID.patchValue(
                this.memberInfo.workInformation.organizationId &&
                    this.memberInfo.workInformation.organizationId !== DEFAULT_PARENT_DEPARTMENT_CODE_ID
                    ? this.memberInfo.workInformation.organizationId
                    : null,
            );
            this.departmentFieldLabel = this.isAflacUser
                ? this.languageStrings["primary.portal.tpiEnrollment.departmentID"]
                : this.languageStrings["primary.portal.tpi.partialCensus.organisation"];
        }

        if (this.isAccountRatingCodePEO) {
            this.partialCensusForm.controls.departmentID.patchValue(
                this.memberInfo.workInformation.departmentNumber
                    ? this.peoDepartments.find((peo) => peo.name === this.memberInfo.workInformation.departmentNumber)
                    : this.peoDepartments[0],
            );
            this.departmentFieldLabel = this.languageStrings["primary.portal.census.manualEntry.departmentPeoRating"];
        }
    }
    /**
     * This method is used to check dataField and assign value and to add validators for controls
     * @param updatedMemberProfileVar is instance of MemberProfile
     * @param dataField is current control name value of type string
     * @param control is current Abstract control
     * @param maxLengthValidator is an optional field of type number which represents max-length validation
     */
    setValidationsAndValues(
        updatedMemberProfileVar: MemberProfile,
        dataField: string,
        control: AbstractControl,
        maxLengthValidator?: number,
    ): void {
        if (updatedMemberProfileVar) {
            switch (dataField) {
                case CONTROL_OCCUPATION:
                    updatedMemberProfileVar.workInformation.occupation = control.value;
                    break;
                case CONTROL_OCCUPATION_DESCRIPTION:
                    updatedMemberProfileVar.workInformation.occupationDescription = control.value;
                    break;
                case CONTROL_ORGANIZATION:
                    updatedMemberProfileVar.workInformation.organizationId = control.value;
                    updatedMemberProfileVar.organizationId = control.value;
                    break;
                case CONTROL_CORRESPONDENCE:
                    updatedMemberProfileVar.profile.correspondenceType = control.value;
                    break;
            }
        } else if (maxLengthValidator) {
            control.setValidators([
                Validators.required,
                Validators.maxLength(maxLengthValidator),
                Validators.pattern(this.validationRegex.JOB_TITLE),
            ]);
        } else {
            control.setValidators([Validators.required]);
        }
    }
    /**
     * This method is used to set validations for the fields which are required and to set values to updatedMemberProfileVar
     * @param updatedMemberProfileVar instance of MemberProfile and sets to null if no value passed to it
     */
    setRequiredFieldValidations(updatedMemberProfileVar: MemberProfile = null): void {
        if (!this.memberInfo.workInformation.employerName && this.isEmployerNameFieldEnabled && !this.isEmployerNameFieldReadOnly) {
            this.isEmployerNameFieldRequired = true;
            this.partialCensusForm.controls.employerName.setValidators([Validators.required, Validators.maxLength(100)]);
        }
        if (!this.memberInfo.workInformation.occupation) {
            this.isOccupationFieldRequired = true;
            this.setValidationsAndValues(
                updatedMemberProfileVar,
                CONTROL_OCCUPATION,
                this.partialCensusForm.controls.occupation,
                CHAR_MAX_LENGTH_50,
            );
        }
        if (!this.memberInfo.workInformation.occupationDescription) {
            this.isOccupationDescriptionFieldRequired = true;
            this.setValidationsAndValues(
                updatedMemberProfileVar,
                CONTROL_OCCUPATION_DESCRIPTION,
                this.partialCensusForm.controls.occupationDescription,
                CHAR_MAX_LENGTH_200,
            );
        }
        if (!this.memberInfo.workInformation?.employeeId && this.isEmployeeIdFieldRequired) {
            if (updatedMemberProfileVar) {
                updatedMemberProfileVar.workInformation.employeeId = this.partialCensusForm.controls.employeeID.value;
            } else {
                this.partialCensusForm.controls.employeeID.setValidators([
                    Validators.required,
                    Validators.pattern(this.validationRegex.ALPHANUMERIC),
                ]);
            }
        }
        if (
            (!this.memberInfo.organizationId || this.memberInfo.organizationId === DEFAULT_PARENT_DEPARTMENT_CODE_ID) &&
            this.isOrganizationFieldRequired
        ) {
            this.setValidationsAndValues(updatedMemberProfileVar, CONTROL_ORGANIZATION, this.partialCensusForm.controls.departmentID);
        }
        this.setValidationsAndValues(updatedMemberProfileVar, CONTROL_CORRESPONDENCE, this.partialCensusForm.controls.deliveryPreference);
        this.setSalaryEmailValidations(updatedMemberProfileVar);
        this.setPhoneValidator();
        this.setAddressValidator();
        // Adding SSN validators If Config is enabled for the group and SSN is not present in profile of member
        if (this.isSSNMandatoryConfigEnabled && !this.memberInfo.ssn) {
            const isTestMember = !!this.memberInfo.profile?.test;
            this.partialCensusForm.controls.ssn.setValidators([
                Validators.required,
                this.relaxSSNForTestMember && isTestMember
                    ? Validators.nullValidator
                    : Validators.pattern(this.validationRegex.UNMASKSSN_ITIN),
                Validators.minLength(SSN_LENGTH_VALIDATION),
            ]);
        }
    }
    /**
     * Updates values on manual SSN input.
     * @param value input value
     */
    onSSNInputChange(value: string): void {
        const formattedSSN = this.ssnFormatPipe.transform(value, new RegExp(this.validationRegex.SSN_SPLIT_FORMAT));
        this.partialCensusForm.controls.ssn?.setValue(formattedSSN);
        this.ssnManualInputSubject$.next(formattedSSN);
    }
    /**
     * Initializes the confirm SSN field and sets up listeners to enable/disable it.
     */
    setupConfirmSSNField(): void {
        const ssnSplitPattern = new RegExp(this.validationRegex.SSN_SPLIT_FORMAT);
        this.partialCensusForm.addControl(
            CONFIRM_SSN_INPUT_FIELD_NAME,
            this.formBuilder.control({ value: "", disabled: !this.memberInfo.ssn }, { validators: [Validators.required] }),
        );
        const ssnInput = this.partialCensusForm.controls.ssn as FormControl;
        const confirmSSNInput = this.partialCensusForm.controls.confirmSSN as FormControl;
        const latestValidSSN$ = ssnInput.valueChanges.pipe(
            filter((ssn: string) => !ssn || (ssn.length === SSN_LENGTH_VALIDATION && !ssn.includes("X"))),
        );
        this.confirmSsnService
            .updateValidators(
                confirmSSNInput,
                latestValidSSN$,
                this.partialCensusForm.controls.ssn.statusChanges.pipe(distinctUntilChanged()),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.confirmSsnService
            .updateControl(confirmSSNInput, latestValidSSN$, this.ssnManualInputSubject$.asObservable())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        ssnInput.setValue(this.ssnFormatPipe.transform(this.memberInfo.ssn, ssnSplitPattern));
        if (this.memberInfo.ssn) {
            ssnInput.disable();
        }
    }
    /**
     * Function to update the form control value on keyup
     * @param ssnInputElement form control element of confirmSSN
     */
    confirmSSNFormControlUpdate(ssnInputElement: HTMLInputElement): void {
        this.partialCensusForm.controls.confirmSSN?.setValue(ssnInputElement?.value);
    }
    /**
     * This method is used to add validators for salary and email id fields
     * @param updatedMemberProfileVar instance of MemberProfile
     */
    setSalaryEmailValidations(updatedMemberProfileVar: MemberProfile): void {
        this.enableSalaryFields = false;
        if (
            this.memberSalaries &&
            (!this.memberSalaries.length ||
                (this.memberSalaries.length && !this.memberSalaries[this.memberSalaries.length - LENGTH_ONE].annualSalary) ||
                this.memberSalaries[this.memberSalaries.length - LENGTH_ONE].hoursPerYear === HOURS_PER_YEAR_SALARY_ZERO ||
                (this.allPlanOfferings.filter(
                    (eachOffering) => this.minSalaryRequiredProducts.indexOf(eachOffering.plan.product.adminName) !== -1,
                ).length &&
                    +this.memberSalaries[this.memberSalaries.length - LENGTH_ONE].annualSalary < this.productSpecificMinSalary))
        ) {
            this.partialCensusForm.controls.income.setValidators([Validators.required]);
            this.enableSalaryFields = true;
            this.partialCensusForm.controls.annualIncome.setValidators([
                Validators.required,
                Validators.min(this.annualSalaryMin),
                Validators.max(this.annualSalaryMax),
            ]);
            if (!updatedMemberProfileVar && this.memberSalaries && this.memberSalaries.length) {
                this.prePopulateSalaryValues();
            }
        }

        this.setEmailValidator(
            !this.memberContactInfo?.emailAddresses?.length &&
                ((this.isEBS && this.payLogixEnabled) ||
                    this.partialCensusForm.controls.deliveryPreference.value === CorrespondenceType.ELECTRONIC),
        );
    }
    /**
     * This method is used to pre-populate salary fields and to add validators accordingly
     * This method is used to call @method setValidatorsForHourlySalary which set Validations for hourly income
     */
    prePopulateSalaryValues(): void {
        const recentMemberSalary: Salary = this.memberSalaries[this.memberSalaries.length - LENGTH_ONE];
        this.partialCensusForm.controls.annualIncome.patchValue(
            recentMemberSalary.annualSalary ? Math.floor(+recentMemberSalary.annualSalary) : null,
        );
        if (this.partialCensusForm.controls.annualIncome.value) {
            this.checkIncomeValue();
        }
        this.partialCensusForm.controls.hourlyRate.patchValue(recentMemberSalary.hourlyWage ? +recentMemberSalary.hourlyWage : null);
        if (recentMemberSalary.hourlyWage) {
            this.partialCensusForm.controls.totalIncomeForHourlyWage.patchValue(
                recentMemberSalary.annualSalary ? Math.floor(+recentMemberSalary.annualSalary) : null,
            );
            this.partialCensusForm.controls.totalIncomeForHourlyWage.patchValue(
                recentMemberSalary.annualSalary ? Math.floor(+recentMemberSalary.annualSalary) : null,
            );
            this.partialCensusForm.controls.income.patchValue(INCOME_RADIO_VALUE_TWO);
            this.setValidatorsForHourlySalary();
        }
    }

    /**
     *This method validates the email input field based on electronic delivery preference
     * @param event: MatRadioChange , delivery preference value entered
     */
    onChangeDeliveryPreference(event: MatRadioChange): void {
        this.setEmailValidator(
            ((this.isEBS && this.payLogixEnabled) || event.value === CorrespondenceType.ELECTRONIC) &&
                !this.memberContactInfo.emailAddresses.length,
        );

        this.partialCensusForm.controls.emailID.updateValueAndValidity();
    }

    /**
     * Method to validate email field based on condition
     * @param value : boolean, value based on the condition
     */
    setEmailValidator(value: boolean): void {
        const validatorList = [Validators.pattern(this.validationRegex.EMAIL), Validators.maxLength(CHAR_MAX_LENGTH_EMAIL_60)];
        if (value) {
            validatorList.push(Validators.required);
        }
        this.partialCensusForm.controls.emailID.setValidators(validatorList);
    }
    /**
     * Method to validate phone number fields for proper input format
     */
    setPhoneValidator(): void {
        const validatorList = [Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))];
        this.partialCensusForm.controls.cellPhoneNumber.setValidators(validatorList);
        this.partialCensusForm.controls.homePhoneNumber.setValidators(validatorList);
    }
    /**
     * Method to validate phone number fields for proper input format
     */
    setAddressValidator(): void {
        const streetAddressOnevalidatorList = [Validators.required, Validators.pattern(this.validationRegex.ADDRESS)];
        const streetAddressTwovalidatorList = [Validators.pattern(this.validationRegex.ADDRESS)];
        this.partialCensusForm.controls.street1Control.setValidators(streetAddressOnevalidatorList);
        this.partialCensusForm.controls.street2Control.setValidators(streetAddressTwovalidatorList);
    }
    /**
     * Method to fetch configurations
     */
    getConfigForAddress(): void {
        // Config to check if address validation and dependent address update modal is required
        this.staticUtilService
            .cacheConfigs([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([addressValidationSwitch, enableDependentUpdateAddressModal]) => {
                this.addressValidationSwitch = this.staticUtilService.isConfigEnabled(addressValidationSwitch);
                this.enableDependentUpdateAddressModal = this.staticUtilService.isConfigEnabled(enableDependentUpdateAddressModal);
            });

        // Config to check if Standalone Demographic Changes is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));
    }
    /**
     * This method is used to set validations for weeklyRate
     * @param minWeeklyRate is minimum weekly rate value from config
     * @param maxWeeklyRate is maximum weekly rate value from config
     */
    setValidationsForWeekPerYear(minWeeklyRate: string, maxWeeklyRate: string): void {
        this.weeksPerYearMinConfig = parseFloat(minWeeklyRate.replace(MIN_MAX_CONFIG_REGEX_VALUE, ""));
        this.weeksPerYearMaxConfig = parseFloat(maxWeeklyRate.replace(MIN_MAX_CONFIG_REGEX_VALUE, ""));
        this.partialCensusForm.controls.weeksPerYear.setValidators([
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.weeksPerYearMinConfig),
            Validators.max(this.weeksPerYearMaxConfig),
        ]);
        this.weeksPerYearMoreThanMaxErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errWeekPerYearMax"].replace(
            "##MAXHOURS##",
            maxWeeklyRate,
        );
        this.weeksPerYearLessThanMinErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errWeekPerYearMin"].replace(
            "##MINHOURS##",
            minWeeklyRate,
        );
    }
    /**
     * This method is used to set validations for hourlyRate
     * @param minHourlyRate is minimum hourly rate value from config
     * @param maxHourlyRate is maximum hourly rate value from config
     */
    setValidationsForHourlyRate(minHourlyRate: string, maxHourlyRate: string): void {
        this.hourlyRateMinConfig = parseFloat(minHourlyRate.replace(MIN_MAX_CONFIG_REGEX_VALUE, ""));
        this.hourlyRateMaxConfig = parseFloat(maxHourlyRate.replace(MIN_MAX_CONFIG_REGEX_VALUE, ""));
        this.partialCensusForm.controls.hourlyRate.setValidators([
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.hourlyRateMinConfig),
            Validators.max(this.hourlyRateMaxConfig),
        ]);
        this.hourlyRateMoreThanMaxErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errHourlyRateMax"].replace(
            "##MAXWAGE##",
            maxHourlyRate,
        );
        this.hourlyRateLessThanMinErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errHourlyRateMin"].replace(
            "##MINWAGE##",
            minHourlyRate,
        );
    }
    /**
     * This method is used to set minimum, maximum limit for hoursPerWeek and
     * sets maximum and minimum error messages
     */
    setValidatorsForHoursPerWeek(): void {
        this.partialCensusForm.controls.hoursPerWeek.setValidators([
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.hoursPerWeekMinConfig),
            Validators.max(this.hoursPerWeekMaxConfig),
        ]);
        this.hoursPerWeekMoreThanMaxErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errHoursPerWeekMax"].replace(
            "##MAXHOURS##",
            String(this.hoursPerWeekMaxConfig),
        );

        this.hoursPerWeekLessThanMinErrorMsg = this.languageSecondaryStrings["secondary.portal.common.work.errHoursPerWeekMin"].replace(
            "##MINHOURS##",
            String(this.hoursPerWeekMinConfig),
        );
    }

    /**
     * Function to map peo classes with name not equal to unspecified
     * @param classNames response from getPEOClass API
     * @returns void
     */
    arrangePEOOrganization(classNames: ClassNames[]): void {
        // filteredPeoClasses will gives us PEO classes by removing UNSP peo class from response.
        const filteredPeoClasses = this.utilService.copy(classNames).filter((peoElement) => peoElement.name !== UNSPECIFIED);
        this.peoDepartments = filteredPeoClasses.length ? filteredPeoClasses : classNames;
    }
    /**
     * This method is used to set organizations api values to @var organizations
     * @param organizations array of organizations
     */
    arrangeOrganization(organizations: Organization[]): void {
        this.organizations = this.isAflacUser ? organizations.filter((department) => department.name !== CORPORATE) : organizations;
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.error = true;
        this.isSpinnerLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * This method is used to build the form-group with necessary form-controls
     * The inner @var partialCensusForm is the form-group
     */
    initiateForm(): void {
        this.partialCensusForm = this.formBuilder.group(
            {
                street1Control: [null],
                street2Control: [null],
                employerName: [null],
                occupation: [null, [Validators.maxLength(JOB_TITLE_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_TITLE)]],
                occupationDescription: [
                    null,
                    [Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_DESCRIPTION)],
                ],
                employeeID: [null],
                departmentID: [null],
                income: [INCOME_RADIO_VALUE_ONE],
                homePhoneNumber: [null],
                cellPhoneNumber: [null],
                annualIncome: [null],
                hourlyRate: [null],
                hoursPerWeek: [null],
                weeksPerYear: [null],
                emailID: [null],
                totalIncomeForHourlyWage: [{ disabled: true, value: null }],
                deliveryPreference: [CorrespondenceType.ELECTRONIC],
                newDepartmentId: [null],
                ssn: [null],
            },
            { updateOn: "blur" },
        );
    }
    /**
     * This method is used to fetch member detail and member contact from API
     * The inner @var memberInfo is used to store member detail
     * The inner @var memberContactInfo is used to store member contact detail
     * The inner @var memberSalaries is used to store member salary details
     * @returns Observable<Salary[]> as using switchMap returns latest response
     */
    getMemberInfo(): Observable<Salary[]> {
        this.referenceDate = this.dualPlanYearService.getReferenceDate();
        return this.memberService.getMember(this.memberId, true, this.mpGroup).pipe(
            tap((res) => {
                this.memberInfo = res.body;
                this.isMemberCIF = !!res.body?.customerInformationFileNumber;
            }),
            filter((res) => res !== undefined && res !== null && res.body !== undefined && res.body !== null),
            switchMap(() => this.memberService.getMemberContacts(this.memberId, this.mpGroup)),
            tap((memberContactInfoArr) => {
                // The first array element returned on the getMemberContacts API call will always be the members Home contact
                const memberHomeContact = memberContactInfoArr[0];
                this.memberContactInfo = memberHomeContact;
                this.store.dispatch(new SetUserContactData(memberHomeContact));
                this.getMemberContactInfo();
            }),
            switchMap(() => {
                const state = this.isAgentAssistedFlow ? this.enrollmentState : this.memberContactInfo.address.state;
                const enrollmentMethod: EnrollmentMethod = this.isAgentAssistedFlow
                    ? this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod)
                    : EnrollmentMethod.SELF_SERVICE;
                return this.shoppingService.getPlanOfferings(
                    undefined,
                    enrollmentMethod,
                    state,
                    {},
                    this.memberId,
                    +this.mpGroup,
                    EXPAND_ID,
                    this.referenceDate,
                );
            }),
            tap((res: PlanOffering[]) => {
                this.allPlanOfferings = res;
                if (this.allPlanOfferings && this.allPlanOfferings.length) {
                    this.anySelfAssistedProducts = Boolean(
                        this.allPlanOfferings.filter((eachPlanOffering) => !eachPlanOffering.agentAssistanceRequired).length,
                    );
                }
            }),
            switchMap(() => this.memberService.getSalaries(this.memberId, false, this.mpGroup)),
            tap((res) => {
                this.memberSalaries = res;
            }),
        );
    }

    /**
     * This method is used to fetch member contact from API
     * The inner @var memberContact is used to store member contact detail
     * The inner @var address is used to store member address detail
     */
    getMemberContactInfo() {
        this.memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: (memberContactinf) => {
                    this.memberContactDetails = memberContactinf.body;
                    this.address = memberContactinf.body.address;
                },
                error: (error) => of(error),
            });
    }

    /**
     * This method is used to fetch tpiSsoDetail, getTPIProducerId, getOfferingState from ngxs store
     * The inner @var memberId is used to store member id
     * The inner @var mpGroup is used to store MP-Group id
     */
    getGroupInfoFromStore(): void {
        const tpiSsoDetail: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        if (tpiSsoDetail) {
            this.memberId = tpiSsoDetail.user.memberId;
            this.mpGroup = tpiSsoDetail.user.groupId.toString();
            this.isAgentAssistedFlow = Boolean(tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId));
            this.isAflacUser = tpiSsoDetail.user.partnerId === AppSettings.AFLAC_PARTNER_ID;
            if (!this.isAgentAssistedFlow) {
                this.undefinedDepartmentTooltipValue = this.languageStrings["primary.portal.tpiEnrollment.member.department.undefined"];
            } else {
                this.undefinedDepartmentTooltipValue = this.isAflacUser
                    ? this.languageStrings["primary.portal.tpi.partialCensus.departmentId"]
                    : this.languageStrings["primary.portal.tpi.partialCensus.undefined"];
            }
        }
    }
    /**
     * This method is used to validate formControl and saves member information to server, if valid
     * The inner @var isAnyContactFilled is used to check whether phoneNumber / Email is filled or not
     * The inner @var isFormSubmitted is used to check whether the is submitted or not
     */
    saveInfo(): void {
        this.isFormSubmitted = true;
        this.isAnyContactFilled = true;
        this.partialCensusForm.controls.hoursPerWeek.markAsUntouched();
        this.partialCensusForm.controls.weeksPerYear.markAsUntouched();
        this.partialCensusForm.controls.hourlyRate.markAsUntouched();
        this.partialCensusForm.controls.emailID?.updateValueAndValidity();
        this.partialCensusForm.controls.ssn?.updateValueAndValidity();
        this.partialCensusForm.controls.confirmSSN?.updateValueAndValidity();
        this.checkIncomeValue();
        this.setTotalHourlyIncome();
        if (
            !this.memberContactInfo ||
            (this.memberContactInfo &&
                !this.memberContactInfo.emailAddresses.length &&
                !this.memberContactInfo.phoneNumbers.length &&
                !this.memberContactInfo?.address?.address1?.length &&
                !this.partialCensusForm.controls.cellPhoneNumber.value &&
                !this.partialCensusForm.controls.homePhoneNumber.value &&
                !this.partialCensusForm.controls.address?.value &&
                !this.partialCensusForm.controls.emailID.value)
        ) {
            this.isAnyContactFilled = false;
        }
        this.setStreetAddressPatchValue();
        // Focus to invalid fields, if necessary
        this.checkInvalidFieldsAndFocus();
        if (
            this.partialCensusForm.valid &&
            this.isAnyContactFilled &&
            (this.partialCensusForm.controls.deliveryPreference.value !== CorrespondenceType.ELECTRONIC ||
                (this.partialCensusForm.controls.deliveryPreference.value === CorrespondenceType.ELECTRONIC &&
                    (this.memberContactInfo.emailAddresses.length || this.partialCensusForm.controls.emailID.value)))
        ) {
            // save memberInfo, memberContact and memberSalary Api calls
            if (!this.memberContactInfo || !this.memberContactInfo.address || !this.memberContactInfo.address.address1) {
                if (!this.partialCensusForm.invalid) {
                    this.memberContactDetails.address.address1 = this.partialCensusForm.controls.street1Control.value;
                    this.memberContactDetails.address.address2 = this.partialCensusForm.controls.street2Control.value;
                    if (this.addressValidationSwitch) {
                        this.verifyAddress();
                    } else {
                        this.isSpinnerLoading = true;
                    }
                }
            } else {
                this.saveMemberInfoApiCall();
            }
            // update dependent address as employee address if it is empty
            if (this.memberContactInfo?.address?.address1 || this.memberContactInfo?.address?.city) {
                this.checkDependentAddress();
            }
        }
    }
    /**
     * This function is used to patch address value to form
     */
    setStreetAddressPatchValue(){
        if (this.memberContactInfo && this.memberContactInfo?.address && this.memberContactInfo?.address?.address1) {
        this.partialCensusForm.controls.street1Control.patchValue(this.memberContactInfo.address.address1);
        }
    }

    /**
     * This function calls verify address api and deals with post verification actions
     */
    verifyAddress(): void {
        const addressDetails = this.memberContactDetails.address as PersonalAddress;
        this.isSpinnerLoading = true;
        this.memberService
            .verifyMemberAddress(addressDetails)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((verifiedAddress: VerifiedAddress) => {
                    this.addressRespDetails = false;
                    this.isSpinnerLoading = false;
                    this.memberContactDetails.addressValidationDate = new Date();
                }),
                switchMap((verifiedAddress: VerifiedAddress) => {
                    this.isSpinnerLoading = false;
                    return this.openAddressModal(ADDRESS_BOTH_OPTION, addressDetails, verifiedAddress);
                }),
                catchError((error) => {
                    this.isSpinnerLoading = false;
                    this.addressVerificationMessages = [];
                    this.addressRespDetails = true;
                    this.handleAddressError(error);
                    return of(error);
                }),
                switchMap((resp) => {
                    if (this.addressRespDetails) {
                        return this.openAddressModal(ADDRESS_OPTIONS.SINGLE, addressDetails, null, resp.status);
                    }
                    return of(null);
                }),
                
            )
            .subscribe();
    }

    /**
     * Method to handle verify address error response
     * @param err Error stack
     * @returns void
     */
    handleAddressError(err: Error): void {
        const error = err["error"];
        if (error.status === API_RESP_400) {
            this.memberContactDetails.addressValidationDate = new Date();
            if (error.details) {
                this.addressVerificationMessages = error.details.map((item) => item.message);
            } else {
                this.addressVerificationMessages.push(this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"));
            }
        } else if (error.status === API_RESP_500) {
            this.addressVerificationMessages.push(
                this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
            );
        } else {
            this.addressVerificationMessages.push(this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code));
        }
    }

    /**
     * This function will open address verification modal and deal with post closing modal actions
     * @param option response address options single/both
     * @param address user provided address
     * @param verifiedAddress suggested address from API
     * @param errorStatus API error status
     * @returns {Observable}
     */
    openAddressModal(
        option: string,
        addressdetails: PersonalAddress,
        verifiedAddress?: VerifiedAddress,
        errorStatus?: number,
    ): Observable<{ isVerifyAddress: boolean; selectedAddress: string }> {
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddressDetails: verifiedAddress ? verifiedAddress.suggestedAddress : null,
                providedAddress: addressdetails,
                addressRespDetails: this.addressRespDetails,
                addressMessageDetails: this.addressVerificationMessages,
                option: option,
                errorStatus: errorStatus,
            },
        });

      return addressDialog.afterClosed().pipe(
            filterNullValues(),
            switchMap((elementData) => {
                if (elementData.data.isVerifyAddress) {
                    this.saveMemberInfoApiCall();
                }
                return of(elementData);
            }),
        );
    }      


    /**
     * Set data required for changes confirmation dialog
     * @returns string of profile data changes
     */
    getConfirmationDialogData(): string[] {
        const updatedContactData = [];
        if (this.partialCensusForm.controls.emailID.value) {
            updatedContactData.push(
                `${this.languageStrings["primary.portal.tpiEnrollment.email"]} : ${this.partialCensusForm.controls.emailID.value}`,
            );
        }
        if (this.partialCensusForm.controls.ssn.value && !this.memberInfo.ssn) {
            updatedContactData.push(
                `${this.languageStrings["primary.portal.member.ssn_itin"]}: ${this.partialCensusForm.controls.ssn.value}`,
            );
        }
        if (this.partialCensusForm.controls.cellPhoneNumber.value) {
            updatedContactData.push(
                `${this.languageStrings["primary.portal.members.contactLabel.phoneNumber"]}
                : ${this.partialCensusForm.controls.cellPhoneNumber.value}`,
            );
        } else if (this.partialCensusForm.controls.homePhoneNumber.value) {
            updatedContactData.push(
                `${this.languageStrings["primary.portal.members.contactLabel.phoneNumber"]}
                : ${this.partialCensusForm.controls.homePhoneNumber.value}`,
            );
        }
        return updatedContactData;
    }

    
    /**
     * check if member has CIF and open confirmation pop on email or phone changes
     * @returns observable of user confirmation on dialog
     */
    openConfirmChangesDialog(): Observable<boolean> {
        return combineLatest([
            of(!!this.memberInfo?.customerInformationFileNumber),
            this.sharedService.getStandardDemographicChangesConfig(),
        ]).pipe(
            map(([hasCifNumber, isStandaloneDemographicEnabled]) => {
                if (hasCifNumber && isStandaloneDemographicEnabled) {
                    return this.getConfirmationDialogData();
                }
                return [];
            }),
            switchMap((updatedMemberData) => {
                if (updatedMemberData.length) {
                    this.isLoading = false;
                    return this.empoweredModalService
                        .openDialog(ProfileChangesConfirmPromptComponent, {
                            data: {
                                data: updatedMemberData,
                                isAgentAssisted: this.isAgentAssistedFlow,
                            },
                        })
                        .afterClosed();
                }
                return of(true);
            }),
        );
    }
    /**
     * This method is used to save member, memberContact(if required) and memberSalary(if required) to server
     */
    saveMemberInfoApiCall(): void {
        this.isLoading = true;
        this.openConfirmChangesDialog()
            .pipe(
                filter((isSaved) => !!isSaved),
                switchMap(() => {
                    this.isLoading = true;
                    return this.saveNewDepartment();
                }),
                switchMap(() => {
                    if (this.getMemberContactsObj()) {
                        return this.memberService.saveMemberContact(
                            this.memberId,
                            ContactType.HOME,
                            this.getMemberContactsObj(),
                            this.mpGroup,
                        );
                    }
                    return of(null);
                }),
                switchMap(() => this.memberService.updateMember(this.getMemberProfileObj(), this.mpGroup)),
                switchMap(() => this.staticUtilService.cacheConfigEnabled(ConfigName.EXISTING_COVERAGE_UPDATE_REQUIRED_ON_SSN_ENTRY)),
                // import policy call should happen only if related config is enable
                switchMap((existingCoverageUpdateRequired) => {
                    if (existingCoverageUpdateRequired && this.existingCoverageUpdateRequired) {
                        return this.aflacService.importAflacPolicies(this.memberId, +this.mpGroup);
                    }
                    return of(null);
                }),
                switchMap((res) => {
                    if (this.getMemberSalaryObj()) {
                        return this.memberService.createSalary(this.memberId, this.getMemberSalaryObj(), this.mpGroup);
                    }
                    return of(null);
                }),
                switchMap(() => {
                    this.error = false;
                    this.isSpinnerLoading = false;
                    this.isLoading = false;
                    return this.checkProductEligibility(true);
                }),
                filter((productChoices) => !!productChoices),
                tap((productChoices) => {
                    this.productChoices = productChoices;
                }),
                switchMap(() => this.shoppingService.getProductOfferings(+this.mpGroup)),
                switchMap((productOfferings: ProductOffering[]) => {
                    this.isPlanOfferingsLoaded = true;
                    const state = this.isAgentAssistedFlow ? this.enrollmentState : this.memberContactInfo.address.state;
                    const enrollmentMethod: EnrollmentMethod = this.isAgentAssistedFlow
                        ? this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod)
                        : EnrollmentMethod.SELF_SERVICE;
                    const productOfferingId = productOfferings.find((product) => product.product.id === this.ssoAuthData.productId).id;
                    return this.shoppingService.getPlanOfferings(
                        productOfferingId.toString(),
                        enrollmentMethod,
                        state,
                        {},
                        this.memberId,
                        +this.mpGroup,
                        EXPAND_ID,
                        this.referenceDate,
                    );
                }),
                tap(() => this.setAgOrStateErrorMessage()),
                catchError((error: HttpErrorResponse) => {
                    if (error?.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_PRODUCER_PORTAL) {
                        this.tpiService.setIsAgeError(true);
                        this.invalidErrorMsgAge = true;
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.tpiEnrollment.producer.tooOld.singleProduct"];
                    } else if (error?.error?.language?.languageTag === INVALID_AGE_ERROR_KEY_MEMBER_PORTAL) {
                        this.tpiService.setIsAgeError(true);
                        this.invalidErrorMsgAge = true;
                        this.errorMessage = this.languageSecondaryStrings["secondary.portal.tpiEnrollment.member.tooOld.singleProduct"];
                    } else if (this.isPlanOfferingsLoaded) {
                        this.setAgOrStateErrorMessage();
                    } else {
                        this.handleMemberInfoErrors(error);
                    }
                    return of(error);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Function to set navigation or get plan offerings for a product
     * @param isPlansLoaded if all plan offerings is loaded
     * @returns observable of product choices
     */
    checkProductEligibility(isPlansLoaded: boolean): Observable<ProductSelection[] | null> {
        if (this.isPlanOrProductPartOfGroup() && isPlansLoaded) {
            return this.benefitsOfferingService.getProductChoices(+this.mpGroup, false);
        } else if (this.isIneligibleForEnroll()) {
            const hireDateMomentObject = this.dateService.toDate(this.memberInfo.workInformation.hireDate);
            const hireDateLongFormat = this.dateService.format(hireDateMomentObject, DateFnsFormat.MONTH_DAY_COMMA_YEAR);
            const noOfDaysToStartEnrollment = this.dateService.getDifferenceInDays(hireDateMomentObject, new Date());
            this.errorMessage = this.languageSecondaryStrings["secondary.portal.tpiEnrollment.hireDateInFuture"]
                .replace(REPLACE_TAG_DAY_DIFFERENCE, String(noOfDaysToStartEnrollment))
                .replace(REPLACE_TAG_HIRE_DATE, hireDateLongFormat);
            this.invalidErrorMsgState = true;
            return of(null);
        } else if (this.memberInfo.workInformation.termination.terminationDate) {
            this.router.navigate([COVERAGE]);
            return of(null);
        } else {
            this.router.navigate([SHOP]);
            return of(null);
        }
    }

    /**
     * method to set error messages related to aflac group or state
     * @returns void
     */
    setAgOrStateErrorMessage(): void {
        this.invalidErrorMsgState = true;
        const chosenProductChoice = this.productChoices.find((productChoice) => productChoice.id === this.ssoAuthData.productId);
        if (chosenProductChoice?.group && this.ssoAuthData.user.producerId) {
            this.agInfoMessage = this.languageStrings["primary.portal.partialCensus.ProducerPortalInfoMessage"];
        } else if (chosenProductChoice?.group && !this.ssoAuthData.user.producerId) {
            this.agInfoMessage = this.languageStrings["primary.portal.tpi.MemberPortalInfoMessage"];
        } else {
            this.invalidErrorMsgState = false;
            this.checkProductEligibility(false);
        }
    }
    /**
     * Function to check whether the hire date of employee is in future.
     * @returns boolean If hire date of employee is in future then return true else false
     */
    isIneligibleForEnroll(): boolean {
        return this.dateService.checkIsAfter(this.dateService.toDate(this.memberInfo.workInformation.hireDate), new Date());
    }

    /**
     * Function to check whether the productId or planId is present in plan offered API response or not
     * @return boolean is the plan or product is available in plan offering or not
     */
    isPlanOrProductPartOfGroup(): boolean {
        return (
            (this.ssoAuthData.productId &&
                !this.allPlanOfferings.find((planOffered) => planOffered.plan.product.id === this.ssoAuthData.productId)) ||
            (this.ssoAuthData.planId && !this.allPlanOfferings.find((planOffered) => planOffered.plan.id === this.ssoAuthData.planId))
        );
    }
    /**
     * This method is used to handle all member, memberContact and memberSalary Api calls
     * @param error is instance of HttpErrorResponse
     */
    handleMemberInfoErrors(error: HttpErrorResponse): void {
        this.error = true;
        this.isLoading = false;
        this.isSpinnerLoading = false;
        const errorDetail = error.error["details"];
        const errorCodeEmail = "ValidEmail";
        if (error.error.status === API_RESP_400 && errorDetail && errorDetail.length > 0) {
            const errors: string[] = [];
            for (const detail of errorDetail) {
                if (detail.code === errorCodeEmail) {
                    errors.push(this.language.fetchPrimaryLanguageValue(detail.message));
                } else if (detail.code === ClientErrorResponseDetailCodeType.RESTRICTED_EMAIL) {
                    this.error = false;
                    this.partialCensusForm.controls.emailID?.setErrors({ restrictedDomain: true });
                } else {
                    errors.push(
                        this.language.fetchSecondaryLanguageValue(
                            `secondary.portal.members.api.${error.error.status}.${error.error.code}.${detail.field}`,
                        ),
                    );
                }
            }
            this.errorMessage = errors[0];
        } else if (
            error?.status === ClientErrorResponseCode.RESP_409 &&
            error.error?.code === ClientErrorResponseType.DUPLICATE &&
            errorDetail?.length
        ) {
            if (errorDetail[0].field === SSN_INPUT_FIELD) {
                this.partialCensusForm.controls.ssn?.setErrors({
                    duplicateSSNFound: true,
                });
            }
            if (errorDetail[0].field === ITIN_INPUT_FIELD) {
                this.partialCensusForm.controls.ssn?.setErrors({
                    duplicateITINFound: true,
                });
            }
            this.error = false;
        } else {
            this.displayDefaultError(error);
        }
    }

    /**
     * This method is used to check for member salary related info and to create member salary object
     * @returns salary object, if necessary
     */
    getMemberSalaryObj(): Salary {
        let memberSalary: Salary = null;
        if (this.enableSalaryFields) {
            if (this.partialCensusForm.controls.income.value === INCOME_RADIO_VALUE_ONE) {
                memberSalary = {
                    type: ACTUAL_SALARY_TYPE,
                    annualSalary: this.partialCensusForm.controls.annualIncome.value,
                    validity: {
                        effectiveStarting: this.datePipe.transform(new Date(), DateFormat.YEAR_MONTH_DAY),
                        expiresAfter: null,
                    },
                };
            } else {
                memberSalary = {
                    type: ACTUAL_SALARY_TYPE,
                    annualSalary: this.partialCensusForm.controls.totalIncomeForHourlyWage.value,
                    hoursPerYear: this.partialCensusForm.controls.hoursPerWeek.value * this.partialCensusForm.controls.weeksPerYear.value,
                    hourlyWage: this.partialCensusForm.controls.hourlyRate.value,
                    validity: {
                        effectiveStarting: this.datePipe.transform(new Date(), DateFormat.YEAR_MONTH_DAY),
                        expiresAfter: null,
                    },
                };
            }
        }
        return memberSalary;
    }
    /**
     * This method is used to check for member contacts related info and to create member contact object
     * @returns member contact object, if necessary
     */
    getMemberContactsObj(): MemberContact {
        let memberContact: MemberContact = null;
        if (this.partialCensusForm.controls.street1Control.value) {
            memberContact = this.utilService.copy(this.memberContactInfo);
            memberContact.address.address1 = this.partialCensusForm.controls.street1Control.value;
        }
        if (this.partialCensusForm.controls.street2Control.value) {
            memberContact.address.address2 = this.partialCensusForm.controls.street2Control.value;
        }
        if (
            !this.memberContactInfo ||
            (this.memberContactInfo && !this.memberContactInfo.emailAddresses.length && !this.memberContactInfo.phoneNumbers.length) ||
            ((this.partialCensusForm.get("deliveryPreference").value === CorrespondenceType.ELECTRONIC ||
                this.partialCensusForm.get("deliveryPreference").value === CorrespondenceType.PAPER) &&
                !this.memberContactInfo.emailAddresses.length)
        ) {
            if (this.memberContactInfo) {
                memberContact = this.utilService.copy(this.memberContactInfo);
            }
            if (this.partialCensusForm.controls.emailID.value) {
                const email: EmailContact & UserContactParameters = {
                    email: this.partialCensusForm.controls.emailID.value,
                    type: EmailTypes.PERSONAL,
                    verified: false,
                    primary: !memberContact.emailAddresses.some((i) => i.primary === true),
                };
                memberContact.emailAddresses.push(email);
            }
            if (this.partialCensusForm.controls.cellPhoneNumber.value) {
                this.createMemberPhoneNumberObj(memberContact, this.partialCensusForm.controls.cellPhoneNumber, true);
            }
            if (this.partialCensusForm.controls.homePhoneNumber.value) {
                this.createMemberPhoneNumberObj(memberContact, this.partialCensusForm.controls.homePhoneNumber, false);
            }
        }
        return memberContact;
    }

    /**
     * This method is used to create member phone number object for member contact
     * @param memberContact is instance of MemberContact
     * @param control is instance of AbstractControl which is current form-control
     * @param cellType is boolean which represents whether it is cell phoneNumber or home phoneNumber
     */
    createMemberPhoneNumberObj(memberContact: MemberContact, control: AbstractControl, cellType: boolean): void {
        control.patchValue(control.value.split("-").join("").substring(LENGTH_ZERO, LENGTH_TEN));
        if (!isNaN(+control.value)) {
            const phoneNumber: PhoneContact & UserContactParameters = {
                phoneNumber: control.value,
                type: PhoneContactTypes.HOME,
                primary: !memberContact.phoneNumbers.some((i) => i.primary === true),
                verified: false,
                isMobile: cellType,
            };
            memberContact.phoneNumbers.push(phoneNumber);
        }
    }
    /**
     * This method is used to check for member profile related info and to create member profile object
     * @constant updatedMemberProfile is the copy of memberInfo
     * @returns member profile object
     */
    getMemberProfileObj(): MemberProfile {
        const updatedMemberProfile: MemberProfile = this.utilService.copy(this.memberInfo);
        // Pass the entered SSN value from user by removing hyphens,in payload
        // only If the Config is enabled for the group and SSN is not present in profile of member
        if (
            this.isSSNMandatoryConfigEnabled &&
            (!updatedMemberProfile.ssn || (this.ssnConfirmationEnabled && !updatedMemberProfile.ssnConfirmed))
        ) {
            if (!updatedMemberProfile.ssn) {
                updatedMemberProfile.ssn = this.partialCensusForm.controls.ssn?.value.replace(/-/g, "");
                this.existingCoverageUpdateRequired = true;
            }
            updatedMemberProfile.ssnConfirmed = this.partialCensusForm.controls.confirmSSN.valid;
        }
        if (this.partialCensusForm.controls.hoursPerWeek.value) {
            updatedMemberProfile.workInformation.hoursPerWeek = parseFloat(this.partialCensusForm.get("hoursPerWeek").value);
        }
        this.setRequiredFieldValidations(updatedMemberProfile);
        if (this.partialCensusForm.controls.employerName.value) {
            updatedMemberProfile.workInformation.employerName = this.partialCensusForm.controls.employerName.value;
        } else if (this.isEmployerNameFieldEnabled && !updatedMemberProfile.workInformation.employerName) {
            updatedMemberProfile.workInformation.employerName = this.accountName;
        }
        if (this.isAccountRatingCodePEO) {
            updatedMemberProfile.organizationId = null;
            updatedMemberProfile.workInformation.organizationId = null;
            updatedMemberProfile.workInformation.departmentNumber = this.partialCensusForm.controls.departmentID.value.name;
            updatedMemberProfile.workInformation.industryCode = this.partialCensusForm.controls.departmentID.value.riskClass;
        }
        return updatedMemberProfile;
    }
    /*
     * This method is used to check all invalid fields in partialCensusForm and focuses to first invalid field
     */
    checkInvalidFieldsAndFocus(): void {
        // Loop will run for the form controls till the first invalid form control is encountered
        for (const key of Object.keys(this.partialCensusForm.controls)) {
            if (this.partialCensusForm.controls[key].invalid) {
                const invalidControl = this.elementRef.nativeElement.querySelector(`[formcontrolname="${key}"]`);
                invalidControl.focus();
                break;
            }
        }
    }
    /**
     * This method will execute on mat-radio-change and this used to assign event value to form-control
     * @param control is AbstractControl of selected form-control
     * @param event is MatRadioChange event
     * @param controlName is selected form-control name
     */
    onRadioChange(control: AbstractControl, event: MatRadioChange, controlName?: string): void {
        control.patchValue(event.value);
        if (controlName === INCOME_CONTROL_NAME && this.enableSalaryFields) {
            if (event.value === INCOME_RADIO_VALUE_ONE) {
                this.partialCensusForm.controls.annualIncome.setValidators([
                    Validators.required,
                    Validators.min(this.annualSalaryMin),
                    Validators.max(this.annualSalaryMax),
                ]);
                this.partialCensusForm.controls.hourlyRate.setValidators([]);
                this.partialCensusForm.controls.hoursPerWeek.setValidators([]);
                this.partialCensusForm.controls.weeksPerYear.setValidators([]);
            } else {
                this.setValidatorsForHourlySalary();
            }
            this.partialCensusForm.controls.hourlyRate.updateValueAndValidity();
            this.partialCensusForm.controls.hoursPerWeek.updateValueAndValidity();
            this.partialCensusForm.controls.weeksPerYear.updateValueAndValidity();
            this.partialCensusForm.controls.annualIncome.updateValueAndValidity();
        }
    }
    /**
     * This method is used to set validators for hourly salary fields
     */
    setValidatorsForHourlySalary(): void {
        this.partialCensusForm.controls.hourlyRate.setValidators([
            Validators.required,
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.hourlyRateMinConfig),
            Validators.max(this.hourlyRateMaxConfig),
        ]);
        this.partialCensusForm.controls.hoursPerWeek.setValidators([
            Validators.required,
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.hoursPerWeekMinConfig),
            Validators.max(this.hoursPerWeekMaxConfig),
        ]);
        this.partialCensusForm.controls.weeksPerYear.setValidators([
            Validators.required,
            Validators.pattern(this.validationRegex.HOURSPERWEEK),
            Validators.min(this.weeksPerYearMinConfig),
            Validators.max(this.weeksPerYearMaxConfig),
        ]);
        this.partialCensusForm.controls.annualIncome.setValidators([]);
    }
    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate([EXIT]);
    }
    /**
     * This method is used to calculate the hourly wage of an employee based on inputs
     * @constant hourlyRateControl is the abstract control of hourlyRate form control
     * @constant hoursPerWeekControl is the abstract control of hoursPerWeek form control
     * @constant weeksPerYearControl is the abstract control of weeksPerYear form control
     * @constant totalIncomeForHourlyWageControl is the abstract control of totalIncomeForHourlyWage form control
     */
    setTotalHourlyIncome(): void {
        const hourlyRateControl: AbstractControl = this.partialCensusForm.controls.hourlyRate;
        const hoursPerWeekControl: AbstractControl = this.partialCensusForm.controls.hoursPerWeek;
        const weeksPerYearControl: AbstractControl = this.partialCensusForm.controls.weeksPerYear;
        const totalIncomeForHourlyWageControl: AbstractControl = this.partialCensusForm.controls.totalIncomeForHourlyWage;
        if (hourlyRateControl.value && hoursPerWeekControl.value && weeksPerYearControl.value) {
            totalIncomeForHourlyWageControl.patchValue(hourlyRateControl.value * hoursPerWeekControl.value * weeksPerYearControl.value);
            const totalWage = this.partialCensusForm.controls.totalIncomeForHourlyWage.value;
            if (totalWage - Math.floor(totalWage) !== 0) {
                this.partialCensusForm.controls.totalIncomeForHourlyWage.setValue(totalWage.toFixed(DECIMAL_PLACE));
            }
            const hoursPerYear = parseFloat(weeksPerYearControl.value) * parseFloat(hoursPerWeekControl.value);
            if (this.calculateAge(this.dateService.toDate(this.memberInfo.birthDate)) && hoursPerYear > TOTAL_HRS_FOR_YOUNGER_EMP) {
                this.youngerEmployeeHoursPerYearErr = this.languageSecondaryStrings["secondary.portal.common.work.errHoursPerYearDOB"];
                hoursPerWeekControl.setErrors({ incorrect: true });
                weeksPerYearControl.setErrors({ incorrect: true });
            }
        }
    }
    /**
     * This method is used to calculate the age and check whether it is less than configured age
     * @birthDate is date of birth of an employee
     * @returns age if is less than eligible age, else null
     */
    calculateAge(birthDate: Date): number {
        const currentDate = new Date();
        if (birthDate < currentDate) {
            let age = currentDate.getFullYear() - birthDate.getFullYear();
            const month = currentDate.getMonth() - birthDate.getMonth();
            if (month < 0 || (month === 0 && currentDate.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < ELIGIBLE_EMPLOYEE_AGE) {
                return age;
            }
            return null;
        }
        return null;
    }
    /**
     * This method is used to validate whether the entered value is number or not
     * @param event is the KeyboardEvent
     * @returns boolean which represents whether the entered value is number or not
     */
    validateNumber(event: KeyboardEvent): boolean {
        return event.key.toString().charCodeAt(LENGTH_ZERO) === CHAR_CODE_ASCII_VALUE_8 ||
            event.key.toString().charCodeAt(LENGTH_ZERO) === LENGTH_ZERO
            ? null
            : event.key.toString().charCodeAt(LENGTH_ZERO) >= CHAR_CODE_ASCII_VALUE_48 &&
                  event.key.toString().charCodeAt(LENGTH_ZERO) <= CHAR_CODE_ASCII_VALUE_57;
    }
    /**
     * This method is used to validate whether the entered value is number upto 2 decimal places
     * @param event is the KeyboardEvent
     */
    validateNumberDecimal(event: HTMLInputElement): void {
        event.value = this.utilService.formatDecimalNumber(event.value);
    }
    /**
     * This method is used to fetch minimum and maximum hourlyRate, hoursPerWeek values from configurations
     * @returns {Observable<string[]>} contains configuration values
     */
    getMinAndMaxConfiguration(): Observable<string[]> {
        return combineLatest([
            this.staticUtilService.cacheConfigValue("general.employee.work.hours_per_week.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.hours_per_week.max"),
            this.staticUtilService.cacheConfigValue("general.employee.work.hourly_rate.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.hourly_rate.max"),
            this.staticUtilService.cacheConfigValue("general.employee.work.weeks_per_year.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.weeks_per_year.max"),
            this.staticUtilService.cacheConfigValue("general.employee.salary.min"),
            this.staticUtilService.cacheConfigValue("general.employee.salary.max"),
            this.staticUtilService.cacheConfigValue("user.employee.job_information.min_salary.products"),
            this.staticUtilService.cacheConfigValue("user.employee.job_information.min_salary.product_specific"),
        ]).pipe(
            tap(
                ([
                    minHoursPerWeekValue,
                    maxHoursPerWeekValue,
                    minHourlyRateValue,
                    maxHourlyRateValue,
                    minWeekPerYearValue,
                    maxWeekPerYearValue,
                    minAnnualSalaryValue,
                    maxAnnualSalaryValue,
                    minSalaryRequiredProducts,
                    productSpecificMinSalary,
                ]) => {
                    this.hoursPerWeekMinConfig = +minHoursPerWeekValue;
                    this.hoursPerWeekMaxConfig = +maxHoursPerWeekValue;
                    this.annualSalaryMin = +minAnnualSalaryValue;
                    this.annualSalaryMax = +maxAnnualSalaryValue;
                    this.setValidationsForWeekPerYear(minWeekPerYearValue, maxWeekPerYearValue);
                    this.setValidationsForHourlyRate(minHourlyRateValue, maxHourlyRateValue);
                    this.setValidatorsForHoursPerWeek();
                    this.minSalaryRequiredProducts = minSalaryRequiredProducts.split(",");
                    this.productSpecificMinSalary = +productSpecificMinSalary;
                    this.annualSalaryMinMaxErrorMessage = this.languageSecondaryStrings[
                        "secondary.portal.tpiEnrollment.partialCensus.errorSalary"
                    ]
                        .replace("##min##", String(this.annualSalaryMin))
                        .replace("##max##", String(this.annualSalaryMax));
                },
            ),
        );
    }
    /**
     * This method is used to check inputted income value and sets boolean based on condition
     */
    checkIncomeValue(): void {
        this.isIncomeHasLowValue = false;
        if (this.enableSalaryFields) {
            let control: AbstractControl;
            if (this.partialCensusForm.controls.income.value === INCOME_RADIO_VALUE_ONE) {
                control = this.partialCensusForm.controls.annualIncome;
            } else {
                control = this.partialCensusForm.controls.totalIncomeForHourlyWage;
            }
            if (
                control.value &&
                +control.value >= LENGTH_ZERO &&
                +control.value < this.productSpecificMinSalary &&
                this.allPlanOfferings.filter(
                    (eachOffering) => this.minSalaryRequiredProducts.indexOf(eachOffering.plan.product.adminName) !== -1,
                ).length
            ) {
                this.isIncomeHasLowValue = true;
            }
        }
    }
    /**
     * This method is used to fetch group attributes departmentId and employeeID values
     * @returns Observable of Group Attribute array
     */
    getGroupAttributesByNameSubscriber(): Observable<GroupAttribute[]> {
        return this.accountService.getGroupAttributesByName(
            [AppSettings.IS_DEPARTMENT_ID_REQUIRED, AppSettings.IS_EMPLOYEE_ID_REQUIRED, GroupAttributeEnum.EBS_INDICATOR],
            +this.mpGroup,
        );
    }
    /**
     * This method is used set @var isOrganizationFieldRequired and @var isEmployeeIdFieldRequired  @var isEBS values
     * @param result is the array of GroupAttributes
     */
    getGroupAttributesByName(result: GroupAttribute[]): void {
        this.isOrganizationFieldRequired =
            AppSettings.TRUE === result.find((x) => x.attribute === AppSettings.IS_DEPARTMENT_ID_REQUIRED).value;
        this.isEmployeeIdFieldRequired = AppSettings.TRUE === result.find((x) => x.attribute === AppSettings.IS_EMPLOYEE_ID_REQUIRED).value;
        this.isEBS =
            BooleanConst.TRUE === result.find((groupAttributes) => groupAttributes.attribute === GroupAttributeEnum.EBS_INDICATOR).value;
    }

    /**
     * Function called on click of 'Back' button and is used to go to previous step in TPI flow
     */
    onBack(): void {
        const enrollmentMethod: EnrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        if (enrollmentMethod === FACE_TO_FACE_API_VALUE) {
            this.router.navigate([ENROLLMENT_METHOD]);
        } else {
            this.router.navigate([CONFIRM_ADDRESS]);
        }
        if (this.invalidErrorMsgAge) {
            this.tpiService.setIsAgeError(false);
        }
    }

    /**
     * This method is used to get TPI partial census page availability from configurations
     * @returns {Observable<string>} contains config value
     */
    getTpiAvailabilityConfig(): Observable<string> {
        return this.staticUtilService.cacheConfigValue("general.tpi.partial_census.enable");
    }

    /**
     * This method is used to get the EBS Paylogix enabled value from configurations
     * @returns {Observable<string>} contains config value
     */

    getPayLogixConfig(): Observable<string> {
        return this.staticUtilService.cacheConfigValue(ConfigName.EBS_PAYMENT_FEATURE_ENABLE);
    }

    /**
     * This method will execute on selection change of department ids dropdown
     * @param event is the matSelectChange event
     */
    departmentChanged(event: MatSelectChange): void {
        if (this.isAflacUser) {
            this.addNewDepartmentFlag = event.value === this.ADD_NEW_DEPARTMENT_ID;
            const newDepartmentIdControl: AbstractControl = this.partialCensusForm.controls.newDepartmentId;
            if (this.addNewDepartmentFlag) {
                newDepartmentIdControl.setValidators([Validators.required, Validators.pattern(this.validationRegex.DEPARTMENT_ID)]);
            } else {
                newDepartmentIdControl.clearValidators();
            }
            newDepartmentIdControl.updateValueAndValidity();
        }
    }
    /**
     * This function to create new organization observable based on few conditions
     * @returns Observable<HttpResponse<void>> if new departmentId has to be created else @returns Observable<null>
     */
    saveNewDepartment(): Observable<HttpResponse<void> | null> {
        const newDepartmentValue: string = this.partialCensusForm.controls.newDepartmentId.value;
        if (this.addNewDepartmentFlag && newDepartmentValue !== this.newlyCreatedDepartment) {
            const departmentObject: Organization = {
                name: newDepartmentValue,
                code: newDepartmentValue,
                parentId: DEFAULT_PARENT_DEPARTMENT_CODE_ID,
            };
            return this.accountProfileService.createOrganization(departmentObject, this.mpGroup).pipe(
                tap((response: HttpResponse<void>) => {
                    const eleArray = response.headers.get(AppSettings.API_RESP_HEADER_LOCATION).split("/");
                    this.newlyCreatedDepartment = newDepartmentValue;
                    this.partialCensusForm.controls.departmentID.patchValue(+eleArray[eleArray.length - LENGTH_ONE]);
                }),
            );
        }
        return of(null);
    }
    /**
     * Trims hours per week field with just decimal point to proper value
     * If the value entered is 50. it will become 50
     * @param event :HTMLInput Event which used to capture event.target
     */
    trimDecimalPoint(event: HTMLInputElement): void {
        const value = parseFloat(event.value);
        if (value >= 0) {
            this.partialCensusForm.get("hoursPerWeek").setValue(value.toString());
        }
    }

    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
