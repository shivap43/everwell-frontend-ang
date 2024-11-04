/**
 * Plan's with below enrolled status aren't allowed to be withdrawn
 */
export enum StatusNotAllowedForPlanWithdraw {
    CANCELLED = "CANCELLED",
    VOID = "Void",
    ENDED = "Ended",
}
