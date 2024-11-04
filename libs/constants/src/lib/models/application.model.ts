import { ApplicationEnrollmentRequirements } from "./application.enrollment.restrictions.model";
import { Section } from "./section.model";

export interface Application {
    id: number;
    planId: number;
    riderApplicationIds: number[];
    sections: Section[];
    cartItemId?: number;
    baseRiderId?: number;
    enrollmentRequirements?: ApplicationEnrollmentRequirements[];
}
