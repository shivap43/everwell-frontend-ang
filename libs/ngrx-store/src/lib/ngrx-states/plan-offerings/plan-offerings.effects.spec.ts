import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import {
    ShoppingService,
    CoreService,
    EnrollmentService,
    KnockoutQuestion,
    ShoppingCartDisplayService,
    ApplicationResponseBaseType,
} from "@empowered/api";
import {
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    EnrollmentType,
    Question,
    TaxStatus,
    CoverageLevel,
    PlanOffering,
    CoverageDatesRecord,
    EnrollmentBeneficiary,
    Enrollments,
    ApplicationResponse,
    PlanOfferingPricing,
    MoreSettings,
    ApiError,
    Plan,
} from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as PlanOfferingsActions from "./plan-offerings.actions";
import { PlanOfferingsEffects } from "./plan-offerings.effects";

const mockShoppingService = {
    getPlanOfferings: (
        productOfferingId?: string,
        enrollmentMethod?: string,
        enrollmentState?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        MPGroup?: number,
        expand?: string,
        referenceDate?: string,
    ) => of([{ taxStatus: TaxStatus.POSTTAX } as PlanOffering]),
    getPlanCoverageDatesMap: (
        memberId: number,
        mpGroup: number,
        enrollmentType: EnrollmentType,
        referenceDate?: string,
    ): Observable<CoverageDatesRecord> =>
        of({
            121212: {
                defaultCoverageStartDate: "1985-01-05",
                earliestCoverageStartDate: "1985-01-30",
                latestCoverageStartDate: "1985-12-01",
                isContinuous: true,
            },
        }),
    getPlanOfferingPricing: (
        planOfferingId: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        MPGroup?: number,
        parentPlanId?: number,
        parentPlanCoverageLevelId?: number,
        baseBenefitAmount?: number,
        childAge?: number,
        coverageEffectiveDate?: string,
        riskClassId?: number,
        fromApplicationFlow: boolean = false,
        shoppingCartItemId?: number,
    ) => of([{ benefitAmount: 9000 } as PlanOfferingPricing]),
    getPlanOfferingRiders: (
        planOfferingId: string,
        MPGroup?: number,
        enrollmentMethod?: string,
        enrollmentState?: string,
        memberId?: number,
        moreSetting?: MoreSettings,
        expand?: string,
    ): Observable<PlanOffering[]> => of([{ id: Number(planOfferingId) * 100, taxStatus: TaxStatus.PRETAX } as PlanOffering]),
    getKnockoutQuestions: (planOfferingId: number, state: string, mpGroup: number, memberId?: number) =>
        of([
            {
                id: 1111,
                title: "title",
                body: "body",
                question: { text: "Question Text" } as Question,
            } as KnockoutQuestion,
        ]),
} as ShoppingService;

const mockCoreService = {
    getCoverageLevels: (planId: string, coverageLevelId?: number, fetchRetainRiders?: boolean, stateCode?: string) =>
        of([{ name: "Individual" } as CoverageLevel]),
} as CoreService;

const mockEnrollmentService = {
    getEnrollments: (memberId: number, mpGroup: number) => of([{ status: "ACTIVE", plan: { id: 1 } as Plan } as Enrollments]),
    getEnrollmentBeneficiaries: (memberId: number, enrollmentId: number, mpGroup: number) =>
        of([{ allocationType: "PRIMARY" } as EnrollmentBeneficiary]),
} as EnrollmentService;

const mockShoppingCartDisplayService = {
    getApplicationResponses: (memberId: number, itemId: number, mpGroup: number) =>
        of([
            {
                planQuestionId: 3469,
                value: ["yes"],
            },
        ]),

    saveApplicationResponse: (memberId: number, itemId: number, mpGroup: number, applicationResponse: ApplicationResponse[]) => of({}),
} as ShoppingCartDisplayService;

describe("PlanOfferingsEffects", () => {
    let actions$: Observable<Action>;
    let effects: PlanOfferingsEffects;
    let shoppingService: ShoppingService;
    let coreService: CoreService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                PlanOfferingsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: CoreService, useValue: mockCoreService },
                { provide: EnrollmentService, useValue: mockEnrollmentService },
                { provide: ShoppingCartDisplayService, useValue: mockShoppingCartDisplayService },
            ],
        });

        effects = TestBed.inject(PlanOfferingsEffects);
        shoppingService = TestBed.inject(ShoppingService);
        coreService = TestBed.inject(CoreService);
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe("loadPlanOfferings$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadPlanOfferings({
                    mpGroup: 111,
                    memberId: 333,
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    stateAbbreviation: "AZ",
                    referenceDate: "1990-09-09",
                    productOfferingIds: [1],
                }),
            );
        });

        it("should get PlanOfferings array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferings");

            effects.loadPlanOfferings$.subscribe((action) => {
                expect(spy).toBeCalledWith("1", EnrollmentMethod.FACE_TO_FACE, "AZ", {}, 333, 111, "plan.productId", "1990-09-09");

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingsSuccess({
                        planOfferingsEntity: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                                referenceDate: "1990-09-09",
                            },
                            data: [{ taxStatus: TaxStatus.POSTTAX } as PlanOffering],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferings").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadPlanOfferings$.subscribe((action) => {
                expect(spy).toBeCalledWith("1", EnrollmentMethod.FACE_TO_FACE, "AZ", {}, 333, 111, "plan.productId", "1990-09-09");

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingsFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 111,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                                referenceDate: "1990-09-09",
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadPlanOfferingRiders$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadPlanOfferingRiders({
                    planOfferingId: 555,
                    mpGroup: 111,
                    memberId: 333,
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    stateAbbreviation: "AZ",
                    coverageEffectiveDate: "1990-01-01",
                }),
            );
        });

        it("should get PlanOfferingRiders array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferingRiders");

            effects.loadPlanOfferingRiders$.subscribe((action) => {
                expect(spy).toBeCalledWith("555", 111, EnrollmentMethod.FACE_TO_FACE, "AZ", 333, "1990-01-01", {});

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingRidersSuccess({
                        planOfferingRidersEntity: {
                            identifiers: {
                                planOfferingId: 555,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: [{ id: 55500, taxStatus: TaxStatus.PRETAX } as PlanOffering],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferingRiders").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadPlanOfferingRiders$.subscribe((action) => {
                expect(spy).toBeCalledWith("555", 111, EnrollmentMethod.FACE_TO_FACE, "AZ", 333, "1990-01-01", {});

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingRidersFailure({
                        error: {
                            identifiers: {
                                planOfferingId: 555,
                                memberId: 333,
                                mpGroup: 111,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadCoverageDateRecord$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadCoverageDateRecord({
                    mpGroup: 111,
                    memberId: 333,
                    coverageDatesEnrollmentType: CoverageDatesEnrollmentType.OPEN_ENROLLMENT,
                    referenceDate: "1990-09-09",
                }),
            );
        });

        it("should get PlanOfferings array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanCoverageDatesMap");

            effects.loadCoverageDateRecord$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111, EnrollmentType.OPEN_ENROLLMENT, "1990-09-09");

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadCoverageDateRecordSuccess({
                        coverageDatesRecordEntity: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.OPEN_ENROLLMENT,
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                121212: {
                                    defaultCoverageStartDate: "1985-01-05",
                                    earliestCoverageStartDate: "1985-01-30",
                                    latestCoverageStartDate: "1985-12-01",
                                    isContinuous: true,
                                },
                            },
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanCoverageDatesMap").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadCoverageDateRecord$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111, EnrollmentType.OPEN_ENROLLMENT, "1990-09-09");

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadCoverageDateRecordFailure({
                        error: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.OPEN_ENROLLMENT,
                                referenceDate: "1990-09-09",
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadCoverageLevels$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(PlanOfferingsActions.loadCoverageLevels({ planId: 11, mpGroup: 198222, fetchRetainRiders: false }));
        });

        it("should get CoverageLevels on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(coreService, "getCoverageLevels");

            effects.loadCoverageLevels$.subscribe((action) => {
                expect(spy).toBeCalledWith("11", undefined, false, undefined, true);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadCoverageLevelsSuccess({
                        coverageLevelsEntity: {
                            identifiers: {
                                mpGroup: 198222,
                                planId: 11,
                                parentCoverageLevelId: undefined,
                                fetchRetainRiders: false,
                                stateCode: undefined,
                            },
                            data: [{ name: "Individual" } as CoverageLevel],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(coreService, "getCoverageLevels").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadCoverageLevels$.subscribe((action) => {
                expect(spy).toBeCalledWith("11", undefined, false, undefined, true);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadCoverageLevelsFailure({
                        error: {
                            identifiers: {
                                mpGroup: 198222,
                                planId: 11,
                                parentCoverageLevelId: undefined,
                                fetchRetainRiders: false,
                                stateCode: undefined,
                            },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("getKnockoutQuestions$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadKnockoutQuestions({
                    planOfferingId: 11,
                    mpGroup: 198222,
                    memberId: 222,
                    stateAbbreviation: "AL",
                }),
            );
        });

        it("should get KnockoutQuestions on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getKnockoutQuestions");

            effects.loadKnockoutQuestions$.subscribe((action) => {
                expect(spy).toBeCalledWith(11, "AL", 198222, 222);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadKnockoutQuestionsSuccess({
                        knockoutQuestionsEntity: {
                            identifiers: {
                                planOfferingId: 11,
                                mpGroup: 198222,
                                memberId: 222,
                                stateAbbreviation: "AL",
                            },
                            data: [
                                {
                                    id: 1111,
                                    title: "title",
                                    body: "body",
                                    question: { text: "Question Text" } as Question,
                                } as KnockoutQuestion,
                            ],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getKnockoutQuestions").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadKnockoutQuestions$.subscribe((action) => {
                expect(spy).toBeCalledWith(11, "AL", 198222, 222);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadKnockoutQuestionsFailure({
                        error: {
                            identifiers: {
                                planOfferingId: 11,
                                mpGroup: 198222,
                                memberId: 222,
                                stateAbbreviation: "AL",
                            },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadKnockoutResponses$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadKnockoutResponses({
                    mpGroup: 111,
                    memberId: 333,
                    cartItemIds: [1],
                }),
            );
        });

        it("should get getKnockoutResponses array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "getApplicationResponses");

            effects.loadKnockoutResponses$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadKnockoutResponsesSuccess({
                        knockoutResponsesEntity: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                            },
                            data: [
                                [
                                    {
                                        planQuestionId: 3469,
                                        value: ["yes"],
                                    } as ApplicationResponse,
                                ],
                            ],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "getApplicationResponses").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadKnockoutResponses$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadKnockoutResponsesFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 111,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("saveKnockoutResponses$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.saveKnockoutResponses({
                    mpGroup: 111,
                    memberId: 333,
                    cartItemId: 1,
                    responses: [
                        {
                            planQuestionId: 3469,
                            value: ["yes"],
                        } as ApplicationResponse,
                    ],
                    applicationResponseBaseType: ApplicationResponseBaseType.SHOP,
                }),
            );
        });

        it("should get saveKnockoutResponses array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse");

            effects.saveKnockoutResponses$.subscribe((action) => {
                expect(spy).toBeCalledWith(
                    333,
                    1,
                    111,
                    [
                        {
                            planQuestionId: 3469,
                            value: ["yes"],
                        },
                    ],
                    ApplicationResponseBaseType.SHOP,
                );

                expect(action).toStrictEqual(
                    PlanOfferingsActions.saveKnockoutResponsesSuccess({
                        knockoutResponsesEntity: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                            },
                            data: null,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.saveKnockoutResponses$.subscribe((action) => {
                expect(spy).toBeCalledWith(
                    333,
                    1,
                    111,
                    [
                        {
                            planQuestionId: 3469,
                            value: ["yes"],
                        },
                    ],
                    ApplicationResponseBaseType.SHOP,
                );

                expect(action).toStrictEqual(
                    PlanOfferingsActions.saveKnockoutResponsesFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 111,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadPlanOfferingPricings$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                PlanOfferingsActions.loadPlanOfferingPricings({
                    mpGroup: 111,
                    memberId: 222,
                    planOfferingId: 444,
                    memberIsTobaccoUser: null,
                    spouseIsTobaccoUser: null,
                    includeFee: false,
                }),
            );
        });

        it("should get PlanOfferingPricings on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferingPricing");

            effects.loadPlanOfferingPricings$.subscribe((action) => {
                expect(spy).toBeCalledWith(
                    "444",
                    undefined,
                    { age: undefined, payrollFrequencyId: undefined, spouseTobaccoUser: undefined, tobaccoUser: undefined },
                    222,
                    111,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    undefined,
                    false,
                );

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingPricingsSuccess({
                        planOfferingPricingsEntity: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 222,
                                planOfferingId: 444,
                                baseBenefitAmount: undefined,
                                memberIsTobaccoUser: null,
                                spouseIsTobaccoUser: null,
                                coverageEffectiveDate: undefined,
                                parentPlanCoverageLevelId: undefined,
                                parentPlanId: undefined,
                                riskClassId: undefined,
                                shoppingCartItemId: undefined,
                                stateAbbreviation: undefined,
                                includeFee: false,
                            },
                            data: [{ benefitAmount: 9000 } as PlanOfferingPricing],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getPlanOfferingPricing").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadPlanOfferingPricings$.subscribe((action) => {
                expect(spy).toBeCalledWith(
                    "444",
                    undefined,
                    { age: undefined, payrollFrequencyId: undefined, spouseTobaccoUser: undefined, tobaccoUser: undefined },
                    222,
                    111,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    undefined,
                    false,
                );

                expect(action).toStrictEqual(
                    PlanOfferingsActions.loadPlanOfferingPricingsFailure({
                        error: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 222,
                                planOfferingId: 444,
                                baseBenefitAmount: undefined,
                                memberIsTobaccoUser: null,
                                spouseIsTobaccoUser: null,
                                coverageEffectiveDate: undefined,
                                parentPlanCoverageLevelId: undefined,
                                parentPlanId: undefined,
                                riskClassId: undefined,
                                shoppingCartItemId: undefined,
                                stateAbbreviation: undefined,
                                includeFee: false,
                            },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("getPlanOfferingsApiResponse()", () => {
        it("should return argument if it has planOfferings property", () => {
            const mock = {
                planOfferings: [{ id: 1 } as PlanOffering],
            };
            expect(effects.getPlanOfferingsApiResponse(mock)).toBe(mock);
        });

        it("should return argument if response code of error is 400", () => {
            const mock = {
                httpErrorResponse: { status: 400 } as HttpErrorResponse,
            };
            expect(effects.getPlanOfferingsApiResponse(mock)).toBe(mock);
        });

        it("should return argument if response code of error is 409", () => {
            const mock = {
                httpErrorResponse: { status: 409 } as HttpErrorResponse,
            };
            expect(effects.getPlanOfferingsApiResponse(mock)).toBe(mock);
        });

        it("should throw error if it doesn't have response code 400 or 409", () => {
            const mock = {
                httpErrorResponse: { status: 500, message: "some 500 error message" } as HttpErrorResponse,
            };
            expect(() => effects.getPlanOfferingsApiResponse(mock)).toThrow("some 500 error message");
        });
    });

    describe("getPlanOfferings()", () => {
        let spy: jest.SpyInstance<Observable<PlanOffering[]>>;

        beforeEach(() => {
            spy = jest.spyOn(shoppingService, "getPlanOfferings").mockImplementation((productOfferingId?: string) => {
                if (!productOfferingId) {
                    return of([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as PlanOffering[]);
                }

                if (productOfferingId === "555") {
                    return throwError({ status: 500 });
                }

                if (productOfferingId === "777") {
                    return throwError({ status: 400 });
                }

                if (productOfferingId === "888") {
                    return throwError({ status: 409 });
                }

                return of([{ id: Number(productOfferingId) }] as PlanOffering[]);
            });
        });

        it("should make one API request if there is an empty array productOfferingIds property in action", (done) => {
            expect.assertions(3);

            const mockAction = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [],
            });

            effects.getPlanOfferings(mockAction).subscribe((planOfferingsArray) => {
                expect(spy).toBeCalledWith(undefined, EnrollmentMethod.FACE_TO_FACE, "AZ", {}, 333, 111, "plan.productId", "1990-09-09");
                expect(spy).toBeCalledTimes(1);
                expect(planOfferingsArray).toStrictEqual([[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]]);
                done();
            });
        });

        it("should make multiple API requests for each productOfferingId", (done) => {
            expect.assertions(5);

            const mockAction = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [222, 333, 444],
            });

            effects.getPlanOfferings(mockAction).subscribe((planOfferingsArray) => {
                expect(spy).toHaveBeenNthCalledWith(
                    1,
                    "222",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    2,
                    "333",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    3,
                    "444",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toBeCalledTimes(3);
                expect(planOfferingsArray).toStrictEqual([[{ id: 222 }], [{ id: 333 }], [{ id: 444 }]]);
                done();
            });
        });

        it("should throw first HttpErrorResponse if every API request failed", (done) => {
            expect.assertions(4);

            const mockAction = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [777, 888],
            });

            effects.getPlanOfferings(mockAction).subscribe({
                error: (error) => {
                    expect(spy).toHaveBeenNthCalledWith(
                        1,
                        "777",
                        EnrollmentMethod.FACE_TO_FACE,
                        "AZ",
                        {},
                        333,
                        111,
                        "plan.productId",
                        "1990-09-09",
                    );
                    expect(spy).toHaveBeenNthCalledWith(
                        2,
                        "888",
                        EnrollmentMethod.FACE_TO_FACE,
                        "AZ",
                        {},
                        333,
                        111,
                        "plan.productId",
                        "1990-09-09",
                    );
                    expect(spy).toBeCalledTimes(2);
                    expect(error).toStrictEqual({ status: 400 });
                    done();
                },
            });
        });

        it("should use empty array for each failed request", (done) => {
            expect.assertions(7);

            const mockAction = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [111, 222, 777, 888, 333],
            });

            effects.getPlanOfferings(mockAction).subscribe((planOfferingsArray) => {
                expect(spy).toHaveBeenNthCalledWith(
                    1,
                    "111",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    2,
                    "222",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    3,
                    "777",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    4,
                    "888",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toHaveBeenNthCalledWith(
                    5,
                    "333",
                    EnrollmentMethod.FACE_TO_FACE,
                    "AZ",
                    {},
                    333,
                    111,
                    "plan.productId",
                    "1990-09-09",
                );
                expect(spy).toBeCalledTimes(5);
                expect(planOfferingsArray).toStrictEqual([[{ id: 111 }], [{ id: 222 }], [], [], [{ id: 333 }]]);
                done();
            });
        });

        it("should throw HttpErrorResponse if any API request doesn't have response code 400 or 409", (done) => {
            expect.assertions(2);

            const mockAction = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [111, 222, 555, 333, 444],
            });

            effects.getPlanOfferings(mockAction).subscribe({
                error: (error) => {
                    expect(spy).toBeCalledWith("555", EnrollmentMethod.FACE_TO_FACE, "AZ", {}, 333, 111, "plan.productId", "1990-09-09");
                    expect(error).toStrictEqual({ status: 500 });
                    done();
                },
            });
        });
    });

    describe("getEnrollmentType()", () => {
        it("should map OPEN_ENROLLMENT CoverageDatesEnrollmentType to EnrollmentType", () => {
            expect(effects.getEnrollmentType(CoverageDatesEnrollmentType.OPEN_ENROLLMENT)).toStrictEqual(EnrollmentType.OPEN_ENROLLMENT);
        });

        it("should map QUALIFYING_LIFE_EVENT CoverageDatesEnrollmentType to EnrollmentType", () => {
            expect(effects.getEnrollmentType(CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT)).toStrictEqual(
                EnrollmentType.QUALIFYING_LIFE_EVENT,
            );
        });

        it("should map anything else to null", () => {
            expect(effects.getEnrollmentType(CoverageDatesEnrollmentType.SINGLE_PLAN_YEAR)).toBeNull();
        });
    });

    describe("sortArrayOfPlanOfferings()", () => {
        it("should flatten PlanOffering arrays into one array and sort by displayOrder and name", () => {
            expect(
                effects.sortArrayOfPlanOfferings([
                    [{ plan: { displayOrder: 3 } }],
                    [{ plan: { displayOrder: 1 } }],
                    [{ plan: { displayOrder: 2 } }],
                ] as PlanOffering[][]),
            ).toStrictEqual([{ plan: { displayOrder: 1 } }, { plan: { displayOrder: 2 } }, { plan: { displayOrder: 3 } }]);
        });
    });

    describe("sortPlanOfferings()", () => {
        it("should sort PlanOfferings by displayOrder and name", () => {
            expect(
                effects.sortPlanOfferings([
                    { plan: { displayOrder: 2, name: "a" } },
                    { plan: { displayOrder: 3, name: "z" } },
                    { plan: { displayOrder: 1, name: "z" } },
                    { plan: { displayOrder: 3, name: "a" } },
                    { plan: { displayOrder: 1, name: "a" } },
                    { plan: { displayOrder: 2, name: "z" } },
                ] as PlanOffering[]),
            ).toStrictEqual([
                { plan: { displayOrder: 1, name: "a" } },
                { plan: { displayOrder: 1, name: "z" } },
                { plan: { displayOrder: 2, name: "a" } },
                { plan: { displayOrder: 2, name: "z" } },
                { plan: { displayOrder: 3, name: "a" } },
                { plan: { displayOrder: 3, name: "z" } },
            ] as PlanOffering[]);
        });

        it("should sort PlanOfferings by name if there are no displayOrders", () => {
            expect(
                effects.sortPlanOfferings([
                    { plan: { name: "a" } },
                    { plan: { name: "z" } },
                    { plan: { name: "z" } },
                    { plan: { name: "a" } },
                    { plan: { name: "a" } },
                    { plan: { name: "z" } },
                ] as PlanOffering[]),
            ).toStrictEqual([
                { plan: { name: "a" } },
                { plan: { name: "a" } },
                { plan: { name: "a" } },
                { plan: { name: "z" } },
                { plan: { name: "z" } },
                { plan: { name: "z" } },
            ] as PlanOffering[]);
        });

        it("should not mutate original array", () => {
            const mock = [{ plan: { displayOrder: 2 } }, { plan: { displayOrder: 1 } }] as PlanOffering[];
            expect(effects.sortPlanOfferings(mock)).toStrictEqual([
                { plan: { displayOrder: 1 } },
                { plan: { displayOrder: 2 } },
            ] as PlanOffering[]);
            expect(effects.sortPlanOfferings(mock)).not.toBe(mock);
            expect(mock).toStrictEqual([{ plan: { displayOrder: 2 } }, { plan: { displayOrder: 1 } }] as PlanOffering[]);
        });
    });
});
