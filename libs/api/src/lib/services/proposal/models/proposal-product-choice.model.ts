/**
 * @description both individual and group may be true, but they may not both be false
 */
export interface ProposalProductChoice {
    productId: number;
    individual?: boolean;
    group?: boolean;
    valueAddedService?: boolean;
}
