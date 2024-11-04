import { TestBed } from "@angular/core/testing";
import { ProducerInformation, ProducerService } from "@empowered/api";
import { ApiError } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as ProducersActions from "./producers.actions";
import { ProducersEffects } from "./producers.effects";

const mockProducerService = {
    getProducerInformation: (producerId: string) => of({ licenses: [], carrierAppointments: [] } as ProducerInformation),
    getAllProducersLicensedStates: (mpGroup: number) =>
        of([
            {
                abbreviation: "some abbr",
                name: "some name",
            },
        ]),
} as ProducerService;

describe("ProducersEffects", () => {
    let actions$: Observable<Action>;
    let effects: ProducersEffects;
    let producerService: ProducerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                ProducersEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: ProducerService, useValue: mockProducerService },
            ],
        });

        effects = TestBed.inject(ProducersEffects);
        producerService = TestBed.inject(ProducerService);
    });

    describe("loadProducerInformation$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ProducersActions.loadProducerInformation({ producerId: 2 }));
        });

        it("should get Producer information on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(producerService, "getProducerInformation");

            effects.loadProducerInformation$.subscribe((action) => {
                expect(spy).toBeCalledWith("2");

                expect(action).toStrictEqual(
                    ProducersActions.loadProducerInformationSuccess({
                        producerInformationsEntity: {
                            identifiers: { producerId: 2 },
                            data: { licenses: [], carrierAppointments: [] } as ProducerInformation,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(producerService, "getProducerInformation").mockReturnValue(
                throwError({
                    error: {
                        message: "some error message",
                    },
                }),
            );

            effects.loadProducerInformation$.subscribe((action) => {
                expect(spy).toBeCalledWith("2");

                expect(action).toStrictEqual(
                    ProducersActions.loadProducerInformationFailure({
                        error: {
                            identifiers: { producerId: 2 },
                            data: { message: "some error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadAllProducersLicensedStateSet$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ProducersActions.loadAllProducersLicensedStateSet({ mpGroup: 111 }));
        });

        it("should get Producers Licensed States information on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(producerService, "getAllProducersLicensedStates");

            effects.loadAllProducersLicensedStateSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(111);

                expect(action).toStrictEqual(
                    ProducersActions.loadAllProducersLicensedStateSetSuccess({
                        licensedStateSetsEntity: {
                            identifiers: { mpGroup: 111 },
                            data: [
                                {
                                    abbreviation: "some abbr",
                                    name: "some name",
                                },
                            ],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(producerService, "getAllProducersLicensedStates").mockReturnValue(
                throwError({
                    error: {
                        message: "some error message",
                    },
                }),
            );

            effects.loadAllProducersLicensedStateSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(111);

                expect(action).toStrictEqual(
                    ProducersActions.loadAllProducersLicensedStateSetFailure({
                        error: {
                            identifiers: {
                                mpGroup: 111,
                            },
                            data: { message: "some error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });
});
