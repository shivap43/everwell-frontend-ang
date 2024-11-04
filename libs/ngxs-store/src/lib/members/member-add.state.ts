import { Member } from "./member-add.model";
import { State, Action, StateContext, Selector } from "@ngxs/store";
import { AddMemberInfo, AddMemberValidators } from "./member-add.actions";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: Member = {
    activeMemberId: null,
    configurations: [],
    memberInfo: null,
    errorMessage: null,
    mpGroupId: null,
};

@State<Member>({
    name: "MemberAdd",
    defaults: defaultState,
})
@Injectable()
export class MemberInfoState {
    constructor() {}
    @Selector()
    static getMemberInfo(state: Member): any {
        return state.memberInfo;
    }

    @Selector()
    static GetMemberId(state: Member): number {
        return +state.activeMemberId;
    }

    @Action(ResetState)
    resetState(context: StateContext<Member>): void {
        context.setState(defaultState);
    }

    @Action(AddMemberInfo)
    add(context: StateContext<Member>, { payload }: any): void {
        const state = context.getState();
        context.setState({
            ...state,
            memberInfo: payload.memberInfo,
            activeMemberId: payload.activeMemberId,
            mpGroupId: payload.mpGroupId,
        });
    }
    @Action(AddMemberValidators)
    AddMemberValidators(context: StateContext<Member>, payload: any): any {
        const state = context.getState();
        context.setState({
            ...state,
            configurations: payload,
        });
    }
}
