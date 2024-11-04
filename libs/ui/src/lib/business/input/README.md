# ADA Wrapper Component and Directive for Material Form Fields

# Author: Clay Palumbo

# Summary

A component/directive that ensures your form fields are ADA compliant for screen readers and to apply modern behavior for error validation.

This functionality can be applied to your fields using either the <empowered-input> component or by using the `empoweredInput` directive.

-   For standard form fields like <input> and <mat-select> the <empowered-input> is a great use case.
-   For other form fields like <mat-radio-group> and Date Pickers the `empoweredInput` directive may be the better option.
-   Make sure to fire off the `CheckForm` action in your submission button/trigger to get the apply focus feature (example use of the `CheckForm` action down below).

# What does it do?

-   Appends aria attributes like: `aria-labelledby`, `aria-describedby`, and `id` to different elements like: `mat-label`, `mat-input`, and `mat-error` to make the field ADA compliant.
    (**_the effect mentioned above only works for the <empowered-input> component_**)

-   In the event that the user makes an error on submission, it will apply focus to the first input with an error to improve UX.

# Inputs

-   `displayOrder`: used to set the order of each field in your form.
-   `formName`: this should match the name of the form the field is in.

#######################

# How to use the <empowered-input> Component

**_Currently being used in the login.component_**

Wrap your <mat-label> and <mat-form-field> in the <empowered-input> component to ensure that your form field is ada compliant.

Make sure to define the `displayOrder` and `formName` inputs.

For templates that cannot be wrapped with the <empowered-input> component use the `empoweredInput` directive (Example use cases: Datepicker, RadioGroup, and fields that are not apart of a standard form).

# Example Use:

<empowered-input displayOrder="0" formName="your-form-name-goes-here">
    <mat-label>Label Name<mat-label>
    <mat-form-field>
        <input matInput/>
        <mat-error>
        </mat-error>
    </mat-form-field>
<empowered-input>

###############################

# How to use the `empoweredInput` Directive

Apply this directive to the component that has access to the FormControl and make sure to define the `displayOrder` and `formName` inputs

For a date picker field as well as any other field, make sure all validations are in the form of a validator. This directive is tapping into the `FormControl.inValid` state to track error validation so make sure that is configured properly

# Example Use:

<div>
    <mat-label>Label Name<mat-label>
    <mat-form-field>
        <input
            [matDatepicker]="picker"
            matInput
            formControlName="birthDate"
            empoweredInput
            formName="your-form-name-goes-here"
            displayOrder="0"
        />
        <mat-error>
        </mat-error>
    </mat-form-field>
</div>

# Add this action to your form's submit/trigger function to add the "apply focus" feature

**_View the login.component.ts file to see an example_**

-   Fire off the `CheckForm` action in the method you are currently using to submit your form
-   Also make sure to add the `ResetState` action to reset the store to its default state.

# Example:

```typescript
onSubmit(): void {
    ...
    this.store.dispatch(new CheckForm("your-form-name-goes-here"));
}
```

**_Make sure that the form name you chose on your submission trigger matches the one you use in your template._**
