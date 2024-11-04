import { TitleCasePipe } from "@angular/common";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { BackdropStyleInput, SettingsDropdownName, RateSheetPlanSeriesOption, Gender, AgeBand, TobaccoStatus } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { SettingsDropdownMeta } from "@empowered/ui";
import { select } from "@ngrx/store";
import { Observable, Subject, combineLatest } from "rxjs";
import { filter, map, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";

@Component({
    selector: "empowered-plan-series-settings",
    templateUrl: "./plan-series-settings.component.html",
    styleUrls: ["./plan-series-settings.component.scss"],
})
export class PlanSeriesSettingsComponent implements OnInit, OnDestroy {
    @Input() selectedRateSheetPlanSeriesOptions: RateSheetPlanSeriesOption[];

    agePortalMeta: SettingsDropdownMeta;
    ageBandsPortalMeta: SettingsDropdownMeta;
    tobaccoPortalMeta: SettingsDropdownMeta;
    genderPortalMeta: SettingsDropdownMeta;

    allString = this.language.fetchPrimaryLanguageValue("primary.portal.activityHistory.all");
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    combinedplanSeriesOptionsWithSettings$ = this.selectedPlanSeries$.pipe(
        withLatestFrom(this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct))),
        switchMap(
            ([
                { planSeries },
                {
                    product: { id },
                },
            ]) =>
                combineLatest([
                    this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(id, planSeries.id))),
                    this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlansSeriesSettings(id, planSeries.id))),
                ]),
        ),
        filter(([, { settings }]) => !!settings),
    );

    genderLabel$ = this.combinedplanSeriesOptionsWithSettings$.pipe(
        map(([[{ genders }], { settings }]) => this.getLabel(SettingsDropdownName.GENDER, genders, settings.genders)),
    );
    tobaccoLabel$ = this.combinedplanSeriesOptionsWithSettings$.pipe(
        map(([[{ tobaccoStatuses }], { settings }]) =>
            this.getLabel(SettingsDropdownName.TOBACCO, tobaccoStatuses, settings.tobaccoStatuses),
        ),
    );
    ageLabel$ = this.combinedplanSeriesOptionsWithSettings$.pipe(
        map(([[{ ageBands }], { settings }]) => this.getLabel(SettingsDropdownName.AGE, ageBands, settings.ageBands)),
    );

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly language: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly titleCasePipe: TitleCasePipe,
    ) {}

    /**
     * Initializes subscriptions.
     */
    ngOnInit(): void {
        this.agePortalMeta = this.getMeta(
            SettingsDropdownName.AGE,
            `${this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.planSeriesSettings.ages")}:`,
            this.ageLabel$,
        );
        this.ageBandsPortalMeta = this.getMeta(
            SettingsDropdownName.AGE_BANDS,
            `${this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.planSeriesSettings.ageBands")}:`,
            this.ageLabel$,
        );
        this.tobaccoPortalMeta = this.getMeta(
            SettingsDropdownName.TOBACCO,
            `${this.language.fetchPrimaryLanguageValue("primary.portal.activityHistory.tobacoStatus")}:`,
            this.tobaccoLabel$,
        );

        this.genderPortalMeta = this.getMeta(
            SettingsDropdownName.GENDER,
            `${this.language.fetchPrimaryLanguageValue("primary.portal.quickQuote.gender")}:`,
            this.genderLabel$,
        );
    }

    /**
     * Gets settings dropdown meta.
     *
     * @param name dropdown name
     * @param triggerLabel trigger label
     * @param triggerValue observable of trigger value
     * @returns dropdown meta
     */
    getMeta(name: SettingsDropdownName, triggerLabel: string, triggerValue: Observable<string>): SettingsDropdownMeta {
        return {
            name,
            class: "plan-series-settings",
            trigger: {
                label: triggerLabel,
                value: triggerValue,
            },
            backdrop: {
                anchor: null,
                style: BackdropStyleInput.LIGHT,
            },
            portal: {
                class: `rate-sheets ${name}`,
                title: this.language.fetchPrimaryLanguageValue("primary.portal.shared.drop-down-modal.opened"),
            },
            footer: {
                apply: this.language.fetchPrimaryLanguageValue("primary.portal.common.apply"),
                reset: this.language.fetchPrimaryLanguageValue("primary.portal.common.reset"),
            },
        };
    }

    /**
     * Gets label for a plan series settings dropdown.
     *
     * @param type gender/tobacco status/ages/age bands
     * @param allOptions all avaiable options for the dropdown
     * @param selectedOptions selected options
     * @returns label
     */
    getLabel(
        type: SettingsDropdownName,
        allOptions: Array<TobaccoStatus | Gender | AgeBand>,
        selectedOptions: Array<TobaccoStatus | Gender | AgeBand>,
    ): string {
        if (!selectedOptions) {
            return "";
        }
        if (selectedOptions.length === 1) {
            switch (type) {
                case SettingsDropdownName.AGE:
                case SettingsDropdownName.AGE_BANDS:
                    return `${(selectedOptions[0] as AgeBand).minAge}–${(selectedOptions[0] as AgeBand).maxAge}`;
                case SettingsDropdownName.GENDER:
                    return this.titleCasePipe.transform(selectedOptions[0] as Gender);
                case SettingsDropdownName.TOBACCO:
                    return this.language.fetchPrimaryLanguageValue(
                        `primary.portal.rateSheets.planSeriesSettings.tobacco.options.${(
                            selectedOptions[0] as TobaccoStatus
                        ).toLowerCase()}`,
                    );
            }
        }
        if (selectedOptions.length === allOptions.length) {
            return this.allString;
        }
        return selectedOptions.length.toString();
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
