import { of } from "rxjs";
import { CommissionSplit, WebexConnectInfo } from "@empowered/api";
import { CompanyCode, PlanSeriesChoice, RateSheetPlanSeriesOption, WritingNumber } from "@empowered/constants";

export const mockAflacService = {
    getWebexConnectionAndLicenseStatus: (mgGroup: number, memberId: number) => of({} as WebexConnectInfo),
    importAflacPolicies: (memberId: number, mpGroup: number) => of(undefined),
    policyLookup: (memberId: number, policyNumber: string, mpGroup: number, productId?: number, isConversionFlow?: boolean) =>
        of(undefined),

    getMemberConsent: (memberId: number, mpGroup: string) => of(true),
    getCommissionSplits: (mpGroup: string) => of([] as CommissionSplit[]),
    refreshAccount: (mpGroup: string) => of({}),
    getSitCodes: (companyCode: CompanyCode, includeExpired: boolean, allAccountProducers: boolean, mpGroup?: string) =>
        of([
            {
                sitCodes: [
                    {
                        companyCode: "NY",
                        id: 2,
                    },
                ],
            },
        ] as WritingNumber[]),
    getRateSheetPlanSeriesOptions: (
        planSeriesId: number,
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
    ) => of([] as RateSheetPlanSeriesOption[]),
    downloadRateSheet: (
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        rateSheetTitle: string,
        planSeriesChoices: PlanSeriesChoice[],
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
    ) => of(""),
};
