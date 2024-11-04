/**
 * @description Interface to exchange editPlan details.
 * @export
 * @interface EditPlan
 */
export interface EditPlan {
    editProductId?: number;
    editPlanId?: number;
    cartItemId: number;
    isCloseOverlay: boolean;
}
