import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { select } from "@ngrx/store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, mapTo, startWith, takeUntil, tap } from "rxjs/operators";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { RiskClassFormValues } from "./occupation-class.model";
import { AsyncStatus, RiskClass, SettingsDropdownName, RatingCode } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-occupation-class",
    templateUrl: "./occupation-class.component.html",
    styleUrls: ["./occupation-class.component.scss"],
})
export class OccupationClassComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;

    form: FormGroup;
    riskClassesFormArray: FormArray;

    // Translations
    languageStrings: Record<string, string>;

    // Used for getting the current Account RatingCode
    account$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedAccount));

    // Used to populate list of radio buttons
    possibleRiskClassSets$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedPossibleRiskClassSets));
    selectedRiskClasses$ = this.producerShopComponentStoreService.selectRiskClassesOnAsyncValue();

    // Used to get default value for radio button groups and labels
    riskClassFormValues$ = combineLatest([this.possibleRiskClassSets$, this.selectedRiskClasses$, this.account$]).pipe(
        map(([riskClassSets, defaultRiskClasses, account]) =>
            this.getRiskClassFormValues(riskClassSets, defaultRiskClasses, account.ratingCode),
        ),
    );

    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    // Used to detect when to revert FormGroup
    private readonly onRevert$ = new Subject<void>();
    private readonly onReset$ = new Subject<void>();
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();
    showResetButton$!: Observable<boolean>;

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly ngrxStore: NGRXStore,
        private readonly formBuilder: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.OCCUPATION);

        this.riskClassesFormArray = this.formBuilder.array([]);

        this.form = formBuilder.group({
            riskClasses: this.riskClassesFormArray,
        });
    }

    /**
     * Gets translations
     *
     * Setups up data flow for FormGroup
     *
     * Starts listener for for revert
     */
    ngOnInit(): void {
        super.onInit();

        // Get translations
        this.languageStrings = this.getLanguageStrings();

        // Handle initalizing and reverting form
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.riskClassFormValues$])
            .pipe(
                // Ignore first value since we don't case about the value emitted by onRevert$
                tap(([revert, riskClassFormValues]) => {
                    this.initializeForm(riskClassFormValues);

                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }, takeUntil(this.unsubscriber$)),
            )
            .subscribe();

        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Used to set the values of FormGroup
     *
     * @param riskClassFormValues {RiskClassFormValues[]} includes values used to default the values of the FormGroup and provide labels
     */
    initializeForm(riskClassFormValues: RiskClassFormValues[]): void {
        // Remove all existing FormControls from FormArray
        this.riskClassesFormArray.clear();

        // Populate FormArray with FormControls for each default RiskClass
        for (const riskClassFormValue of riskClassFormValues) {
            const formControl = this.formBuilder.control(riskClassFormValue.defaultRiskClass, Validators.required);
            this.riskClassesFormArray.push(formControl);
        }
    }

    /**
     * Used to get values to populate FormArray and populate template with labels as needed.
     * Currently the only radio button groups that use labels is RatingCode.DUAL
     *
     * @param riskClassSets source of all possible RiskClasses for each radio button group
     * @param ratingCode RatingCode that is expected to be related to current Account
     * @returns {Observable<RiskClassFormValues[]>} values to populate FormArray and labels used in template
     */
    getRiskClassFormValues(riskClassSets: RiskClass[][], defaultRiskClasses: RiskClass[], ratingCode?: RatingCode): RiskClassFormValues[] {
        if (ratingCode === RatingCode.STANDARD || ratingCode === RatingCode.PEO) {
            // For RatingCode.STANDARD and RatingCode.PEO, we expect only one set of riskClasses,
            // so we can pass the first one only
            return [{ riskClasses: riskClassSets[0], defaultRiskClass: defaultRiskClasses[0] }];
        }

        if (ratingCode === RatingCode.DUAL) {
            // For RatingCode.DUAL, we expect the first set of riskClasses to be for ProductId.ACCIDENT.
            // and the second set of riskClasses to be for ProductId.SHORT_TERM_DISABILITY
            const [accidentRiskClasses, stdRiskClasses] = riskClassSets;
            const [defaultAccidentRiskClass, defaultSTDRiskClass] = defaultRiskClasses;

            // DUAL RiskClass radio groups have labels unlike STANDARD and PEO
            const accidentLabel = this.languageStrings["primary.portal.shoppingCart.quoteLevelSettings.subHeader.accidentClass"];
            const stdLabel = this.languageStrings["primary.portal.shoppingCart.quoteLevelSettings.subHeader.stdClass"];

            return [
                {
                    defaultRiskClass: defaultAccidentRiskClass,
                    riskClasses: accidentRiskClasses,
                    label: accidentLabel,
                },
                { defaultRiskClass: defaultSTDRiskClass, riskClasses: stdRiskClasses, label: stdLabel },
            ];
        }

        // Fallback to returning nothing so no form is shown in dropdown
        return [];
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingCart.quoteLevelSettings.subHeader.accidentClass",
            "primary.portal.shoppingCart.quoteLevelSettings.subHeader.stdClass",
        ]);
    }

    /**
     * Checks FormGroup for validity then closes dropdown if FormGroup is valid
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();

        if (!this.form.valid) {
            return;
        }

        const selectedRiskClasses: RiskClass[] = this.riskClassesFormArray.value;

        this.producerShopComponentStoreService.setRiskClasses({
            status: AsyncStatus.SUCCEEDED,
            value: selectedRiskClasses,
            error: null,
        });

        // Close dropdown
        this.portalRef?.hide();

        this.onApply$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to revert FormGroup.
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Used to call revert on hidden.
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Not used.
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onRevert$.next();
        this.portalRef?.hide();
    }

    /**
     * Returns unique identifier for RiskClass.
     * trackBy for *ngFor involving RiskClass used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param riskClass {RiskClass} current city in iteration
     * @returns unique identifier for RiskClass
     */
    trackByRiskClassName(index: number, riskClass: RiskClass): string {
        return riskClass.name;
    }

    /**
     * Call base class instance's ngOnDestroy.
     *
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
