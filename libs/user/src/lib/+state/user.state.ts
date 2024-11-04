import { Credential as User } from "@empowered/constants";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { SetUserCredential } from "./user.actions";
import { ResetState } from "./user.actions";
import { Injectable } from "@angular/core";

@State<User>({
    name: "user",
})
@Injectable()
export class UserState {
    @Selector()
    static getGroupID({ getState }: StateContext<User>): number | undefined {
        return getState().groupId;
    }
    @Action(ResetState)
    resetState(context: StateContext<User>): void {
        context.setState({});
    }

    @Action(SetUserCredential)
    loadUser(ctx: StateContext<User>, { credential }: SetUserCredential): void {
        ctx.setState(credential);
    }
}
