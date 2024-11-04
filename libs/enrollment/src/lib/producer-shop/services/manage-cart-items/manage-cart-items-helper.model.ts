import { KnockoutQuestion } from "@empowered/api";
import { AddToCartItem, PlanOfferingWithCartAndEnrollment, UpdateCartItem, AgAppResponse } from "@empowered/constants";
import { AnswerKnockoutQuestionValue } from "../producer-shop-component-store/producer-shop-component-store.model";

export interface ReplaceDialogResponse {
    isReplace: boolean;
    selectedPlanOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment;
    previousCartItem: AddToCartItem | UpdateCartItem;
    isActiveEnrollment: boolean;
}

export enum PlanOfferingOptions {
    EDIT = "edit",
    REPLACE = "replace",
    ELIGIBILITY_CHECK = "eligibilityCheck",
}

export interface InEligibleAnswerData {
    isIneligible: boolean;
    answeredData?: AnsweredData[];
}

export interface AnsweredData {
    knockoutQuestion: KnockoutQuestion;
    answer: AnswerKnockoutQuestionValue | string | AgAppResponse | { [key: string]: string | number };
}

export interface KnockoutQuestionsAndInelgibleAnswers {
    knockoutQuestions: KnockoutQuestion[];
    answersIneligibleData: InEligibleAnswerData;
    selectedPlanOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment;
}
