import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NgControl } from "@angular/forms";
import { ProductId, RateSheetBenefitAmount } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { Observable, Subject, combineLatest } from "rxjs";
import { map, takeUntil, tap } from "rxjs/operators";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-benefit-amounts",
    templateUrl: "./benefit-amounts.component.html",
    styleUrls: ["./benefit-amounts.component.scss"],
})
export class BenefitAmountsComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() benefitAmountOptions: RateSheetBenefitAmount[] = [];
    @Input() disableBenefitAmountOptions: boolean[];
    @Input() requiredBenefitAmountsSelection: boolean[];
    @Input() minimumBenefitAmounts: RateSheetBenefitAmount[] = [];
    selectedBenefitAmount;

    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    isStdProduct$ = this.selectedProduct$.pipe(map((product) => product?.product.id === ProductId.SHORT_TERM_DISABILITY));
    isWholeAndTermLifeProduct$: Observable<boolean> = this.selectedProduct$.pipe(
        map((product) => product?.product.id === ProductId.WHOLE_LIFE || product?.product.id === ProductId.TERM_LIFE),
    );
    isOtherProductSelected$: Observable<boolean> = combineLatest([this.isWholeAndTermLifeProduct$, this.isStdProduct$]).pipe(
        map(([isWholeAndTermLifeProduct, isStdProduct]) => !(isWholeAndTermLifeProduct || isStdProduct)),
    );

    protected unsubscribe$ = new Subject<void>();

    benefitAmountFormControl: FormControl | FormGroup = this.formBuilder.control("");
    toolTipMessage = "";
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.rateSheets.minBenefitAmount",
        "primary.portal.rateSheets.maxBenefitAmount",
        "primary.portal.rateSheets.disabled.checkbox.message",
        "primary.portal.common.placeholderSelect",
        "primary.portal.rateSheets.stdProduct.max.benefitAmount.disabled.tooltip.message",
    ]);
    isMaxBenefitAmountDisabled = true;
    maxBenefitAmountOptions: RateSheetBenefitAmount[] = [];
    isStdProduct = false;
    isWholeLifeTermLifeProduct = false;
    onChange: (value: string) => void;
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly languageService: LanguageService,
        public ngControl: NgControl,
        private readonly ngrxStore: NGRXStore,
    ) {
        this.isStdProduct$.pipe(takeUntil(this.unsubscribe$)).subscribe((isStdProduct) => {
            this.isStdProduct = isStdProduct;
            if (isStdProduct) {
                this.benefitAmountFormControl = this.formBuilder.group({
                    minBenefitAmount: [],
                    maxBenefitAmount: [],
                });
                this.toolTipMessage =
                    this.languageStrings["primary.portal.rateSheets.stdProduct.max.benefitAmount.disabled.tooltip.message"];
            } else {
                this.benefitAmountFormControl = this.formBuilder.group({
                    benefitAmountSelected: [],
                });
                this.toolTipMessage = this.languageStrings["primary.portal.rateSheets.disabled.checkbox.message"].replace(
                    "##selection##",
                    "benefit period(s)",
                );
            }
        });
        this.isWholeAndTermLifeProduct$.pipe(takeUntil(this.unsubscribe$)).subscribe((wholeLifeProduct) => {
            this.isWholeLifeTermLifeProduct = wholeLifeProduct;
        });
        ngControl.valueAccessor = this;
    }

    ngOnInit(): void {
        this.ngControl.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((status) => {
            if (this.isStdProduct) {
                if (this.ngControl.errors?.invalid) {
                    this.benefitAmountFormControl.get("minBenefitAmount")?.setErrors(this.ngControl.errors);
                    this.benefitAmountFormControl.get("maxBenefitAmount")?.setErrors(this.ngControl.errors);
                } else if (this.ngControl.errors?.required) {
                    this.benefitAmountFormControl.get("minBenefitAmount")?.setErrors(this.ngControl.errors);
                }
                if (status === "TOUCHED" || status === "INVALID") {
                    this.benefitAmountFormControl.markAllAsTouched();
                }
            } else {
                if (this.ngControl.errors) {
                    this.benefitAmountFormControl.get("benefitAmountSelected").setErrors(this.ngControl.errors);
                    if (status === "TOUCHED") {
                        this.benefitAmountFormControl.markAllAsTouched();
                    }
                }
            }
        });
        this.benefitAmountFormControl
            ?.get("maxBenefitAmount")
            ?.valueChanges.pipe(
                tap((value) => {
                    this.benefitAmountFormControl.get("maxBenefitAmount")?.setValue(value, { emitEvent: false });
                    this.onChange(this.benefitAmountFormControl.value);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.benefitAmountFormControl
            ?.get("minBenefitAmount")
            ?.valueChanges.pipe(
                tap((value) => {
                    this.isMaxBenefitAmountDisabled = false;
                    this.getMaxBenefitAmounts(value.amount);
                    if (this.maxBenefitAmountOptions[this.maxBenefitAmountOptions?.length - 1]) {
                        this.benefitAmountFormControl.setValue(
                            {
                                minBenefitAmount: value,
                                maxBenefitAmount: this.maxBenefitAmountOptions[this.maxBenefitAmountOptions?.length - 1],
                            },
                            { emitEvent: false },
                        );
                    }
                    this.onChange(this.benefitAmountFormControl.value);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.benefitAmountFormControl
            ?.get("benefitAmountSelected")
            ?.valueChanges.pipe(
                tap((value) => {
                    if (value === undefined) {
                        return;
                    }
                    if (this.isWholeLifeTermLifeProduct) {
                        this.benefitAmountFormControl?.get("benefitAmountSelected").setValue(value, { emitEvent: false });
                        this.onChange(this.benefitAmountFormControl.value);
                    } else if (!this.isStdProduct) {
                        this.onChange(value);
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Gets max benefit amounts
     * @param minBenefitAmount that is selected
     */
    getMaxBenefitAmounts(minBenefitAmount: number) {
        let matchedIndex = false;
        let matchingIndex = 0;
        this.maxBenefitAmountOptions = this.minimumBenefitAmounts.filter((benefitAmount, i) => {
            if (benefitAmount.amount === minBenefitAmount) {
                matchedIndex = true;
                matchingIndex = i;
            }
            if (matchedIndex && i <= matchingIndex + 9) {
                return true;
            }
            return false;
        });
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: RateSheetBenefitAmount[]): void {
        if (value === undefined) {
            return;
        }
        if (value["benefitAmountSelected"]) {
            this.benefitAmountFormControl?.get("benefitAmountSelected")?.setValue(value["benefitAmountSelected"]);
            return;
        }
        if (value["minBenefitAmount"]) {
            this.benefitAmountFormControl?.get("minBenefitAmount")?.setValue(value["minBenefitAmount"]);
            this.benefitAmountFormControl?.get("maxBenefitAmount")?.setValue(value["maxBenefitAmount"]);
            this.isMaxBenefitAmountDisabled = this.benefitAmountFormControl?.get("maxBenefitAmount")?.value?.amount ? false : true;
            this.getMaxBenefitAmounts(this.benefitAmountFormControl?.get("minBenefitAmount")?.value?.amount);
            return;
        }
        this.benefitAmountFormControl?.get("benefitAmountSelected")?.setValue(value);
    }

    /**
     * ControlValueAccessor interface function, sets the onChange function
     *
     * @param fn The onChange Function
     */
    registerOnChange(fn: () => void): void {
        this.onChange = fn;
    }

    /**
     * ControlValueAccessor interface function, sets the onTouched Function
     *
     * @param fn The onTouched Function
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
