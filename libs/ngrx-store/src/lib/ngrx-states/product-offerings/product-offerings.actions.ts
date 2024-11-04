import { createAction, props, union } from "@ngrx/store";
import { ProductContributionLimit } from "@empowered/api";

import { DeclineProductOfferingEntity, ProductOfferingsEntity, PlanYearsEntity, ContributionLimitsEntity } from "./product-offerings.model";
import { ApiError, EnrollmentMethod, ProductOffering, PlanYear } from "@empowered/constants";

// Set the selected reference date from dual plan year service
export const setSelectedReferenceDate = createAction(
    "[PlanOfferings/Shopping/API] Set Selected Reference Date",
    props<{ referenceDate: string }>(),
);

// #region ProductOfferings
export const loadProductOfferingSet = createAction(
    "[ProductOfferings/Shopping/API] Load ProductOfferings",
    props<{
        mpGroup: number;
        referenceDate: string; // Uses this format DateFormat.YEAR_MONTH_DAY_UPPERCASE
    }>(),
);

export const loadProductOfferingSetSuccess = createAction(
    "[ProductOfferings/Shopping/API] Load ProductOfferings Success",
    props<{ productOfferingSet: ProductOfferingsEntity<ProductOffering[]> }>(),
);

export const loadProductOfferingSetFailure = createAction(
    "[ProductOfferings/Shopping/API] Load ProductOfferings Failure",
    props<{ error: ProductOfferingsEntity<ApiError> }>(),
);
// #endregion

// #region Decline ProductOffering
export const declineProductOffering = createAction(
    "[DeclineProduct/Shopping/API] Decline ProductOffering",
    props<{
        productOfferingId: number;
        memberId: number;
        enrollmentMethod: EnrollmentMethod;
        mpGroup: number;
    }>(),
);

export const declineProductOfferingSuccess = createAction(
    "[DeclineProduct/Shopping/API] Decline ProductOfferings Success",
    props<{ declineProductOfferingEntity: DeclineProductOfferingEntity<null> }>(),
);

export const declineProductOfferingFailure = createAction(
    "[DeclineProduct/Shopping/API] Decline ProductOfferings Failure",
    props<{ error: DeclineProductOfferingEntity<ApiError> }>(),
);
// #endregion

// #region PlanYears
export const loadPlanYearSet = createAction("[PlanYears/BenefitOffering/API] Load PlanYears", props<{ mpGroup: number }>());

export const loadPlanYearSetSuccess = createAction(
    "[PlanYears/BenefitOffering/API] Load PlanYears Success",
    props<{ planYearSet: PlanYearsEntity<PlanYear[]> }>(),
);

export const loadPlanYearSetFailure = createAction(
    "[PlanYears/BenefitOffering/API] Load PlanYears Failure",
    props<{ error: PlanYearsEntity<ApiError> }>(),
);
// #endregion

// #region contributionLimit
export const loadContributionLimit = createAction(
    "[ContributionLimits/BenefitOffering/API] Load ContributionLimit",
    props<{ mpGroup: number; productId: number }>(),
);

export const loadContributionLimitSuccess = createAction(
    "[ContributionLimits/BenefitOffering/API] Load ContributionLimit Success",
    props<{ contributionLimitEntity: ContributionLimitsEntity<ProductContributionLimit> }>(),
);

export const loadContributionLimitFailure = createAction(
    "[ContributionLimits/BenefitOffering/API] Load ContributionLimit Failure",
    props<{ error: ContributionLimitsEntity<ApiError> }>(),
);
// #endregion

const actions = union({
    setSelectedReferenceDate,

    loadProductOfferingSet,
    loadProductOfferingSetSuccess,
    loadProductOfferingSetFailure,

    declineProductOffering,
    declineProductOfferingSuccess,
    declineProductOfferingFailure,

    loadPlanYearSet,
    loadPlanYearSetSuccess,
    loadPlanYearSetFailure,

    loadContributionLimit,
    loadContributionLimitSuccess,
    loadContributionLimitFailure,
});

export type ActionsUnion = typeof actions;
