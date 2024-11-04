import { FormGroup } from "@angular/forms";
import { Output, EventEmitter, Directive } from "@angular/core";

@Directive()
/* eslint-disable-next-line @angular-eslint/directive-class-suffix */
export abstract class AbstractComponentStep {
    abstract form: FormGroup;
    @Output() isTouched: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor() {}

    /**
     * Hook for implementing functions to know when the user has attemped to click the next button, but the current step has an invalid form
     */
    onInvalidTraversal(): void {}

    /**
     * Hook for after input and prerequisite properties get loaded into the component
     */
    onPropertyLoad(): void {}
}
