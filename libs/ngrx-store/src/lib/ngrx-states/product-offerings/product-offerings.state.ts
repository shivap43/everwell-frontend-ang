import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { ProductContributionLimit } from "@empowered/api";
import { getEntityId } from "../../ngrx.store.helpers";
import {
    ProductOfferingsIdentifiers,
    ProductOfferingsEntity,
    DeclineProductOfferingIdentifiers,
    DeclineProductOfferingEntity,
    ContributionLimitsIdentifiers,
    ContributionLimitsEntity,
} from "./product-offerings.model";
import { PlanYearsIdentifiers, PlanYearsEntity } from "./product-offerings.model";
import { AsyncData, ProductOffering, PlanYear } from "@empowered/constants";
import { NullishPartial } from "../../store.model";

// #region ProductOfferings State
export const getProductOfferingsEntityId = ({ mpGroup, referenceDate }: ProductOfferingsIdentifiers) => `${mpGroup}-${referenceDate}`;

export const productOfferingSetsEntityAdapter = createEntityAdapter<ProductOfferingsEntity<AsyncData<ProductOffering[]>>>({
    selectId: ({ identifiers }) => getProductOfferingsEntityId(identifiers),
});

export type ProductOfferingSetsState = EntityState<ProductOfferingsEntity<AsyncData<ProductOffering[]>>>;
// #endregion

// #region DeclineProductOffering State
export const getDeclineProductOfferingEntityId = ({
    productOfferingId,
    memberId,
    enrollmentMethod,
    mpGroup,
    assistingAdminId,
}: NullishPartial<DeclineProductOfferingIdentifiers>) =>
    getEntityId(productOfferingId, mpGroup, enrollmentMethod, memberId, assistingAdminId);

export const declineProductOfferingEntityAdapter = createEntityAdapter<DeclineProductOfferingEntity<AsyncData<null>>>({
    selectId: ({ identifiers }) => getDeclineProductOfferingEntityId(identifiers),
});

export type DeclineProductOfferingSetsState = EntityState<DeclineProductOfferingEntity<AsyncData<null>>>;
// #endregion

// #region PlanYears State
export const getPlanYearsEntityId = ({ mpGroup }: PlanYearsIdentifiers) => mpGroup;

export const planYearSetsEntityAdapter = createEntityAdapter<PlanYearsEntity<AsyncData<PlanYear[]>>>({
    selectId: ({ identifiers }) => getPlanYearsEntityId(identifiers),
});

export type PlanYearSetsState = EntityState<PlanYearsEntity<AsyncData<PlanYear[]>>>;
// #endregion

// #region ContributionLimit State
export const getContributionLimitsEntityId = ({ mpGroup, productId }: ContributionLimitsIdentifiers) => getEntityId(mpGroup, productId);

export const contributionLimitsEntityAdapter = createEntityAdapter<ContributionLimitsEntity<AsyncData<ProductContributionLimit>>>({
    selectId: ({ identifiers }) => getContributionLimitsEntityId(identifiers),
});

export type ContributionLimitEntities = EntityState<ContributionLimitsEntity<AsyncData<ProductContributionLimit>>>;
// #endregion

export interface State {
    selectedReferenceDate?: string | null;
    productOfferingSetsEntities: ProductOfferingSetsState;
    declineProductOfferingEntities: DeclineProductOfferingSetsState;
    planYearSetsEntities: PlanYearSetsState;
    contributionLimitsEntities: ContributionLimitEntities;
}

export const initialState: State = {
    productOfferingSetsEntities: productOfferingSetsEntityAdapter.getInitialState({}),
    declineProductOfferingEntities: declineProductOfferingEntityAdapter.getInitialState({}),
    planYearSetsEntities: planYearSetsEntityAdapter.getInitialState({}),
    contributionLimitsEntities: contributionLimitsEntityAdapter.getInitialState({}),
};
