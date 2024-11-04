import { Injectable } from "@angular/core";
import { EnrollmentRequirementsService } from "../enrollment-requirements/enrollment-requirements.service";
import { BenefitAmountState, CoverageLevelState } from "../producer-shop-component-store/producer-shop-component-store.model";
import { RiderDisableState } from "../rider-disabled-state/rider-disabled-state.model";
import { RiderDisabledStateService } from "../rider-disabled-state/rider-disabled-state.service";
import { RiderState, RiderStateValidationOptions } from "../rider-state/rider-state.model";
import { RiderStateService } from "../rider-state/rider-state.service";

/**
 * Used to get validated `RiderState`.
 * Used to determine if a `Rider` is checked/selected and what its selected `CoverageLevelName` / BenefitAmount `Pricing` is.
 */
@Injectable({
    providedIn: "root",
})
export class ValidateRiderStateService {
    constructor(
        private readonly riderStateService: RiderStateService,
        private readonly riderDisabledStateService: RiderDisabledStateService,
        private readonly enrollmentRequirementsService: EnrollmentRequirementsService,
    ) {}

    /**
     * Check if `RiderState` should be checked outside of user interaction (such as checking `Plan` `policySeries`)
     *
     * @param riderState {RiderState} - `RiderState` Used to determine checked state
     * @param riderStates {RiderState[]} - `RiderStates` Used to handle selection dependencies of other states
     * @param newRiderDisabledState {RiderDisableState} - New disabled state used to determine if switching to enabled
     * @param mandatoryRiderPlanIds {number[]} - Array of Rider `Plan` ids that are mandatory (should always be disabled and checked)
     * @param addOnRiderPlanIds {number[]} - Array of ADD ON Rider `Plan` ids (should always be disabled and sometimes checked)
     * @param riderBrokerPlanIds {number[]} - Array of Rider Broker `Plan` ids (should always be disabled and sometimes checked)
     *
     * @returns {boolean} boolean to determine if enabled
     */
    riderStateShouldBeChecked(
        riderState: RiderState,
        riderStates: RiderState[],
        newRiderDisabledState: RiderDisableState,
        mandatoryRiderPlanIds: number[],
        addOnRiderPlanIds: number[],
        riderBrokerPlanIds: number[],
    ): boolean {
        // Check disabled due to rider is mandatory
        const disableStateBasedOnBeingMandatory = this.riderDisabledStateService.isDisabledBasedOnBeingMandatory(
            riderState,
            mandatoryRiderPlanIds,
        );
        // Don't check the rider by default if it doesn't has the price with in
        if (disableStateBasedOnBeingMandatory.disabled && riderState?.riderHasPrice) {
            // Mandatory riders are always auto checked
            return true;
        }

        // Check if disabled due to being ADD ON rider
        const disableStateBasedOnBeingAnAddOnRider = this.riderDisabledStateService.isDisabledBasedOnBeingAnAddOnRider(
            riderState,
            addOnRiderPlanIds,
        );
        if (disableStateBasedOnBeingAnAddOnRider.disabled) {
            // Collect all selected RIDER planIds
            const otherRiderStateIds = riderStates.filter(({ checked }) => checked).map(({ riderPlanId }) => riderPlanId);

            // Check if ADD ON rider's selection Enrollment Requirements are satisfied
            // this should auto check its RiderState (while being disabled)
            return !this.enrollmentRequirementsService.getInvalidSelectionEnrollmentRequirement(
                riderState.enrollmentRequirements,
                otherRiderStateIds,
            );
        }

        // Check if disabled due to involving Broker Plans
        const disableStateBasedOnInvolvingBrokerPlans = this.riderDisabledStateService.isDisabledBasedOnInvolvingBrokerPlan(
            riderState,
            riderBrokerPlanIds,
        );
        if (disableStateBasedOnInvolvingBrokerPlans.disabled) {
            // If so broker is selected, should be auto checked
            return !!riderState.brokerSelected;
        }

        // Outside mandatory/ADD ON Riders, Riders that are disabled should always be not checked
        if (newRiderDisabledState.disabled) {
            return false;
        }

        // Return previous checked state
        return riderState.checked;
    }

    /**
     * Returns a validated `RiderState` without mutating the original RiderState
     *
     * This means that based on the other `RiderStates`, this `RiderState` might become checked/unchecked, enabled/disabled, etc
     *
     * @param riderState {RiderState} - `RiderState` that will be validated
     * @param riderStates {RiderState[]} - Other `RiderStates` to base validation on
     * @param riderStateValidationOptions {RiderStateValidationOptions} - Additional values outside of the other `RiderStates`
     * to validate `RiderState` against.
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     *
     * @returns {RiderState} Validated RiderState of `riderState` based on `riderStates`
     */
    getValidatedRiderState(
        riderState: RiderState,
        riderStates: RiderState[],
        riderStateValidationOptions: RiderStateValidationOptions,
        isSupplementaryPlan?: boolean,
    ): RiderState {
        const { mandatoryRiderPlanIds, addOnRiderPlanIds, riderBrokerPlanIds } = riderStateValidationOptions;

        // Check `RiderState`'s disable state based on the other `RiderStates` and `RiderStateValidationOptions`
        const newRiderDisabledState = this.riderDisabledStateService.getRiderDisabledState(
            riderState,
            riderStates,
            riderStateValidationOptions,
            isSupplementaryPlan,
        );

        // Determine new checked state based on upcoming new disabled state,
        // mandatory / ADD ON riders, involving Broker Plans
        const checked = this.riderStateShouldBeChecked(
            riderState,
            riderStates,
            newRiderDisabledState,
            mandatoryRiderPlanIds,
            addOnRiderPlanIds,
            riderBrokerPlanIds,
        );

        const parentPlanRiderState = this.riderStateService.getParentPlanRiderState(riderState, riderStates);

        return {
            ...riderState,
            disabled: newRiderDisabledState.disabled,
            disableText: newRiderDisabledState.disableText,
            checked,
            riderParentPlanSelectedBenefitAmount: parentPlanRiderState?.selectedBenefitAmount,
        };
    }

    /**
     * Returns an array of validated `RiderStates` without mutating the original `RiderStates` array
     *
     * This means that based on the other `RiderStates`, each RiderState might become checked/unchecked, enabled/disabled, etc
     *
     * @param riderStates {RiderState[]} - `RiderStates` that will be validated against themselves
     * @param riderStateValidationOptions {RiderStateValidationOptions} - Additional values outside of the other `RiderStates`
     * to validate `RiderState` against.
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     *
     * @returns {RiderState[]} Validated RiderStates of `riderStates` based on each other
     */
    getValidatedRiderStates(
        riderStates: RiderState[],
        riderStateValidationOptions: RiderStateValidationOptions,
        isSupplementaryPlan?: boolean,
    ): RiderState[] {
        return riderStates.map((riderState) =>
            this.getValidatedRiderState(riderState, riderStates, riderStateValidationOptions, isSupplementaryPlan),
        );
    }
}
