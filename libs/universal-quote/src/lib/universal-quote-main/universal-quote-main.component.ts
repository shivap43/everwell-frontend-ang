import { Component, OnInit, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { AflacService, AdminService, ProductDetail } from "@empowered/api";

import {
    UniversalQuoteState,
    QuoteSettingsSchema,
    SetQuickQuotePlans,
    SetAdminPreference,
    SetQuoteLevelData,
    SetRestrictedConfiguration,
    SetQuoteLevelSetting,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { UniversalService, QuoteLevelSetting } from "./universal.service";
import { UserService } from "@empowered/user";
import { Subject, forkJoin, combineLatest } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { CreateQuoteComponent } from "./create-quote/create-quote.component";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    ArgusConfig,
    CarrierId,
    ConfigName,
    CredentialProperties,
    QuickQuotePlanDetails,
    PartnerAccountType,
    Plan,
} from "@empowered/constants";

interface PlanSelection {
    planId: number;
    coverageLevelIds?: number[];
    selectedEliminationPeriod?: number;
}

@Component({
    selector: "empowered-universal-quote-main",
    templateUrl: "./universal-quote-main.component.html",
    styleUrls: ["./universal-quote-main.component.scss"],
})
export class UniversalQuoteMainComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string>;
    isSpinnerLoading: boolean;
    quickQuotePlans: ProductDetail[];
    adminId: number;
    channelConstant = "channel";
    stateConstant = "state";
    payFrequencyConstant = "pay_frequency";
    jobClassConstant = "job_class";
    defaultJobClass = "A";
    defaultPayFrequency = "28-day biweekly";
    payrollConstant = "PAYROLL";
    productStatus: ProductDetail[];
    buttonDisabledTooltipValue = "Plan(s) must be selected";
    planSelected: boolean;
    display = true;
    levelSetting: QuoteLevelSetting = {};
    isSendQuoteSuccessful: boolean;
    // Plans included in the rate sheet.
    rateSheetPlanSelections: PlanSelection[] = [];
    // Plans included in the quote.
    quotePlanSelections: PlanSelection[] = [];
    bypassRequirementsForRateSheet: boolean;

    argusEligibleSubscribersMin: number;
    argusEligibleSubscribersMax: number;
    smallGroupADVVisionPlansEligibleSubscribersMax: number;
    nonSmallGroupADVVisionPlansEligibleSubscribersMin: number;
    riderMaxBenefitAmountLimits: Map<number, number>;
    requiredConfigs = combineLatest(
        this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
        this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
        this.staticUtilService.cacheConfigValue(ArgusConfig.SMALL_GROUP_VISION_PLANS_ELIGIBLE_SUBSCRIBERS_MAX_VALUE),
        this.staticUtilService.cacheConfigValue(ConfigName.QQ_LIFE_RIDERS_MAX_BENEFIT_AMOUNT_LIMIT),
    ).pipe(
        tap(
            ([
                argusEligibleSubscribersMin,
                argusEligibleSubscribersMax,
                smallGroupADVVisionPlansEligibleSubscribersMax,
                lifeRidersBenefitLimits,
            ]) => {
                this.argusEligibleSubscribersMin = +argusEligibleSubscribersMin;
                this.argusEligibleSubscribersMax = +argusEligibleSubscribersMax;
                this.smallGroupADVVisionPlansEligibleSubscribersMax = +smallGroupADVVisionPlansEligibleSubscribersMax;
                this.riderMaxBenefitAmountLimits = new Map<number, number>();
                lifeRidersBenefitLimits?.split(",")?.forEach((riderLimit) => {
                    const limitData = riderLimit.split("=");
                    this.riderMaxBenefitAmountLimits[limitData[0]] = +limitData[1];
                });
            },
        ),
        takeUntil(this.unsubscribe$),
    );
    configName = ConfigName;

    constructor(
        private readonly store: Store,
        private readonly aflacService: AflacService,
        private readonly language: LanguageService,
        private readonly universalService: UniversalService,
        private readonly adminService: AdminService,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {}

    /**
     * Initialize quote level settings, get products and plans to be displayed, and get language specs.
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.getLanguageStrings();
        this.getAdminId();
        this.getProducts();
        this.requiredConfigs.subscribe();
        const preference = this.store.selectSnapshot(UniversalQuoteState.GetAdminPreferences).length;
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.RATE_SHEET_PROPERTY_BYPASS_ENABLED)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((bypassRequirementsForRateSheet) => (this.bypassRequirementsForRateSheet = bypassRequirementsForRateSheet));
        if (!preference) {
            forkJoin(
                this.store.dispatch(new SetAdminPreference(this.adminId)),
                this.store.dispatch(new SetQuoteLevelData()),
                this.store.dispatch(new SetRestrictedConfiguration()),
            )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.universalService.levelSettingUpdated$.next(true);
                    const res = this.store.selectSnapshot(UniversalQuoteState.GetAdminPreferences);
                    const channelIndex = res.findIndex((channel) => channel.name === this.channelConstant);
                    const stateIndex = res.findIndex((state) => state.name === this.stateConstant);
                    const payFrequencyIndex = res.findIndex((payFrequency) => payFrequency.name === this.payFrequencyConstant);
                    const jobClassIndex = res.findIndex((jobClass) => jobClass.name === this.jobClassConstant);
                    if (
                        !res.length ||
                        (res.length && channelIndex === -1 && stateIndex === -1 && payFrequencyIndex === -1 && jobClassIndex === -1)
                    ) {
                        this.getAdminContact();
                    } else if (res.length && stateIndex > -1 && channelIndex === -1) {
                        this.setPlans(res[stateIndex].value, this.channelConstant, res[payFrequencyIndex].value, res[jobClassIndex].value);
                        this.universalService.adminPreferenceUpdated$.next(true);
                        this.updateQuoteSetting();
                    } else {
                        this.setPlans(
                            res[stateIndex].value,
                            res[channelIndex].value,
                            res[payFrequencyIndex].value,
                            res[jobClassIndex].value,
                        );
                        this.universalService.adminPreferenceUpdated$.next(true);
                        this.updateQuoteSetting();
                    }
                });
        } else {
            this.universalService.levelSettingUpdated$.next(true);
            this.universalService.adminPreferenceUpdated$.next(true);
            /* setTimeout needed here because on hitting the behavior subject the next line is getting executed before the
             script defined in subject. */
            setTimeout(() => {
                const states = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings).states;
                const setting = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
                const stateIndex = states.findIndex((state) => state.name === setting.state);
                if (stateIndex > -1) {
                    this.setPlans(states[stateIndex].abbreviation, setting.channel, setting.payFrequency, setting.riskClass);
                }
                this.updateQuoteSetting();
            }, 250);
        }
    }

    /**
     * Set quote plans in store and display updated plans.
     * @param stateName state selected in settings
     * @param channelName channel selected in settings
     */
    setPlans(stateName: string, channelName: string, payrollFrequency: string, riskClass: string): void {
        this.store
            .dispatch(
                new SetQuickQuotePlans(stateName, channelName, payrollFrequency, riskClass, [
                    QuickQuotePlanDetails.MIN_ELIGIBLE_SUBSCRIBERS,
                    QuickQuotePlanDetails.MAX_ELIGIBLE_SUBSCRIBERS,
                ]),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                const settings = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
                if (settings.channel === PartnerAccountType.PAYROLL) {
                    this.filterArgusPlans(settings.eligibleSubscribers);
                } else {
                    this.quickQuotePlans = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
                }
                this.universalService.planSelectionUpdated$.next(true);
                this.isSpinnerLoading = false;
            });
    }

    /**
     * Get the admin id from store.
     */
    getAdminId(): void {
        this.userService.credential$
            .pipe(
                tap((credential) => {
                    if (CredentialProperties.PRODUCER_ID in credential) {
                        this.adminId = credential[CredentialProperties.PRODUCER_ID];
                    } else if (CredentialProperties.ADMIN_ID in credential) {
                        this.adminId = credential[CredentialProperties.ADMIN_ID];
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method is used to fetch primary language strings
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.resetnote",
            "primary.portal.quickQuote.planName",
            "primary.portal.quickQuote.title",
            "primary.portal.quickQuote.settings",
            "primary.portal.quickQuote.Channel",
            "primary.portal.quickQuote.payroll",
            "primary.portal.quickQuote.benefit",
            "primary.portal.quickQuote.rider",
            "primary.portal.quickQuote.method",
            "primary.portal.quickQuote.facetoface",
            "primary.portal.quickQuote.state",
            "primary.portal.quickQuote.georgia",
            "primary.portal.quickQuote.jobClass",
            "primary.portal.quickQuote.more",
            "primary.portal.quickQuote.viewRateSheet",
            "primary.portal.quickQuote.generate",
            "primary.portal.quickQuote.annual",
            "primary.portal.quickQuote.reset",
            "primary.portal.quickQuote.accident",
            "primary.portal.quickQuote.includedInQuote",
            "primary.portal.quickQuote.details",
            "primary.portal.quickQuote.invidualsp",
            "primary.portal.quickQuote.invidual",
            "primary.portal.quickQuote.oneParent",
            "primary.portal.quickQuote.twoParent",
            "primary.portal.quickQuote.total",
            "primary.portal.quickQuote.perMonth",
            "primary.portal.shoppingCart.quoteSent",
        ]);
    }

    /**
     * Get admin contact from DB.
     */
    getAdminContact(): void {
        this.adminService
            .getAdminContact(this.adminId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (Object.entries(resp).length && resp.address && resp.address.state) {
                    const adminResidenceState = resp.address.state;
                    this.setPlans(adminResidenceState, this.payrollConstant, this.defaultPayFrequency, this.defaultJobClass);
                    this.universalService.adminContactUpdated$.next({
                        updated: true,
                        state: adminResidenceState,
                    });
                } else {
                    const settings = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings);
                    if (settings.states.length) {
                        this.setPlans(
                            settings.states[0].abbreviation,
                            this.payrollConstant,
                            settings.payFrequency[0].name,
                            settings.riskClasses[0].name,
                        );
                    }
                    this.universalService.zeroState$.next(true);
                }
                this.updateQuoteSetting();
            });
    }

    /**
     * Apply each quote setting from store to its respective form.
     */
    updateQuoteSetting(): void {
        const setting = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        const allState = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings).states;
        const stateIndex = allState.findIndex((state) => state.name === setting.state);
        if (stateIndex > -1) {
            this.levelSetting.state = allState[stateIndex].abbreviation;
        }
        this.levelSetting.channel = setting.channel;
        this.levelSetting.payFrequency = setting.payFrequency;
        this.levelSetting.riskClass = setting.riskClass;
    }

    /**
     * Function to update the products/plans once we change the quote level setting
     * @param changedData quote level settings that have changed
     */
    quoteLevelSettingChanged(changedData: QuoteLevelSetting): void {
        if (Object.keys(changedData).includes("eligibleSubscribers")) {
            this.filterArgusPlans(changedData.eligibleSubscribers);
        } else if (
            (changedData.state && changedData.state !== this.levelSetting.state) ||
            (changedData.channel && changedData.channel !== this.levelSetting.channel) ||
            (changedData.riskClass && changedData.riskClass !== this.levelSetting.riskClass) ||
            (changedData.payFrequency && changedData.payFrequency !== this.levelSetting.payFrequency)
        ) {
            this.isSpinnerLoading = true;
            this.setPlans(changedData.state, changedData.channel, changedData.payFrequency, changedData.riskClass);
        }
        this.universalService.selectionUpdated$.next(true);
        this.levelSetting = this.utilService.copy(changedData);
    }

    /**
     * Hide argus 2021 plans if number entered for eligible employees is not within range.
     * @param eligibleSubscribers number entered in eligible employees field in more settings form
     */
    filterArgusPlans(eligibleSubscribers: number): void {
        const quickQuotePlans = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        if (!eligibleSubscribers) {
            this.quickQuotePlans = quickQuotePlans;
            return;
        }
        const quickQuotePlansCopy: ProductDetail[] = this.utilService.copy(quickQuotePlans);
        if (eligibleSubscribers < this.argusEligibleSubscribersMin || eligibleSubscribers > this.argusEligibleSubscribersMax) {
            // copy quick quote plans to edit readonly properties
            this.quickQuotePlans = quickQuotePlansCopy.map((product) => {
                if (product.plans) {
                    product.plans = product.plans.filter(
                        (plan) => ![CarrierId.ARGUS, CarrierId.AFLAC_DENTAL_AND_VISION].includes(plan.carrierId),
                    );
                }
                return product;
            });
        } else {
            this.quickQuotePlans = quickQuotePlansCopy.map((product) => {
                if (product.plans) {
                    product.plans = this.getPlansByEligibleSubscribers(product.plans, eligibleSubscribers);
                }
                return product;
            });
        }
    }

    /**
     * If plan has planDetails, return plans with ranges in which eligibleSubscribers is valid.
     * @param plans list of plans to be filtered
     * @param eligibleSubscribers amount specified by user of employees eligible for coverage
     * @returns list of plans that meet filter criteria
     */
    getPlansByEligibleSubscribers(plans: Plan[], eligibleSubscribers: number): Plan[] {
        return plans.filter(
            (plan) =>
                // if all appropriate properties exist and eligibleSubscribers is within range
                (plan.planDetails &&
                    (!plan.planDetails.minEligibleSubscribers || eligibleSubscribers >= plan.planDetails.minEligibleSubscribers) &&
                    (!plan.planDetails.maxEligibleSubscribers || eligibleSubscribers <= plan.planDetails.maxEligibleSubscribers)) ||
                // don't filter out plan if planDetails is undefined
                !plan.planDetails,
        );
    }

    /**
     * Updates plan included in the rate sheet and quote.
     */
    getProducts(): void {
        this.universalService.planSelectionUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            const products = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
            this.quotePlanSelections = products.reduce(
                (planSelections, product) => [
                    ...planSelections,
                    ...product.plans
                        .filter((plan) => plan.planPriceSelection?.length > 0 || Object.keys(plan.multiplePlanPriceSelections)?.length > 0)
                        .map((plan) => ({
                            planId: plan.id,
                            coverageLevelIds:
                                plan.planPriceSelection?.length > 0 ? plan.planPriceSelection : plan.multiplePlanPriceSelections,
                            selectedEliminationPeriod: plan.selectedEliminationPeriod,
                        })),
                ],
                [],
            );
            this.rateSheetPlanSelections = this.bypassRequirementsForRateSheet
                ? products.reduce(
                    (rateSheetSelections, product) => [
                        ...rateSheetSelections,
                        ...product.plans
                            .filter((plan) => plan.rateSheetSelection)
                            .map((plan) => ({
                                planId: plan.id,
                            })),
                    ],
                    [],
                )
                : this.quotePlanSelections;
        });
    }

    /**
     * Compile payload for and execute rate sheet download request.
     */
    downloadRateSheet(): void {
        const levelSettingValues = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings);
        const quoteLevelSetting = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        const residenceStateIndex = levelSettingValues.states.findIndex((states) => states.name === quoteLevelSetting.state);
        const riskClassIndex = levelSettingValues.riskClasses.findIndex((jobClass) => jobClass.name === quoteLevelSetting.riskClass);
        const frequencyIndex = levelSettingValues.payFrequency.findIndex((freq) => freq.name === quoteLevelSetting.payFrequency);
        const quoteForm = {
            planSelections: this.rateSheetPlanSelections,
            quoteSettings: {
                age: quoteLevelSetting.age ?? null,
                gender: quoteLevelSetting.gender ?? null,
                tobaccoUser: quoteLevelSetting.tobaccoUser ?? false,
                state: levelSettingValues.states[residenceStateIndex].abbreviation,
                zipCode: quoteLevelSetting.zipCode ?? null,
                riskClassId: levelSettingValues.riskClasses[riskClassIndex].id,
                annualSalary: quoteLevelSetting.annualSalary ?? null,
                hoursPerYear:
                    quoteLevelSetting.hoursPerWeek && quoteLevelSetting.weeksPerYear
                        ? quoteLevelSetting.hoursPerWeek * quoteLevelSetting.weeksPerYear
                        : null,
                hourlyWage: quoteLevelSetting.hourlyRate ?? null,
                payrollFrequencyId: levelSettingValues.payFrequency[frequencyIndex].id,
                spouseAge: quoteLevelSetting.spouseAge ?? null,
                spouseGender: quoteLevelSetting.spouseGender ?? null,
                spouseTobaccoUser: quoteLevelSetting.spouseTobaccoUser ?? false,
                numberDependentsExcludingSpouse: quoteLevelSetting.numberDependentsExcludingSpouse ?? null,
                partnerAccountType: quoteLevelSetting.channel,
                sicCode: quoteLevelSetting.sicCode ?? null,
                eligibleSubscribers: quoteLevelSetting.eligibleSubscribers ?? null,
            },
            partnerAccountType: quoteLevelSetting.channel,
        };
        this.aflacService
            .downloadQuoteRateSheet(quoteForm)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    const unSignedBlob = new Blob([resp], { type: "application/pdf" });
                    const unSignedFileURL = window.URL.createObjectURL(unSignedBlob);
                    window.open(unSignedFileURL, "_blank");
                },
                () => {
                    // TODO Need to implement error block
                },
            );
    }

    /**
     * Open create-quote quasi modal
     */
    createQuote(): void {
        this.isSendQuoteSuccessful = false;
        this.empoweredModalService
            .openDialog(CreateQuoteComponent, {
                backdropClass: "backdrop-blur",
                minWidth: "100%",
                height: "100%",
                panelClass: "create-quote",
                data: {
                    planSelection: this.quotePlanSelections,
                    riderMaxBenefitAmountLimits: this.riderMaxBenefitAmountLimits,
                },
            })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((isSendQuote) => {
                    this.isSendQuoteSuccessful = isSendQuote;
                }),
            )
            .subscribe();
    }

    /**
     * Passes default values to store, subjects and unsubscribes all subscriptions.
     */
    ngOnDestroy(): void {
        const payload: QuoteSettingsSchema = {};
        this.store.dispatch(new SetQuoteLevelSetting(payload, true));
        this.universalService.levelSettingUpdated$.next(false);
        this.universalService.adminPreferenceUpdated$.next(false);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
