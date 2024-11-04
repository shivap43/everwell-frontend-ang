import { AsyncStatus } from "../../enums";
import { BaseAsyncData } from "./base-async-data.model";
import { FailedAsyncData } from "./failed-async-data.model";

export type Nullish = undefined | null;
/**
 * AsyncData that has yet to start loading. value and error might not be defined yet.
 */
export type IdleAsyncData<Value> = BaseAsyncData<Value, AsyncStatus.IDLE, Nullish>;
/**
 * AsyncData that has started loading. value and error might not be defined yet.
 */
export type LoadingAsyncData<Value> = BaseAsyncData<Value, AsyncStatus.LOADING, Nullish>;
export type AsyncData<Value> = IdleAsyncData<Value> | LoadingAsyncData<Value> | SucceededAsyncData<Value> | FailedAsyncData<Value>;

/**
 * AsyncData that has loaded successfully. value is expected to be defined and error should be set to null.
 */
export interface SucceededAsyncData<Value> extends BaseAsyncData<Value, AsyncStatus.SUCCEEDED, Nullish> {
    value: Value;
    error: null;
}
