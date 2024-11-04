import { Format, Type } from "../enums";
import { Contraints } from "./contraints.model";
import { HideUnlessConstraint } from "./hide-unless-constraint.model";
import { Option } from "./option.model";

export interface Question {
    id: number;
    key: string;
    text: string;
    name?: string;
    inputType: string;
    required: boolean;
    readOnly: boolean;
    constraints: Contraints;
    placeholderText?: string;
    format?: Format;
    minLength?: number;
    maxLength?: number;
    options?: Option[];
    type?: Type;
    inputs?: Question[];
    response?: string;
    hideUnlessConstraint?: HideUnlessConstraint[];
    requiredConstraint?: HideUnlessConstraint[];
}
