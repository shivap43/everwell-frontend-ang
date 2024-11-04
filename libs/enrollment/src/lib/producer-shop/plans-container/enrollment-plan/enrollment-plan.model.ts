import { PayFrequency } from "@empowered/constants";

/**
 * Scenarios for enrollment card display message
 */
export enum EnrollmentMessage {
    ACTIVE_NO_EDIT = "Active no edit enrollment",
}

export interface PayFrequencyObject {
    payFrequencies: PayFrequency[];
    pfType: string;
    payrollsPerYear: number;
}
