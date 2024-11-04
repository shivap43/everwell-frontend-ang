import {
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    Entity,
    PlanOfferingPricingsIdentifiers,
    MissingInfoType,
    CoverageLevel,
    PlanOffering,
    PlanOfferingPricing,
    DisableType,
} from "@empowered/constants";
import { HttpErrorResponse } from "@angular/common/http";

/**
 * Used to represent response to API request involving PlanOfferings:
 *
 * On Success, planOfferings property is populated.
 * On failed, httpErrorResponse property is populated.
 *
 * Only one property can be populated at any given time.
 */
export type PlanOfferingsApiResponse =
    | {
          planOfferings: PlanOffering[];
          httpErrorResponse?: never;
      }
    | {
          planOfferings?: never;
          httpErrorResponse: HttpErrorResponse;
      };

/**
 * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getPlanOfferings
 *
 * referenceDate - The date at which the operation should be considered if no value is provided,
 * assume the date to be TODAY. Uses this format DateFormat.YEAR_MONTH_DAY_UPPERCASE
 */
export interface PlanOfferingsIdentifiers {
    mpGroup: number;
    memberId: number;
    enrollmentMethod: EnrollmentMethod;
    stateAbbreviation: string;
    referenceDate: string;
}

export type PlanOfferingsEntity<Value> = Entity<PlanOfferingsIdentifiers, Value>;

/**
 * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getPlanOfferingRiders
 */
export interface PlanOfferingRidersIdentifiers {
    planOfferingId: number;
    mpGroup: number;
    memberId: number;
    enrollmentMethod: EnrollmentMethod;
    stateAbbreviation: string;
    coverageEffectiveDate?: string;
}

export type PlanOfferingRidersEntity<Value> = Entity<PlanOfferingRidersIdentifiers, Value>;

export type PlanOfferingPricingsEntity<Value> = Entity<PlanOfferingPricingsIdentifiers, Value>;

export interface PlanOfferingRiderData {
    rider: PlanOffering;
    pricings: PlanOfferingPricing[];
}

/**
 * Interface for the "Coverage level" data
 */
export interface CoverageLevelIdentifiers {
    mpGroup: number;
    planId: number;
    fetchRetainRiders?: boolean;
    parentCoverageLevelId?: number | null;
    stateCode?: string | null;
}

export type CoverageLevelEntity<Value> = Entity<CoverageLevelIdentifiers, Value>;

// #region CoverageDatesRecords
export type CoverageDatesRecordsEntity<Value> = Entity<CoverageDatesRecordsIdentifiers, Value>;

export interface CoverageDatesRecordsIdentifiers {
    mpGroup: number;
    memberId: number;
    coverageDatesEnrollmentType: CoverageDatesEnrollmentType;
    referenceDate: string;
}

export interface KnockoutQuestionsIdentifiers {
    planOfferingId: number;
    mpGroup: number;
    memberId: number;
    stateAbbreviation: string;
}

export type KnockoutQuestionsEntity<Value> = Entity<KnockoutQuestionsIdentifiers, Value>;

export interface KnockoutResponsesIdentifiers {
    mpGroup: number;
    memberId: number;
}

export type LoadKnockoutResponsesEntity<Value> = Entity<KnockoutResponsesIdentifiers, Value>;

export type SaveKnockoutResponsesEntity<Value> = Entity<KnockoutResponsesIdentifiers, Value>;

export interface DisablePanel {
    type: DisableType;
    message?: MissingInfoType;
}

// Note: Reason to create below interface is CoverageLevel has id, name and eliminationPeriod is optional.
// data model for elimination period set
export interface EliminationPeriod extends CoverageLevel {
    id: number;
    name: string;
    eliminationPeriod: string;
}
// #endregion
