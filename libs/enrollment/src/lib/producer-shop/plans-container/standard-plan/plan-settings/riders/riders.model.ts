import { FormArray, FormControl, FormGroup } from "@angular/forms";

export interface RiderFormGroupControls {
    riderPlanName: { value: boolean } & FormControl;
    coverageLevelName: { value: string } & FormControl;
    eliminationPeriodName: { value: string } & FormControl;
    benefitAmount: { value: number } & FormControl;
}

export type RiderFormGroup = {
    controls: RiderFormGroupControls;
} & FormGroup;

/**
 * Wrapper type for `FormArray` where each control is a `FormGroup`
 * and each `FormGroup` has controls of `RiderFormGroupControls`
 */
export type RiderFormArray = {
    controls: RiderFormGroup[];
} & FormArray;
