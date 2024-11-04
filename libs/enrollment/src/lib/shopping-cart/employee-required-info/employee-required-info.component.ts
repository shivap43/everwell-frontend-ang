import { Component, OnInit, Inject, ElementRef, OnDestroy, ViewChild, EventEmitter } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import {
    ProfileChangesConfirmPromptComponent,
    AddressMatchingPromptComponent,
    AddressVerificationComponent,
    validateStateAndZipCode,
    ConfirmSsnService,
    SsnFormatPipe,
    DependentAddressUpdateModalComponent,
} from "@empowered/ui";
import { Observable, forkJoin, Subscription, Subject, iif, EMPTY, combineLatest, of, BehaviorSubject } from "rxjs";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
    StaticService,
    MemberService,
    AccountService,
    ClassNames,
    Organization,
    CommonService,
    AccountProfileService,
    MemberIdentifier,
    AccountDetails,
    CoreService,
    CartItem,
} from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import {
    map,
    mergeMap,
    tap,
    switchMap,
    takeUntil,
    first,
    filter,
    catchError,
    finalize,
    delay,
    startWith,
    distinctUntilChanged,
} from "rxjs/operators";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { UserService } from "@empowered/user";

import {
    AddressConfig,
    ConfigName,
    ServerErrorResponseCode,
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    CarrierId,
    JOB_TITLE_MAX_LENGTH,
    JOB_DESCRIPTION_MAX_LENGTH,
    SECOND_IN_MILLISECONDS,
    IndustryCodes,
    RiskClasses,
    JOB_FIELD_MAX_LENGTH,
    RiskClass,
    PartnerId,
    UserPermissionList,
    AppSettings,
    AddressMatchModel,
    PhoneContactTypes,
    EnrollmentMethod,
    Portals,
    VerifiedAddress,
    PersonalAddress,
    SSN_MASK_LENGTH,
    RatingCode,
    ContactType,
    CountryState,
    CorrespondenceType,
    Gender,
    MemberProfile,
    Accounts,
    MemberContact,
    Address,
} from "@empowered/constants";

import {
    SetErrorForShop,
    EnrollmentState,
    AccountInfoState,
    EnrollmentMethodState,
    SharedState,
    RegexDataType,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { MatCheckboxChange } from "@angular/material/checkbox";
import {
    AccountProfileBusinessService,
    AddressMatchingService,
    TPIRestrictionsForHQAccountsService,
    SharedService,
    EmpoweredModalService,
} from "@empowered/common-services";
import { DateService } from "@empowered/date";

interface Job {
    title: string;
    duties: string;
}

const API_ERROR_MESSAGE_CODE = "NotEmpty";
const API_ERROR_MESSAGE_FIELD_PHONE_NUMBER = "phoneNumbers[0].phoneNumber";
const CONSENT_EMAIL = "consentEmail";
const WORK_STATE = "workState";
const WORK_ZIP = "workZip";
const ADDRESS_BOTH_OPTION = "bothOption";
const ADDRESS_SINGLE_OPTION = "singleOption";
const APP_FLOW_ACTION = "appFlow";
const SUGGESTED_ADDRESS = "suggestedAddress";
const CORPORATE = "Corporate";
const VARIABLE_TYPE_OBJECT = "object";
const API_ERROR_DUPLICATE_CODE = "duplicate";
const API_ERROR_PHONE = "phoneNumbers";
const SSN_LENGTH_VALIDATION = 11;
const SSN_INPUT_FIELD_NAME = "ssn";
const CONFIRM_SSN_INPUT_FIELD_NAME = "confirmSSN";
const ITIN_INPUT_FIELD_NAME = "itin";
const EMPLOYER_NAME_FIELD = "employerName";

@Component({
    selector: "empowered-employee-required-info",
    templateUrl: "./employee-required-info.component.html",
    styleUrls: ["./employee-required-info.component.scss"],
})
export class EmployeeRequiredInfoComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    @ViewChild("onErrorScroll", { static: true }) onErrorScroll;
    form: FormGroup;
    validationRegex: RegexDataType;
    isFormSubmit: boolean;
    today = new Date();
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    minimumSubscriberAge: string;
    mpGroupId: number;
    gender = [Gender.MALE, Gender.FEMALE, Gender.UNKNOWN];
    employeeStates: CountryState[];
    errorFlag = false;
    disableCheckBox = true;
    isEmailOptional = false;
    memberInfo: MemberProfile;
    memberContactInfo: MemberContact;
    memberAddress: Address;
    isDateValid = false;
    updateMemberInfo: MemberProfile;
    updateMemberContact: MemberContact;
    formControls = [];
    errorMessage: string;
    isSpinnerLoading = false;
    deliveryPref: string;
    phoneMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    ELECTRONIC = CorrespondenceType.ELECTRONIC;
    PAPER = CorrespondenceType.PAPER;
    phonenumberType = PhoneContactTypes.HOME;
    dependentsArray = [];
    mappedDependent = [];
    enrollmentMethod: string;
    enrollmentMethodStrings = EnrollmentMethod;
    consentCheckbox: FormControl;
    getMemberConsent: boolean;
    emailSentSuccessfully = false;
    isMobile = false;
    updatedContactInfo: MemberContact;
    isMemberPortal = false;
    showEAAMessage = false;
    verifyAddressFlag = false;
    memberFirstName: string;
    isPhonePrimary = true;
    private readonly unsubscribe$ = new Subject<void>();
    emailTypes: string[] = [];
    portal: string;
    employeeId: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.census.manualEntry.firstName",
        "primary.portal.census.manualEntry.lastName",
        "primary.portal.census.manualEntry.birthdate",
        "primary.portal.direct.addCustomer.paper",
        "primary.portal.direct.addCustomer.electronic",
        "primary.portal.direct.addCustomer.planInfo",
        "primary.portal.direct.addCustomer.city",
        "primary.portal.direct.addCustomer.jobTitle",
        "primary.portal.direct.addCustomer.jobduties",
        "primary.portal.direct.addCustomer.type",
        "primary.portal.direct.addCustomer.completeRequiredInfo",
        "primary.portal.direct.addCustomer.employeeInformation",
        "primary.portal.direct.addCustomer.someRequiredInfo",
        "primary.portal.direct.addCustomer.homeStreetAddress1",
        "primary.portal.direct.addCustomer.homePhoneNumber",
        "primary.portal.direct.addCustomer.continueToApplications",
        "primary.portal.direct.addCustomer.employeeMinAge",
        "primary.portal.direct.addCustomer.emailTooltipMessage",
        "primary.portal.direct.addCustomer.consent.iAgree",
        "primary.portal.direct.addCustomer.consent.title",
        "primary.portal.direct.addCustomer.consent.subtitle",
        "primary.portal.direct.addCustomer.consent.email",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.common.cancel",
        "primary.portal.common.select",
        "primary.portal.common.requiredField",
        "primary.portal.common.close",
        "primary.portal.members.beneficiaryValidationMsg.streetAddress1",
        "primary.portal.census.manualEntry.emailAddress",
        "primary.portal.login.consent.content",
        "primary.portal.proposals.send.confirm",
        "primary.portal.coverage.sent",
        "primary.portal.census.manualEntry.HOME",
        "primary.portal.common.selectOption",
        "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
        "primary.portal.members.mappPolicyDeliveryMsgElectronic",
        "primary.portal.members.mmpPolicyDeliveryMsgPaper",
        "primary.portal.members.mappPolicyDeliveryMsgPaper",
        "primary.portal.members.planInfoDeliveryPreference.eaaMessage",
        "primary.portal.common.city.patternError",
        "primary.portal.common.select",
        "primary.portal.callCenter.acknowledge",
        "primary.portal.vf2f.consent.acknowledgement",
        "primary.portal.vf2f.consent.content",
        "primary.portal.direct.addCustomer.workState",
        "primary.portal.direct.addCustomer.workZip",
        "secondary.portal.census.manualEntry.validemployeeId",
        "primary.portal.census.manualEntry.employeeID",
        "primary.portal.census.manualEntry.addNewDepartmentId",
        "primary.portal.census.manualEntry.department",
        "primary.portal.census.manualEntry.newDepartmentId",
        "primary.portal.census.manualEntry.departmentPeoRating",
        "primary.portal.common.selectionRequired",
        "primary.portal.census.manualEntry.notSaved",
        "primary.portal.member.ssn_itin",
        "primary.portal.members.contactLabel.email",
        "primary.portal.members.contactLabel.phone",
        "primary.portal.members.policyCommunications",
        "primary.portal.common.encourageEmailAddress",
        "primary.portal.common.customer",
        "primary.portal.common.employee",
        "primary.portal.pda.form.employerName",
    ]);

    secondaryLanguages: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.census.manualEntry.maxlength100",
    ]);
    DEPARTMENT_LABEL_LANGUAGE_KEY = "primary.portal.census.manualEntry.department";
    consentContent: SafeHtml;
    suggestedAddress: PersonalAddress;
    tempMemberAddress: PersonalAddress;
    addressResp: boolean;
    addressMessage: string[] = [];
    selectedAddress: string;
    openAddressModal = false;
    addressValidationSwitch = false;
    matched: boolean;
    showPartialConsent = true;
    isAddressUpdating = false;
    disableSubmit: boolean;
    memberWorkContact: MemberContact;
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();
    private readonly memberWorkContactRegisteredSubject$ = new Subject<void>();
    // Emits whenever the SSN field is updated via user input.
    private readonly ssnManualInputSubject$: Subject<string> = new Subject<string>();
    employeeIDMaxLength: number;
    isEmployeeIdFieldRequired = false;
    isOrganizationFieldRequired = false;
    peoDepartments: ClassNames[];
    accountDetails: Accounts;
    groupPartnerId: number;
    isAccountRatingCodePEO: boolean;
    isAflacUSer: boolean;
    employeesDepartments: Organization[];
    isWorkInfoHireDate: boolean;
    addNewDepartmentFlag: boolean;
    readonly ADD_NEW = 0;
    departmentLabel: string;
    readonly PARENT_ID = 1;
    newDepartmentId: number;
    isDepartmentIdCreated = true;
    jobTitleAndDuties: Job[] = [];
    jobDuty: string;
    isRiskClassA: boolean;
    isJobFeatureOn: boolean;
    jobDutyPlaceholder = "--";
    isOccupationClassNotChanged: boolean;
    getAccountInfo: AccountDetails;
    accountCarrierRiskClass$: Observable<RiskClass[]>;
    cartItems: CartItem[];
    isAddressMatched = false;
    addressMatchConfig: boolean;
    max_length = JOB_FIELD_MAX_LENGTH;
    ssnLengthValidation = SSN_LENGTH_VALIDATION;
    existingCoverageUpdateRequired: boolean;
    shouldCloseModal = true;
    stronglyRecommendedEmailConfig: boolean;
    dependentAddressUpdateConfig: boolean;
    subscriptions: Subscription[] = [];

    constructor(
        private readonly fb: FormBuilder,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<EmployeeRequiredInfoComponent>,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly el: ElementRef,
        private readonly domSanitizer: DomSanitizer,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly sharedService: SharedService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly accountProfileBusinessService: AccountProfileBusinessService,
        private readonly commonService: CommonService,
        private readonly accountProfileService: AccountProfileService,
        private readonly coreService: CoreService,
        private readonly addressMatchingService: AddressMatchingService,
        private readonly confirmSsnService: ConfirmSsnService,
        private readonly ssnFormatPipe: SsnFormatPipe,
        private readonly dateService: DateService,
    ) {
        this.userService.portal$.pipe(takeUntil(this.unsubscribe$)).subscribe((type) => {
            this.portal = type;
            if (this.portal === Portals.MEMBER.toLowerCase()) {
                this.isMemberPortal = true;
            }
        });
    }

    /**
     * ngOnInit function is one of Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        // Update policy language for direct
        if (this.data.isDirect) {
            this.languageStrings["primary.portal.common.encourageEmailAddress"] = this.languageStrings[
                "primary.portal.common.encourageEmailAddress"
            ].replace("##employee##", this.languageStrings["primary.portal.common.customer"]);
        } else {
            this.languageStrings["primary.portal.common.encourageEmailAddress"] = this.languageStrings[
                "primary.portal.common.encourageEmailAddress"
            ].replace("##employee##", this.languageStrings["primary.portal.common.employee"]);
        }
        this.sharedService
            .getStateZipFlag()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.isSpinnerLoading = resp;
            });
        this.getAccountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.consentCheckbox = new FormControl(false, Validators.required);
        this.isFormSubmit = false;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.mpGroupId = this.data.mpGroupId;
        if (this.data.portal === AppSettings.PORTAL_MEMBER) {
            this.enrollmentMethod = EnrollmentMethod.SELF_SERVICE;
        } else {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment).enrollmentMethod;
            if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
                this.showPartialConsent = false;
                this.acceptConsent();
            }
        }
        this.cartItems = this.store.selectSnapshot(EnrollmentState.GetCartItem) || [];
        if (!this.isMemberPortal && this.cartItems[0]?.riskClassOverrideId === RiskClasses.RISK_CLASS_A) {
            this.data.showRequiredInfo = true;
        }
        this.staticService
            .getEmailTypes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.emailTypes = response;
            });
        const consentContentKey =
            this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE
                ? "primary.portal.vf2f.consent.content"
                : "primary.portal.login.consent.content";
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(this.languageStrings[consentContentKey]);
        this.employeeId = this.data.employeeId;
        this.memberInfo = this.utilService.copy(this.data.memberInfo);
        this.isOrganizationFieldRequired = this.data.isOrganizationFieldRequired;
        this.isEmployeeIdFieldRequired = this.data.isEmployeeIdFieldRequired;
        this.memberFirstName = this.memberInfo.name.firstName;
        this.memberContactInfo = this.utilService.copy(this.data.memberContactInfo);
        this.memberAddress = this.memberContactInfo.address;
        this.getMemberWorkContact();
        this.isAddressUpdating = !(
            this.memberContactInfo.address.address1 &&
            this.memberContactInfo.address.city &&
            this.memberContactInfo.address.state &&
            this.memberContactInfo.address.zip
        );
        if (this.data.showRequiredInfo) {
            this.updateMemberInfo = this.utilService.copy(this.data.memberInfo);
            delete this.updateMemberInfo.organizationId;
            this.updateMemberContact = this.utilService.copy(this.data.memberContactInfo);
            this.deliveryPref = this.memberInfo.profile.correspondenceType;
            this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            });
            this.form = this.fb.group({
                firstName: "",
                lastName: "",
                birthDate: "",
                genderName: "",
                address1: "",
                city: "",
                state: "",
                zip: "",
                emailAddress: "",
                phoneNumber: "",
                deliveryPreferance: [this.deliveryPref, { updateOn: "change" }],
                phoneType: "",
                employeeCustomID: "",
                organizationId: "",
                jobTitle: [
                    "",
                    {
                        validators: [Validators.maxLength(JOB_TITLE_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_TITLE)],
                        updateOn: "blur",
                    },
                ],
                jobDuties: [
                    "",
                    {
                        validators: [
                            Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH),
                            Validators.pattern(this.validationRegex.JOB_DESCRIPTION),
                        ],
                        updateOn: "blur",
                    },
                ],
                consentEmail: "",
                cellType: "",
                workState: "",
                workZip: "",
                ssn: [this.memberInfo.ssn || ""],
            });
            if (this.data.ssnConfirmationEnabled && !this.memberInfo.ssnConfirmed) {
                this.setupConfirmSSNField();
            }
            if (this.data.showEmployerNameField) {
                this.setupEmployerNameField();
            }
            this.getConfig();
            this.getEmployeeState();
            if (!this.isMemberPortal) {
                this.calculateARatedJobClassAndDuty();
            }
            this.isDateValid = true;
            if (this.deliveryPref === CorrespondenceType.ELECTRONIC || this.data.checkEBSEmail) {
                this.isEmailOptional = false;
            } else {
                this.setEBSEmailPhoneNotMandatory();
            }
            this.getMemberDependents();
            this.checkMemberConsent();
            this.form.controls.consentEmail.setValidators([Validators.pattern(this.validationRegex.EMAIL)]);
        }
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule")
            .pipe(
                first(),
                takeUntil(this.unsubscribe$),
                filter((isCrossBorderRulesEnabled) => isCrossBorderRulesEnabled === true),
                switchMap(() =>
                    forkJoin([
                        this.accountService.getAccount(this.data.mpGroupId),
                        this.staticUtilService
                            .cacheConfigValue("general.enrollment.crossBorderSales.states_requiring_epolicy_delivery")
                            .pipe(first()),
                        this.staticUtilService
                            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_md.payroll")
                            .pipe(first()),
                        this.staticUtilService
                            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_mo.payroll")
                            .pipe(first()),
                    ]),
                ),
                map(([account, eaaMessageStates, cbsEnabledMdPayroll, cbsEnabledMoPayroll]) => {
                    let eaaStates: string[] = [];
                    if (eaaMessageStates !== undefined && eaaMessageStates !== null && eaaMessageStates.trim() !== "") {
                        eaaStates = eaaMessageStates.split(",");
                    }
                    let memberResidenceState = "";
                    if (this.data.memberContactInfo.address) {
                        memberResidenceState = this.data.memberContactInfo.address.state;
                    }
                    const currentEnrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                    const MARYLAND = "MD";
                    const MISSOURI = "MO";
                    return (
                        !account.enrollmentAssistanceAgreement &&
                        eaaStates.includes(memberResidenceState) &&
                        currentEnrollment.enrollmentStateAbbreviation !== memberResidenceState &&
                        currentEnrollment.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE &&
                        account.partnerAccountType === "PAYROLL" &&
                        ((memberResidenceState !== MARYLAND && memberResidenceState !== MISSOURI) ||
                            (memberResidenceState === MARYLAND && cbsEnabledMdPayroll) ||
                            (memberResidenceState === MISSOURI && cbsEnabledMoPayroll))
                    );
                }),
            )
            .subscribe((resp) => (this.showEAAMessage = resp));
        this.accountService
            .getAccount(this.mpGroupId.toString())
            .pipe(
                tap((data) => {
                    this.accountDetails = data;
                    this.groupPartnerId = this.accountDetails.partnerId;
                    this.isAflacUSer = this.groupPartnerId === PartnerId.AFLAC;
                    this.isAccountRatingCodePEO = this.accountDetails.ratingCode === RatingCode.PEO;
                    this.checkEmployeeIdAndDepartmentId();
                }),
                switchMap(() =>
                    this.commonService.getLanguages(
                        this.DEPARTMENT_LABEL_LANGUAGE_KEY,
                        undefined,
                        undefined,
                        this.groupPartnerId.toString(),
                    ),
                ),
                tap((languages) => {
                    this.departmentLabel = languages[0].value;
                }),
                switchMap(() =>
                    iif(
                        () => this.isAccountRatingCodePEO,
                        this.accountProfileBusinessService.getEmployeePEOClasses(this.mpGroupId.toString(), CarrierId.AFLAC),
                        this.accountProfileBusinessService.getOrganizationData(
                            this.mpGroupId.toString(),
                            this.isAflacUSer,
                            CORPORATE,
                            undefined,
                        ),
                    ),
                ),
                tap((data) => {
                    /**
                     * The data is assign based on boolean flag isAccountRatingCodePEO
                     * if isAccountRatingCodePEO is true then data assign to this.peoDepartments
                     * if isAccountRatingCodePEO is false then data assign to this.organizations
                     */
                    if (this.isAccountRatingCodePEO) {
                        // filteredPeoClasses will gives us PEO classes by removing UNSP peo class from response.
                        const filteredPeoClasses = this.utilService.copy(data).filter((peoElement) => peoElement.name);
                        this.peoDepartments = filteredPeoClasses.length ? filteredPeoClasses : data;
                    } else {
                        this.employeesDepartments = data;
                        this.employeesDepartments = this.employeesDepartments.filter((depart) => depart.name);
                        this.isWorkInfoHireDate = true;
                    }
                }),
                catchError((error) => {
                    if (!this.isAccountRatingCodePEO) {
                        this.isAccountRatingCodePEO = false;
                    }
                    this.checkEmployeeIdAndDepartmentId();
                    return of(error);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Adds Employer Name field to the partial census form
     */
    setupEmployerNameField(): void {
        this.form.addControl(EMPLOYER_NAME_FIELD, this.fb.control("", [Validators.required, Validators.maxLength(100)]));
    }

    /**
     * Method to check EBS and make Email/Phone fields and remove errors
     * @return void
     */
    setEBSEmailPhoneNotMandatory(): void {
        const emailAddress = this.form.get("emailAddress");
        const phoneType = this.form.get("phoneType");
        this.isEmailOptional = true;
        emailAddress.setErrors(null);
        emailAddress.markAsUntouched();
        emailAddress.setValidators(Validators.pattern(this.validationRegex.EMAIL));
        phoneType.setErrors(null);
        phoneType.markAsUntouched();
        phoneType.clearValidators();
        emailAddress.updateValueAndValidity();
        phoneType.updateValueAndValidity();
    }
    /*
     * Method to set job duties when toggled between job title
     * @param event job title as string
     */
    setJobDuty(event: string): void {
        const job = this.jobTitleAndDuties.find((jobValue) => jobValue.title === event);
        if (job) {
            this.jobDuty = job.duties;
            this.jobDutyPlaceholder = this.jobDuty;
            this.form.controls.jobDuties.patchValue(this.jobDuty);
        }
    }

    /**
     * Method to calculate Job Title and Job Duties when occupation class is A
     */
    calculateARatedJobClassAndDuty(): void {
        this.fetchJobClasses();
        const isDefaultJobClassA = this.sharedService.getIsDefaultOccupationClassA();

        this.isSpinnerLoading = true;
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.SWITCH_A_RATED_JOB_DUTIES_FEATURE),
            this.staticUtilService.cacheConfigValue(ConfigName.A_RATED_JOB_DUTIES_AND_JOB_TITLES),
            this.accountCarrierRiskClass$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([switchJobConfigValue, jobLocationDutiesValue, carrierRiskClasses]) => {
                this.isSpinnerLoading = false;
                this.isJobFeatureOn = switchJobConfigValue;

                const isCarrierRiskClassA = carrierRiskClasses.some(
                    (riskClass) =>
                        this.cartItems[0].riskClassOverrideId === riskClass.id && riskClass.name === IndustryCodes.INDUSTRY_CODE_A,
                );

                this.isRiskClassA = isCarrierRiskClassA && !isDefaultJobClassA && this.isJobFeatureOn;

                if (this.isRiskClassA) {
                    this.memberInfo.workInformation.occupation = null;
                    this.memberInfo.workInformation.occupationDescription = null;
                    this.form.controls.jobTitle.patchValue("");
                    this.form.controls.jobDuties.patchValue("");
                    this.form.controls.jobDuties.disable();
                }

                // regex here is being used to split the particular string fetched by config
                this.jobTitleAndDuties = jobLocationDutiesValue.split(/,(?=\w)/).map((value) => {
                    const [title, duties] = value.split("=");
                    return { title, duties };
                });
            });
    }

    /**
     *@description This function determines the occupation class for an account
     */
    fetchJobClasses(): void {
        if (this.getAccountInfo && this.getAccountInfo.ratingCode === RatingCode.STANDARD) {
            this.accountCarrierRiskClass$ = this.accountProfileService.getAccountCarrierRiskClasses(CarrierId.AFLAC, this.mpGroupId);
        } else if (this.getAccountInfo && this.getAccountInfo.ratingCode === RatingCode.PEO) {
            this.accountCarrierRiskClass$ = this.memberService.getMemberCarrierRiskClasses(this.memberInfo.id, CarrierId.AFLAC);
        } else if (this.getAccountInfo && this.getAccountInfo.ratingCode === RatingCode.DUAL) {
            this.accountCarrierRiskClass$ = this.coreService.getCarrierRiskClasses(CarrierId.AFLAC.toString());
        }
    }

    /**
     * Container function to call a checking function for each section of the form.
     */
    checkRequiredFields(): void {
        this.checkSSNField();
        this.checkName();
        this.checkBirthday();
        this.checkGender();
        this.checkEmployeeIdAndDepartmentId();
        this.checkOccupationTitleAndDescription();
        this.checkWorkStateAndZip();
        this.checkMemberAddress();
        this.checkMemberStateCityZip();
        this.checkPhoneNumber();
        this.updateMemberInfo.profile.correspondenceType = this.form.controls.deliveryPreferance.value;
        this.checkEmailAndDeliveryPreference();
        this.checkConfirmSSNField();
        this.checkEmployerNameField();
    }

    /**
     * If employerName field is required, adds the employerName field
     * Also populates the employerName to the updated member object
     */
    checkEmployerNameField(): void {
        if (this.data.showEmployerNameField) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.workInformation = {
                    ...this.updateMemberInfo.workInformation,
                    employerName: this.form.controls.employerName.value,
                };
            } else {
                this.formControls.push(EMPLOYER_NAME_FIELD);
            }
        }
    }

    /**
     * Function to check if SSN is present in member information,
     * If its not then make the field mandatory and add validations for proceeding further for enrollment
     */
    checkSSNField(): void {
        if (
            this.data.ssnRequiredForEnrollment &&
            (!this.memberInfo.ssn || (this.data.ssnConfirmationEnabled && !this.memberInfo.ssnConfirmed))
        ) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.ssn = this.form.controls.ssn?.value.replace(/-/g, "");
                this.existingCoverageUpdateRequired = true;
            } else {
                this.form.controls.ssn.setValidators([
                    Validators.required,
                    Validators.pattern(this.validationRegex.UNMASKSSN_ITIN),
                    Validators.minLength(SSN_LENGTH_VALIDATION),
                ]);
                this.form.controls.ssn.updateValueAndValidity();
                this.formControls.push(SSN_INPUT_FIELD_NAME);
            }
        }
    }

    /**
     * If member has not confirmed their SSN, or if there is no SSN on file
     * add a field that allows them to confirm it.
     */
    checkConfirmSSNField(): void {
        if (this.data.ssnRequiredForEnrollment && this.data.ssnConfirmationEnabled && !this.memberInfo.ssnConfirmed) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.ssnConfirmed = this.form.controls.confirmSSN.valid;
            } else {
                this.formControls.push(CONFIRM_SSN_INPUT_FIELD_NAME);
            }
        }
    }

    /**
     * If member's name info doesn't already exist, add appropriate fields to form on startup or add values
     * in these fields to member's info on submission.
     */
    checkName(): void {
        if (!(this.memberInfo.name && this.memberInfo.name.firstName && this.memberInfo.name.lastName)) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.name = {
                    firstName: this.form.controls.firstName.value,
                    lastName: this.form.controls.lastName.value,
                };
            } else {
                this.form.controls.firstName.setValidators([Validators.required, Validators.pattern(this.validationRegex.NAME)]);
                this.form.controls.lastName.setValidators([Validators.required, Validators.pattern(this.validationRegex.NAME)]);
                this.formControls.push("firstName");
                this.formControls.push("lastName");
            }
        }
    }

    /**
     * If member's birth date info doesn't already exist, add appropriate field to form on startup or add value
     * in this field to member's info on submission.
     */
    checkBirthday(): void {
        if (!this.memberInfo.birthDate) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.birthDate = this.form.controls.birthDate.value;
            } else {
                this.form.controls.birthDate.setValidators([Validators.required]);
                this.formControls.push("birthDate");
            }
        }
    }

    /**
     * If member's gender info doesn't already exist, add appropriate field to form on startup or add value
     * in this field to member's info on submission.
     */
    checkGender(): void {
        if (!this.memberInfo.gender) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.gender = this.form.controls.genderName.value;
            } else {
                this.form.controls.genderName.setValidators([Validators.required]);
                this.formControls.push("genderName");
            }
        }
    }

    /**
     * If employee Id or department Id info doesn't already exist, add appropriate
     * fields to form on startup or add values in these fields to member's info on submission.
     */
    checkEmployeeIdAndDepartmentId(): void {
        if (this.isEmployeeIdFieldRequired && !this.employeeId) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.workInformation.employeeId = this.form.controls.employeeCustomID.value;
            } else {
                this.form.controls.employeeCustomID.setValidators([
                    Validators.required,
                    Validators.pattern(this.validationRegex.EMPLOYEE_ID),
                ]);
                this.formControls.push("employeeCustomID");
            }
            this.form.controls.employeeCustomID.updateValueAndValidity();
        }
        if (
            this.isAccountRatingCodePEO !== undefined &&
            ((this.isOrganizationFieldRequired && this.memberInfo.workInformation.organizationId === 1 && !this.isAccountRatingCodePEO) ||
                (this.isAccountRatingCodePEO && !this.memberInfo.workInformation.departmentNumber))
        ) {
            if (this.isFormSubmit && this.form.controls.organizationId.value) {
                this.updateMemberInfo.workInformation.organizationId = this.form.controls.organizationId.value;
            } else {
                this.form.controls.organizationId.setValidators([Validators.required]);
                this.formControls.push("organizationId");
            }
            this.form.controls.organizationId.updateValueAndValidity();
        }
    }

    /**
     * If member's occupation or occupation description info doesn't already exist, add appropriate
     * fields to form on startup or add values in these fields to member's info on submission.
     */
    checkOccupationTitleAndDescription(): void {
        if (!this.memberInfo.workInformation.occupation) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.workInformation.occupation = this.form.controls.jobTitle.value;
            } else {
                this.form.controls.jobTitle.setValidators([
                    Validators.required,
                    Validators.maxLength(JOB_TITLE_MAX_LENGTH),
                    Validators.pattern(this.validationRegex.JOB_TITLE),
                ]);
                this.formControls.push("jobTitle");
            }
            this.form.controls.jobTitle.updateValueAndValidity();
        }
        if (!this.memberInfo.workInformation.occupationDescription) {
            if (this.isFormSubmit) {
                this.updateMemberInfo.workInformation.occupationDescription = this.form.controls.jobDuties.value;
            } else {
                this.form.controls.jobDuties.setValidators([
                    Validators.required,
                    Validators.maxLength(JOB_DESCRIPTION_MAX_LENGTH),
                    Validators.pattern(this.validationRegex.JOB_DESCRIPTION),
                ]);
                this.formControls.push("jobDuties");
            }
            this.form.controls.jobDuties.updateValueAndValidity();
        }
    }

    /**
     * Add work state and zip fields to form on startup or add values in these fields to
     * member's info on submission.
     */
    checkWorkStateAndZip(): void {
        if (this.data.workStateAndZipRequired) {
            if (!this.memberWorkContact || !this.memberWorkContact.address.state) {
                if (this.isFormSubmit) {
                    this.memberWorkContact.address.state = this.form.controls.workState.value;
                } else {
                    this.form.controls.workState.setValidators([Validators.required, Validators.pattern(this.validationRegex.STATE)]);
                    this.formControls.push(WORK_STATE);
                }
            }
            if (!this.memberWorkContact || !this.memberWorkContact.address.zip) {
                if (this.isFormSubmit) {
                    this.memberWorkContact.address.zip = this.form.controls.workZip.value;
                } else {
                    this.form.controls.workZip.setValidators(Validators.required);
                    this.formControls.push(WORK_ZIP);
                }
            }
        }
    }

    /**
     * If member's first line address info doesn't already exist, add appropriate field to form on
     * startup or add value in this field to member's info on submission.
     */
    checkMemberAddress(): void {
        if (!this.memberContactInfo.address || !this.memberContactInfo.address.address1) {
            if (this.isFormSubmit) {
                this.updateMemberContact.address.address1 = this.form.controls.address1.value;
            } else {
                this.form.controls.address1.setValidators([Validators.required, Validators.pattern(this.validationRegex.ADDRESS)]);
                this.form.controls.address1.setAsyncValidators((control) =>
                    this.staticUtilService.cacheConfigValue(ConfigName.SINGLE_LINE_INPUT_MAX_LENGTH).pipe(
                        map((configValue) =>
                            control.value.length > +configValue
                                ? {
                                      maxlength: {
                                          requiredLength: +configValue,
                                          actualLength: control.value.length,
                                      },
                                  }
                                : null,
                        ),
                        first(),
                    ),
                );
                this.formControls.push("address1");
            }
            this.form.controls.address1.updateValueAndValidity();
        }
    }

    /**
     * If any part of member's second line address info doesn't already exist, add appropriate
     * fields to form on startup or add values in these fields to member's info on submission.
     */
    checkMemberStateCityZip(): void {
        if (!this.memberContactInfo.address || !this.memberContactInfo.address.state) {
            if (this.isFormSubmit) {
                this.updateMemberContact.address.state = this.form.controls.state.value;
            } else {
                this.form.controls.state.setValidators([Validators.required, Validators.pattern(this.validationRegex.STATE)]);
                this.formControls.push("state");
            }
        }
        if (!this.memberContactInfo.address || !this.memberContactInfo.address.city) {
            if (this.isFormSubmit) {
                this.updateMemberContact.address.city = this.form.controls.city.value;
            } else {
                this.form.controls.city.setValidators([
                    Validators.required,
                    Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED),
                ]);
                this.form.controls.city.setAsyncValidators((control) =>
                    this.staticUtilService.cacheConfigValue(ConfigName.SINGLE_LINE_INPUT_MAX_LENGTH).pipe(
                        map((configValue) =>
                            control.value.length > +configValue
                                ? {
                                      maxlength: {
                                          requiredLength: +configValue,
                                          actualLength: control.value.length,
                                      },
                                  }
                                : null,
                        ),
                        first(),
                    ),
                );
                this.formControls.push("city");
            }
            this.form.controls.city.updateValueAndValidity();
        }
        if (!this.memberContactInfo.address || !this.memberContactInfo.address.zip) {
            if (this.isFormSubmit) {
                this.updateMemberContact.address.zip = this.form.controls.zip.value;
            } else {
                this.form.controls.zip.setValidators([Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]);
                this.formControls.push("zip");
            }
        }
    }

    /**
     * If member's phone number info doesn't already exist, add appropriate field to form
     * on startup or add value in this field to member's info on submission.
     */
    checkPhoneNumber(): void {
        if (
            !this.memberContactInfo.phoneNumbers.length &&
            !(this.memberWorkContact && this.memberWorkContact.phoneNumbers && this.memberWorkContact.phoneNumbers.length)
        ) {
            if (this.isFormSubmit) {
                this.updateMemberContact.phoneNumbers = [
                    {
                        phoneNumber: this.form.controls.phoneNumber.value,
                        type: this.phonenumberType,
                        primary: this.isPhonePrimary,
                        verified: false,
                        isMobile: this.isMobile,
                    },
                ];
            } else {
                this.form.controls.phoneNumber.setValidators([
                    Validators.required,
                    Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE)),
                ]);
                this.formControls.push("phoneNumber");
            }
            this.form.controls.phoneNumber.updateValueAndValidity();
        }
    }

    /**
     * If member's email info doesn't already exist, add appropriate fields to form on startup
     * or add values in these fields to member's info on submission.
     */
    checkEmailAndDeliveryPreference(): void {
        const emailAddress = this.form.get("emailAddress");
        const phoneType = this.form.get("phoneType");
        const consentEmail = this.form.get("consentEmail");
        const deliveryPreferance = this.form.get("deliveryPreferance");
        if (
            !this.memberContactInfo.emailAddresses.length &&
            !(this.memberWorkContact && this.memberWorkContact.emailAddresses.length) &&
            !(
                this.updateMemberContact.emailAddresses &&
                this.updateMemberContact.emailAddresses.length &&
                this.memberContactInfo.emailAddresses.length &&
                this.updateMemberContact.emailAddresses[0]?.email !== this.memberContactInfo.emailAddresses[0]?.email
            )
        ) {
            if (this.isFormSubmit) {
                if (emailAddress.value !== "") {
                    this.updateMemberContact.emailAddresses = [
                        {
                            email: emailAddress.value,
                            type: phoneType.value,
                            primary: true,
                            verified: false,
                        },
                    ];
                    consentEmail.setValue(emailAddress.value);
                    this.formControls.push(CONSENT_EMAIL);
                    this.shouldCloseModal = true;
                } else {
                    if (this.data.checkEBSEmail) {
                        this.isEmailOptional = false;
                        emailAddress.setErrors({ required: true });
                        emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
                        emailAddress.markAsTouched();
                        phoneType.setErrors({ required: true });
                        phoneType.setValidators([Validators.required]);
                        phoneType.markAsTouched();
                        this.shouldCloseModal = false;
                    } else {
                        if (!this.isEmailOptional) {
                            this.form.controls["emailAddress"].updateValueAndValidity();
                            this.form.controls["phoneType"].updateValueAndValidity();
                            this.shouldCloseModal = false;
                        }
                    }
                }
            } else {
                if (
                    (deliveryPreferance.value === "" || deliveryPreferance.value === CorrespondenceType.ELECTRONIC) &&
                    !this.data.checkEBSEmail
                ) {
                    this.isEmailOptional = false;
                    emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
                    emailAddress.markAsTouched();
                    phoneType.setValidators([Validators.required]);
                    phoneType.markAsTouched();
                }
                if (this.data.checkEBSEmail) {
                    emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
                    phoneType.setValidators([Validators.required]);
                }
                this.formControls.push("emailAddress");
                this.formControls.push("deliveryPreferance");
                this.formControls.push(CONSENT_EMAIL);
                this.formControls.push("phoneType");
            }
        } else {
            let emailAddr = "";
            if (this.memberContactInfo.emailAddresses.length) {
                emailAddr = this.memberContactInfo.emailAddresses[0].email;
            } else if (this.memberContactInfo.email) {
                emailAddr = this.memberContactInfo.email;
            }
            consentEmail.setValue(emailAddr);
            this.formControls.push(CONSENT_EMAIL);
        }
    }

    /**
     * Retrieve form configurations and apply changes accordingly.
     */
    getConfig(): void {
        this.staticService
            .getConfigurations(ConfigName.MINIMUM_SUBSCRIBER_AGE, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (this.minimumSubscriberAge = response[0].value));
        if (this.data.workStateAndZipRequired) {
            this.form.addControl(WORK_STATE, new FormControl());
            this.form.controls.workState.valueChanges
                .pipe(
                    tap((value: string) => this.stateControlValueSubject$.next(value)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
            this.form.addControl(WORK_ZIP, new FormControl());
            this.checkWorkStateAndZip();
        }
        this.staticUtilService
            .cacheConfigs([
                ConfigName.EMPLOYEE_ID_MAX_LENGTH,
                AddressConfig.ADDRESS_VALIDATION,
                AddressConfig.VALIDATE_ADDRESS_MATCH,
                ConfigName.STRONGLY_RECOMMEND_EMAIL,
                AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL,
            ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(
                    ([
                        employeeIdMaxLength,
                        addressValidationSwitch,
                        addressMatch,
                        stronglyRecommendedEmailConfig,
                        dependentAddressUpdateConfig,
                    ]) => {
                        this.employeeIDMaxLength = +employeeIdMaxLength.value;
                        this.addressValidationSwitch = this.staticUtilService.isConfigEnabled(addressValidationSwitch);
                        this.addressMatchConfig = this.staticUtilService.isConfigEnabled(addressMatch);
                        this.stronglyRecommendedEmailConfig = this.staticUtilService.isConfigEnabled(stronglyRecommendedEmailConfig);
                        this.dependentAddressUpdateConfig = this.staticUtilService.isConfigEnabled(dependentAddressUpdateConfig);
                    },
                ),
            )
            .subscribe();
    }

    /**
     * This function is used  to get member contact of contact type work.
     */
    getMemberWorkContact(): void {
        this.memberService
            .getMemberContact(this.memberInfo.id, ContactType.WORK, this.mpGroupId.toString())
            .pipe(
                catchError((error) => {
                    this.memberWorkContact = {
                        address: {
                            state: undefined,
                            zip: undefined,
                        },
                        emailAddresses: [],
                    };
                    this.memberWorkContactRegisteredSubject$.next();
                    return of(error);
                }),
                tap((data) => {
                    if (data && data.body) {
                        this.memberWorkContact = data.body;
                        if (!this.memberWorkContact.address) {
                            this.memberWorkContact.address = {
                                state: undefined,
                                zip: undefined,
                            };
                        }
                        this.memberWorkContactRegisteredSubject$.next();
                        this.isPhonePrimary = !(data.body.phoneNumbers && data.body.phoneNumbers.some((value) => value.primary));
                    }
                    this.checkRequiredFields();
                }),
                switchMap(() =>
                    iif(
                        () =>
                            !this.data.isDirect &&
                            this.portal === Portals.PRODUCER.toLowerCase() &&
                            (this.enrollmentMethod === EnrollmentMethod.HEADSET || this.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE),
                        this.checkForHQAccountRestrictions(),
                        of(null),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    getEmployeeState(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((states) => {
                this.employeeStates = states;
            });
    }
    /**
     * This function is used to validate state and zip code
     * @param value zip code value
     */
    checkZipCode(value: string): void {
        this.subscriptions.push(
            validateStateAndZipCode(this.form.value.state, value, this.form.controls.zip, this.staticService, this.sharedService),
        );
    }

    closeForm(action: string): void {
        this.dialogRef.close(action);
    }
    /**
     * get the error messages for the form data
     * @param control form control data
     * @returns error message
     */
    getErrorMessages(control: string): string {
        if (this.isFormSubmit && !this.form.controls[control].value) {
            this.form.controls[control].markAsTouched();
            return this.languageStrings["primary.portal.common.requiredField"];
        }
        if (this.form.controls[control].hasError("maxlength")) {
            return this.language.fetchSecondaryLanguageValue("secondary.portal.census.manualEntry.maxlength100");
        }
        return this.form.controls[control].hasError("pattern")
            ? this.languageStrings["primary.portal.members.beneficiaryValidationMsg.streetAddress1"]
            : "";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validateDate(event: any): string {
        this.form.controls.birthDate.setErrors({ invalid: true });
        const dateInput = this.dateService.toDate(this.form.controls["birthDate"].value);
        if (this.isFormSubmit && !this.form.controls["birthDate"].value) {
            return this.languageStrings["primary.portal.common.requiredField"];
        }
        if ((this.form.controls["birthDate"].value === null || this.form.controls["birthDate"].value === "") && event !== "") {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (dateInput <= this.today && !(dateInput.getMonth() + 1 && dateInput.getDate() && dateInput.getFullYear())) {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (this.today.getFullYear() - dateInput.getFullYear() < +this.minimumSubscriberAge) {
            return this.languageStrings["primary.portal.direct.addCustomer.employeeMinAge"].replace(
                "#minSubscriberAge",
                this.minimumSubscriberAge,
            );
        }
        this.form.controls.birthDate.setErrors(null);
        return null;
    }
    /**
     * get error message for employee form data
     * @param formControlName form control data
     * @returns error message
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        if (formControlName === "genderName" || formControlName === "state") {
            return this.form.controls[formControlName].errors.required ? "primary.portal.common.selectionRequired" : "";
        }
        return this.form.controls[formControlName].errors.required ? "primary.portal.common.requiredField" : "";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    numberValidation(event: any): void {
        if (event.type === "keypress" && !(event.keyCode <= 57 && event.keyCode >= 48)) {
            event.preventDefault();
        }
    }
    cellType(event: MatCheckboxChange): void {
        this.phonenumberType = PhoneContactTypes.HOME;
        if (event.checked) {
            this.isMobile = true;
        } else {
            this.isMobile = false;
        }
    }
    phoneNumberValid(): void {
        if (this.form.controls["phoneNumber"].invalid && this.form.controls["phoneNumber"].value === "") {
            this.disableCheckBox = true;
        } else {
            this.onPreferenceChange(this.form.controls.deliveryPreferance.value);
            this.disableCheckBox = false;
        }
    }
    /**
     * Method to add validators for the required field based on delivery preference
     * @param deliveryPreference - Event of delivery preference radio button
     */
    onPreferenceChange(deliveryPreference: string): void {
        const emailAddress = this.form.get("emailAddress");
        const phoneType = this.form.get("phoneType");
        const formCtrlDeliveryPreferance = this.form.get("deliveryPreferance");

        if (emailAddress.value) {
            emailAddress.markAsUntouched();
        }
        if (
            (deliveryPreference === CorrespondenceType.ELECTRONIC &&
                !this.memberContactInfo.emailAddresses?.length &&
                !(this.memberWorkContact && this.memberWorkContact.emailAddresses?.length)) ||
            this.data.emailEBSConfirmationEnable
        ) {
            this.isEmailOptional = false;
            if (!emailAddress.value) {
                emailAddress.setErrors({ required: true });
            }
            emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
            if (!phoneType.value) {
                phoneType.setErrors({ required: true });
            }
            phoneType.setValidators([Validators.required]);
            if (this.isFormSubmit) {
                emailAddress.markAsTouched();
                phoneType.markAsTouched();
            }
        } else if (
            formCtrlDeliveryPreferance.value === "" ||
            (formCtrlDeliveryPreferance.value === CorrespondenceType.PAPER && !emailAddress.value?.length)
        ) {
            if (this.data.checkEBSEmail) {
                this.isEmailOptional = false;
            } else {
                this.setEBSEmailPhoneNotMandatory();
            }
        }
        this.form.updateValueAndValidity();
    }

    /**
     *
     * @description the function checks for consent and saves member contact details
     * @memberof EmployeeRequiredInfoComponent
     */
    saveInfo(): void {
        this.isSpinnerLoading = true;
        this.disableSubmit = true;
        this.isFormSubmit = true;
        if (this.addressMatchConfig && this.data.isAIPlanInCart) {
            // to ensure personalAddress contains all mandatory details required to pass to the addressMatch api
            const personalAddress: PersonalAddress = this.utilService.copy(this.memberContactInfo.address);
            if (!this.memberContactInfo.address.address1) {
                personalAddress.address1 = this.form.controls["address1"].value;
            }
            if (!this.memberContactInfo.address.city) {
                personalAddress.city = this.form.controls["city"].value;
            }
            // restricted address match check for agent self enrollment
            this.sharedService
                .checkAgentSelfEnrolled()
                .pipe(
                    filter((isAgentSelfEnrolled) => !isAgentSelfEnrolled),
                    switchMap(() =>
                        this.addressMatchingService.validateAccountContactOrAccountProducerMatch(
                            this.mpGroupId,
                            this.memberInfo.id,
                            personalAddress,
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((isAddressMatched) => {
                    this.isAddressMatched = isAddressMatched;
                });
        }
        if (this.data.ssnRequiredForEnrollment && !this.memberInfo.ssn) {
            this.form.controls.ssn.markAsTouched();
        }
        const updatedProfileData: string[] = [];
        if (this.form.get("ssn").touched) {
            updatedProfileData.push(`${this.languageStrings["primary.portal.member.ssn_itin"]} : ${this.form.get("ssn").value}`);
        }
        if (this.form.get("phoneNumber").touched) {
            updatedProfileData.push(
                `${this.languageStrings["primary.portal.members.contactLabel.phone"]} : ${this.form.get("phoneNumber").value}`,
            );
        }
        if (this.form.get("emailAddress").touched) {
            updatedProfileData.push(
                `${this.languageStrings["primary.portal.members.contactLabel.email"]} : ${this.form.get("emailAddress").value}`,
            );
        }
        if (this.form.get("address1").touched) {
            updatedProfileData.push(
                `${this.languageStrings["primary.portal.direct.addCustomer.homeStreetAddress1"]} : ${this.form.controls["address1"].value}`,
            );
        }
        if (this.form.get("city").touched) {
            updatedProfileData.push(
                `${this.languageStrings["primary.portal.direct.addCustomer.city"]} : ${this.form.controls["city"].value}`,
            );
        }
        this.saveUpdatedData(updatedProfileData);
    }

    /**
     * @description check if member has cif number and open confirmation modal
     * @param updatedProfileData
     */
    checkCifNumber(updatedProfileData: string[]): void {
        combineLatest([
            this.memberService.getMember(this.memberInfo.id, true, this.mpGroupId.toString()),
            this.sharedService.getStandardDemographicChangesConfig(),
        ])
            .pipe(
                switchMap(([profileData, isStandaloneDemographicEnabled]) => {
                    const hasCifNumber = profileData.body.customerInformationFileNumber !== undefined;
                    if (hasCifNumber && isStandaloneDemographicEnabled && updatedProfileData.length) {
                        return this.openProfileChangesConfirmPrompt(updatedProfileData);
                    }
                    return of(true);
                }),
                filter((isSaved) => !!isSaved),
                tap((response) => this.compareDependentAddress()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * @description open profile changes confirmation modal
     * @param updatedProfileData
     */
    openProfileChangesConfirmPrompt(updatedProfileData: string[]): Observable<boolean> {
        this.disableSubmitButton();
        return this.empoweredModalService
            .openDialog(ProfileChangesConfirmPromptComponent, {
                data: {
                    data: updatedProfileData,
                    isAgentAssisted: false,
                },
            })
            .afterClosed();
    }

    /**
     * @description save the form data after confirmation
     * @param updatedProfileData string[] - list of currently updated data
     */
    saveUpdatedData(updatedProfileData: string[]): void {
        if (this.data.showRequiredInfo) {
            if (!this.form.controls.workZip.touched) {
                this.form.controls.workZip.markAsTouched();
                this.form.controls.workZip.setValue(this.form.controls.workZip.value);
            }
            this.checkInvalidFieldsAndFocus();
            if (
                this.form.valid &&
                (this.consentCheckbox.value || this.getMemberConsent || this.enrollmentMethod === this.enrollmentMethodStrings.CALL_CENTER)
            ) {
                this.checkRequiredFields();
                this.checkCifNumber(updatedProfileData);
            } else {
                if (!this.consentCheckbox.value) {
                    this.consentCheckbox.setErrors({ required: true });
                }
                this.formControls.forEach((control) => {
                    if (
                        !this.form.controls[control].value &&
                        !((control === "emailAddress" || control === "phoneType") && this.isEmailOptional)
                    ) {
                        this.form.controls[control].markAsTouched();
                    }
                    if ((control === "emailAddress" || control === "phoneType") && !this.isEmailOptional) {
                        this.form.controls[control].updateValueAndValidity();
                    }
                });
                if (this.form.controls.confirmSSN) {
                    // This is a temporary fix to work around an open issue with forms:
                    // https://github.com/angular/angular/issues/10887
                    (this.form.controls.confirmSSN.statusChanges as EventEmitter<string>).emit("TOUCHED");
                }
                this.disableSubmitButton();
            }
        } else {
            this.disableSubmitButton();
        }
    }

    /**
     * @description disable submit button and stop spinner
     */
    disableSubmitButton(): void {
        this.disableSubmit = false;
        this.isSpinnerLoading = false;
    }

    /**
     * @description get member dependents and their contact information
     * @memberof EmployeeRequiredInfoComponent
     */
    getMemberDependents(): void {
        this.memberService
            .getMemberDependents(this.memberInfo.id, true, this.mpGroupId)
            .pipe(
                mergeMap((dependents) => dependents),
                mergeMap((dependent) =>
                    this.memberService.getDependentContact(this.memberInfo.id, dependent.id.toString(), this.mpGroupId).pipe(
                        map((address) => {
                            this.dependentsArray.push({ ...dependent, address });
                        }),
                    ),
                ),
                catchError((error) => {
                    if (error.error) {
                        this.store.dispatch(new SetErrorForShop(error.error));
                    }
                    this.isSpinnerLoading = false;
                    return of([]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    compareDependentAddress(): void {
        const updateDependents = [];
        const dependentContactObservables = [];
        this.dependentsArray.forEach((dep) => {
            this.mappedDependent = [];
            this.mappedDependent.push(dep);
            if (!dep.address.address.address1 || !dep.address.address.city) {
                dep.address.address.address1 = dep.address.address.address1
                    ? dep.address.address.address1
                    : this.updateMemberContact.address.address1;
                dep.address.address.address2 = this.updateMemberContact.address.address2 || "";
                dep.address.address.city = dep.address.address.city ? dep.address.address.city : this.updateMemberContact.address.city;
                updateDependents.push(dep);
                dependentContactObservables.push(this.updateDependentAddress());
            }
        });
        if (dependentContactObservables.length > 0) {
            forkJoin(dependentContactObservables)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.updateInfo();
                });
        } else {
            this.updateInfo();
        }
    }

    updateDependentAddress(): Observable<unknown> {
        const dependent = this.mappedDependent.pop();
        return this.memberService.saveDependentContact(dependent.address, this.memberInfo.id, dependent.id.toString(), this.mpGroupId);
    }

    /** Function to accept member consent and update it
     *  @returns Observable<boolean>
     */
    updateConsentInfo(): Observable<boolean> {
        return this.memberService.acceptMemberConsent(this.memberInfo.id, this.mpGroupId).pipe(
            takeUntil(this.unsubscribe$),
            mergeMap(() =>
                iif(
                    () =>
                        this.data.isIDV &&
                        ((this.data.isPayroll &&
                            this.sharedService.checkPayrollMethodAndIdv(
                                this.data.enrollmentMethod,
                                this.data.isPayrollHeadsetIDV,
                                this.data.isPayrollCallCenterIDV,
                                this.data.isPayrollVirtualF2FIDV,
                            )) ||
                            (this.data.isDirect &&
                                ((this.data.enrollmentMethod === AppSettings.HEADSET && this.data.isDirectHeadsetIDV) ||
                                    (this.data.enrollmentMethod === AppSettings.CALL_CENTER && this.data.isDirectCallCenterIDV)))),
                    this.memberService.verifyMemberIdentity(
                        this.data.memberId,
                        this.data.aflacEicPreference,
                        this.data.userPreference,
                        this.data.systemFlowCode,
                        this.data.mpGroupId,
                    ),
                    of(null),
                ),
            ),
            catchError(() => of(null)),
        );
    }

    /** Function to close the dialog modal.
     * @params isCloseDialog used to check if value is true, it is allowed to close the dialog
     * @returns void
     */
    closeDialogModal(isCloseDialog: boolean): void {
        if (!this.isAddressMatched && isCloseDialog) {
            if (this.isAddressUpdating) {
                this.openDependentAddressUpdateModal(this.updateMemberContact.address);
            }
            this.disableSubmitButton();
            if (this.shouldCloseModal) {
                this.dialogRef.close(APP_FLOW_ACTION);
            }
        } else if (this.isAddressMatched && isCloseDialog) {
            this.isSpinnerLoading = false;
            const promptData: AddressMatchModel = {
                isDirect: this.data.isDirect,
                isTPILnlAgentAssisted: false,
                isTPILnlSelfService: false,
                mpGroupId: this.mpGroupId,
                memberId: this.memberInfo.id,
                address: this.memberContactInfo.address,
            };
            const addressMatchingPromptDialogRef = this.empoweredModalService.openDialog(AddressMatchingPromptComponent, {
                data: promptData,
            });
            addressMatchingPromptDialogRef
                .afterClosed()
                .pipe(
                    tap((routeToAppFlowData) => {
                        if (routeToAppFlowData) {
                            this.disableSubmit = false;
                            this.dialogRef.close(APP_FLOW_ACTION);
                            if (routeToAppFlowData.updatedAddress) {
                                this.openDependentAddressUpdateModal(routeToAppFlowData.updatedAddress);
                            } else if (
                                this.addressMatchingService.hasAddressChanged(this.memberAddress, this.updateMemberContact.address)
                            ) {
                                this.openDependentAddressUpdateModal(this.updateMemberContact.address);
                            }
                        } else if (this.addressMatchingService.hasAddressChanged(this.memberAddress, this.updateMemberContact.address)) {
                            this.openDependentAddressUpdateModal(this.updateMemberContact.address);
                            this.memberAddress = this.updateMemberContact.address;
                        }
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description method to open DependentAddressUpdateModalComponent modal
     * @param address new address entered
     * @returns void
     */
    openDependentAddressUpdateModal(address: Address): void {
        if (this.dependentAddressUpdateConfig && this.dependentsArray.length) {
            this.empoweredModalService.openDialog(DependentAddressUpdateModalComponent, {
                data: {
                    memberId: this.memberInfo.id,
                    memberAddress: address,
                },
            });
        }
    }
    /**
     * Method to update member consent and information
     */
    updateInfo(): void {
        this.updateMemberContact.phoneNumbers.forEach((pnumber) => {
            pnumber.phoneNumber = pnumber.phoneNumber.split("-").join("");
        });
        const ssnConfirmed = this.getSSNConfirmationStatus();
        if (this.formControls.some((control) => control !== CONSENT_EMAIL)) {
            this.updateMemberContact.addressValidationDate = undefined;
            const newDeptApi$ = iif(() => this.addNewDepartmentFlag, this.saveNewDepartment(), of(""));
            const memberIdentifier: MemberIdentifier = {
                id: this.memberInfo.id,
                memberIdentifierTypeId: this.data.customID,
                value: this.form.controls.employeeCustomID.value,
                version: null,
                ssnConfirmed,
            };
            // TODO - code needs to be optimised
            newDeptApi$
                .pipe(
                    switchMap(() => this.updateConsentInfo()),
                    switchMap(() => {
                        if (this.isAccountRatingCodePEO && !this.memberInfo.workInformation.departmentNumber) {
                            Object.assign(this.updateMemberInfo.workInformation, {
                                departmentNumber: this.form.controls.organizationId.value
                                    ? this.form.controls.organizationId.value.name
                                    : null,
                                industryCode: this.form.controls.organizationId.value
                                    ? this.form.controls.organizationId.value.riskClass
                                    : null,
                                organizationId:
                                    typeof this.form.controls.organizationId.value === VARIABLE_TYPE_OBJECT
                                        ? null
                                        : this.form.controls.organizationId.value,
                            });
                        }
                        return this.memberService.updateMember(
                            { ...this.updateMemberInfo, ssnConfirmed },
                            this.mpGroupId.toString(),
                            this.memberInfo.id.toString(),
                        );
                    }),
                    switchMap(() =>
                        iif(
                            () => this.isEmployeeIdFieldRequired && !this.employeeId,
                            this.memberService.saveMemberIdentifier(memberIdentifier, +this.mpGroupId),
                            of(false),
                        ),
                    ),
                    switchMap(() => {
                        if (this.addressValidationSwitch && !this.verifyAddressFlag && this.isAddressUpdating) {
                            return this.verifyAddressDetails(false);
                        }
                        return this.saveEmployeeAddress();
                    }),
                    catchError((error: HttpErrorResponse) => {
                        this.errorBody(error);
                        return EMPTY;
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(() => this.closeDialogModal(true));
        } else {
            this.updateConsentInfo()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {},
                    () => {},
                    () => {
                        this.closeDialogModal(true);
                    },
                );
        }
    }

    // This method is used to check all invalid fields in signatureForm and focuses to first invalid field
    checkInvalidFieldsAndFocus(): void {
        // Loop will run for the form controls till the first invalid form control is encountered
        for (const key of Object.keys(this.form.controls)) {
            if (this.form.controls[key].invalid) {
                const invalidControl = this.el.nativeElement.querySelector(`[formcontrolname="${key}"]`);
                if (invalidControl) {
                    invalidControl.focus();
                    break;
                }
            }
        }
    }

    /** Function called when checkbox to accept consent is clicked on
     * @event
     */
    acceptConsent(): void {
        this.consentCheckbox.setValue(!this.consentCheckbox.value);
    }

    /**
     * Function to check if the member has given the consent or not
     */
    checkMemberConsent(): void {
        if (this.portal.toUpperCase() !== Portals.MEMBER) {
            this.memberService
                .getMemberConsent(this.memberInfo.id)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.getMemberConsent = res;
                });
        } else {
            this.getMemberConsent = true;
        }
    }

    /**
     * Function to update consentEmail field
     */
    updateConsentEmail(): void {
        const deliveryPreferance = this.form.get("deliveryPreferance");
        const consentEmail = this.form.get("consentEmail");
        const emailAddress = this.form.get("emailAddress");
        if (deliveryPreferance.value === CorrespondenceType.PAPER && emailAddress.value?.length <= 0 && !this.data.checkEBSEmail) {
            this.setEBSEmailPhoneNotMandatory();
        } else {
            this.isEmailOptional = false;
            emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
            emailAddress.updateValueAndValidity();
        }

        if (consentEmail && emailAddress.valid) {
            consentEmail.setValue(emailAddress.value);
        }
    }

    /**
     * Function to be called when Send button is clicked to email consent to member in the start of app flow
     * @returns nothing
     * */
    onSendConsentEmail(): void {
        this.form.controls.emailAddress.setValue(this.form.controls.consentEmail.value);
        this.isSpinnerLoading = true;
        this.updateMemberContact.addressValidationDate = undefined;
        if (this.form.controls[CONSENT_EMAIL].value) {
            this.updateMemberContact.emailAddresses = [
                {
                    email: this.form.controls.consentEmail.value,
                    type: this.form.controls.phoneType.value,
                    primary: true,
                    verified: false,
                },
            ];
        }
        if (!this.memberContactInfo.emailAddresses.length) {
            if (this.addressValidationSwitch && !this.verifyAddressFlag && this.isAddressUpdating) {
                this.verifyAddressDetails(true).pipe(takeUntil(this.unsubscribe$)).subscribe();
            } else {
                this.saveFullAddressDetails().pipe(takeUntil(this.unsubscribe$)).subscribe();
            }
        } else {
            this.triggerEmailEndPoint().pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    /**
     * This function is used to display api error
     * @param error HttpErrorResponse
     */
    errorBody(error: HttpErrorResponse): void {
        this.errorMessage = "";
        this.errorFlag = false;
        this.disableSubmitButton();
        this.goToTop();
        if (error.status === ServerErrorResponseCode.RESP_500) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.qle.pendindEnrollment.InternalServer.error");
            this.errorFlag = true;
        } else if (
            (error.error.status === ClientErrorResponseCode.RESP_400 || error.error.status === ClientErrorResponseCode.RESP_409) &&
            error.error.details
        ) {
            this.errorFlag = true;
            error.error.details.forEach((msg, i) => {
                if (i > 0) {
                    this.errorMessage += ", ";
                }
                if (msg.code === API_ERROR_MESSAGE_CODE && msg.field === API_ERROR_MESSAGE_FIELD_PHONE_NUMBER) {
                    this.errorMessage += this.language.fetchSecondaryLanguageValue("secondary.portal.phoneNumber.mandatory");
                } else if (msg.code === API_ERROR_DUPLICATE_CODE && msg.field === API_ERROR_PHONE) {
                    this.errorMessage += this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.members.api.400.badParameter.phoneNumbers",
                    );
                } else if (msg.code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                    this.errorMessage = this.language.fetchPrimaryLanguageValue(msg.message);
                } else if (msg.field === API_ERROR_MESSAGE_FIELD_PHONE_NUMBER) {
                    this.errorMessage += this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.members.contactValidationMsg.invalidPhoneNumber",
                    );
                } else if (msg.field?.toLowerCase() === SSN_INPUT_FIELD_NAME) {
                    this.form.controls.ssn?.setErrors({
                        duplicateSSNFound: true,
                    });
                    this.errorFlag = false;
                } else if (msg.field?.toLowerCase() === ITIN_INPUT_FIELD_NAME) {
                    this.form.controls.ssn?.setErrors({
                        duplicateITINFound: true,
                    });
                    this.errorFlag = false;
                } else {
                    this.errorMessage += error.error.details[i].message;
                }
            });
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
            this.errorFlag = true;
        }
    }
    /**
     * This function triggers member email consent
     * @return HttpResponse of unknown
     */
    triggerEmailEndPoint(): Observable<HttpResponse<unknown>> {
        this.isSpinnerLoading = true;
        return this.memberService.emailMemberConsent(this.memberInfo.id, this.mpGroupId).pipe(
            tap(() => {
                this.isSpinnerLoading = false;
                this.emailSentSuccessfully = true;
            }),
            catchError((error: HttpErrorResponse) => {
                this.isSpinnerLoading = false;
                this.emailSentSuccessfully = false;
                this.errorBody(error);
                return EMPTY;
            }),
        );
    }
    /**
     * this function will get an observable from member service to fetch member contact
     * @returns observable to fetch member profile data
     */
    getMemberContact(): Observable<HttpResponse<MemberContact>> {
        return this.memberService.getMemberContact(this.memberInfo.id, ContactType.HOME, this.mpGroupId.toString());
    }
    /**
     * this function will set email address key of updateMemberContact and memberContactInfo objects
     */
    setEmailAddress(): void {
        if (this.updatedContactInfo.emailAddresses && this.updatedContactInfo.emailAddresses.length > 0) {
            this.updateMemberContact.emailAddresses = this.updatedContactInfo.emailAddresses;
            this.memberContactInfo.emailAddresses = this.updatedContactInfo.emailAddresses;
        }
    }
    /**
     * This method is used to verify the address entered by user before saving it.
     * @param value contains boolean value to differentiate between member address function and save all function.
     * @returns memberContact or VerifiedAddress or nothing
     */
    verifyAddressDetails(value: boolean): Observable<HttpResponse<MemberContact | void> | unknown | VerifiedAddress> {
        this.tempMemberAddress = this.updateMemberContact.address;
        this.openAddressModal = false;
        return this.memberService.verifyMemberAddress(this.tempMemberAddress).pipe(
            switchMap((resp) => {
                this.addressResp = false;
                this.isSpinnerLoading = false;
                this.matched = resp.matched;
                this.suggestedAddress = resp.suggestedAddress;
                this.updateMemberContact.addressValidationDate = new Date();
                if (resp.matched) {
                    this.verifyAddressFlag = true;
                    this.saveInfo();
                } else if (!this.openAddressModal) {
                    return this.openModal(ADDRESS_BOTH_OPTION, value);
                }
                return undefined;
            }),
            catchError((err) => this.handleErrorOfVerifyAddress(err, value)),
        );
    }

    /**
     * This method is used to handle error for validating address
     * @params error check http error response
     * @params isOpenModal to check the boolean value
     * @returns MemberContact or nothing
     */
    handleErrorOfVerifyAddress(error: HttpErrorResponse, isOpenModal: boolean): Observable<HttpResponse<MemberContact | void> | unknown> {
        this.addressResp = true;
        this.disableSubmitButton();
        this.addressMessage = [];
        if (error.status === ClientErrorResponseCode.RESP_400) {
            this.updateMemberContact.addressValidationDate = new Date();
            if (error.error && error.error.details) {
                error.error.details.map((item) => this.addressMessage.push(item.message));
            } else {
                this.addressMessage.push(this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"));
            }
        } else if (error.status === ServerErrorResponseCode.RESP_503) {
            this.openAddressModal = true;
            this.addressMessage.push(this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.serverUnreachable"));
            return this.openModal(ADDRESS_SINGLE_OPTION, isOpenModal);
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            this.openAddressModal = true;
            this.addressMessage.push(
                this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
            );
        } else if (error.status) {
            this.addressMessage.push(error.error.details[0].message);
        }
        if (this.openAddressModal) {
            this.selectedAddress = "";
            this.updateMemberContact.address = this.selectedAddress === SUGGESTED_ADDRESS ? this.suggestedAddress : this.tempMemberAddress;
            return this.nextAfterVerifyAddress(isOpenModal);
        }
        return this.openModal(ADDRESS_SINGLE_OPTION, isOpenModal);
    }

    /**
     * This function is responsible to scroll quasi model to the top.
     */
    goToTop(): void {
        this.onErrorScroll.nativeElement.scrollIntoView();
    }

    /**
     * This function will be called when user will click on save after filling contact-info-form
     * @param option contains the number of options we have to show in verify address pop-up
     * @param value contains boolean value to differentiate between member address function and save all function.
     */
    openModal(option: string, value: boolean): Observable<HttpResponse<MemberContact | void> | unknown> {
        this.openAddressModal = true;
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.tempMemberAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
            },
        });
        return addressDialog.afterClosed().pipe(
            switchMap((elementData) => {
                this.isSpinnerLoading = true;
                if (elementData) {
                    this.disableSubmit = true;
                }
                this.selectedAddress = elementData ? elementData.data.selectedAddress : "";
                if (this.selectedAddress === SUGGESTED_ADDRESS) {
                    this.updateMemberContact.address = this.suggestedAddress;
                } else {
                    this.updateMemberContact.address = this.tempMemberAddress;
                }
                if (elementData && elementData.data.isVerifyAddress) {
                    return this.nextAfterVerifyAddress(value);
                }
                return of();
            }),
            finalize(() => {
                this.closeModal();
                this.isSpinnerLoading = false;
            }),
        );
    }
    /**
     *
     * This function is used to save full address details and employee contact details.
     * @returns Observable<HttpResponse<MemberContact | unknown>>
     */
    saveFullAddressDetails(): Observable<HttpResponse<MemberContact | unknown>> {
        return this.getSaveMemberContactObservables().pipe(
            takeUntil(this.unsubscribe$),
            tap(() => {
                this.form.controls.consentEmail.disable();
            }),
            switchMap(() => this.getMemberContact()),
            switchMap((memberContactResponse) => {
                this.updatedContactInfo = memberContactResponse.body;
                this.setEmailAddress();
                this.isSpinnerLoading = false;
                return this.triggerEmailEndPoint();
            }),
            catchError((error: HttpErrorResponse) => {
                this.isSpinnerLoading = false;
                this.errorBody(error);
                return EMPTY;
            }),
        );
    }

    /**
     * Get observables array for api to save home and work contact
     * @returns observable of save member contact api call(s)
     */
    getSaveMemberContactObservables(): Observable<void> {
        let isWorkContact = false;
        const memberWorkContactState = this.memberWorkContact.address.state;
        const memberWorkContactZip = this.memberWorkContact.address.zip;
        const emailAddress = this.form.get("emailAddress");
        const phoneType = this.form.get("phoneType");
        if (emailAddress.value && phoneType.value === ContactType.WORK) {
            isWorkContact = true;
            this.updateMemberContact.emailAddresses = [];
            this.memberWorkContact.emailAddresses = [
                {
                    email: emailAddress.value,
                    type: phoneType.value,
                    primary: true,
                    verified: false,
                },
            ];
            if (!memberWorkContactState) {
                this.memberWorkContact.address.state = this.updateMemberContact.address.state;
            }
            if (!memberWorkContactZip) {
                this.memberWorkContact.address.zip = this.updateMemberContact.address.zip;
            }
        }
        if (this.data.workStateAndZipRequired) {
            this.memberWorkContact.address.state = this.form.controls.workState.value as string;
            this.memberWorkContact.address.zip = this.form.controls.workZip.value as string;
            if (!this.memberWorkContact.emailAddresses) {
                delete this.memberWorkContact.emailAddresses;
            }
        }
        if (isWorkContact || this.data.workStateAndZipRequired) {
            return this.memberService
                .saveMemberContact(this.memberInfo.id, ContactType.HOME, this.updateMemberContact, this.mpGroupId.toString())
                .pipe(
                    delay(SECOND_IN_MILLISECONDS),
                    switchMap(() =>
                        this.memberService.saveMemberContact(
                            this.memberInfo.id,
                            ContactType.WORK,
                            this.memberWorkContact,
                            this.mpGroupId.toString(),
                        ),
                    ),
                );
        }
        return this.memberService.saveMemberContact(
            this.memberInfo.id,
            ContactType.HOME,
            this.updateMemberContact,
            this.mpGroupId.toString(),
        );
    }

    /**
     * Save member contact.
     * @returns observable of save member contact api call(s) with additional logic as response
     */
    saveEmployeeAddress(): Observable<void> {
        return this.getSaveMemberContactObservables().pipe(
            takeUntil(this.unsubscribe$),
            tap(() => {
                this.disableSubmitButton();
                if (this.isDepartmentIdCreated && !this.isAddressMatched && this.shouldCloseModal) {
                    this.dialogRef.close(APP_FLOW_ACTION);
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.errorBody(error);
                if (
                    this.memberWorkContact &&
                    this.memberWorkContact.emailAddresses &&
                    error.error.status === ClientErrorResponseCode.RESP_400 &&
                    error.error.details
                ) {
                    this.memberWorkContact.emailAddresses = [];
                }
                return EMPTY;
            }),
        );
    }

    /**
     * This function will be called when user clicks "Next" on the address verify pop-up.
     * @param value is containing MemberProfile details
     * @returns observable of MemberContact or nothing
     */
    nextAfterVerifyAddress(value: boolean): Observable<HttpResponse<MemberContact | unknown>> | Observable<void> {
        if (value) {
            return this.saveFullAddressDetails();
        }
        return this.saveEmployeeAddress();
    }

    /**
     * This function is used for closing address validation dialogue.
     */
    closeModal(): void {
        this.openAddressModal = false;
        this.addressResp = false;
    }

    /**
     * Check if any/all fields need to be restricted in an HQ account based on permissions
     * If any restrictions are in place show an error message
     *
     * @returns observable of whether info is partially editable
     */
    checkForHQAccountRestrictions(): Observable<boolean> {
        const editableFields = ["phoneNumber", "emailAddress", CONSENT_EMAIL, "deliveryPreferance", "phoneType", "confirmSSN"];
        const nonEditableFields = this.formControls.filter((controlName) => !editableFields.includes(controlName));
        return combineLatest([
            this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(),
            this.staticUtilService.hasPermission(UserPermissionList.AFLAC_HQ_ACCOUNT_EDIT_EMPLOYEE_PROFILE),
            this.staticUtilService.hasPermission(UserPermissionList.AFLAC_HQ_ACCOUNT_PARTIALLY_EDIT_EMPLOYEE_PROFILE),
        ]).pipe(
            filter(
                ([isNotHQAccount, canEditProfile, canPartiallyEditProfile]) =>
                    !isNotHQAccount &&
                    !canEditProfile &&
                    (!canPartiallyEditProfile || (canPartiallyEditProfile && nonEditableFields.length > 0)),
            ),
            map(([, , canPartiallyEditProfile]) => canPartiallyEditProfile),
            tap((canPartiallyEditProfile) => {
                // Special case - If SSN is the only non-editable field
                // and has a non-null value
                // then allow the user to confirm their SSN
                // provided the SSN confirmation feature is enabled.
                // Note: the original SSN value cannot be updated in this case.
                this.disableSubmit = !(
                    this.data.ssnConfirmationEnabled &&
                    nonEditableFields.length === 1 &&
                    nonEditableFields[0] === "ssn" &&
                    this.form.controls.ssn?.value
                );
                if (!this.disableSubmit) {
                    this.form.controls.confirmSSN?.enable();
                } else {
                    this.errorFlag = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.requiredInfo.error.HQAccountRestrictions",
                    );
                }
                if (canPartiallyEditProfile) {
                    nonEditableFields.forEach((controlName) =>
                        (controlName === CONSENT_EMAIL ? this.consentCheckbox : this.form.get(controlName)).disable(),
                    );
                } else {
                    this.form.disable();
                }
            }),
        );
    }

    /**
     * function to set validators for newDepartmentId when user click add new department
     * @param data represents the value selected
     */
    departmentChanged(data: number): void {
        if (this.isAflacUSer) {
            this.addNewDepartmentFlag = data === this.ADD_NEW;
            if (this.addNewDepartmentFlag) {
                this.form.addControl(
                    "newDepartmentId",
                    this.fb.control("", [Validators.required, Validators.pattern(this.validationRegex.DEPARTMENT_ID)]),
                );
            } else {
                this.form.removeControl("newDepartmentId");
                this.isDepartmentIdCreated = true;
            }
        }
    }

    /**
     * function to create new organization
     * @returns observable of string or nothing
     */
    saveNewDepartment(): Observable<HttpResponse<void> | string> {
        const payload = {
            name: this.form.controls.newDepartmentId ? this.form.controls.newDepartmentId.value : "",
            code: this.form.controls.newDepartmentId ? this.form.controls.newDepartmentId.value : "",
            parentId: this.PARENT_ID,
        };
        return this.accountProfileService.createOrganization(payload).pipe(
            tap((Response) => {
                const eleArray = Response.headers.get("location").split("/");
                this.newDepartmentId = +eleArray[eleArray.length - 1];
                this.isDepartmentIdCreated = true;
                if (this.isAccountRatingCodePEO) {
                    Object.assign(this.updateMemberInfo.workInformation, {
                        departmentNumber: this.form.controls.organizationId.value ? this.form.controls.organizationId.value.name : null,
                        industryCode: this.form.controls.organizationId.value ? this.form.controls.organizationId.value.riskClass : null,
                    });
                } else {
                    Object.assign(this.updateMemberInfo.workInformation, {
                        organizationId: this.addNewDepartmentFlag ? this.newDepartmentId : this.form.controls.organizationId.value,
                    });
                }
            }),
            catchError(() => {
                this.updateMemberInfo.workInformation.organizationId = this.data.memberInfo.workInformation.organizationId;
                this.errorMessage = this.languageStrings["primary.portal.census.manualEntry.notSaved"];
                this.errorFlag = true;
                this.isDepartmentIdCreated = false;
                return of("");
            }),
        );
    }

    /**
     * Function to update the form control value on keyup
     * @param ssnInputElement form control element of SSN
     */
    ssnFormControlUpdate(ssnInputElement: HTMLInputElement): void {
        this.form.controls.ssn?.setValue(ssnInputElement?.value);
    }

    /**
     * Updates values on manual SSN input.
     *
     * @param value input value
     */
    onSSNInputChange(value: string): void {
        const formattedSSN = this.ssnFormatPipe.transform(value, new RegExp(this.validationRegex.SSN_SPLIT_FORMAT));
        this.form.controls.ssn.setValue(formattedSSN);
        this.ssnManualInputSubject$.next(formattedSSN);
    }

    /**
     * Initializes the confirm SSN field and sets up listeners to enable/disable it.
     */
    setupConfirmSSNField(): void {
        const ssnSplitPattern = new RegExp(this.validationRegex.SSN_SPLIT_FORMAT);

        this.form.addControl(
            CONFIRM_SSN_INPUT_FIELD_NAME,
            this.fb.control({ value: "", disabled: !this.memberInfo.ssn }, { validators: [Validators.required] }),
        );
        const ssnInput = this.form.controls.ssn as FormControl;
        const confirmSSNInput = this.form.controls.confirmSSN as FormControl;
        const latestValidSSN$ = ssnInput.valueChanges.pipe(
            filter((ssn: string) => !ssn || (ssn.length === SSN_LENGTH_VALIDATION && !ssn.includes("X"))),
        );
        this.confirmSsnService
            .updateValidators(confirmSSNInput, latestValidSSN$, this.form.controls.ssn.statusChanges.pipe(distinctUntilChanged()))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.confirmSsnService
            .updateControl(confirmSSNInput, latestValidSSN$, this.ssnManualInputSubject$.asObservable())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        ssnInput.setValue(this.ssnFormatPipe.transform(this.memberInfo.ssn, ssnSplitPattern));
    }

    /**
     * Determines SSN confirmation status.
     *
     * @returns whether SSN was validated/confirmed.
     */
    getSSNConfirmationStatus(): boolean | undefined {
        if (this.data.ssnConfirmationEnabled) {
            return this.form.controls.confirmSSN ? this.form.controls.confirmSSN.valid : this.memberInfo.ssnConfirmed;
        }
        return undefined;
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
