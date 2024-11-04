import { of } from "rxjs";

export const mockNGXSRateSheetsStateService = {
    getAdminPreference: () => of([]),
    getLevelSettings: () => of({ value: [] }),
    getChannels: () => {},
    getConfigurations: () => {},
    setAdminPreference: (adminId: number) => {},
    setQuoteLevelData: () => {},
    setRestrictedConfiguration: () => {},
};
