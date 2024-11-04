import { Action, State, StateContext, Selector } from "@ngxs/store";
import { AccountListItem } from "./account-list.model";
import { AddAccountList, AddGroup } from "./account-list.actions";
import { AccountList, SearchProducer } from "@empowered/api";
import { patch } from "@ngxs/store/operators";
import { Injectable } from "@angular/core";
import { ResetState } from "@empowered/user/state/actions";
import { SetSearchedProducer } from "../shared/shared.actions";

const defaultState: AccountListItem = {
    list: [],
    selectedGroup: undefined,
    currentProducer: undefined,
};

@State<AccountListItem>({
    name: "accounts",
    defaults: defaultState,
})
@Injectable()
export class AccountListState {
    @Selector()
    static getAccountList(state: AccountListItem): AccountList[] {
        return state.list;
    }

    @Selector()
    static getMpGroupId(state: AccountListItem): number {
        return state.selectedGroup.id;
    }

    @Selector()
    static getGroup(state: AccountListItem): AccountList {
        return state.selectedGroup;
    }
    /**
     * selector to get the searched producer
     * @param state instance of AccountListItem
     * @returns {SearchProducer} searched producer
     */
    @Selector()
    static getCurrentProducer(state: AccountListItem): SearchProducer {
        return state.currentProducer;
    }

    @Action(ResetState)
    resetState(context: StateContext<AccountListItem>): void {
        context.setState(defaultState);
    }

    @Action(AddAccountList)
    add(ctx: StateContext<AccountListItem>, action: { payload: any }): void {
        ctx.setState(
            patch({
                list: action.payload,
            }),
        );
    }

    @Action(AddGroup)
    AddGroupId(ctx: StateContext<AccountListItem>, action: { payload: any }): void {
        ctx.setState(
            patch({
                selectedGroup: action.payload,
            }),
        );
    }
    /**
     * action to dispatch the searched producer
     * @param ctx context of state to perform the action
     * @param action the payload of type SearchProducer which represents the searched producer
     */
    @Action(SetSearchedProducer)
    currentProducer(ctx: StateContext<AccountListItem>, action: { producer: SearchProducer }): void {
        ctx.setState(
            patch({
                currentProducer: action.producer,
            }),
        );
    }
}
