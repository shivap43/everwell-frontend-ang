import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { BenefitDollars, FlexDollar } from "@empowered/api";
import { ContributionType } from "@empowered/constants";
import { FormGroup, Validators, FormBuilder, ValidatorFn, AbstractControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { Select } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SharedState, RegexDataType } from "@empowered/ngxs-store";

const CONTRIBUTION_TYPE = "contributionType";
const AMOUNT = "amount";
const PERCENTAGE_AMOUNT = "percentageAmount";
const FIXING_VALUE = 2;
const MIN_AMOUNT = 0.01;
const MIN_PERCENTAGE_AMOUNT = 0.01;
const PERCENTAGE_MAX = 100;
const ROUND_FACTOR = 100;
const MIN_LENGTH_FLAT_AMOUNT = 10;
const AFTER_DECIMAL = 1;

@Component({
    selector: "empowered-edit-benefit-dollar-modal",
    templateUrl: "./edit-benefit-dollar-modal.component.html",
    styleUrls: ["./edit-benefit-dollar-modal.component.scss"],
})
export class EditBenefitDollarModalComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.editOffering",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.editOffering.headerMessage",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.editOffering.offeringAmount",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.editOffering.offeringAmount.flatAmount",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.editOffering.offeringAmount.percentage",
        "primary.portal.common.save",
        "primary.portal.common.requiredField",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.flatAmountValidation",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.percentageAmountValidation",
        "primary.portal.applicationFlow.beneficiary.percentCannotBeZero",
        "primary.portal.census.editEstimate.nonZero",
    ]);

    offeringForm: FormGroup;
    displaySuffixPrefix = false;
    displayPercentageSuffix = false;
    benefitDollars = BenefitDollars;
    amountTypeVal: string;
    amountControlValue: string;
    regexForAmount: string;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<EditBenefitDollarModalComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: FlexDollar,
    ) {}

    /**
     * initialize edit benefit dollar modal form
     */
    ngOnInit(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regex) => {
            this.regexForAmount = regex.BENEFITDOLLARAMOUNT;
            this.constructFormControls();
        });
    }

    /**
     * construct form controls for creating or editing benefit dollars
     */
    constructFormControls(): void {
        this.offeringForm = this.fb.group({
            contributionType: [""],
            amount: [
                "",
                [
                    Validators.required,
                    Validators.min(MIN_AMOUNT),
                    // Regex for maximum 10 digits and maximum 2 decimal places
                    Validators.pattern(new RegExp(this.regexForAmount)),
                    this.validateFlatAmount(),
                ],
            ],
            percentageAmount: ["", [Validators.required, Validators.min(MIN_PERCENTAGE_AMOUNT), Validators.max(PERCENTAGE_MAX)]],
        });
        this.offeringForm.controls.contributionType.patchValue(this.data.contributionType);
        this.amountControlValue = this.data.contributionType === ContributionType.FLAT_AMOUNT ? AMOUNT : PERCENTAGE_AMOUNT;
        this.amountTypeVal =
            this.data.contributionType === ContributionType.FLAT_AMOUNT
                ? this.benefitDollars.FLAT_AMOUNT
                : this.benefitDollars.PERCENTAGE_AMOUNT;
        this.setDefaultValues(this.data.amount);
    }

    /**
     * handle change on contribution type radio buttons
     * @param event its an event to get the value of radio-button at that instance
     */
    changeAmountType(event: string): void {
        if (event) {
            this.amountTypeVal = event;
            this.updateValidations();
            this.offeringForm.get(CONTRIBUTION_TYPE).patchValue(this.amountTypeVal);
            this.amountControlValue = this.benefitDollars.FLAT_AMOUNT ? AMOUNT : PERCENTAGE_AMOUNT;
            if (this.offeringForm.get(this.amountControlValue).value === "") {
                this.setDefaultValues();
            }
        }
    }
    /**
     * method to handle amount form-control validations based on radio button selection
     */
    updateValidations(): void {
        const percentageVal = this.offeringForm.controls.percentageAmount.value;
        const digitsAfterDecimal = percentageVal.toString().split(".")[AFTER_DECIMAL];
        if (this.amountTypeVal === this.benefitDollars.FLAT_AMOUNT) {
            this.amountControlValue = AMOUNT;
            if (!this.offeringForm.controls.percentageAmount.valid) {
                this.offeringForm.controls.percentageAmount.reset();
            }
            this.offeringForm.controls.amount.markAsPristine();
            this.offeringForm.controls.percentageAmount.clearValidators();
            this.offeringForm.controls.amount.setValidators([
                Validators.required,
                Validators.min(MIN_AMOUNT),
                Validators.pattern(new RegExp(this.regexForAmount)),
                this.validateFlatAmount(),
            ]);
        } else {
            this.amountControlValue = PERCENTAGE_AMOUNT;
            if (!this.offeringForm.controls.amount.valid) {
                this.offeringForm.controls.amount.reset();
            }
            if (percentageVal && digitsAfterDecimal && digitsAfterDecimal.length > FIXING_VALUE) {
                this.offeringForm.controls.percentageAmount.patchValue(percentageVal.toFixed(FIXING_VALUE));
            }

            this.offeringForm.controls.percentageAmount.markAsPristine();
            this.offeringForm.controls.amount.clearValidators();
            this.offeringForm.controls.percentageAmount.setValidators([
                Validators.required,
                Validators.min(MIN_PERCENTAGE_AMOUNT),
                Validators.max(PERCENTAGE_MAX),
            ]);
        }
        this.offeringForm.controls.amount.updateValueAndValidity();
        this.offeringForm.controls.percentageAmount.updateValueAndValidity();
    }

    /**
     * set default values for the amount fields
     * @param presetValue use this on initial load
     */
    setDefaultValues(presetValue?: number): void {
        const defaultAmount = presetValue ? presetValue : 0;
        this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
            ? this.offeringForm.controls.amount.patchValue(+defaultAmount.toFixed(FIXING_VALUE))
            : this.offeringForm.controls.percentageAmount.patchValue(defaultAmount);
    }

    /**
     * edit the benefit dollar in question
     */
    onSubmit(): void {
        const isFormValid =
            this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
                ? this.offeringForm.controls.amount.valid
                : this.offeringForm.controls.percentageAmount.valid;
        if (isFormValid) {
            this.data.contributionType = this.offeringForm.controls.contributionType.value;
            this.data.amount =
                this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
                    ? this.offeringForm.controls.amount.value
                    : this.offeringForm.controls.percentageAmount.value;
            this.data.amount = Math.round(this.data.amount * ROUND_FACTOR) / ROUND_FACTOR;
            this.dialogRef.close(this.data);
        }
    }

    /**
     * @function restrictNegativeValue
     * @description restricts minus in the input
     * @param event holds the keypress event object
     * @memberof EditBenefitDollarModalComponent
     */
    restrictNegativeValue(event: KeyboardEvent): void {
        if (event.key === "-") {
            event.preventDefault();
        }
    }
    /**
     * Function used to validate flat amount to set the error messages
     * @returns validation error
     */
    validateFlatAmount(): ValidatorFn {
        return (c: AbstractControl): { [key: string]: boolean } | null => {
            const flagError = Number.isInteger(c.value) && c.value.toString().length > MIN_LENGTH_FLAT_AMOUNT;
            if (flagError) {
                return { flagError };
            }
            return null;
        };
    }

    /**
     * unsubscribe subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
