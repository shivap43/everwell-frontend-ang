import { EnrollmentMethodDetail, GetShoppingCart } from "@empowered/api";
import { AddCartItem, PlanOffering, MoreSettings, Characteristics, CoverageDatesRecord } from "@empowered/constants";
import { Subject, of } from "rxjs";

export const mockShoppingService = {
    getPlanOfferings: (
        planOfferingId?: string,
        enrollmentMethod?: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        expand?: string,
        referenceDate?: string,
    ) => of([] as PlanOffering[]),
    updateCartItem: (memberId: number, mpGroup: number, id: number, cart: AddCartItem) => of({}),
    getPlanOfferingPricing: (
        planOfferingId: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        parentPlanId?: number,
        parentPlanCoverageLevelId?: number,
        baseBenefitAmount?: number,
        childAge?: number,
        coverageEffectiveDate?: string,
        riskClassId?: number,
        fromApplicationFlow: boolean = false,
        shoppingCartItemId?: number,
        includeFee?: boolean,
    ) => of([]),
    getShoppingCart: (memberId: number, mpGroup: number, planYearId?: number[]) => of({} as GetShoppingCart),
    getPlanCoverageDatesMap: (memberId: number, mpGroup: number) => of({} as CoverageDatesRecord),
    isVASPlanEligible$: new Subject<any>(),
    getPlanOffering: (planOfferingId?: string, mpGroup?: number) =>
        of({
            plan: {
                characteristics: [Characteristics.STACKABLE],
            },
        } as PlanOffering),
    getEnrollmentMethods: (mpGroupId: number) => of([]),
};
