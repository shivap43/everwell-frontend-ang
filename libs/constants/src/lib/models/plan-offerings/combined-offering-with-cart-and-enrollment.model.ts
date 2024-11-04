import { ProductOffering } from "../productOffering.model";
import { PlanOfferingWithCartAndEnrollment } from "./plan-offering-with-cart-and-enrollment.model";

// Holds Combined offerings with product offering and planOfferingsWithCartAndEnrollment
export interface CombinedOfferingWithCartAndEnrollment {
    productOffering: ProductOffering;
    planOfferingsWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment[];
}
