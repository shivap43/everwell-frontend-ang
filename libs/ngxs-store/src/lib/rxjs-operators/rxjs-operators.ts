/* eslint-disable @typescript-eslint/no-use-before-define */
import { filter, retryWhen, delay, delayWhen, mergeMap, switchMap, map, catchError, first } from "rxjs/operators";
import { MonoTypeOperatorFunction, interval, throwError, of, iif, Observable, defer } from "rxjs";
import { ServerErrorResponseCode } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { UpdateGroupState } from "../group/group.actions";
import { BaseAction, ExpireAction, UpdateStateAction } from "../requests/request-actions";
import { RequestState } from "../requests/request-state";

/**
 * Creation operator that wraps a given source and tests to see if the request exists. If it does,
 * the observable completes and emits no values. If the request does not exist, then the source observable
 * is subscribed to. If an error is thrown after the source observable is subscribed to, the error is caught
 * and the request is removed from the store before being re-thrown.
 *
 * @param source The source observable to be wrapped by the operator
 * @param store An instance of the store to use
 * @param actionType The static (non-instance) reference to the Action's class
 * @param action The action being performed by the secondary cache
 * @returns The wrapped source observable. If the request exists, the source observable will not evaluate and will emit undefined.
 * If an error is caught, the request is removed from the store and then thrown.
 */
export function throttleRequest<T>(
    source: Observable<T>,
    store: Store,
    actionType: BaseAction,
    action: any,
    forceRefresh: boolean = false,
): Observable<T | undefined> {
    return iif(
        () => forceRefresh || !store.selectSnapshot(RequestState.doesRequestExist(actionType, action)),
        defer(() =>
            store.dispatch(new UpdateStateAction(actionType, action)).pipe(
                switchMap((storeResp) => source),
                catchError((error) =>
                    store.dispatch(new ExpireAction(actionType, action)).pipe(switchMap((storeResp) => throwError(error))),
                ),
            ),
        ),
        defer(() => of(undefined)),
    ).pipe(first());
}

/**
 * Combine the result of the source observable with the combinationFunction and store it into the GroupState
 *
 * @param store Instance of the store to dispatch actions to
 * @param groupId The ID of the group to store the information under
 * @param actionType The static (non-instance) reference to the Action's class
 * @param combinationFunction A function to combine the data from the source with existing data in a different scope
 * @returns OperatorFunction that can be used in a pipe to update the GroupState
 */
export function patchGroupStateData<T>(
    store: Store,
    groupId: number,
    actionType: BaseAction,
    combinationFunction?: (newValue: T) => T,
): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>): Observable<T> =>
        iif(
            () => Boolean(combinationFunction),
            // If there is a combination function, then get the existing data in the store and combine it
            defer(() => source.pipe(map((sourceValue) => combinationFunction(sourceValue)))),
            // otherwise just store the value that is in the pipe
            defer(() => source),
        ).pipe(
            switchMap((valueToStore) =>
                store.dispatch(new UpdateGroupState(groupId, actionType, valueToStore)).pipe(map((dispatchResp) => valueToStore)),
            ),
        );
}

/**
 * Combines the throttleRequest creation operator and the patchGroupStateData operator function into a single
 * Creation operator for simplicity.
 *
 * @param source The source obervable to wrap
 * @param store Instance of the store to inject into the function
 * @param actionType The static (non-instance) reference to the Action's class
 * @param action The instance of the action to store for throttling requests
 * @param combinationFunction Function used to combine source's emission with existing data before storage
 * @param forceRefresh If the action should be forced to execute or not, regardless of if it has already been executed
 * @returns The wrapped source observable. If the request exists, the source observable will not evaluate and will emit undefined.
 * If an error is caught, the request is removed from the store and then thrown. The emission from source is also stored into the
 * GroupState after it is combined with existing data
 */
export function throttleGroupDataUpdate<T>(
    source: Observable<T>,
    store: Store,
    actionType: BaseAction,
    action: any,
    combinationFunction?: (newValue: T) => T,
    forceRefresh: boolean = false,
): Observable<T | undefined> {
    return throttleRequest(
        source.pipe(patchGroupStateData<T>(store, action.groupId, actionType, combinationFunction)),
        store,
        actionType,
        action,
        forceRefresh,
    );
}

export function filterNullValues<T>(): MonoTypeOperatorFunction<T> {
    return filter((value) => value !== undefined && value !== null);
}

/**
 * Operator function to performs scaling retry logic with default behavior to retry API requests
 * every 3 seconds.
 *
 * @param numberOfRetries default 3, the number of times the function attempts to retry,
 * if -1 remains function keeps trying till it gets a success note success means an api call
 * without a 500 error
 * @param intervalPeriod default 1000, time in milliseconds between the first two retries
 * @param scaling default false, boolean to determine if intervalPeriod should scale. if true the delay
 * is multiplied by the current iteration, tracked by scale variable
 *
 * Example:
 * .pipe(retryAPI()) // will retry 3 times, once every second
 * .pipe(retryAPI(3, 2000, true)) // will retry 3 times, first after 2 seconds,
 *                                  then 4 seconds after the first retry,
 *                                  then 6 seconds after the second retry
 * .pipe(retryAPI(3, 2000, false)) // will retry 3 times, once every 2 seconds
 * .pipe(retryAPI(-1)) // will retry every 1 second until we receive a non-5XX response
 *
 * @returns the http request with appropriate retry logic if 500 error present, else returns a null
 */
export function retryAPI<T>(
    numberOfRetries: number = 3,
    intervalPeriod: number = 1000,
    scaling: boolean = false,
): MonoTypeOperatorFunction<T> {
    if (numberOfRetries === -1) {
        if (scaling) {
            // case set number of trials with scaling intervals
            return infiniteRetryWithScaling(intervalPeriod);
        }
        // case infinite trials with same interval
        return infiniteRetryWithoutScaling(intervalPeriod);
    }
    if (scaling) {
        // case set number of trials trials with scaling intervals
        return limitedRetryWithScaling(numberOfRetries, intervalPeriod);
    }
    // case set number of trials with same interval
    return limitedRetryWithoutScaling(numberOfRetries, intervalPeriod);
}
/**
 * Operator function to performs retry logic to retry API requests
 * every @param intervalPeriod milliseconds multiplied by the number of
 * retries that have occurred.
 * @param intervalPeriod time in milliseconds between the first two retries
 * @returns the http request with retry logic if 500 error present, else returns a null
 */
function infiniteRetryWithScaling<T>(intervalPeriod: number): MonoTypeOperatorFunction<T> {
    let scale = 0;
    return (src) =>
        src.pipe(
            retryWhen((errors) =>
                errors.pipe(
                    delayWhen(() => interval(intervalPeriod * ++scale)),
                    mergeMap((error) => iif(() => error.status in ServerErrorResponseCode, of(error), null)),
                ),
            ),
        );
}
/**
 * Operator function to performs scaling retry logic to retry API requests
 * every @param intervalPeriod milliseconds.
 * @param intervalPeriod time in milliseconds between the first two retries
 * @returns the http request with retry logic if 500 error present, else returns a null
 */
function infiniteRetryWithoutScaling<T>(intervalPeriod: number): MonoTypeOperatorFunction<T> {
    return (src) =>
        src.pipe(
            retryWhen((errors) =>
                errors.pipe(
                    delay(intervalPeriod),
                    mergeMap((error) => iif(() => error.status in ServerErrorResponseCode, of(error), null)),
                ),
            ),
        );
}
/**
 * Operator function to performs scaling retry logic to retry API requests
 * every @param intervalPeriod seconds up to @param numberOfRetries times.
 * @param numberOfRetries the number of times the function attempts to retry.
 * @param intervalPeriod default 1000, time in milliseconds between the first two retries.
 * @returns the http request with retry logic if 500 error present and the maximum number of
 * attempts has not been reached, else if max number of attempts has been reached returns
 * the error status text, else returns a null.
 */
function limitedRetryWithScaling<T>(numberOfRetries: number, intervalPeriod: number): MonoTypeOperatorFunction<T> {
    let scale = 0;
    return (src) =>
        src.pipe(
            retryWhen((errors) =>
                errors.pipe(
                    delayWhen(() => interval(intervalPeriod * ++scale)),
                    mergeMap((error) =>
                        iif(
                            () => error.status in ServerErrorResponseCode,
                            numberOfRetries-- > 0 ? of(error) : throwError(error.statusText),
                            null,
                        ),
                    ),
                ),
            ),
        );
}
/**
 * Operator function to performs retry logic to retry API requests
 * every @param intervalPeriod seconds up to @param numberOfRetries times.
 * @param numberOfRetries the number of times the function attempts to retry,]
 * @param intervalPeriod default 1000, time in milliseconds between the first two retries]]
 * @returns the http request with retry logic if 500 error present and the maximum number of
 * attempts has not been reached, else if max number of attempts has been reached returns
 * the error status text, else returns a null.
 */
function limitedRetryWithoutScaling<T>(numberOfRetries: number, intervalPeriod: number): MonoTypeOperatorFunction<T> {
    return (src) =>
        src.pipe(
            retryWhen((errors) =>
                errors.pipe(
                    delay(intervalPeriod),
                    mergeMap((error) =>
                        iif(
                            () => error.status in ServerErrorResponseCode,
                            numberOfRetries-- > 0 ? of(error) : throwError(error.statusText),
                            null,
                        ),
                    ),
                ),
            ),
        );
}
