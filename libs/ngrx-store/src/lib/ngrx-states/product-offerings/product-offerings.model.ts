import { EnrollmentMethod, Entity } from "@empowered/constants";

/**
 * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getProductOfferings
 *
 * referenceDate - The date at which the operation should be considered if no value is provided,
 * assume the date to be TODAY. Uses this format DateFormat.YEAR_MONTH_DAY_UPPERCASE
 */
export interface ProductOfferingsIdentifiers {
    mpGroup: number;
    referenceDate: string;
}

export type ProductOfferingsEntity<Value> = Entity<ProductOfferingsIdentifiers, Value>;

/**
 * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/declineProduct
 */
export interface DeclineProductOfferingIdentifiers {
    productOfferingId: number;
    memberId: number;
    enrollmentMethod: EnrollmentMethod;
    mpGroup: number;
    assistingAdminId?: number;
}

export type DeclineProductOfferingEntity<Value> = Entity<DeclineProductOfferingIdentifiers, Value>;

export interface PlanYearsIdentifiers {
    mpGroup: number;
}

export type PlanYearsEntity<Value> = Entity<PlanYearsIdentifiers, Value>;

export interface ContributionLimitsIdentifiers {
    mpGroup: number;
    productId: number;
}

export type ContributionLimitsEntity<Value> = Entity<ContributionLimitsIdentifiers, Value>;
