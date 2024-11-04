import { TestBed } from "@angular/core/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

import { ValidateRiderStateService } from "../validate-rider-state/validate-rider-state.service";
import { ProducerShopComponentStoreService } from "./producer-shop-component-store.service";
import { LanguageService } from "@empowered/language";
import {
    AnnualContributionState,
    AnsweredKnockoutQuestion,
    AnswerKnockoutQuestionValue,
    BenefitAmountState,
    CoverageLevelState,
    DependentAgeState,
    EliminationPeriodState,
    EnrollmentDetailsState,
    KnockoutDialogResponse,
    MoreSettings,
    PlanKnockoutEligibility,
    ProducerShopState,
    ProductCoverageDate,
} from "./producer-shop-component-store.model";
import {
    benefitAmountStatesAdapter,
    coverageLevelStatesAdapter,
    eliminationPeriodStatesAdapter,
    PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE,
} from "./producer-shop-component-store.constant";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { initialState } from "./producer-shop-component-store.mock";
import {
    AsyncData,
    AsyncStatus,
    CarrierId,
    ProductId,
    TobaccoInformation,
    RiskClass,
    KnockoutType,
    Characteristics,
    TaxStatus,
    CoverageLevel,
    Plan,
    Product,
    Gender,
} from "@empowered/constants";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

describe("ProducerShopComponentStoreService", () => {
    let service: ProducerShopComponentStoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                provideMockStore({ initialState }),
                ProducerShopComponentStoreService,
                ValidateRiderStateService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        });

        service = TestBed.inject(ProducerShopComponentStoreService);
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("selectedProductId$", () => {
        it("should get value from NGRX state", (done) => {
            expect.assertions(1);

            service["selectedProductId$"].subscribe((productId) => {
                expect(productId).toBe(5);
                done();
            });
        });
    });

    describe("selectedPlanOffering$", () => {
        it("should get value from NGRX state", (done) => {
            expect.assertions(1);

            service["selectedPlanOffering$"].subscribe((planOffering) => {
                expect(planOffering).toStrictEqual({
                    id: 555,
                    taxStatus: TaxStatus.POSTTAX,
                    productOfferingId: 11,
                    plan: {
                        characteristics: [] as Characteristics[],
                        product: { id: 8 } as Product,
                        carrierId: CarrierId.AFLAC,
                    } as Plan,
                });
                done();
            });
        });
    });

    describe("selectedCarrierId$", () => {
        it("should get value from NGRX state", (done) => {
            expect.assertions(1);

            service["selectedCarrierId$"].subscribe((carrierId) => {
                expect(carrierId).toBe(CarrierId.AFLAC);
                done();
            });
        });
    });

    describe("selectRiskClassesOnAsyncValue()", () => {
        it("should get RiskClasses from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];

            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setRiskClasses(mockAsyncData);
            service.selectRiskClassesOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectProductRiskClassOnAsyncValue()", () => {
        it("should get second RiskClass if productId is ProductId.SHORT_TERM_DISABILITY", (done) => {
            expect.assertions(1);

            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];

            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setRiskClasses(mockAsyncData);
            service.selectProductRiskClassOnAsyncValue(ProductId.SHORT_TERM_DISABILITY, CarrierId.AFLAC).subscribe((value) => {
                expect(value).toStrictEqual({ id: 2 });
                done();
            });
        });

        it("should get first RiskClass if productId is NOT ProductId.SHORT_TERM_DISABILITY", (done) => {
            expect.assertions(1);

            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];

            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setRiskClasses(mockAsyncData);
            service.selectProductRiskClassOnAsyncValue(ProductId.ACCIDENT, CarrierId.AFLAC).subscribe((value) => {
                expect(value).toStrictEqual({ id: 1 });
                done();
            });
        });

        it("should get null if CarrierId is NOT CarrierId.AFLAC", (done) => {
            expect.assertions(1);

            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];

            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setRiskClasses(mockAsyncData);
            service.selectProductRiskClassOnAsyncValue(ProductId.SHORT_TERM_DISABILITY, CarrierId.ARGUS).subscribe((value) => {
                expect(value).toStrictEqual(null);
                done();
            });
        });
    });

    describe("getSelectedProductRiskClassOnAsyncValue()", () => {
        it("should get RiskClass based on CarrierId and ProductId from global state", (done) => {
            expect.assertions(1);

            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];

            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setRiskClasses(mockAsyncData);
            service.getSelectedProductRiskClassOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual({ id: 2 });
                done();
            });
        });
    });

    describe("getSelectedProductCoverageDateOnAsyncValue()", () => {
        it("should get coverage date selected ProductId from global state", (done) => {
            expect.assertions(1);

            const mockValue = [{ productId: ProductId.SHORT_TERM_DISABILITY, date: "1990-09-01" }] as ProductCoverageDate[];

            const mockAsyncData: AsyncData<ProductCoverageDate[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setProductCoverageDates(mockAsyncData);
            service.getSelectedProductCoverageDateOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual({ productId: ProductId.SHORT_TERM_DISABILITY, date: "1990-09-01" });
                done();
            });
        });
    });

    describe("selectMoreSettingsOnAsyncValue()", () => {
        it("should get MoreSettings from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = { memberGender: Gender.FEMALE } as MoreSettings;

            const mockAsyncData: AsyncData<MoreSettings> = {
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

    describe("selectTobaccoInformationOnAsyncValue()", () => {
        it("should get TobaccoInformation from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = { memberIsTobaccoUser: true } as TobaccoInformation;

            const mockAsyncData: AsyncData<TobaccoInformation> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setTobaccoInformation(mockAsyncData);
            service.selectTobaccoInformationOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("setEnrollmentDetailsState", () => {
        it("should NOT set data if AsyncData does NOT AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = { 1: { edit: true }, 2: { edit: true } } as Record<number, EnrollmentDetailsState>;

            const mockAsyncData: AsyncData<Record<number, EnrollmentDetailsState>> = {
                status: AsyncStatus.LOADING,
                value: mockValue,
                error: null,
            };

            service.setEnrollmentDetailsStates(mockAsyncData);
            // This shouldn't set EnrollmentDetailsState since local state is still loading
            service.setEnrollmentDetailsState({ enrollmentDetailsState: { edit: false }, enrollmentId: 1 });
            service.selectEnrollmentDetailsStates().subscribe((value) => {
                expect(value).toStrictEqual({
                    status: AsyncStatus.LOADING,
                    value: mockValue,
                    error: null,
                });
                done();
            });
        });

        it("should set data if AsyncData does AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = { 1: { edit: true }, 2: { edit: true } } as Record<number, EnrollmentDetailsState>;

            const mockAsyncData: AsyncData<Record<number, EnrollmentDetailsState>> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setEnrollmentDetailsStates(mockAsyncData);
            // This shouldn't set EnrollmentDetailsState since local state is still loading
            service.setEnrollmentDetailsState({ enrollmentDetailsState: { edit: false }, enrollmentId: 1 });
            service.selectEnrollmentDetailsStates().subscribe((value) => {
                expect(value).toStrictEqual({
                    status: AsyncStatus.SUCCEEDED,
                    value: { ...mockValue, 1: { edit: false } },
                    error: null,
                });
                done();
            });
        });
    });

    describe("selectEnrollmentDetailsStatesOnAsyncValue()", () => {
        it("should get EnrollmentDetailsStates from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);

            const mockValue = { 1: { edit: false }, 2: { edit: true } } as Record<number, EnrollmentDetailsState>;

            const mockAsyncData: AsyncData<Record<number, EnrollmentDetailsState>> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };

            service.setEnrollmentDetailsStates(mockAsyncData);
            service.selectEnrollmentDetailsStatesOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("selectAnsweredKnockoutQuestions()", () => {
        it("should get Dictionary of AnsweredKnockoutQuestion from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = [
                { id: 1, key: "1", answer: AnswerKnockoutQuestionValue.NA },
                { id: 2, key: "2", answer: AnswerKnockoutQuestionValue.YES },
                { id: 3, key: "3", answer: AnswerKnockoutQuestionValue.NO },
            ] as AnsweredKnockoutQuestion[];

            service.setAnsweredKnockoutQuestions(mockValue);
            service.selectAnsweredKnockoutQuestions().subscribe((value) => {
                expect(value).toStrictEqual({
                    1: { id: 1, key: "1", answer: AnswerKnockoutQuestionValue.NA },
                    2: { id: 2, key: "2", answer: AnswerKnockoutQuestionValue.YES },
                    3: { id: 3, key: "3", answer: AnswerKnockoutQuestionValue.NO },
                });
                done();
            });
        });
    });

    describe("getKnockoutEligibilityByPlanOfferingId()", () => {
        it("should get KnockoutEligibility based on PlanOffering id from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = [
                { planOfferingId: 1, knockoutType: KnockoutType.CHILD },
                { planOfferingId: 2, knockoutType: KnockoutType.SPOUSE },
            ] as PlanKnockoutEligibility[];

            service.setPlanKnockoutEligibility(mockValue);
            service.getKnockoutEligibilityByPlanOfferingId(2).subscribe((value) => {
                expect(value).toStrictEqual({ planOfferingId: 2, knockoutType: KnockoutType.SPOUSE });
                done();
            });
        });
    });

    describe("selectKnockoutDialogResponse()", () => {
        it("should get KnockoutDialogResponses from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = [
                { planQuestionId: 1, stepId: 111 },
                { planQuestionId: 2, stepId: 2222 },
            ] as KnockoutDialogResponse[];

            service.setKnockoutDialogResponse(mockValue);
            service.selectKnockoutDialogResponse().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addEliminationPeriodState", () => {
        it("should set EliminationPeriodState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriod: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as EliminationPeriodState;

            service.addEliminationPeriodState(mockValue);
            service.getEliminationPeriodState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set EliminationPeriodState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriod: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as EliminationPeriodState;

            service.upsertEliminationPeriodState(mockValue);
            service.addEliminationPeriodState({ ...mockValue, eliminationPeriod: { id: 999 } } as EliminationPeriodState);
            service.getEliminationPeriodState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    eliminationPeriod: { id: 1 },
                    panelIdentifiers: { planOfferingId: 1 },
                });
                done();
            });
        });
    });

    describe("removeEliminationPeriodState()", () => {
        it("should remove EliminationPeriod from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriod: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as EliminationPeriodState;

            const collectedValues = [];

            service.upsertEliminationPeriodState(mockValue);

            service
                .select((state) => state.eliminationPeriodStates.entities["1--"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeEliminationPeriodState({ planOfferingId: 1 });
                    }
                });
        });
    });

    describe("getEliminationPeriodState()", () => {
        it("should get EliminationPeriod from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                eliminationPeriod: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as EliminationPeriodState;

            service.upsertEliminationPeriodState(mockValue);
            service.getEliminationPeriodState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addCoverageLevelState", () => {
        it("should set CoverageLevelState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevel: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as CoverageLevelState;

            service.addCoverageLevelState(mockValue);
            service.getCoverageLevelState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set CoverageLevelState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevel: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as CoverageLevelState;

            service.upsertCoverageLevelState(mockValue);
            service.addCoverageLevelState({ ...mockValue, coverageLevel: { id: 999 } } as CoverageLevelState);
            service.getCoverageLevelState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    coverageLevel: { id: 1 },
                    panelIdentifiers: { planOfferingId: 1 },
                });
                done();
            });
        });
    });

    describe("removeCoverageLevelState()", () => {
        it("should remove CoverageLevel from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevel: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as CoverageLevelState;

            const collectedValues = [];

            service.upsertCoverageLevelState(mockValue);

            service
                .select((state) => state.coverageLevelStates.entities["1--"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeCoverageLevelState({ planOfferingId: 1 });
                    }
                });
        });
    });

    describe("getCoverageLevelState()", () => {
        it("should get CoverageLevel from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                coverageLevel: { id: 1 },
                panelIdentifiers: { planOfferingId: 1 },
            } as CoverageLevelState;

            service.upsertCoverageLevelState(mockValue);
            service.getCoverageLevelState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addBenefitAmountState", () => {
        it("should set BenefitAmountState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmount: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as BenefitAmountState;

            service.addBenefitAmountState(mockValue);
            service.getBenefitAmountState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set BenefitAmountState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmount: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as BenefitAmountState;

            service.upsertBenefitAmountState(mockValue);
            service.addBenefitAmountState({ ...mockValue, benefitAmount: 999 } as BenefitAmountState);
            service.getBenefitAmountState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    benefitAmount: 1,
                    panelIdentifiers: { planOfferingId: 1 },
                });
                done();
            });
        });
    });

    describe("removeBenefitAmountState()", () => {
        it("should remove BenefitAmount from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmount: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as BenefitAmountState;

            const collectedValues = [];

            service.upsertBenefitAmountState(mockValue);

            service
                .select((state) => state.benefitAmountStates.entities["1--"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeBenefitAmountState({ planOfferingId: 1 });
                    }
                });
        });
    });

    describe("getBenefitAmountState()", () => {
        it("should get BenefitAmount from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                benefitAmount: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as BenefitAmountState;

            service.upsertBenefitAmountState(mockValue);
            service.getBenefitAmountState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addDependentAgeState", () => {
        it("should set DependentAgeState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                dependentAge: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as DependentAgeState;

            service.addDependentAgeState(mockValue);
            service.getDependentAgeState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set DependentAgeState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                dependentAge: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as DependentAgeState;

            service.upsertDependentAgeState(mockValue);
            service.addDependentAgeState({ ...mockValue, dependentAge: 999 } as DependentAgeState);
            service.getDependentAgeState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    dependentAge: 1,
                    panelIdentifiers: { planOfferingId: 1 },
                });
                done();
            });
        });
    });

    describe("removeDependentAgeState()", () => {
        it("should remove AnnualContribution from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                dependentAge: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as DependentAgeState;

            const collectedValues = [];

            service.upsertDependentAgeState(mockValue);

            service
                .select((state) => state.dependentAgeStates.entities["1--"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeDependentAgeState({ planOfferingId: 1 });
                    }
                });
        });
    });

    describe("getDependentAgeState()", () => {
        it("should get DependentAge from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                dependentAge: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as DependentAgeState;

            service.upsertDependentAgeState(mockValue);
            service.getDependentAgeState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("addAnnualContributionState", () => {
        it("should set AnnualContributionState if there is NOT one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                annualContribution: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as AnnualContributionState;

            service.addAnnualContributionState(mockValue);
            service.getAnnualContributionState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });

        it("should NOT set AnnualContributionState if there is one already", (done) => {
            expect.assertions(1);

            const mockValue = {
                annualContribution: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as AnnualContributionState;

            service.upsertAnnualContributionState(mockValue);
            service.addAnnualContributionState({ ...mockValue, annualContribution: 999 } as AnnualContributionState);
            service.getAnnualContributionState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual({
                    annualContribution: 1,
                    panelIdentifiers: { planOfferingId: 1 },
                });
                done();
            });
        });
    });

    describe("getAnnualContributionState()", () => {
        it("should get AnnualContribution from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                annualContribution: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as AnnualContributionState;

            service.upsertAnnualContributionState(mockValue);
            service.getAnnualContributionState({ planOfferingId: 1 }).subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });

    describe("removeAnnualContributionState()", () => {
        it("should remove AnnualContribution from ComponentStore", (done) => {
            expect.assertions(1);

            const mockValue = {
                annualContribution: 1,
                panelIdentifiers: { planOfferingId: 1 },
            } as AnnualContributionState;

            const collectedValues = [];

            service.upsertAnnualContributionState(mockValue);

            service
                .select((state) => state.annualContributionStates.entities["1--"])
                .subscribe((value) => {
                    collectedValues.push(value);

                    if (collectedValues.length === 2) {
                        expect(collectedValues).toStrictEqual([mockValue, undefined]);

                        done();
                        return;
                    }

                    if (collectedValues.length === 1) {
                        service.removeAnnualContributionState({ planOfferingId: 1 });
                    }
                });
        });
    });

    describe("removePanelState()", () => {
        it("should clear all the local states using PanelIdentifier", (done) => {
            expect.assertions(4);

            // The actual order of which local state gets removed doesn't matter
            // This just describes the current behavior, please move the order around as needed
            const spy = jest.spyOn(service, "removeOneEnrollmentPeriodState");
            const spy2 = jest.spyOn(service, "removeOneCoverageLevelState");
            const spy3 = jest.spyOn(service, "removeOneBenefitAmountState");

            // Default states will include an instance with planOfferingId 222

            const defaultEliminationPeriodStates = eliminationPeriodStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, eliminationPeriod: { id: 1 } as EliminationPeriod },
                    { panelIdentifiers: { planOfferingId: 222 }, eliminationPeriod: { id: 2 } as EliminationPeriod },
                    { panelIdentifiers: { planOfferingId: 333 }, eliminationPeriod: { id: 3 } as EliminationPeriod },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.eliminationPeriodStates,
            );

            const defaultCoverageLevelStates = coverageLevelStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, coverageLevel: { id: 1 } as CoverageLevel },
                    { panelIdentifiers: { planOfferingId: 222 }, coverageLevel: { id: 2 } as CoverageLevel },
                    { panelIdentifiers: { planOfferingId: 333 }, coverageLevel: { id: 3 } as CoverageLevel },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.coverageLevelStates,
            );

            const defaultBenefitAmountStates = benefitAmountStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, benefitAmount: 1 },
                    { panelIdentifiers: { planOfferingId: 222 }, benefitAmount: 2 },
                    { panelIdentifiers: { planOfferingId: 333 }, benefitAmount: 3 },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.benefitAmountStates,
            );

            const defaultState: ProducerShopState = {
                ...PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE,
                eliminationPeriodStates: defaultEliminationPeriodStates,
                benefitAmountStates: defaultBenefitAmountStates,
                coverageLevelStates: defaultCoverageLevelStates,
            };

            // Expected states will exclude an instance with planOfferingId 222

            const expectedEliminationPeriodStates = eliminationPeriodStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, eliminationPeriod: { id: 1 } as EliminationPeriod },
                    { panelIdentifiers: { planOfferingId: 333 }, eliminationPeriod: { id: 3 } as EliminationPeriod },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.eliminationPeriodStates,
            );

            const expectedCoverageLevelStates = coverageLevelStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, coverageLevel: { id: 1 } as CoverageLevel },
                    { panelIdentifiers: { planOfferingId: 333 }, coverageLevel: { id: 3 } as CoverageLevel },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.coverageLevelStates,
            );

            const expectedBenefitAmountStates = benefitAmountStatesAdapter.addMany(
                [
                    { panelIdentifiers: { planOfferingId: 111 }, benefitAmount: 1 },
                    { panelIdentifiers: { planOfferingId: 333 }, benefitAmount: 3 },
                ],
                PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE.benefitAmountStates,
            );

            // Initalize state of ProducerShopComponentStore
            service.setState(defaultState);

            service.removeLocalState({ planOfferingId: 222 });

            service.state$.subscribe((state) => {
                // Check if expected result is found
                expect(state).toStrictEqual({
                    ...defaultState,
                    eliminationPeriodStates: expectedEliminationPeriodStates,
                    coverageLevelStates: expectedCoverageLevelStates,
                    benefitAmountStates: expectedBenefitAmountStates,
                });

                // Confirm that each local state removes as expected
                expect(spy).toBeCalledWith(defaultState, { planOfferingId: 222 });
                expect(spy2).toBeCalledWith(
                    {
                        ...defaultState,
                        eliminationPeriodStates: expectedEliminationPeriodStates,
                    },
                    { planOfferingId: 222 },
                );
                expect(spy3).toBeCalledWith(
                    {
                        ...defaultState,
                        eliminationPeriodStates: expectedEliminationPeriodStates,
                        coverageLevelStates: expectedCoverageLevelStates,
                    },
                    { planOfferingId: 222 },
                );

                done();
            });
        });
    });
});
