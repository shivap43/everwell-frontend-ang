import { PathStateModel, Parameter } from "./path.model";
import { Observable } from "rxjs";
import { AccountService } from "@empowered/api";
import { AddPathParameter, ResetToParameters } from "./path.actions";
import { StateContext } from "@ngxs/store/src/symbols";
import { State, Action, createSelector } from "@ngxs/store";
import { tap } from "rxjs/operators";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

/**
 * While refactoring, map duplicate names for the same variable to the correct name
 */
export const parameterNameMap: Map<string, string> = new Map()
    .set("accountId", "mpGroupId")
    .set("accountName", "mpGroupId")
    .set("prospectId", "mpGroupId");

const defaultState: PathStateModel = {
    parameters: [],
};

/**
 * Global store for keeping track of the latest emitted dereferenced path ids.
 * @see route.interceptor.service.ts for the observable that is dispatching the actions
 */
@State<PathStateModel>({
    name: "path",
    defaults: defaultState,
})
@Injectable()
export class PathState {
    /**
     * Map the path variable name to a function to create the dereferenced object
     */
    valueProducers: Map<string, (id: string) => Observable<any>> = new Map().set("mpGroupId", (id) => this.accountService.getAccount(id));

    constructor(private accountService: AccountService) {}

    /**
     * Selector to get the latest value of a path parameter
     * @param name The name of the parameter in the path, double check the renaming map above in case it needs to be changed
     * ex: accountId => mpGroupId
     */
    static getPathParameter(name: string): (state: PathStateModel) => any {
        return createSelector([PathState], (state: PathStateModel) => {
            const value: Parameter = state.parameters.find(({ param }) => param === name);
            return value ? value.value : undefined;
        });
    }

    @Action(ResetState)
    reset(context: StateContext<PathStateModel>): void {
        context.setState(defaultState);
    }

    /**
     * Reset the current parameter set to a new set (represents items no longer being in the path)
     *
     * @param context State
     * @param param1 The dispatched action with the new parameters
     */
    @Action(ResetToParameters)
    resetToParameters(context: StateContext<PathStateModel>, { parameters }: ResetToParameters): Observable<void> | void {
        // Translate the keys if a translation exists
        const translatedNewParameters = {};
        Object.keys(parameters).forEach((key) => {
            const translatedKey: string = parameterNameMap.get(key);
            translatedNewParameters[translatedKey ? translatedKey : key] = parameters[key];
        });

        const parameterActions: AddPathParameter[] = [];
        // For each parameter in context if it is in the new list re-dispatch, otherwise delete the parameter from the state
        [...context.getState().parameters].forEach((parameter) => {
            if (translatedNewParameters[parameter.param]) {
                parameterActions.push(new AddPathParameter(parameter.param, translatedNewParameters[parameter.param]));
                delete translatedNewParameters[parameter.param];
            } else {
                context.patchState({
                    parameters: context.getState().parameters.filter((param) => param.param !== parameter.param),
                });
            }
        });
        Object.keys(translatedNewParameters).forEach((parameter) =>
            parameterActions.push(new AddPathParameter(parameter, translatedNewParameters[parameter])),
        );
        // If there are actions to dispatch, do it; otherwise void
        if (parameterActions.length > 0) {
            return context.dispatch(parameterActions);
        }
    }

    /**
     * Dereferences the path id and finds the appropriate object based on its name
     * @param context State
     * @param param1 The action dispatched
     */
    @Action(AddPathParameter)
    addPathParameter(context: StateContext<PathStateModel>, { name, id, value }: AddPathParameter): Observable<any> | void {
        let paramName = parameterNameMap.get(name);
        paramName = paramName == null ? name : paramName;

        // Allow value override
        if (value != null) {
            context.patchState({
                parameters: [
                    ...context.getState().parameters.filter(({ param }) => param !== paramName),
                    { param: paramName, value: value },
                ],
            });
            return;
        }

        const producerFunction: (id: string) => Observable<any> = this.valueProducers.get(paramName);
        if (producerFunction != null) {
            return producerFunction(id).pipe(
                tap((resp) => {
                    context.patchState({
                        parameters: [
                            ...context.getState().parameters.filter(({ param }) => param !== paramName),
                            { param: paramName, value: resp },
                        ],
                    });
                }),
            );
        }
    }
}
