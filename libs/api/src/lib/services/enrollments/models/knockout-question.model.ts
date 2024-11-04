import { Question, ConstraintAggregates } from "@empowered/constants";

export interface KnockoutObject {
    planOfferingId: number;
    coverageLevelId: number;
    stackable: boolean;
    itemId: number;
}
export interface KnockoutQuestion {
    id: number;
    type: string;
    title: string;
    directions: string;
    body: string;
    constraintAggregates: ConstraintAggregates;
    question: Question;
}
