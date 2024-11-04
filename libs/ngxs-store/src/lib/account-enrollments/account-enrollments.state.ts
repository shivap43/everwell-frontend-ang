import { Business } from "./account-enrollments.model";
import { State, Action, StateContext, Selector } from "@ngxs/store";
import { AddEnrollments, AddValidators, SetDirect } from "./account-enrollments.actions";
import { BusinessEnrollments, BUSINESS_ENROLLMENT_TYPE } from "@empowered/api";
import { Injectable } from "@angular/core";
import { ResetState } from "@empowered/user/state/actions";

const defaultState: Business = {
    configurations: [],
    unsentEnrollments: [],
    sentEnrollments: [],
    commissionList: [],
    mpGroupId: null,
    activeMemberId: null,
    sitCodes: [],
    isDirect: false,
};

@State<Business>({
    name: "accountEnrollments",
    defaults: defaultState,
})
@Injectable()
export class BusinessState {
    constructor() {}
    @Selector()
    static getBusiness(state: Business): BusinessEnrollments[] {
        return [...state.unsentEnrollments];
    }

    @Selector()
    static mpGroupId(state: Business): string {
        return state.mpGroupId;
    }

    @Selector()
    static isDirect(state: Business): boolean {
        return state.isDirect;
    }

    @Action(ResetState)
    resetState(context: StateContext<Business>): void {
        context.setState(defaultState);
    }

    @Action(AddEnrollments)
    add(context: StateContext<Business>, { payload, type }: any): void {
        const state = context.getState();
        if (type === BUSINESS_ENROLLMENT_TYPE.SENT) {
            context.setState({
                ...state,
                sentEnrollments: payload.sentEnrollments,
                mpGroupId: payload.mpGroupId,
            });
        } else {
            context.setState({
                ...state,
                unsentEnrollments: payload.unsentEnrollments,
                mpGroupId: payload.mpGroupId,
                commissionList: payload.commissionList,
                sitCodes: payload.sitCodes,
            });
        }
    }
    @Action(AddValidators)
    addValidators(context: StateContext<Business>, payload: any): any {
        const state = context.getState();
        context.setState({
            ...state,
            configurations: payload,
        });
    }
    @Action(SetDirect)
    setDirect({ patchState }: StateContext<Business>, { isDirect }: any): void {
        patchState({
            isDirect: isDirect,
        });
    }
}
