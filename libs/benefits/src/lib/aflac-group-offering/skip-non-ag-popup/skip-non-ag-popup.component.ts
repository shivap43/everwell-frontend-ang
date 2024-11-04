import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { forkJoin, Subject, Observable } from "rxjs";
import { BenefitsOfferingService, DeletePlanChoice } from "@empowered/api";
import { takeUntil, switchMap } from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";
import { DateFormats, CarrierId, PlanYearType, Plan, PlanYear } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { SideNavService } from "@empowered/ngxs-store";
import { AgRefreshService } from "@empowered/ui";
import { HttpErrorResponse } from "@angular/common/http";

const INITIAL_BO_DEFAULT_STEP = "1";

@Component({
    selector: "empowered-skip-non-ag-popup",
    templateUrl: "./skip-non-ag-popup.component.html",
    styleUrls: ["./skip-non-ag-popup.component.scss"],
})
export class SkipNonAgPopupComponent implements OnInit, OnDestroy {
    isSpinnerLoading = false;
    plans: Array<Plan> = [];
    planYears: Array<PlanYear> = [];
    errorMessage: string;
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.skipNonAgSetup.title",
        "primary.portal.skipNonAgSetup.description",
        "primary.portal.skipNonAgSetup.submitAgOffering",
        "primary.portal.common.goBack",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<SkipNonAgPopupComponent>,
        private readonly datePipe: DatePipe,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        @Inject(MAT_DIALOG_DATA) private readonly data: { mpGroup: number; route: ActivatedRoute },
        private readonly sideNavService: SideNavService,
        private readonly agRefreshService: AgRefreshService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * Service calls to get the Plans and Plan Years
     */
    ngOnInit(): void {
        this.benefitsOfferingService
            .getPlanChoices(true, false, this.data.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (plansResponse) =>
                    (this.plans = plansResponse.filter((plan) => plan.requiredSetup && plan.carrierId !== CarrierId.AFLAC_GROUP)),
            );
        this.benefitsOfferingService
            .getPlanYears(this.data.mpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (planYearsResponse) =>
                    (this.planYears = planYearsResponse.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL)),
            );
    }

    /**
     * Method invoked on click of submit AG offering
     */
    submitAGOffering(): void {
        this.isSpinnerLoading = true;
        if (this.plans.length) {
            this.deletePlans();
        } else {
            this.saveAGOffering()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => this.dialogRef.close(true),
                    (error: HttpErrorResponse) => {
                        this.isSpinnerLoading = false;
                        this.displayDefaultError(error);
                    },
                );
        }
    }

    /**
     * Method to delete selected Plans
     */
    deletePlans(): void {
        const data: DeletePlanChoice = {};
        if (this.planYears && this.planYears.length) {
            data.qualifyingEventValidity = this.planYears[0].enrollmentPeriod;
        }
        const deletePlanObservables = this.plans.map((plan) =>
            this.benefitsOfferingService.deletePlanChoice(
                data,
                plan.id,
                this.data.mpGroup,
                this.datePipe.transform(new Date().setDate(new Date().getDate() - 1), DateFormats.YEAR_MONTH_DAY),
            ),
        );
        forkJoin(deletePlanObservables)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => this.deletePlanYear()),
            )
            .subscribe(
                (resp) => {
                    this.dialogRef.close(true);
                },
                (error: HttpErrorResponse) => {
                    this.isSpinnerLoading = false;
                    this.displayDefaultError(error);
                },
            );
    }

    /**
     * Method to delete AI Plan Years
     * @returns observable of void
     */
    deletePlanYear(): Observable<void> {
        if (this.planYears && this.planYears.length) {
            const deletePlanYearObservables = this.planYears.map((resp) =>
                this.benefitsOfferingService.deletePlanYear(this.data.mpGroup, resp.id),
            );
            return forkJoin(deletePlanYearObservables).pipe(switchMap((response) => this.saveAGOffering()));
        }
        return this.saveAGOffering();
    }

    /**
     * This method is used to save aflac group offering
     * @returns observable of void
     */
    saveAGOffering(): Observable<void> {
        return this.benefitsOfferingService.createApprovalRequest(this.data.mpGroup).pipe(
            switchMap((res) => this.benefitsOfferingService.saveAflacGroupBenefitOffering("", this.data.mpGroup)),
            switchMap((response) => this.agRefreshService.checkCarrierStatus()),
            switchMap((res) => this.sideNavService.updateGroupBenefitOfferingStep(INITIAL_BO_DEFAULT_STEP)),
            switchMap((res) => this.benefitsOfferingService.submitApprovalRequest(this.data.mpGroup, true)),
        );
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.isSpinnerLoading = false;
        if (error && error.error) {
            this.errorMessage = this.agRefreshService.getDefaultErrorMessageForAg(error);
        }
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
