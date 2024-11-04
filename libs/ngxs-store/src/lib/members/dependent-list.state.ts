import { HttpErrorResponse } from "@angular/common/http";
import { MemberService, StaticService } from "@empowered/api";
import { Relations, MemberDependent } from "@empowered/constants";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import {
    LoadMemberDependents,
    SetMemberGroupId,
    SetDependentsMemberId,
    SetDependentRelations,
    SetActiveDependentId,
} from "./dependent-list.actions";
import { MemberDependentListModel } from "./dependent-list.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: MemberDependentListModel = {
    list: [],
    memberId: null,
    groupId: null,
    activeDependentId: null,
    errorMessage: null,
    relations: [],
};

@State<MemberDependentListModel>({
    name: "memberdependents",
    defaults: defaultState,
})
@Injectable()
export class DependentListState {
    validationRegex: any;
    constructor(private memberService: MemberService, private staticService: StaticService) {}

    @Selector()
    static memberDependentsList(state: MemberDependentListModel): MemberDependent[] {
        return [...state.list];
    }

    @Selector()
    static groupId(state: MemberDependentListModel): number {
        return state.groupId;
    }

    @Selector()
    static memberId(state: MemberDependentListModel): number {
        return state.memberId;
    }

    @Selector()
    static activeDependentId(state: MemberDependentListModel): number {
        return state.activeDependentId;
    }

    @Selector()
    static relations(state: MemberDependentListModel, id: number): Relations[] {
        return state.relations;
    }

    @Action(ResetState)
    resetState(context: StateContext<MemberDependentListModel>): void {
        context.setState(defaultState);
    }

    @Action(SetMemberGroupId)
    setGroupId({ patchState }: StateContext<MemberDependentListModel>, { groupId }: SetMemberGroupId): void {
        patchState({
            groupId: groupId,
        });
    }

    @Action(SetDependentsMemberId)
    setMemberId({ patchState }: StateContext<MemberDependentListModel>, { memberId }: SetDependentsMemberId): void {
        patchState({
            memberId: memberId,
        });
    }

    @Action(SetActiveDependentId)
    SetActiveDependentId({ patchState }: StateContext<MemberDependentListModel>, { activeDependentId }: SetActiveDependentId): void {
        patchState({
            activeDependentId: activeDependentId,
        });
    }

    @Action(SetDependentRelations)
    setRelations({ patchState }: StateContext<MemberDependentListModel>, { relations }: SetDependentRelations): void {
        patchState({
            relations: relations,
        });
    }

    @Action(LoadMemberDependents)
    loadMemberDependents(context: StateContext<MemberDependentListModel>, property: any): Observable<MemberDependent[] | void> {
        return this.memberService.getMemberDependents(property.memberId, property.fullProfile, property.MpGroup).pipe(
            map((Response) => Response),
            tap<MemberDependent[]>((memberdependents) => {
                const state = context.getState();
                context.setState({
                    ...state,
                    list: memberdependents,
                });
            }),
            catchError((error: HttpErrorResponse) => {
                switch (error.status) {
                    case 400: {
                        context.patchState({
                            errorMessage: `members/dependents: ${error.status}`,
                        });
                        break;
                    }
                    default: {
                        context.patchState({ errorMessage: "members/dependents: An error occured" });
                    }
                }
                return of(null);
            }),
        );
    }
}
