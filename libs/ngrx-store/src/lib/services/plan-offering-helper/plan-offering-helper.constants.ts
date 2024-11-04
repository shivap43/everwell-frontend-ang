/**
 * @deprecated we do have same enum in constant lib, To use that we need to change Ids for juvenile term life and whole life.
 */
// product id enum
export enum ProductId {
    LTD = 32,
    ACCIDENT = 1,
    SHORT_TERM_DISABILITY = 5,
    TERM_LIFE = 29,
    WHOLE_LIFE = 28,
    // NOTE: Ids for juvenile term life and whole life needs to change in release branch
    JUVENILE_TERM_LIFE = 67,
    JUVENILE_WHOLE_LIFE = 65,
}
