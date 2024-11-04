/**
 * Used to determine if AsyncData data has loaded successfully.
 *
 * IDLE - Hasn't been attempted to load yet
 * LOADING - Is currently loading
 * SUCCEEDED - Has successfully loaded
 * FAILED - Has failed trying to load
 */
export enum AsyncStatus {
    IDLE = "idle",
    LOADING = "loading",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
}
