import { Injectable } from "@angular/core";
import { MonoTypeOperatorFunction } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { ArrayElementType, DistinctArrayUntilChanged, HasId } from "./rxjs.model";

/**
 * Compare two instances that have property id
 *
 * @param a {HasId} Instance used in comparison
 * @param b {HasId} Instance used in comparison
 *
 * @returns Instances have matching ids
 */
export const compareId = <T extends HasId>(a: T, b: T): boolean => a.id === b.id;

/**
 * Compares previous array to current array
 * and filters emitted values where instances from the previous array match the current array.
 *
 * This is done by comparing the the previous value to the current value. Default behavior is comparing ids
 *
 * @param compare {(a: V, b: V) => boolean} - allow for customizing comparison. Default is comparing ids
 * @returns {MonoTypeOperatorFunction<[...V]>} Filtered data stream where array of values
 * match up with previous array based on compare function
 */
export const distinctArrayUntilChanged: DistinctArrayUntilChanged = <T extends any[]>(
    compare?: (a: ArrayElementType<T>, b: ArrayElementType<T>) => boolean,
): MonoTypeOperatorFunction<T> =>
    distinctUntilChanged((previous, current) => {
        // Default to comparing ids, but allow for using a different comparison function
        // This allows for instances that don't have ids
        const comparisonFunction = compare ?? compareId;

        // If arrays have different length, assume that array has changed
        if (previous.length !== current.length) {
            return false;
        }

        // Since they have the same length, we know that there is a currentValue for every previousValue
        // So this means we don't need to do any nullish checks

        // Check if every value of the previous id matches the new ids
        return previous.every((previousValue, index) => {
            const currentValue = current[index];

            return comparisonFunction(previousValue, currentValue);
        });
    });

@Injectable({
    providedIn: "root",
})
export class RXJSService {
    /**
     * Compare two instances that have property id
     *
     * @param a {HasId} Instance used in comparison
     * @param b {HasId} Instance used in comparison
     *
     * @returns Instances have matching ids
     */
    compareId<T extends HasId>(a: T, b: T): boolean {
        return compareId(a, b);
    }

    /**
     * Compares previous array to current array
     * and filters emitted values where instances from the previous array match the current array.
     *
     * This is done by comparing the the previous value to the current value. Default behavior is comparing ids
     *
     * @param compare {(x: V, y: V) => boolean} - allow for customizing comparison. Default is comparing ids
     * @returns {MonoTypeOperatorFunction<[...V]>} Filtered data stream where array of values match up
     * with previous array based on compare function
     */
    distinctArrayUntilChanged<T extends HasId[]>(): MonoTypeOperatorFunction<T>;
    distinctArrayUntilChanged<T>(compare: (a: ArrayElementType<T>, b: ArrayElementType<T>) => boolean): MonoTypeOperatorFunction<T>;
    distinctArrayUntilChanged<T extends any[]>(
        compare?: (a: ArrayElementType<T>, b: ArrayElementType<T>) => boolean,
    ): MonoTypeOperatorFunction<T> {
        return distinctArrayUntilChanged(compare);
    }
}
