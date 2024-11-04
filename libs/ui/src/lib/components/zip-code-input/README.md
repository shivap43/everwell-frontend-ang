# Empowered Zip Code Input

### Author: Stephen Stroud

# Overview:

The Zip Code Input ensures only numerical input and validates based on regex, state match, and any parent form control's
validators. The language specifications can be overridden via inputs. A `parent form control` is one that is implemented
on the same level on which this component is; the `child form control` is a singular async validator that is abstracted
within the component, taking care of zip code pattern and state match. Upon any validation errors that occur in the
parent form control, an appropriate error message can be projected into the component (see example).

-   Zip Code Input inputs:
    -   `formControl`: AbstractControl
        -   Instance of parent form control for the zip code input
        -   Child form control
        -   Only mandatory input
    -   Language specification overrides:
        -   `inputLabel`?: string
            Errors:
        -   `patternError`?: string
        -   `stateMismatchError`?: string
    -   `validateOnStateChange`?: boolean (default: false)
    -   `readonly`?: boolean (default: false)
    -   `stateControlValue`?: string
        -   Live value of state control with which to determine zip code match
        -   Updating value must be handled manually

# Example:

```typescript
    // field declaration and initialization
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    protected readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();
    ...
    setFormControls(): void {
        this.form = this.formBuilder.group({
            address: this.formBuilder.group({
                state: [""],
                zip: [""],
                // other controls
            }),
            // other groups
        });
    }

    onStateSelection(stateValue: string): void {
        this.stateControlValueSubject$.next(stateValue);
        // other custom logic
    }
```

```html
<!-- state input implementation -->
<empowered-zip-code-input
    [formControl]="form.controls.address.controls.zip"
    [stateControlValue]="stateControlValue$ | async"
>
    <mat-error
        *ngIf="form.controls.address.controls.zip.errors?.required"
        language="secondary.portal.members.workValidationMsg.required"
    ></mat-error>
</empowered-zip-code-input>
```
