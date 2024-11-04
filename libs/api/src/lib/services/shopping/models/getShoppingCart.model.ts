export interface GetShoppingCart {
    cartId: number;
    productOfferingsInCart: number[];
    productOfferingsDeclined: number[];
    totalCost: number;
    recentExpiredCartItemIds: number[];
    locked: boolean;
    lockedBy: string;
}
