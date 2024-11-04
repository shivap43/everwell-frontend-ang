import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AsyncStatus,
    CarrierId,
    CombinedOfferings,
    DateFormat,
    DateFormats,
    SettingsDropdownName,
    HasCoverageDates,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SharedService } from "@empowered/common-services";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { combineLatest, Observable, Subject } from "rxjs";
import { filter, map, mapTo, startWith, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ProductCoverageDate } from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { DEFAULT_DATEPICKER_SHARED_COVERAGE_DATES_VALUE, DEFAULT_USE_SHARED_COVERAGE_DATES_VALUE } from "./coverage-dates.constant";
import { CoverageDatePickerFormValues, HasCoverageDateMoments, HasProductCoverageDates } from "./coverage-dates.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { DateService } from "@empowered/date";
import { DatePipe } from "@angular/common";

@Component({
    selector: "empowered-coverage-dates",
    templateUrl: "./coverage-dates.component.html",
    styleUrls: ["./coverage-dates.component.scss"],
})
export class CoverageDatesComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef!: DropDownPortalComponent;

    // Date format used for displaying dates when using DatePipe to handling date strings
    readonly DateFormats = DateFormats;
    // Used to filter out the last days of the month (29, 30, 31) for datepickers
    readonly dateClass = this.sharedService.dateClass;

    // Selected coverage dates for each product using ProducerShopComponentStore
    readonly selectedProductCoverageDates$ = this.producerShopComponentStoreService.selectProductCoverageDatesOnAsyncValue();

    readonly combinedOfferings$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedCombinedOfferings));

    // Filter any combinedOfferings where product doesn't have carrierId CarrierId.AFLAC or CarrierId.AFLAC_GROUP
    readonly aflacCombinedOfferings$ = this.combinedOfferings$.pipe(
        map((combinedOfferings) => combinedOfferings.filter((combinedOffering) => this.isAflacProduct(combinedOffering))),
    );
    // Used to present alert message about Non-Aflac coverage dates
    readonly nonAflacProductExists$ = this.combinedOfferings$.pipe(
        map((combinedOfferings) => combinedOfferings.some((combinedOffering) => !this.isAflacProduct(combinedOffering))),
    );

    /**
     * Combines combinedOfferings ngrx selector with selected product coverage dates
     */
    readonly productCoverageDates$ = combineLatest([this.aflacCombinedOfferings$, this.selectedProductCoverageDates$]).pipe(
        map(([combinedOfferings, selectedProductCoverageDates]) =>
            this.getProductCoverageDates(combinedOfferings, selectedProductCoverageDates),
        ),
    );

    /**
     * Used to populate the shared Datepicker since it uses the earliest coverage dates (including min/max range)
     */
    readonly earliestCoverageDates$ = this.productCoverageDates$.pipe(
        map((productCoverageDates) => this.getEarliestCoverageDates(productCoverageDates)),
    );
    // Filter any combinedOfferings where product doesn't have carrierId CarrierId.AFLAC or CarrierId.AFLAC_GROUP
    readonly nonAflacProductOfferings$ = this.combinedOfferings$.pipe(
        map((combinedOfferings) => combinedOfferings.filter((combinedOffering) => !this.isAflacProduct(combinedOffering))),
    );

    // #region transformed values from NGRX store
    readonly coverageDateFormValueSets$: Observable<CoverageDatePickerFormValues[]>;
    readonly sharedCoverageDateFormValues$: Observable<CoverageDatePickerFormValues>;
    // #endregion

    // #region FormGroup members
    readonly coverageDatesArray: FormArray = this.fb.array([]);
    readonly sharedDatePicker: FormControl = new FormControl(DEFAULT_DATEPICKER_SHARED_COVERAGE_DATES_VALUE, Validators.required);
    readonly useSharedDatePicker: FormControl = new FormControl(DEFAULT_USE_SHARED_COVERAGE_DATES_VALUE, Validators.required);
    readonly form: FormGroup = this.fb.group({
        coverageDates: this.coverageDatesArray,
        sharedCoverageDate: this.sharedDatePicker,
    });
    // #endregion

    // Translations
    readonly languageStrings: Record<string, string> = this.getLanguageStrings();

    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should reset
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should apply
    private readonly onApply$ = new Subject<void>();
    // Used to determine when FormGroup should show
    private readonly onShow$ = new Subject<void>();
    // Used to determine when reset button should show/hide
    showResetButton$!: Observable<boolean>;

    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly datePipe: DatePipe,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.DATES);

        /**
         * Data stream used for shared Datepicker
         *
         * This Datepicker is used to update all Datepickers at the same time when useSharedDatePicker is true
         */
        this.sharedCoverageDateFormValues$ = this.earliestCoverageDates$.pipe(
            map((earliestCoverageDates) =>
                this.getCovageDatePickerFormValues(this.languageStrings["primary.portal.shopquote.coveragestart"], earliestCoverageDates),
            ),
        );

        /**
         * Data stream used for each individual datepicker
         */
        this.coverageDateFormValueSets$ = this.productCoverageDates$.pipe(
            map((productCoverageDates) =>
                productCoverageDates.map((productCoverageDate) =>
                    this.getCovageDatePickerFormValues(productCoverageDate.productName, productCoverageDate.coverageDates),
                ),
            ),
        );

        /**
         * Syncing data streams from NGRX store / selected product coverageDates to FormGroup.
         * Manages values for datepickers:
         * 1. setting default value
         * 2. label
         * 4. needed date strings for error messages
         *
         * Triggers on render and onHide (also marks FormGroup as Pristine when this happens)
         */
        combineLatest([
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            this.sharedCoverageDateFormValues$.pipe(map(({ coverageDateMoments }) => coverageDateMoments)),
            this.coverageDateFormValueSets$.pipe(
                map((coverageDateFormValueSets) => coverageDateFormValueSets.map(({ coverageDateMoments }) => coverageDateMoments)),
            ),
        ])
            .pipe(
                tap(([revertForm, sharedCoverageDateMoments, individualCoverageDateMomentSets]) =>
                    this.setFormGroupValues(revertForm, sharedCoverageDateMoments, individualCoverageDateMomentSets),
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Update all individual Datepickers whenever the shared Datepicker updates
        // This should only happen when useSharedDatePicker.value is true
        this.sharedDatePicker.valueChanges
            .pipe(
                filter(() => !!this.useSharedDatePicker.value),
                tap((sharedCoverageDateMoment) => {
                    // TODO: Remove redundant Date constructor below when EVE-11255 is done
                    this.setAllIndividualDatepickers(this.dateService.toDate(sharedCoverageDateMoment));
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
        this.onReset$
            .pipe(
                tap(() => {
                    // Exit early if FormGroup isn't valid
                    if (!this.form.valid) {
                        return;
                    }
                    this.portalRef?.hide();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Whenever `Apply` is clicked:
        // 1. Update individual Datekpickers if using sharedDatePicker
        // 2. Validate form
        // 3. Update ProducerShopComponentStore
        // 4. Close modal
        this.onApply$
            .pipe(
                withLatestFrom(
                    this.aflacCombinedOfferings$,
                    this.nonAflacProductOfferings$,
                    this.selectedProductCoverageDates$.pipe(startWith([])),
                ),
                tap(([, combinedOfferings, nonAflacProductOfferings, selectedProductCoverageDates]) => {
                    if (this.useSharedDatePicker.value) {
                        // TODO: Remove Redundant Date constructor below when EVE-11255 is done
                        this.setAllIndividualDatepickers(this.dateService.toDate(this.sharedDatePicker.value));
                    }

                    // Trigger for validity and render error messages
                    this.form.markAllAsTouched();

                    // Exit early if FormGroup isn't valid
                    if (!this.form.valid) {
                        return;
                    }

                    // #region update ProducerShopComponentStore
                    // TODO: Remove redundant Date constructor when EVE-11255 is done
                    const productCoverageMoments: Date[] = this.coverageDatesArray.value.map((date) => this.dateService.toDate(date));

                    const nonAflacProductCoverageDates: ProductCoverageDate[] = selectedProductCoverageDates?.filter(
                        (productCoverageDate) =>
                            nonAflacProductOfferings.some(
                                (productOffering) => productCoverageDate.productId === productOffering.productOffering.product.id,
                            ),
                    );
                    const productCoverageDates: ProductCoverageDate[] = productCoverageMoments.map((coverageMoment, index) => ({
                        productId: combinedOfferings[index].productOffering.product.id,
                        productName: combinedOfferings[index].productOffering.product.name,
                        date: this.dateService.format(coverageMoment, DateFormat.YEAR_MONTH_DAY),
                    }));
                    if (nonAflacProductCoverageDates?.length) {
                        productCoverageDates.push(...nonAflacProductCoverageDates);
                    }
                    this.producerShopComponentStoreService.setProductCoverageDates({
                        status: AsyncStatus.SUCCEEDED,
                        value: productCoverageDates,
                        error: null,
                    });
                    // #endregion

                    // Assuming FormGroup is valid, close dropdown
                    this.portalRef?.hide();
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Call SettingsDropdownContent.onInit to initialize dropdown behavior
     */
    ngOnInit(): void {
        super.onInit();

        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Set the FormControls for coverageDatesArray and update the values of the individual datepickers.
     * This should be done without changing the actual reference to the FormArray.
     * This is done by clearing out all the FormControls, then populating the FormArray again after it is empty.
     *
     * @param momentCoverageDateSets {HasCoverageDateMoments[]}
     */
    setCoverageDatesAndCheckSameasDefault(sharedCoverageDate: Date, momentCoverageDateSets: HasCoverageDateMoments[]): boolean {
        // Remove all existing FormControls from FormArray
        this.coverageDatesArray.clear();
        let sameAsDefault = true;

        for (const momentCoverageDates of momentCoverageDateSets) {
            // Populate FormArray with FormControls for each set of CoverageDates
            const formControl = this.fb.control(momentCoverageDates.defaultCoverageStartDate, Validators.required);
            sameAsDefault = this.dateService.isEqual(momentCoverageDates.defaultCoverageStartDate, sharedCoverageDate) && sameAsDefault;
            this.coverageDatesArray.push(formControl);
        }
        return sameAsDefault;
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used for reverting FormGroup on hide.
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     * We are required to provide this method since SettingsDropdownContent is an abstract class.
     *
     * Not used.
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to revert FormGroup
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onRevert();
        this.onReset$.next();
    }

    /**
     * Is used to emit when to submit FormGroup
     */
    onApply(): void {
        this.onApply$.next();
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.invalidDate",
            "primary.portal.shopquote.coveragestart",
            "primary.portal.coverage.minDate",
            "primary.portal.qle.addNewQle.dateCantBeMoreInFuture",
            "primary.portal.common.requiredField",
            "primary.portal.enrollment.coverage-dates.error.cannot-be-end-of-month",
        ]);
    }

    /**
     * Helper function used to convert data coming from the NGRX Store to data specific to this component's functionality.
     * This function is responsible for getting values for the datepicker FormControls
     * and values for generating error messages in the template.
     *
     * @param label {string} text that is above the datepicker input
     * @param combinedOfferings {HasCoverageDates} Coverage date related data coming from NGRX Store
     * @returns {CoverageDatePickerFormValues} data used to set default/min/max values for datepickers and information for error messages
     */
    getCovageDatePickerFormValues(label: string, coverageDates: HasCoverageDates): CoverageDatePickerFormValues {
        // Get all date strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE from CombinedOfferings
        // defaultCoverageStartDate is used to set the default value for the datepickers
        // earliestCoverageStartDate, latestCoverageStartDate is used to set the min and max for the date picker
        const { defaultCoverageStartDate, earliestCoverageStartDate, latestCoverageStartDate } = coverageDates;

        return {
            // sets the text that is above the datepicker input
            label,
            // date strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE
            // These are mainly used with the DatePipe on the template when generating error messages
            coverageDates: { defaultCoverageStartDate, earliestCoverageStartDate, latestCoverageStartDate },
            // date Momement objects
            // These values are used for the datepicker's FormControl. Angular/Material's types
            // for the datepickers use Moment (custom behavior specific to this project)
            coverageDateMoments: {
                defaultCoverageStartDate: this.dateService.toDate(defaultCoverageStartDate),
                earliestCoverageStartDate: this.dateService.toDate(earliestCoverageStartDate),
                latestCoverageStartDate: this.dateService.toDate(latestCoverageStartDate),
            },
            minMaxDateDifference: this.dateService.getDifferenceInDays(this.dateService.toDate(latestCoverageStartDate), new Date()) + 1,
        };
    }

    /**
     * Get HasProductCoverageDates[] using combinedOfferings ngrx state and overrides using selectedProductCoverageDates
     *
     * @param combinedOfferings - Source of HasProductCoverageDates[]
     * @param selectedProductCoverageDates - Overrides combinedOfferings as needed
     * @returns {HasProductCoverageDates[]} returns CoverageDates for each product using combinedOffering,
     * and selectedProductCoverageDates overrides the incoming value from combinedOffering
     */
    getProductCoverageDates(
        combinedOfferings: CombinedOfferings[],
        selectedProductCoverageDates: ProductCoverageDate[],
    ): HasProductCoverageDates[] {
        return combinedOfferings.map((combinedOffering) => {
            const productId = combinedOffering.productOffering.product.id;
            const productName = combinedOffering.productOffering.product.name;

            const selectedCoverageDate =
                selectedProductCoverageDates.find((productCoverageDate) => productCoverageDate.productId === productId)?.date ?? null;

            return {
                productId,
                productName,
                coverageDates: {
                    defaultCoverageStartDate: selectedCoverageDate ?? combinedOffering.defaultCoverageStartDate,
                    earliestCoverageStartDate: combinedOffering.earliestCoverageStartDate,
                    latestCoverageStartDate: combinedOffering.latestCoverageStartDate,
                },
            };
        });
    }

    /**
     * Helper function to return the earliest coverage dates for:
     * 1. earliestCoverageStartDate
     * 2. latestCoverageStartDate
     * 3. defaultCoverageStartDate
     *
     * Used to set date range and default value for shared DateRangePicker.
     * We are considering only Aflac products for getting earliest coverage dates
     *
     * @param productCoverageDates {HasProductCoverageDates[]} source of coverage start dates
     * @returns {HasCoverageDates} the earliest of coverage dates
     */
    getEarliestCoverageDates(productCoverageDates: HasProductCoverageDates[]): HasCoverageDates {
        return {
            earliestCoverageStartDate:
                this.datePipe.transform(
                    this.dateService.min(
                        productCoverageDates.map(({ coverageDates }) =>
                            coverageDates?.earliestCoverageStartDate
                                ? this.dateService.toDate(coverageDates?.earliestCoverageStartDate)
                                : null,
                        ),
                    ),
                    DateFormat.YEAR_MONTH_DAY,
                ) || null,
            latestCoverageStartDate:
                this.datePipe.transform(
                    this.dateService.min(
                        productCoverageDates.map(({ coverageDates }) =>
                            coverageDates?.latestCoverageStartDate ? this.dateService.toDate(coverageDates?.latestCoverageStartDate) : null,
                        ),
                    ),
                    DateFormat.YEAR_MONTH_DAY,
                ) || null,
            defaultCoverageStartDate:
                this.datePipe.transform(
                    this.dateService.min(
                        productCoverageDates.map(({ coverageDates }) =>
                            coverageDates?.defaultCoverageStartDate
                                ? this.dateService.toDate(coverageDates?.defaultCoverageStartDate)
                                : null,
                        ),
                    ),
                    DateFormat.YEAR_MONTH_DAY,
                ) || null,
        };
    }

    /**
     * Update FormGroup state
     *
     * @param revertForm mark FormGroup as pristine to remove dirty/touched flag
     * @param sharedCoverageDateMoments - Moment values used to set value for shared datepicker
     * @param individualCoverageDateMomentSets - Moment values used to set value for each individual datepicker
     */
    setFormGroupValues(
        revertForm: boolean,
        sharedCoverageDateMoments: HasCoverageDateMoments,
        individualCoverageDateMomentSets: HasCoverageDateMoments[],
    ): void {
        // Update the current value of the shared datepicker
        this.sharedDatePicker.setValue(sharedCoverageDateMoments.defaultCoverageStartDate);
        // Update the current values of the individual datepickers

        this.useSharedDatePicker.setValue(
            this.setCoverageDatesAndCheckSameasDefault(
                sharedCoverageDateMoments.defaultCoverageStartDate,
                individualCoverageDateMomentSets,
            ),
        );

        if (revertForm) {
            // Then mark FormGroup as pristine to remove dirty/touched flag
            this.form.markAsPristine();
        }
    }

    /**
     * Handle updating individual datepickers when shared datepicker is updated
     *
     * @param sharedCoverageDateMoment {Moment | null} new shared value
     */
    setAllIndividualDatepickers(sharedCoverageDateMoment: Date | null): void {
        // Get new shared date as string
        const sharedCoverageDateString = sharedCoverageDateMoment
            ? this.dateService.format(sharedCoverageDateMoment, DateFormat.YEAR_MONTH_DAY)
            : null;
        this.coverageDatesArray.controls.forEach((control) => {
            // If there's no new shared moment value from shared datepicker,
            // clear all individual datepickers
            if (!sharedCoverageDateMoment) {
                control.setValue(null);
                return;
            }
            // Update FormControl value with Moment instance based on newDateString
            control.setValue(this.dateService.toDate(sharedCoverageDateString));
            control.markAsTouched();
        });
    }

    /**
     * Checks if Product of CombinedOfferings is an Aflac Product by checking CarrierIds of its Plans.
     * At least one Plan must have an Aflac-related CarrerId. If there aren't any, then it will not be an Aflac Product.
     *
     * @param combinedOffering {CombinedOfferings} Product with its Coverage Dates and PlanOfferings
     * @returns {boolean} Product of CombinedOfferings is an Aflac Product
     */
    isAflacProduct(combinedOffering: CombinedOfferings): boolean {
        if (!combinedOffering.planOfferingsWithCoverageDates.length) {
            return false;
        }
        // Array of all known Aflac-related Carrier Ids
        const aflacCarrierIds = [CarrierId.AFLAC, CarrierId.AFLAC_GROUP];

        // Check for any Plan that has an Aflac-related Carrier Id
        return combinedOffering.planOfferingsWithCoverageDates.some((planOfferingWithCoverageDates) => {
            // Get Product's PlanOffering's Carrier Id
            const planCarrierId = planOfferingWithCoverageDates.planOffering.plan.carrierId;

            // Check if it's Aflac-related Carrier Id
            return aflacCarrierIds.includes(planCarrierId);
        });
    }

    /**
     * Call SettingsDropdownContent.ngOnDestroy
     *
     * Clean up subscriptions
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
