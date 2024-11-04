import { Enrollments } from "../enrollments.model";
import { GetCartItems } from "../getCartItems.model";
import { PlanOffering } from "../planOffering.model";

// Holds plan offering and its related cart item and enrollment
export interface PlanOfferingWithCartAndEnrollment {
    planOffering: PlanOffering;
    enrollment?: Enrollments;
    cartItemInfo?: GetCartItems;
}
