import { AgAppResponse } from "./application-response.model";
import { PlanOptionResponse } from "./plan-option-response-model";
import { ReinstateResponse } from "./reinstate-response-model";

export interface ResponsePanel {
    type: string;
    stepId: number;
    value: string[] | ReinstateResponse[] | PlanOptionResponse[] | AgAppResponse[];
    key?: string;
    planQuestionId?: number;
}
