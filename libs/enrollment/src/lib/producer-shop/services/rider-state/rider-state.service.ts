import { Injectable } from "@angular/core";
import { RiderState } from "./rider-state.model";

/**
 * General helper for dealing with `RiderState` and related types
 */
@Injectable({
    providedIn: "root",
})
export class RiderStateService {
    constructor() {}

    /**
     * Returns `RiderState` found by `planId`
     *
     * @param riderStates {RiderState[]} - `RiderStates` that will be filtered by `planId`
     * @param parentPlanId {number} - `RiderParentPlan` id to filter `RiderStates`
     * @param planId {number} - `Plan` id to compare and filter `RiderStates` if the plan is supplementary
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     *
     * @returns {RiderState | null} - RiderState found by planId, null if none is found
     */
    getRiderStateByRiderPlanId(
        riderStates: RiderState[],
        parentPlanId?: number | null,
        planId?: number | null,
        isSupplementaryPlan?: boolean,
    ): RiderState | null {
        let riderState: RiderState;
        if (isSupplementaryPlan) {
            riderState = parentPlanId
                ? riderStates.find(
                    (possibleRiderState) => possibleRiderState.riderPlanId === parentPlanId && possibleRiderState.planId === planId,
                )
                : null;
        } else {
            riderState = parentPlanId ? riderStates.find((possibleRiderState) => possibleRiderState.riderPlanId === parentPlanId) : null;
        }
        return riderState ?? null;
    }

    /**
     * Determines if an array of Rider `Plan` ids contains the Rider plan id from a RiderState
     *
     * @param riderState {RiderState} - `RiderState` with expected Rider Plan id
     * @param riderPlanIds {number[]} - Array of Rider `Plan` ids to check
     *
     * @returns {boolean} - Rider `Plan` ids contains the Rider `Plan` id from a `RiderState`
     */
    riderStateHasSomeRiderPlanId(riderState: RiderState, riderPlanIds: number[]): boolean {
        return riderPlanIds.includes(riderState.riderPlanId);
    }

    /**
     * Gets Parent `RiderState` using `riderParentPlanId`
     *
     * @param riderState {RiderState} - `RiderState` with expected Rider riderParentPlanId
     * @param riderStates {RiderState[]} - Other `RiderStates` that may be the Parent `RiderState`
     * @returns {RiderState | null} Parent `RiderState`
     */
    getParentPlanRiderState(riderState: RiderState, riderStates: RiderState[]): RiderState | null {
        return this.getRiderStateByRiderPlanId(riderStates, riderState.riderParentPlanId);
    }
}
