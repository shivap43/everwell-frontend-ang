import { TestBed } from "@angular/core/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Observable, of, throwError } from "rxjs";
import {
    AccountList,
    AccountListService,
    AccountProfileService,
    AccountService,
    AdminService,
    AflacService,
    ExceptionsService,
    FilterParameters,
} from "@empowered/api";
import {
    Account,
    GroupAttributeName,
    ProductId,
    PayFrequency,
    CarrierId,
    RiskClass,
    Exceptions,
    ExceptionType,
    ApiError,
    Admin,
} from "@empowered/constants";

import * as AccountsActions from "./accounts.actions";
import { AccountsEffects } from "./accounts.effects";
import { GroupAttributeRecord } from "./accounts.model";

const mockAccountListService = {
    listAccounts: (filterParam: FilterParameters) => of([{ id: 222, name: "some account list name" } as AccountList]),
    getAccount: (mpGroup: string) => of({ id: 222, name: "some account name" } as Account),
} as AccountListService;

const mockAccountService = {
    getPayFrequencies: (mpGroup: string) => of([{ name: "some pay frequency" }]),
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) =>
        of([
            {
                id: 989898,
                attribute: "some attribute",
                value: "some group attribute value",
            },
        ]),
} as AccountService;

const mockAccountProfileService = {
    getAccountCarrierRiskClasses: (carrierId: number, mpGroup: number) =>
        of(carrierId ? [{ name: "some-risk-class-name" }, { name: "some-other-risk-class-name" }] : [{ name: "some-risk-class-name" }]),
} as AccountProfileService;

const mockAflacService = {
    getDualPeoSelection: (mpGroup: string, carrierId?: number) =>
        of(
            carrierId
                ? {
                    [ProductId.ACCIDENT]: [1, 2, 3],
                    [ProductId.SHORT_TERM_DISABILITY]: [4, 5, 6],
                }
                : {
                    [ProductId.ACCIDENT]: [2],
                    [ProductId.SHORT_TERM_DISABILITY]: [4],
                },
        ),
} as AflacService;

const mockExceptionsService = {
    getExceptions: (mpGroup: string, exceptionType: ExceptionType) => of([{ type: "some exception type" } as Exceptions]),
} as ExceptionsService;

const mockAdminService = {
    getAccountAdmins: (mpGroup: number, expand: "roleId,reportsToId") => of([{ id: 1 } as Admin]),
} as AdminService;

describe("AccountsEffects", () => {
    let actions$: Observable<Action>;
    let effects: AccountsEffects;
    let accountListService: AccountListService;
    let accountService: AccountService;
    let accountProfileService: AccountProfileService;
    let aflacService: AflacService;
    let exceptionsService: ExceptionsService;
    let adminService: AdminService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NxModule.forRoot()],
            providers: [
                { provide: AccountListService, useValue: mockAccountListService },
                { provide: AccountService, useValue: mockAccountService },
                { provide: AccountProfileService, useValue: mockAccountProfileService },
                { provide: AflacService, useValue: mockAflacService },
                { provide: ExceptionsService, useValue: mockExceptionsService },
                { provide: AdminService, useValue: mockAdminService },
                AccountsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
            ],
        });

        effects = TestBed.inject(AccountsEffects);
        accountListService = TestBed.inject(AccountListService);
        accountService = TestBed.inject(AccountService);
        accountProfileService = TestBed.inject(AccountProfileService);
        aflacService = TestBed.inject(AflacService);
        exceptionsService = TestBed.inject(ExceptionsService);
        adminService = TestBed.inject(AdminService);
    });

    it("should be truthy", () => {
        expect(effects).toBeTruthy();
    });

    describe("loadAccount$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(AccountsActions.loadAccount({ mpGroup: 222 }));
        });

        it("should get accounts on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountListService, "getAccount");

            effects.loadAccount$.subscribe((action) => {
                expect(spy).toBeCalledWith("222");

                expect(action).toStrictEqual(
                    AccountsActions.loadAccountSuccess({
                        accountsEntity: {
                            identifiers: { mpGroup: 222 },
                            data: { id: 222, name: "some account name" } as Account,
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountListService, "getAccount").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadAccount$.subscribe((action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    AccountsActions.loadAccountFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadPayFrequencies$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(AccountsActions.loadPayFrequencies({ mpGroup: 222 }));
        });

        it("should get payFrequencies on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getPayFrequencies");

            effects.loadPayFrequencies$.subscribe((action) => {
                expect(spy).toBeCalledWith("222");

                expect(action).toStrictEqual(
                    AccountsActions.loadPayFrequenciesSuccess({
                        payFrequenciesEntity: {
                            identifiers: { mpGroup: 222 },
                            data: [{ name: "some pay frequency" } as PayFrequency],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getPayFrequencies").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadPayFrequencies$.subscribe((action) => {
                expect(spy).toBeCalledWith("222");

                expect(action).toStrictEqual(
                    AccountsActions.loadPayFrequenciesFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadGroupAttributeRecord$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                AccountsActions.loadGroupAttributeRecord({
                    mpGroup: 222,
                    groupAttributeNames: ["some attribute" as GroupAttributeName, "some other attribute" as GroupAttributeName],
                }),
            );
        });

        it("should get groupAttributeRecord on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getGroupAttributesByName");

            effects.loadGroupAttributeRecord$.subscribe((action) => {
                expect(spy).toBeCalledWith(["some attribute", "some other attribute"], 222);

                expect(action).toStrictEqual(
                    AccountsActions.loadGroupAttributeRecordSuccess({
                        groupAttributeRecordEntity: {
                            identifiers: { mpGroup: 222 },
                            data: {
                                "some attribute": {
                                    id: 989898,
                                    attribute: "some attribute",
                                    value: "some group attribute value",
                                },
                                "some other attribute": null,
                            } as GroupAttributeRecord,
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadGroupAttributeRecord$.subscribe((action) => {
                expect(spy).toBeCalledWith(["some attribute", "some other attribute"], 222);

                expect(action).toStrictEqual(
                    AccountsActions.loadGroupAttributeRecordFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
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

            actions$ = of(AccountsActions.loadRiskClasses({ mpGroup: 222 }));
        });

        it("should get AccountRiskClassesEntity on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountProfileService, "getAccountCarrierRiskClasses");

            effects.loadRiskClasses$.subscribe((action) => {
                expect(spy).toBeCalledWith(CarrierId.AFLAC, 222);

                expect(action).toStrictEqual(
                    AccountsActions.loadRiskClassesSuccess({
                        riskClassesEntity: {
                            identifiers: { mpGroup: 222 },
                            data: [{ name: "some-risk-class-name" } as RiskClass, { name: "some-other-risk-class-name" } as RiskClass],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(accountProfileService, "getAccountCarrierRiskClasses").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadRiskClasses$.subscribe((action) => {
                expect(spy).toBeCalledWith(CarrierId.AFLAC, 222);

                expect(action).toStrictEqual(
                    AccountsActions.loadRiskClassesFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("getDualPeoRiskClasses$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(AccountsActions.loadDualPeoRiskClassIdsSet({ mpGroup: 222 }));
        });

        it("should get DualPeoRiskClassIdSetsEntity on success", (done) => {
            expect.assertions(3);

            const spy = jest.spyOn(aflacService, "getDualPeoSelection");

            effects.loadDualPeoRiskClassIdsSet$.subscribe((action) => {
                expect(spy).toHaveBeenNthCalledWith(1, "222");
                expect(spy).toHaveBeenNthCalledWith(2, "222", CarrierId.AFLAC);

                expect(action).toStrictEqual(
                    AccountsActions.loadDualPeoRiskClassIdsSetSuccess({
                        dualPeoRiskClassIdsSetsEntity: {
                            identifiers: { mpGroup: 222 },
                            data: {
                                dualPeoRiskClassIds: {
                                    [ProductId.ACCIDENT]: [2],
                                    [ProductId.SHORT_TERM_DISABILITY]: [4],
                                },
                                aflacCarrierDualPeoRiskClassIds: {
                                    [ProductId.ACCIDENT]: [1, 2, 3],
                                    [ProductId.SHORT_TERM_DISABILITY]: [4, 5, 6],
                                },
                            },
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(3);

            const spy = jest.spyOn(aflacService, "getDualPeoSelection").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadDualPeoRiskClassIdsSet$.subscribe((action) => {
                expect(spy).toHaveBeenNthCalledWith(1, "222");
                expect(spy).toHaveBeenNthCalledWith(2, "222", CarrierId.AFLAC);

                expect(action).toStrictEqual(
                    AccountsActions.loadDualPeoRiskClassIdsSetFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadExceptions$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                AccountsActions.loadExceptions({
                    mpGroup: 222,
                    exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE,
                }),
            );
        });

        it("should get accounts on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(exceptionsService, "getExceptions");

            effects.loadExceptions$.subscribe((action) => {
                expect(spy).toBeCalledWith("222", ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE);

                expect(action).toStrictEqual(
                    AccountsActions.loadExceptionsSuccess({
                        exceptionsEntity: {
                            identifiers: { mpGroup: 222, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: [{ type: "some exception type" } as Exceptions],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(exceptionsService, "getExceptions").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadExceptions$.subscribe((action) => {
                expect(spy).toBeCalledWith("222", ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE);

                expect(action).toStrictEqual(
                    AccountsActions.loadExceptionsFailure({
                        error: {
                            identifiers: { mpGroup: 222, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadAccountAdmin$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                AccountsActions.loadAccountAdmins({
                    mpGroup: 222,
                }),
            );
        });

        it("should get accounts admin on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(adminService, "getAccountAdmins");

            effects.loadAccountAdmins$.subscribe((action) => {
                expect(spy).toBeCalledWith(222, "roleId,reportsToId");

                expect(action).toStrictEqual(
                    AccountsActions.loadAccountAdminsSuccess({
                        accountAdminsEntity: {
                            identifiers: { mpGroup: 222 },
                            data: [{ id: 1 } as Admin],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(adminService, "getAccountAdmins").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadAccountAdmins$.subscribe((action) => {
                expect(spy).toBeCalledWith(222, "roleId,reportsToId");

                expect(action).toStrictEqual(
                    AccountsActions.loadAccountAdminsFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });
});
