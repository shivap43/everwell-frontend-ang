import { FormControl } from "@angular/forms";

export interface DependnentForm {
    firstName: FormControl;
    lastName: FormControl;
    birthDate: FormControl;
    gender: FormControl;
    state: FormControl;
    zip: FormControl;
    relationshipToEmployee: FormControl;
}
