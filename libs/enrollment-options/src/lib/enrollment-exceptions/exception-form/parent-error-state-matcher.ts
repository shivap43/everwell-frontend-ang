import { FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { DateRangeErrorType } from "../../models/manage-call-center.model";

/**
 * Shows error on the form control when the form group is invalid.
 */
export class ParentErrorStateMatcher implements ErrorStateMatcher {
    constructor(private readonly dateType: string) {
        this.dateType = dateType;
    }

    /**
     * Returns whether errors should be shown on the form control.
     *
     * @param control form control
     * @param form parent form
     * @returns boolean indicating whether errors should be shown
     * */
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return (
            control &&
            (control.invalid || [this.dateType, DateRangeErrorType.BOTH].includes(control.parent?.parent?.errors?.overlap?.type)) &&
            (control.touched || control.dirty || form?.submitted)
        );
    }
}
