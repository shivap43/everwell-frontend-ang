import { State, Selector, Action, StateContext } from "@ngxs/store";
import { MemberModel } from "./member.model";
import { AddMpGroup, AddMemberId, AddBeneficiaryValidators } from "./member.action";
import { StaticService } from "@empowered/api";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: MemberModel = {
    mpGroup: null,
    memberId: null,
    configurations: "",
};

@State<MemberModel>({
    name: "Member",
    defaults: defaultState,
})
@Injectable()
export class MemberBeneficiary {
    constructor(private staticService: StaticService) {}
    @Selector()
    static getMpGroup(state: MemberModel): number {
        return state.mpGroup;
    }
    @Selector()
    static getMemberId(state: MemberModel): number {
        return state.memberId;
    }

    @Action(ResetState)
    resetState(context: StateContext<MemberModel>): void {
        context.setState(defaultState);
    }

    @Action(AddMpGroup)
    AddMpGroup({ patchState }: StateContext<MemberModel>, { mpGroup }: AddMpGroup): void {
        patchState({
            mpGroup: mpGroup,
        });
    }
    @Action(AddMemberId)
    AddMemberId({ patchState }: StateContext<MemberModel>, { memberId }: AddMemberId): void {
        patchState({
            memberId: memberId,
        });
    }
    @Action(AddBeneficiaryValidators)
    AddBeneficiaryValidators({ patchState }: StateContext<MemberModel>, { payload }: AddBeneficiaryValidators): void {
        patchState({
            configurations: { payload: payload },
        });
    }
}
