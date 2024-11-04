import { CommissionsModel } from "./commissions.model";
import { State, Selector, Action, StateContext } from "@ngxs/store";
import { SetCommissionsStateGroupId, SetRole, SetSitus, SetCompanyCode, SetDirectData } from "./commissions.actions";
import { Situs } from "@empowered/api";
import { CompanyCode, AdminRoles } from "@empowered/constants";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: CommissionsModel = {
    groupId: null,
    role: null,
    situs: null,
    companyCode: null,
    isDirect: false,
};

@State<CommissionsModel>({
    name: "commissionsModel",
    defaults: defaultState,
})
@Injectable()
export class CommissionsState {
    constructor() {}

    @Selector()
    static groupId(state: CommissionsModel): number {
        return state.groupId;
    }
    @Selector()
    static role(state: CommissionsModel): AdminRoles {
        return state.role;
    }
    @Selector()
    static situs(state: CommissionsModel): Situs {
        return state.situs;
    }
    @Selector()
    static companyCode(state: CommissionsModel): CompanyCode {
        return state.companyCode;
    }
    @Selector()
    static isDirect(state: CommissionsModel): boolean {
        return state.isDirect;
    }

    @Action(ResetState)
    resetState(context: StateContext<CommissionsModel>): void {
        context.setState(defaultState);
    }

    @Action(SetCommissionsStateGroupId)
    setCommissionsStateGroupId({ patchState }: StateContext<CommissionsModel>, { groupId }: SetCommissionsStateGroupId): void {
        patchState({
            groupId: groupId,
        });
    }
    @Action(SetRole)
    setRole({ patchState }: StateContext<CommissionsModel>, { role }: SetRole): void {
        patchState({
            role: role,
        });
    }
    @Action(SetSitus)
    setSitus({ patchState }: StateContext<CommissionsModel>, { situs }: SetSitus): void {
        patchState({
            situs: situs,
        });
    }
    @Action(SetCompanyCode)
    SetCompanyCode({ patchState }: StateContext<CommissionsModel>, { companyCode }: SetCompanyCode): void {
        patchState({
            companyCode: companyCode,
        });
    }
    @Action(SetDirectData)
    setDirectData({ patchState }: StateContext<CommissionsModel>, { isDirect }: any): void {
        patchState({
            isDirect: isDirect,
        });
    }
}
