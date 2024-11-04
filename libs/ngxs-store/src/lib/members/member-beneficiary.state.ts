import { State, Selector, Action, StateContext } from "@ngxs/store";
import { MemberBeneficiaryListModel } from "./member-beneficiary.model";
import { MemberBeneficiary } from "@empowered/constants";
import {
    SetBeneficiariesMemberGroupId,
    SetBeneficiariesMemberId,
    SetBeneficiaryId,
    AddMemberBeneficiaryValidators,
} from "./member-beneficiary.actions";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: MemberBeneficiaryListModel = {
    list: [],
    memberId: null,
    groupId: null,
    memberBeneficiaryId: null,
    configurations: null,
};

@State<MemberBeneficiaryListModel>({
    name: "memberbeneficiarylistmodel",
    defaults: defaultState,
})
@Injectable()
export class MemberBeneficiaryListState {
    constructor() {}

    @Selector()
    static memberBeneficiaryList(state: MemberBeneficiaryListModel): MemberBeneficiary[] {
        return [...state.list];
    }

    @Selector()
    static groupId(state: MemberBeneficiaryListModel): number {
        return state.groupId;
    }
    @Selector()
    static memberId(state: MemberBeneficiaryListModel): number {
        return state.memberId;
    }
    @Selector()
    static memberBeneficiaryId(state: MemberBeneficiaryListModel): number {
        return state.memberBeneficiaryId;
    }

    @Action(ResetState)
    resetState(context: StateContext<MemberBeneficiaryListModel>): void {
        context.setState(defaultState);
    }

    @Action(SetBeneficiariesMemberGroupId)
    setGroupId({ patchState }: StateContext<MemberBeneficiaryListModel>, { groupId }: SetBeneficiariesMemberGroupId): void {
        patchState({
            groupId: groupId,
        });
    }

    @Action(SetBeneficiariesMemberId)
    SetBeneficiariesMemberId({ patchState }: StateContext<MemberBeneficiaryListModel>, { memberId }: SetBeneficiariesMemberId): void {
        patchState({
            memberId: memberId,
        });
    }
    @Action(SetBeneficiaryId)
    setSetBeneficiaryId({ patchState }: StateContext<MemberBeneficiaryListModel>, { memberBeneficiaryId }: SetBeneficiaryId): void {
        patchState({
            memberBeneficiaryId: memberBeneficiaryId,
        });
    }
    @Action(AddMemberBeneficiaryValidators)
    addValidators(context: StateContext<MemberBeneficiaryListModel>, payload: any): any {
        const state = context.getState();
        context.setState({
            ...state,
            configurations: payload,
        });
    }
}
