import { Store } from "@ngxs/store";
import { filter, switchMap, tap, first } from "rxjs/operators";
import { ElementRef, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AbstractControl } from "@angular/forms";
import { UpdateInput, FormState, FormModel, InputState } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class InputService {
    constructor(private readonly store: Store) {}

    /**
     * Creates an observable that on forms state change, will focus to the error field with the lowest display order
     * @param _domOrder order that the field displays in the form
     * @param element a reference to the dom element
     * @returns an observable of the form store
     */
    applyFocus$(_domOrder: string, element: ElementRef): Observable<string> | undefined {
        if (_domOrder) {
            return this.store.select(FormState.formState).pipe(
                filter((formState) => Boolean(formState.formName)),
                switchMap((formState: FormModel) => this.store.select(InputState.selectErrorField(formState.formName)).pipe(first())),
                filter((domOrder) => _domOrder === domOrder),
                tap(() => element.nativeElement.focus()),
            );
        }
        return undefined;
    }
    /**
     * Dispatches an action to update the input store with new values
     * @param field an abstract control to access the formControls state of validity
     * @param elementId unique id for the field
     * @param formName form that the field is associated with
     * @param domOrder order that the field displays in the form
     * @returns an observable of the input store
     */
    updateInputStore$ = (field: AbstractControl, elementId: string, formName: string, domOrder: string): Observable<UpdateInput> => {
        const isInvalid = field.invalid;
        return this.store.dispatch(new UpdateInput(formName, isInvalid, domOrder, elementId));
    };
}
