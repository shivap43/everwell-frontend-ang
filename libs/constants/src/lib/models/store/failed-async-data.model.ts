import { AsyncStatus } from "../../enums";
import { ApiError } from "../api/api-error.model";
import { BaseAsyncData } from "./base-async-data.model";

/**
 * AsyncData that has failed to load.
 *
 * error property is expected be defined and value is likely to be set to null.
 */
export interface FailedAsyncData<Value> extends BaseAsyncData<Value, AsyncStatus.FAILED, ApiError> {
    value: null;
    error: ApiError;
}
