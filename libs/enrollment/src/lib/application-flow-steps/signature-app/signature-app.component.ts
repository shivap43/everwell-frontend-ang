import {
    AppFlowService,
    EnrollmentMethodState,
    EnrollmentState,
    MemberWizardState,
    SharedState,
    StaticUtilService,
    TPIState,
    UpdateApplicationResponse,
    UtilService,
} from "@empowered/ngxs-store";
import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import {
    Carrier,
    CoreService,
    EnrollmentService,
    PendingReasonForPdaCompletion,
    ShoppingCartDisplayService,
    Signature,
    SignaturePlan,
    StaticService,
    UnsignedApplicationForms,
} from "@empowered/api";
import { Router } from "@angular/router";
import { Select, Store } from "@ngxs/store";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { combineLatest, concat, forkJoin, Observable, of, Subject } from "rxjs";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { LanguageService } from "@empowered/language";
import { catchError, filter, switchMap, take, takeUntil, tap } from "rxjs/operators";
import {
    AllConstraint,
    Application,
    ApplicationResponse,
    AppSettings,
    BasePlanApplicationPanel,
    CarrierId,
    ClientErrorResponseCode,
    CompanyCode,
    ConfigName,
    Configurations,
    ConstraintAggregates,
    ContraintsType,
    EnrollmentMethod,
    GetCartItems,
    GetPlan,
    MemberCoverageDetails,
    MemberCredential,
    Option,
    PayFrequency,
    Permission,
    PlanFlexDollarOrIncentives,
    PreliminaryForm,
    ProducerCredential,
    ProductId,
    RequiredCondition,
    RequiredConstraint,
    ResponsePanel,
    Section,
    ServerErrorResponseCode,
    StepData,
    StepTitle,
    StepType,
} from "@empowered/constants";
import { ViewPlanDetailsComponent } from "../view-plan-details/view-plan-details.component";
import { ConsentStatementComponent } from "./consent-statement/consent-statement.component";
import { HttpResponse } from "@angular/common/http";
import { MatCheckbox } from "@angular/material/checkbox";
import { EmpoweredModalService, EmpoweredSheetService, SharedService } from "@empowered/common-services";
import { NGRXStore } from "@empowered/ngrx-store";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { select } from "@ngrx/store";
import {
    SendEnrollmentSummaryEmailModalAction,
    SendEnrollmentSummaryEmailModalComponent,
    SendEnrollmentSummaryEmailModalResponseData,
    SendEnrollmentSummaryEmailModalService,
} from "@empowered/ui";

const BACK_TO_REVIEW = "BackToReview";
const NEXT_SIGNATURE = "NextSignature";
const REVIEW_OPTION = 0;
const SEND_OTP = 1;
const VERIFY_OTP = 2;
const SIGN_APP = 3;
const OWNER_PIN_CONTROL = "ownerPinControl";
const OWNER_SIGNATURE = "ownerSignature";
const YES = "Yes";
const NO = "No";
const COMMA = ",";
const MAX_SIGNATURE_LENGTH = 200;
const PRELIMINARY_NOTICE = "PRELIMINARY_NOTICE";

interface MemberContactListDisplay {
    contact: string;
    disableField: boolean;
    type: string;
    primary: boolean;
}
@Component({
    selector: "empowered-signature-app",
    templateUrl: "./signature-app.component.html",
    styleUrls: ["./signature-app.component.scss"],
})
export class SignatureAppComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() showPreliminaryStatement;
    // flag to check reinstate flow.
    @Input() isReinstate?: boolean;
    @ViewChild("unsignedTemplate") unSignedModal;
    @ViewChild("oneSignatureSection", { static: true }) oneSignatureSection;
    planId: number;
    itemId: number;
    mpGroup;
    memberId;
    applicationData: BasePlanApplicationPanel[];
    showSignature = false;
    getApplicationData;
    loadSpinner = false;
    showReview = false;
    showApplicantForm = false;
    reviewPlans: SignaturePlan[] = [];
    signatureForm: FormGroup;
    reviewApplicationForm: FormGroup;
    contactForm: FormGroup;
    plan;
    filename = "unSignedApplicationView.htm";
    showError = false;
    errorMessage: string;
    requiredFormsData = [];
    displayValidation = false;
    getAllApplicationData: Application[] = [];
    totalCost = 0;
    applicantsFormStepData = [];
    replaceGlossary = AppSettings.REPLACE_GLOSSARY;
    replaceSalary = AppSettings.REPLACE_SALARY;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    allData = [];
    allDataWithNoSigns = [];
    reviewData = [];
    constantFormValue = 0;
    formResponse: ApplicationResponse[];
    applicantResponse: ApplicationResponse[];
    updatedResponse: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    validationRegex: any;
    applicantStep: any;
    requiredStep = [];
    payFrequency: PayFrequency;
    totalRequiredCount = 0;
    isRequired: boolean;
    requiredCount = 0;
    applicantIndex: number;
    requiredFormError = false;
    applicant = [];
    ridersCost = 0;
    totalCostReview = 0;
    totalCostSign = 0;
    companyProvidedPlans: SignaturePlan[] = [];
    portal: any;
    safeUrl: SafeResourceUrl;
    unSignedFileURL: string;
    dialogRef;
    planNames: any;
    pinControl: any;
    requiredFormsConstraints = [];
    currentDate = new Date();
    firstName: string;
    lastName: string;
    isHybridUser: boolean;
    isCallCenterAgent: boolean;
    enrollmentMethod: string;
    showPin = false;
    isHeadset = false;
    emailContacts = [];
    textContacts = [];
    contactList = [];
    customerSign: string;
    showSignatureForm = false;
    customerInitial: string;
    requestSignData = [];
    memberFirstName: string;
    hasMemberContact = false;
    routeAfterLogin: string;
    @ViewChild("contactTemplate") contactModal;
    @ViewChild("signatureFormRef") signatureFormRef;
    reviewApplicationOption: string;
    privacyNoteLabel = [];
    isButtonClicked = [];
    isBenefitDollarConfigEnabled: boolean;
    isBenefitDollarPresent = false;
    flexDollar: PlanFlexDollarOrIncentives[] = [];
    disableData = [];
    reviewStatus = true;
    reviewText = "Viewing of application is required";
    hasError: boolean;
    privacyNoteError = false;
    reviewRequired: string;
    reviewRequiredStates: string;
    reviewRequiredPolicySeriesRegex: string;
    enrollmentState: string;
    hideIDoNotOption = false;
    viewMandatoryIds: string[];
    policySeries = [];
    hideBackReviewButton = false;
    showReviewForm = false;
    isDirect = false;
    email = "email";
    stateVA: boolean;
    phoneNumber = "phoneNumber";
    ERROR = "error";
    checkedForm = "CheckedForm";
    initials = "Initials";
    readonly REVIEW_INITIALS = "reviewInitials";
    disableTillViewPDF = true;
    allCartItems: GetCartItems[];
    declinedCoverageLevelId = 2;
    unsignedForms: UnsignedApplicationForms[];
    listOfUnsignedForms: string[] = [];
    privacyPracticesNoticeLink: string;
    downloadError = false;
    callCenterPin: string;
    pinDisableFlag = false;
    isBDAvailable = false;
    questions: string[];
    isOwnerSignature = false;
    ownerPinControl: FormControl;
    ownerSignature: FormControl;
    ownerPinControlResp: string;
    ownerSignatureResp: string;
    OWNER_SIGNATURE_INDEX = 0;
    QUESTION_RESP_NO = "no";
    MAX_SIGNATURE_LEN = 25;
    MIN_SIGNATURE_LEN = 2;
    MIN_PIN_SIGNATURE_LEN = 3;
    MAX_INITIALS_LEN = 3;
    agPlansData: SignaturePlan[] = [];
    isOtpRequired = false;
    hasOtp = false;
    isVF2F = false;
    hideApplicationOption = false;
    planDetailsList = [];
    vF2FStepDetails: { vF2FStepDetail: Section[]; planId: number; cartId: number }[] = [];
    argusPlanApplicationPanel: BasePlanApplicationPanel[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.signApplications",
        "primary.portal.applicationFlow.applicationReviewOptions",
        "primary.portal.applicationFlow.eSigning",
        "primary.portal.applicationFlow.iDoNot",
        "primary.portal.applicationFlow.Iunderstand",
        "primary.portal.applicationFlow.iDo",
        "primary.portal.applicationFlow.wantToView",
        "primary.portal.applicationFlow.nextSignature",
        "primary.portal.applicationFlow.provide",
        "primary.portal.applicationFlow.provideSignContent",
        "primary.portal.applicationFlow.initialContent",
        "primary.portal.applicationFlow.signatureProvide",
        "primary.portal.applicationFlow.signature",
        "primary.portal.applicationFlow.signatureReview",
        "primary.portal.applicationFlow.customerSignature",
        "primary.portal.applicationFlow.viewApplication",
        "primary.portal.applicationFlow.viewApplication.required",
        "primary.portal.applicationFlow.applicationInsurance",
        "primary.portal.applicationFlow.applicationStatus",
        "primary.portal.applicationFlow.cannotExceed",
        "primary.portal.applicationFlow.signature.maxLength",
        "primary.portal.applicationFlow.minthreeCharacters",
        "primary.portal.applicationFlow.useOnlyLetters",
        "primary.portal.applicationFlow.initialLetter",
        "primary.portal.applicationFlow.requiredForms",
        "primary.portal.applicationFlow.iHereby",
        "primary.portal.applicationFlow.iacknowledge",
        "primary.portal.applicationFlow.privacyNote",
        "primary.portal.applicationFlow.applicationeSignature",
        "primary.portal.applicationFlow.signatureRequired",
        "primary.portal.applicationFlow.oneCharacter",
        "primary.portal.applicationFlow.signatureLater",
        "primary.portal.applicationFlow.electronicSign",
        "primary.portal.applicationFlow.agentSignature",
        "primary.portal.applicationFlow.review",
        "primary.portal.applicationFlow.enrollmentCompleted",
        "primary.portal.applicationFlow.backReview",
        "primary.portal.applicationFlow.submit",
        "primary.portal.applicationFlow.customerSignatureRequired",
        "primary.portal.applicationFlow.emailNotHave",
        "primary.portal.applicationFlow.youCanNotify",
        "primary.portal.applicationFlow.contactInfo",
        "primary.portal.applicationFlow.acknowledgement",
        "primary.portal.applicationFlow.skipSendLater",
        "primary.portal.applicationFlow.sendCustomer",
        "primary.portal.applicationFlow.addContactInfo",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.requiredField",
        "primary.portal.applicationFlow.applicationInsuranceOne",
        "primary.portal.applicationFlow.invalidFormat",
        "primary.portal.applicationFlow.print",
        "primary.portal.applicationFlow.finish",
        "primary.portal.applicationFlow.enterPin",
        "primary.portal.applicationFlow.toEmployee",
        "primary.portal.applicationFlow.initials",
        "primary.portal.common.close",
        "primary.portal.applicationFlow.tocustomer",
        "primary.portal.headset.email",
        "primary.portal.headset.text",
        "primary.portal.headset.viewapp",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
        "primary.portal.applicationFlow.confirmation.signReqApplications",
        "primary.portal.applicationFlow.confirmation.signReqApplication",
        "primary.portal.common.submit.applicant",
        "primary.portal.headset.sendto.applicant",
        "primary.portal.applicationFlow.submit",
        "primary.portal.applicationFlow.finishApplications",
        "primary.portal.applicationFlow.wantToViewSome",
        "primary.portal.applicationFlow.signatureAndDot",
        "primary.portal.applicationFlow.enrollmentCompletedOneApp",
        "primary.portal.applicationFlow.listOfUnsignedForms",
        "primary.portal.applicationFlow.applicant",
        "primary.portal.applicationFlow.applicants",
        "primary.portal.applicationFlow.confirmation.downloadError",
        "primary.portal.benefitDollars.payment.message",
        "primary.portal.applicationFlow.ownerSignature",
        "primary.portal.applicationFlow.enterOwnerPin",
        "primary.portal.shoppingExperience.viewDetails",
        "primary.portal.common.next",
        "primary.portal.vf2f.electronicSign",
        "primary.portal.common.and",
        "primary.portal.vf2f.consent.statement",
        "primary.portal.applicationFlow.applicationReviewDescription",
        "primary.portal.applicationFlow.applicationReviewStatus",
        "primary.portal.enrollment.review.initial",
        "primary.portal.applicationFlow.hipaa.viewPdf",
        "primary.portal.applicationFlow.hipaa.unCheck",
        "primary.portal.applicationFlow.hipaa.optOut",
        "primary.portal.applicationFlow.hipaa.optIn",
        "primary.portal.applicationFlow.hipaa.info",
        "primary.portal.applicationFlow.hipaa.heading",
        "primary.portal.applicationFlow.hipaa.check",
    ]);
    secondaryLanguageString: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.errorSignature",
        "secondary.portal.applicationFlow.errorMoreThan200Char",
        "secondary.portal.applicationFlow.reviewALL",
        "secondary.portal.common.errorUpdatingResponse",
        "secondary.portal.common.errorSavingTheResponse",
        "secondary.portal.common.errorSendingRequestSignature",
        "secondary.portal.applicationFlow.errorMessage",
        "secondary.portal.applicationFlow.cannotSubmitApplication",
        "secondary.portal.applicationFlow.reviewSome",
        "secondary.portal.common.pattern.signature",
        "secondary.portal.callCenter.8x8.api.common.error.message",
        "secondary.portal.accounts.minCharRequired",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    appResponse: any;
    planCartData: any;
    private unsubscribe$ = new Subject<void>();
    reviewNotRequiredStatus: boolean;
    viewSomeReview = false;
    privacyNote = "privacyNote";
    isTpi = false;
    isTpiMember: boolean;
    isEfinancialAgent = false; // Same variable used for Stride Life Quote and Clearlink Call Centres
    isCostCalculated = false;
    aflacBDApply = false;
    agCarrierId: CarrierId;
    memberList: string[] = [];
    // form group of VF2F send otp step
    sendOtpForm: FormGroup;
    someApplicationReviewRequired = false;
    applicantStepIndex = -1;
    signatureApiCalls: Observable<HttpResponse<void>>[] = [];
    isHipaaConsentRead = false;
    isHipaaEligible = true;
    userName: string;
    consentLinkHipaa: string;
    isHipaaAllowed = false;
    isHipaaChecked = false;
    prevHipaaValue = false;
    eSignatureMinLength: number;
    eSignatureMaxLength: number;
    maxLengthError = "";
    readonly PAY_FREQUENCY_SHORT_LENGTH = 20;
    carriers: Carrier[] = [];
    preliminaryStepIndex: number;
    emailPreliminaryForm$ = this.appFlowService.emailPreliminaryForms$;
    preliminaryNotice = PRELIMINARY_NOTICE;
    preliminaryForms: PreliminaryForm[] = [];
    isEnrollmentSummaryReceiptEnabled = false;
    isHospitalProduct = false;
    hospitalProductName = "Hospital";
    /**
     * constructor of component
     * use to get memberId, mpGroup and benefit dollar config from store
     * @param enrollmentService Ref of enrollment service.
     * @param store - Ref of ngxs store
     * @param sanitizer - Dom sanitizer of angular package. It is used to by pass the security.
     * @param matDialog - Ref of angular material dialog
     * @param appFlowService - Reference of appFlowService
     * @param fb - Form builder package of angular. It is used to construct a form.
     * @param shoppingCartService - Ref of shopping cart display service.
     * @param userService - Ref of user service. It is used to process user related info
     * @param staticService - Ref of static service. It is used to get configurations.
     * @param router - Ref of angular router.
     * @param language -  Reference of Language service [used to get localized value]
     * @param utilService - Reference of util service
     * @param staticUtilService - Ref of static util service. It is used to get permissions and configurations.
     * @param sharedService
     * @param empoweredModalService - Ref of empowered modal service. It is used to open a modal.
     * @param empoweredSheetService - Ref of empowered sheet service. It is used to open a sheet.
     * @param coreService
     * @param ngrxStore
     * @param sendEnrollmentSummaryEmailModalService
     */
    constructor(
        private readonly enrollmentService: EnrollmentService,
        private readonly store: Store,
        private readonly sanitizer: DomSanitizer,
        private readonly matDialog: MatDialog,
        private readonly appFlowService: AppFlowService,
        private readonly fb: FormBuilder,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly userService: UserService,
        private readonly staticService: StaticService,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly empoweredSheetService: EmpoweredSheetService,
        private readonly coreService: CoreService,
        private readonly ngrxStore: NGRXStore,
        // eslint-disable-next-line max-len
        private readonly sendEnrollmentSummaryEmailModalService: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>,
    ) {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.staticUtilService
            .cacheConfigs([ConfigName.BENEFIT_DOLLARS, ConfigName.ALLOW_USER_FOR_HIPAA_CONSENT])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([aflacBDApply, isHipaaAllowed]) => {
                    this.aflacBDApply = this.staticUtilService.isConfigEnabled(aflacBDApply);
                    this.isHipaaAllowed = this.staticUtilService.isConfigEnabled(isHipaaAllowed);
                }),
            )
            .subscribe();
    }

    /** *
     * ngOnInit() : Lifecycle hook to initialize the component
     * It'll provide application details to review.
     */
    ngOnInit(): void {
        this.checkMandatoryToViewApp();
        this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
        if (this.router.url.indexOf("direct") >= 0) {
            this.isDirect = true;
        }
        this.agCarrierId = CarrierId.AFLAC_GROUP;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        this.applicant.push(this.languageStrings["primary.portal.applicationFlow.applicants"]);
        this.applicant.push(this.languageStrings["primary.portal.applicationFlow.applicant"]);
        this.itemId = this.planObject.application.cartData.id;
        this.allCartItems = this.store.selectSnapshot(EnrollmentState.GetCartItem);
        this.flexDollar = this.store.selectSnapshot(EnrollmentMethodState.getPlanLevelFlexIncentives);
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(
                switchMap((response) => this.getConfigurationSpecifications(response)),
                switchMap(() => this.getReviewApplicationDetails()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.checkCallCentrePermission();
        this.routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.isTpiMember =
                Boolean(this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId) ||
                !this.store.selectSnapshot(TPIState.getTPIProducerId);
        }
        if (this.isTpi) {
            this.getTPIData();
        } else {
            combineLatest([this.userService.credential$, this.staticUtilService.hasPermission(Permission.HYBRID_USER)])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([credential, hybridUserPermission]: [ProducerCredential & MemberCredential, boolean]) => {
                    if (credential.producerId && credential.memberId) {
                        this.enrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
                    }

                    if (credential.producerId && !credential.memberId) {
                        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment).enrollmentMethod;
                        this.enrollmentState = this.store.selectSnapshot(
                            EnrollmentMethodState.currentEnrollment,
                        ).enrollmentStateAbbreviation;
                    }
                    this.isVF2F = this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
                    if (credential.memberId && !credential.producerId) {
                        const memberContact = this.store.selectSnapshot(EnrollmentState.GetMemberContact);
                        if (memberContact) {
                            this.enrollmentState = memberContact.address.state;
                        }
                    }
                    const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
                    if (memberData && memberData.info && memberData.info.name) {
                        this.memberFirstName = memberData.info.name.firstName;
                    }

                    this.firstName = credential.name.firstName;
                    this.lastName = credential.name.lastName;
                    if (credential.producerId && credential.callCenterId) {
                        this.firstName = credential.name.firstName;
                        this.lastName = credential.name.lastName;
                        if (hybridUserPermission) {
                            this.isHybridUser = true;
                        } else {
                            this.isCallCenterAgent = true;
                        }
                        if (
                            this.enrollmentMethod === EnrollmentMethod.CALL_CENTER ||
                            this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE
                        ) {
                            this.showPin = true;
                        }
                    }
                });
        }
        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
            this.isHeadset = true;
            if (this.isTpi && this.isHeadset) {
                this.appFlowService.showNextProductFooter$.next({
                    nextClick: true,
                    data: EnrollmentMethod.HEADSET,
                });
            }
            this.showReviewForm = false;
            this.hideBackReviewButton = true;
            this.disableTillViewPDF = false;
            const contactInfo = this.store.selectSnapshot(EnrollmentState.GetMemberData).contactInfo;
            contactInfo.forEach((contact) => {
                if (contact.emailAddresses && contact.emailAddresses.length) {
                    contact.emailAddresses.forEach((emailAddress) => {
                        this.emailContacts.push({ email: emailAddress.email, primary: emailAddress.primary });
                    });
                }
                if (contact.phoneNumbers && contact.phoneNumbers.length) {
                    contact.phoneNumbers.forEach((phoneNumber) => {
                        this.textContacts.push(phoneNumber.phoneNumber);
                    });
                }
            });
        }

        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.staticUtilService
            .cacheConfigs([
                ConfigName.PRIVACY_PRACTICES_NOTICE_LINK,
                ConfigName.USER_APPLICATION_REVIEW_REQUIRED_STATES,
                ConfigName.HIPAA_CONSENT_SHARE_POINT_LINK,
                ConfigName.ENROLLMENT_SUMMARY_RECEIPT,
            ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([privacyPracticesNoticeLink, stateVA, consentLinkHipaa, isEnrollmentSummaryReceiptEnabled]) => {
                this.privacyPracticesNoticeLink = privacyPracticesNoticeLink.value;
                this.stateVA = stateVA.value === this.enrollmentState;
                this.consentLinkHipaa = consentLinkHipaa.value;
                this.isEnrollmentSummaryReceiptEnabled = this.staticUtilService.isConfigEnabled(isEnrollmentSummaryReceiptEnabled);
            });
        this.checkMandatoryToViewApp();
        this.appFlowService.onVf2fSubStepChange$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentStepIndex) => {
            this.enableNextStep(currentStepIndex);
        });
        this.constructSendOtpForm();
        if (this.isTpi) {
            const tpiData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.userName = tpiData.user.username;
        } else {
            const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
            this.userName = memberData.info.username;
        }
        this.appFlowService.showPreliminaryStatementStep$.pipe(takeUntil(this.unsubscribe$)).subscribe((showPreliminaryStatement) => {
            this.preliminaryStepIndex = showPreliminaryStatement ? 1 : 0;
        });
    }

    /**
     * this method constructs reactive form for send otp step.
     * @returns void
     */
    constructSendOtpForm(): void {
        this.sendOtpForm = this.fb.group({
            electronicAddress: [null, Validators.required],
            tempElectronicAddress: [""],
            confirmation: [false, Validators.required],
        });
    }

    /**
     * This method checks for the permission of particular call centre.
     */
    checkCallCentrePermission(): void {
        combineLatest([
            this.staticUtilService.hasPermission(Permission.AFLAC_E_FINANCE),
            this.staticUtilService.hasPermission(Permission.AFLAC_CLEAR_LINK),
            this.staticUtilService.hasPermission(Permission.AFLAC_STRIDE_LIFE_QUOTE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([aflacEFinance, aflacClearLink, aflacStrideLifeQuote]) => {
                if (aflacEFinance || aflacClearLink || aflacStrideLifeQuote) {
                    this.isEfinancialAgent = true;
                }
            });
    }

    /**
     * This method will fetch the data for TPI flow
     * @returns void
     */
    getTPIData(): void {
        if (!this.isTpiMember) {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        } else {
            const memberContact = this.store.selectSnapshot(EnrollmentState.GetMemberContact);
            if (memberContact) {
                this.enrollmentState = memberContact.address.state;
            }
        }
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        if (memberData && memberData.info && memberData.info.name) {
            this.memberFirstName = memberData.info.name.firstName;
        }
        this.firstName = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.firstName;
        this.lastName = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.lastName;
        this.setPinForCallCenterForTpiFlow();
    }
    /**
     * This method will set showPin to true if selected account has permission for call center in TPI flow.
     * @returns void
     */
    setPinForCallCenterForTpiFlow(): void {
        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        const producerId = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId;
        const producerCallCentreId = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.callCenterId;
        this.staticUtilService
            .hasPermission(Permission.HYBRID_USER)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((hybridUserPermission) => Boolean(producerId && producerCallCentreId)),
            )
            .subscribe((hybridUserPermission: boolean) => {
                if (hybridUserPermission) {
                    this.isHybridUser = true;
                } else {
                    this.isCallCenterAgent = true;
                }
                if (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE) {
                    this.showPin = true;
                }
            });
    }

    /**
     * This method checks whether a particular plan is mandatory to view application pdf.
     */
    checkMandatoryToViewApp(): void {
        combineLatest([
            this.planObject.reinstate
                ? this.store.select(EnrollmentState.GetReinstatementPanel)
                : this.store.select(EnrollmentState.GetApplicationPanel),
            this.staticUtilService.fetchConfigs([
                ConfigName.ENROLLMENT_AFLAC_VISION_PLANS,
                ConfigName.ENROLLMENT_LIFE_APPLICANT_OWNER_QUESTION_IDS,
            ]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                const [applicationData, [mandatoryCheck, questionId]] = data;
                if (this.viewMandatoryIds) {
                    this.viewMandatoryIds.push(...(mandatoryCheck.value || "").split(","));
                } else {
                    this.viewMandatoryIds = (mandatoryCheck.value || "").split(",");
                }
                const notMandatoryViewAppPlans = applicationData.filter((plan) => !this.viewMandatoryIds.includes(plan.planId.toString()));
                this.hideIDoNotOption = notMandatoryViewAppPlans.length === 0;
                this.questions = questionId.value.split(",");
            });
    }

    /**
     * createReviewApplicationForm(): method will get trigger on page load It'll load the application form to review.
     * based on the user selection, It'll hide/show I do/I do not buttons.
     */
    createReviewApplicationForm(): void {
        this.showReviewForm = true;
        this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: NEXT_SIGNATURE });
        if (this.hideIDoNotOption) {
            this.reviewApplicationForm = this.fb.group({
                reviewApplication: ["Yes", Validators.required],
            });
            this.reviewOnNext();
        } else {
            this.reviewApplicationForm = this.fb.group({
                reviewApplication: [null, Validators.required],
            });
        }
    }
    /**
     * @description This function will create signature form
     * @return void
     */
    createSignatureForm(): void {
        if (this.showPin) {
            const callCenterPin = this.appFlowService.getcallCenterPin();
            this.signatureForm = this.fb.group(
                {
                    pinControl: [
                        callCenterPin && callCenterPin.length > 0 ? callCenterPin : null,
                        [
                            Validators.required,
                            Validators.maxLength(25),
                            Validators.minLength(3),
                            Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                        ],
                    ],
                    privacyNote: [false, [Validators.required]],
                    hipaaConsent: [false],
                },
                // { updateOn: "blur" }
            );
            if (callCenterPin && callCenterPin.length > 0) {
                this.signatureForm.get("pinControl").disable();
            }
        } else if (this.isHeadset) {
            this.signatureForm = this.fb.group({
                signature: [],
                privacyNote: [],
                hipaaConsent: [false],
            });
            this.signatureForm.controls.signature.disable();
            this.showSignatureForm = true;
        } else {
            this.signatureForm = this.fb.group({
                signature: [
                    null,
                    [
                        Validators.required,
                        Validators.pattern(this.validationRegex.E_SIGNATURE),
                        Validators.minLength(this.eSignatureMinLength),
                        Validators.maxLength(this.eSignatureMaxLength),
                    ],
                ],
                privacyNote: [false, [Validators.required]],
                hipaaConsent: [false],
            });
        }
        this.formData();
        if (this.isHipaaEligible && this.isHipaaAllowed) {
            this.fetchHipaaDetails();
        }
        this.appFlowService.readHipaaConsentForm.pipe(takeUntil(this.unsubscribe$)).subscribe((isRead) => {
            this.memberList = isRead;
            if (this.memberList.includes(this.userName) && this.signatureForm) {
                this.signatureForm.controls.hipaaConsent.enable();
            } else {
                this.signatureForm.controls.hipaaConsent.disable();
            }
        });
    }

    /**
     * @description Set the forms and validations based on the config and enrollment type
     * @returns Observable of Configurations array, UnsignedApplicationForms array
     */
    getReviewApplicationDetails(): Observable<[Configurations[], UnsignedApplicationForms[]]> {
        this.loadSpinner = true;
        return forkJoin([
            this.staticUtilService.fetchConfigs(
                [
                    ConfigName.USER_APPLICATION_REVIEW_REQUIRED,
                    ConfigName.USER_APPLICATION_REVIEW_REQUIRED_STATES,
                    ConfigName.REVIEW_REQUIRED_POLICY_SERIES_REGEX,
                    ConfigName.HIDE_ARGUS_APPLICATION_OPTION,
                ],
                this.mpGroup,
            ),
            this.enrollmentService.getUnsignedApplicationForms(this.memberId, this.mpGroup),
        ]).pipe(
            tap(
                (dataValue) => {
                    if (dataValue.length && dataValue[0].length) {
                        const [reviewRequired, reviewRequiredStates, reviewRequiredPolicySeriesRegex] = dataValue[0];
                        this.reviewRequired = reviewRequired.value;
                        this.reviewRequiredStates = reviewRequiredStates.value;
                        this.reviewRequiredPolicySeriesRegex = reviewRequiredPolicySeriesRegex.value;
                        this.unsignedForms = dataValue[1];
                    }
                    const argusCarrierIds = dataValue[0][3]?.value?.split(COMMA).map((CarrierIds) => +CarrierIds);
                    const applications = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
                    const isHideArgusCarrierAppOptionInAppData = applications?.length
                        ? applications.filter((applicationData) => argusCarrierIds.includes(applicationData.carrierId))
                        : [];

                    if (
                        (!this.unsignedForms.length && !!isHideArgusCarrierAppOptionInAppData.length) ||
                        this.checkPolicySeries() ||
                        !this.checkForMandatoryToViewPlans()
                    ) {
                        this.hideIDoNotOption = true;
                    }
                    if (!this.isHeadset) {
                        this.createReviewApplicationForm();
                    }
                    this.loadSpinner = false;
                    this.createSignatureForm();
                },
                (error: Error) => {
                    this.loadSpinner = false;
                    this.showError = true;
                    this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.errorMessage"];
                },
            ),
        );
    }
    /**
     * @description Used to get configuration values from the database
     * @param isSelfEnrollingAgent is user self enrolling agent
     * @returns Observable of array of configurations
     */
    getConfigurationSpecifications(isSelfEnrollingAgent: boolean): Observable<Configurations[]> {
        return this.staticUtilService
            .fetchConfigs(
                [
                    ConfigName.TELEPHONE_INITIAL_PLACEHOLDER,
                    ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER,
                    ConfigName.BROKER_CALL_CENTER_AGENT_PIN,
                ],
                this.mpGroup,
            )
            .pipe(
                tap(([customerInitial, customerSign, eSignatureData]) => {
                    this.customerInitial = customerInitial.value.split(",")[0];
                    this.customerSign = customerSign.value.split(",")[0];
                    this.eSignatureMaxLength = isSelfEnrollingAgent
                        ? +eSignatureData.value.split(",")[0].split("=")[1]
                        : MAX_SIGNATURE_LENGTH;
                    this.eSignatureMinLength = +eSignatureData.value.split(",")[1].split("=")[1];
                    this.maxLengthError = this.languageStrings["primary.portal.applicationFlow.signature.maxLength"].replace(
                        "##length##",
                        this.eSignatureMaxLength.toString(),
                    );
                }),
            );
    }

    /**
     * @description To view the unsigned application on One signature page
     * @param cartId id of cart items
     * @param index index of cart item
     * @param planId id of plan
     * @returns void
     */
    viewUnsignedApplication(cartId: any, index: any, planId: string): void {
        this.planNames = this.allData
            .filter((x) => x.cartId === cartId)
            .map((x) => x.planName)
            .pop();
        this.loadSpinner = true;
        this.enrollmentService
            .downloadUnsignedApplication(this.memberId, this.mpGroup, cartId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: any) => {
                    const unSignedBlob = new Blob([response], { type: "text/html" });
                    this.unSignedFileURL = window.URL.createObjectURL(unSignedBlob);

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(unSignedBlob, this.filename);
                    } else {
                        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.unSignedFileURL);
                        this.dialogRef = this.matDialog.open(this.unSignedModal);
                    }

                    this.loadSpinner = false;
                    this.isButtonClicked[index] = false;
                    this.allData[index].disableData = false;
                    if (this.checkReviewApplicationCompleted()) {
                        this.disableTillViewPDF = false;
                    }
                    if (planId) {
                        this.viewMandatoryIds.splice(this.viewMandatoryIds.indexOf(planId), 1);
                    }
                },
                (error) => {
                    this.loadSpinner = false;
                    if (error?.status === ServerErrorResponseCode.RESP_503) {
                        this.downloadError = true;
                        this.errorMessage = this.secondaryLanguageString["secondary.portal.callCenter.8x8.api.common.error.message"];
                    }
                },
            );
    }
    // To open the pdf in new window
    print(): void {
        window.open(this.unSignedFileURL, "_blank");
    }
    closeDialog(): void {
        this.dialogRef.close();
    }

    // regex for removing text from applicant and required form text
    regEx(stringVal: string): any {
        return new RegExp(stringVal, "g");
    }

    /**
     * To get the form data from the store
     */
    formData(): void {
        this.store
            .select(EnrollmentState.GetApplications)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (this.planObject.reinstate) {
                    this.getAllApplicationData = this.utilService.copy(
                        data.filter((appData) => appData.planId === this.planObject.application.appData.planId && !appData.cartItemId),
                    );
                } else {
                    this.getAllApplicationData = this.utilService.copy(data);
                }
            });
        if (this.planObject.reinstate) {
            this.store
                .select(EnrollmentState.GetReinstatementPanel)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    this.applicationData = data.filter((appData) => appData.planId === this.planObject.application.appData.planId);
                });
        } else {
            this.store
                .select(EnrollmentState.GetApplicationPanel)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    this.applicationData = data;
                });
        }
        this.staticUtilService
            .cacheConfigValue(ConfigName.HIDE_ARGUS_APPLICATION_OPTION)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((argusCarrierId) => {
                const argusCarrierIds = argusCarrierId.split(COMMA).map((CarrierIds) => +CarrierIds);
                this.argusPlanApplicationPanel = this.applicationData.filter(
                    (applicationData) => !argusCarrierIds.includes(applicationData.carrierId),
                );
                this.hideApplicationOption = this.argusPlanApplicationPanel.length ? false : true;
                if (this.hideApplicationOption || this.hideIDoNotOption || this.stateVA || this.isHospitalProduct) {
                    this.showSignatureForm = !this.isVF2F;
                    this.showReviewForm = false;
                    this.hideBackReviewButton = true;
                    this.reviewApplicationOption = this.hideIDoNotOption ? NO : YES;
                }
            });

        // passing enrollment state info to get carriers list w.r.t. to enrollment state
        // for displaying carrier legal name
        if (!this.enrollmentState) {
            const currentState = this.store.selectSnapshot(MemberWizardState.GetCurrentState);
            const stateCode = currentState?.userData?.contact?.address.state === CompanyCode.NY ? CompanyCode.NY : null;
            this.enrollmentState = stateCode;
        }
        this.coreService
            .getCarriers(this.enrollmentState)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((carriers) => {
                this.carriers = carriers;
                this.allData.forEach((data, index) => {
                    this.allData[index].legalName = this.carriers?.find((carrier) => carrier.id === data?.planData?.carrierId)?.legalName;
                });
            });
        this.getAllData();
        this.isHipaaEligible = !(
            this.applicationData.filter(
                (data) => data.productId === ProductId.JUVENILE_TERM_LIFE || data.productId === ProductId.JUVENILE_WHOLE_LIFE,
            ).length === this.applicationData.length ||
            this.applicationData.filter((data) => data.carrierId === CarrierId.AFLAC_GROUP).length === this.applicationData.length
        );
    }

    /**
     * To get all data for applicants, required forms, review plans and AG plans
     */
    getAllData(): void {
        this.getAllApplicationData?.forEach((dataValue) => {
            this.applicantStepIndex = -1;
            this.applicantIndex = -1;
            const plan = dataValue?.sections?.filter((section) => section.title === StepTitle.SIGN).pop();
            if (plan) {
                this.getPlanData(dataValue);
            } else {
                if (this.isVF2F) {
                    this.constructVF2FDetails(dataValue, dataValue.cartItemId);
                }
                const reviewPlanData = this.applicationData.filter(
                    (data) =>
                        data?.planId === dataValue.planId &&
                        (data?.cartData?.id === dataValue.cartItemId ||
                            (this.planObject.reinstate && data.cartData.applicationType === StepType.REINSTATEMENT)),
                );
                if (reviewPlanData?.length) {
                    this.getReviewPlanData(reviewPlanData[0], dataValue);
                }
            }
        });
        this.totalCost = this.totalCostSign + this.totalCostReview;
        this.createForm();
        this.dataToConfirmation();
    }

    /**
     * To fetch coverage details from getMemberCoverageDetails API, display details on ViewPlanDetails pop up
     * @param cartId number CartId
     */
    viewPlanDetailsDialog(cartId: number): void {
        this.appFlowService
            .getMemberCoverageDetailsAPI(this.memberId, cartId, null, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response: MemberCoverageDetails) => {
                const dialogConfig = new MatDialogConfig();
                dialogConfig.data = response;
                this.empoweredModalService.openDialog(ViewPlanDetailsComponent, dialogConfig);
            });
    }

    /**
     * gets plansList to display on signature page
     * @param dataValue application of current plan
     */
    getPlanData(dataValue: Application): void {
        this.ridersCost = 0;
        this.showSignature = true;
        this.appResponse = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter((resp) => resp.application.planId === dataValue.planId)
            .pop();
        if (
            this.questions?.length &&
            this.enrollmentMethod !== EnrollmentMethod.PIN_SIGNATURE &&
            this.enrollmentMethod !== EnrollmentMethod.CALL_CENTER
        ) {
            this.questions.forEach((id) => {
                const ownerSignResp = this.appResponse?.response?.find((resp) => resp.planQuestionId === +id);
                if (ownerSignResp !== undefined) {
                    this.isOwnerSignature = ownerSignResp.value[this.OWNER_SIGNATURE_INDEX] === this.QUESTION_RESP_NO;
                }
            });
        }
        this.createOwnerSignatureForm();
        const planData = this.applicationData.filter(
            (data) =>
                data.planId === dataValue.planId &&
                (data.cartData.id === dataValue.cartItemId ||
                    (this.planObject.reinstate && data.cartData.applicationType === StepType.REINSTATEMENT)),
        );
        if (planData && planData.length) {
            this.planCartData = planData[0].cartData;
            if (planData[0].cartData.riders !== null) {
                planData[0].cartData.riders.forEach((rCost) => {
                    this.ridersCost = this.ridersCost + rCost.totalCost;
                });
            }
            const requiredFormIndex = dataValue.sections.findIndex(
                (section) =>
                    section.title === StepTitle.REQUIREDFORMS ||
                    section.title === StepTitle.REQUIREDFORMS1 ||
                    section.title === StepTitle.REQUIREDFORMS2,
            );
            for (const app of this.applicant) {
                this.applicantIndex = dataValue.sections.findIndex((section) => section.title === app);
                if (this.applicantIndex > 0) {
                    break;
                }
            }

            if (this.applicantIndex >= 0) {
                const applicantData = dataValue.sections[this.applicantIndex];
                applicantData.steps.forEach((eachStep, index) => {
                    const applicantConstraints: ConstraintAggregates = eachStep.constraintAggregates;
                    const applicationConstraintValue: boolean = this.getConstraints(planData[0], this.planCartData, applicantConstraints);
                    if (!applicationConstraintValue) {
                        this.applicantStepIndex = index;
                    }
                });
                if (this.applicantStepIndex < 0) {
                    this.applicantIndex = null;
                }
            }
            this.getPlanCartData(dataValue, planData[0], requiredFormIndex);
        }
    }
    /**
     * function to create owner signature form
     * @returns void
     */
    createOwnerSignatureForm(): void {
        if (this.showPin && this.isOwnerSignature) {
            const callCenterPin = this.appFlowService.getcallCenterPin();
            this.ownerPinControl = new FormControl(null, [
                Validators.required,
                Validators.maxLength(this.MAX_SIGNATURE_LEN),
                Validators.minLength(this.MIN_PIN_SIGNATURE_LEN),
                Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
            ]);
            this.signatureForm.addControl(OWNER_PIN_CONTROL, this.ownerPinControl);
            if (callCenterPin && callCenterPin.length > 0) {
                this.signatureForm.get(OWNER_PIN_CONTROL).disable();
            }
        } else if (this.isHeadset && this.isOwnerSignature) {
            this.ownerSignature = new FormControl();
            this.signatureForm.addControl(OWNER_SIGNATURE, this.ownerSignature);
            this.signatureForm.controls.ownerSignature.disable();
        } else if (this.isOwnerSignature) {
            this.ownerSignature = new FormControl(null, [
                Validators.required,
                Validators.pattern(this.validationRegex.E_SIGNATURE),
                Validators.minLength(this.MIN_SIGNATURE_LEN),
            ]);
            this.signatureForm.addControl(OWNER_SIGNATURE, this.ownerSignature);
        }
    }
    /**
     * This method checks for constraints and skip the field based on the return value.
     * @param planData planData of plans that require signature
     * @param planCartData Cart Details for the articular plan
     * @param applicantConstraints constraints related to the plan
     * @returns boolean which represents whether constraint has to be skipped or not
     */
    getConstraints(planData: BasePlanApplicationPanel, planCartData: GetCartItems, applicantConstraints: ConstraintAggregates): boolean {
        const planObject: StepData = {
            application: planData,
        };
        return this.appFlowService.skipOnConstraints(applicantConstraints, this.planId, planObject, planCartData);
    }
    /**
     * gets cartData and planData for plans that require signature
     * @param dataValue application of plan
     * @param planData planData of plans that require signature
     * @param requiredFormIndex Index of the required form section
     */
    getPlanCartData(dataValue: Application, planData: BasePlanApplicationPanel, requiredFormIndex: number): void {
        this.reviewPlans.push({
            planId: dataValue.planId,
            planName: planData.planName,
            productName: planData.productName,
            cartId: planData.cartData.id,
            planOfferingId:
                planData.cartData.planOffering && planData.cartData.planOffering.id
                    ? planData.cartData.planOffering.id
                    : planData.cartData.planOfferingId,
            cost: planData.cartData.memberCost + this.ridersCost,
            carrierId: planData.carrierId,
        });
        this.listOfUnsignedForms = this.unsignedForms
            .filter((forms) => forms.applicationId === planData.appData.id)
            .map((formList) => formList.formNames)
            .pop();
        let finalCost: number = planData.cartData.memberCost + this.ridersCost;
        if (this.aflacBDApply && this.flexDollar && this.flexDollar.length) {
            const planFlexDollar = this.flexDollar.find((pd) => pd.cartItemId === dataValue.cartItemId);
            if (planFlexDollar) {
                this.isBDAvailable = true;
                finalCost =
                    finalCost > -planFlexDollar.flexDollarOrIncentiveAmount ? finalCost + planFlexDollar.flexDollarOrIncentiveAmount : 0;
            }
        }
        if (this.isVF2F) {
            this.constructVF2FDetails(dataValue, planData.cartData.id);
        }

        this.allData.push({
            planId: dataValue.planId,
            requiredForm: requiredFormIndex >= 0 ? dataValue.sections[requiredFormIndex] : null,
            applicant:
                this.applicantIndex !== null && this.applicantIndex >= 0
                    ? this.getApplicantSectionDetails(this.utilService.copy(dataValue))
                    : null,
            planName: planData.planName,
            productName: planData.productName,
            cartId: planData.cartData.id,
            cost: finalCost,
            enrollmentMethod: planData.cartData.enrollmentMethod,
            constraintsResponse: this.appFlowService.getResponseItemsByPlanId(dataValue.planId, planData.cartData),
            cartData: this.planCartData,
            unsignedForms: this.listOfUnsignedForms ? this.listOfUnsignedForms : null,
            planData: planData,
        });
        this.checkHospitalProductValidations();
        this.totalCostSign = this.totalCostSign + finalCost;
        this.isCostCalculated = true;
    }

    /**
     * Ensures required form fields are disabled until
     * "View application" is viewed.
     */
    private checkHospitalProductValidations(): void {
        if (this.isHospitalProduct) {
            this.allData = this.allData.map((data) => ({
                ...data,
                disableData: true,
            }));
        }
    }

    /**
     * It will construct detail for virtual face to face.
     * @param planDetail - Details of plan with application steps
     * @param cartId - Id of cart.
     */
    constructVF2FDetails(planDetail: Application, cartId: number): void {
        const vF2FStepDetail = planDetail.sections.filter((section) =>
            section.steps.some((step) => step.type === StepType.VERIFICATION_CODE),
        );
        const requiredDetail = {
            planId: planDetail.planId,
            cartId,
            vF2FStepDetail,
        };

        this.vF2FStepDetails.push(requiredDetail);
    }
    /**
     * gets cost and data of the plans that do not need signature
     * @param reviewPlanData planData of review plans
     * @param dataValue application data for the review plan
     */
    getReviewPlanData(reviewPlanData: BasePlanApplicationPanel, dataValue: Application): void {
        if (reviewPlanData?.cartData?.riders) {
            this.ridersCost = 0;
            reviewPlanData.cartData.riders.forEach((rCost) => {
                this.ridersCost = this.ridersCost + rCost.memberCost;
            });
        }
        this.showReview = true;
        let finalCost: number = reviewPlanData.cartData.memberCost + this.ridersCost;
        if (this.aflacBDApply && this.flexDollar && this.flexDollar.length) {
            const planFlexDollar = this.flexDollar.find((pd) => pd.cartItemId === dataValue.cartItemId);
            if (planFlexDollar) {
                finalCost =
                    finalCost > -planFlexDollar.flexDollarOrIncentiveAmount ? finalCost + planFlexDollar.flexDollarOrIncentiveAmount : 0;
            }
        }

        this.reviewData.push({
            planId: dataValue.planId,
            planName: reviewPlanData.planName,
            productName: reviewPlanData.productName,
            cost: finalCost,
            cartId: reviewPlanData.cartData.id,
            carrierId: reviewPlanData.carrierId,
            planOfferingId: reviewPlanData.cartData.planOffering
                ? reviewPlanData.cartData.planOffering.id
                : reviewPlanData.cartData.planOfferingId,
        });
        this.companyProvidedPlans.push({
            planId: dataValue.planId,
            planName: reviewPlanData.planName,
            productName: reviewPlanData.productName,
            cartId: reviewPlanData.cartData.id,
            cost: finalCost,
            carrierId: reviewPlanData.carrierId,
            planOfferingId: reviewPlanData.cartData.planOffering
                ? reviewPlanData.cartData.planOffering.id
                : reviewPlanData.cartData.planOfferingId,
        });
        this.allDataWithNoSigns.push({
            planId: dataValue.planId,
            requiredForm: null,
            applicant:
                this.applicantIndex !== null && this.applicantIndex >= 0
                    ? this.getApplicantSectionDetails(this.utilService.copy(dataValue))
                    : null,
            planName: reviewPlanData.planName,
            productName: reviewPlanData.productName,
            cartId: reviewPlanData.cartData.id,
            cost: reviewPlanData.cartData.memberCost + this.ridersCost,
            enrollmentMethod: reviewPlanData.cartData.enrollmentMethod,
            constraintsResponse: this.appFlowService.getResponseItemsByPlanId(dataValue.planId, reviewPlanData.cartData),
            cartData: this.planCartData,
            planData: reviewPlanData,
        });
        this.totalCostReview = this.totalCostReview + finalCost;
    }
    /**
     * Data required in confirmation screen
     */
    dataToConfirmation(): void {
        if (this.reviewPlans.length > 0) {
            this.appFlowService.planAndCart.next(this.reviewPlans);
        } else {
            this.appFlowService.planAndCart.next(null);
        }
        if (this.companyProvidedPlans.length > 0) {
            this.appFlowService.planAndCartReview.next(this.companyProvidedPlans);
        } else {
            this.appFlowService.planAndCartReview.next(null);
        }
    }
    /**
     *  To initialize the form for required forms and applicants
     * @returns void
     */
    createForm(): void {
        this.allData.forEach((data, idx) => {
            let index = -1;
            const formData = [];
            if (data.requiredForm !== null) {
                this.requiredStep = data.requiredForm.steps[0].question.options;
                this.isRequired = data.requiredForm.steps[0].question.required;
                if (this.isRequired) {
                    this.totalRequiredCount = this.totalRequiredCount + this.requiredStep.length;
                }
                const planObject: StepData = {
                    application: data.planData,
                };

                if (this.requiredStep !== undefined) {
                    this.requiredStep.forEach((item) => {
                        // condition to show preliminary form checkbox only if config for preliminary statement is on
                        if (item.value !== this.preliminaryNotice || this.showPreliminaryStatement) {
                            const constrainstValue =
                                item.constraints.length && data.constraintsResponse
                                    ? !this.appFlowService.checkAndOrConstraints(
                                          item.constraints,
                                          data.constraintsResponse,
                                          AppSettings.OR,
                                          data.cartData,
                                          planObject,
                                      )
                                    : true;
                            index++;
                            const itemCopy: Option = this.utilService.copy(item);
                            if (constrainstValue) {
                                const required = this.getRequiredOption(item, data.constraintsResponse, data.planData.appData.id);
                                itemCopy.required = required;
                                itemCopy.showOption = true;
                                this.signatureForm.addControl(
                                    this.constantFormValue + this.checkedForm + index,
                                    this.addControlGroup(required, false),
                                );
                                if (this.isHeadset) {
                                    this.signatureForm.controls[this.constantFormValue + this.checkedForm + index].disable();
                                }
                            } else {
                                itemCopy.required = false;
                                itemCopy.showOption = false;
                            }
                            if (itemCopy.value === this.preliminaryNotice) {
                                const preliminaryFormPathIndex = itemCopy.label.indexOf('"') + 1;
                                this.preliminaryForms.push({
                                    preliminaryFormPath: itemCopy.label.substring(
                                        preliminaryFormPathIndex,
                                        itemCopy.label.indexOf('"', preliminaryFormPathIndex),
                                    ),
                                    cartItemId: data.cartId,
                                });
                            }
                            formData.push(itemCopy);
                        }
                    });
                    this.requiredFormsConstraints.push(formData);
                    this.constantFormValue++;
                }
            } else {
                this.requiredFormsConstraints.push({ value: null });
                this.constantFormValue++;
            }

            if (data.applicant) {
                this.applicantStep = data.applicant.steps[0];
                if (this.applicantStep !== undefined) {
                    if (this.showPin) {
                        this.callCenterPin = this.appFlowService.getcallCenterPin();
                        if (this.callCenterPin && this.callCenterPin.length) {
                            this.pinDisableFlag = true;
                        }
                        this.signatureForm.addControl(
                            this.initials + idx,
                            this.fb.control(this.callCenterPin && this.callCenterPin.length > 0 ? this.callCenterPin : null, {
                                validators: [
                                    Validators.required,
                                    Validators.maxLength(25),
                                    Validators.minLength(3),
                                    Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                                ],
                            }),
                        );
                    } else if (this.isHeadset) {
                        this.signatureForm.addControl(this.initials + idx, new FormControl(null));
                        this.signatureForm.controls[this.initials + idx].disable();
                    } else {
                        this.signatureForm.addControl(
                            this.initials + idx,
                            new FormControl(null, [
                                Validators.required,
                                Validators.pattern(this.validationRegex.ALPHA),
                                Validators.minLength(2),
                            ]),
                        );
                    }
                }
            } else if (this.isVF2F) {
                this.addInitialReviewInitialFormControl(this.initials, idx);
            }
        });
        if (this.isVF2F && this.reviewData.length) {
            this.reviewData.forEach((data, idx) => {
                this.addInitialReviewInitialFormControl(this.REVIEW_INITIALS, idx);
            });
        }
    }
    /**
     * Method to set same PIN value during PIN signature enrollment
     * @param controlValue value entered
     * @param index application id
     */
    setPinSignature(controlValue: string, index?: number): void {
        if (controlValue && this.signatureForm && this.showPin && this.allData) {
            this.allData.forEach((data, idx) => {
                if (data.applicant && idx !== index && this.signatureForm.controls[this.initials + idx]) {
                    this.signatureForm.controls[this.initials + idx].patchValue(controlValue);
                }
            });
            this.signatureForm.controls.pinControl.patchValue(controlValue);
        }
    }
    /**
     *  To add form control with the specified name
     * @param controlName the name with which form control need to be added
     * @param index index for the form control
     * @returns void
     */
    addInitialReviewInitialFormControl(controlName: string, index: number): void {
        this.signatureForm.addControl(
            controlName + index,
            new FormControl(null, [
                Validators.required,
                Validators.pattern(this.validationRegex.ALPHA),
                Validators.minLength(this.MIN_SIGNATURE_LEN),
            ]),
        );
    }

    /**
     * Get the mandatory selection options for the application forms
     * @param item: question options
     * @param responses: constraints response
     * @param flowId: flowId of current flow
     * @returns boolean value, true when the option selection is mandatory
     */
    getRequiredOption(item: Option, responses: ResponsePanel[], flowId: number): boolean {
        let required = item.required;
        const aloneConstraints = item.requiredConstraint.filter((constraint) => constraint.aloneSatisfies);
        const andConstraints = item.requiredConstraint.filter((constraint) => !constraint.aloneSatisfies);
        if (aloneConstraints.length) {
            required = this.checkRequiredConstraints(aloneConstraints, responses, true, flowId);
        } else if (andConstraints.length) {
            required = !this.checkRequiredConstraints(andConstraints, responses, false, flowId);
        }
        return required;
    }

    /**
     * Check the required constraint value and determine if option is mandatory
     * @param constraints:
     * @param responses:
     * @param isAloneConstraint:
     * @param flowId: flowId of current flow
     * @returns boolean value based on the constraints check
     */
    checkRequiredConstraints(
        constraints: RequiredConstraint[],
        responses: ResponsePanel[],
        isAloneConstraint: boolean,
        flowId: number,
    ): boolean {
        let returnVal = false;
        for (const constraint of constraints) {
            let constraintCheck;
            if (constraint.questionId) {
                const answered = responses.filter((response) => response.planQuestionId === constraint.questionId);
                constraintCheck = this.checkConstraint(constraint, answered);
            } else if (constraint.requiredCondition === RequiredCondition.CONVERSION) {
                const storeConstraints = this.store.selectSnapshot(EnrollmentState.GetConstraint);
                if (storeConstraints?.length) {
                    const storeConstraint = storeConstraints.find((data) => data.flowId === flowId);
                    constraintCheck = storeConstraint && storeConstraint[AllConstraint.CONVERSION];
                }
            }
            if ((constraintCheck && isAloneConstraint) || (!constraintCheck && !isAloneConstraint)) {
                returnVal = true;
                break;
            }
        }
        return returnVal;
    }
    /**
     * checks constraint based on answered responses
     * @param constraint constraint data
     * @param answered answered data
     * @returns boolean whether constraint is pass or fail
     */
    checkConstraint(constraint: RequiredConstraint, answered: ResponsePanel[]): boolean {
        let returnVal = false;
        if (answered && answered.length && answered[0].value && answered[0].value.length) {
            returnVal =
                constraint.response === ""
                    ? answered[0].value[0] && (answered[0].value[0] as string).length >= 0
                    : (answered[0].value as string[]).indexOf(constraint.response.toLowerCase()) >= 0;
        }
        return returnVal;
    }

    /**
     * Save and update the response of forms and initials
     * @param eSignature applicant signature
     * @param ownerSignature owner signature
     * @returns void
     **/
    saveRequiredFormResponse(eSignature: string, ownerSignature?: string): void {
        if (this.isHeadset) {
            eSignature = this.customerSign;
        }
        const values = [];
        this.allData.forEach((data, index) => {
            this.formResponse = [];
            this.applicantResponse = [];
            if (data.requiredForm && data.applicant) {
                const dataValue = [];
                const initialValues = [];
                data.requiredForm.steps[0].question.options.forEach((option, idx) => {
                    const control = this.signatureForm.controls[index + this.checkedForm + idx];
                    if (control) {
                        const optionData: Option = this.requiredFormsConstraints[index][idx];
                        if (control.value !== null) {
                            dataValue.push(control.value);
                        } else if (this.isHeadset && optionData && optionData.required) {
                            dataValue.push(option.value);
                        }
                    }
                });
                this.formResponse.push({
                    stepId: data.requiredForm.steps[0].id,
                    value: dataValue,
                    key: data.requiredForm.steps[0].question.key,
                    type: ContraintsType.QUESTION,
                    planQuestionId: data.requiredForm.steps[0].question.id,
                });
                const applicantControl = this.signatureForm.controls[this.initials + index];
                if ((applicantControl && applicantControl.value !== null) || this.isHeadset) {
                    if (this.isHeadset) {
                        initialValues.push(this.customerInitial);
                    } else {
                        initialValues.push(applicantControl.value);
                    }
                    this.formResponse.push({
                        stepId: data.applicant.steps[0].id,
                        value: initialValues,
                        key: data.applicant.steps[0].question.key,
                        type: ContraintsType.QUESTION,
                        planQuestionId: data.applicant.steps[0].question.id,
                    });
                    values.push({
                        planId: data.planId,
                        cartId: data.cartId,
                        responses: this.formResponse,
                    });
                }
            } else if (data.requiredForm) {
                const dataValue = [];
                data.requiredForm.steps[0].question.options.forEach((option, idx) => {
                    const control = this.signatureForm.controls[index + this.checkedForm + idx];
                    if (control) {
                        const optionData: Option = this.requiredFormsConstraints[index][idx];
                        if (control.value !== null) {
                            dataValue.push(control.value);
                        } else if (this.isHeadset && optionData && optionData.required) {
                            dataValue.push(option.value);
                        }
                    }
                });
                this.formResponse.push({
                    stepId: data.requiredForm.steps[0].id,
                    value: dataValue,
                    key: data.requiredForm.steps[0].question.key,
                    type: ContraintsType.QUESTION,
                    planQuestionId: data.requiredForm.steps[0].question.id,
                });
                values.push({
                    planId: data.planId,
                    cartId: data.cartId,
                    responses: this.formResponse,
                });
            } else if (data.applicant) {
                const applicantControl = this.signatureForm.controls[this.initials + index];
                if ((applicantControl && applicantControl.value !== null) || this.isHeadset) {
                    const initialValues = [];
                    if (this.isHeadset) {
                        initialValues.push(this.customerInitial);
                    } else {
                        initialValues.push(applicantControl.value);
                    }
                    this.applicantResponse.push({
                        stepId: data.applicant.steps[0].id,
                        value: initialValues,
                        key: data.applicant.steps[0].question.key,
                        type: ContraintsType.QUESTION,
                        planQuestionId: data.applicant.steps[0].question.id,
                    });
                    values.push({
                        planId: data.planId,
                        cartId: data.cartId,
                        responses: this.applicantResponse,
                    });
                }
            }
        });

        const length = values.length;
        let count = 0;
        if (length === 0) {
            if (this.isOwnerSignature) {
                this.saveSignature(eSignature, ownerSignature);
            } else {
                this.saveSignature(eSignature);
            }
        } else {
            values.forEach((value) => {
                this.shoppingCartService
                    .saveApplicationResponse(this.memberId, value.cartId, this.mpGroup, value.responses)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.updatedResponse = this.store
                                .dispatch(new UpdateApplicationResponse(this.memberId, value.cartId, this.mpGroup))
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe(
                                    () => {
                                        count++;
                                        if (count >= length) {
                                            if (this.isOwnerSignature) {
                                                this.saveSignature(eSignature, ownerSignature);
                                            } else {
                                                this.saveSignature(eSignature);
                                            }
                                        }
                                    },
                                    () => {
                                        this.loadSpinner = false;
                                        this.showError = true;
                                        this.errorMessage = this.secondaryLanguageString["secondary.portal.common.errorUpdatingResponse"];
                                    },
                                );
                        },
                        () => {
                            this.loadSpinner = false;
                            this.showError = true;
                            this.errorMessage = this.secondaryLanguageString["secondary.portal.common.errorSavingTheResponse"];
                        },
                    );
            });
        }
    }

    /**
     * This method is used to get request body for signShoppingCartItem api.
     * @param signature signature of applicant
     * @param index index of cart item
     * @param isReviewDataPlan if the plan is a review data/no sign required plan
     * @returns the request body
     */
    getShoppingCartItemRequestBody(signature: Signature, index: number, isReviewDataPlan?: boolean): Signature {
        let requestBody = { ...signature };
        const controlName = isReviewDataPlan && this.reviewData.length && this.isVF2F ? this.REVIEW_INITIALS : this.initials;
        const initialsControl = this.signatureForm.controls[controlName + index];
        if (this.isVF2F && initialsControl && initialsControl.value) {
            requestBody = {
                ...signature,
                initials: initialsControl.value,
            };
        }
        return requestBody;
    }

    /**
     * Save the e-signature
     * @param eSignature applicant signature
     * @param ownerSignature owner signature
     * @returns void
     *  */
    saveSignature(eSignature: string, ownerSignature?: string): void {
        this.signatureApiCalls = [];
        this.enrollmentMethod = this.planObject.application.cartData.enrollmentMethod;
        const signature: Signature = ownerSignature
            ? {
                  signature: eSignature,
                  ownerSignature: ownerSignature,
              }
            : {
                  signature: eSignature,
              };
        if (this.planObject.reinstate) {
            this.signatureApiCalls.push(this.enrollmentService.signShoppingCartItem(this.memberId, this.mpGroup, signature, this.itemId));
        } else if (this.allData && this.allData.length) {
            this.allData.forEach((item, index) => {
                const requestBody = this.getShoppingCartItemRequestBody(signature, index);
                this.signatureApiCalls.push(
                    this.enrollmentService.signShoppingCartItem(this.memberId, this.mpGroup, requestBody, item.cartId),
                );
            });
        }
        if (this.allDataWithNoSigns && this.allDataWithNoSigns.length) {
            this.allDataWithNoSigns.forEach((item, index) => {
                const requestBody = this.getShoppingCartItemRequestBody(signature, index, true);
                this.signatureApiCalls.push(
                    this.enrollmentService.signShoppingCartItem(this.memberId, this.mpGroup, requestBody, item.cartId),
                );
            });
        }
        const declinedCartItems = this.allCartItems.filter(
            (cartItem) => cartItem.id && cartItem.coverageLevelId === this.declinedCoverageLevelId,
        );
        if (declinedCartItems && declinedCartItems.length > 0) {
            declinedCartItems.forEach((declinedCartItem) => {
                const isEnrolledCartItem = this.allDataWithNoSigns?.some((item) => item.cartId === declinedCartItem.id);
                if (!isEnrolledCartItem) {
                    this.signatureApiCalls.push(
                        this.enrollmentService.signShoppingCartItem(this.memberId, this.mpGroup, signature, declinedCartItem.id),
                    );
                }
            });
        }
        if (this.isHeadset) {
            this.showContact();
            this.loadSpinner = false;
        } else if (
            this.isEnrollmentSummaryReceiptEnabled &&
            !this.isDirect &&
            !this.isTpi &&
            this.enrollmentMethod !== EnrollmentMethod.SELF_SERVICE
        ) {
            this.showEnrollmentSummaryEmailModal();
            this.loadSpinner = false;
        } else {
            this.saveSignatureCalls(false);
        }
    }
    /**
     * saveSignature api calls are subscribed
     * @param sendRequest indicates whether we have to send Signature request to customer or not
     */
    saveSignatureCalls(sendRequest: boolean): void {
        const updatesAfterSignature: Observable<HttpResponse<unknown> | void>[] = [];
        if (!this.isDirect) {
            updatesAfterSignature.push(this.enrollmentService.sendSignedShoppingCartMessage(this.memberId, this.mpGroup));
        }
        if (sendRequest) {
            updatesAfterSignature.push(this.sendRequestToSign());
        }
        if (
            this.isHipaaEligible &&
            this.isHipaaAllowed &&
            !this.signatureForm.controls.hipaaConsent.disabled &&
            this.prevHipaaValue !== this.signatureForm.controls.hipaaConsent.value
        ) {
            updatesAfterSignature.push(
                this.enrollmentService
                    .updateHipaaConsentDetails(this.memberId, this.signatureForm.controls.hipaaConsent.value, this.mpGroup)
                    .pipe(
                        catchError(() => of(null)),
                        take(1),
                    ),
            );
        }
        concat(...this.signatureApiCalls, forkJoin(updatesAfterSignature))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {},
                (error) => this.handleSignatureError(error),
                () => this.goToNextScreen(),
            );
    }
    /**
     * This method handles the API error response messages to be displayed
     * @param err is the error which is received from the API
     */
    handleSignatureError(err: Error): void {
        const errorResponse = err[this.ERROR];
        this.loadSpinner = false;
        this.showError = true;
        if (errorResponse && errorResponse.status === ClientErrorResponseCode.RESP_400) {
            this.errorMessage = this.isVF2F
                ? errorResponse.message
                : this.secondaryLanguageString["secondary.portal.common.errorSendingRequestSignature"];
        } else if (errorResponse && errorResponse.status === ClientErrorResponseCode.RESP_403) {
            this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.cannotSubmitApplication"];
        } else {
            this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.errorSignature"];
        }
    }
    /**
     * sends signature request to customer
     * @returns observable for requestShoppingCartSignature api
     */
    sendRequestToSign(): Observable<HttpResponse<unknown>> {
        const requestData =
            this.requestSignData[0].contacts.type === this.email
                ? { email: this.requestSignData[0].contacts.contact }
                : { phoneNumber: this.requestSignData[0].contacts.contact };

        return this.shoppingCartService
            .requestShoppingCartSignature(this.mpGroup, this.memberId, requestData, PendingReasonForPdaCompletion.ENROLLMENT)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(
                    () => {
                        this.appFlowService.requestForSignatureSent$.next(requestData);
                    },
                    () => {
                        this.loadSpinner = false;
                        this.showError = true;
                        this.errorMessage = this.secondaryLanguageString["secondary.portal.common.errorSendingRequestSignature"];
                    },
                ),
            );
    }

    /**
     * @description Determines whether the current account is an EBS account.
     * EBS is a payment gateway that is used to process payments for the application.
     *
     * @private
     * @return {boolean} True if the account is an EBS account, false otherwise.
     */
    private get isEBSAccount(): boolean {
        return this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }

    /**
     * @description Navigates to the next screen in the application flow.
     *
     * If the planObject has the "reinstate" property set to true, it triggers the reinstateLastCompleteStaticStep event
     * with the calculated step index and returns.
     *
     * If the isEBSAccount property in the EnrollmentState store snapshot is true, it triggers the lastCompleteStaticStep
     * event with the calculated step index for EBS account and returns.
     *
     * Otherwise, it triggers the lastCompleteStaticStep event with the calculated step index for non-EBS account.
     *
     * Finally, it triggers the planChanged event with the nextClicked flag set to true and discard flag set to false.
     *
     * @returns {void}
     */
    goToNextScreen(): void {
        this.loadSpinner = false;
        if (this.planObject.reinstate) {
            this.appFlowService.reinstateLastCompleteStaticStep$.next(2 + this.preliminaryStepIndex);
        } else {
            const isEBSAccount = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
            if (isEBSAccount) {
                this.appFlowService.lastCompleteStaticStep.next(4 + this.preliminaryStepIndex);
            } else {
                this.appFlowService.lastCompleteStaticStep.next(3 + this.preliminaryStepIndex);
            }
            this.appFlowService.planChanged$.next({
                nextClicked: true,
                discard: false,
            });
        }
    }

    /**
     * @description Opens the enrollment summary email modal and watches for the modal to be closed.
     * @private
     * @return {void}
     */
    showEnrollmentSummaryEmailModal(): void {
        this.sendEnrollmentSummaryEmailModalService.open(this.contactList, SendEnrollmentSummaryEmailModalComponent);
        this.watchForEnrollmentSummaryModalAfterClosedEvent();
    }

    /**
     * @description Watches for the "afterClosed" event of the enrollment summary modal.
     * @private
     * @returns {void}
     */
    private watchForEnrollmentSummaryModalAfterClosedEvent(): void {
        this.sendEnrollmentSummaryEmailModalService.afterClosed$
            .pipe(
                take(1),
                filter(
                    (response: SendEnrollmentSummaryEmailModalResponseData): boolean =>
                        response !== undefined && response.action !== SendEnrollmentSummaryEmailModalAction.CLOSE,
                ),
            )
            .subscribe((): void => {
                this.loadSpinner = true;
                this.saveSignatureCalls(false);
            });
    }

    /**
     * Executes after closing the Send Enrollment Summary Email Modal.
     *
     * @private
     * @returns {void}
     */
    // private onAfterCloseSendEnrollmentSummaryEmailModal(): void {
    //     this.saveSignatureCalls(false);
    //     // if (this.isEBSAccount) {
    //     //     this.appFlowService.nextLastCompleteEBSAccountStaticStep(this.preliminaryStepIndex);
    //     // } else {
    //     //     this.appFlowService.nextLastCompleteStaticStep(this.preliminaryStepIndex);
    //     // }

    //     // this.appFlowService.nextPlanChanged();
    // }

    // Add multiple form controls in required forms
    addControlGroup(required: boolean, value: string | boolean): FormControl {
        return required ? this.fb.control(value, Validators.required) : this.fb.control(value);
    }

    openPrivacyNote(): void {
        window.open(this.privacyPracticesNoticeLink);
    }
    /**
     * backToReview() : To go back to viewing option
     */
    backToReview(): void {
        this.appFlowService.showNextProductFooter$.next({
            nextClick: false,
            data: null,
        });
        this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: NEXT_SIGNATURE });
        this.showReviewForm = true;
        this.showSignatureForm = false;
        this.showError = false;
        this.goToTop();
    }
    /**
     * check for plans which are mandate to be viewed
     * @returns boolean value from isButtonCLicked based on policySeries
     */
    checkPolicySeries(): boolean {
        const A71value = this.reviewRequiredPolicySeriesRegex.split(",")[0].split("=")[1];
        const VSNvalue = this.reviewRequiredPolicySeriesRegex.split(",")[1].split("=")[1];
        const regexA71 = new RegExp(A71value);
        const regexVSN = new RegExp(VSNvalue);
        const allPlansDetails: GetPlan[] = this.store.selectSnapshot(EnrollmentState.GetAllPlans);
        this.policySeries = allPlansDetails
            .filter((storePlan) => storePlan.name && this.allData.some((plan) => plan.planId === storePlan.id))
            .map((storePlan) => storePlan.policySeries);
        if (this.policySeries.length > 0) {
            this.allData.forEach((item) => {
                const planDetails = allPlansDetails.find((plan) => plan.id === item.planId);
                if (
                    planDetails &&
                    planDetails.policySeries &&
                    (regexA71.test(planDetails.policySeries) || regexVSN.test(planDetails.policySeries))
                ) {
                    this.isButtonClicked.push(true);
                    item.disableData = true;
                } else {
                    this.isButtonClicked.push(false);
                    item.disableData = false;
                }
            });
        }
        if (this.isButtonClicked.length > 0 && this.isButtonClicked.every((x) => x === true)) {
            return true;
        }
        return false;
    }

    /**
     * Checks for mandatory to view plans
     * @returns  false if all plans in cart is mandatory to view application PDF else true
     */
    checkForMandatoryToViewPlans(): boolean {
        const [A71value, VSNvalue] = this.reviewRequiredPolicySeriesRegex.split(",");
        const regexA71 = new RegExp(A71value.split("=")[1]);
        const regexVSN = new RegExp(VSNvalue.split("=")[1]);
        const allPlansDetails: GetPlan[] = this.store.selectSnapshot(EnrollmentState.GetAllPlans);
        this.planDetailsList = allPlansDetails;
        this.isHospitalProduct = this.planDetailsList.some(
            (item) => item?.product?.name === this.hospitalProductName && item?.product?.id === 3,
        );
        let count = 0;
        allPlansDetails.forEach((plan) => {
            if (
                regexA71.test(plan.policySeries) ||
                regexVSN.test(plan.policySeries) ||
                this.isHospitalProduct ||
                this.enrollmentState === this.reviewRequiredStates
            ) {
                this.viewMandatoryIds.push(plan.id.toString());
                count++;
            }
        });
        return count !== allPlansDetails.length;
    }

    /**
     * This method notifies side nav regarding upcoming step.
     * It also enables the next step.
     * @param nextStepIndex index of next step.
     * @returns void
     */
    gotoNextSubStep(nextStepIndex: number): void {
        this.appFlowService.emitVf2fStep(nextStepIndex);
    }

    /**
     * This method enables next step based on current step index.
     * @param currentStepIndex index of current step.
     * @returns void
     */
    enableNextStep(currentStepIndex: number): void {
        this.showReviewForm = false;
        this.isOtpRequired = false;
        this.hasOtp = false;
        this.showSignatureForm = false;
        switch (currentStepIndex) {
            case REVIEW_OPTION:
                this.showReviewForm = true;
                break;
            case SEND_OTP:
                this.isOtpRequired = true;
                break;
            case VERIFY_OTP:
                this.hasOtp = true;
                break;
            case SIGN_APP:
                this.constructSignatureFormData();
                break;
        }
    }

    /** *
     * reviewOnNext() To go to Sign Application page.
     * conditions have been written based on the user selection (I do / I do not).
     */
    reviewOnNext(): void {
        if (this.reviewApplicationForm.valid) {
            this.isButtonClicked = [];
            this.reviewApplicationOption = this.reviewApplicationForm.controls.reviewApplication.value;
            this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: EnrollmentMethod.FACE_TO_FACE });
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: BACK_TO_REVIEW,
            });
            this.showReviewForm = false;
            if (this.isVF2F && !this.isReinstate) {
                this.enableNextStep(SEND_OTP);
                this.appFlowService.emitVf2fStep(SEND_OTP);
            } else {
                this.enableNextStep(SIGN_APP);
            }
        } else {
            this.hasError = true;
        }
    }

    /**
     * It constructs required data for signature form
     * @returns void
     */
    constructSignatureFormData(): void {
        this.showSignatureForm = true;
        this.goToTop();
        if (this.reviewApplicationOption === "Yes" || this.enrollmentState === this.reviewRequiredStates) {
            this.disableTillViewPDF = true;
            this.reviewNotRequiredStatus = false;
            this.viewSomeReview = false;
            this.allData.forEach(() => {
                this.isButtonClicked.push(true);
            });
            this.allData = this.allData.map((data) => ({
                ...data,
                disableData: true,
            }));
        } else {
            this.disableTillViewPDF = false;
            this.checkPolicySeries();
            this.reviewNotRequiredStatus = this.isButtonClicked.every((x) => !x);
            this.viewSomeReview = this.isButtonClicked.some((x) => x);
        }
        if (this.reviewApplicationOption === "No") {
            this.allData = this.allData.map((plan, idx) => {
                if (this.viewMandatoryIds.includes(plan.planId + "")) {
                    plan.disableData = true;
                    this.isButtonClicked[idx] = true;
                }
                return plan;
            });
            this.someApplicationReviewRequired = this.isButtonClicked.some((buttonClick) => buttonClick);
        }
    }

    /**
     * To check whether review of PDF is completed or not and set error messages
     * @returns boolean - If review is done or not
     */
    checkReviewApplicationCompleted(): boolean {
        const pdfNotViewedIndex = this.isButtonClicked.findIndex((x) => x === true);

        if (pdfNotViewedIndex > -1) {
            this.showError = true;
            if (this.someApplicationReviewRequired) {
                this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.reviewSome"];
            } else {
                this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.reviewALL"];
            }
            return false;
        }
        this.showError = false;
        return true;
    }
    /**
     * @description This will check validation as well as if there are review plans and company provided plans then call saveSignature(),
     * pass form response to saveRequiredFormResponse()
     * @returns void
     */
    onNext(): void {
        this.checkboxValidation();
        let reviewCompleted = true;
        this.loadSpinner = true;
        reviewCompleted = this.checkReviewApplicationCompleted();
        if (reviewCompleted) {
            // method to check invalid fields and focus to first invalid field
            this.checkInvalidFieldsAndFocus();
            let eSignature;
            // For review plans and company provided plans
            if (this.reviewPlans.length === 0 && this.companyProvidedPlans.length > 0) {
                if (this.planObject.reinstate) {
                    this.appFlowService.reinstateLastCompleteStaticStep$.next(2 + this.preliminaryStepIndex);
                } else {
                    this.saveSignature("confirmed");
                }
            } else if (this.showPin && this.signatureForm.valid) {
                this.loadSpinner = true;
                this.pinControl = this.signatureForm.controls.pinControl.value;
                if (this.isOwnerSignature) {
                    this.ownerPinControlResp = this.signatureForm.controls.ownerPinControl.value;
                    this.saveRequiredFormResponse(this.pinControl, this.ownerPinControlResp);
                } else {
                    this.saveRequiredFormResponse(this.pinControl);
                }
                this.appFlowService.changePlanDetails(
                    JSON.parse(
                        JSON.stringify({
                            pin: this.signatureForm.controls.pinControl.value,
                            date: this.currentDate,
                            signature: this.firstName + " " + this.lastName,
                        }),
                    ),
                );
            } else if (!this.showPin && this.signatureForm.valid && this.signatureForm.controls.privacyNote.value) {
                this.requiredFormError = false;
                this.privacyNoteError = false;
                eSignature = this.signatureForm.controls.signature.value.trim();
                if (this.isOwnerSignature) {
                    this.ownerSignatureResp = this.signatureForm.controls.ownerSignature.value;
                    this.saveRequiredFormResponse(eSignature, this.ownerSignatureResp);
                } else {
                    this.saveRequiredFormResponse(eSignature);
                }
                this.loadSpinner = true;
            } else if (!this.showPin && this.isHeadset && this.signatureForm.valid) {
                this.requiredFormError = false;
                this.privacyNoteError = false;
                if (this.isOwnerSignature) {
                    this.ownerSignatureResp = this.signatureForm.controls.ownerSignature.value;
                    this.saveRequiredFormResponse(this.customerSign, this.ownerSignatureResp);
                } else {
                    this.saveRequiredFormResponse(this.customerSign);
                }
                this.loadSpinner = true;
            } else {
                this.loadSpinner = false;
                this.requiredFormError = true;
                this.showAllErrors();
            }
        } else {
            this.loadSpinner = false;
            this.goToTop();
            this.requiredFormError = true;
            this.showAllErrors();
        }
    }

    checkboxValidation(): void {
        let checkedForms;
        if (this.signatureForm) {
            checkedForms = Object.keys(this.signatureForm.controls).filter(
                (controlName) => controlName.indexOf(this.checkedForm) >= 0 || controlName.indexOf(this.privacyNote) >= 0,
            );
        }
        if (checkedForms && checkedForms.length) {
            checkedForms.forEach((controlName) => {
                if (!this.signatureForm.controls[controlName].value) {
                    this.signatureForm.controls[controlName].patchValue(null);
                }
            });
        }
    }
    showAllErrors(): void {
        if (this.signatureForm.controls.privacyNote.value) {
            this.privacyNoteError = false;
        } else {
            this.privacyNoteError = true;
        }
    }

    updateError(value: any): void {
        this.signatureForm.controls[this.privacyNote].patchValue(value.checked ? value.checked : null);
        if (value.checked) {
            this.privacyNoteError = false;
        } else {
            this.privacyNoteError = true;
        }
    }
    pathCustomValueToForm(value: string, control: string, a: string): void {
        const controlName = a + this.checkedForm + control;
        if (this.signatureForm.controls[controlName].value) {
            this.signatureForm.controls[controlName].patchValue(value);
            this.requiredCount++;
        } else {
            this.signatureForm.controls[controlName].patchValue(null);
        }
        if (this.requiredCount === this.totalRequiredCount || this.signatureForm.valid) {
            this.requiredFormError = false;
        }
    }
    /**
     * skip signature request to customer and sends signature
     */
    skipAndSend(): void {
        this.dialogRef.close();
        this.loadSpinner = true;
        this.saveSignatureCalls(false);
    }
    /**
     * sends signature request to customer and sends signature
     */
    sendToCustomer(): void {
        if (this.contactForm.value) {
            this.requestSignData.push(this.contactForm.value);
        }
        this.loadSpinner = true;
        this.dialogRef.close();
        this.saveSignatureCalls(true);
    }

    /**
     * This method is used to display member contacts after submitting
     * the applications during headset enrollment flow
     *
     * This method is used to set the list of member contacts to be displayed and
     * will pre-select the primary contact, if any
     */
    showContact(): void {
        this.contactForm = this.fb.group({});
        this.contactList = [];
        this.requestSignData = [];
        let selectedValue;
        if (this.emailContacts.length) {
            this.emailContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact.email,
                    disableField: false,
                    type: this.email,
                    primary: contact.primary,
                });
            });
            const primaryEmail: MemberContactListDisplay[] = this.contactList.filter((eachContact) => eachContact.primary);
            selectedValue = primaryEmail.length ? primaryEmail[0] : this.contactList[0];
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.noemailaddress"],
                disableField: true,
            });
        }
        if (this.textContacts.length) {
            this.textContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact,
                    disableField: false,
                    type: this.phoneNumber,
                    formatted: this.utilService.formatPhoneNumber(contact),
                });
            });
            if (!selectedValue) {
                selectedValue = this.contactList[1];
            }
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.nomobile"],
                disableField: true,
            });
        }
        const savedContact = this.contactList.filter((contact) => contact.type).pop();
        if (savedContact) {
            this.hasMemberContact = true;
        }
        this.contactForm.addControl("contacts", this.addControlGroup(false, selectedValue));
        this.dialogRef = this.matDialog.open(this.contactModal);
    }

    addContactInfo(): void {
        this.dialogRef.close();
        let url;
        if (this.isDirect) {
            url = `${this.routeAfterLogin}/${this.mpGroup}/member/${this.memberId}/memberadd/`;
        } else {
            url = `${this.routeAfterLogin}/direct/customers/${this.mpGroup}/${this.memberId}/memberadd/`;
        }
        this.router.navigate([url]);
    }

    goToTop(): void {
        this.oneSignatureSection.nativeElement.scrollIntoView();
    }
    // This method is used to check all invalid fields in signatureForm and focuses to first invalid field
    checkInvalidFieldsAndFocus(): void {
        if (this.signatureForm.invalid) {
            const invalidControl = this.signatureFormRef.nativeElement.querySelector(".ng-invalid");
            if (invalidControl) {
                invalidControl.querySelector("input").focus();
            }
        }
    }
    /**
     * This method is used to get applicant section details based on applicant constraint aggregate values
     * @param applicationDetail is the application
     * @returns applicant section details based on applicant constraint aggregate values
     */
    getApplicantSectionDetails(applicationDetail: Application): Section {
        return {
            ...applicationDetail.sections[this.applicantIndex],
            steps: [applicationDetail.sections[this.applicantIndex].steps[this.applicantStepIndex]],
        };
    }

    /**
     * open HIPAA consent form in new tab and update member list array
     * @param event click event
     */
    openConsentForm(event: Event): void {
        event.preventDefault();
        window.open(this.consentLinkHipaa);
        if (!this.memberList.includes(this.userName)) {
            this.memberList.push(this.userName);
        }
        this.appFlowService.updateHipaaConsentCheckbox(this.memberList);
    }
    /**
     * method to fetch hipaa consent preference from aflac system
     */
    fetchHipaaDetails(): void {
        this.enrollmentService
            .getHipaaConsentDetails(this.memberId, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.signatureForm.controls.hipaaConsent.patchValue(result);
                this.isHipaaChecked = this.prevHipaaValue = result;
            });
    }
    /**
     * Method to capture the Hipaa checkbox value
     * @param event - matCheckbox event
     */
    changeHipaaValue(event: MatCheckbox): void {
        this.isHipaaChecked = event.checked;
    }

    /**
     * Downloads preliminary form
     * @param index of the form selected
     * @returns false to avoid default behavior of anchor tag
     */
    downloadPreliminaryForm(index: number): boolean {
        // downloadPreliminaryForm api is called
        this.ngrxStore.dispatch(
            EnrollmentsActions.downloadPreliminaryForm({
                memberId: this.memberId,
                preliminaryFormPath: this.preliminaryForms[index].preliminaryFormPath,
                cartItemId: this.preliminaryForms[index].cartItemId,
                mpGroupId: this.mpGroup,
            }),
        );
        // gets the downloadPreliminaryForm api response from the store
        this.ngrxStore
            .onAsyncValue(
                select(
                    EnrollmentsSelectors.getDownloadPreliminaryFormResponse(
                        this.memberId,
                        this.preliminaryForms[index].preliminaryFormPath,
                        this.preliminaryForms[index].cartItemId,
                        this.mpGroup,
                    ),
                ),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                // opens the preliminary form pdf in new window
                window.open(response, "_blank");
            });
        return false;
    }
    /**
     * Destroy Life cycle hook of component.
     * It resets the Vf2f step also.
     * It is used to clear the subscriptions
     */
    ngOnDestroy(): void {
        this.appFlowService.emitVf2fStep(REVIEW_OPTION);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * This method opens a consent statement modal
     * @returns void.
     */
    openModal(): void {
        this.empoweredSheetService.openSheet(ConsentStatementComponent);
    }
}
