import { Injectable } from "@angular/core";
import { ApplicationStatusTypes } from "@empowered/api";
import { EnrollmentRequirement, PlanOffering, EnrollmentRider, Enrollments } from "@empowered/constants";
import { EnrollmentRequirementPlanType } from "../rider-state/rider-state.model";
import { BenefitAmountModifier, DependencyType, EnrollmentRequirementComparisonValues } from "./enrollment-requirements.model";

@Injectable({
    providedIn: "root",
})
export class EnrollmentRequirementsService {
    /**
     * Returns first `EnrollmentRequirement` that isn't satisfied by every `EnrollmentRequirementComparisonValues`
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source `EnrollmentRequirements`
     * @param valueSets {EnrollmentRequirementComparisonValues[]} - used to filter `EnrollmentRequirements`
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that doesn't have values
     */
    getEnrollmentRequirementWithoutValues(
        enrollmentRequirements: EnrollmentRequirement[],
        valueSets: EnrollmentRequirementComparisonValues[],
    ): EnrollmentRequirement | null {
        return (
            enrollmentRequirements.find((enrollmentRequirement) =>
                valueSets.every((values) => !this.enrollmentRequirementHasValues(enrollmentRequirement, values)),
            ) ?? null
        );
    }

    /**
     * Returns first `REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN` `EnrollmentRequirement`
     * that isn't satisfied by every EnrollmentRequirementComparisonValues.
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source EnrollmentRequirements
     * @param valueSets {EnrollmentRequirementComparisonValues[]} - used to filter EnrollmentRequirements
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that doesn't have values
     */
    getInvalidRequiredEnrollmentRequirement(
        enrollmentRequirements: EnrollmentRequirement[],
        valueSets: EnrollmentRequirementComparisonValues[],
    ): EnrollmentRequirement | null {
        // Find all `DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN` `EnrollmentRequirements`
        const planEnrollmentRequirements = this.getFilteredEnrollmentRequirements(
            enrollmentRequirements,
            DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
        );

        return this.getEnrollmentRequirementWithoutValues(planEnrollmentRequirements, valueSets);
    }

    /**
     * Returns first `EnrollmentRequirement` that doesn't have any of the listed RIDER planIds
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source `EnrollmentRequirements`
     * @param relatedPlanIds {number[]} - used to filter `EnrollmentRequirements`
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that doesn't have any of the listed planIds
     */
    getInvalidSelectionEnrollmentRequirement(
        enrollmentRequirements: EnrollmentRequirement[],
        relatedPlanIds: number[],
    ): EnrollmentRequirement | null {
        // Find all `DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN` enrollment requirements
        const planSelectionRequirements = this.getFilteredEnrollmentRequirements(
            enrollmentRequirements,
            DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN,
        );

        // Find an EnrollmentRequirement that doesn't have any of the selected planIds
        return this.getEnrollmentRequirementWithoutValues(
            planSelectionRequirements,
            relatedPlanIds.map((relatedPlanId) => ({
                relatedPlanId,
                relatedPlanType: EnrollmentRequirementPlanType.RIDER,
            })),
        );
    }

    /**
     * Returns first `EnrollmentRequirement` that is satisfied by one of the listed `EnrollmentRequirementComparisonValues`
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source `EnrollmentRequirements`
     * @param valueSets {EnrollmentRequirementComparisonValues[]} - used to filter `EnrollmentRequirements`
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that has values
     */
    getEnrollmentRequirementWithValue(
        enrollmentRequirements: EnrollmentRequirement[],
        valueSets: EnrollmentRequirementComparisonValues[],
    ): EnrollmentRequirement | null {
        return (
            enrollmentRequirements.find((enrollmentRequirement) =>
                valueSets.some((values) => this.enrollmentRequirementHasValues(enrollmentRequirement, values)),
            ) ?? null
        );
    }

    /**
     * Returns first `EnrollmentRequirement` that has one of the listed comparison values
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source `EnrollmentRequirements`
     * @param valueSets {EnrollmentRequirementComparisonValues[]} - used to filter `EnrollmentRequirements`
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that doesn't have values
     */
    getInvalidRequiredNonEnrollmentRequirement(
        enrollmentRequirements: EnrollmentRequirement[],
        valueSets: EnrollmentRequirementComparisonValues[],
    ): EnrollmentRequirement | null {
        // Find all DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN enrollment requirements
        const planNonEnrollmentRequirements = this.getFilteredEnrollmentRequirements(
            enrollmentRequirements,
            DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
        );

        return this.getEnrollmentRequirementWithValue(planNonEnrollmentRequirements, valueSets);
    }

    /**
     * Returns first `EnrollmentRequirement` that has one of the listed planIds
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - source `EnrollmentRequirements`
     * @param relatedPlanIds {number[]} - used to filter `EnrollmentRequirements`
     *
     * @returns {EnrollmentRequirement | null} EnrollmentRequirement that has one of the listed planIds
     */
    getInvalidNonSelectionEnrollmentRequirement(
        enrollmentRequirements: EnrollmentRequirement[],
        relatedPlanIds: number[],
    ): EnrollmentRequirement | null {
        // Find all DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN enrollment requirements
        const planNonSelectionRequirements = this.getFilteredEnrollmentRequirements(
            enrollmentRequirements,
            DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
        );

        // Find any enrollment requirements that are selected
        return this.getEnrollmentRequirementWithValue(
            planNonSelectionRequirements,
            relatedPlanIds.map((relatedPlanId) => ({
                relatedPlanId,
                relatedPlanType: EnrollmentRequirementPlanType.RIDER,
            })),
        );
    }

    /**
     * Determines if an `EnrollmentRequirement` has `DependencyType`
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - EnrollmentRequirements to check
     * @param dependencyType {DependencyType} - `DependencyType` that determines if array contains value
     *
     * @returns {boolean} - `EnrollmentRequirement` has `DependencyType`
     */
    enrollmentRequirementsHasDependencyType(enrollmentRequirements: EnrollmentRequirement[], dependencyType: DependencyType): boolean {
        return enrollmentRequirements.some((enrollmentRequirement) => enrollmentRequirement.dependencyType === dependencyType);
    }

    /**
     * Determines if `EnrollmentRequirement` has specific values. Even though `Enrollment` and `EnrollmentRider`
     * has `coverageLevelId` and/or `benefitAmount`, we should always use the selected `coverageLevelId` and/or `benefitAmount`
     * of the Rider's BASE Plan to compare values with `EnrollmentRequirement`
     *
     * @param enrollmentRequirement {EnrollmentRequirement} - Dependency that determines if `RiderState` should be disabled or not
     * @param values { EnrollmentRequirementComparisonValues } - values to check `EnrollmentRequirement` against
     *
     * @returns `EnrollmentRequirement` has specified values
     */
    enrollmentRequirementHasValues(enrollmentRequirement: EnrollmentRequirement, values: EnrollmentRequirementComparisonValues): boolean {
        const { relatedPlanId, coverageLevelId, benefitAmount, relatedPlanType } = values;

        if (enrollmentRequirement.relatedPlanType && enrollmentRequirement.relatedPlanType !== relatedPlanType) {
            return false;
        }

        if (enrollmentRequirement.relatedPlanId !== relatedPlanId) {
            return false;
        }

        // We have to do optional chaining for checking coverageLevels since some EnrollmentRequirements don't have coverageLevels
        // This goes against the api contract (api contract says that all EnrollmentRequirements have coverageLevels property)
        if (
            enrollmentRequirement.coverageLevels?.length &&
            !enrollmentRequirement.coverageLevels.some(({ id }) => id === coverageLevelId)
        ) {
            return false;
        }

        // Type assertion since the existing type is string and doesn't use an enum
        const benefitAmountModifier = enrollmentRequirement.benefitAmountModifier as BenefitAmountModifier;

        if (
            enrollmentRequirement.benefitAmountModifier &&
            !this.compareNumericValues(benefitAmount, benefitAmountModifier, enrollmentRequirement.benefitAmount)
        ) {
            return false;
        }

        return true;
    }

    /**
     * Determines if `EnrollmentRequirements` spouse requirements are met
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - `EnrollmentRequirements` to check
     * @param memberHasSpouse {boolean} - `MemberDependents` includes spouse
     *
     * @returns {boolean} `EnrollmentRequirements` spouse requirements are met
     */
    hasValidSpouseEnrollmentRequirement(enrollmentRequirements: EnrollmentRequirement[], memberHasSpouse: boolean): boolean {
        if (memberHasSpouse) {
            return true;
        }

        // If there are any DependencyType.REQUIRES_ELIGIBLE_SPOUSE EnrollmentRequirements
        // return false since member doesn't have spouse
        if (this.enrollmentRequirementsHasDependencyType(enrollmentRequirements, DependencyType.REQUIRES_ELIGIBLE_SPOUSE)) {
            return false;
        }

        return true;
    }

    /**
     * Determines if `EnrollmentRequirements` child requirements are met
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - `EnrollmentRequirement[]` to check
     * @param memberHasChild {boolean} - `MemberDependents` includes child
     *
     * @returns {boolean} `EnrollmentRequirements` child requirements are met
     */
    hasValidChildEnrollmentRequirement(enrollmentRequirements: EnrollmentRequirement[], memberHasChild: boolean): boolean {
        if (memberHasChild) {
            return true;
        }

        // If there are any DependencyType.REQUIRES_ELIGIBLE_CHILD EnrollmentRequirements
        // return false since member doesn't have child
        if (this.enrollmentRequirementsHasDependencyType(enrollmentRequirements, DependencyType.REQUIRES_ELIGIBLE_CHILD)) {
            return false;
        }

        return true;
    }

    /**
     * Compares two numeric values by a comparison operator
     *
     * @param value {number} - first numeric value
     * @param comparisonOperator {BenefitAmountModifier} - string version of a comparison operator
     * @param compareToValue {number} - second numeric value
     *
     * @returns Comparison is true
     */
    compareNumericValues(value: number, comparisonOperator: BenefitAmountModifier, compareToValue: number): boolean {
        switch (comparisonOperator) {
            case BenefitAmountModifier.EQUAL_TO:
                return value === compareToValue;
            case BenefitAmountModifier.GREATER_THAN:
                return value > compareToValue;

            case BenefitAmountModifier.GREATER_THAN_EQUAL_TO:
                return value >= compareToValue;

            case BenefitAmountModifier.LESS_THAN:
                return value < compareToValue;

            case BenefitAmountModifier.LESS_THAN_EQUAL_TO:
                return value <= compareToValue;

            default:
                return false;
        }
    }

    /**
     * Get filtered `EnrollmentRequirements` by `DependencyType`
     *
     * @param enrollmentRequirements {EnrollmentRequirement[]} - Source array of EnrollmentRequirements
     * @param dependencyType {DependencyType} - Used to filter EnrollmentRequirements
     *
     * @returns {EnrollmentRequirement[]} - `EnrollmentRequirements` filtered by `DependencyType`
     */
    getFilteredEnrollmentRequirements(
        enrollmentRequirements: EnrollmentRequirement[],
        dependencyType: DependencyType,
    ): EnrollmentRequirement[] {
        return enrollmentRequirements.filter((enrollmentRequirement) => enrollmentRequirement.dependencyType === dependencyType);
    }

    /**
     * gets enrollment comparison values based on previous enrollments
     * @param enrollments list of enrollments
     * @param enrollmentRiders list of enrollment riders
     * @returns {EnrollmentRequirementComparisonValues} returns enrollment comparison values
     */
    getEnrollmentComparisonValues(
        enrollments: Enrollments[],
        enrollmentRiders: EnrollmentRider[],
    ): EnrollmentRequirementComparisonValues[] {
        const baseEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollments.map((enrollment) => ({
            relatedPlanId: enrollment.plan.id,
            coverageLevelId: enrollment.coverageLevel.id,
            benefitAmount: enrollment.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.BASE,
        }));

        const riderEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollmentRiders.map((enrollmentRider) => ({
            relatedPlanId: enrollmentRider.plan.id,
            coverageLevelId: enrollmentRider.coverageLevel.id,
            benefitAmount: enrollmentRider.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.RIDER,
        }));

        return [
            // Enrollments
            ...baseEnrollmentRequirementValues,
            // EnrollmentRiders
            ...riderEnrollmentRequirementValues,
        ];
    }

    /**
     * gets Invalid plan enrollment requirement data
     * @param planOffering plan offering
     * @param enrollments list of enrollments
     * @param enrollmentRiders list of enrollment riders
     * @returns {EnrollmentRequirementData | null} array of planOfferingId and its invalid enrollment requirement or null
     */
    getInvalidPlanEnrollmentRequirementData(
        planOffering: PlanOffering,
        enrollments: Enrollments[],
        enrollmentRiders: EnrollmentRider[],
    ): EnrollmentRequirement | null {
        // If there are no enrollment requirements, we can return with null value
        if (!planOffering?.enrollmentRequirements?.length) {
            return null;
        }
        const enrollmentComparisonValues = this.getEnrollmentComparisonValues(enrollments, enrollmentRiders);
        const invalidRequiredEnrollmentRequirement = this.getInvalidRequiredEnrollmentRequirement(
            planOffering.enrollmentRequirements,
            enrollmentComparisonValues,
        );

        // If there is an invalidRequiredEnrollmentRequirement, return with same
        if (invalidRequiredEnrollmentRequirement) {
            return invalidRequiredEnrollmentRequirement;
        }

        const invalidNonEnrollmentRequirement = this.getInvalidRequiredNonEnrollmentRequirement(
            planOffering.enrollmentRequirements,
            enrollmentComparisonValues,
        );

        // If there is an invalidNonEnrollmentRequirement, return with same
        if (invalidNonEnrollmentRequirement && this.checkEnrollmentStatus(enrollments, planOffering?.plan?.id)) {
            return invalidNonEnrollmentRequirement;
        }

        // by default return with null value, if doesn't have invalid enrollment requirement
        return null;
    }

    /**
     *
     * @param enrollments - current enrollments
     * @param id - plan id
     * @returns true - Status as Approved & planId matches with enrollments plan id.
     * @returns false - Status other than Approved.
     */

    protected checkEnrollmentStatus(enrollments: Enrollments[], id: number): boolean {
        let status = false;
        if (enrollments?.length) {
            enrollments.forEach((enrollment) => {
                if (enrollment?.status === ApplicationStatusTypes.Approved && enrollment.plan?.id === id) {
                    status = true;
                }
            });
        }
        return status;
    }
}
