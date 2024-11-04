import { StepData } from "./step-data-model";
import { Step } from "./step.model";

export interface StepChangeDetails {
    stepIndex: number;
    planId?: number;
    nextClicked?: boolean;
    planObject?: StepData;
    sectionIndex?: number;
    steps?: Step[];
    sectionTitle?: string;
}
