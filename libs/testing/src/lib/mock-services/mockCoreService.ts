import { CoreService } from "@empowered/api";
import { CoverageLevel, PlanSeries, Product } from "@empowered/constants";
import { of } from "rxjs";

export const mockCoreService = {
    getProduct: (productId: number) => of({} as Product),
    getCarrier: (carrierId: number) => of({}),
    getPlanSeries: () => of([] as PlanSeries[]),
    getCoverageLevels: (
        planId: string,
        coverageLevelId?: number,
        fetchRetainRiders?: boolean,
        stateCode?: string,
        includeRules?: boolean,
    ) => of([] as CoverageLevel[]),
    getProducts: () => of([] as Product[]),
} as unknown as CoreService;
