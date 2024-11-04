import { FormGroup } from "@angular/forms";

export interface StepMeta {
    readonly stepId: string;

    cachedForm: FormGroup;
}
