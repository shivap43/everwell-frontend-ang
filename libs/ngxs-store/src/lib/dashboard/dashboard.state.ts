import { AddAccountInfo, HasPermissionToAccount } from "./dashboard.actions";
import { State, Action, StateContext, Selector } from "@ngxs/store";
import { Account, Permission } from "./dashboard.model";
import { AccountDetails, Situs } from "@empowered/api";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";
import { PartnerAccountType } from "@empowered/constants";

const defaultState: Account = {
    mpGroupId: null,
    accountInfo: null,
};

@State<Account>({
    name: "accountInfo",
    defaults: defaultState,
})
@Injectable()
export class AccountInfoState {
    constructor() {}
    @Selector()
    static getAccountInfo(state: Account): AccountDetails {
        return state.accountInfo;
    }

    @Selector()
    static getPartnerAccountType(state: Account): PartnerAccountType {
        return state.accountInfo.partnerAccountType;
    }

    @Selector()
    static getAccountSitusInfo(state: Account): Situs {
        return state.accountInfo.situs;
    }

    @Selector()
    static getMpGroupId(state: Account): string {
        return state.mpGroupId;
    }

    /**
     * Selector to check if the user has permission to account from store
     * @param state variable of type Permission State
     * @return boolean whether the user has permission or not
     */
    @Selector()
    static getPermissionToAccount(state: Permission): boolean {
        return state.hasPermission;
    }

    /**
     * Selector to get the value of group stored from account permission router guard from store
     * @param state variable of type Permission State
     * @return the group id
     */
    @Selector()
    static getGroupId(state: Permission): string {
        return state.groupId;
    }

    @Action(ResetState)
    resetState(context: StateContext<Account>): void {
        context.setState(defaultState);
    }

    @Action(AddAccountInfo)
    add(context: StateContext<Account>, { payload }: any): void {
        const state = context.getState();
        context.setState({
            ...state,
            accountInfo: payload.accountInfo,
            mpGroupId: payload.mpGroupId,
        });
    }

    /**
     * This method fetch application data from api and updates applications and cartItems.
     * @param param1 used to get state and set values to the state
     * @param param2 contains information of permission and groupId
     */
    @Action(HasPermissionToAccount)
    hasPermission(context: StateContext<Permission>, { payload }: HasPermissionToAccount): void {
        const state = context.getState();
        context.setState({
            ...state,
            hasPermission: payload.hasPermission,
            groupId: payload.groupId,
        });
    }
}
