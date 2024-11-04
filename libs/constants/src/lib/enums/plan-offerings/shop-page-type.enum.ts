/**
 * Used in multiple shop page conditions, that are based on shop page type
 */
export enum ShopPageType {
    // first three are for single plan year
    SINGLE_OE_SHOP = "SINGLE_OE_SHOP",
    SINGLE_QLE_SHOP = "SINGLE_QLE_SHOP",
    CONTINUOUS_SHOP = "CONTINUOUS_SHOP",
    // Next four are for dual plan year
    DUAL_OE_SHOP = "DUAL_OE_SHOP",
    DUAL_QLE_SHOP = "DUAL_QLE_SHOP",
    DUAL_CURRENT_QLE = "DUAL_CURRENT_QLE",
    DUAL_FUTURE_QLE = "DUAL_FUTURE_QLE",
}
