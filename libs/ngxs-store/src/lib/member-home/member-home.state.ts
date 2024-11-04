import { Action, Selector, State, StateContext } from "@ngxs/store";
import { MemberHomeModel } from "./member-home.model";
import { SetHeaderObject } from "./member-home.action";
import { Injectable } from "@angular/core";
import { HeaderObject } from "@empowered/constants";
import { ResetState } from "@empowered/user/state/actions";

const defaultState: MemberHomeModel = {
    headerObject: { title: "" },
};

@State<MemberHomeModel>({
    name: "MemberHomeState",
    defaults: defaultState,
})
@Injectable()
export class MemberHomeState {
    constructor() {}

    @Selector()
    static GetHeaderObject(state: MemberHomeModel): HeaderObject {
        return state.headerObject;
    }

    @Action(ResetState)
    resetState(context: StateContext<MemberHomeModel>): void {
        context.setState(defaultState);
    }

    @Action(SetHeaderObject)
    SetHeaderObject({ patchState }: StateContext<MemberHomeModel>, { headerObject }: SetHeaderObject): void {
        patchState({
            headerObject: headerObject,
        });
    }
}
