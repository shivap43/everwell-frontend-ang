import { isDevMode } from "@angular/core";
import {
    ApiError,
    AsyncData,
    AsyncStatus,
    Entity,
    ErrorMessage,
    FailedAsyncData,
    IdleAsyncData,
    LoadingAsyncData,
    Nullish,
    SucceededAsyncData,
} from "@empowered/constants";
import { EntityState } from "@ngrx/entity";
import { getUnserializable } from "./services/serialization/serialization";

/**
 * Get AsyncData with AsyncStatus.IDLE
 *
 * @returns IdleAsyncData
 */
export function getIdleAsyncData<Value>(): IdleAsyncData<Value> {
    return { status: AsyncStatus.IDLE };
}

/**
 * Get AsyncData with AsyncStatus.LOADING
 *
 * @returns LoadingAsyncData
 */
export function getLoadingAsyncData<Value>(): LoadingAsyncData<Value> {
    return { status: AsyncStatus.LOADING };
}

/**
 * Get AsyncData with AsyncStatus.SUCCEEDED
 *
 * @returns SuccededAsyncData
 */
export function getSucceededAsyncData<Value>(value: Value): SucceededAsyncData<Value> {
    return { status: AsyncStatus.SUCCEEDED, value, error: null };
}

/**
 * Get AsyncData with AsyncStatus.FAILED
 *
 * @returns FailedAsyncData
 */
export function getFailedAsyncData<Value>(error: ApiError): FailedAsyncData<Value> {
    return { status: AsyncStatus.FAILED, error, value: null };
}

/**
 * Helper function to safely get a truthy AsyncData instance when expected instance might be null or undefined
 *
 * @param asyncData {AsyncData} (optional) possible AsyncData that might not be defined
 * @returns {AsyncData} AsyncData if it is defined or falls back to an AsyncData with status AsyncStatus.IDLE
 */
export function getAsyncData<Value>(asyncData?: AsyncData<Value> | Nullish): AsyncData<Value> {
    return asyncData ?? getIdleAsyncData<Value>();
}

/**
 * Used to get AsyncData from NGRX EntityState. If AsyncData is not defined,
 * return value will fallback to an AsyncData object with status AsyncStatus.IDLE
 *
 * This is commonly used when the EntityState implements the Entity<Identifiers, AsyncData<Value>> interface.
 *
 * @param entityState NGRX State that implements Entity interface where all values implement AsyncData
 * @param id {number | string} Generated id used to fetch from entities Dictionary
 * @returns {AsyncData} stored AsyncData instance from Entity Dictionary and valls back to AsyncData instance with status AsyncStatus.IDLE
 */
export function getAsyncDataFromEntitiesState<Value>(
    entityState: EntityState<Entity<unknown, AsyncData<Value>>>,
    id: number | string,
): AsyncData<Value> {
    return getAsyncData(entityState.entities[id]?.data);
}

/**
 * Function that accepts AsyncData with status AsyncStatus.SUCCEEDED
 * and returns a new AsyncData with a new value of a possibly different type than the original.
 */
export type OnSucceededAsyncData<Value, NestedValue> = (asyncData: SucceededAsyncData<Value>) => NestedValue;

/**
 * Function that accepts AsyncData with status AsyncStatus.SUCCEEDED
 * and returns a new AsyncData with a new value of a possibly different type than the original.
 */
export type SelectFromAsyncDatasFunction<Value, NestedValue> = (asyncDatas: SucceededAsyncData<Value>[]) => NestedValue[];

/**
 * Helper function to transform AsyncData.value used when status is AsyncStatus.SUCCEEDED.
 *
 * Return value will be a new AsyncData instance with a matching status:
 * AsyncStatus.IDLE, AsyncStatus.LOADING, AsyncStatus.SUCCEEDED, AsyncStatus.FAILED
 *
 * When status is FAILED, value will be null and error match source AsyncData instance.
 *
 * @param asyncData {AsyncData} source AsyncData
 * @param selector {OnSucceededAsyncData} function to transform source AsyncData.value to a new value
 *
 * @returns {AsyncData} new AsyncData instance with matching status from source AsyncData, where value is transformed
 */
export function mapAsyncData<Value, NestedValue>(
    asyncData: AsyncData<Value> | Nullish,
    onSucceeded: OnSucceededAsyncData<Value, NestedValue>,
): AsyncData<NestedValue> {
    if (!asyncData || asyncData.status === AsyncStatus.IDLE) {
        return getIdleAsyncData<NestedValue>();
    }

    if (asyncData.status === AsyncStatus.LOADING) {
        return getLoadingAsyncData<NestedValue>();
    }

    if (asyncData.status === AsyncStatus.FAILED) {
        return { status: AsyncStatus.FAILED, value: null, error: asyncData.error };
    }

    return { status: AsyncStatus.SUCCEEDED, value: onSucceeded(asyncData), error: null };
}

/**
 * Helper function to combine multiple AsyncData.value used when all AsyncData instances have status AsyncStatus.SUCCEEDED.
 *
 * Return value will be a new AsyncData instance with an aggregate status:
 * AsyncStatus.FAILED, AsyncStatus.IDLE, AsyncStatus.LOADING, AsyncStatus.SUCCEEDED.
 *
 * Aggregate status is determined when at least one AsyncData has the following statuses in this order:
 * 1. AsyncStatus.FAILED
 * 2. AsyncStatus.IDLE
 * 3. AsyncStatus.LOADING
 * 4. AsyncStatus.SUCCEEDED
 *
 * When aggregate status is FAILED, value will be null
 * and error match the first source AsyncData instance that has status AsyncStatus.FAILED.
 *
 * @param asyncDatas {AsyncData<Value>[]} array of source AsyncDatas
 *
 * @returns {AsyncData} new AsyncData instance with matching status from original AsyncData, where value is transformed
 */
export function combineAsyncDatas<Value, AsyncDatas extends AsyncData<Value>[]>(
    asyncDatas: [...AsyncDatas] | Nullish,
): AsyncData<{
    [Index in keyof AsyncDatas]: AsyncDatas[Index] extends AsyncData<infer T> ? T : Value;
}>;
export function combineAsyncDatas<Value>(asyncDatas: AsyncData<Value>[] | Nullish): AsyncData<Value[]> {
    const firstFailedAsyncDataError = asyncDatas?.find((asyncData) => asyncData.status === AsyncStatus.FAILED)?.error;

    if (firstFailedAsyncDataError) {
        return { status: AsyncStatus.FAILED, value: null, error: firstFailedAsyncDataError };
    }

    if (!asyncDatas || asyncDatas.some((asyncData) => asyncData.status === AsyncStatus.IDLE)) {
        return getIdleAsyncData<Value[]>();
    }

    if (asyncDatas.some((asyncData) => asyncData.status === AsyncStatus.LOADING)) {
        return getLoadingAsyncData<Value[]>();
    }

    return {
        status: AsyncStatus.SUCCEEDED,
        value: (asyncDatas as SucceededAsyncData<Value>[]).map(({ value }) => value),
        error: null,
    };
}

/**
 * Flattens nested AsyncDatas into a single `AsyncData`.
 * If the parent `AsyncData` instance has any `AsyncStatus` that is not `AsyncStatus.SUCCEEDED`,
 * then an `AsyncData` instance with that status will return.
 *
 * If the parent `AsyncData` instance has `AsyncStatus` that is `AsyncStatus.SUCCEEDED`, then will return the child `AsyncData` instance:
 *
 * `AsyncData<AsyncData<Value>>` -> `AsyncData<Value>`
 */
export function flattenAsyncData<Value>(asyncData: AsyncData<AsyncData<Value>> | Nullish): AsyncData<Value> {
    // Handle return an `AsyncData` with non-`AsyncStatus.SUCCEEDED` status
    // from parent `AsyncData`

    if (!asyncData || asyncData.status === AsyncStatus.IDLE) {
        return getIdleAsyncData<Value>();
    }

    if (asyncData.status === AsyncStatus.LOADING) {
        return getLoadingAsyncData<Value>();
    }

    if (asyncData.status === AsyncStatus.FAILED) {
        return { status: AsyncStatus.FAILED, value: null, error: asyncData.error };
    }

    // If `AsyncStatus.SUCCEEDED`, return child `AsyncData`
    return asyncData.value;
}

/**
 * Combines all arguments into a string to be used as an Entity id
 *
 * @param args list of identifiers
 * @returns {string} string that joins all arguments with '-' as delimier
 */
export function getEntityId<T extends (number | string | boolean | null | undefined)[]>(...args: [...T]): string {
    return args.map((arg) => arg ?? "").join("-");
}

/**
 * Checks if error is serializable. If not returns a generic ApiError.
 * This is used to avoid runtime errors using NGRX actions and storing unexpected errors that are not ApiError.
 *
 * A runtime error would occur if a dispatched NGRX action includes anything that is not serializable
 * This is required since we have little control over what error we will get from the api response.
 *
 * @param apiError {unknown} Expected to be ApiError but could be anything
 * @returns {unknown | ApiError} Same instance of argument or general ApiError instance
 */
export function getSerializableError<T = ApiError>(apiError: T): ApiError | T;
export function getSerializableError<T = ApiError>(apiError: T | null): ApiError | T | null;
export function getSerializableError<T = ApiError>(apiError?: T): T | undefined;
export function getSerializableError<T = ApiError>(apiError?: T | null): ApiError | T | undefined | null {
    // If apiError isn't serializable, return general ApiError
    if (getUnserializable({ state: apiError })) {
        const generalApiError: ApiError = {
            status: "",
            errorKey: "",
            value: "",
        };

        if (isDevMode()) {
            console.error("Unexpected error instance is not serializable", apiError);
        }

        return generalApiError;
    }

    // Assume that if error is serializable
    return apiError;
}

/**
 * Gets error message from ApiError. Depending on if `fallbackToGeneralMessage` is true,
 * ErrorMessage will fallback to a general server error message
 *
 * @param apiError {ApiError} ApiError used when API endpoint fails
 * @param fallbackToGeneralMessage {boolean} fallback to a general server error message
 * @returns {ErrorMessage | null} Message that describes why API response failed
 */
export function getErrorMessage(apiError: ApiError, fallbackToGeneralMessage?: boolean): ErrorMessage | null {
    const { languageTag, displayText } = apiError?.language ?? {};

    // If any of these properties are present, return `ErrorMessage`
    // `languageTag` should be used over `displayText`
    // `languageTag` is commonly used with `language` directive or used with `LanguageService`
    if (languageTag || displayText) {
        return { language: languageTag, displayText };
    }

    if (fallbackToGeneralMessage) {
        // Default to returning general server error message
        // "Server Error. Please try again."
        return { language: "secondary.portal.beneficiaryList.serverError" };
    }

    return null;
}
