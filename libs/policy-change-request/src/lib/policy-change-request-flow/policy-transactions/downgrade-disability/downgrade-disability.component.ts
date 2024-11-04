import { Component, OnInit, OnDestroy } from "@angular/core";

import { PolicyChangeRequestList, AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { FormBuilder, Validators, FormGroup, AbstractControl } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Select, Store } from "@ngxs/store";
import { PolicyTransactionForms } from "@empowered/api";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { Subscription, Observable } from "rxjs";
import { PolicyChangeRequestState, SetDowngradeDisabilityRequest, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

const THREE_MONTHS_BENEFIT_PERIOD = 3;
const SIX_MONTHS_BENEFIT_PERIOD = 6;
const INCREASE_ELIMINATION_PERIOD = "increaseEliminationPeriod";

@Component({
    selector: "empowered-downgrade-disability",
    templateUrl: "./downgrade-disability.component.html",
    styleUrls: ["./downgrade-disability.component.scss"],
})
export class DowngradeDisabilityComponent implements OnInit, OnDestroy {
    downgradeForm: FormGroup;
    isSubmitted: boolean;
    subscriptions: Subscription[] = [];
    removeRiderRequestInitialData: any;
    validationRegex: any;
    fromValueMaxLength = AppSettings.MAX_LENGTH_8;
    fromEliminationPeriodOptions: string[] = [];
    toEliminationPeriodOptions: string[] = [];
    benefitPeriod: number;
    toEliminationPeriodException: string[] = ["0/14", "7/7"];
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.aggrementCondition1",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.aggrementCondition2",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.aggrementCondition3",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.decreaseMonthlyBenefitAmount",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.decreaseMaximumBenefitAmount",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.increaseEliminationPeriod",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.to",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.from",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.toValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.toDaysValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromDaysValidation",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.toDays",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromDays",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromAndToMaxLengthValiadtion",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.header",
        "primary.portal.policyChangeRequest.transactions.downgrade.higherEliminationError",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.select",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.positiveNumber",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.aggrementTitle",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.fromMonths",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.toMonths",
    ]);
    @Select(PolicyChangeRequestState.GetDowngradeDisabilityRequest) downgradeDisabilityRequest$: Observable<any>;
    @Select(SharedState.regex) regex$: Observable<any>;

    constructor(
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly staticUtilService: StaticUtilService,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    // Assign the data object to the local object(i.e validationRegex)
                    this.validationRegex = data;
                }
            }),
        );
    }

    ngOnInit(): void {
        this.downgradeForm = this.fb.group({
            decreaseMonthlyBenefitAmount: this.fb.group({
                isChecked: [false],
            }),
            decreaseMaximumBenefitPeriod: this.fb.group({
                isChecked: [false],
            }),
            increaseEliminationPeriod: this.fb.group({
                isChecked: [false],
            }),
            type: [Object.keys(PolicyTransactionForms)[8]],
        });
        this.removeRiderRequestInitialData = { ...this.downgradeForm.value };
        this.getDataFromStore();
    }
    /**
     * @description get the pre filled downgrade product data from store and set form
     */
    getDataFromStore(): void {
        const policySearched = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
        if (policySearched) {
            this.benefitPeriod = policySearched.policies[0].benefitPeriod;
            this.getDowngradeOptions();
        }
        this.subscriptions.push(
            this.downgradeDisabilityRequest$.subscribe((downgradeDisabilityRequest) => {
                if (downgradeDisabilityRequest) {
                    const cloneDowngradeRequest = { ...downgradeDisabilityRequest };
                    this.loadFormControl(cloneDowngradeRequest);
                    this.downgradeForm.patchValue(cloneDowngradeRequest);
                    if (cloneDowngradeRequest["increaseEliminationPeriod"]) {
                        const eliminationPeriod = cloneDowngradeRequest["increaseEliminationPeriod"];
                        this.onEliminationPeriodChange(eliminationPeriod.from, true, eliminationPeriod.to);
                    }
                }
            }),
        );
    }
    /**
     * @description get the elimination period option from config based on benefit period
     * @param benefitPeriod benefit period of the policy
     */
    getDowngradeOptions() {
        let config = "";
        if (this.benefitPeriod === THREE_MONTHS_BENEFIT_PERIOD) {
            config = "general.pcr.downgrade.benefit_period.three_months";
        } else if (this.benefitPeriod === SIX_MONTHS_BENEFIT_PERIOD) {
            config = "general.pcr.downgrade.benefit_period.six_months";
        } else {
            config = "general.pcr.downgrade.benefit_period.default";
        }
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(config).subscribe((response) => {
                this.fromEliminationPeriodOptions = response.split(",");
            }),
        );
    }

    loadFormControl(cloneDowngradeRequest: any): void {
        for (const request in cloneDowngradeRequest) {
            if (cloneDowngradeRequest[request] instanceof Object) {
                const cloneRequest = { ...cloneDowngradeRequest[request], isChecked: true };
                delete cloneDowngradeRequest[request];
                cloneDowngradeRequest[request] = cloneRequest;
                this.showFromAndToControls(true, request);
            }
        }
    }
    /**
     * @description close the popup and clear the reset the store values
     */
    cancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            this.cancelDialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CANCEL) {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.store.dispatch(new SetDowngradeDisabilityRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    /**
     * Create form control
     */
    get formControl(): unknown {
        return this.downgradeForm.controls;
    }
    /**
     * Toggle to and from contols
     * @param index
     * @param isChecked
     */
    showFromAndToControls(isChecked: boolean, formGrpName: string): void {
        if (isChecked) {
            if (formGrpName !== "increaseEliminationPeriod") {
                this.formControl[formGrpName].addControl(
                    "to",
                    this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
                );
                this.formControl[formGrpName].addControl(
                    "from",
                    this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMERIC))]),
                );
                this.formControl[formGrpName].setValidators(this.fromAndToValidation);

                this.formControl[formGrpName].markAsDirty();
            } else {
                this.formControl[formGrpName].addControl("to", this.fb.control(""));
                this.formControl[formGrpName].addControl("from", this.fb.control("", [Validators.required]));
            }
        } else {
            this.formControl[formGrpName].markAsPristine();
            this.formControl[formGrpName].removeControl("to");
            this.formControl[formGrpName].removeControl("from");
        }
        this.formControl[formGrpName].updateValueAndValidity();
    }

    /**
     * Validate to and from control
     * @param formGroupName
     */
    fromAndToValidation(control: AbstractControl): unknown {
        if (parseInt(control.value.from, 10) <= parseInt(control.value.to, 10)) {
            return { isToValueIsGreater: true };
        }
        return null;
    }

    fromDayAndToDayValidation(control: AbstractControl): unknown {
        if (parseInt(control.value.from, 10) >= parseInt(control.value.to, 10)) {
            return { isToValueIsGreater: true };
        }
        return null;
    }

    /**
     * Submit downgrade disability change request
     */
    submitDowngradeDisabilityRequest(): void {
        if (this.downgradeForm.dirty) {
            this.isSubmitted = true;
            this.validateAllFormFields(this.downgradeForm);
            this.storeRequestData();
        } else {
            this.openConfirmationPopup();
        }
    }
    /**
     * Store request data
     */
    storeRequestData(): void {
        if (this.downgradeForm.valid) {
            this.formatData();
            this.store.dispatch(new SetDowngradeDisabilityRequest(this.downgradeForm.value, this.removeRiderRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
    }

    formatData(): void {
        for (const data in this.downgradeForm.value) {
            if (this.downgradeForm.value[data].isChecked || this.downgradeForm.value[data] === AppSettings.DISABILITY_DOWNGRADE) {
                delete this.downgradeForm.value[data].isChecked;
            } else {
                delete this.downgradeForm.value[data];
            }
        }
    }
    /**
     * Validate all form fields on submit
     */
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }
    /**
     * @description set the form values and validators for increase elimination period option on change of selected option
     * @param value value selected for from field of increase elimination period option
     * @param preSelect to indicate if elimination period is preselected
     * @param toEliminationPeriod preselected value of to field of increase elimination period option
     */
    onEliminationPeriodChange(value: string, preSelect: boolean, toEliminationPeriod?: string): void {
        if (this.formControl[INCREASE_ELIMINATION_PERIOD].controls.from.value) {
            this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setValidators([Validators.required]);
            this.toEliminationPeriodOptions = this.fromEliminationPeriodOptions.slice(
                this.fromEliminationPeriodOptions.findIndex((option) => option === value) + 1,
            );
            if (this.toEliminationPeriodException.includes(this.formControl[INCREASE_ELIMINATION_PERIOD].controls.from.value)) {
                this.toEliminationPeriodOptions = this.toEliminationPeriodOptions.filter(
                    (eliminationPeriod) => !this.toEliminationPeriodException.includes(eliminationPeriod),
                );
            }
            if (preSelect) {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls["to"].setValue(toEliminationPeriod);
            } else {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls["to"].setValue("");
            }
            if (!this.toEliminationPeriodOptions.length) {
                this.formControl[INCREASE_ELIMINATION_PERIOD].controls.to.setErrors({ noHigherPeriod: true });
            }
        }
    }
    /**
     * Show policy change confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.downgradeDisability.header"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.store.dispatch(new SetDowngradeDisabilityRequest(null, null));
                    this.sideNavService.onNextClick(1);
                } else {
                    dialogRef.close();
                }
            }),
        );
    }
    /**
     * @description this method will unsubscribe all the api subscription.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
