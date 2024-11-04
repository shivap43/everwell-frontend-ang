import { State, Action, StateContext, Selector } from "@ngxs/store";
import { CheckForm } from "./form.action";
import { FormModel } from "./form.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState = {
    formName: null,
    failedAttempts: 0,
};

@State<FormModel>({
    name: "forms",
    defaults: defaultState,
})
@Injectable()
export class FormState {
    /**
     * returns a slice of the global store containing forms state
     * @param state the FormModel state slice
     * @returns forms state
     */
    @Selector()
    static formState(state: FormModel): FormModel {
        return state;
    }

    /**
     * An action to return forms state back to its default
     * @param context the FormModel state slice
     */
    @Action(ResetState)
    resetState(context: StateContext<FormModel>): void {
        context.setState(defaultState);
    }

    /**
     * Updates the Form Store and increments the failedAttempts
     * @param context the form store
     * @param action object passed by the action
     */
    @Action(CheckForm)
    CheckForm(context: StateContext<FormModel>, action: CheckForm): void {
        context.setState({
            formName: action.formName,
            failedAttempts: action.formName === context.getState().formName ? context.getState().failedAttempts + 1 : 0,
        });
    }
}
