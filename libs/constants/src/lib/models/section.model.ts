import { Step } from "./step.model";

export interface Section {
    title: string;
    steps: Step[];
    sectionId?: number;
}
