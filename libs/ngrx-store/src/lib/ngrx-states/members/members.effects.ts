import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MemberService, AccountService, AflacService } from "@empowered/api";
import {
    CarrierId,
    Salary,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
} from "@empowered/constants";
import { getSerializableError } from "../../ngrx.store.helpers";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";

import * as MembersActions from "./members.actions";
import { getMemberProfileEntityId } from "./members.state";

@Injectable()
export class MembersEffects {
    loadMemberProfile$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadMemberProfile),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.memberService.getMember(memberId, true, String(mpGroup)).pipe(
                        map((res: HttpResponse<MemberProfile>) =>
                            MembersActions.loadMemberProfileSuccess({
                                memberProfileEntity: {
                                    identifiers: { memberId, mpGroup },
                                    // TODO [Types]: Services shouldn't return HttpResponse
                                    // since body of response is always nullable, but we expect them not to be due to api contract
                                    data: res.body as MemberProfile,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadMemberProfileFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadSalaries$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadSalaries),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.memberService.getSalaries(memberId, false, String(mpGroup)).pipe(
                        map((salaries: Salary[]) =>
                            MembersActions.loadSalariesSuccess({
                                salariesEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: salaries,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadSalariesFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadMemberDependents$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadMemberDependents),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.memberService.getMemberDependents(memberId, true, mpGroup).pipe(
                        map((dependents: MemberDependent[]) =>
                            MembersActions.loadMemberDependentsSuccess({
                                memberDependentsEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: dependents,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadMemberDependentsFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadRiskClasses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadRiskClasses),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    combineLatest([
                        this.memberService.getMemberCarrierRiskClasses(memberId, undefined, String(mpGroup)),
                        this.memberService.getMemberCarrierRiskClasses(memberId, CarrierId.AFLAC, String(mpGroup)),
                    ]).pipe(
                        map(([memberRiskClasses, aflacCarrierRiskClasses]) =>
                            MembersActions.loadRiskClassesSuccess({
                                riskClassesEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: { memberRiskClasses, aflacCarrierRiskClasses },
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadRiskClassesFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadQualifyingEvents$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadQualifyingEvents),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.memberService.getMemberQualifyingEvents(memberId, mpGroup).pipe(
                        map((qualifyEvents: MemberQualifyingEvent[]) =>
                            MembersActions.loadQualifyingEventsSuccess({
                                qualifyingEventsEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: qualifyEvents,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadQualifyingEventsFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadMemberContacts$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadMemberContacts),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.memberService.getMemberContacts(memberId, String(mpGroup)).pipe(
                        map((contacts: MemberContact[]) =>
                            MembersActions.loadMemberContactsSuccess({
                                memberContactsEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: contacts,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadMemberContactsFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadMemberFlexDollars$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadMemberFlexDollars),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.accountService.getFlexDollarsOfMember(memberId, String(mpGroup)).pipe(
                        map((memberFlexDollars: MemberFlexDollar[]) =>
                            MembersActions.loadMemberFlexDollarsSuccess({
                                memberFlexDollarsEntity: {
                                    identifiers: { memberId, mpGroup },
                                    data: memberFlexDollars,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadMemberFlexDollarsFailure({
                        error: {
                            identifiers: { memberId, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadCrossBorderRules$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MembersActions.loadCrossBorderRules),
            fetch({
                id: (identifiers) => getMemberProfileEntityId(identifiers),
                run: ({ mpGroup, memberId }) =>
                    this.aflacService.getCrossBorderRules(mpGroup, memberId).pipe(
                        map((crossBorderRules) =>
                            MembersActions.loadCrossBorderRulesSuccess({
                                crossBorderRulesEntity: {
                                    identifiers: { mpGroup, memberId },
                                    data: crossBorderRules,
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup, memberId }, httpErrorResponse: HttpErrorResponse) =>
                    MembersActions.loadCrossBorderRulesFailure({
                        error: {
                            identifiers: { mpGroup, memberId },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly aflacService: AflacService,
    ) {}
}
