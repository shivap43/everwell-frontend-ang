import { ThirdPartyPlatformRequirement } from "@empowered/api";
import { PlanPanel, PlansProductData } from "@empowered/constants";
import { of } from "rxjs";

export const mockBenefitOfferingHelperService = {
    getTaxStatusConfig: () => of([] as number[]),
    fetchAccountTPPStatus: () => of(true),
    getThirdPartyPlatformRequirements: (isTppUpdated?: boolean) => of({} as ThirdPartyPlatformRequirement),
    isNextRestricted: (
        isHQFunded: boolean,
        isEmpFunded: boolean,
        productList: PlansProductData[],
        plansList: PlanPanel[],
        productId: string,
        plans: PlanPanel[],
        isNoneSelected: boolean,
        productIdNumber: string,
        productIdToBeNavigated?: string,
    ) => true,
};
