import { Action, State, StateContext, Selector } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { QualifyingEventType, MemberQualifyingEvent } from "@empowered/constants";
import { GetQualifyingEventType, SetMemberQualifyingEvent } from "./qle.action";
import { AccountService } from "@empowered/api";
import { catchError, tap } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { QualifyingEventTypeModel } from "./qle.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: QualifyingEventTypeModel = {
    eventTypes: [],
    memberQualifyingEvent: null,
};

@State<QualifyingEventTypeModel>({
    name: "qle",
    defaults: defaultState,
})
@Injectable()
export class QleState {
    constructor(private accountService: AccountService) {}

    @Selector()
    static eventTypes(state: QualifyingEventTypeModel): QualifyingEventType[] {
        return state.eventTypes;
    }

    @Selector()
    static getMemberQualifyingEvent(state: QualifyingEventTypeModel): MemberQualifyingEvent {
        return state.memberQualifyingEvent;
    }

    @Selector()
    static getEventType(state: QualifyingEventTypeModel): any {
        return (typeId: number) => state.eventTypes.filter((s) => s.id === typeId);
    }

    @Action(ResetState)
    resetState(context: StateContext<QualifyingEventTypeModel>): void {
        context.setState(defaultState);
    }

    @Action(GetQualifyingEventType)
    GetQualifyingEventType(
        context: StateContext<QualifyingEventTypeModel>,
        action: GetQualifyingEventType,
    ): Observable<QualifyingEventType[]> {
        return this.accountService.qualifyingEventTypes(action.mpGroup).pipe(
            tap((response: QualifyingEventType[]) => {
                const state = context.getState();
                context.setState({
                    ...state,
                    eventTypes: response,
                });
            }),
            catchError((error: HttpErrorResponse) => of(null)),
        );
    }

    @Action(SetMemberQualifyingEvent)
    SetMemberQualifyingEvent(context: StateContext<QualifyingEventTypeModel>, memberEvent: MemberQualifyingEvent): void {
        const state = context.getState();
        context.setState({
            ...state,
            memberQualifyingEvent: memberEvent,
        });
    }
}
