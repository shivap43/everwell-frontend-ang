import { Days } from "../enums";

// Defines the calling schedule model for virtual call centers.
export interface CallingSchedule {
    day: Days;
    startTime?: Date | string;
    endTime?: Date | string;
    timeZoneAbbreviation: string;
}
