import { Injectable } from "@angular/core";
import { CoverageLevelId, MissingInfoType, EnrollmentRider, Enrollments } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { EnrollmentRequirementComparisonValues } from "../enrollment-requirements/enrollment-requirements.model";
import { EnrollmentRequirementsService } from "../enrollment-requirements/enrollment-requirements.service";
import { BenefitAmountState, CoverageLevelState } from "../producer-shop-component-store/producer-shop-component-store.model";
import { EnrollmentRequirementPlanType, RiderState, RiderStateValidationOptions } from "../rider-state/rider-state.model";
import { RiderStateService } from "../rider-state/rider-state.service";
import { RiderDisableState } from "./rider-disabled-state.model";

/**
 * Used to determine disabled state for `RiderState`
 */
@Injectable({
    providedIn: "root",
})
export class RiderDisabledStateService {
    private readonly languageStrings = this.getLanguageStrings();

    constructor(
        private readonly languageService: LanguageService,
        private readonly riderStateService: RiderStateService,
        private readonly enrollmentRequirementsService: EnrollmentRequirementsService,
    ) {}

    /**
     * Returns disabled as true or false if `RiderState` based on existing `RiderStates`
     *
     * @param riderState {RiderState} - `RiderState` used to determine disabled state
     * @param riderStates {RiderState[]} - Related `RiderStates` to check disable state
     * @param riderStateValidationOptions {RiderStateValidationOptions} - Additional values outside of the other `RiderStates`
     * to validate `RiderState` against.
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    getRiderDisabledState(
        riderState: RiderState,
        riderStates: RiderState[],
        riderStateValidationOptions: RiderStateValidationOptions,
        isSupplementaryPlan: boolean,
    ): RiderDisableState {
        const {
            memberHasSpouse,
            memberHasChild,
            enrollments,
            enrollmentRiders,
            mandatoryRiderPlanIds,
            addOnRiderPlanIds,
            riderBrokerPlanIds,
            allBaseBenefitAmounts,
            allBaseCoverageLevels,
        } = riderStateValidationOptions;

        // Order of which case we check if disabled is important
        // The disable text when displaying rider is disabled is determined by the first reason it is disabled

        const isDisabledBasedOnBeingMandatory = this.isDisabledBasedOnBeingMandatory(riderState, mandatoryRiderPlanIds);

        if (isDisabledBasedOnBeingMandatory.disabled) {
            return isDisabledBasedOnBeingMandatory;
        }

        const disabledBasedOnBeingAnAddOnRider = this.isDisabledBasedOnBeingAnAddOnRider(riderState, addOnRiderPlanIds);

        if (disabledBasedOnBeingAnAddOnRider.disabled) {
            return disabledBasedOnBeingAnAddOnRider;
        }

        const disabledBasedOnInvolvingBrokerPlan = this.isDisabledBasedOnInvolvingBrokerPlan(riderState, riderBrokerPlanIds);

        if (disabledBasedOnInvolvingBrokerPlan.disabled) {
            return disabledBasedOnInvolvingBrokerPlan;
        }

        const diabledBasedOnRequiredEnrollmentInPlan = this.isDisabledBasedOnRequiredEnrollmentInPlan(
            riderState,
            enrollments,
            enrollmentRiders,
            allBaseCoverageLevels,
            allBaseBenefitAmounts,
        );

        if (diabledBasedOnRequiredEnrollmentInPlan.disabled) {
            return diabledBasedOnRequiredEnrollmentInPlan;
        }

        const disabledBasedOnRequiredNonEnrollmentInPlan = this.isDisabledBasedOnRequiredNonEnrollmentInPlan(
            riderState,
            enrollments,
            enrollmentRiders,
            allBaseCoverageLevels,
            allBaseBenefitAmounts,
        );

        if (disabledBasedOnRequiredNonEnrollmentInPlan.disabled) {
            return disabledBasedOnRequiredNonEnrollmentInPlan;
        }

        const disabledBasedOnRequiredSpouseDependent = this.isDisabledBasedOnRequiredSpouseDependent(riderState, memberHasSpouse);

        if (disabledBasedOnRequiredSpouseDependent.disabled) {
            return disabledBasedOnRequiredSpouseDependent;
        }

        const diabledBasedOnRequiredChildDependent = this.isDisabledBasedOnRequiredChildDependent(riderState, memberHasChild);

        if (diabledBasedOnRequiredChildDependent.disabled) {
            return diabledBasedOnRequiredChildDependent;
        }

        const diabledBasedOnParentPlanId = this.isDisabledBasedOnParentPlanId(riderState, riderStates, isSupplementaryPlan);

        if (diabledBasedOnParentPlanId.disabled) {
            return diabledBasedOnParentPlanId;
        }

        const diabledBasedOnRequiredSelections = this.isDisabledBasedOnRequiredSelections(riderState, riderStates);

        if (diabledBasedOnRequiredSelections.disabled) {
            return diabledBasedOnRequiredSelections;
        }

        const diabledBasedOnRequiredNonSelections = this.isDisabledBasedOnRequiredNonSelections(riderState, riderStates);

        if (diabledBasedOnRequiredNonSelections.disabled) {
            return diabledBasedOnRequiredNonSelections;
        }

        const diabledBasedOnLackOfSalaryInformation = this.isDisabledBasedOnLackOfSalaryInformation(riderState);

        if (diabledBasedOnLackOfSalaryInformation.disabled) {
            return diabledBasedOnLackOfSalaryInformation;
        }

        return {
            disabled: false,
        };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on being a mandatory `Rider`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param mandatoryRiderPlanIds {number[]} - Array of Rider `Plan` ids that are mandatory (should always be disabled and checked)
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnBeingMandatory(riderState: RiderState, mandatoryRiderPlanIds: number[]): RiderDisableState {
        // Check if rider is mandatory
        return { disabled: this.riderStateService.riderStateHasSomeRiderPlanId(riderState, mandatoryRiderPlanIds) };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on being an ADD ON `Rider`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param mandatoryRiderPlanIds {number[]} - Array of Rider `Plan` ids that are ADD ON (should always be disabled and sometimes checked)
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnBeingAnAddOnRider(riderState: RiderState, addOnRiderPlanIds: number[]): RiderDisableState {
        // Check if rider is an ADD ON rider
        return { disabled: this.riderStateService.riderStateHasSomeRiderPlanId(riderState, addOnRiderPlanIds) };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based Rider involving a Broker Plan by planId
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnInvolvingBrokerPlan(riderState: RiderState, riderBrokerPlanIds: number[]): RiderDisableState {
        // Check if rider involves a Broker Plan by planId
        return { disabled: this.riderStateService.riderStateHasSomeRiderPlanId(riderState, riderBrokerPlanIds) };
    }

    /**
     * Gets coverage level id from component store, if enrollment id matches
     * @param coverageLevels {CoverageLevelState[]} coverage level state
     * @param enrollmentId {number} id corresponding to enrollment or enrollmentRider
     * @returns {CoverageLevelId | null} coverage level id
     */
    getCoverageLevel(coverageLevels: CoverageLevelState[], enrollmentId: number): CoverageLevelId | null {
        return (
            coverageLevels.find((coverageLevel) => coverageLevel.panelIdentifiers?.enrollmentId === enrollmentId)?.coverageLevel.id ?? null
        );
    }

    /**
     * Gets benefit amount from component store per enrollment when id matches
     * @param benefitAmounts {BenefitAmountState[]} benefit amount state
     * @param enrollmentId {number} id corresponding to enrollment or enrollmentRider
     * @returns benefit amount
     */
    getBenefitAmount(benefitAmounts: BenefitAmountState[], enrollmentId: number): number | null {
        return benefitAmounts.find((benefitAmount) => benefitAmount.panelIdentifiers?.enrollmentId === enrollmentId)?.benefitAmount ?? null;
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on
     * `DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param enrollments {Enrollments[]} - `Enrollments` for `MemberProfile` session
     * @param enrollmentRiders {EnrollmentRider[]} - All concatenated `EnrollmentRiders` based on `Enrollments`
     * @param coverageLevels {CoverageLevelState[]} coverage level state for all plan panel
     * @param benefitAmounts {BenefitAmountState[]} benefit Amount state for all plan panel
     * @returns Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredEnrollmentInPlan(
        riderState: RiderState,
        enrollments: Enrollments[],
        enrollmentRiders: EnrollmentRider[],
        coverageLevels: CoverageLevelState[],
        benefitAmounts: BenefitAmountState[],
    ): RiderDisableState {
        const baseEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollments.map((enrollment) => ({
            relatedPlanId: enrollment.plan.id,
            coverageLevelId: this.getCoverageLevel(coverageLevels, enrollment.id) ?? enrollment.coverageLevel?.id,
            benefitAmount: this.getBenefitAmount(benefitAmounts, enrollment.id) ?? enrollment.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.BASE,
        }));

        const riderEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollmentRiders.map((enrollmentRider) => ({
            relatedPlanId: enrollmentRider.plan.id,
            coverageLevelId: this.getCoverageLevel(coverageLevels, enrollmentRider.id) ?? enrollmentRider.coverageLevel?.id,
            benefitAmount: this.getBenefitAmount(benefitAmounts, enrollmentRider.id) ?? enrollmentRider.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.RIDER,
        }));

        const enrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = [
            // Rider's BASE Plan
            {
                relatedPlanId: riderState.planId,
                coverageLevelId: coverageLevels.find(
                    (coverageLevel) => coverageLevel.panelIdentifiers.planOfferingId === riderState.identifiers.planOfferingId,
                )?.coverageLevel?.id,
                benefitAmount: benefitAmounts.find(
                    (benefitAmount) => benefitAmount.panelIdentifiers.planOfferingId === riderState.identifiers.planOfferingId,
                )?.benefitAmount,
                relatedPlanType: EnrollmentRequirementPlanType.BASE,
            },
            // Enrollments
            ...baseEnrollmentRequirementValues,
            // EnrollmentRiders
            ...riderEnrollmentRequirementValues,
        ];

        const invalidRequiredEnrollmentRequirement = this.enrollmentRequirementsService.getInvalidRequiredEnrollmentRequirement(
            riderState.enrollmentRequirements,
            enrollmentRequirementValues,
        );

        // If there is at least one invalid `EnrollmentRequirement`, return disabled
        if (invalidRequiredEnrollmentRequirement) {
            if (invalidRequiredEnrollmentRequirement.relatedPlanId === riderState.planId) {
                return {
                    disabled: true,
                    disableText: this.languageStrings["primary.portal.shoppingExperience.applicantIneligible"],
                };
            }

            return {
                disabled: true,
                // disable text is based on invalid `EnrollmentRequirement` `planName`
                disableText: this.getRequiresEnrollmentMessage(invalidRequiredEnrollmentRequirement.relatedPlanName),
            };
        }

        return {
            disabled: false,
        };
    }

    /**
     *
     * Returns disabled as true or false if `RiderState` should be disabled based on
     * `DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param enrollments {Enrollments[]} - `Enrollments` for `MemberProfile` session
     * @param enrollmentRiders {EnrollmentRider[]} - All concatenated `EnrollmentRiders` based on `Enrollments`
     * @param coverageLevels {CoverageLevelState[]} coverage level state for all plan panel
     * @param benefitAmounts {BenefitAmountState[]} benefit Amount state for all plan panel
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredNonEnrollmentInPlan(
        riderState: RiderState,
        enrollments: Enrollments[],
        enrollmentRiders: EnrollmentRider[],
        coverageLevels: CoverageLevelState[],
        benefitAmounts: BenefitAmountState[],
    ): RiderDisableState {
        const baseEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollments.map((enrollment) => ({
            relatedPlanId: enrollment.plan.id,
            coverageLevelId: this.getCoverageLevel(coverageLevels, enrollment.id) ?? enrollment.coverageLevel?.id,
            benefitAmount: this.getBenefitAmount(benefitAmounts, enrollment.id) ?? enrollment.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.BASE,
        }));

        const riderEnrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = enrollmentRiders.map((enrollmentRider) => ({
            relatedPlanId: enrollmentRider.plan.id,
            coverageLevelId: this.getCoverageLevel(coverageLevels, enrollmentRider.id) ?? enrollmentRider.coverageLevel?.id,
            benefitAmount:
                riderState.riderParentPlanSelectedBenefitAmount ??
                this.getBenefitAmount(benefitAmounts, enrollmentRider.id) ??
                enrollmentRider.benefitAmount,
            relatedPlanType: EnrollmentRequirementPlanType.RIDER,
        }));

        const enrollmentRequirementValues: EnrollmentRequirementComparisonValues[] = [
            // Enrollments
            ...baseEnrollmentRequirementValues,
            // EnrollmentRiders
            ...riderEnrollmentRequirementValues,
        ];

        const invalidNonEnrollmentRequirement = this.enrollmentRequirementsService.getInvalidRequiredNonEnrollmentRequirement(
            riderState.enrollmentRequirements,
            enrollmentRequirementValues,
        );

        // If there is at least one invalid `EnrollmentRequirement`, return disabled
        if (invalidNonEnrollmentRequirement) {
            return {
                disabled: true,
                // disable text is based on invalid `EnrollmentRequirement` `planName`
                disableText: this.getRequiresNonEnrollmentMessage(invalidNonEnrollmentRequirement.relatedPlanName),
            };
        }

        return {
            disabled: false,
        };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on
     * `DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - RiderState to check disabled state
     * @param riderStates {RiderState[]} - Related RiderStates to check disable state
     *
     * @returns {RiderDisableState} Determines if RiderState should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredSelections(riderState: RiderState, riderStates: RiderState[]): RiderDisableState {
        const hasInvalidSelection = !!this.enrollmentRequirementsService.getInvalidSelectionEnrollmentRequirement(
            riderState.enrollmentRequirements,
            riderStates
                .filter((possibleRiderState) => possibleRiderState.checked)
                .map((possibleRiderState) => possibleRiderState.riderPlanId),
        );

        return { disabled: hasInvalidSelection };
    }

    /**
     * Returns disabled as true or false if RiderState should be disabled based on
     * `DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param riderStates {RiderState[]} - Related `RiderStates` to check disable state
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredNonSelections(riderState: RiderState, riderStates: RiderState[]): RiderDisableState {
        const hasInvalidNonSelection = !!this.enrollmentRequirementsService.getInvalidNonSelectionEnrollmentRequirement(
            riderState.enrollmentRequirements,
            riderStates
                .filter((possibleRiderState) => possibleRiderState.checked)
                .map((possibleRiderState) => possibleRiderState.riderPlanId),
        );

        return { disabled: hasInvalidNonSelection };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on
     * `DependencyType.REQUIRES_ELIGIBLE_SPOUSE` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param memberHasSpouse {boolean} - `MemberDependents` includes spouse
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredSpouseDependent(riderState: RiderState, memberHasSpouse: boolean): RiderDisableState {
        const hasValidSpouseEnrollmentRequirement = this.enrollmentRequirementsService.hasValidSpouseEnrollmentRequirement(
            riderState.enrollmentRequirements,
            memberHasSpouse,
        );

        // Check if there are any DependencyType.REQUIRES_ELIGIBLE_SPOUSE enrollment requirements
        // If it exists, RiderState should be disabled
        if (hasValidSpouseEnrollmentRequirement) {
            return { disabled: false };
        }

        return {
            disabled: true,
            disableText: this.languageStrings["primary.portal.shoppingExperience.applicantIneligible"],
        };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on
     * `DependencyType.REQUIRES_ELIGIBLE_SPOUSE` `EnrollmentRequirements`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param memberHasChild {boolean} - `MemberDependents` includes child
     *
     * @returns {RiderDisableState} Determines if RiderState should be disabled and its disabled text
     */
    isDisabledBasedOnRequiredChildDependent(riderState: RiderState, memberHasChild: boolean): RiderDisableState {
        const validChildEnrollmentRequirement = this.enrollmentRequirementsService.hasValidChildEnrollmentRequirement(
            riderState.enrollmentRequirements,
            memberHasChild,
        );

        // Check if there are any DependencyType.REQUIRES_ELIGIBLE_SPOUSE enrollment requirements
        // If it exists, RiderState should be disabled
        if (validChildEnrollmentRequirement) {
            return { disabled: false };
        }

        return {
            disabled: true,
            disableText: this.languageStrings["primary.portal.shoppingExperience.applicantIneligible"],
        };
    }

    /**
     * @deprecated This might no longer be needed since `REQUIRES_SELECTION_IN_ANOTHER_PLAN` is now a thing for `DependencyType`
     *
     * Returns disabled as true or false if `RiderState` should be disabled based on `riderParentPlanId`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     * @param riderStates {RiderState[]} - Related `RiderStates` to check disable state
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnParentPlanId(riderState: RiderState, riderStates: RiderState[], isSupplementaryPlan: boolean): RiderDisableState {
        const riderParentPlanId: number | undefined = riderState.riderParentPlanId;

        const planId: number | undefined = riderState.planId;
        const parentRiderState: RiderState | null = this.riderStateService.getRiderStateByRiderPlanId(
            riderStates,
            riderParentPlanId,
            planId,
            isSupplementaryPlan,
        );

        // Check if there is a parent RiderState and if it is NOT checked
        if (parentRiderState && !parentRiderState.checked) {
            return { disabled: true };
        }

        return { disabled: false };
    }

    /**
     * Returns disabled as true or false if `RiderState` should be disabled based on `missingInformation`
     *
     * @param riderState {RiderState} - `RiderState` to check disabled state
     *
     * @returns {RiderDisableState} Determines if `RiderState` should be disabled and its disabled text
     */
    isDisabledBasedOnLackOfSalaryInformation(riderState: RiderState): RiderDisableState {
        // Riders with missing SALARY information are supposed to always be disabled (and NOT checked)
        return { disabled: riderState.missingInformation === MissingInfoType.SALARY };
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns Record<string,string> Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues(["primary.portal.shoppingExperience.applicantIneligible"]);
    }

    /**
     * Get disabled text for if an `EnrollmentRequirement` is not satisfied based on
     * `REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN` `DependencyType`
     *
     * @param planName {string} - Name of `Plan` that is required to be enrolled
     *
     * @returns {string} - disabled text for `RiderDisableState`
     */
    getRequiresEnrollmentMessage(planName: string): string {
        return this.languageService
            .fetchSecondaryLanguageValue("secondary.portal.enrollment.requiresEnrollmentRider")
            .replace("##planName##", planName);
    }

    /**
     * Get disabled text for if an `EnrollmentRequirement` is not satisfied based on
     * `REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN` `DependencyType`
     *
     * @param planName {string} - Name of `Plan` that is required to NOT be enrolled
     *
     * @returns {string} - disabled text for `RiderDisableState`
     */
    getRequiresNonEnrollmentMessage(planName: string): string {
        return this.languageService
            .fetchSecondaryLanguageValue("secondary.portal.enrollment.requiresNonEnrollmentRider")
            .replace("##planName##", planName);
    }
}
