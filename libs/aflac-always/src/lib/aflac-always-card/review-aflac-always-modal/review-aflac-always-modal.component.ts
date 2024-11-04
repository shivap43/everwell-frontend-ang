import { Component, EventEmitter, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { MemberService } from "@empowered/api";
import { takeUntil } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Select } from "@ngxs/store";
import { AppFlowService, SharedState } from "@empowered/ngxs-store";
import { ReviewAflacAlwaysModalData } from "libs/api/src/lib/services/member/models/review-aflac-always-modal.data";
import { EmpoweredModalService } from "@empowered/common-services";

const MIN_INITIAL_LENGTH = 2;
const APPROVE = "APPROVE";
const REJECT = "REJECT";

@Component({
    selector: "empowered-review-aflac-always-modal",
    templateUrl: "./review-aflac-always-modal.component.html",
    styleUrls: ["./review-aflac-always-modal.component.scss"],
})
export class ReviewAflacAlwaysModalComponent implements OnInit {
    languageStrings: Record<string, string>;
    secondaryLanguageStrings: Record<string, string>;
    paymentData: ReviewAflacAlwaysModalData[];
    reviewForm: FormGroup;
    private readonly unsubscribe$ = new Subject<void>();
    @Select(SharedState.regex) regex$: Observable<any>;
    validationRegex: any;
    BANK_DRAFT = "BANK_DRAFT";
    CREDIT_CARD = "CREDIT_CARD";
    aflacAlwaysEnrolmentIds: number[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA)
        readonly memberInfo: {
            mpGroupId: number;
            memberId: number;
            showEnrollmentMethod: boolean;
            isTpi: boolean;
            rejectedEnrollmentIds: number[];
        },
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ReviewAflacAlwaysModalComponent>,
        private readonly matDialog: MatDialog,
        private readonly memberService: MemberService,
        private fb: FormBuilder,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly appFlowService: AppFlowService,
    ) {}

    /**
     * @description Lifecycle Method
     */
    ngOnInit(): void {
        this.fetchLanguageStrings();
        this.getPaymentMethods();
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data.ALPHA;
                this.defineReviewForm();
            }
        });
        this.reviewForm.controls.reviewCheck.valueChanges.subscribe(() => {
            this.reviewForm.controls.reviewCheck.setValidators(Validators.requiredTrue);
        });
    }

    /**
     * @description Language Strings
     */
    fetchLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.header",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.subheader",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.payment.card",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.amount",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.cardtype",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.cardnumber",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.expirationdate",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.accounttype",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.accountnumber",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.routingnumber",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.banknumber",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.footer",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.esignature",
            "primary.portal.setPrices.dollar",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.routingmask",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.paymentmask",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.approve",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.reject",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.approvesignature",
            "primary.portal.enrollment.summary.aflacalways.reviewmodal.rejectsignature",
            "primary.portal.pda.form.signRequired",
            "primary.portal.aflac.always.modal.eSignature.min.char",
            "primary.portal.common.slash",
            "primary.portal.enrollment.summary.selection.required",
            "primary.portal.enrollment.review.initial",
            "primary.portal.review.signature.required",
            "primary.portal.common.requiredFeild",
        ]);
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues(["secondary.portal.common.invalidFormat"]);
    }

    /**
     * @description Method to call the api for fetching payment details of pending plans
     */
    getPaymentMethods(): void {
        this.memberService
            .getPaymentMethodsForAflacAlways(this.memberInfo.memberId, this.memberInfo.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.paymentData = data;
                if (this.memberInfo.rejectedEnrollmentIds?.length) {
                    this.paymentData = this.paymentData.map((element) => ({
                        ...element,
                        enrolledPlans: element.enrolledPlans.filter(
                            (plan) => this.memberInfo.rejectedEnrollmentIds.indexOf(plan.enrollmentId) < 0,
                        ),
                    }));
                }
            });
    }

    /**
     * @description Initializes the form
     */
    defineReviewForm(): void {
        this.reviewForm = this.fb.group({
            initials: [
                "",
                [Validators.required, Validators.pattern(new RegExp(this.validationRegex)), Validators.minLength(MIN_INITIAL_LENGTH)],
            ],
            reviewCheck: [false, [Validators.required]],
        });
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Closes the Review Aflac Always Modal on clicking the reject button and set the value
     */
    rejectAflacAlways(): void {
        this.updateReviewCheckFormValidator();
        if (this.reviewForm.valid) {
            this.appFlowService.setReviewAflacInitial(this.reviewForm.controls.initials.value);
            this.appFlowService.setReviewAflacStatus(REJECT);
            this.empoweredModalService.closeDialog();
        }
    }

    /**
     * Closes the Review Aflac Always Modal on clicking the approve button and set the value
     */
    approveAflacAlways(): void {
        this.updateReviewCheckFormValidator();
        if (this.reviewForm.valid) {
            this.appFlowService.setReviewAflacInitial(this.reviewForm.controls.initials.value);
            this.appFlowService.setReviewAflacStatus(APPROVE);
            this.empoweredModalService.closeDialog();
        }
    }

    /**
     * Extracts last four digits of a number
     */
    getLastFourDigit(routingNumber: number): string {
        return routingNumber?.toString().slice(-4);
    }

    /**
     * Updates the checkbox form validator
     */
    updateReviewCheckFormValidator() {
        this.reviewForm.controls.reviewCheck.setValidators(Validators.requiredTrue);
        this.reviewForm.controls.reviewCheck.updateValueAndValidity();
        this.reviewForm.controls.reviewCheck.markAsTouched();
    }

    /**
     * Formats the account type-capitalizes the first letter
     */
    formatAccountType(accountType: string) {
        if (accountType) {
            return accountType.charAt(0) + accountType.slice(1).toLocaleLowerCase();
        }
        return accountType;
    }
}
