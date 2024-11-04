import { Component, OnInit, OnDestroy, EventEmitter, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Subject, Observable, combineLatest } from "rxjs";
import { takeUntil, filter, tap } from "rxjs/operators";
import { Store, Select } from "@ngxs/store";

import {
    UniversalQuoteState,
    SetQuoteLevelSetting,
    RemovePlanPricing,
    RemoveSelections,
    QuoteSettingsSchema,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { UniversalService } from "../universal.service";

import { ConfigName, PartnerAccountType } from "@empowered/constants";
import { SharedState, RegexDataType } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-more-settings",
    templateUrl: "./more-settings.component.html",
    styleUrls: ["./more-settings.component.scss"],
})
export class MoreSettingsComponent implements OnInit, OnDestroy {
    settings: QuoteSettingsSchema;
    payrollChannel = PartnerAccountType.PAYROLL;
    moreSettingForm: FormGroup;
    salaryForm: FormGroup;
    languageStrings: Record<string, string>;
    genders: string[];
    state: string;
    annual = "annual";
    hourly = "hourly";
    private readonly unsubscribe$ = new Subject<void>();
    numberRegex: RegExp;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;

    ageMaxLength: number;
    sicCodeMaxLength: number;
    eligibleSubscribersMaxLength: number;
    @Output() eligibleSubscribersChanged = new EventEmitter<number>();

    // Set length / value ranges for age and SIC code.
    formConfigs = combineLatest(
        this.staticUtilService.cacheConfigValue(ConfigName.AGE_MAX_LENGTH),
        this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MAX_LENGTH),
        this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MIN_VALUE),
        this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MAX_VALUE),
        this.staticUtilService.cacheConfigValue(ConfigName.ELIGIBLE_EMPLOYEES_MAX_LENGTH),
        this.staticUtilService.cacheConfigValue(ConfigName.ELIGIBLE_EMPLOYEES_MIN_VALUE),
    ).pipe(
        tap(([ageMaxLength, sicCodeMaxLength, sicCodeMin, sicCodeMax, eligibleSubscribersMaxLength, eligibleSubscribersMin]) => {
            this.ageMaxLength = +ageMaxLength;
            this.sicCodeMaxLength = +sicCodeMaxLength;
            this.moreSettingForm.controls.sicCode.setValidators([Validators.min(+sicCodeMin), Validators.max(+sicCodeMax)]);
            this.eligibleSubscribersMaxLength = +eligibleSubscribersMaxLength;
            this.moreSettingForm.controls.eligibleSubscribers.setValidators([Validators.min(+eligibleSubscribersMin)]);
        }),
    );

    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly universalService: UniversalService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Initialize "more" and "salary" forms and regex for validation.
     */
    ngOnInit(): void {
        this.getLanguageStrings();
        this.updateGender();

        this.settings = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);

        this.initializeMoreSettingForm(
            this.settings.age,
            this.settings.gender,
            this.settings.sicCode,
            this.settings.zipCode,
            this.settings.tobaccoUser,
            this.settings.spouseAge,
            this.settings.spouseGender,
            this.settings.spouseTobaccoUser,
            this.settings.numberDependentsExcludingSpouse,
            this.settings.eligibleSubscribers,
        );

        // get selected state abbreviation for zip code validation
        const selectedState = this.store
            .selectSnapshot(UniversalQuoteState.GetLevelSettings)
            .states.find((state) => state.name === this.settings.state);
        if (selectedState) {
            this.state = selectedState.abbreviation;
        }

        this.formConfigs.subscribe();

        this.initializeSalaryForm(
            this.settings.salarySelection,
            this.settings.annualSalary,
            this.settings.hourlyRate,
            this.settings.hoursPerWeek,
            this.settings.weeksPerYear,
            this.settings.hourlyAnnually,
        );

        this.regex$
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((data) => data !== null && data !== undefined),
            )
            .subscribe((data) => {
                this.numberRegex = new RegExp(data.NUMERIC);
            });
    }

    /**
     * Initialize the quote level more setting form.
     * @param age employee's age
     * @param gender employee's gender
     * @param sicCode employer's SIC code
     * @param zipCode group's zip code
     * @param tobaccoUser flag to indicate whether employee uses tobacco
     * @param spouseAge employee's spouse's age
     * @param spouseGender employee's spouse's gender
     * @param spouseTobaccoUser flag to indicate whether employee's spouse uses tobacco
     * @param numberDependentsExcludingSpouse number of employee's dependents not including their spouse
     * @param eligibleSubscribers number of eligible employees for employer
     */
    initializeMoreSettingForm(
        age?: number,
        gender?: string,
        sicCode?: number,
        zipCode?: string,
        tobaccoUser?: boolean,
        spouseAge?: number,
        spouseGender?: string,
        spouseTobaccoUser?: boolean,
        numberDependentsExcludingSpouse?: number,
        eligibleSubscribers?: number,
    ): void {
        this.moreSettingForm = this.fb.group({
            age: [age],
            gender: [gender],
            sicCode: [sicCode],
            zipCode: [zipCode],
            tobaccoUser: [tobaccoUser],
            spouseAge: [spouseAge],
            spouseGender: [spouseGender],
            spouseTobaccoUser: [spouseTobaccoUser],
            numberDependentsExcludingSpouse: [numberDependentsExcludingSpouse],
            eligibleSubscribers: [eligibleSubscribers],
        });
    }

    /**
     * initialize the salary form
     * @param salarySelection selected salary annual or hourly
     * @param annually annual salary
     * @param hourlyRate salary per hour
     * @param hoursPerWeek working hours per week
     * @param weeksPerYear working weeks per year
     * @param hourlyAnnually annual salary if selected salarySelection is hourly
     * @return returns void
     */
    initializeSalaryForm(
        salarySelection?: string,
        annually?: number,
        hourlyRate?: number,
        hoursPerWeek?: number,
        weeksPerYear?: number,
        hourlyAnnually?: number,
    ): void {
        this.salaryForm = this.fb.group({
            salarySelection: [salarySelection],
            annually: [annually, Validators.pattern(this.numberRegex)],
            hourlyRate: [hourlyRate],
            hoursPerWeek: [hoursPerWeek],
            weeksPerYear: [weeksPerYear],
            hourlyAnnually: [hourlyAnnually],
        });
        this.salaryForm.controls.hourlyAnnually.disable();
    }

    /**
     * Update gender options with values from store.
     */
    updateGender(): void {
        this.genders = this.store.selectSnapshot(UniversalQuoteState.GetGender);
    }

    /**
     * Clear all fields and values in store depending on them.
     */
    resetSetting(): void {
        const payload: QuoteSettingsSchema = {};
        this.store.dispatch(new SetQuoteLevelSetting(payload, false));
        this.universalService.cdkSelectionUpdate$.next(true);
        this.store.dispatch(new RemovePlanPricing());
        this.store.dispatch(new RemoveSelections());
        this.universalService.planSelectionUpdated$.next(true);
        this.eligibleSubscribersChanged.emit();
    }

    /**
     * Calculate and set annual income when hourly pay is entered.
     */
    setHourlySalary(): void {
        if (this.salaryForm.value.hourlyRate && this.salaryForm.value.hoursPerWeek && this.salaryForm.value.weeksPerYear) {
            const salary = this.salaryForm.value.hourlyRate * this.salaryForm.value.hoursPerWeek * this.salaryForm.value.weeksPerYear;
            this.salaryForm.controls.hourlyAnnually.setValue(salary);
        } else {
            this.salaryForm.controls.hourlyAnnually.setValue(null);
        }
    }

    /**
     * Reset the invalid input on change of selected radio button
     * @param event Refers to the event of change in options of radio-group
     * @return Returns void
     */
    resetIfInvalid(event: HTMLInputElement): void {
        if (this.salaryForm.invalid && event.value === this.hourly) {
            this.salaryForm.controls.annually.reset();
        }
    }

    /**
     * Set the values of salary, applicant's age and gender, spouse age and gender
     * @return Returns void
     */
    applySetting(): void {
        if (this.salaryForm.valid && this.moreSettingForm.valid) {
            const payload: QuoteSettingsSchema = {
                age: this.moreSettingForm.value.age as number,
                gender: this.moreSettingForm.value.gender,
                sicCode: this.moreSettingForm.value.sicCode as number,
                zipCode: this.moreSettingForm.value.zipCode,
                tobaccoUser: this.moreSettingForm.value.tobaccoUser,
                spouseAge: this.moreSettingForm.value.spouseAge as number,
                spouseGender: this.moreSettingForm.value.spouseGender,
                spouseTobaccoUser: this.moreSettingForm.value.spouseTobaccoUser,
                numberDependentsExcludingSpouse: this.moreSettingForm.value.numberDependentsExcludingSpouse as number,
                eligibleSubscribers: this.moreSettingForm.value.eligibleSubscribers as number,
            };
            if (this.salaryForm.value.salarySelection) {
                if (
                    (!this.salaryForm.value.annually && this.salaryForm.value.salarySelection === this.annual) ||
                    (!this.salaryForm.controls.hourlyAnnually.value && this.salaryForm.value.salarySelection === this.hourly)
                ) {
                    return;
                }
                if (this.salaryForm.value.salarySelection === this.annual) {
                    delete payload.hourlyRate;
                    delete payload.hoursPerWeek;
                    delete payload.weeksPerYear;
                    delete payload.hourlyAnnually;
                    payload.annualSalary = this.salaryForm.value.annually;
                } else {
                    delete payload.annualSalary;
                    payload.hourlyRate = this.salaryForm.value.hourlyRate;
                    payload.hoursPerWeek = this.salaryForm.value.hoursPerWeek;
                    payload.weeksPerYear = this.salaryForm.value.weeksPerYear;
                    payload.hourlyAnnually = this.salaryForm.controls.hourlyAnnually.value;
                }
                payload.salarySelection = this.salaryForm.value.salarySelection;
                this.store.dispatch(new SetQuoteLevelSetting(payload, false));
            } else {
                this.store.dispatch(new SetQuoteLevelSetting(payload, false));
            }
            this.universalService.cdkSelectionUpdate$.next(true);
            this.store.dispatch(new RemovePlanPricing());
            this.store.dispatch(new RemoveSelections());
            this.universalService.planSelectionUpdated$.next(true);
            if (this.moreSettingForm.controls.eligibleSubscribers.dirty) {
                this.eligibleSubscribersChanged.emit(+payload.eligibleSubscribers);
            }
        }
    }

    /**
     * Fetch the applicable language strings from store.
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.reset",
            "primary.portal.common.apply",
            "primary.portal.common.select",
            "primary.portal.quickQuote.income",
            "primary.portal.quickQuote.annual",
            "primary.portal.quickQuote.hourly",
            "primary.portal.quickQuote.applicantInfo",
            "primary.portal.quickQuote.age",
            "primary.portal.quickQuote.gender",
            "primary.portal.dashboard.accountInfo",
            "primary.portal.prospects.sicCode",
            "primary.portal.quickQuote.sicCodeHint",
            "primary.portal.quickQuote.sicCodeRangeError",
            "primary.portal.quickQuote.tobaccoUser",
            "primary.portal.quickQuote.spouseInfo",
            "primary.portal.quickQuote.hourlyperyear",
            "primary.portal.quickQuote.hourlyperweek",
            "primary.portal.quickQuote.hourlyrate",
            "primary.portal.quickQuote.nonSpouseDependants",
            "primary.portal.census.eligibleEmployee",
            "primary.portal.census.editEstimate.nonZero",
        ]);
        // used for zip code error messages
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * Unsubscribe from and complete subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
