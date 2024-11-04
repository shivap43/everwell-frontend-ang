import { CustomStep } from "./custom-step-model";

export interface CustomSection {
    title: string;
    steps: CustomStep[];
    sectionId?: number;
    showSection: boolean;
}
