import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { coverageStartFunction, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { SharedState } from "@empowered/ngxs-store";
import { forkJoin, of, Subject, Observable } from "rxjs";
import { catchError, takeUntil, switchMap, tap } from "rxjs/operators";
import { DateFormats, ClientErrorResponseCode, ClientErrorResponseType, Permission, AppSettings, PlanChoice } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { HttpErrorResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-manage-plans-update-availability",
    templateUrl: "./manage-plans-update-availability.component.html",
    styleUrls: ["./manage-plans-update-availability.component.scss"],
})
export class ManagePlansUpdateAvailabilityComponent implements OnInit, OnDestroy {
    coverageStartDateOptions = [];
    private unsubscribe$ = new Subject<void>();
    updateAvailabiltyForm: FormGroup;
    coverageStartFucntionValue: any;
    currentDate = new Date();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.select",
        "primary.portal.maintenanceBenefitsOffering.managePlans.enrollmentStartDate",
        "primary.portal.maintenanceBenefitsOffering.managePlans.coverageStartDate",
        "primary.portal.maintenanceBenefitsOffering.managePlans.updateProductAvailability",
        "primary.portal.maintenanceBenefitsOffering.managePlans.updatePlanAvailability",
        "primary.portal.maintenanceBenefitsOffering.managePlans.invalidDate",
        "primary.portal.maintenanceBenefitsOffering.managePlans.requiredField",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.addPlanYear.badParameter",
    ]);
    fieldErrorMessage = "";
    errorMsg = "";
    error = false;
    isSpinnerLoading: boolean;
    permissionEnum = Permission;
    isReadOnly = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly language: LanguageService,
        private readonly formbuilder: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly dialogRef: MatDialogRef<ManagePlansUpdateAvailabilityComponent>,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly store: Store,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method setCoverageStartDates()
     * and @method checkForUpdateAvailabilityReadOnlyPermission()
     * used to initialize the updateAvailabilityForm
     */
    ngOnInit(): void {
        this.checkForUpdateAvailabilityReadOnlyPermission().subscribe();
        this.setCoverageStartDates();
        let enrollmentDate;
        if (this.data.opensFrom === "plan") {
            this.coverageStartDateOptions.forEach((coverageFucntion) => {
                if (coverageFucntion.value === this.data.productDetails.plan.coverageStartFunction) {
                    this.coverageStartFucntionValue = coverageFucntion;
                }
            });
            enrollmentDate = this.data.productDetails.plan.enrollmentPeriod.effectiveStarting;
        } else if (this.data.opensFrom === "product") {
            const planList = this.data.productDetails.plans.filter((plan) => !plan.isDeactivated);
            if (planList.length) {
                this.coverageStartFucntionValue = this.coverageStartDateOptions.find(
                    (res) => res.value === planList[0].plan.coverageStartFunction,
                );
                enrollmentDate = planList[0].plan.enrollmentStartDate;
            } else {
                enrollmentDate = new Date();
            }
        }
        this.updateAvailabiltyForm = this.formbuilder.group(
            {
                enrollmentStartDate: [{ disabled: this.isReadOnly, value: enrollmentDate }, [Validators.required]],
                coverageStartDate: [{ disabled: this.isReadOnly, value: this.coverageStartFucntionValue.value }, [Validators.required]],
            },
            { updateOn: "blur" },
        );
    }
    /**
     * This method checks if the logged in user has read only permission
     * for update availability modal-pop up
     * @returns Observable<boolean> whether the ACCOUNT_BO_READ_AVAILABILITY permission is present
     **/
    checkForUpdateAvailabilityReadOnlyPermission(): Observable<boolean> {
        return this.store.select(SharedState.hasPermission(Permission.ACCOUNT_BO_READ_AVAILABILITY)).pipe(
            tap((permission) => (this.isReadOnly = permission)),
            takeUntil(this.unsubscribe$),
        );
    }

    setCoverageStartDates(): void {
        this.coverageStartDateOptions = [
            {
                value: coverageStartFunction.DAY_AFTER,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.DAY_AFTER",
                ),
            },
            {
                value: coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH",
                ),
            },
            {
                value: coverageStartFunction.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH",
                ),
            },
        ];
    }
    /**
     * saves availability data
     */
    saveAvailability(): void {
        const planAvailabilityToBeUpdated = [];
        if (this.data.opensFrom === "plan" && this.updateAvailabiltyForm.valid) {
            const planChoice: PlanChoice = {
                agentAssisted: this.data.productDetails.plan.agentAssisted,
                cafeteria: this.data.productDetails.plan.cafeteria,
                continuous: true,
                id: this.data.productDetails.plan.id,
                planId: this.data.productDetails.plan.plan.id,
                plan: this.data.productDetails.plan.plan,
                enrollmentPeriod: {
                    effectiveStarting: this.datepipe.transform(
                        this.dateService.toDate(this.updateAvailabiltyForm.controls.enrollmentStartDate.value || ""),
                        DateFormats.YEAR_MONTH_DAY,
                    ),
                },
                coverageStartFunction: this.updateAvailabiltyForm.controls.coverageStartDate.value,
                taxStatus: this.data.productDetails.plan.taxStatus,
            };
            this.updateChoicesAndSubmit([this.benefitsOfferingService.updatePlanChoice(planChoice, this.data.mpGroup)]);
        } else if (this.data.opensFrom === "product" && this.updateAvailabiltyForm.valid) {
            this.data.productDetails.plans
                .filter((plan) => !plan.isRemovePlan && !plan.isDeactivated)
                .forEach((choice) => {
                    const planChoice: PlanChoice = {
                        agentAssisted: choice.plan.agentAssisted,
                        cafeteria: choice.plan.cafeteria,
                        continuous: true,
                        id: choice.plan.id,
                        planId: choice.plan.plan.id,
                        plan: choice.plan.plan,
                        enrollmentPeriod: {
                            effectiveStarting: this.dateService.format(
                                this.updateAvailabiltyForm.controls.enrollmentStartDate.value || "",
                                DateFormats.YEAR_MONTH_DAY,
                            ),
                        },
                        coverageStartFunction: this.updateAvailabiltyForm.controls.coverageStartDate.value,
                        taxStatus: choice.plan.taxStatus,
                    };
                    planAvailabilityToBeUpdated.push(
                        this.benefitsOfferingService.updatePlanChoice(planChoice, this.data.mpGroup).pipe(catchError(() => of(undefined))),
                    );
                });
            this.updateChoicesAndSubmit(planAvailabilityToBeUpdated);
        }
    }
    /**
     * updates plan choices and submit approval
     * @param planAvailabilityToBeUpdated plan choices to be updated
     */
    updateChoicesAndSubmit(planAvailabilityToBeUpdated: Observable<void>[]): void {
        this.isSpinnerLoading = true;
        forkJoin(planAvailabilityToBeUpdated)
            .pipe(
                switchMap((resp) =>
                    this.benefitsOfferingService.submitApprovalRequest(this.data.mpGroup, false).pipe(catchError((error) => of(null))),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    this.isSpinnerLoading = false;
                    this.dialogRef.close("save");
                },
                (error: HttpErrorResponse) => {
                    this.isSpinnerLoading = false;
                    this.error = true;
                    if (
                        error.error.status === ClientErrorResponseCode.RESP_400 &&
                        error.error.code === ClientErrorResponseType.BAD_PARAMETER &&
                        error.error.details
                    ) {
                        this.errorMsg = this.secondaryLanguageStrings["secondary.portal.benefitsOffering.addPlanYear.badParameter"];
                        const fieldErrors: string[] = error.error.details.map((detail) => detail.message);
                        this.fieldErrorMessage = fieldErrors.join(", ");
                    } else {
                        this.errorMsg = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${error.error.status}.${error.error.code}`,
                        );
                    }
                },
            );
    }

    closeModal(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
