import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { StaticService, CoreService } from "@empowered/api";
import { ApiError } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as SharedActions from "./shared.actions";
import { SharedEffects } from "./shared.effects";
import { mockCountryStates, mockCities, mockCountries, mockGenders, mockRiskClasses } from "./shared.mocks";

const mockStaticService = {
    getStates: () => of(mockCountryStates),
    getCities: (state: string) => of(mockCities),
    getCountries: () => of(mockCountries),
    getGenders: () => of(mockGenders),
} as StaticService;

const mockCoreServiceService = {
    getCarrierRiskClasses: (key: string) => of(mockRiskClasses),
} as CoreService;

describe("SharedEffects", () => {
    let actions$: Observable<Action>;
    let effects: SharedEffects;
    let staticService: StaticService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NxModule.forRoot()],
            providers: [
                { provide: StaticService, useValue: mockStaticService },
                { provide: CoreService, useValue: mockCoreServiceService },

                SharedEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
            ],
        });

        effects = TestBed.inject(SharedEffects);
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(effects).toBeTruthy();
    });

    // Testing API interaction
    describe("loadStates$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(SharedActions.loadCountryStates);
        });

        it("should get the states on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getStates");

            effects.loadStates$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadCountryStatesSuccess({ countryStates: mockCountryStates }));

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getStates").mockReturnValueOnce(
                throwError({
                    error: { message: "some error message" },
                }),
            );

            effects.loadStates$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    SharedActions.loadCountryStatesFailure({ error: { message: "some error message" } as ApiError }),
                );

                done();
            });
        });
    });

    describe("loadCities$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(SharedActions.loadCities({ stateAbbreviation: "CA" }));
        });

        it("should get the cities on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getCities");

            effects.loadCities$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    SharedActions.loadCitiesSuccess({
                        cities: {
                            identifiers: { stateAbbreviation: "CA" },
                            data: mockCities,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getCities").mockReturnValueOnce(
                throwError({
                    error: { message: "some error message" },
                }),
            );

            effects.loadCities$.subscribe((action: Action) => {
                expect(spy).toBeCalledWith("CA");

                expect(action).toStrictEqual(
                    SharedActions.loadCitiesFailure({
                        error: {
                            identifiers: { stateAbbreviation: "CA" },
                            data: { message: "some error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadCountries$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(SharedActions.loadCountries);
        });

        it("should get the countires on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getCountries");

            effects.loadCountries$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadCountriesSuccess({ countries: mockCountries }));

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getCountries").mockReturnValueOnce(
                throwError({
                    error: { message: "some error message" },
                }),
            );

            effects.loadCountries$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadCountriesFailure({ error: { message: "some error message" } as ApiError }));

                done();
            });
        });
    });

    describe("loadGenders$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(SharedActions.loadGenders);
        });

        it("should get the genders on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getGenders");

            effects.loadGenders$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadGendersSuccess({ genders: mockGenders }));

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(staticService, "getGenders").mockReturnValueOnce(
                throwError({
                    error: { message: "some error message" },
                }),
            );

            effects.loadGenders$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadGendersFailure({ error: { message: "some error message" } as ApiError }));

                done();
            });
        });
    });

    describe("loadCarrierRiskClasses$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(SharedActions.loadCarrierRiskClasses);
        });

        it("should get RiskClasses on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(SharedActions, "loadCarrierRiskClassesSuccess");

            effects.loadCarrierRiskClasses$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(SharedActions.loadCarrierRiskClassesSuccess({ riskClasses: mockRiskClasses }));

                done();
            });
        });

        it("should get api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(SharedActions, "loadCarrierRiskClassesSuccess").mockImplementation(() => {
                throw {
                    error: { message: "some error message" },
                };
            });

            effects.loadCarrierRiskClasses$.subscribe((action: Action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    SharedActions.loadCarrierRiskClassesFailure({
                        error: { message: "some error message" } as ApiError,
                    }),
                );

                done();
            });
        });
    });
});
