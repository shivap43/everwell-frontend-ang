# Date Picker Component

### Author: Ryan Tennyson & Clay Palumbo

## Summary: Use this when you need a date-picker in your forms. It implements an ADA compliant MatDatePicker without the need of typing all the redundant boilerplate code.

## Implementation

-   Using the <empowered-date-picker> component along with a few inputs you can have a completely functional MatDatePicker input.

-   For error handling pass in a span tag with-in the component.
    -   Make sure to not include the <mat-error> tag.

## Inputs

-   formControlName: Syncs a FormControl in an existing FormGroup to a form control element by name.
-   minDate?: The min date that the calendar is allowed to select.
-   maxDate?: The max date that the calendar is allowed to select.
-   labeledById?: Connects the input to the label to assist screen-reader users.
-   customHint?: A custom message to give the user a hint of how to use the input.
-   formName?: Look up empowered-input README on how to use.
-   displayOrder?: Look up empowered-input README on how to use.

*   Example use:

```html
<empowered-date-picker
    formControlName="formControlExample"
    [minDate]="lastYear"
    [maxDate]="today"
    labeledById="exampleLabel"
    customHint="Example Hint"
    [formName]="formName"
    displayOrder="1"
>
    <mat-error *ngIf="reasonOne">
        <span>This is where your errors can go</span>
    </mat-error>
    <mat-error *ngIf="reasonTwo">
        <span>You can add multiple errors</span>
    </mat-error>
</empowered-date-picker>
```
