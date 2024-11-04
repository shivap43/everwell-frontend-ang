import { Injectable } from "@angular/core";
import { Store, Action, select, DefaultProjectorFn, MemoizedSelector } from "@ngrx/store";
import { MonoTypeOperatorFunction, Observable, OperatorFunction, pipe } from "rxjs";
import { filter, map, take } from "rxjs/operators";
import { State } from "./ngrx-states/app.state";
import { Snapshot } from "./store.model";
import { SharedActions } from "./ngrx-states/shared";
import { sharedAsyncDataSelecters } from "./store.constant";
import { MembersSelectors } from "./ngrx-states/members";
import {
    AsyncData,
    AsyncStatus,
    FailedAsyncData,
    IdleAsyncData,
    LoadingAsyncData,
    Nullish,
    SucceededAsyncData,
} from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class NGRXStore {
    constructor(private readonly ngrxStore: Store<State>) {}

    /**
     * Dispatches NGRX `Action`
     *
     * Can be used to trigger NGRX `Reducer` or trigger NGRX `Effects`
     *
     * @param action NGRX `Action`
     * @param checkIfSharedActionIsCached {boolean} can only be set to true for SharedActions
     */
    dispatch(action: Action, checkIfSharedActionIsCached?: false): void;

    /**
     * Dispatches NGRX `SharedAction` when there's no cached SucceededAsyncData
     *
     * Checking for cache is only available for SharedActions, any other Action will result in a type error
     *
     * @param action NGRX `SharedAction`
     * @param checkIfSharedActionIsCached {boolean} Skip dispatching SharedAction if AsyncData related to Action has AsyncStatus.SUCCEEDED
     */
    dispatch(sharedAction: SharedActions.ActionsUnion, checkIfSharedActionIsCached: true): void;
    dispatch(action: Action, checkIfSharedActionIsCached: boolean = false): void {
        if (checkIfSharedActionIsCached) {
            this.dispatchIfNotCached(action as SharedActions.ActionsUnion);
            return;
        }

        this.ngrxStore.dispatch(action);
    }

    /**
     * Returns NGRX Selector's return value while filtering null or undefined
     *
     * Observable does not complete after first emit.
     *
     * @param operatorFunction NGRX selector
     * @returns snapshot value returned of the selector
     */
    protected snapshot<T>(operatorFunction: OperatorFunction<State, T>): T {
        let snapshotValue = {
            captured: false,
            value: null,
        } as Snapshot<T>;

        this.ngrxStore.pipe(operatorFunction, take(1)).subscribe((value) => {
            snapshotValue = {
                captured: true,
                value,
            };
        });

        // If you are running tests that involve snapshot,
        // You will need to mock this method from this Service to avoid this error
        if (!snapshotValue.captured) {
            throw new Error("Unexpected snapshot failed");
        }

        return snapshotValue.value;
    }

    /**
     * Dispatches NGRX `Action` when there's no cached SucceededAsyncData
     *
     * Can be used to trigger NGRX `Reducer` or trigger NGRX `Effects`
     *
     * If you want to dispatch an NGRX Action without checking cache use {@link dispatch} instead
     *
     * @param sharedAction {SharedActions.ActionsUnion} NGRX `Action`
     */
    protected dispatchIfNotCached(sharedAction: SharedActions.ActionsUnion): void {
        const selector = sharedAsyncDataSelecters[sharedAction.type];

        // If there's an AsyncData related selector, let's use it
        if (selector) {
            const snapshotValue = this.snapshot(select(selector(sharedAction)));

            // If the status of the AsyncData is LOADING or SUCCEEDED,
            // we can exit early and not dispatch this action
            if (snapshotValue.status === AsyncStatus.SUCCEEDED) {
                return;
            }
        }

        // If all else, dispatch the action like normal
        this.dispatch(sharedAction, false);
    }

    /**
     * Dispatches NGRX `Action` when snapshot of selector has AsyncStatus.IDLE
     *
     * @param action NGRX `SharedAction`
     * @param selector {MemoizedSelector} Selector used to get snapshot of state
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    dispatchIfIdle<T>(action: Action, selector: MemoizedSelector<object, AsyncData<T>, DefaultProjectorFn<AsyncData<T>>>): void {
        const snapshotValue = this.snapshot(select(selector));

        // If the status of the AsyncData is not IDLE
        // we can exit early and not dispatch this action
        if (snapshotValue.status !== AsyncStatus.IDLE) {
            return;
        }

        // If all else, dispatch the action like normal
        this.dispatch(action, false);
    }

    /**
     * Returns NGRX Selector's return value
     *
     * Observable does not complete after first emit.
     *
     * @param operatorFunction NGRX selector
     * @returns live Observable of the value returned of the selector
     */
    pipe<T>(operatorFunction: OperatorFunction<State, T>): Observable<T> {
        return this.ngrxStore.pipe(operatorFunction);
    }

    /**
     * Used when the return value of NGRX selector is of type `AsyncData<T>`.
     *
     * Will filter emits until return `AsyncData<T>` has `AsyncStatus.SUCCEEDED`. Then returns the value of `AsyncData<T>`.
     *
     * Observable does not complete after first emit.
     *
     * @param operatorFunction NGRX Selector where return value is `AsyncData<T>`
     * @returns live `Observable` of the value returned of the Selector's `AsyncData.value` when `AsyncStatus` is SUCCEEDED
     */
    onAsyncValue<Value>(operatorFunction: OperatorFunction<State, AsyncData<Value>>): Observable<Value> {
        return this.ngrxStore.pipe(operatorFunction).pipe(this.filterForAsyncValue());
    }

    /**
     * Filter `Observable<AsyncData>` by `AsyncStatus`.
     * This helper also specifies `AsyncData` to a more specific kind of `AsyncData` based on `AsyncStatus`.
     *
     * If `AsyncStatus` is SUCCEEDED, `AsyncData<T>` -> `SucceededAsyncData<T>`
     *
     * This allows for checking the value property without having to check if value is defined since `value` property
     * is optional on AsyncData (since it might not be defined yet),
     * but `value` property is not optional for `SucceededAsyncData` since we know the value should be ready to consume.
     *
     * Another type benefit is that you can access error property when filtering by `AsyncStatus.FAILED` without having to check types.
     * This is for the same reasons for why you can use `value` property from `SucceededAsyncData` without type checking.
     */
    filterByAsyncStatus<Value>(asyncStatus: AsyncStatus.IDLE): OperatorFunction<AsyncData<Value>, IdleAsyncData<Value>>;
    filterByAsyncStatus<Value>(asyncStatus: AsyncStatus.LOADING): OperatorFunction<AsyncData<Value>, LoadingAsyncData<Value>>;
    filterByAsyncStatus<Value>(asyncStatus: AsyncStatus.SUCCEEDED): OperatorFunction<AsyncData<Value>, SucceededAsyncData<Value>>;
    filterByAsyncStatus<Value>(asyncStatus: AsyncStatus.FAILED): OperatorFunction<AsyncData<Value>, FailedAsyncData<Value>>;
    filterByAsyncStatus<Value, Status extends AsyncStatus>(asyncStatus: Status): OperatorFunction<AsyncData<Value>, AsyncData<Value>>;
    filterByAsyncStatus<Value, Status extends AsyncStatus>(asyncStatus: Status): MonoTypeOperatorFunction<AsyncData<Value>> {
        return filter((asyncData: AsyncData<Value>) => this.hasAsyncStatus(asyncData, asyncStatus));
    }

    /**
     * RXJS `OperatorFunction` to filter `Observable<AsyncData>` for `AsyncStatus.SUCCEEDED` and maps to `value` of AsyncData
     *
     * @returns Value for AsyncData<Value>
     */
    filterForAsyncValue<Value>(): OperatorFunction<AsyncData<Value>, Value> {
        return pipe(
            this.filterByAsyncStatus(AsyncStatus.SUCCEEDED),
            map(({ value }) => value),
        );
    }

    /**
     * Helper to check if value is null or undefined
     *
     * @param value can be any value
     * @returns true if value is null or undefined
     */
    isNullish<T>(value: T): value is NonNullable<T> {
        return value == null;
    }

    /**
     * RXJS `OperatorFunction` to filter emited values to exclude null or undefined
     *
     * @returns {OperatorFunction<T, NonNullable<T>} OperatorFunction that filters null and undefined
     */
    filterForNonNullish<T>(): OperatorFunction<T, NonNullable<T>> {
        return pipe(filter((value): value is NonNullable<T> => !this.isNullish(value)));
    }

    /**
     * Helper to check if `AsyncData` has a specific `AsyncStatus`
     *
     * @param asyncData {AsyncData | Nullish}
     * @param status {AsyncStatus}
     * @returns {boolean} true if AsyncData has specific status. Returns false if AsyncData has any other status
     */
    hasAsyncStatus<Value>(asyncData: AsyncData<Value>, status: AsyncStatus.IDLE): asyncData is IdleAsyncData<Value>;
    hasAsyncStatus<Value>(asyncData: AsyncData<Value>, status: AsyncStatus.LOADING): asyncData is LoadingAsyncData<Value>;
    hasAsyncStatus<Value>(asyncData: AsyncData<Value>, status: AsyncStatus.SUCCEEDED): asyncData is SucceededAsyncData<Value>;
    hasAsyncStatus<Value>(asyncData: AsyncData<Value>, status: AsyncStatus.FAILED): asyncData is FailedAsyncData<Value>;
    hasAsyncStatus<Value>(asyncData: null, status: AsyncStatus): asyncData is null;
    hasAsyncStatus<Value>(asyncData: undefined, status: AsyncStatus): asyncData is undefined;
    hasAsyncStatus<Value>(asyncData: AsyncData<Value>, status: AsyncStatus): asyncData is AsyncData<Value>;
    hasAsyncStatus<Value, Status extends AsyncStatus>(asyncData: AsyncData<Value> | Nullish, status: Status): boolean {
        return asyncData?.status === status;
    }

    /**
     * Returns true if NGRX MembersState has selectedMemberId.
     * Commonly used to determine if NGRX is being used or not.
     * This should be a way to determine if you're on old shop or new shop.
     *
     * @returns {boolean} boolean based on if NGRX MembersState has selectedMemberId
     */
    ngrxStateHasSelectedMemberId(): boolean {
        const memberId = this.snapshot(select(MembersSelectors.getSelectedMemberId));

        return !!memberId;
    }
}
