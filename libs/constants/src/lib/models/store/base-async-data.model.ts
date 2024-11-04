import { AsyncStatus } from "../../enums";
import { Nullish } from "./succeeded-async-data.model";

/**
 * Base interface for AsyncData. Should have status to determine loading state,
 * error for when loading data has failed, and value for when data has loaded successfully.
 */
export interface BaseAsyncData<Value, Status extends AsyncStatus, Error> {
    value?: Value | Nullish;
    status: Status;
    error?: Error | Nullish;
}
