// This model is used internally by components in this lib
// and does not model any data from the API contracts.

export interface CallCenterConfigs {
    featureEnabled: boolean; // whether 8x8 call centers are enabled
    allowedCallCenterIds: number[]; //  call center ids of call centers allowing automatic 8x8 transmittal
    customRecordingMaxCharacters: number; // max number of characters allowed for this field
    inboundCallCenterMinEligibleEmployees: number; // min employees for inbound call centers to be available
    startTimeDefault: string; // VCC calling schedule default start time
    endTimeDefault: string; // VCC calling schedule default end time
    callCenterEnrollmentMinEmployees: number;
    disabilityEnrollmentMinEmployees: number; // min employees required for disability enrollment via VCC
    accountNameMaxLength: number; // account name max length
    accountNameMinLength: number; // account name min length
    enrollmentSupportEmail: string;
    disabilityEnrollmentSupportEmail: string;
    callCenterStartDateFromMinDays: number;
}
