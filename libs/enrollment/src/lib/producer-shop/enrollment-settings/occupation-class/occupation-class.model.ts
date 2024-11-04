import { RiskClass } from "@empowered/constants";

export interface RiskClassFormValues {
    // Labels are used only when RatingCode.DUAL is used since there are two radio groups
    label?: string;
    riskClasses: RiskClass[];
    // Used to initalize default value for FormControls used for FormGroup.riskClasses
    defaultRiskClass: RiskClass;
}
