import { Type } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AbstractComponentStep } from "./abstract-step.model";

export interface StepModel {
    readonly id: string;
    readonly stepComponentType: Type<AbstractComponentStep>;
    readonly tabId?: string;
    readonly formId?: string;
    readonly inputData?: Map<string, any>;
    readonly prerequisiteData?: { formId: string; controlName: string }[];
    evaluateNextStep?: boolean;

    nextStep?(form?: FormGroup): string;
}
