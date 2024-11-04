import { EnrollmentStateRelation } from "../enums";

export interface CrossBorderRule {
    residentState: string;
    enrollmentStateRelation: EnrollmentStateRelation;
    allowEnrollment: boolean;
    releaseBusiness: boolean;
}
