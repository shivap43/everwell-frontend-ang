import { HideUnlessConstraint, Contraints, Type, Format, Option } from "@empowered/constants";

export interface Question {
    id: number;
    key: string;
    text: string;
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
