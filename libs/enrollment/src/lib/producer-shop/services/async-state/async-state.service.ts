import { Injectable } from "@angular/core";
import { AlertType, AsyncData, AsyncStatus, ErrorMessage } from "@empowered/constants";
import { getErrorMessage, NGRXStore } from "@empowered/ngrx-store";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { select } from "@ngrx/store";
import { combineLatest, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { AlertMessage } from "../../plans-container/plans-container.model";

@Injectable({
    providedIn: "root",
})
export class AsyncStateService {
    constructor(private readonly ngrxStore: NGRXStore) {}

    /**
     * Get Array of AsyncData Selectors used to determine if Producer Shop
     * is loading or should show an error message
     *
     * Order is important. Error message will come from the first AsyncData that has AsyncStatus.FAILED
     *
     * @returns {Observable<AsyncData>[]} Array of AsyncDatas
     */
    getAsyncDataSelectors(): Observable<AsyncData<unknown>>[] {
        // Selectors should be listed at the top if their error message is more important than others
        // This is because only one error message will show if there's more than one api error
        // The selctor closest to the top of the list will show over others
        return [
            // Products / Plan Offerings selectors
            this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedCombinedOfferings)),
            this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferings)),
            // Selectors involving enrollment settings dropdowns
            this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedCoverageDatesRecord)),
            this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity)),
            this.ngrxStore.pipe(select(MembersSelectors.getSelectedPossibleRiskClassSets)),
            this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberProfile)),
            this.ngrxStore.pipe(select(MembersSelectors.getSelectedSalarySummary)),
            this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberDependents)),
        ];
    }

    /**
     * Get Array of AsyncData Selectors used to determine if Producer Shop
     * is loading or should show an error message
     *
     * Order is important. Error message will come from the first AsyncData that has AsyncStatus.FAILED
     *
     * @returns {Observable<AsyncData>[]} Array of AsyncDatas
     */
    getAsyncDatas(): Observable<AsyncData<unknown>[]> {
        const asyncDataSelectors = this.getAsyncDataSelectors();

        if (!asyncDataSelectors.length) {
            return of([]);
        }

        // Selectors should be listed at the top if their error message is more important than others
        // This is because only one error message will show if there's more than one api error
        // The selctor closest to the top of the list will show over others
        return combineLatest(asyncDataSelectors);
    }

    /**
     * Gets if Producer Shop is loading. If any selectors failed (AsyncStatus.FAILED),
     * Producer Shop will not be loading even if there are selectors still loading.
     *
     * @returns {Observable<boolean>} Emits true if loading
     */
    isLoading(): Observable<boolean> {
        return this.getAsyncDatas().pipe(
            map((asyncDatas) => {
                if (asyncDatas.some((asyncData) => asyncData.status === AsyncStatus.FAILED)) {
                    return false;
                }

                return asyncDatas.some((asyncData) => asyncData.status === AsyncStatus.LOADING);
            }),
        );
    }

    /**
     * Gets general error message for when a general selector errors for Producer Shop
     *
     * @returns {Observable<ErrorMessage | null>} Emits error message of first selector that errors
     */
    getErrorMessage(): Observable<ErrorMessage | null> {
        return this.getAsyncDatas().pipe(
            map((asyncDatas) => {
                const failedAsyncData = asyncDatas.find((asyncData) => asyncData.status === AsyncStatus.FAILED);

                if (failedAsyncData?.status !== AsyncStatus.FAILED) {
                    return null;
                }

                return getErrorMessage(failedAsyncData.error, true);
            }),
        );
    }

    /**
     * Gets general error message for when a general selector errors for Producer Shop. Includes Alert Type.
     * @param alertType {AlertType} Alert type of alert message
     *
     * @returns {Observable<AlertMessage | null>} Emits alert message of first selector that errors
     */
    getAlertMessage(alertType: AlertType): Observable<AlertMessage | null> {
        return this.getErrorMessage().pipe(
            map((errorMessage) => {
                if (!errorMessage) {
                    return null;
                }

                return {
                    ...errorMessage,
                    alertType,
                };
            }),
        );
    }
}
