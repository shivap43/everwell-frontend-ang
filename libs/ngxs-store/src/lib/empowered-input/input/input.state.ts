import { State, Action, StateContext, createSelector, Selector } from "@ngxs/store";
import { InputModel, InputField, InputForm } from "./input.model";
import { UpdateInput } from "./input.action";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: InputModel = {
    forms: [],
};

@State<InputModel>({
    name: "inputs",
    defaults: defaultState,
})
@Injectable()
export class InputState {
    /**
     * Finds the matching form in the input store and then returns the display order number of the first field with an error.
     * @param formName name of the form that has been submitted
     * @returns the display order of the first input/select field in an error state
     */
    static selectErrorField(formName: string): (state: InputModel) => string {
        return createSelector([InputState], (state: InputModel) => {
            // The first input/select in a form with an error
            let errorDomOrder: string;
            const matchingFields: InputField[] = state.forms.find((form) => form.formName === formName).fields;
            matchingFields.forEach((field) => {
                if (field.error && !errorDomOrder) {
                    errorDomOrder = field.domOrder;
                }
            });
            return errorDomOrder;
        });
    }

    /**
     * A slice of the inputs store that contains all forms
     * @param state input state
     * @returns forms from the input state
     */
    @Selector()
    static getStore(state: InputModel): InputForm[] {
        return state.forms;
    }

    /**
     * Used to reset state back to its default value
     * @param context state slice
     */
    @Action(ResetState)
    resetState(context: StateContext<InputModel>): void {
        context.setState(defaultState);
    }

    /**
     * Updates the input store with new values
     * @param context passes a slice of state
     * @param action object that was passed in by the action
     */
    @Action(UpdateInput)
    UpdateInput(context: StateContext<InputModel>, action: UpdateInput): void {
        const newField: InputField = {
            id: action.id,
            error: action.error,
            domOrder: action.domOrder,
        };
        const inputForm: InputForm = context.getState().forms.find((form) => form.formName === action.formName);
        // Sorts input fields by dom order before patching it to state.
        const inputFields: InputField[] = [...(inputForm ? inputForm.fields.filter((field) => field.id !== action.id) : []), newField].sort(
            (a, b) => Number(a.domOrder) - Number(b.domOrder),
        );
        context.patchState({
            forms: [
                ...context.getState().forms.filter((form) => form.formName !== action.formName),
                {
                    fields: inputFields,
                    formName: action.formName,
                },
            ],
        });
    }
}
