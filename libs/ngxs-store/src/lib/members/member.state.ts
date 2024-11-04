import { tap } from "rxjs/operators";
import { State, Action, StateContext } from "@ngxs/store";
import { GetMember, UpdateMember } from "./member.actions";
import { Observable } from "rxjs";
import { MemberService } from "@empowered/api";
import { Gender, MemberProfile } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: MemberProfile[] = [
    {
        id: null,
        name: {
            firstName: null,
            middleName: null,
            lastName: null,
            suffix: null,
            maidenName: null,
            nickName: null,
        },
        birthDate: null,
        gender: Gender.UNKNOWN,
        profile: null,
        address: null,
        workInformation: null,
        ssn: null,
        hireDate: null,
        employeeId: null,
        organizationId: null,
        verificationInformation: {
            zipCode: null,
            verifiedEmail: null,
            verifiedPhone: null,
        },
    },
];

@State<MemberProfile[]>({
    name: "membersNew",
    defaults: defaultState,
})
@Injectable()
export class MemberState {
    constructor(private member: MemberService) {}

    @Action(ResetState)
    resetState(context: StateContext<MemberProfile[]>): void {
        context.setState(defaultState);
    }

    @Action(GetMember)
    GetMember(
        ctx: StateContext<MemberProfile[]>,
        { memberId, fullProfile, mpGroup }: GetMember,
    ): Observable<HttpResponse<MemberProfile>> | undefined {
        const state = ctx.getState();
        const loadedMember = state.find((loaded) => loaded.id === memberId);
        if (!loadedMember) {
            return this.member.getMember(memberId, fullProfile, mpGroup).pipe(
                tap((profile) => {
                    ctx.setState([...state, profile.body]);
                }),
            );
        }
        return undefined;
    }

    @Action(UpdateMember)
    UpdateMember(ctx: StateContext<MemberProfile[]>, { addMemberModel, MpGroup, stateMemberId }: UpdateMember): Observable<MemberProfile> {
        const state = ctx.getState();
        return this.member.updateMember(addMemberModel, MpGroup, stateMemberId).pipe(
            tap((profile) => {
                const updateIndex = state.findIndex((toUpdate) => toUpdate.id === addMemberModel.id);
                state[updateIndex] = addMemberModel;
                ctx.setState(state);
            }),
        );
    }
}
