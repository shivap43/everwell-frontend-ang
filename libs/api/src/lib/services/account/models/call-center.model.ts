import { Validity } from "@empowered/constants";
import { CallCenterType } from "../enums";
import { CallingSchedule } from "./calling-schedule.model";

export interface AccountCallCenter {
    id?: number;
    callCenterId: number;
    callCenter?: CallCenter;
    validity: Validity;
    specialInstructions?: string;
    tollFreeNumber?: string;
    lastModified?: string;
    aflacGroupEnrollmentAllowed?: boolean;
    scheduleType?: CallCenterType;
    schedules?: CallingSchedule[];
    recordingStandardAccountName?: string;
    recordingAfterHoursAccountName?: string;
    recordingCustomMessage?: string;
    spanishAssistance?: boolean;
    contactAgentName?: string;
    contactAgentEmail?: string;
}

interface CallCenter {
    id: number;
    name: string;
    minSubscriberCount: number;
    aflacGroupEnrollmentAllowed?: boolean;
}
