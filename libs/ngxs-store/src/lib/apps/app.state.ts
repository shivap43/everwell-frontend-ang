import { State, Action, StateContext } from "@ngxs/store";
import { AppStateModel } from "./app.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: AppStateModel = {};

@State<AppStateModel>({
    name: "app",
    defaults: defaultState,
})
@Injectable()
export class AppState {
    @Action(ResetState)
    resetState(context: StateContext<AppStateModel>): void {
        context.setState(defaultState);
    }
}
