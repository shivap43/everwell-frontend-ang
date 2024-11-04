import { AsyncData, CountryState, PayFrequency, RiskClass } from "@empowered/constants";
// eslint-disable-next-line max-len
import { RateSheetPanelIdentifiers } from "libs/rate-sheets/src/lib/rate-sheets/rate-sheets/rate-sheets-component-store/rate-sheets-component-store.model";
import { of } from "rxjs";

export const mockRateSheetsComponentStoreService = {
    setCountryState: (value: AsyncData<CountryState>) => {},
    setChannel: (value: AsyncData<string>) => {},
    setPayFrequency: (value: AsyncData<PayFrequency>) => {},
    setRiskClass: (value: AsyncData<RiskClass>) => {},
    setMoreSettings: (value: AsyncData<{ zipCode: string; sicCode: number; eligibleSubscribers: number }>) => {},
    selectMoreSettingsOnAsyncValue: (value: AsyncData<{ zipCode: string; sicCode: number; eligibleSubscribers: number }>) => {},
    selectRateSheetSettings: () => of(null),
    selectRiskClassOnAsyncValue: () => of(null),
    selectCountryStateOnAsyncValue: () => of(null),
    selectPaymentFrequencyOnAsyncValue: () => of(null),
    selectChannelOnAsyncValue: () => of(null),
    getRidersState: (panelIdentifiers: RateSheetPanelIdentifiers) => of(null),
};
