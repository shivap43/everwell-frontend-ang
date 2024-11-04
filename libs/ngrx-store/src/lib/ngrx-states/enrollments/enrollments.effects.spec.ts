import { HttpResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { ShoppingService, EnrollmentService, EnrollmentMethodDetail, AflacService } from "@empowered/api";
import { EnrollmentRider, EnrollmentDependent, EnrollmentBeneficiary, Enrollments, ApiError, PreliminaryForm } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as EnrollmentsActions from "./enrollments.actions";
import { EnrollmentsEffects } from "./enrollments.effects";

const mockShoppingService = {
    getEnrollmentMethods: (MPGroup?: number) => of([{ description: "some description" } as EnrollmentMethodDetail]),
} as ShoppingService;

const mockEnrollmentService = {
    getEnrollments: (memberId: number, mpGroup: number) => of([{ memberCost: 1 } as Enrollments]),
    getEnrollmentRiders: (memberId: number, enrollmentId: number, mpGroup: number) => of([{ id: 1 } as EnrollmentRider]),
    getEnrollmentBeneficiaries: (memberId: number, enrollmentId: number, mpGroup: number) =>
        of([{ allocationType: "PRIMARY" } as EnrollmentBeneficiary]),
    getEnrollmentDependents: (memberId: number, enrollmentId: number, mpGroup: number) => of([{ dependentId: 1 } as EnrollmentDependent]),
    downloadPreliminaryForm: (memberId: number, preliminaryFormPath: string, cartItemId: number, mpGroupId: number) => of(""),
    emailPreliminaryForms: (memberId: number, email: string, mpGroupId: number, preliminaryForms: PreliminaryForm[]) =>
        of({} as HttpResponse<unknown>),
} as EnrollmentService;

const mockAflacService = {
    importAflacPolicies: (memberId: number, mpGroup: number) => of(undefined),
} as AflacService;

describe("EnrollmentsEffects", () => {
    let actions$: Observable<Action>;
    let effects: EnrollmentsEffects;
    let shoppingService: ShoppingService;
    let enrollmentService: EnrollmentService;
    let aflacService: AflacService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: EnrollmentService, useValue: mockEnrollmentService },
                { provide: AflacService, useValue: mockAflacService },
                EnrollmentsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
            ],
        });

        effects = TestBed.inject(EnrollmentsEffects);
        shoppingService = TestBed.inject(ShoppingService);
        enrollmentService = TestBed.inject(EnrollmentService);
        aflacService = TestBed.inject(AflacService);
    });

    describe("loadEnrollments$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(EnrollmentsActions.loadEnrollments({ mpGroup: 8888, memberId: 123 }));
        });

        it("should get EnrollmentSets array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollments");

            effects.loadEnrollments$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentsSuccess({
                        enrollmentsEntity: {
                            identifiers: { mpGroup: 8888, memberId: 123 },
                            data: [{ memberCost: 1 } as Enrollments],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollments").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadEnrollments$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentsFailure({
                        error: {
                            identifiers: {
                                mpGroup: 8888,
                                memberId: 123,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadEnrollmentRiders$", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            actions$ = of(EnrollmentsActions.loadEnrollmentRiders({ mpGroup: 8888, memberId: 123, enrollmentId: 1 }));
        });

        it("should get EnrollmentSets array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentRiders");

            effects.loadEnrollmentRiders$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 1, 8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentRidersSuccess({
                        enrollmentRidersEntity: {
                            identifiers: { mpGroup: 8888, memberId: 123, enrollmentId: 1 },
                            data: [{ id: 1 } as EnrollmentRider],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentRiders").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadEnrollmentRiders$.subscribe((action) => {
                expect(spy).toBeCalledWith(123, 1, 8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentRidersFailure({
                        error: {
                            identifiers: {
                                mpGroup: 8888,
                                memberId: 123,
                                enrollmentId: 1,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadEnrollmentMethodDetails$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(EnrollmentsActions.loadEnrollmentMethodDetails({ mpGroup: 8888 }));
        });

        it("should get EnrollmentMemberSets array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getEnrollmentMethods");

            effects.loadEnrollmentMethodDetails$.subscribe((action) => {
                expect(spy).toBeCalledWith(8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentMethodDetailsSuccess({
                        enrollmentMethodDetailsEntity: {
                            identifiers: { mpGroup: 8888 },
                            data: [{ description: "some description" } as EnrollmentMethodDetail],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getEnrollmentMethods").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadEnrollmentMethodDetails$.subscribe((action) => {
                expect(spy).toBeCalledWith(8888);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentMethodDetailsFailure({
                        error: {
                            identifiers: { mpGroup: 8888 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadEnrollmentBeneficiaries$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                EnrollmentsActions.loadEnrollmentBeneficiaries({
                    memberId: 333,
                    enrollmentId: 1,
                    mpGroup: 111,
                }),
            );
        });

        it("should get beneficiary data of existing coverage array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentBeneficiaries");

            effects.loadEnrollmentBeneficiaries$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentBeneficiariesSuccess({
                        enrollmentBeneficiariesEntity: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 111,
                            },
                            data: [{ allocationType: "PRIMARY" } as EnrollmentBeneficiary],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentBeneficiaries").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadEnrollmentBeneficiaries$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentBeneficiariesFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
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

    describe("loadEnrollmentDependents$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                EnrollmentsActions.loadEnrollmentDependents({
                    memberId: 333,
                    enrollmentId: 1,
                    mpGroup: 111,
                }),
            );
        });

        it("should get enrolled dependent data of existing coverage array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentDependents");

            effects.loadEnrollmentDependents$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentDependentsSuccess({
                        enrollmentDependentsEntity: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 111,
                            },
                            data: [{ dependentId: 1 } as EnrollmentDependent],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(enrollmentService, "getEnrollmentDependents").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadEnrollmentDependents$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 1, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadEnrollmentDependentsFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
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

    describe("loadImportPolicy$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                EnrollmentsActions.loadImportPolicy({
                    memberId: 333,
                    mpGroup: 111,
                }),
            );
        });

        it("should load aflac policies on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(aflacService, "importAflacPolicies");

            effects.loadImportPolicy$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadImportPolicySuccess({
                        importPolicyEntity: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 111,
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

            const spy = jest.spyOn(aflacService, "importAflacPolicies").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadImportPolicy$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111);

                expect(action).toStrictEqual(
                    EnrollmentsActions.loadImportPolicyFailure({
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

    describe("downloadPreliminaryForm$", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            actions$ = of(
                EnrollmentsActions.downloadPreliminaryForm({
                    memberId: 7,
                    preliminaryFormPath: "/resources/aflac/NY-16800",
                    cartItemId: 74,
                    mpGroupId: 8868,
                }),
            );
        });

        it("should return response of type string on success", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(enrollmentService, "downloadPreliminaryForm");
            window.URL.createObjectURL = () => "downloadPreliminaryForm.com";
            jest.spyOn(window.URL, "createObjectURL");
            effects.downloadPreliminaryForm$.subscribe((action) => {
                expect(spy).toBeCalledWith(7, "/resources/aflac/NY-16800", 74, 8868);
                expect(action).toStrictEqual(
                    EnrollmentsActions.downloadPreliminaryFormSuccess({
                        downloadPreliminaryFormEntity: {
                            identifiers: {
                                memberId: 7,
                                preliminaryFormPath: "/resources/aflac/NY-16800",
                                cartItemId: 74,
                                mpGroupId: 8868,
                            },
                            data: "downloadPreliminaryForm.com",
                        },
                    }),
                );
                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(enrollmentService, "downloadPreliminaryForm").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );
            effects.downloadPreliminaryForm$.subscribe((action) => {
                expect(spy).toBeCalledWith(7, "/resources/aflac/NY-16800", 74, 8868);
                expect(action).toStrictEqual(
                    EnrollmentsActions.downloadPreliminaryFormFailure({
                        error: {
                            identifiers: {
                                memberId: 7,
                                preliminaryFormPath: "/resources/aflac/NY-16800",
                                cartItemId: 74,
                                mpGroupId: 8868,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );
                done();
            });
        });
    });

    describe("emailPreliminaryForm$", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            actions$ = of(
                EnrollmentsActions.emailPreliminaryForm({
                    memberId: 7,
                    email: "abcd123@gmail.com",
                    mpGroupId: 8868,
                    preliminaryForms: [{ preliminaryFormPath: "/resources/aflac/NY-16800", cartItemId: 74 }],
                }),
            );
        });

        it("should return http response 202 on success", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(enrollmentService, "emailPreliminaryForms");
            effects.emailPreliminaryForm$.subscribe((action) => {
                expect(spy).toBeCalledWith(7, "abcd123@gmail.com", 8868, [
                    { preliminaryFormPath: "/resources/aflac/NY-16800", cartItemId: 74 },
                ]);
                expect(action).toStrictEqual(
                    EnrollmentsActions.emailPreliminaryFormSuccess({
                        emailPreliminaryFormEntity: {
                            identifiers: {
                                memberId: 7,
                                email: "abcd123@gmail.com",
                                mpGroupId: 8868,
                            },
                            data: {} as HttpResponse<unknown>,
                        },
                    }),
                );
                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(enrollmentService, "emailPreliminaryForms").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );
            effects.emailPreliminaryForm$.subscribe((action) => {
                expect(spy).toBeCalledWith(7, "abcd123@gmail.com", 8868, [
                    { preliminaryFormPath: "/resources/aflac/NY-16800", cartItemId: 74 },
                ]);
                expect(action).toStrictEqual(
                    EnrollmentsActions.emailPreliminaryFormFailure({
                        error: {
                            identifiers: {
                                memberId: 7,
                                email: "abcd123@gmail.com",
                                mpGroupId: 8868,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );
                done();
            });
        });
    });
});
