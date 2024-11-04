import { State, Selector, Action, StateContext } from "@ngxs/store";
import { UniversalStateModel, AdminPreference, SettingsData, RestictedConfigurations, QuoteSettingsSchema } from "./universal-quote.model";
import {
    SetQuickQuotePlans,
    SetPlanPricing,
    SetAdminPreference,
    SetQuoteLevelData,
    SetPlanCoverageLevels,
    SavePlansPriceSelection,
    SetRestrictedConfiguration,
    SetQuoteLevelSetting,
    RemovePlanPricing,
    RemoveSelections,
    ResetQuoteLevelSettingZipCode,
    SaveRateSheetSelection,
} from "./universal-quote.action";
import { Observable, forkJoin, combineLatest, of } from "rxjs";
import {
    AflacService,
    AdminService,
    StaticService,
    AccountService,
    CoreService,
    MemberService,
    Pricing,
    ProductDetail,
} from "@empowered/api";
import { tap } from "rxjs/operators";
import { UtilService } from "../state-services/util.service";
import { AdminPreferenceQuoteSetting, CountryState, Plan, ConfigName } from "@empowered/constants";
import { Injectable } from "@angular/core";
import { ResetState } from "@empowered/user/state/actions";
import { StaticUtilService } from "../state-services/static-util.service";

const defaultState: UniversalStateModel = {
    product: [],
    adminPreference: [],
    levelSettings: null,
    configurations: [],
    allowedChannel: [],
    gender: [],
    quoteSetting: null,
};
@State<UniversalStateModel>({
    name: "UniversalQuoteState",
    defaults: defaultState,
})
@Injectable()
export class UniversalQuoteState {
    carrierId = "1";
    frequencyConstant = "frequency";
    jobClassConstant = "jobClass";
    payrollDirectBillConstant = "PAYROLLDIRECTBILL";
    payrollDirectBillWithSpaceConstant = "PAYROLL DIRECT BILL";

    constructor(
        private readonly aflacService: AflacService,
        private readonly utilService: UtilService,
        private readonly adminService: AdminService,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly coreService: CoreService,
        private readonly memberService: MemberService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    @Selector()
    static GetQuickQuotePlans(state: UniversalStateModel): ProductDetail[] {
        return state.product;
    }
    @Selector()
    static GetAdminPreferences(state: UniversalStateModel): AdminPreference[] {
        return state.adminPreference;
    }
    @Selector()
    static GetLevelSettings(state: UniversalStateModel): SettingsData {
        return state.levelSettings;
    }
    @Selector()
    static GetChannels(state: UniversalStateModel): string[] {
        return state.allowedChannel;
    }
    @Selector()
    static GetConfigurations(state: UniversalStateModel): RestictedConfigurations[] {
        return state.configurations;
    }
    @Selector()
    static GetGender(state: UniversalStateModel): string[] {
        return state.gender;
    }
    @Selector()
    static GetQuoteLevelSettings(state: UniversalStateModel): QuoteSettingsSchema {
        return state.quoteSetting;
    }

    /**
     * Get quick quote plans from API and store them in state.
     * @param param0 state related default actions
     * @param param1 API query parameters
     * @returns quick quote plans
     */
    @Action(SetQuickQuotePlans)
    SetQuickQuotePlans(
        { patchState, dispatch, getState }: StateContext<UniversalStateModel>,
        { state, partnerAccountType, payrollFrequency, riskClass, append }: SetQuickQuotePlans,
    ): Observable<Plan[]> {
        const levelSettings = getState().levelSettings;
        const payrollFrequencyId = levelSettings.payFrequency.find((payFrequency) => payFrequency.name === payrollFrequency).id;
        const riskClassId = levelSettings.riskClasses.find((riskCls) => riskCls.name === riskClass).id;
        return this.aflacService.getQuickQuotePlans(state, partnerAccountType, payrollFrequencyId, riskClassId, append).pipe(
            tap((quickQuotePlansResponse) => {
                const productDetails: ProductDetail[] = quickQuotePlansResponse.reduce(
                    (productDetailAcc: ProductDetail[], quickQuotePlan) => {
                        /* If product detail exists with same ID, add quick quote plan to product
                        detail object's plans. Insert new product detail object otherwise. */
                        const existingProductDetail = productDetailAcc.find(
                            (productDetail) => productDetail.productId === quickQuotePlan.product.id,
                        );
                        if (existingProductDetail) {
                            // using concat instead of push to favor immutable changes for optimal Angular change detection
                            existingProductDetail.plans = existingProductDetail.plans.concat(quickQuotePlan);
                            return productDetailAcc.map((productDetail) =>
                                productDetail.productId === existingProductDetail.productId ? existingProductDetail : productDetail,
                            );
                        }
                        return [
                            ...productDetailAcc,
                            {
                                productId: quickQuotePlan.product.id,
                                plans: [quickQuotePlan],
                                productName: quickQuotePlan.product.name,
                            },
                        ];
                    },
                    new Array<ProductDetail>(),
                );
                patchState({
                    product: productDetails,
                });
                dispatch(new RemoveSelections());
            }),
        );
    }

    /**
     * Get pricing for a specific quick quote plan.
     * @param param0 state related default actions
     * @param param1 API query parameters and filtering criteria
     */
    @Action(SetPlanPricing)
    SetPlanPricing(
        { getState, patchState }: StateContext<UniversalStateModel>,
        { planId, genericSetting, productId, benefitAmount }: SetPlanPricing,
    ): Observable<Pricing> {
        const store = getState();
        return this.aflacService.getQuickQuotePlanPricingDetails(planId, genericSetting, benefitAmount).pipe(
            tap((response) => {
                const products = this.utilService.copy(store.product);
                const prodIndex = products.findIndex((prod) => prod.productId === productId);
                const planIndex = products[prodIndex].plans.findIndex((plan) => plan.id === planId);
                const plans = products[prodIndex].plans;
                plans[planIndex].pricing = response;
                patchState({
                    product: products,
                });
            }),
        );
    }

    // Action to get particular plan coverageLevels
    @Action(SetPlanCoverageLevels)
    SetPlanCoverageLevels(
        { getState, patchState }: StateContext<UniversalStateModel>,
        { planId, productId }: SetPlanCoverageLevels,
    ): Observable<any> {
        const store = getState();
        return this.coreService.getCoverageLevels(planId.toString()).pipe(
            tap((response) => {
                const products = this.utilService.copy(store.product);
                const prodIndex = products.findIndex((prod) => prod.productId === productId);
                const planIndex = products[prodIndex].plans.findIndex((plan) => plan.id === planId);
                const plans = products[prodIndex].plans;
                plans[planIndex].coverageLevels = response;
                patchState({
                    product: products,
                });
            }),
        );
    }
    // Action to reset the state
    @Action(ResetState)
    resetState(context: StateContext<UniversalStateModel>): void {
        context.setState(defaultState);
    }

    /**
     * Set admin preferences with quote level settings in store. Use default settings
     * from DB to fill in missing values.
     * @param param0 NGXS state related params, automatically loaded
     * @param param1 admin ID to get default preferences in DB
     * @returns an observable of US states and admin preferences from the DB
     */
    @Action(SetAdminPreference)
    SetAdminPreference(
        { getState, patchState }: StateContext<UniversalStateModel>,
        { adminId }: SetAdminPreference,
    ): Observable<[CountryState[], AdminPreference[]]> {
        const quoteSetting = getState().quoteSetting;
        return combineLatest(this.staticService.getStates(), adminId ? this.adminService.getAdminPreferences(adminId) : of([])).pipe(
            tap(([states, adminPreferences]: [CountryState[], AdminPreference[]]) => {
                const stateSetting: CountryState = quoteSetting ? states.find((state) => state.name === quoteSetting.state) : undefined;
                patchState({
                    adminPreference: adminPreferences.map((preference) => {
                        let matchingSetting: string;
                        if (preference.name === AdminPreferenceQuoteSetting.STATE) {
                            matchingSetting = stateSetting ? stateSetting.abbreviation : preference.value;
                        } else if (quoteSetting) {
                            matchingSetting = quoteSetting[AdminPreferenceQuoteSetting[preference.name.toUpperCase()]];
                        }
                        return {
                            name: preference.name,
                            value: quoteSetting && matchingSetting ? matchingSetting : preference.value,
                        };
                    }),
                });
            }),
        );
    }
    // Action to set necessary information for quote level settings
    @Action(SetQuoteLevelData)
    SetQuoteLevelData({ patchState }: StateContext<UniversalStateModel>): Observable<any> {
        const statesObservable = this.staticService.getStates();
        const payFrequencyObservable = this.accountService.getPayFrequencies();
        const riskClassesObservable = this.coreService.getCarrierRiskClasses(this.carrierId);
        const genderObservable = this.staticService.getGenders();
        return forkJoin([statesObservable, payFrequencyObservable, riskClassesObservable, genderObservable]).pipe(
            tap((response) => {
                const frequency = response[1];
                const settings: SettingsData = {
                    states: response[0],
                    payFrequency: frequency,
                    riskClasses: response[2],
                };
                patchState({
                    levelSettings: settings,
                    gender: this.memberService.refactorGenders(response[3]).map((gender) => gender.for.toUpperCase()),
                });
            }),
        );
    }

    /**
     * Save to the store the selected quick quotes plan (along with its related data).
     * @param param0 state related default actions
     * @param param1 data related to the selected plan
     */
    @Action(SavePlansPriceSelection)
    SavePlansPriceSelection(
        { getState, patchState }: StateContext<UniversalStateModel>,
        {
            planId,
            productId,
            selection,
            choice,
            riders,
            selectedEliminationPeriod,
            multipleSelections,
            benefitAmountOptions,
            isRiderApplyClicked,
        }: SavePlansPriceSelection,
    ): void {
        const products = this.utilService.copy(getState().product);
        const prodIndex = products.findIndex((productDetail) => productDetail.productId === productId);
        const planIndex = products[prodIndex].plans.findIndex((plan) => plan.id === planId);
        const plans = products[prodIndex].plans;
        plans[planIndex].riders = riders;
        plans[planIndex].selectedEliminationPeriod = selectedEliminationPeriod;
        plans[planIndex].benefitAmountOptions = benefitAmountOptions;
        if (selection) {
            const choices: number[] = plans[planIndex]?.planPriceSelection || [];
            if (choice) {
                choices.push(selection);
                plans[planIndex].planPriceSelection = choices;
            } else {
                const index = choices.indexOf(selection);
                plans[planIndex].planPriceSelection.splice(index, 1);
            }
        } else if (multipleSelections) {
            // updates the plans with selected premiums for particular dependent age/ elimination period
            const dependentAge: string = Object.keys(multipleSelections)[0];
            const priceSelections: number = multipleSelections[dependentAge];
            const choices: Record<number, number[]> = plans[planIndex]?.multiplePlanPriceSelections || {};
            // choice true indicates selection of a premium and updates the premium in particular plan else removes it
            if (choice) {
                if (!choices[+dependentAge]) {
                    choices[+dependentAge] = [];
                }
                if (!choices[+dependentAge].includes(priceSelections) && priceSelections) {
                    choices[+dependentAge].push(priceSelections);
                }
                plans[planIndex].multiplePlanPriceSelections = choices[+dependentAge]?.length ? choices : {};
            } else {
                const index = choices[dependentAge]?.indexOf(priceSelections);
                plans[planIndex].multiplePlanPriceSelections[dependentAge]?.splice(index, 1);
                if (!plans[planIndex].multiplePlanPriceSelections[dependentAge]?.length) {
                    delete plans[planIndex].multiplePlanPriceSelections[dependentAge];
                }
                if (isRiderApplyClicked) {
                    plans[planIndex].multiplePlanPriceSelections = {};
                }
            }
        } else {
            plans[planIndex].multiplePlanPriceSelections = {};
        }
        patchState({
            product: products,
        });
    }

    /**
     * Saves whether a given plan is selected to be included in the rate sheet.
     *
     * @param param0 state context
     * @param param1 action payload
     */
    @Action(SaveRateSheetSelection)
    saveRateSheetSelection(
        { getState, patchState }: StateContext<UniversalStateModel>,
        { planId, productId, add }: SaveRateSheetSelection,
    ): void {
        patchState({
            product: getState().product.map((product) =>
                product.productId === productId
                    ? {
                        ...product,
                        plans: product.plans.map((plan) => (plan.id === planId ? { ...plan, rateSheetSelection: add } : plan)),
                    }
                    : product,
            ),
        });
    }

    // Action to set configurations for different channels.
    @Action(SetRestrictedConfiguration)
    SetRestrictedConfiguration({ patchState }: StateContext<UniversalStateModel>): Observable<any> {
        return this.staticUtilService
            .fetchConfigs([
                ConfigName.SMARTQUOTE_ACCOUNT_TYPES,
                ConfigName.SMARTQUOTE_JOB_CLASSES,
                ConfigName.SMARTQUOTE_PAYROLL_FREQUENCIES,
            ])
            .pipe(
                tap(([accountTypes, jobClasses, payrollFrequencies]) => {
                    const channel = accountTypes.value.split(",");
                    const payrollDirectIndex = channel.indexOf(this.payrollDirectBillConstant);
                    if (payrollDirectIndex > -1) {
                        channel[payrollDirectIndex] = this.payrollDirectBillWithSpaceConstant;
                    }
                    const jobClassSemicolanSeparated = jobClasses.value.split(";");
                    const freqSemicolanSeparated = payrollFrequencies.value.split(";");
                    const configurations: RestictedConfigurations[] = [];
                    channel.forEach((channels) => {
                        configurations.push({ channel: channels, allowedPayFrequency: [], allowedRiskValues: [] });
                    });
                    freqSemicolanSeparated.forEach((freq) => {
                        const freqEqualsToSeparated = freq.split("=");
                        this.setChannelValues(configurations, freqEqualsToSeparated, this.frequencyConstant);
                    });
                    jobClassSemicolanSeparated.forEach((jobClass) => {
                        const jobClassEqualsToSeparated = jobClass.split("=");
                        this.setChannelValues(configurations, jobClassEqualsToSeparated, this.jobClassConstant);
                    });
                    patchState({
                        allowedChannel: channel.sort(),
                        configurations: configurations,
                    });
                }),
            );
    }
    // Functions to set configurations based upon channel
    setChannelValues(configurations: any, payload: any, operation: string): any {
        if (payload && payload.length) {
            let channelName = payload[0];
            if (channelName === this.payrollDirectBillConstant) {
                channelName = this.payrollDirectBillWithSpaceConstant;
            }
            let allowedValues = payload[1];
            const index = configurations.findIndex((config) => config.channel === channelName);
            if (index > -1) {
                allowedValues = allowedValues.replace("[", "");
                allowedValues = allowedValues.replace("]", "");
                if (operation === this.frequencyConstant) {
                    configurations[index].allowedPayFrequency = allowedValues.split(",");
                } else {
                    configurations[index].allowedRiskValues = allowedValues.split(",");
                }
            }
        }
    }

    /**
     * Update or reset UniversalQuoteState with settings pertaining to quote retrieval.
     * @param param0 NGXS state related params, automatically loaded
     * @param param1 quote level settings and how to handle them
     */
    @Action(SetQuoteLevelSetting)
    // eslint-disable-next-line complexity
    SetQuoteLevelSetting(
        { patchState, getState }: StateContext<UniversalStateModel>,
        { quoteSetting, reset, fromQuote }: SetQuoteLevelSetting,
    ): void {
        const store = getState();
        if (reset) {
            const setting: QuoteSettingsSchema = {
                state: store.quoteSetting.state,
                channel: store.quoteSetting.channel,
                payFrequency: store.quoteSetting.payFrequency,
                riskClass: store.quoteSetting.riskClass,
            };
            patchState({
                quoteSetting: setting,
            });
        } else if (fromQuote) {
            const setting: QuoteSettingsSchema = {
                state: quoteSetting.state ? quoteSetting.state : store.quoteSetting.state,
                channel: quoteSetting.channel ? quoteSetting.channel : store.quoteSetting.channel,
                riskClass: quoteSetting.riskClass ? quoteSetting.riskClass : store.quoteSetting.riskClass,
                payFrequency: quoteSetting.payFrequency ? quoteSetting.payFrequency : store.quoteSetting?.payFrequency,
                age: store.quoteSetting ? store.quoteSetting.age : null,
                gender: store.quoteSetting ? store.quoteSetting.gender : null,
                sicCode: store.quoteSetting ? store.quoteSetting.sicCode : null,
                zipCode: store.quoteSetting ? store.quoteSetting.zipCode : null,
                tobaccoUser: store.quoteSetting ? store.quoteSetting.tobaccoUser : null,
                spouseAge: store.quoteSetting ? store.quoteSetting.spouseAge : null,
                spouseGender: store.quoteSetting ? store.quoteSetting.spouseGender : null,
                spouseTobaccoUser: store.quoteSetting ? store.quoteSetting.spouseTobaccoUser : null,
                numberDependentsExcludingSpouse: store.quoteSetting ? store.quoteSetting.numberDependentsExcludingSpouse : null,
                eligibleSubscribers: store.quoteSetting ? store.quoteSetting.eligibleSubscribers : null,
                salarySelection: store.quoteSetting ? store.quoteSetting.salarySelection : null,
                annualSalary: store.quoteSetting ? store.quoteSetting.annualSalary : null,
                hourlyRate: store.quoteSetting ? store.quoteSetting.hourlyRate : null,
                hoursPerWeek: store.quoteSetting ? store.quoteSetting.hoursPerWeek : null,
                weeksPerYear: store.quoteSetting ? store.quoteSetting.weeksPerYear : null,
                hourlyAnnually: store.quoteSetting ? store.quoteSetting.hourlyAnnually : null,
            };
            patchState({
                quoteSetting: setting,
            });
        } else {
            const setting: QuoteSettingsSchema = {
                state: quoteSetting.state ? quoteSetting.state : store.quoteSetting.state,
                channel: quoteSetting.channel ? quoteSetting.channel : store.quoteSetting.channel,
                riskClass: quoteSetting.riskClass ? quoteSetting.riskClass : store.quoteSetting.riskClass,
                payFrequency: quoteSetting.payFrequency ? quoteSetting.payFrequency : store.quoteSetting.payFrequency,
                age: quoteSetting.age,
                gender: quoteSetting.gender,
                sicCode: quoteSetting.sicCode,
                zipCode: quoteSetting.zipCode,
                tobaccoUser: quoteSetting.tobaccoUser,
                spouseAge: quoteSetting.spouseAge,
                spouseGender: quoteSetting.spouseGender,
                spouseTobaccoUser: quoteSetting.spouseTobaccoUser,
                numberDependentsExcludingSpouse: quoteSetting.numberDependentsExcludingSpouse,
                eligibleSubscribers: quoteSetting.eligibleSubscribers,
                salarySelection: quoteSetting.salarySelection,
                annualSalary: quoteSetting.annualSalary,
                hourlyRate: quoteSetting.hourlyRate,
                hoursPerWeek: quoteSetting.hoursPerWeek,
                weeksPerYear: quoteSetting.weeksPerYear,
                hourlyAnnually: quoteSetting.hourlyAnnually,
            };
            patchState({
                quoteSetting: setting,
            });
        }
    }

    /**
     * Reset only zip code setting in quote level settings.
     * @param param0 NGXS state related params, automatically passed
     */
    @Action(ResetQuoteLevelSettingZipCode)
    ResetQuoteLevelSettingZipCode({ patchState, getState }: StateContext<UniversalStateModel>): void {
        const store = getState();
        const quoteSetting = this.utilService.copy(store.quoteSetting);
        quoteSetting.zipCode = null;
        patchState({
            quoteSetting: quoteSetting,
        });
    }

    // Action to remove plan pricing for all plans
    @Action(RemovePlanPricing)
    RemovePlanPricing({ patchState, getState }: StateContext<UniversalStateModel>): void {
        const store = getState();
        const products = this.utilService.copy(store.product);
        products.forEach((prod) => {
            prod.plans.forEach((plan) => {
                plan.pricing = null;
            });
        });
        patchState({
            product: products,
        });
    }
    // Action to remove plan selections
    @Action(RemoveSelections)
    RemoveSelections({ patchState, getState }: StateContext<UniversalStateModel>): void {
        const store = getState();
        const products = this.utilService.copy(store.product);
        products.forEach((prod) => {
            prod.plans.forEach((plan) => {
                plan.pricing = null;
                plan.riders = null;
                plan.planPriceSelection = [];
                plan.rateSheetSelection = false;
                plan.coverageLevels = [];
                plan.selectedEliminationPeriod = null;
                plan.multiplePlanPriceSelections = {};
            });
        });
        patchState({
            product: products,
        });
    }
}
