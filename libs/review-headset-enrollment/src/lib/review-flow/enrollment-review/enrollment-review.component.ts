import { ReviewFlowService, StepTitle } from "./../services/review-flow.service";
import { Component, OnInit, Input, OnDestroy, HostListener } from "@angular/core";
import { FormBuilder, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { EnrollmentService, MemberService, AccountService, CoreService, PendingEnrollmentReason, Carrier } from "@empowered/api";
import { forkJoin, Subject, Observable, of, EMPTY } from "rxjs";
import { EnrollmentDetailsComponent } from "../enrollment-details/enrollment-details.component";
import { LanguageService } from "@empowered/language";
import { EBSInfoModalComponent, OpenToast, ToastModel } from "@empowered/ui";
import { catchError, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
    ConfigName,
    ProductId,
    PayFrequency,
    AppSettings,
    CarrierId,
    Product,
    Enrollments,
    MemberDependent,
    Accounts,
    RoutingNumberModel,
    EbsPaymentRecord,
    EbsPaymentFileEnrollment,
    EbsPaymentFile,
    ToastType,
    GroupAttributeEnum,
    GroupAttribute,
    ContactType,
} from "@empowered/constants";
import {
    AddMemberInfo,
    AppFlowService,
    CheckForm,
    SetRegex,
    SharedState,
    SharedStateModel,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { UserState } from "@empowered/user";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDialogRef } from "@angular/material/dialog";
import { EmpoweredModalService } from "@empowered/common-services";
import { ReviewAflacAlwaysModalData } from "libs/api/src/lib/services/member/models/review-aflac-always-modal.data";

const TOAST_DURATION = 5000;

@Component({
    selector: "empowered-enrollment-review",
    templateUrl: "./enrollment-review.component.html",
    styleUrls: ["./enrollment-review.component.scss"],
})
export class EnrollmentReviewComponent implements OnInit, OnDestroy {
    secondFormGroup: FormGroup;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isBDAvailable = false;
    memberId: any;
    groupId: any;
    isLoading: boolean;
    enrollments: Enrollments[] = [];
    memberDetails: any;
    payFrequencies: PayFrequency[] = [];
    memberDependents: MemberDependent[] = [];
    allProductDetails: Product[] = [];
    enrollmentsListData: any[] = [];
    accountDetails: Accounts;
    appSettings = AppSettings;
    cardContent: SafeHtml;
    cardInfo = new Map<number, { cardType: string; cardExpirationYear: number; cardExpirationMonth: number; cardLastFour: string }>();
    bankDraftInfo = new Map<
    number,
    { accountName: string; bankName: string; routingNumber: string; accountNumber: string; accountType: string }
    >();
    showCardInfo = false;
    consentContent: SafeHtml;
    MASK_FIRST_EIGHT = "********";
    paymentDetails: RoutingNumberModel[] = [];
    ebsPayment: EbsPaymentFile;
    isEBSIndicator$: Observable<boolean>;
    ESIGNATURE_MAX_LENGTH = 200;
    ESIGNATURE_MIN_LENGTH = 3;
    paymentPresent: boolean;
    dialogRef: MatDialogRef<EBSInfoModalComponent>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.acknowledgetype",
        "primary.portal.enrollment.review.acknowledge",
        "primary.portal.enrollment.review.agent",
        "primary.portal.enrollment.review.agree",
        "primary.portal.applicationFlow.payments.cardType.masterCard",
        "primary.portal.applicationFlow.payments.cardType.americanExpress",
        "primary.portal.applicationFlow.payments.cardType.Visa",
        "primary.portal.enrollment.review.anotherdocument",
        "primary.portal.enrollment.review.application",
        "primary.portal.enrollment.review.approvepda",
        "primary.portal.enrollment.review.birthdate",
        "primary.portal.enrollment.review.business",
        "primary.portal.enrollment.review.byemailat",
        "primary.portal.enrollment.review.calling",
        "primary.portal.common.close",
        "primary.portal.enrollment.review.complete",
        "primary.portal.enrollment.review.completebtn",
        "primary.portal.enrollment.review.confirmation",
        "primary.portal.enrollment.review.confirmidentiy",
        "primary.portal.enrollment.review.consent",
        "primary.portal.enrollment.review.document",
        "primary.portal.enrollment.review.e-signaturev",
        "primary.portal.enrollment.review.edit",
        "primary.portal.enrollment.review.email",
        "primary.portal.enrollment.review.enrollment",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.firstname",
        "primary.portal.enrollment.review.initial",
        "primary.portal.enrollment.review.lastname",
        "primary.portal.enrollment.review.monthly",
        "primary.portal.common.next",
        "primary.portal.enrollment.review.payroll",
        "primary.portal.enrollment.review.question",
        "primary.portal.enrollment.review.reject",
        "primary.portal.enrollment.review.review",
        "primary.portal.enrollment.review.reviewandsign",
        "primary.portal.enrollment.review.reviewcomplete",
        "primary.portal.enrollment.review.reviewinfo",
        "primary.portal.enrollment.review.reviewpda",
        "primary.portal.enrollment.review.reviewplan",
        "primary.portal.enrollment.review.signature",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.signaturefinish",
        "primary.portal.enrollment.review.signout",
        "primary.portal.enrollment.review.submittedsignature",
        "primary.portal.enrollment.review.summary",
        "primary.portal.common.submit",
        "primary.portal.enrollment.review.verify",
        "primary.portal.enrollment.review.verifyidentity",
        "primary.portal.enrollment.review.yourtotalcost",
        "primary.portal.pda.form.viewunsignedpda",
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.coverage.taxstatu",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.shoppingExperience.eliminationPeriod",
        "primary.portal.productExceptions.planName",
        "primary.portal.createReportForm.pda",
        "primary.portal.review.reject",
        "primary.portal.review.technicalHelp",
        "primary.portal.review.reviewSignature",
        "primary.portal.review.Completed",
        "primary.portal.review.Rejected",
        "primary.portal.review.signature.required",
        "primary.portal.common.requiredField",
        "primary.portal.enrollment.review.ebs.ebsprovide",
        "primary.portal.enrollment.review.ebs.ebsInfo",
        "primary.portal.applicationFlow.iacknowledge",
        "primary.portal.applicationFlow.privacyNote",
        "primary.portal.common.selectionRequired",
        "primary.portal.benefitDollars.payment.message",
        "primary.portal.applicationFlow.hipaa.viewPdf",
        "primary.portal.applicationFlow.hipaa.unCheck",
        "primary.portal.applicationFlow.hipaa.optOut",
        "primary.portal.applicationFlow.hipaa.optIn",
        "primary.portal.applicationFlow.hipaa.info",
        "primary.portal.applicationFlow.hipaa.heading",
        "primary.portal.applicationFlow.hipaa.check",
        "primary.portal.applicationFlow.signature.maxLength",
        "primary.portal.applicationFlow.ebs.successfulMsg",
        "primary.portal.applicationFlow.ebs.errorMsg",
        "primary.portal.enrollment.review.completeaflacalwaysonly",
        "primary.portal.enrollment.review.reviewAflacAlwaysSelections",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.pattern.signature",
    ]);
    validationRegex: any;
    errorResponse = false;
    errorMessage: string;
    approvedOrRejectedEnrolls: any[] = [];
    totalCost = 0;
    formName = "enrollment-review-form";
    DECIMAL_PLACES = 2;
    payFrequency: any;
    dependentRelations: any[] = [];
    @Input() userDetails: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    continue = false;
    isHipaaEligible = true;
    isHipaaConsentRead = false;
    memberList: string[] = [];
    consentLinkHipaa: string;
    ebsConfigEnabled: boolean;
    userName: string;
    isHipaaChecked = false;
    isHipaaAllowed = false;
    prevHipaaValue = false;
    carriers: Carrier[] = [];
    aflacCarrierId: number = CarrierId.AFLAC;
    isAflacPlanPresent: boolean;
    toastRequired: boolean;
    isEnrolled = false;
    reviewAflacAlwaysOnly = false;
    reviewSubheader: string;
    reviewAflacAlwaysStatus: string;
    reviewAflacAlwaysInitial: string;
    paymentData: ReviewAflacAlwaysModalData[];
    rejectedEnrollmentIds: number[] = [];
    aflacAlwaysEnrolmentIds: number[] = [];

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly enrollmentService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
        private readonly coreService: CoreService,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly modalService: EmpoweredModalService,
        private readonly domSanitizer: DomSanitizer,
        private readonly appFlowService: AppFlowService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.ALLOW_USER_FOR_HIPAA_CONSENT)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isHipaaAllowed = result;
            });
    }

    /**
     * @description Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.memberId = this.userDetails?.memberId;
        this.staticUtilService
            .cacheConfigValue(ConfigName.HIPAA_CONSENT_SHARE_POINT_LINK)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((consentLinkHipaa) => (this.consentLinkHipaa = consentLinkHipaa));
        this.staticUtilService
            .fetchConfigs([ConfigName.EBS_PAYMENT_FEATURE_ENABLE], this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => (this.ebsConfigEnabled = this.staticUtilService.isConfigEnabled(res[0])));
        this.groupId = this.userDetails?.groupId;
        if (this.groupId && this.memberId) {
            // fetching member contact info to get carriers list w.r.t. to employee residence state
            // for displaying carrier legal name
            this.memberService
                .getMemberContact(this.memberId, ContactType.HOME, this.groupId)
                .pipe(
                    switchMap((memberContactData) => this.coreService.getCarriers(memberContactData?.body?.address?.state)),
                    tap((carriersData) => (this.carriers = carriersData)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
        this.isEBSIndicator$ = this.accountService.getGroupAttributesByName([GroupAttributeEnum.EBS_INDICATOR], +this.groupId).pipe(
            takeUntil(this.unsubscribe$),
            map((ebsIndicator: GroupAttribute[]) => ebsIndicator[0].value === "true"),
        );
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.member.singlePayment.signerAgreement.content"],
        );
        this.secondFormGroup = this.formBuilder.group({
            signature: [],
            privacyNote: [],
            hipaaConsent: [false],
        });
        if (this.userDetails && this.userDetails?.guid) {
            this.store
                .dispatch(new SetRegex())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.loadForm();
                });
        } else {
            this.loadForm();
        }
        const memberData = this.store.selectSnapshot(UserState);
        this.userName = memberData.username;
        this.disableHipaaConsent();
        this.memberService
            .getPaymentMethodsForAflacAlways(this.memberId, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (data.length > 0) {
                    this.isEnrolled = true;
                    this.paymentData = data;
                    this.paymentData.forEach((element) =>
                        element.enrolledPlans.forEach((plan) => this.aflacAlwaysEnrolmentIds.push(plan.enrollmentId)),
                    );
                }
            });
        this.appFlowService
            .getReviewAflacAlwaysInitial()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((initial) => {
                if (initial) {
                    this.reviewAflacAlwaysInitial = initial;
                }
            });
        this.appFlowService
            .getReviewAflacAlwaysStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((status) => {
                if (status) {
                    this.reviewAflacAlwaysStatus = status;
                    this.enableFormControlsOnSuccess();
                }
            });
    }

    /**
     * Method to disable the hipaa consent checkbox until terms and condition is read
     */
    disableHipaaConsent(): void {
        this.appFlowService.readHipaaConsentForm.pipe(takeUntil(this.unsubscribe$)).subscribe((isRead) => {
            this.memberList = isRead;
            if (this.memberList.includes(this.userName) && this.secondFormGroup) {
                this.secondFormGroup.controls.hipaaConsent.enable();
            } else {
                this.secondFormGroup.controls.hipaaConsent.disable();
            }
        });
    }
    /**
     * Method to invoke AFlac EBS
     */
    gotoAflacEBS(): void {
        // There is no operation on dialog close, if EBS payment is successful, the callback lands on payment step
        this.dialogRef = this.empoweredModalService.openDialog(EBSInfoModalComponent, {
            data: {
                isFromNonEnrollmentFlow: false,
                mpGroup: this.groupId?.toString(),
                memberId: this.memberId,
            },
        });
        this.dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dialogParams) => {
                if (dialogParams?.fromContEbs) {
                    this.toastRequired = true;
                    this.updateEBSPaymentToAllEnrollments(this.toastRequired);
                }
            });
    }
    /**
     * Methods to open toast
     * @param message
     * @param type
     * @param duration
     */
    openToast(message: string, type: ToastType, duration?: number): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: duration,
        };
        this.store.dispatch(new OpenToast(toastData));
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
     * method to fetch the Hipaa consent details
     */
    fetchHipaaDetails(): void {
        this.enrollmentService
            .getHipaaConsentDetails(this.memberId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.secondFormGroup.controls.hipaaConsent.patchValue(result);
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
     * @description This function will load second form group and set validators to controls
     * @return void
     */
    loadForm(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (data) => {
                if (data) {
                    this.validationRegex = data.E_SIGNATURE;
                    this.secondFormGroup = this.formBuilder.group(
                        {
                            signature: [
                                "",
                                [Validators.required, Validators.pattern(new RegExp(this.validationRegex)), Validators.minLength(2)],
                            ],
                            privacyNote: [
                                false,
                                [
                                    Validators.required,
                                    // Custom validator to ensure checkbox is checked
                                    (control: AbstractControl): { [key: string]: any } | null =>
                                        control.value ? null : { required: "Requires checked" },
                                ],
                            ],
                            hipaaConsent: [false],
                        },
                        { updateOn: "submit" },
                    );
                    this.secondFormGroup.controls.privacyNote.disable();
                    this.secondFormGroup.controls.signature.disable();
                }
                if (this.isHipaaEligible && this.isHipaaAllowed) {
                    this.disableHipaaConsent();
                    this.fetchHipaaDetails();
                }
                if (this.memberId && this.groupId) {
                    this.serviceCalls();
                }
            },
            () => {
                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.review.regexErrorMsg");
                this.errorResponse = true;
                this.isLoading = false;
            },
        );
    }

    /**
     * Method to make all API calls
     */
    serviceCalls(): void {
        this.enrollmentsListData = [];
        this.approvedOrRejectedEnrolls = [];
        forkJoin([
            this.enrollmentService.getEnrollments(this.memberId, this.groupId),
            this.memberService.getMember(this.memberId, true, this.groupId),
            this.accountService.getPayFrequencies(this.groupId),
            this.memberService.getMemberDependents(this.memberId, true, this.groupId),
            this.coreService.getProducts(),
            this.accountService.getDependentRelations(this.groupId),
            this.memberService.getPaymentMethods(this.memberId, this.groupId),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(
                    ([enrollments, memberDetails, payFrequency, dependents, allProductDetails, dependentReelations, paymentDetails]) => {
                        this.enrollments = enrollments;
                        this.memberDetails = memberDetails.body;
                        this.payFrequencies = payFrequency;
                        this.memberDependents = dependents;
                        this.allProductDetails = allProductDetails;
                        this.dependentRelations = dependentReelations;
                        this.paymentDetails = paymentDetails;
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: this.memberDetails,
                                activeMemberId: this.memberId,
                                mpGroupId: this.groupId?.toString(),
                            }),
                        );
                    },
                    () => {},
                    () => {
                        const enrollmentDetails = [];
                        const enrollmentDetailsForOnlyAflacAlways = [];
                        this.enrollments.forEach((enroll) => {
                            if (enroll.pendingReason) {
                                if (
                                    enroll.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE &&
                                    enroll.subscriberApprovalRequiredByDate &&
                                    this.utilService.isPastDate(enroll.subscriberApprovalRequiredByDate)
                                ) {
                                    enrollmentDetails.push(enroll);
                                    enrollmentDetailsForOnlyAflacAlways.push(enroll);
                                } else if (!("subscriberApprovalRequiredByDate" in enroll)) {
                                    enrollmentDetailsForOnlyAflacAlways.push(enroll);
                                }
                            }
                        });
                        this.reviewAflacAlwaysOnly = enrollmentDetails.length === 0;
                        this.reviewSubheader = this.reviewAflacAlwaysOnly
                            ? this.languageStrings["primary.portal.enrollment.review.completeaflacalwaysonly"]
                            : this.languageStrings["primary.portal.enrollment.review.complete"];
                        this.setEnrollmentData(enrollmentDetails);
                        this.setPaymentsData();
                        if (enrollmentDetails.length > 0) {
                            this.checkHipaa(enrollmentDetails);
                            this.updateEBSPaymentToAllEnrollments();
                        } else {
                            this.checkHipaa(enrollmentDetailsForOnlyAflacAlways);
                            this.isLoading = false;
                        }
                    },
                ),
            )
            .subscribe();
    }

    /**
     * Method to update ebs payment to all enrollments
     * @param toastRequired
     */
    updateEBSPaymentToAllEnrollments(toastRequired?: boolean): void {
        this.memberService
            .getEbsPaymentOnFile(this.memberId, this.groupId)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    this.paymentPresent = res.CREDIT_CARD_PRESENT || res.DIRECT_DEPOSIT || res.BANK_INFORMATION_PRESENT;
                    const enrollIds = this.enrollmentsListData
                        .filter((e) => e.enrollmentData.plan?.carrierId === CarrierId.AFLAC)
                        .map((e) => e.enrollmentData.id);
                    const ebsPmt: EbsPaymentFileEnrollment = {
                        enrollmentIds: enrollIds,
                        ebsPaymentOnFile: (Object.keys(res) as unknown)[0],
                    };
                    this.enrollmentsListData.forEach((enroll) => {
                        if (enroll.enrollmentData.plan.carrierId === CarrierId.AFLAC) {
                            enroll.enrollmentData = { ...enroll.enrollmentData, ebsPaymentOnFile: res };
                        }
                    });
                    if (toastRequired) {
                        if (this.paymentPresent) {
                            this.openToast(
                                this.languageStrings["primary.portal.applicationFlow.ebs.successfulMsg"],
                                ToastType.SUCCESS,
                                TOAST_DURATION,
                            );
                        } else {
                            this.openToast(
                                this.languageStrings["primary.portal.applicationFlow.ebs.errorMsg"],
                                ToastType.DANGER,
                                TOAST_DURATION,
                            );
                        }
                        this.toastRequired = false;
                    }
                    return this.enrollmentsService.updateEbsPaymentOnFile(this.memberId, this.groupId, ebsPmt);
                }),
                catchError(() => {
                    this.paymentPresent = false;
                    if (toastRequired) {
                        this.openToast(
                            this.languageStrings["primary.portal.applicationFlow.ebs.errorMsg"],
                            ToastType.DANGER,
                            TOAST_DURATION,
                        );
                        this.toastRequired = false;
                    }
                    return EMPTY;
                }),
            )
            .subscribe();
    }

    /**
     * This function will set enrollmentData in enrollmentListData to display enrollment details on UI
     */
    setEnrollmentData(enrollmentDetails: any[]): void {
        enrollmentDetails.forEach((eachEnrollment) => {
            forkJoin([
                this.enrollmentService.getEnrollmentDependents(this.memberId, eachEnrollment.id, this.groupId),
                this.enrollmentService.getEnrollmentRiders(this.memberId, eachEnrollment.id, this.groupId),
                this.enrollmentService.getEnrollmentBeneficiaries(this.memberId, eachEnrollment.id, this.groupId),
            ])
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap(
                        (res) => {
                            let payFrequency, product;
                            this.payFrequencies.forEach((eachPayFrequency) => {
                                if (eachPayFrequency.id === this.memberDetails.workInformation.payrollFrequencyId) {
                                    payFrequency = eachPayFrequency;
                                }
                            });
                            this.allProductDetails.forEach((eachProduct) => {
                                if (eachProduct.id === eachEnrollment.plan.productId) {
                                    product = eachProduct;
                                }
                            });
                            res[1].forEach((rider) => {
                                eachEnrollment.totalCost += rider.totalCost;
                                eachEnrollment.memberCostPerPayPeriod += rider.memberCostPerPayPeriod;
                            });
                            if (eachEnrollment.totalCostPerPayPeriod > eachEnrollment.memberCostPerPayPeriod) {
                                this.isBDAvailable = true;
                            }
                            this.totalCost = this.totalCost + eachEnrollment.memberCostPerPayPeriod;
                            this.payFrequency = payFrequency.name;

                            const carrierLegalName = this.carriers?.find(
                                (carrier) => carrier.id === eachEnrollment?.plan?.carrierId,
                            )?.legalName;

                            this.enrollmentsListData.push({
                                enrollmentData: eachEnrollment,
                                payFrequency: payFrequency,
                                productDetails: product,
                                enrollmentDependents: res[0],
                                enrollmentRiders: res[1],
                                enrollmentBeneficiaries: res[2],
                                status: undefined,
                                memberDetails: this.memberDetails,
                                memberDependents: this.memberDependents,
                                existingEnrollment: null,
                                legalName: carrierLegalName,
                            });
                        },
                        () => {},
                        () => {
                            this.fetchMemberDeps(enrollmentDetails);
                            this.isLoading = false;
                        },
                    ),
                )
                .subscribe(() => {
                    this.isAflacPlanPresent = this.enrollmentsListData.find(
                        (enrollment) => enrollment.enrollmentData?.plan?.carrierId === CarrierId.AFLAC,
                    );
                    this.enrollmentsListData.sort(
                        (a, b) =>
                            (a.enrollmentData.plan.productId < b.enrollmentData.plan.productId ? -1 : 1) ||
                            (a.enrollmentData.plan.id < b.enrollmentData.plan.id ? -1 : 1),
                    );
                });
        });
    }

    /**
     * Method to check HIPAA eligible
     * @param enrollmentDetails
     */
    checkHipaa(enrollmentDetails: any[]): void {
        this.isHipaaEligible = !(
            enrollmentDetails.filter(
                (data) => data.plan.productId === ProductId.JUVENILE_TERM_LIFE || data.plan.productId === ProductId.JUVENILE_WHOLE_LIFE,
            ).length === enrollmentDetails.length ||
            enrollmentDetails.filter((data) => data.carrierId === CarrierId.AFLAC_GROUP).length === enrollmentDetails.length
        );
    }

    /**
     * Method to fetch member dependents for each enrollment
     * @param enrollmentDetails
     */
    private fetchMemberDeps(enrollmentDetails: any[]): void {
        if (this.enrollmentsListData.length === enrollmentDetails.length) {
            const dependentObservable: Observable<MemberDependent>[] = [];
            this.enrollmentsListData.forEach((data) => {
                data.enrollmentDependents.forEach((item) => {
                    dependentObservable.push(this.memberService.getMemberDependent(this.memberId, item.dependentId, false, this.groupId));
                });
                forkJoin(dependentObservable)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((result) => {
                        data.enrollmentDependents.forEach((item, index) => {
                            if (item.dependentId === result[index].id) {
                                const relationship = this.dependentRelations.find((ele) => ele.id === result[index].dependentRelationId);
                                item.relationType = relationship.name;
                            }
                        });
                    });
            });
        }
    }

    /**
     * This function will set payment details in Credit/Debit card info and bankDraftInfo to display payment details on UI
     */
    setPaymentsData(): void {
        this.reviewFlowService.setPaymentInfo(this.paymentDetails);
    }
    /**
     * @description This function will open enrollment details modal
     * @param enrollment selected enrollment details
     * @returns void
     */
    openEnrollmentDetails(enrollment: any): void {
        const existingEnroll = this.approvedOrRejectedEnrolls.filter((enroll) => enroll.enrollmentId === enrollment.enrollmentData.id);
        if (existingEnroll.length) {
            enrollment.existingEnrollment = existingEnroll[0];
        }
        enrollment.userDetails = this.userDetails;
        enrollment.otherAflacEnrollIds = this.enrollmentsListData
            .filter((e) => e.enrollmentData.plan?.carrierId === CarrierId.AFLAC)
            .map((e) => e.enrollmentData.id);
        enrollment.isAflac =
            enrollment.enrollmentData && enrollment.enrollmentData.plan && enrollment.enrollmentData.plan.carrierId === CarrierId.AFLAC;
        const enrollmentDialogRef = this.modalService.openDialog(EnrollmentDetailsComponent, {
            panelClass: "enrollment-detail",
            data: enrollment,
        });
        enrollmentDialogRef.componentInstance.isEbsDetailsFlow.pipe(takeUntil(this.unsubscribe$)).subscribe((dialogParams) => {
            if (dialogParams?.fromContEbs) {
                this.updateEBSPaymentToAllEnrollments();
            }
        });
        enrollmentDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response) {
                    this.errorResponse = false;
                    const index = this.approvedOrRejectedEnrolls.findIndex((enroll) => enroll.enrollmentId === response.enrollmentId);
                    if (index !== -1) {
                        this.approvedOrRejectedEnrolls[index] = response;
                        this.approvedOrRejectedEnrolls[index].ebsPaymentOnFile = (Object.keys(response.ebsPaymentOnFile) as unknown)[0];
                    } else {
                        this.approvedOrRejectedEnrolls.push(response);
                    }
                    this.totalCost = 0;
                    this.enrollmentsListData.forEach((enroll) => {
                        if (enroll.enrollmentData.id === response.enrollmentId && enroll.status !== response.verificationAction) {
                            enroll.status = response.verificationAction;
                            if (enroll.status === AppSettings.REJECTSTATUS) {
                                this.rejectedEnrollmentIds.push(enroll.enrollmentData.id);
                            } else {
                                this.rejectedEnrollmentIds = this.rejectedEnrollmentIds.filter((e) => e !== enroll.enrollmentData.id);
                            }
                        }
                        if (enroll.status !== AppSettings.REJECTSTATUS) {
                            this.totalCost += enroll.enrollmentData.memberCostPerPayPeriod;
                        }
                    });
                }
                this.enableFormControlsOnSuccess();
            });
    }

    /**
     * Enable form controls on success
     */
    enableFormControlsOnSuccess(): void {
        const approvedOrRejectedEnrollments = this.enrollmentsListData.filter((eachEnroll) => !!eachEnroll.status);
        this.appFlowService.setReevaluateReviewAflacAlways(this.isActivateAACardReview());
        if (
            approvedOrRejectedEnrollments.length === this.enrollmentsListData.length &&
            (!this.isActivateAACardReview() || (this.isEnrolled ? this.reviewAflacAlwaysStatus : true))
        ) {
            this.secondFormGroup.controls.signature.enable();
            this.secondFormGroup.controls.privacyNote.enable();
            this.continue = true;
            this.secondFormGroup.controls.privacyNote.setErrors(null);
            this.secondFormGroup.controls.signature.setErrors(null);
        } else {
            this.secondFormGroup.controls.signature.disable();
            this.secondFormGroup.controls.privacyNote.disable();
            this.continue = false;
        }
    }

    isActivateAACardReview(): boolean {
        return this.aflacAlwaysEnrolmentIds.filter((enrollmentId) => this.rejectedEnrollmentIds.indexOf(enrollmentId) < 0).length > 0;
    }

    /**
     * Validate and submit the signed enrollment application
     */
    saveEnrollmentSignatures(): void {
        this.setValidatorsOnBlur();
        this.store.dispatch(new CheckForm(this.formName));
        const approvedOrRejectedEnrollments = this.enrollmentsListData.filter((eachEnroll) => eachEnroll.status !== undefined);
        if (this.secondFormGroup.invalid) {
            const signControl: AbstractControl = this.secondFormGroup.controls.signature;
            if (signControl.hasError("pattern") && signControl.value !== signControl.value.trim()) {
                signControl.setValue(signControl.value.trim());
                signControl.updateValueAndValidity();
            }
        }
        if (this.secondFormGroup.valid && approvedOrRejectedEnrollments.length !== this.enrollmentsListData.length) {
            this.errorResponse = true;
            this.errorMessage = this.languageStrings["primary.portal.review.reject"];
        } else if (this.secondFormGroup.valid && approvedOrRejectedEnrollments.length) {
            this.errorResponse = false;
        }
        this.approvedOrRejectedEnrolls.forEach((enroll) => {
            if (enroll.ebsPaymentOnFile && typeof enroll.ebsPaymentOnFile !== "string") {
                enroll.ebsPaymentOnFile = (Object.keys(enroll.ebsPaymentOnFile) as unknown)[0];
            }
        });
        if (this.secondFormGroup.valid && !this.errorResponse) {
            this.isLoading = true;
            let aflacAlwaysReviewPayload = null;
            if (this.isEnrolled && this.isActivateAACardReview()) {
                const enrollmentIds = this.aflacAlwaysEnrolmentIds.filter(
                    (enrollmentId) => this.rejectedEnrollmentIds.indexOf(enrollmentId) < 0,
                );
                aflacAlwaysReviewPayload = {
                    enrollmentIds: enrollmentIds,
                    verificationAction: this.reviewAflacAlwaysStatus,
                    initial: this.reviewAflacAlwaysInitial,
                };
            }

            const payload = {
                signature: this.secondFormGroup.controls.signature.value,
                enrollmentReviews: this.approvedOrRejectedEnrolls,
                aflacAlwaysReview: aflacAlwaysReviewPayload,
            };
            this.isHipaaChecked = this.secondFormGroup.controls.hipaaConsent.value;
            this.enrollmentService
                .approveOrRejectPendingEnrollments(this.memberId, this.groupId, payload)
                .pipe(
                    switchMap(() =>
                        this.isHipaaEligible &&
                        this.isHipaaAllowed &&
                        !this.secondFormGroup.controls.hipaaConsent.disabled &&
                        this.prevHipaaValue !== this.isHipaaChecked
                            ? this.enrollmentService.updateHipaaConsentDetails(this.memberId, this.isHipaaChecked)
                            : of(null),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        this.reviewFlowService.stepChanged$.next(StepTitle.REVIEW_SIGN);
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        }
    }

    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event: any): boolean {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    /**
     * @description This function will open privacy practices notice link in new tab
     * @return void
     */
    openPrivacyNote(): void {
        this.staticUtilService
            .cacheConfigValue("privacy_practices_notice_link")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((privacyPracticesNoticeLink) => {
                window.open(privacyPracticesNoticeLink);
            });
    }
    /**
     * @description This function adds validation on controls
     */
    setValidatorsOnBlur(): void {
        this.secondFormGroup.controls.signature.setValidators([
            Validators.required,
            Validators.pattern(this.validationRegex),
            Validators.minLength(this.ESIGNATURE_MIN_LENGTH),
            Validators.maxLength(this.ESIGNATURE_MAX_LENGTH),
        ]);
        this.secondFormGroup.controls.privacyNote.setValidators([
            Validators.required,
            (control: AbstractControl): { [key: string]: unknown } | null => (control.value ? null : { required: "Requires checked" }),
        ]);
        this.secondFormGroup.controls.signature.updateValueAndValidity();
        this.secondFormGroup.controls.privacyNote.updateValueAndValidity();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
