import { TRANSMITTAL_SCHEDULE } from "../enums";

export interface EnrollmentModel {
    commissionSplitId: number;
    enrollmentComment: string;
    transmittalSchedule: TRANSMITTAL_SCHEDULE;
    sentDate?: string;
    enrollmentId?: number;
}
