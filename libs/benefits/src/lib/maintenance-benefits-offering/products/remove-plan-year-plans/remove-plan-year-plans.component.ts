import { Component, Inject, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { ProductDetails } from "@empowered/api";
import { Subject } from "rxjs";
import { DateService } from "@empowered/date";

interface RemoveAllDetails {
    detail: ProductDetails;
    mpGroup: string;
    route: ActivatedRoute;
}

interface PlanYear {
    id: number;
    name: string;
}

const ACTION_SUBMIT = "submit";
const FALSE_STRING = "false";

@Component({
    selector: "empowered-remove-plan-year-plans",
    templateUrl: "./remove-plan-year-plans.component.html",
    styleUrls: ["./remove-plan-year-plans.component.scss"],
})
export class RemovePlanYearPlansComponent implements OnDestroy {
    carrierName: string;
    productName: string;
    productType: string;
    productTypeContinuous = "Continuous";
    productTypePlanYear = "PlanYearRestricted";
    removePlanYearPlansForm: FormGroup;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.removePlanYearPlans.title",
        "primary.portal.maintenanceBenefitsOffering.planYearQuasi.updatesToPlanYear",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
        "primary.portal.common.requiredField",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.removePlan.openEnrollment",
        "primary.portal.maintenanceBenefitsOffering.removeAllContinuousPlans.openEnrollment",
        "primary.portal.maintenanceBenefitsOffering.removeAllPlans.openEnrollment",
    ]);
    planYearOptionSelected: string;
    isContinuousPlan = false;
    isPlanYear = false;
    isProductDisabled = false;
    isLoading = false;
    planYearName: string;
    planYearData: PlanYear[] = [];
    selectedPlanYearId: number;
    planYearTooltipMsg: string;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly removeAllData: RemoveAllDetails,
        private readonly removeAllPlansDialogRef: MatDialogRef<RemovePlanYearPlansComponent>,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {
        this.carrierName = this.removeAllData.detail.carrierName;
        this.productName = this.removeAllData.detail.productName;
        if (this.removeAllData.detail.planYear === FALSE_STRING) {
            this.isContinuousPlan = true;
        } else {
            this.isPlanYear = true;
            this.planYearData = this.removeAllData.detail.plans
                .reduce((prev, current) => {
                    if (!prev.find((plan) => plan.planYear.id === current.planYear.id)) {
                        prev.push(current);
                    }
                    return prev;
                }, [])
                .sort(
                    (a, b) =>
                        this.dateService.toDate(b.planYear.enrollmentPeriod.effectiveStarting).getTime() -
                        this.dateService.toDate(a.planYear.enrollmentPeriod.effectiveStarting).getTime(),
                )
                .map((item) => ({
                    id: item.planYear.id,
                    name: item.planYear.name,
                }));

            this.removePlanYearPlansForm = this.fb.group({
                planYearOptionSelected: this.planYearData[0].id,
            });
            this.selectedPlanYearId = +this.planYearData[0].id;
            this.planYearTooltipMsg = this.planYearData[0].name;
        }
    }

    /**
     * This method will execute when all plans are successfully removed, stop the spinner and close the dialog
     */
    onAllPlansRemoved(): void {
        this.isLoading = false;
        this.isProductDisabled = true;
        this.removeAllPlansDialogRef.close({
            action: ACTION_SUBMIT,
            data: this.removeAllData.detail,
            planYearId: this.selectedPlanYearId,
            planYearTooltipMsg: this.planYearTooltipMsg,
        });
    }

    /**
     * @description method to capture user selected plan year
     * @returns {void}
     * @memberof RemovePlanYearPlansComponent
     */
    planYearSelected(planYear: string): void {
        this.selectedPlanYearId = +planYear;
        const tooltipObj = this.planYearData.find((val) => val.id === +planYear);
        if (tooltipObj) {
            this.planYearTooltipMsg = tooltipObj.name;
        }
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
