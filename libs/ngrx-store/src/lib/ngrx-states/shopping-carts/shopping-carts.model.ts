import { EnrollmentMethod, Entity } from "@empowered/constants";

/**
 * Interface to get cart items
 */
export interface CartItemsIdentifiers {
    memberId: number;
    mpGroup: number;
}

export type CartItemsEntity<Value> = Entity<CartItemsIdentifiers, Value>;

/**
 * Identifier interface to add/ update cart items
 */
export interface AddUpdateCartIdentifiers {
    memberId: number;
    mpGroup: number;
    enrollmentMethod: EnrollmentMethod;
    enrollmentState: string;
}
export type AddToCartEntity<Value> = Entity<AddUpdateCartIdentifiers, Value>;

export type UpdateCartItemEntity<Value> = Entity<AddUpdateCartIdentifiers, Value>;

export interface DeleteCartItemIdentifiers {
    memberId: number;
    mpGroup: number;
}
export type DeleteCartItemEntity<Value> = Entity<DeleteCartItemIdentifiers, Value>;

export interface LoadCartItemIdentifiers {
    memberId: number;
    itemId: number;
    mpGroup: number;
}

export type LoadCartItemEntity<Value> = Entity<LoadCartItemIdentifiers, Value>;
