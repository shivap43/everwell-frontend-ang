import { FormArray, FormGroup } from "@angular/forms";

export interface RiderOptionsFormGroupControls {
    benefitAmount: number[];
    coverageLevel: string[];
    selected: boolean;
    planName: string;
    spouseTobaccoStatus: string[];
    spouseGender: string[];
}

export enum RiderOptionSelected {
    COMBINED = "10 year term",
    CUSTOM = "Custom",
}

export type RiderOptionsFormGroup = {
    controls: RiderOptionsFormGroupControls;
} & FormGroup;

/**
 * Wrapper type for `FormArray` where each control is a `FormGroup`
 * and each `FormGroup` has controls of `RiderFormGroupControls`
 */
export type RiderOptionsFormArray = {
    controls: RiderOptionsFormGroup[];
} & FormArray;
