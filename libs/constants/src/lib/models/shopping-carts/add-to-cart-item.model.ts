import { EnrollmentMethod } from "../../enums";
import { AddCartItem } from "../addCartItem.model";

export interface AddToCartItem extends AddCartItem {
    enrollmentMethod: EnrollmentMethod;
    enrollmentState: string;
    assistingAdminId?: number;
    productOfferingId?: number;
    enrollmentId?: number;
}
