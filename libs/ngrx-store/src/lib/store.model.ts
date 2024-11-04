// source: https://redux.js.org/tutorials/essentials/part-5-async-logic#loading-state-for-requests

import { AsyncStatus, BaseAsyncData, Nullish } from "@empowered/constants";

export type Nullable<T> = { [K in keyof T]: T[K] | null };
export type NullishPartial<T> = Partial<Nullable<T>>;

/**
 * Structure for instances to be stored in NGRX EntityState.
 * Used for manage identifiers used to generate NGRX Entity id. Commonly used with EntityAdaptor.
 *
 * Identifiers is a Dictionary used to generate Entity ids.
 *
 * Data is the expected entity type. This is the type for any instance found in the EntityState.
 */
export interface Entity<Identifiers, Data> {
    identifiers: Identifiers;
    data: Data;
}

export type Snapshot<T> =
    | {
        value: null;
        captured: false;
    }
    | {
        value: T;
        captured: true;
    };
