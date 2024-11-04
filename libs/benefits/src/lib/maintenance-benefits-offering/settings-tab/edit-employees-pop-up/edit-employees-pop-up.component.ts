import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { BenefitsOfferingService, PlanIneligibleReasons } from "@empowered/api";
import { AccountImportTypes, AppSettings } from "@empowered/constants";
import { Observable, Subject, forkJoin } from "rxjs";

import { Select, Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { EmployeeMinimunPopupComponent } from "../employee-minimun-popup/employee-minimun-popup.component";
import { takeUntil, switchMap, mergeMap, tap } from "rxjs/operators";

import {
    BenefitsOfferingState,
    GetProductsPanel,
    SetAllEligiblePlans,
    SetEligibleEmployees,
    SetPlanEligibility,
    SharedState,
    SetRegex,
} from "@empowered/ngxs-store";

@Component({
    selector: "empowered-edit-employees-pop-up",
    templateUrl: "./edit-employees-pop-up.component.html",
    styleUrls: ["./edit-employees-pop-up.component.scss"],
})
export class EditEmployeesPopUpComponent implements OnInit, OnDestroy {
    enableCensusField = false;
    private unsubscribe$ = new Subject<void>();
    form: FormGroup;
    radioValue = "1";
    mpGroup: any;
    validationRegex: any;
    isLoading: boolean;
    @Select(SharedState.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.editEstimate",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.aboutEligibleEmployees",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.affectsPlan",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.estimatedNumber",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.useNoCensus",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.censusLists",
        "primary.portal.maintenanceBenefitsOffering.editEmployeesPopup.employees",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
    ]);
    error: boolean;
    errorMessage: string;
    SAVE = "save";
    CLOSE = "close";
    ONE = "1";
    TWO = "2";
    ZERO = "0";
    employeeMinimumDialogRef: MatDialogRef<EmployeeMinimunPopupComponent>;
    isSpinnerLoading: boolean;
    response: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<EditEmployeesPopUpComponent>,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly language: LanguageService,
        private readonly store: Store,
    ) {
        this.isLoading = true;
        forkJoin([this.store.dispatch(new SetRegex()), this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.api.*"))])
            .pipe(
                switchMap((response) => this.regex$),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((response) => {
                if (response) {
                    this.validationRegex = response;
                    this.intializeForm();
                    this.isLoading = false;
                }
            });
    }

    ngOnInit(): void {
        if (this.data.recentcensusData) {
            this.enableCensusField = true;
        }
    }

    radioChange(event: any): void {
        this.radioValue = event.value;
    }

    // This method is called when the user clicked on Save
    submitForm(): void {
        if (!this.radioValue) {
            this.radioValue = this.ONE;
        }
        if (this.radioValue === this.ONE) {
            this.updateCensusEstimate(this.form.controls.employeeEstimate.value);
        } else if (this.radioValue === this.TWO) {
            this.updateCensusEstimate(this.data.recentcensusData.count);
        }
    }

    /**
     * This method is used to update census estimate
     * @param eligibleEmployee eligible employee count
     */
    updateCensusEstimate(eligibleEmployee: number): void {
        if (this.form.controls.employeeEstimate.value === this.ZERO) {
            this.form.controls.employeeEstimate.setErrors({ requirement: true });
        }
        if (this.form.valid) {
            this.isSpinnerLoading = true;
            const updatedCensusInfo = {
                totalEligibleEmployees: eligibleEmployee,
            };
            this.benefitsOfferingService
                .saveBenefitOfferingSettings(updatedCensusInfo, this.data.mpGroup)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    mergeMap((sucess) =>
                        this.store.dispatch(new SetAllEligiblePlans(this.data.states, AccountImportTypes.AFLAC_INDIVIDUAL)),
                    ),
                    mergeMap((sucess) => this.store.dispatch(new SetPlanEligibility())),
                    mergeMap((sucess) => this.store.dispatch(new GetProductsPanel())),
                    tap((sucess) => {
                        this.store.dispatch(new SetEligibleEmployees(eligibleEmployee));
                        const products = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
                        const ineligiblePlans = [];
                        products.forEach((eachProduct) =>
                            ineligiblePlans.push(
                                ...eachProduct.plans.filter(
                                    (eachPlan) =>
                                        eachPlan &&
                                        eachPlan.planEligibilty &&
                                        eachPlan.planEligibilty.eligibility &&
                                        eachPlan.planEligibilty.eligibility === AppSettings.NOT_ELIGIBLE &&
                                        eachPlan.planEligibilty.inEligibleReason &&
                                        eachPlan.planEligibilty.inEligibleReason === PlanIneligibleReasons.MINIMUM_EMPLOYEES_NOT_MET,
                                ),
                            ),
                        );
                        if (ineligiblePlans && ineligiblePlans.length) {
                            const removablePlans = [];
                            const approvedCarriers = this.store
                                .selectSnapshot(BenefitsOfferingState.getPlanChoices)
                                .map((plan) => plan.plan.id);
                            removablePlans.push(
                                ...ineligiblePlans.filter(
                                    (planObject) => approvedCarriers.findIndex((plan) => plan === planObject.plan.id) > -1,
                                ),
                            );
                            // open employee minimum pop-up and display plans
                            if (removablePlans.length > 0) {
                                this.response = {
                                    ineligiblePlans: removablePlans,
                                    eligibleEmployeeInformation: this.data,
                                    recentEstimate: eligibleEmployee,
                                };
                            } else {
                                this.response = true;
                                this.isSpinnerLoading = false;
                                this.dialogRef.close();
                            }
                        } else {
                            this.response = true;
                        }
                    }),
                )
                .subscribe(
                    (sucess) => {
                        this.isSpinnerLoading = false;
                        this.dialogRef.close(this.response);
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                        this.error = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    },
                );
        }
    }

    // This method will be called on click of close in pop-up
    closeForm(): void {
        this.dialogRef.close(AppSettings.CANCEL);
    }

    // This method is used to initialize form
    intializeForm(): void {
        this.form = this.formBuilder.group(
            {
                employeeEstimate: [this.data.totalEligible, [Validators.required, Validators.pattern(this.validationRegex.NUMERIC)]],
            },
            { updateOn: "blur" },
        );
    }
    // ng life cycle hook
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
