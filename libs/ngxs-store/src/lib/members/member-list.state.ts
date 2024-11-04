import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { MemberService, SearchMembers } from "@empowered/api";
import { MemberListItem } from "@empowered/constants";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { LoadMembers } from "./member-list.actions";
import { MembersListModel } from "./member-list.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: MembersListModel = {
    list: [],
    fullResponse: null,
    activeCount: null,
    activeMemberId: null,
    errorMessage: null,
};

@State<MembersListModel>({
    name: "members",
    defaults: defaultState,
})
@Injectable()
export class MemberListState {
    constructor(private memberService: MemberService) {}

    @Selector()
    static membersList(state: MembersListModel): MemberListItem[] {
        return [...state.list];
    }
    @Selector()
    static fullMemberListResponse(state: MembersListModel): SearchMembers {
        return state.fullResponse;
    }
    @Selector()
    static activeCount(state: MembersListModel): string {
        return state.activeCount;
    }

    @Action(ResetState)
    resetState(context: StateContext<MembersListModel>): void {
        context.setState(defaultState);
    }
    /**
     * method to load all members for an account with active member count
     * @param context context of MemberList state model
     * @param payload mpGroup and other search params included in payload
     * @returns SearchMembers array
     */
    @Action(LoadMembers)
    loadMembers(context: StateContext<MembersListModel>, payload: number): Observable<void | SearchMembers | HttpResponse<SearchMembers>> {
        return this.memberService.searchMembersWithActiveCount(payload).pipe(
            tap((response) => {
                const state = context.getState();
                context.setState({
                    ...state,
                    list: response.body.content,
                    fullResponse: response.body,
                    activeCount: response.headers.get("Active-Count"),
                });
            }),
            catchError((error: HttpErrorResponse) => {
                switch (error.status) {
                    case 400: {
                        context.patchState({
                            errorMessage: `members/searchMembers: ${error.status}`,
                        });
                        break;
                    }
                    default: {
                        context.patchState({ errorMessage: "members/searchMembers: An error occured" });
                    }
                }
                return of(null);
            }),
        );
    }
}
