import { Contraints } from "./contraints.model";
import { RequiredConstraint } from "./required-constraint.model";
import { KnockoutType } from "./../enums/knockout-type.enum";

export interface Option {
    backToStepElement: string;
    backToStepLink: string;
    value: string;
    label: string;
    constraints: Contraints[];
    knockoutType: KnockoutType;
    knockoutText?: string;
    showOption?: boolean;
    required?: boolean;
    requiredConstraint?: RequiredConstraint[];
}
