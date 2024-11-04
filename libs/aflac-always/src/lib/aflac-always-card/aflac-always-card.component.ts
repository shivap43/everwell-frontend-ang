import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { LearnMoreModalComponent } from "./learn-more-modal/learn-more-modal.component";
import { LanguageService } from "@empowered/language";
import { EmpoweredModalService, TpiServices } from "@empowered/common-services";
import { EnrollAflacAlwaysModalComponent } from "../enroll-aflac-always-modal/enroll-aflac-always-modal.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AflacAlwaysHelperService } from "../enroll-aflac-always-modal/services/aflac-always-helper.service";
import { MatDialog } from "@angular/material/dialog";
import { AflacAlwaysActions } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { NGRXStore } from "@empowered/ngrx-store";
import { Router } from "@angular/router";
import { ReviewAflacAlwaysModalComponent } from "./review-aflac-always-modal/review-aflac-always-modal.component";
import { EnrollmentMethod } from "@empowered/constants";
import { AppFlowService } from "@empowered/ngxs-store";

const APP_FLOW = "app-flow";
const TPI_AA_ROUTE = "tpi/aflac-always";

@Component({
    selector: "empowered-aflac-always-card",
    templateUrl: "./aflac-always-card.component.html",
    styleUrls: ["./aflac-always-card.component.scss"],
})
export class AflacAlwaysCardComponent implements OnInit, OnDestroy {
    @Input() headerLanguageString: string;
    @Input() bodyLanguageString: string;
    @Input() mpGroupId: string | number;
    @Input() memberId: string | number;
    @Input() isMemberPortal: boolean;
    @Input() isTpi = false;
    @Input() rejectedEnrollmentIds: number[];

    bodyText: string;
    headerText: string;
    enrolledText: string;
    pendingSignatureText: string;
    statusText: string;
    isEnrolled: boolean;
    isReviewEnrollmentPage: boolean;
    readonly unsubscribe$ = new Subject<void>();
    reviewAflacAlwaysStatus: string;
    APPROVE = "APPROVE";
    REJECT = "REJECT";
    isDisabled = false;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.header",
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.enrolled.buttonText",
        "primary.portal.enrollment.summary.aflacalways.reviewmodal.header",
        "primary.portal.enrollment.summary.aflacalways.reviewmodal.editAflacAlways",
        "primary.portal.review.Completed",
        "primary.portal.review.rejected",
        "primary.portal.enrollment.review.edit",
    ]);

    constructor(
        private readonly languageService: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly matDialog: MatDialog,
        private readonly ngrxStore: NGRXStore,
        private readonly tpiServices: TpiServices,
        private readonly router: Router,
        private readonly appFlowService: AppFlowService,
    ) {}

    ngOnInit(): void {
        this.headerText = this.headerLanguageString
            ? this.languageService.fetchPrimaryLanguageValue(this.headerLanguageString)
            : this.languageStrings["primary.portal.applicationFlow.confirmation.aflacAflaysCard.header"];
        this.bodyText = this.languageService.fetchPrimaryLanguageValue(this.bodyLanguageString);
        this.enrolledText = this.languageStrings["primary.portal.applicationFlow.confirmation.aflacAflaysCard.enrolled.buttonText"];
        this.pendingSignatureText = this.languageService.fetchPrimaryLanguageValue(
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.pendingSignature.buttonText",
        );
        this.aflacAlwaysHelperService.aflacAlwaysEnrolled$.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
            if (status) {
                this.statusText = EnrollmentMethod.HEADSET === status ? this.pendingSignatureText : this.enrolledText;
                this.isEnrolled = status;
            }
        });
        this.isReviewEnrollmentPage = this.router.url.includes("review-enrollment");
        this.appFlowService
            .getReviewAflacAlwaysStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((status) => {
                if (status) {
                    this.reviewAflacAlwaysStatus = status;
                }
            });
        this.appFlowService
            .getReevaluateReviewAflacAlways()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((status) => {
                this.isDisabled = !status;
            });
    }

    openLearnMoreModal(): void {
        this.empoweredModalService.openDialog(LearnMoreModalComponent, {
            data: {
                mpGroupId: Number(this.mpGroupId),
                memberId: Number(this.memberId),
                showEnrollmentMethod: !this.isMemberPortal,
                isTpi: this.isTpi,
            },
        });
    }

    /**
     * @description Method to open Review Aflac Always Modal
     */
    openReviewAflacAlwaysModal(): void {
        this.empoweredModalService.openDialog(ReviewAflacAlwaysModalComponent, {
            data: {
                mpGroupId: Number(this.mpGroupId),
                memberId: Number(this.memberId),
                showEnrollmentMethod: !this.isMemberPortal,
                isTpi: this.isTpi,
                rejectedEnrollmentIds: this.rejectedEnrollmentIds,
            },
        });
    }

    enrollInAflacAlways() {
        if (this.isTpi && !this.tpiServices.isLinkAndLaunchMode()) {
            // setting flag if AA flow from shop page or coverage summary
            if (this.router.url.indexOf(APP_FLOW) >= 0) {
                this.tpiServices.setShopPageFlow(true);
            } else {
                this.tpiServices.setShopPageFlow(false);
            }
            // If `Sign Up` is clicked from TPI Modal Mode redirect TPI Specific AA screen
            this.router.navigate([TPI_AA_ROUTE]);
        } else {
            this.matDialog
                .open(EnrollAflacAlwaysModalComponent, {
                    data: {
                        mpGroupId: Number(this.mpGroupId),
                        memberId: Number(this.memberId),
                        showEnrollmentMethod: !this.isMemberPortal,
                    },
                })
                .afterClosed()
                .subscribe(() => {
                    this.aflacAlwaysHelperService.saveAndSubmit$.next(false);
                    // clears modal data on closing aflac always modal
                    this.ngrxStore.dispatch(AflacAlwaysActions.resetAflacAlwaysState());
                });
        }
    }

    /**
     * Angular Lifecycle method, called when component is destroyed
     */
    ngOnDestroy(): void {
        this.aflacAlwaysHelperService.aflacAlwaysEnrolled$.next(null);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
