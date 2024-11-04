export const MaintenanceAddProductsSteps = {
    withPricing: {
        PRODUCTS: 0,
        PLANS: 1,
        COVERAGE_DATES: 3,
        PRICES_ELIGIBILITY: 4,
        CARRIER_FORMS: 5,
        REVIEW_SUBMIT: 6,
    },
    withoutPricing: {
        PRODUCTS: 0,
        PLANS: 1,
        COVERAGE_DATES: 3,
        CARRIER_FORMS: 4,
        REVIEW_SUBMIT: 5,
    },
};

export const MaintenanceBOTabs = {
    withBenefitDollars: {
        PRODUCTS: 1,
        CARRIER_FORMS: 2,
        SETTINGS: 3,
        BENEFIT_DOLLARS: 4,
        APPROVALS: 5,
    },
    withoutBenefitDollars: {
        PRODUCTS: 1,
        CARRIER_FORMS: 2,
        SETTINGS: 3,
        APPROVALS: 4,
    },
    withoutBenefitDollarsAndCarrierForms: {
        PRODUCTS: 1,
        SETTINGS: 2,
        APPROVALS: 3,
    },
};
