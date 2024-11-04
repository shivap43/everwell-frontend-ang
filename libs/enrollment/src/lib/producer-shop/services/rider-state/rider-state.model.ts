import { MissingInfoType, EnrollmentRequirement, EnrollmentRider, Enrollments } from "@empowered/constants";
import {
    BenefitAmountState,
    CoverageLevelState,
    RiderPanelIdentifiers,
} from "../producer-shop-component-store/producer-shop-component-store.model";

/**
 * Used to determine if a RIDER `PlanOffering` (which is commonly referred to a `Rider`) is checked/selected and disabled.
 * It is also used to determine its selected `CoverageLevel` name and selected BenefitAmount `Pricing`.
 *
 * Also contains other values used to determine the checked state of the `Rider`
 *
 * This instance only stores `CoverageLevel` name instead of the whole `CoverageLevel` instance
 * since the actual instance depends on which of the BASE `Plan's` selected `CoverageLevel` is.
 * Since the whole `CoverageLevel` isn't static,
 * we only store the `static` property `name`.
 *
 * For the same reason, we only store the PlanOffering `static` property `benefitAmount`
 *
 * Each BASE or RIDER `PlanOffering` may have multiple `Riders`
 */
export interface RiderState {
    identifiers: RiderPanelIdentifiers;
    planId: number;
    /**
     * `PlanOffering id` of `Rider`
     *
     * Used to generate `RiderState` entity id
     *
     * @deprecated Use `identifiers` instead
     *  */
    riderPlanOfferingId: number;
    /**
     * `Plan id` of `Rider`
     *
     * Used to generate `RiderState` entity id
     *  */
    riderPlanId: number;
    /** `Product id` of `PlanOffering` that contains `Rider` */
    productId: number;
    /** `ProductOffering id` of `PlanOffering` that contains `Rider` */
    productOfferingId: number;
    /**
     * `Riders` may have a dependency on another `Rider`
     *
     * This is determined if one (parent) `Rider`.planId matches a (child) `Rider`.riderParentPlanId
     *
     * If defined, a `RiderState` is disabled and unchecked when parent `RiderState` is unchecked
     **/
    riderParentPlanId?: number;
    /** `Rider` Plan policySeries */
    planPolicySeries?: string;
    // ** `Rider` Plan enrollmentRequirements. Determines enable/disable state outside of `riderParentPlanId` */
    enrollmentRequirements: EnrollmentRequirement[];
    /** `Rider` Plan name */
    riderPlanName: string;
    /** Local state that determines if `Rider` is selected */
    checked: boolean;
    /**
     * Local state that determines that `Rider` checked value cannot change.
     *
     * A `Rider` disabled state. A `RiderState` can still be `checked` even if `disabled`.
     * Determined by `riderParentPlanId` and `enrollmentRequirements.
     */
    disabled: boolean;
    /**  Determines if Rider related to Broker Plans has Broker Plan selected.
     * Should default to undefined if Rider is not related to Broker Plan */
    brokerSelected?: boolean;
    /**
     * `CoverageLevel` names associated with `Rider`. If there would be 1 value, the array will be empty instead.
     * We shouldn't store the whole CoverageLevel since this would change depending on the Rider's BASE Plan's selected CoverageLevel.
     * Since this array would change depending on the BASE Plan's selected CoverageLevel,
     * we are only storing the names since we don't have to keep the selected name in sync.
     *
     * This excludes `EliminationPeriods`. Use `eliminationPeriodNames` instead for `EliminationPeriods`
     */
    coverageLevelNames: string[];
    /**
     * Same as `coverageLevelNames` property but is specific to `EliminationPeriod` `CoverageLevel` names.
     */
    eliminationPeriodNames: string[];
    /**
     * Selected `CoverageLevel` name for `Rider`.
     * Be sure to check if `Rider` is `checked/selected` when using.
     * We shouldn't store the whole CoverageLevel since this would change depending on the Rider's BASE Plan's selected CoverageLevel.
     * Since this array would change depending on the BASE Plan's selected CoverageLevel,
     * we are only storing the names since we don't have to keep the selected name in sync.
     *
     * This excludes `EliminationPeriods`. Use `selectedEliminationPeriodName` instead for `EliminationPeriods`
     */
    selectedCoverageLevelName?: string | null;
    /**
     * Same as `selectedCoverageLevelName` property but is specific to selected `EliminationPeriod` `CoverageLevel` name.
     */
    selectedEliminationPeriodName?: string | null;
    /**
     * PlanOfferingPricing `benefitAmount` numeric values associated with `Rider`.
     * If there would be 1 value, the array will be empty instead.
     * Based on `riderPlanOfferingPricings` benefitAmount numeric values and is sorted
     * We shouldn't store the whole PlanOfferingPricing since this would change depending on the Rider's BASE Plan's selected CoverageLevel.
     * Since this array would change depending on the BASE Plan's selected CoverageLevel,
     * we are only storing the names since we don't have to keep the selected name in sync.
     */
    benefitAmounts: number[];
    missingInformation?: MissingInfoType;
    /** selected PlanOfferingPricing's `benefitAmount` for `Rider`. Be sure to check if `Rider` is `checked/selected` when using */
    selectedBenefitAmount?: number | null;
    /** Selected BenefitAmount numeric value of RiderState with `riderParentPlanId`
     *
     * Unlike getting CoverageLevel from Parent Plan, BenefitAmount can come from BASE Plan or some Parent RiderState
     * */
    riderParentPlanSelectedBenefitAmount?: number | null;
    /**
     * Selected parent Plan CoverageLevel id. This value comes directly from api response
     *
     * @deprecated We shouldn't have to store the BASE Plan Offering's benefit amount on the RiderState
     * Instead, we should pass the CoverageLevelState from ProducerShopComponentStore and filter by PlanOffering.id as needed
     * */
    parentPlanCoverageLevelId: number | null;
    /** optional text shown under disabled mat-checkbox for riders dropdown. Populated when rider is in disabled state */
    disableText?: string;
    /** Determine if Rider is ROP Rider or not  */
    returnOfPremiumRider?: boolean;
    /** Whether the rider comes with pricing array */
    riderHasPrice?: boolean;
}

/**
 * Possible values for `EnrollmentRequirement.relatedPlanType`
 */
export enum EnrollmentRequirementPlanType {
    BASE = "BASE",
    RIDER = "RIDER",
}

/**
 * Additional values outside of the other `RiderStates` to validate `RiderState` against
 */
export interface RiderStateValidationOptions {
    /** `MemberDependents` includes spouse */
    memberHasSpouse: boolean;
    /** `MemberDependents` includes child */
    memberHasChild: boolean;
    /** `Enrollments` for `MemberProfile` session */
    enrollments: Enrollments[];
    /** All concatenated `EnrollmentRiders` based on `Enrollments` */
    enrollmentRiders: EnrollmentRider[];
    /** Array of Rider `Plan` ids that are mandatory (should always be disabled and checked) */
    mandatoryRiderPlanIds: number[];
    /** Array of Rider `Plan` ids that are considered "ADD ON" Riders.
     * Should always be disabled and may be auto checked depending on selection related `EnrollmentRequirements` */
    addOnRiderPlanIds: number[];
    /** Array of Rider Broker `Plan` ids.
     * Should always be disabled and may be auto checked depending on Broker related `EnrollmentRequirements` */
    riderBrokerPlanIds: number[];
    /** Array of all BASE PlanOffering CoverageLevelStates. Used to enable / disable riders that depend on some selected CoverageLevel */
    allBaseCoverageLevels: CoverageLevelState[];
    /** Array of all BASE PlanOffering BenefitAmountStates. Used to enable / disable riders that depend on some selected BenefitAmount */
    allBaseBenefitAmounts: BenefitAmountState[];
    isSupplementaryPlan?: boolean;
}
