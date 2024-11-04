import { TestBed } from "@angular/core/testing";
import { AsyncData, AsyncStatus, CountryState, PayFrequency, RiskClass } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import {
    AvailableRidersMap,
    RateSheetBenefitAmountState,
    RateSheetCoverageLevelState,
    RateSheetEliminationPeriodState,
    RateSheetMoreSettings,
    RateSheetPlanSeriesPlansState,
    RateSheetRidersState,
} from "./rate-sheets-component-store.model";
import { RateSheetsComponentStoreService } from "./rate-sheets-component-store.service";

describe("RateSheetsComponentStoreService", () => {
    let service: RateSheetsComponentStoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [NGRXStore, provideMockStore({}), RateSheetsComponentStoreService],
        }).compileComponents();

        service = TestBed.inject(RateSheetsComponentStoreService);
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("selectCountryStateOnAsyncValue()", () => {
        it("should get states from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { abbreviation: "GA", name: "Georgia" } as CountryState;
            const mockAsyncData: AsyncData<CountryState> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setCountryState(mockAsyncData);
            service.selectCountryStateOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectChannelOnAsyncValue()", () => {
        it("should get channels from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = "PAYROLL";
            const mockAsyncData: AsyncData<string> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setChannel(mockAsyncData);
            service.selectChannelOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectPaymentFrequencyOnAsyncValue()", () => {
        it("should get payment frequencies from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { id: 2342, frequencyType: "Monthly", payrollsPerYear: 12, name: "Monthly" } as PayFrequency;
            const mockAsyncData: AsyncData<PayFrequency> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setPayFrequency(mockAsyncData);
            service.selectPaymentFrequencyOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectRiskClassOnAsyncValue()", () => {
        it("should get risk classes from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { id: 2342, name: "Monthly" } as RiskClass;
            const mockAsyncData: AsyncData<RiskClass> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setRiskClass(mockAsyncData);
            service.selectRiskClassOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectMoreSettingsOnAsyncValue()", () => {
        it("should get more settings dropdown values from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { zipCode: "00969", sicCode: 123456, eligibleSubscribers: 50 } as RateSheetMoreSettings;
            const mockAsyncData: AsyncData<RateSheetMoreSettings> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setMoreSettings(mockAsyncData);
            service.selectMoreSettingsOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addPlanSeriesPlansState", () => {
        it("should set PlanSeriesPlansState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                plans: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetPlanSeriesPlansState;

            service.addPlanSeriesPlansState(mockValue);
            service.getPlanSeriesPlansState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set PlanSeriesPlansState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                plans: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetPlanSeriesPlansState;

            service.upsertPlanSeriesPlansState(mockValue);
            service.addPlanSeriesPlansState({ ...mockValue, coverageLevels: [{ id: 999 }] } as RateSheetPlanSeriesPlansState);
            service.getPlanSeriesPlansState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    plans: [{ id: 1 }],
                    panelIdentifiers: { planSeriesId: 1 },
                });
                done();
            });
        });
    });

    describe("removePlanSeriesPlansState()", () => {
        it("should remove PlanSeriesPlans from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                plans: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetPlanSeriesPlansState;

            const collectedValues = [];

            service.upsertPlanSeriesPlansState(mockValue);

            service
                .select((state) => state.planSeriesPlansStates.entities["1"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removePlanSeriesPlansState({ planSeriesId: 1 });
                    }
                });
        });
    });

    describe("getPlanSeriesPlansState()", () => {
        it("should get getPlanSeriesPlans from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                plans: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetPlanSeriesPlansState;

            service.upsertPlanSeriesPlansState(mockValue);
            service.getPlanSeriesPlansState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addBenefitAmountState", () => {
        it("should set BenefitAmountState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmounts: [1],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetBenefitAmountState;

            service.addBenefitAmountState(mockValue);
            service.getBenefitAmountState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set BenefitAmountState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmounts: [1],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetBenefitAmountState;

            service.upsertBenefitAmountState(mockValue);
            service.addBenefitAmountState({ ...mockValue, benefitAmounts: [999] } as RateSheetBenefitAmountState);
            service.getBenefitAmountState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    benefitAmounts: [1],
                    panelIdentifiers: { planSeriesId: 1 },
                });
                done();
            });
        });
    });

    describe("removeBenefitAmountState()", () => {
        it("should remove BenefitAmount from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmounts: [1],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetBenefitAmountState;

            const collectedValues = [];

            service.upsertBenefitAmountState(mockValue);

            service
                .select((state) => state.benefitAmountStates.entities["1"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeBenefitAmountState({ planSeriesId: 1 });
                    }
                });
        });
    });

    describe("getBenefitAmountState()", () => {
        it("should get BenefitAmount from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmounts: [1],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetBenefitAmountState;

            service.upsertBenefitAmountState(mockValue);
            service.getBenefitAmountState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addEliminationPeriodState", () => {
        it("should set EliminationPeriodState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriods: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetEliminationPeriodState;

            service.addEliminationPeriodState(mockValue);
            service.getEliminationPeriodState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set EliminationPeriodState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriods: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetEliminationPeriodState;

            service.upsertEliminationPeriodState(mockValue);
            service.addEliminationPeriodState({ ...mockValue, eliminationPeriods: [{ id: 999 }] } as RateSheetEliminationPeriodState);
            service.getEliminationPeriodState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    eliminationPeriods: [{ id: 1 }],
                    panelIdentifiers: { planSeriesId: 1 },
                });
                done();
            });
        });
    });

    describe("removeEliminationPeriodState()", () => {
        it("should remove EliminationPeriod from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriods: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetEliminationPeriodState;

            const collectedValues = [];

            service.upsertEliminationPeriodState(mockValue);

            service
                .select((state) => state.eliminationPeriodStates.entities["1"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeEliminationPeriodState({ planSeriesId: 1 });
                    }
                });
        });
    });

    describe("getEliminationPeriodState()", () => {
        it("should get EliminationPeriod from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriods: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetEliminationPeriodState;

            service.upsertEliminationPeriodState(mockValue);
            service.getEliminationPeriodState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addCoverageLevelState", () => {
        it("should set CoverageLevelState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevels: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetCoverageLevelState;

            service.addCoverageLevelState(mockValue);
            service.getCoverageLevelState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set CoverageLevelState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevels: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetCoverageLevelState;

            service.upsertCoverageLevelState(mockValue);
            service.addCoverageLevelState({ ...mockValue, coverageLevels: [{ id: 999 }] } as RateSheetCoverageLevelState);
            service.getCoverageLevelState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    coverageLevels: [{ id: 1 }],
                    panelIdentifiers: { planSeriesId: 1 },
                });
                done();
            });
        });
    });

    describe("removeCoverageLevelState()", () => {
        it("should remove CoverageLevel from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevels: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetCoverageLevelState;

            const collectedValues = [];

            service.upsertCoverageLevelState(mockValue);

            service
                .select((state) => state.coverageLevelStates.entities["1"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeCoverageLevelState({ planSeriesId: 1 });
                    }
                });
        });
    });

    describe("getCoverageLevelState()", () => {
        it("should get CoverageLevel from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevels: [{ id: 1 }],
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetCoverageLevelState;

            service.upsertCoverageLevelState(mockValue);
            service.getCoverageLevelState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addRidersState", () => {
        it("should set RidersState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                riderOptions: { riderOptions: { "test rider": "false" } },
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetRidersState;

            service.addRidersState(mockValue);
            service.getRidersState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set RidersState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                riderOptions: { riderOptions: { "test rider": "false" } },
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetRidersState;

            service.upsertRidersState(mockValue);
            service.addRidersState({ ...mockValue, riders: [{ id: 999 }] } as RateSheetRidersState);
            service.getRidersState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("removeRidersState()", () => {
        it("should remove Riders from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                riderOptions: { riderOptions: { "test rider": "false" } },
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetRidersState;

            const collectedValues = [];

            service.upsertRidersState(mockValue);

            service
                .select((state) => state.riderStates.entities["1"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeRidersState({ planSeriesId: 1 });
                    }
                });
        });
    });

    describe("getRidersState()", () => {
        it("should get getRiders from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                riderOptions: { riderOptions: { "test rider": "false" } },
                panelIdentifiers: { planSeriesId: 1 },
            } as RateSheetRidersState;

            service.upsertRidersState(mockValue);
            service.getRidersState({ planSeriesId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectAvailableRiderMapOnAsyncValue()", () => {
        it("should get available riderMap from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { availableRiderMap: { "Additional Accidental-Death Benefit Rider": "false" } } as AvailableRidersMap;
            const mockAsyncData: AsyncData<AvailableRidersMap> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setAvailableRidersMap(mockAsyncData);
            service.selectAvailableRiderMapOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });
});
