import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";
import { NgxsModule } from "@ngxs/store";
import { MemberService, AccountService, AflacService } from "@empowered/api";
import { HttpResponse } from "@angular/common/http";
import {
    CarrierId,
    RiskClass,
    Salary,
    ContactType,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
    ApiError,
} from "@empowered/constants";

import { mockCrossBorderRules } from "./members.mocks";
import * as MembersActions from "./members.actions";
import { MembersEffects } from "./members.effects";

const mockMemberService = {
    getMember: (memberId: number, full: boolean, mpGroup: string) => of({ body: { id: 123 } } as HttpResponse<MemberProfile>),
    getSalaries: (memberId: number, mask: boolean, mgGroup: string) => of([{ annualSalary: "909" } as Salary]),
    getMemberDependents: (memberId: number, full: boolean, mpGroup: number) => of([{ name: "some dependent" } as MemberDependent]),
    getMemberCarrierRiskClasses: (memberId: number, carrierId: number, mpGroup?: string) =>
        of(
            carrierId === CarrierId.AFLAC
                ? [{ name: "some-risk-class-name" }, { name: "some-other-risk-class-name" }]
                : [{ name: "some-risk-class-name" }],
        ),
    getMemberQualifyingEvents: (memberId: number, mpGroup: number) =>
        of([{ memberComment: "some member comment" } as MemberQualifyingEvent]),
    getMemberContacts: (memberID: number, mpGroup: string) => of([{ contactType: ContactType.HOME } as MemberContact]),
} as MemberService;

const mockAccountService = {
    getFlexDollarsOfMember: (memberID: number, mpGroup: string) => of([{ amount: 311 } as MemberFlexDollar]),
} as AccountService;

const mockAflacService = {
    getCrossBorderRules: (mpGroup: number, memberId: number) => of(mockCrossBorderRules),
} as AflacService;

describe("MembersEffects", () => {
    let actions$: Observable<Action>;
    let effects: MembersEffects;
    let memberService: MemberService;
    let accountService: AccountService;
    let aflacService: AflacService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                NxModule.forRoot(),
                HttpClientTestingModule,
                NgxsModule.forRoot([]), // import real module without state
            ],
            providers: [
                MembersEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                { provide: AflacService, useValue: mockAflacService },
            ],
        });

        effects = TestBed.inject(MembersEffects);
        memberService = TestBed.inject(MemberService);
        accountService = TestBed.inject(AccountService);
        aflacService = TestBed.inject(AflacService);
    });

    describe("loadMemberProfile$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadMemberProfile({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberProfile array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMember");

            effects.loadMemberProfile$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, true, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberProfileSuccess({
                        memberProfileEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { id: 123 } as MemberProfile,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMember").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadMemberProfile$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, true, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberProfileFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadSalaries$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadSalaries({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberProfile array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getSalaries");

            effects.loadSalaries$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, false, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadSalariesSuccess({
                        salariesEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: [{ annualSalary: "909" } as Salary],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getSalaries").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadSalaries$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, false, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadSalariesFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadMemberDependents$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadMemberDependents({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberProfile array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberDependents");

            effects.loadMemberDependents$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, true, 888);

                expect(action).toStrictEqual(
                    MembersActions.loadMemberDependentsSuccess({
                        memberDependentsEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: [{ name: "some dependent" } as MemberDependent],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberDependents").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadMemberDependents$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, true, 888);

                expect(action).toStrictEqual(
                    MembersActions.loadMemberDependentsFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadRiskClasses$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadRiskClasses({ mpGroup: 888, memberId: 123 }));
        });

        it("should get AccountRiskClassesEntity on success", (done) => {
            expect.assertions(3);

            const spy = jest.spyOn(memberService, "getMemberCarrierRiskClasses");

            effects.loadRiskClasses$.subscribe((action) => {
                expect(spy).toHaveBeenNthCalledWith(1, 123, undefined, "888");
                expect(spy).toHaveBeenNthCalledWith(2, 123, CarrierId.AFLAC, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadRiskClassesSuccess({
                        riskClassesEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: {
                                memberRiskClasses: [{ name: "some-risk-class-name" } as RiskClass],
                                aflacCarrierRiskClasses: [
                                    { name: "some-risk-class-name" } as RiskClass,
                                    { name: "some-other-risk-class-name" } as RiskClass,
                                ],
                            },
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(3);

            const spy = jest.spyOn(memberService, "getMemberCarrierRiskClasses").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadRiskClasses$.subscribe((action) => {
                expect(spy).toHaveBeenNthCalledWith(1, 123, undefined, "888");
                expect(spy).toHaveBeenNthCalledWith(2, 123, CarrierId.AFLAC, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadRiskClassesFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadQualifyingEvents$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadQualifyingEvents({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberProfile array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberQualifyingEvents");

            effects.loadQualifyingEvents$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 888);

                expect(action).toStrictEqual(
                    MembersActions.loadQualifyingEventsSuccess({
                        qualifyingEventsEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: [{ memberComment: "some member comment" } as MemberQualifyingEvent],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberQualifyingEvents").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadQualifyingEvents$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 888);

                expect(action).toStrictEqual(
                    MembersActions.loadQualifyingEventsFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadMemberContacts$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadMemberContacts({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberContacts array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberContacts");

            effects.loadMemberContacts$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberContactsSuccess({
                        memberContactsEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: [{ contactType: ContactType.HOME } as MemberContact],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(memberService, "getMemberContacts").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadMemberContacts$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberContactsFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadMemberFlexDollars$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadMemberFlexDollars({ mpGroup: 888, memberId: 123 }));
        });

        it("should get MemberContacts array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getFlexDollarsOfMember");

            effects.loadMemberFlexDollars$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberFlexDollarsSuccess({
                        memberFlexDollarsEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: [{ amount: 311 } as MemberFlexDollar],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getFlexDollarsOfMember").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadMemberFlexDollars$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, "888");

                expect(action).toStrictEqual(
                    MembersActions.loadMemberFlexDollarsFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadCrossBorderRules$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(MembersActions.loadCrossBorderRules({ mpGroup: 888, memberId: 123 }));
        });

        it("should get the CrossBorderRules on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(MembersActions, "loadCrossBorderRulesSuccess");

            effects.loadCrossBorderRules$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    MembersActions.loadCrossBorderRulesSuccess({
                        crossBorderRulesEntity: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: mockCrossBorderRules,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(aflacService, "getCrossBorderRules").mockImplementation(() => {
                throw {
                    error: { message: "some error message" },
                };
            });

            effects.loadCrossBorderRules$.subscribe((action: Action) => {
                expect(spy).toBeCalledWith(888, 123);

                expect(action).toStrictEqual(
                    MembersActions.loadCrossBorderRulesFailure({
                        error: {
                            identifiers: { mpGroup: 888, memberId: 123 },
                            data: { message: "some error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });
});
