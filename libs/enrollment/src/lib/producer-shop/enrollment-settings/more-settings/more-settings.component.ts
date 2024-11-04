import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { PayFrequency, SettingsDropdownName, Gender, ConfigName } from "@empowered/constants";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { combineLatest, merge, Observable, Subject } from "rxjs";
import { distinctUntilChanged, map, mapTo, startWith, takeUntil, tap } from "rxjs/operators";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { DisplayGender, SymbolOrUnit } from "./more-settings.model";
import { MoreSettings } from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import { UrlFlow } from "../../producer-shop.model";
import { AsyncStatus, IncomeRate, INITIAL_INCOME_RATE, TobaccoInformation, WEEKS_PER_YEAR } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-producer-shop-more-settings",
    templateUrl: "./more-settings.component.html",
    styleUrls: ["./more-settings.component.scss"],
})
export class MoreSettingsComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;

    // #region Binding Enums to allow access to template
    incomeRateEnum = IncomeRate;
    symbolOrUnit = SymbolOrUnit;
    // #endregion

    payFrequencies$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedPayFrequencies));
    genderDisplays$ = this.ngrxStore
        .onAsyncValue(select(SharedSelectors.getAllGenders))
        .pipe(map((genders) => this.getGenderDisplays(genders)));

    mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    selectedMoreSettings$ = this.producerShopComponentStoreService.selectMoreSettingsOnAsyncValue();
    selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    // Config to enable the tobacco status in more settings
    private readonly isTobaccoFormEnabled$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getTobaccoConfigValue));

    ageRepositionConfigEnabled$ = this.staticUtilService.cacheConfigEnabled(ConfigName.AGE_REPOSITION_CONFIG);

    // FormControls are being created since we have nested FormGroups (Main form and Tobacco form)
    // To better set the each FormControl to the correct FormGroup,
    // FormControls are created separately from when FormGroups are created
    payFrequency = this.fb.control(null, Validators.required);
    incomeRate = this.fb.control(INITIAL_INCOME_RATE, Validators.required);
    annualTotal = this.fb.control("");
    hourlyWage = this.fb.control("");
    hoursPerWeek = this.fb.control("");
    weeksPerYear = this.fb.control(WEEKS_PER_YEAR, Validators.required);
    hourlyTotal = this.fb.control("");
    memberAge = this.fb.control("", Validators.required);
    spouseAge = this.fb.control("");
    memberGender = this.fb.control("", Validators.required);
    spouseGender = this.fb.control("");
    numberOfDependentsExcludingSpouse = this.fb.control("", Validators.required);

    memberIsTobaccoUser = this.fb.control(false, Validators.required);
    spouseIsTobaccoUser = this.fb.control(false, Validators.required);

    // All FormControls that don't involve tobacco
    mainForm: FormGroup = this.fb.group({
        payFrequency: this.payFrequency,
        incomeRate: this.incomeRate,
        annualTotal: this.annualTotal,
        hourlyWage: this.hourlyWage,
        hoursPerWeek: this.hoursPerWeek,
        weeksPerYear: this.weeksPerYear,
        hourlyTotal: this.hourlyTotal,
        memberAge: this.memberAge,
        spouseAge: this.spouseAge,
        memberGender: this.memberGender,
        spouseGender: this.spouseGender,
        numberOfDependentsExcludingSpouse: this.numberOfDependentsExcludingSpouse,
    });

    // All FormControls that involves tobacco
    tobaccoForm = this.fb.group({
        memberIsTobaccoUser: this.memberIsTobaccoUser,
        spouseIsTobaccoUser: this.spouseIsTobaccoUser,
    });

    // form has two FormGroups to better handle disabling tobacco FormControls vs non-tobacco FormControls
    form: FormGroup = this.fb.group({
        mainForm: this.mainForm,
        tobaccoForm: this.tobaccoForm,
    });

    // Handles hide / show for Annual vs Hourly inputs
    readonly incomeRate$: Observable<{ value: IncomeRate | null }>;

    // Disabled form message that shows when mainForm is disabled
    disabledFormMessage: string;

    // Translations
    languageStrings: Record<string, string>;

    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    // Used to detect when to revert FormGroup
    private readonly onRevert$ = new Subject<void>();
    // Used to detect when to reset FormGroup
    private readonly onReset$ = new Subject<void>();
    // Used to detect when to apply FormGroup
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();
    showResetButton$!: Observable<boolean>;

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly router: Router,
        private readonly ngrxStore: NGRXStore,
        private readonly appFlowService: AppFlowService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.MORE);

        // Translations
        this.languageStrings = this.getLanguageStrings();

        // Disabled form message that shows when mainForm is disabled
        this.disabledFormMessage = this.getDisabledFormMessage(this.languageStrings);

        combineLatest([
            // Enable / disable main form (everything except tobacco related FormControls)
            // Based on whether or not there is a selected mpGroup
            this.mpGroup$,
            this.selectedMoreSettings$.pipe(map(({ spouseAge }) => !!spouseAge)),
            this.isTobaccoFormEnabled$,
        ])
            .pipe(
                tap(([mpGroup, spouseExists, isTobaccoFormEnabled]) => {
                    this.setFormDisabledState(!mpGroup, mpGroup && spouseExists, isTobaccoFormEnabled);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Determines which set of inputs for income are shown (Annual vs Hourly)
        this.incomeRate$ = merge(
            // Update whenever incomeRate value changes on the FormGroup
            this.incomeRate.valueChanges,
            // Or update whenever ComponentStore updates
            this.selectedMoreSettings$.pipe(map(({ incomeRate }) => incomeRate)),
        ).pipe(
            distinctUntilChanged(),
            map((value) => ({ value })),
            startWith({ value: INITIAL_INCOME_RATE }),
        );

        // Listen for values from NGRX store to populate forms.
        // Handle initializing / reverting form
        combineLatest([
            // Reset happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // Reset form whenever revert button is clicked
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            this.selectedMoreSettings$,
            this.selectedTobaccoInformation$,
            this.incomeRate$,
        ])
            .pipe(
                // Ignore first value since we don't case about the value emitted by onRevert$
                tap(([revert, moreSettings, tobaccoInformation, incomeRate]) => {
                    this.initializeForm(moreSettings, tobaccoInformation, incomeRate.value);

                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Call base class instance's onInit.
     */
    ngOnInit(): void {
        super.onInit();

        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.placeholderSelect",
            "primary.portal.accountPendingEnrollments.employee",
            "primary.portal.customer.title.single",
            "primary.portal.shopQuote.specificPersonDisabledQuoteSettingsMessage",
            "primary.portal.coverage.unknown",
            "primary.portal.register.personalInfo.male",
            "primary.portal.register.personalInfo.female",
            "primary.portal.shoppingExperience.dependentInfo",
        ]);
    }

    /**
     * Uses a Languages Record to get which disabled form message to show based on url
     *
     * @param languageStrings source of translations
     * @returns {string} Disabled message for mon-alert when main form is disabled
     */
    getDisabledFormMessage(languageStrings: Record<string, string>): string {
        // If url relates to payroll, user is an Employee. Else user is a Customer
        const translationBasedOnUrl = this.router.url.includes(UrlFlow.PAYROLL)
            ? languageStrings["primary.portal.accountPendingEnrollments.employee"]
            : languageStrings["primary.portal.customer.title.single"];

        // Return message to prompt user to go to settings for <type> profile based on url
        return languageStrings["primary.portal.shopQuote.specificPersonDisabledQuoteSettingsMessage"].replace(
            "#type",
            translationBasedOnUrl.toLowerCase(),
        );
    }

    /**
     * Set the state of FormGroup
     *
     * @param moreSettings {MoreSettings} - initializes main form
     * @param tobaccoInformation {TobaccoInformation} - initalizes tobacco form
     * @param incomeRate {IncomeRate} - hide / show annual / hourly inputs
     */
    initializeForm(moreSettings: MoreSettings, tobaccoInformation: TobaccoInformation, incomeRate: IncomeRate): void {
        this.mainForm.setValue({
            payFrequency: moreSettings.payFrequency ?? null,
            incomeRate: incomeRate ?? null,
            annualTotal: moreSettings.annualTotal ?? null,
            hourlyWage: moreSettings.hourlyWage ?? null,
            hoursPerWeek: moreSettings.hoursPerWeek ?? null,
            weeksPerYear: WEEKS_PER_YEAR,
            hourlyTotal: moreSettings.hourlyTotal ?? null,
            memberAge: moreSettings.memberAge ?? null,
            spouseAge: moreSettings.spouseAge ?? null,
            memberGender: moreSettings.memberGender ?? null,
            spouseGender: moreSettings.spouseGender ?? null,
            numberOfDependentsExcludingSpouse: moreSettings.numberOfDependentsExcludingSpouse ?? null,
        });

        this.tobaccoForm.setValue({
            memberIsTobaccoUser: tobaccoInformation.memberIsTobaccoUser,
            spouseIsTobaccoUser: tobaccoInformation.spouseIsTobaccoUser,
        });
    }

    // #region form enable / disable helpers

    /**
     * Enables / disables main form
     *
     * @param enableMainForm {boolean} that determines if main form is enabled (excluding tobacco checkboxes)
     * @param spouseExists {boolean} if true, enable spouse tobacco checkbox
     */
    setFormDisabledState(enableMainForm: boolean, spouseExists: boolean, isTobaccoFormEnabled: boolean): void {
        if (enableMainForm) {
            this.mainForm.enable();
        } else {
            this.mainForm.disable();
        }
        if (isTobaccoFormEnabled) {
            this.tobaccoForm.enable();
            if (!spouseExists) {
                this.spouseIsTobaccoUser.disable();
            }
        } else {
            this.tobaccoForm.disable();
        }
    }

    // #endregion

    /**
     * Provides language strings for each known gender enum value.
     * Falls back to enum value if no known translation is found.
     *
     * @params genders {Gender[]} - gender values that come from static endpoint
     */
    getGenderDisplays(genders: Gender[]): DisplayGender[] {
        const displayMap = {
            [Gender.MALE]: this.languageStrings["primary.portal.register.personalInfo.male"],
            [Gender.FEMALE]: this.languageStrings["primary.portal.register.personalInfo.female"],
            [Gender.UNKNOWN]: this.languageStrings["primary.portal.coverage.unknown"],
        };

        return genders.map((gender) => ({
            gender,
            display: displayMap[gender] ?? gender,
        }));
    }

    // #region abstract method implementations for SettingsDropdownContent

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
        this.portalRef?.hide();
    }

    /**
     * Uses form value to set latest tobacco status. Should close dropdown.
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();

        if (!this.form.valid) {
            return;
        }

        if (!this.mainForm.disabled) {
            const moreSettings: MoreSettings = {
                incomeRate: this.mainForm.value.incomeRate,
                payFrequency: this.mainForm.value.payFrequency,
                annualTotal: this.mainForm.value.annualTotal,
                hourlyWage: this.mainForm.value.hourlyWage,
                hoursPerWeek: this.mainForm.value.hoursPerWeek,
                hourlyTotal: this.mainForm.value.hourlyTotal,
                memberAge: this.mainForm.value.memberAge,
                spouseAge: this.mainForm.value.spouseAge,
                memberGender: this.mainForm.value.memberGender,
                spouseGender: this.mainForm.value.spouseGender,
                numberOfDependentsExcludingSpouse: this.mainForm.value.numberOfDependentsExcludingSpouse,
            };

            this.producerShopComponentStoreService.setMoreSettings({
                status: AsyncStatus.SUCCEEDED,
                value: moreSettings,
                error: null,
            });
        }

        if (!this.tobaccoForm.disabled) {
            const tobaccoInformation: TobaccoInformation = {
                memberIsTobaccoUser: this.tobaccoForm.value.memberIsTobaccoUser ?? false,
                spouseIsTobaccoUser: this.tobaccoForm.value.spouseIsTobaccoUser ?? false,
            };

            this.producerShopComponentStoreService.setTobaccoInformation({
                status: AsyncStatus.SUCCEEDED,
                value: tobaccoInformation,
                error: null,
            });

            // Handle state outside of the rewrite for tobacco information
            this.appFlowService.setLatestTobaccoStatus({
                tobaccoUser: this.memberIsTobaccoUser.value,
                spouseTobaccoUser: this.spouseIsTobaccoUser.value,
                employeeTobaccoUpdated: this.memberIsTobaccoUser.dirty,
                spouseTobaccoUpdated: this.spouseIsTobaccoUser.dirty,
            });
        }

        this.portalRef?.hide();

        this.onApply$.next();
    }

    // #endregion

    /**
     * Returns unique identifier for PayFrequency.
     * trackBy for *ngFor involving PayFrequency used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param payFrequency {PayFrequency} current PayFrequency in iteration
     * @returns unique identifier for PayFrequency
     */
    trackByPayFrequencyName(index: number, payFrequency: PayFrequency): string {
        return payFrequency.name;
    }

    /**
     * Returns unique identifier for DisplayGender.
     * trackBy for *ngFor involving DisplayGender used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param displayGender {DisplayGender} current DisplayGender in iteration
     * @returns unique identifier for DisplayGender
     */
    trackByDisplayGenderDisplay(index: number, displayGender: DisplayGender): string {
        return displayGender.display;
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
