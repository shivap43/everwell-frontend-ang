import { DisableType, MissingInfoType } from "../enums";
import { CoverageLevel } from "./api";
import { EnrollmentRequirement } from "./enrollmentRequirement.model";

export interface DisablePlanPanel {
    status?: boolean;
    planDisable?: boolean;
    spouseDisable?: boolean;
    coverageLevel?: CoverageLevel[];
    knockoutData?: any;
    type?: DisableType;
    message?: MissingInfoType;
    enrollmentRequirement?: EnrollmentRequirement;
}
