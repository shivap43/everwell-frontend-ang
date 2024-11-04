import { Step } from "./step.model";

export interface CustomStep {
    step: Step[];
    showStep: boolean;
    completed?: boolean;
    prefilled?: boolean;
}
