import { Component, OnInit, Inject, ViewChild, OnDestroy, ElementRef, EventEmitter } from "@angular/core";
import { EnrollmentService, StaticService, AdminContact, MemberService, SystemFlowCode, AccountService } from "@empowered/api";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { FormBuilder, Validators } from "@angular/forms";
import { MonDialogComponent, EBSInfoModalComponent } from "@empowered/ui";
import { CheckForm, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { SafeResourceUrl, DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { forkJoin, Subject, Observable, combineLatest, iif, EMPTY, of } from "rxjs";
import { catchError, map, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { HttpErrorResponse } from "@angular/common/http";
import "../../../../../ui/src/lib/assets/js/prefs_aflac_eic.js";
import { ReviewFlowService } from "../../review-flow/services/review-flow.service";
import {
    ConfigName,
    AppSettings,
    CarrierId,
    RoutingNumberModel,
    EbsPaymentRecord,
    GroupAttributeEnum,
    GroupAttribute,
    EbsPaymentFileEnrollment,
    PRELIMINARY_NOTICE,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { MatCheckboxChange } from "@angular/material/checkbox";

export const IS_IDV = "general.feature.identity_verification.enable";
export const IS_PAYROLL_HEADSET_IDV = "portal.member.identity_verification.approve.enrollment.enable";
const DEBIT_CARD = "DEBIT_CARD";
const CREDIT_CARD = "CREDIT_CARD";
const LAST_DIGITS_OF_ACCOUNT = 4;
const TRUE_VALUE = "TRUE";
const MASTER_CARD = "MASTERCARD";
const AMERICAN_EXPRESS = "AMERICANEXPRESS";

/**
 * aflac_eic is referring to third party service reference so I marked it as any.
 */
declare let aflac_eic: any;

@Component({
    selector: "empowered-enrollment-details",
    templateUrl: "./enrollment-details.component.html",
    styleUrls: ["./enrollment-details.component.scss"],
})
export class EnrollmentDetailsComponent implements OnInit, OnDestroy {
    @ViewChild("unsignedTemplate", { static: true }) unSignedModal;
    @ViewChild("userPrefs") userPrefs2: ElementRef;
    @ViewChild("aflac_eic_prefs") aflacEicPrefs: ElementRef;
    private readonly unsubscribe$ = new Subject<void>();
    userPreference: string;
    isIDV: boolean;
    memberId: any;
    groupId: any;
    enrollmentDocuments: any[];
    paymentDetails: RoutingNumberModel[] = [];
    hasAflacAlways = false;
    isLoading: boolean;
    consentContent: SafeHtml;
    showCardInfo: boolean;
    showBankDraftInfo: boolean;
    showSignerAgreement = true;
    formName = "enrollment-details-form";
    enrollmentDetailForm: any;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    MASK_FIRST_EIGHT = "********";
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    cardContent: SafeHtml;
    aflacCarrierId: number = CarrierId.AFLAC;
    cardInfo = new Map<number, { cardType: string; cardExpirationMonth: number; cardExpirationYear: number; cardLastFour: string }>();
    bankDraftInfo = new Map<
        number,
        { accountName: string; bankName: string; routingNumber: string; accountNumber: string; accountType: string }
    >();
    aflacEicPreference: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.reviewinfo",
        "primary.portal.enrollment.review.reject",
        "primary.portal.maintenanceBenefitsOffering.products.planName",
        "primary.portal.shoppingExperience.benefitAmount",
        "primary.portal.benefitsOffering.coverageDates",
        "primary.portal.shoppingExperience.eliminationPeriod",
        "primary.portal.applicationFlow.payments.cardType.masterCard",
        "primary.portal.applicationFlow.payments.cardType.americanExpress",
        "primary.portal.applicationFlow.payments.cardType.Visa",
        "primary.portal.coverage.taxstatus",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.enrollment.review.application",
        "primary.portal.enrollment.review.document",
        "primary.portal.enrollment.review.anotherdocument",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.coverage.estate",
        "primary.portal.coverage.charity",
        "primary.portal.coverage.posttax",
        "primary.portal.coverage.pretax",
        "primary.portal.coverage.unknown",
        "primary.portal.common.iAgree",
        "primary.portal.headset.subtitle",
        "primary.portal.enrollment.review.consent",
        "primary.portal.enrollment.review.initial",
        "primary.portal.review.signature.required",
        "primary.portal.common.cancel",
        "primary.portal.common.approve",
        "primary.portal.common.reject",
        "primary.portal.common.close",
        "primary.portal.review.question",
        "primary.portal.review.advice",
        "primary.portal.review.byemail",
        "primary.portal.review.calling",
        "primary.portal.review.time",
        "primary.portal.enrollment.applicationNeedsReview",
        "primary.portal.enrollment.begins",
        "primary.portal.applicationFlow.viewApplication",
        "primary.portal.applicationFlow.viewApplication.required",
        "primary.portal.expandedShoppingCart.employerContribution",
        "primary.portal.accounts.accountList.accountNameColumn",
        "primary.portal.applicationFlow.payments.bankLabel",
        "primary.portal.applicationFlow.payments.routingNumber",
        "primary.portal.accounts.accountList.accountIdColumn",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.transferToDirect.accountType",
        "primary.portal.applicationFlow.cardNumber",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.transferToDirect.cardType",
        "primary.portal.applicationFlow.payments.expirationDate",
        "primary.portal.member.multiplePayment.signerAgreement.content",
        "primary.portal.applicationFlow.ebs.aflacEbs",
        "primary.portal.applicationFlow.ebs.viewPmtInfo",
        "primary.portal.applicationFlow.ebs.billing",
        "primary.portal.applicationFlow.ebs.warningMsg",
        "primary.portal.applicationFlow.preliminaryStatement1",
        "primary.portal.applicationFlow.preliminaryViewError",
        "primary.portal.applicationFlow.preliminaryAcknowledge",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.invalidFormat",
    ]);
    validationRegex: any;
    memberFullName: string;
    safeUrl: SafeResourceUrl;
    dialogRef;
    isDocumentLoading: boolean;
    adminContact: AdminContact;
    appSettings = AppSettings;
    @Select(SharedState.regex) regex$: Observable<any>;
    rejectAlert: boolean;
    isApplicationViewed = false;
    showAlert = false;
    showPaymentAlert = false;
    isPayrollHeadsetIDV: boolean;
    hasApplication: boolean;
    htmlContentViewer: SafeHtml;
    isEBSPaymentConfigEnabled$: Observable<boolean>;
    ebsPayment$: Observable<boolean>;
    ebsPaymentPresent: boolean;
    successPaylogix: boolean;
    isEBSIndicator$: Observable<boolean>;
    ebsPaymentFailed = false;
    ebsPaymentOnFile: EbsPaymentRecord;
    currentPage = "enrollment-details";
    isEbsDetailsFlow = new EventEmitter();
    ebsDialog: MatDialogRef<EBSInfoModalComponent>;
    showPrelimCheck: boolean;
    preliminaryData: any;
    disablePrelimCheckbox = true;
    prelimCheckStatus: boolean;
    prelimCheckForm = this.formBuilder.group({ prelimCheckForm: ["", Validators.required] });
    viewFormRequired: boolean;
    showAcknowledgementError: boolean;

    constructor(
        private readonly enrollmentService: EnrollmentService,
        @Inject(MAT_DIALOG_DATA) readonly enrollment: any,
        private readonly language: LanguageService,
        private readonly enrollmentDetailDialogRef: MatDialogRef<EnrollmentDetailsComponent>,
        private readonly formBuilder: FormBuilder,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly sanitizer: DomSanitizer,
        private readonly store: Store,
        private readonly staticService: StaticService,
        private readonly staticUtilService: StaticUtilService,
        private readonly memberService: MemberService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly enrollmentsService: EnrollmentService,
    ) {}

    /**
     * This method will be called during initialization of the component.
     * @returns void
     */
    ngOnInit(): void {
        this.isLoading = true;
        // Defaulting to false for Aflac Carrier and true for every other carriers
        this.ebsPaymentPresent = this.enrollment.enrollmentData.plan.carrierId !== CarrierId.AFLAC;
        this.getConfig();
        if (this.enrollment.flexDollars) {
            this.enrollment.flexDollars.flexDollarOrIncentiveName = this.enrollment.flexDollars.flexDollarOrIncentiveName
                .toLowerCase()
                .includes(this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"].toLowerCase())
                ? this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"]
                : this.enrollment.flexDollars.flexDollarOrIncentiveName;
        }
        this.paymentDetails = this.reviewFlowService.paymentDetails;
        this.consentContent = this.sanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.member.multiplePayment.signerAgreement.content"],
        );
        this.memberId = this.enrollment.userDetails.memberId;
        this.groupId = this.enrollment.userDetails.groupId;
        this.memberFullName = this.enrollment.memberDetails.name.firstName + " " + this.enrollment.memberDetails.name.lastName;
        if (this.enrollment.enrollmentData.plan.carrierId === CarrierId.AFLAC) {
            this.getEbsInfo();
        }
        if (this.memberId && this.groupId) {
            this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe(
                (data) => {
                    if (data) {
                        this.validationRegex = data.ALPHA;
                        this.enrollmentDetailForm = this.formBuilder.group({
                            initial: [
                                "",
                                [Validators.required, Validators.pattern(new RegExp(this.validationRegex)), Validators.minLength(2)],
                            ],
                        });
                        this.checkApplicationStatus();
                    }
                    this.getDocuments();
                },
                () => {},
            );
        }
    }

    /**
     * Its used to check the application status and depends on that application is there or need to view
     * @returns void
     */
    checkApplicationStatus(): void {
        if ([CarrierId.AFLAC, CarrierId.ADV].includes(this.enrollment.enrollmentData.plan.carrierId)) {
            this.enrollmentDetailForm.controls.initial.disable();
            this.hasApplication = true;
        } else {
            this.isApplicationViewed = true;
        }
    }
    /**
     * This method will fetch the config values to verify IDV.
     * @returns void
     */
    getConfig(): void {
        combineLatest(
            this.staticUtilService.cacheConfigValue(IS_IDV),
            this.staticUtilService.cacheConfigValue(IS_PAYROLL_HEADSET_IDV),
            this.staticService.getConfigurations(ConfigName.AUTHORIZATION_AGREEMENT, this.groupId),
        )
            .pipe(takeUntil(this.unsubscribe$.asObservable()))
            .subscribe(([isIdentityVerification, isPayrollHeadsetIdentityVerification, showSignerAgreement]) => {
                this.isIDV = isIdentityVerification && isIdentityVerification.toLowerCase() === AppSettings.TRUE;
                this.isPayrollHeadsetIDV =
                    isPayrollHeadsetIdentityVerification && isPayrollHeadsetIdentityVerification.toLowerCase() === AppSettings.TRUE;
                if (this.isIDV && this.isPayrollHeadsetIDV) {
                    aflac_eic.initiate(null);
                }
                this.showSignerAgreement = showSignerAgreement[0].value === TRUE_VALUE;
                this.setPaymentInfo();
            });
    }
    /**
     * function to get documents of the plan
     * @returns void
     */
    getDocuments(): void {
        this.enrollmentDocuments = [];
        forkJoin([
            this.enrollmentService.getHeadsetAdminContact(this.memberId, this.enrollment.enrollmentData.id, this.groupId),
            this.enrollmentService.getEnrolledPlanDocuments(this.memberId, this.groupId, this.enrollment.enrollmentData.id),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.adminContact = res[0];
                const documents = this.filterPreliminaryNotice(res[1]);
                if (documents.length) {
                    documents.forEach((document) => {
                        if (document.documentLink.indexOf("</a>") >= 0) {
                            document["isAnchorTag"] = true;
                        } else if (document.documentLink.indexOf(".pdf") >= 0 || document.documentLink.indexOf("https") >= 0) {
                            document["isPdf"] = true;
                        } else {
                            document["isPlainText"] = true;
                        }
                    });
                    this.enrollmentDocuments = documents;
                }
                this.isLoading = false;
            });
    }

    /**
     * @param response api response from getEnrolledPlanDocuments
     * @returns documentName
     */

    filterPreliminaryNotice(response: any[]): any[] {
        if (response && response.length) {
            const index = response.findIndex((value) => value.documentName === PRELIMINARY_NOTICE);
            if (index !== -1) {
                this.preliminaryData = response[index];
                response.splice(index, 1);
                this.showPrelimCheck = true;
            } else {
                this.showPrelimCheck = false;
            }
        }
        return response;
    }

    /**
     * This method is invoked on click of prelim hyperlink
     * API call is invoked to download the BLOB
     */

    onPrelimNoticeClick(): void {
        this.viewFormRequired = false;
        const pdfCharCount = 4;
        const formIndexStart = this.preliminaryData?.documentLink?.indexOf("/");
        const formIndexEnd = this.preliminaryData?.documentLink?.indexOf(".pdf");
        // documentLink being returned here contains checkbox text and path, only the path is needed to invoke download API
        // the number 4 indicates to include .pdf chars as part of the path
        // this will be updated once API starts sending only path
        const preliminaryFormPath = this.preliminaryData?.documentLink?.substring(formIndexStart, formIndexEnd + pdfCharCount);
        this.enrollmentService
            .downloadPreliminaryForm(this.memberId, preliminaryFormPath, undefined, undefined, this.enrollment.enrollmentData.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response: BlobPart) => {
                this.disablePrelimCheckbox = false;
                const unSignedBlob = new Blob([response], { type: "application/pdf" });
                const unSignedFileURL = window.URL.createObjectURL(unSignedBlob);
                window.open(unSignedFileURL, "_blank");
            });
    }

    /**
     * This function will set payment details in Credit/Debit card info and bankDraftInfo to display payment details on UI
     */
    setPaymentInfo(): void {
        if (this.paymentDetails.length > 0 && this.enrollment.enrollmentData.paymentInformation) {
            this.hasAflacAlways = this.enrollment.enrollmentData.paymentInformation.aflacAlways;
            for (const payment of this.paymentDetails) {
                if (
                    this.enrollment.enrollmentData.paymentInformation.paymentType === CREDIT_CARD ||
                    this.enrollment.enrollmentData.paymentInformation.paymentType === DEBIT_CARD
                ) {
                    this.showCardInfo = true;
                    if (
                        payment.paymentType === this.enrollment.enrollmentData.paymentInformation.paymentType &&
                        payment.lastFour === this.enrollment.enrollmentData.paymentInformation.lastFour
                    ) {
                        if (payment.type === MASTER_CARD) {
                            this.cardContent = this.sanitizer.bypassSecurityTrustHtml(
                                this.languageStrings["primary.portal.applicationFlow.payments.cardType.masterCard"],
                            );
                        } else if (payment.type === AMERICAN_EXPRESS) {
                            this.cardContent = this.sanitizer.bypassSecurityTrustHtml(
                                this.languageStrings["primary.portal.applicationFlow.payments.cardType.americanExpress"],
                            );
                        } else {
                            this.cardContent = this.sanitizer.bypassSecurityTrustHtml(
                                this.languageStrings["primary.portal.applicationFlow.payments.cardType.Visa"],
                            );
                        }
                        this.cardInfo.set(0, {
                            cardType: payment.type,
                            cardExpirationMonth: payment.expirationMonth,
                            cardExpirationYear: payment.expirationYear,
                            cardLastFour: this.enrollment.enrollmentData.paymentInformation.lastFour,
                        });
                    }
                } else {
                    this.showCardInfo = false;
                    if (
                        payment.paymentType === this.enrollment.enrollmentData.paymentInformation.paymentType &&
                        payment.accountNumberLastFour === this.enrollment.enrollmentData.paymentInformation.lastFour
                    ) {
                        this.bankDraftInfo.set(0, {
                            bankName: payment.bankName,
                            accountName: payment.accountName,
                            accountNumber: payment.accountNumberLastFour,
                            accountType: payment.accountType,
                            routingNumber: payment.routingNumber.toString().slice(-LAST_DIGITS_OF_ACCOUNT),
                        });
                    }
                }
            }
        }
    }
    /**
     * Submission function for the enrollment form.
     * @param approvalStatus an argument that defines whether or not the form is approved.
     */
    setEnrollmentStatus(approvalStatus: string): void {
        this.store.dispatch(new CheckForm(this.formName));
        this.handlePrelimCheckErrorValidation();
        if (approvalStatus === AppSettings.REJECTEDSTATUS) {
            this.alertDialog();
        } else if (
            approvalStatus === AppSettings.APPROVEDSTATUS &&
            this.enrollmentDetailForm.valid &&
            (this.isApplicationViewed || !this.enrollment.isAflac) &&
            this.ebsPaymentPresent &&
            !this.viewFormRequired &&
            !this.showAcknowledgementError
        ) {
            const enrollmentDetails = {
                enrollmentId: this.enrollment.enrollmentData.id,
                verificationAction: AppSettings.APPROVESTATUS,
                initial: this.enrollmentDetailForm.controls.initial.value,
                ebsPaymentOnFile: this.ebsPaymentOnFile ? this.ebsPaymentOnFile : this.enrollment.enrollmentData.ebsPaymentOnFile,
            };
            aflac_eic.aflac_eic_form("aflac_eic_prefs");
            this.userPreference = this.userPrefs2 ? this.userPrefs2.nativeElement.value : "";
            this.aflacEicPreference = this.aflacEicPrefs ? this.aflacEicPrefs.nativeElement.value : "";
            iif(
                () => this.isIDV && this.isPayrollHeadsetIDV,
                this.memberService.verifyMemberIdentity(
                    this.memberId,
                    this.aflacEicPreference,
                    this.userPreference,
                    SystemFlowCode.HEADSET_PROSPECT,
                    this.groupId,
                ),
                EMPTY,
            ).subscribe();
            this.enrollmentDetailDialogRef.close(enrollmentDetails);
        } else if (!this.isApplicationViewed) {
            this.showAlert = true;
        } else if (!this.ebsPaymentPresent) {
            this.showPaymentAlert = true;
            document.getElementById("alert").scrollIntoView();
        }
    }

    /**
     * Handles displaying error validation for preliminary checkbox
     */

    handlePrelimCheckErrorValidation(): void {
        if (this.showPrelimCheck && this.disablePrelimCheckbox && !this.prelimCheckStatus) {
            this.viewFormRequired = true;
        } else if (!this.disablePrelimCheckbox && !this.prelimCheckStatus) {
            this.showAcknowledgementError = true;
        } else if (!this.disablePrelimCheckbox && this.prelimCheckStatus) {
            this.showAcknowledgementError = false;
        }
    }

    /**
     * Handles checkbox change
     */

    onCheckboxChange(event?: MatCheckboxChange): void {
        if (event?.checked) {
            this.prelimCheckStatus = true;
        } else {
            this.prelimCheckStatus = false;
        }
    }

    alertDialog(): void {
        this.rejectAlert = true;
        this.alertDialogRef = this.dialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                title: this.languageStrings["primary.portal.review.question"] + this.enrollment.enrollmentData.plan.name + "?",
                content:
                    this.languageStrings["primary.portal.review.advice"] +
                    this.adminContact.name +
                    this.languageStrings["primary.portal.review.byemail"] +
                    this.adminContact.email +
                    this.languageStrings["primary.portal.review.calling"] +
                    this.adminContact.phone +
                    this.languageStrings["primary.portal.review.time"],
                secondaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    buttonAction: this.alert.bind(this, true),
                },
                primaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.common.reject"],
                    buttonClass: "mon-btn-danger",
                    buttonAction: this.alert.bind(this, false),
                },
            },
        });
        this.alertDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.rejectAlert = false;
            });
    }

    alert(flag: boolean): void {
        const enrollmentDetails = {
            enrollmentId: this.enrollment.enrollmentData.id,
            verificationAction: AppSettings.REJECTSTATUS,
            initial: this.enrollmentDetailForm.controls.initial.value,
            ebsPaymentOnFile: this.ebsPaymentOnFile ? this.ebsPaymentOnFile : this.enrollment.enrollmentData.ebsPaymentOnFile,
        };
        if (!flag) {
            this.enrollmentDetailDialogRef.close(enrollmentDetails);
        }
    }
    /**
     * Function to open dialog when user clicks on view application
     */
    viewApplication(): void {
        this.isDocumentLoading = true;
        let pdfContentHTML: string;
        this.enrollmentService
            .downloadSignedApplication(this.memberId, this.enrollment.enrollmentData.id, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: any) => {
                    this.isLoading = false;
                    const html = document.createElement("html");
                    html.innerHTML = response;
                    pdfContentHTML = html.querySelector("body").innerHTML;
                    this.htmlContentViewer = this.sanitizer.bypassSecurityTrustHtml(pdfContentHTML);
                    this.dialogRef = this.empoweredModalService.openDialog(this.unSignedModal, {});
                    this.isDocumentLoading = false;
                    this.isApplicationViewed = true;
                    this.enrollmentDetailForm.controls.initial.enable();
                },
                (error: HttpErrorResponse) => {
                    this.isDocumentLoading = false;
                    this.showAlert = false;
                },
            );
    }

    closeDialog(): void {
        this.dialogRef.close();
        this.showAlert = false;
    }

    /**
     * Get EBS configuration and check if payment is valid
     * @returns void
     */
    getEbsInfo(): void {
        this.isEBSPaymentConfigEnabled$ = this.staticUtilService.cacheConfigEnabled(ConfigName.EBS_PAYMENT_FEATURE_ENABLE);
        this.ebsPayment$ = of(
            this.enrollment.enrollmentData.ebsPaymentOnFile.CREDIT_CARD_PRESENT ||
                this.enrollment.enrollmentData.ebsPaymentOnFile.BANK_INFORMATION_PRESENT ||
                this.enrollment.enrollmentData.ebsPaymentOnFile.DIRECT_DEPOSIT,
        );
        this.ebsPaymentPresent =
            this.enrollment.enrollmentData.ebsPaymentOnFile.CREDIT_CARD_PRESENT ||
            this.enrollment.enrollmentData.ebsPaymentOnFile.BANK_INFORMATION_PRESENT ||
            this.enrollment.enrollmentData.ebsPaymentOnFile.DIRECT_DEPOSIT;

        this.isEBSIndicator$ = this.accountService
            .getGroupAttributesByName([GroupAttributeEnum.EBS_INDICATOR], +this.groupId)
            .pipe(map((ebsIndicator: GroupAttribute[]) => ebsIndicator && ebsIndicator.length > 0 && ebsIndicator[0].value === "true"));
        combineLatest([this.isEBSIndicator$, this.isEBSPaymentConfigEnabled$])
            .pipe(
                take(1),
                tap(([isEBSIndicator, isEBSPaymentConfigEnabled]) => {
                    if (!isEBSIndicator || !isEBSPaymentConfigEnabled) {
                        this.ebsPaymentPresent = true;
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Opens EBS modal when configuration is enabled and payment status is valid and link is clicked
     * and handles API call when modal is closed
     * @returns void
     */
    gotoAflacEBS(): void {
        this.ebsPaymentFailed = false;
        this.showPaymentAlert = false;
        const ebsDialog = this.empoweredModalService.openDialog(EBSInfoModalComponent, {
            data: {
                isFromNonEnrollmentFlow: true,
                mpGroup: this.groupId?.toString(),
                memberId: this.memberId,
                ebsPaymentOnFile: this.ebsPayment$,
                fromComponentName: "EnrollmentDetailsComponent",
            },
        });
        ebsDialog
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dialogParams) => {
                if (dialogParams?.fromContEbs) {
                    this.memberService
                        .getEbsPaymentOnFile(this.memberId, this.groupId)
                        .pipe(
                            takeUntil(this.unsubscribe$),
                            tap((response) => {
                                this.ebsPaymentOnFile = response;
                                this.ebsPaymentPresent =
                                    response.BANK_INFORMATION_PRESENT || response.CREDIT_CARD_PRESENT || response.DIRECT_DEPOSIT;
                                this.ebsPayment$ = of(
                                    response.BANK_INFORMATION_PRESENT || response.CREDIT_CARD_PRESENT || response.DIRECT_DEPOSIT,
                                );
                                this.successPaylogix = dialogParams.fromContEbs ? dialogParams.fromContEbs : false;
                            }),
                            switchMap(() => {
                                const ebsPmt: EbsPaymentFileEnrollment = {
                                    enrollmentIds: this.enrollment.otherAflacEnrollIds,
                                    ebsPaymentOnFile: (Object.keys(this.ebsPaymentOnFile) as unknown)[0],
                                };
                                return this.enrollmentsService.updateEbsPaymentOnFile(this.memberId, this.groupId, ebsPmt);
                            }),
                            catchError(() => {
                                this.ebsPaymentFailed = true;
                                this.ebsPaymentPresent = false;
                                return EMPTY;
                            }),
                        )
                        .subscribe(() => this.isEbsDetailsFlow.emit(dialogParams));
                }
            });
    }

    /**
     * Method that implements destroy lifecycle hook to clean up observables
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
