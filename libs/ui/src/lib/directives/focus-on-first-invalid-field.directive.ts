import { Directive, HostListener, ElementRef, Input } from "@angular/core";

@Directive({
    selector: "[empoweredFocusOnFirstInvalidField]",
})
export class FocusOnFirstInvalidFieldDirective {
    /**
     * On submission of form, if any invalid fields exist, focus the first one.
     * Gets a query string as parameter. The query string decides which kind fields need to be considered (input, radio, checkboxes etc).
     * Usage:
     * TS:-
     * queryString = "input.ng-invalid, mat-radio-group.ng-invalid > mat-radio-button";
     * Template:-
     * <form
        [formGroup]="form"
        [empoweredFocusOnFirstInvalidField]="queryString"
        (ngSubmit)="onFinish()"
     * >....
     */
    @Input("empoweredFocusOnFirstInvalidField") queryString: string;
    constructor(private elementRef: ElementRef) {}
    @HostListener("submit")
    onFormSubmit(): void {
        const invalidFields = this.elementRef.nativeElement.querySelectorAll(this.queryString);
        if (invalidFields.length > 0) {
            invalidFields[0].focus();
        }
    }
}
