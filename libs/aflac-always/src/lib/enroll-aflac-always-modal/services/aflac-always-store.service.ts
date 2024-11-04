import { Injectable } from "@angular/core";
import { AflacAlwaysEnrollments, AsyncData, AsyncStatus, EnrollmentMethod } from "@empowered/constants";
import { Observable } from "rxjs";
import { select } from "@ngrx/store";
import { AflacAlwaysActions, AflacAlwaysSelectors } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { filter, map, take } from "rxjs/operators";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store";
import { AppFlowService } from "@empowered/ngxs-store";
import { TypedAction } from "@ngrx/store/src/models";

export type GenericState = Record<string, unknown>;
export type GenericSelector<T> = (state: GenericState) => T;

@Injectable({
    providedIn: "root",
})
export class AflacAlwaysStoreService {
    constructor(
        protected readonly store: NGRXStore,
        private readonly appFlowService: AppFlowService,
        private readonly ngrxStore: NGRXStore,
    ) {}

    /**
     * @description Fetches the subscriber payment id
     * @readonly
     * @type {number}
     * @memberof AflacAlwaysStoreService
     */
    get subscriberPaymentId(): number {
        return this.appFlowService.getPaymentIdForAflacAlwaysQuasiModal();
    }

    /**
     * @description Fetches the Aflac Always enrollments
     * @param {{ mpGroupId: number; memberId: number }} p
     * @returns {Observable<AflacAlwaysEnrollments[]>}
     * @memberof AflacAlwaysStoreService
     */
    fetchEnrollments(p: { mpGroupId: number; memberId: number }): Observable<AflacAlwaysEnrollments[]> {
        return this.store.pipe(select(AflacAlwaysSelectors.getAflacAlwaysEnrollments(p.mpGroupId, p.memberId))).pipe(
            filter(
                (asyncAflacAlwaysEnrollments: AsyncData<AflacAlwaysEnrollments[]>) =>
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.SUCCEEDED ||
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.FAILED,
            ),
            map((asyncAflacAlwaysEnrollments: AsyncData<AflacAlwaysEnrollments[]>) => asyncAflacAlwaysEnrollments.value),
        );
    }

    /**
     * @description Fetches the selected Aflac Always enrollment ids
     * @returns {Observable<number[]>}
     * @memberof AflacAlwaysStoreService
     */
    fetchMonthlyCost(): Observable<number | number[]> {
        return this.store.pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionCumulativeTotalCost)).pipe(take(1));
    }

    /**
     * @description Fetches the selected Aflac Always enrollment ids
     * @returns {Observable<number[]>}
     * @memberof AflacAlwaysStoreService
     */
    fetchSelectedEnrollmentIds(): Observable<number[]> {
        return this.store.pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionEnrollmentIds)).pipe(take(1));
    }

    /**
     * @description Dispatches the enrollments if idle
     * @param {{ mpGroupId: number; memberId: number }} p
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatchEnrollmentsIfIdle(p: { mpGroupId: number; memberId: number }): void {
        this.store.dispatchIfIdle(
            AflacAlwaysActions.loadAflacAlwaysEnrollments({ mpGroupId: p.mpGroupId, memberId: p.memberId }),
            AflacAlwaysSelectors.getAflacAlwaysEnrollments(p.mpGroupId, p.memberId),
        );
    }

    /**
     * @description Dispatches the selected enrollment ids
     * @param {number[]} enrollmentIds
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatchSelectedEnrollmentIds(enrollmentIds: number[]): void {
        this.store.dispatch(AflacAlwaysActions.setAflacAlwaysEnrollmentIds({ enrollmentIds }));
    }

    /**
     * @description Dispatches the enrollment method
     * @param {EnrollmentMethod} enrollmentMethod
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatchEnrollmentMethod(enrollmentMethod: EnrollmentMethod): void {
        this.store.dispatch(AflacAlwaysActions.setAflacAlwaysEnrollmentMethod({ enrollmentMethod }));
    }

    /**
     * @description Fetches the selected member id
     * @returns {Observable<number>}
     * @memberof AflacAlwaysStoreService
     */
    fetchSelectedMemberId(): Observable<number> {
        return this.store.pipe(select(MembersSelectors.getSelectedMemberId));
    }

    /**
     * @description Fetches the selected MP group
     * @returns {Observable<number>}
     * @memberof AflacAlwaysStoreService
     */
    fetchSelectedMPGroup(): Observable<number> {
        return this.store.pipe(select(AccountsSelectors.getSelectedMPGroup));
    }

    /**
     * @description Dispatch action for enrollment set to bring up import policy
     * @param {{ mpGroupId: number; memberId: number }} p
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatchLoadEnrollments(p: { mpGroupId: number; memberId: number }): void {
        this.store.dispatch(AflacAlwaysActions.loadAflacAlwaysEnrollments({ mpGroupId: p.mpGroupId, memberId: p.memberId }));
    }

    /**
     * @description Dispatches the selected subscriber payment id
     * @param {number} subscriberPaymentId
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatchSubscriberPaymentId(subscriberPaymentId: number): void {
        this.store.dispatch(AflacAlwaysActions.setAflacAlwaysSubscriberPaymentId({ subscriberPaymentId }));
    }

    dispatchTotalCost(): void {
        this.store.dispatch(AflacAlwaysActions.setAflacAlwaysCumulativeTotalCost({ cumulativeTotalCost: 6 }));
    }

    /**
     * @description Fetches the last completed payment index
     * @returns {Observable<number>}
     * @memberof AflacAlwaysApiService
     */
    fetchLastCompletedPaymentIndex(): Observable<number> {
        return this.appFlowService.lastCompletedPaymentIndex;
    }

    /**
     * @description Dispatches the selected state object
     * @param { GenericSelector } state
     * @returns Observable<unknown>
     * @memberof AflacAlwaysStoreService
     */
    select<T>(state: GenericSelector<T>): Observable<T> {
        return this.store.pipe(select(state) as never);
    }

    /**
     * @description Dispatches the action
     * @param {TypedAction<string>} action
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    dispatch(action: TypedAction<string>): void {
        this.store.dispatch(action);
    }

    /**
     * @description Reset the aflac always data
     * @returns void
     * @memberof AflacAlwaysStoreService
     */
    resetAflacAlwaysData(): void {
        this.ngrxStore.dispatch(AflacAlwaysActions.resetAflacAlwaysState());
    }
}
