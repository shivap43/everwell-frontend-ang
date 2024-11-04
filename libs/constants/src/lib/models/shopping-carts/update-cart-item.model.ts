import { AddToCartItem } from "./add-to-cart-item.model";

export interface UpdateCartItem extends AddToCartItem {
    cartItemId: number;
}
