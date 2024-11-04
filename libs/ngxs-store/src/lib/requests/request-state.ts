import { State, createSelector, Action, StateContext } from "@ngxs/store";
import { UpdateStateAction, ExpireActions, ExpireAction, BaseAction } from "./request-actions";
import { ActionRequest, RequestStateModel } from "./request-models";
import { Observable } from "rxjs";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

@State({
    name: "Requests",
    defaults: {},
})
@Injectable()
export class RequestState {
    /**
     * Get the requests for the given action
     *
     * @param actionType The action to get the selectors for
     * @returns the selector that provides the requests
     */
    static getStateRequests(actionType: BaseAction): (state: RequestStateModel) => ActionRequest[] {
        return createSelector([RequestState], (requestState: RequestStateModel) =>
            requestState[actionType.type] ? requestState[actionType.type] : [],
        );
    }

    /**
     * Check to see if a given action exists
     *
     * @param actionType The action to get the selectors for
     * @param action The action to check to see if it exists
     * @returns selector for if the action exists
     */
    static doesRequestExist(actionType: BaseAction, action: any): (state: RequestStateModel) => boolean {
        return createSelector([RequestState], (requestState: RequestStateModel) => {
            const actionRequests: ActionRequest[] = requestState[actionType.type] ? requestState[actionType.type] : [];
            return actionRequests.reduce(
                (accumulator, currentRequest) =>
                    accumulator ||
                    Object.keys(action).reduce(
                        (keyAccumulator, currentKey) => keyAccumulator && currentRequest[currentKey] === action[currentKey],
                        true,
                    ),
                false,
            );
        });
    }

    /**
     * Resets the current state
     *
     * @param context current state
     */
    @Action(ResetState)
    resetState(context: StateContext<RequestStateModel>): void {
        context.setState({});
    }

    /**
     * Update the request state with the latest request
     *
     * @param context current state
     * @param param1 update action to cache the request
     */
    @Action(UpdateStateAction)
    updateStateAction(context: StateContext<RequestStateModel>, { actionType, action }: UpdateStateAction): void {
        const actionRequests: ActionRequest[] = context.getState()[actionType.type] ? context.getState()[actionType.type] : [];
        context.patchState({
            [actionType.type]: [
                ...actionRequests.filter(
                    (request) =>
                        !Object.keys(request)
                            .filter((key) => key !== "requestDate")
                            .reduce((accumulator, currentKey) => accumulator && request[currentKey] === action[currentKey], true),
                ),
                { requestDate: new Date(), ...action },
            ],
        });
    }

    /**
     * Remove the given action from the state
     *
     * @param context current state
     * @param param1 the expire action containing the action to remove
     * @returns the action stream from dispatching the action
     */
    @Action(ExpireAction)
    expireAction(context: StateContext<RequestStateModel>, { actionType, action }: ExpireAction): Observable<void> {
        return context.dispatch(
            new ExpireActions(
                (anonAction: any) =>
                    anonAction &&
                    Object.keys(action).reduce(
                        (accumulator, currentKey) => accumulator && action[currentKey] === anonAction[currentKey],
                        true,
                    ),
                actionType,
            ),
        );
    }

    /**
     * Remove the actions that match expireMatching predicate
     *
     * @param context current state
     * @param param1 the expire action containing the types of actions to remove
     */
    @Action(ExpireActions)
    expireActions(context: StateContext<RequestStateModel>, { expireMatching, actionType }: ExpireActions): void {
        if (actionType && context.getState()[actionType.type]) {
            context.patchState({
                [actionType.type]: [...context.getState()[actionType.type].filter((request) => expireMatching(request))],
            });
        } else if (!actionType) {
            const updatedState: RequestStateModel = { ...context.getState() };
            Object.keys(context.getState()).forEach((key) =>
                context.patchState({
                    [key]: context.getState()[key].filter((request) => expireMatching(request)),
                }),
            );
        }
    }
}
