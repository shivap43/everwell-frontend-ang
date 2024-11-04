import { GetCartItems } from "./getCartItems.model";

export interface GroupedCartItems {
    postTaxPlans: GetCartItems[];
    preTaxPlans: GetCartItems[];
    vasPlans: GetCartItems[];
}
