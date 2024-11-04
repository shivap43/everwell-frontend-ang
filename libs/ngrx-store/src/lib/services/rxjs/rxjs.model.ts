import { MonoTypeOperatorFunction } from "rxjs";

/**
 * Instance that has id property
 */
export interface HasId {
    id?: unknown;
}

/**
 * Extract Type from Array of Types:
 *
 * Extract Type `V` where if T satisfies `E[]`, then `V` is `E`.
 * Else assume `T` is not an array and `V` is whatever `T` is.
 */
export type ArrayElementType<T> = T extends (infer E)[] ? E : T;

/**
 * Function that compares each element in an Array to determine if the array has changed.
 * Defaults to comparing ids.
 */
export interface DistinctArrayUntilChanged {
    <T>(compare: (a: ArrayElementType<T>, b: ArrayElementType<T>) => boolean): MonoTypeOperatorFunction<T>;
    <T extends any[]>(compare?: (a: ArrayElementType<T>, b: ArrayElementType<T>) => boolean): MonoTypeOperatorFunction<T>;
}
