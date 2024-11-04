import { createAction, props, union } from "@ngrx/store";

export const clearMemberRelatedState = createAction("[Global] Clear Member Related State");

export const setSelectedPlanPanelIdentifiers = createAction(
    "[Global] Set Selected PlanPanel Identifiers",
    props<{ planId: number; planOfferingId: number; cartItemId?: number | null; enrollmentId?: number | null }>(),
);

export const setSelectedCartItemIdentifiers = createAction(
    "[Global] Set Selected CartItem Identifiers",
    props<{ planId: number; planOfferingId: number; cartItemId: number; productId: number }>(),
);

export const setSelectedProductOfferingIdentifiers = createAction(
    "[Global] Set Selected Product Offering Identifiers",
    props<{ productOfferingId: number; productId: number }>(),
);

const actions = union({
    clearMemberRelatedState,
    setSelectedPlanPanelIdentifiers,
    setSelectedCartItemIdentifiers,
    setSelectedProductOfferingIdentifiers,
});

export type ActionsUnion = typeof actions;
