import { Injectable } from "@angular/core";
import { CrossBorderRule, EAAResponse, EnrollmentStateRelation } from "@empowered/api";

@Injectable({
    providedIn: "root",
})
export class AccountUtilService {
    /**
     * Checks cross border rules and displays error or warning message
     * @param enrollmentState is mandatory and captures user-selected state
     * @param crossBorderRules is mandatory and contains cross border rules
     * @returns object with info about whether to show a warning or error
     */
    checkCrossBorderRules(enrollmentState: string, crossBorderRules: CrossBorderRule[]): EAAResponse {
        let isMissingEAAWarning = false;
        let isMissingEAAError = false;
        const rule = crossBorderRules && crossBorderRules.find((val) => val.allowEnrollment === false || val.releaseBusiness === false);
        if (
            rule &&
            ((rule.enrollmentStateRelation === EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT && rule.residentState !== enrollmentState) ||
                (rule.enrollmentStateRelation === EnrollmentStateRelation.SAME_AS_RESIDENT && rule.residentState === enrollmentState))
        ) {
            if (rule.allowEnrollment && !rule.releaseBusiness) {
                isMissingEAAWarning = true;
            } else if (!rule.allowEnrollment) {
                isMissingEAAError = true;
            }
        }
        return {
            isMissingEAAError,
            isMissingEAAWarning,
        };
    }
}
