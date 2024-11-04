/**
 * @description array of productPlans
 */
export interface ProposalPlanChoices {
    productPlans: ProductPlans[];
}

export interface ProductPlans {
    productId: number;
    planIds: number[];
}
