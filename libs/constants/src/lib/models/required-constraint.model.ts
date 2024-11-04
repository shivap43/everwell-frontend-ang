export interface RequiredConstraint {
    aloneSatisfies: boolean;
    questionId: number;
    response: string;
    requiredCondition: RequiredCondition;
}

export enum RequiredCondition {
    CONVERSION = "CONVERSION",
}
