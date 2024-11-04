import { TestBed } from "@angular/core/testing";
import {
    AsyncStatus,
    CarrierId,
    Characteristics,
    CoverageLevel,
    EnrollmentMethod,
    EnrollmentRider,
    Plan,
    PlanOffering,
    PlanOfferingPricing,
    Product,
    TaxStatus,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { PlanOfferingsSelectors, PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import {
    coverageLevelsEntityAdapter,
    planOfferingsEntityAdapter,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { SHARED_FEATURE_KEY, SharedPartialState } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import { PlanPanelService } from "../plan-panel/plan-panel.service";
import { AddRiderOptions } from "../producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../producer-shop-helper/producer-shop-helper.service";
import { RiderState, RiderStateValidationOptions } from "../rider-state/rider-state.model";
import { ValidateRiderStateService } from "../validate-rider-state/validate-rider-state.service";
import { RiderComponentStoreService } from "./rider-component-store.service";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import {
    PRODUCT_OFFERINGS_FEATURE_KEY,
    ProductOfferingsPartialState,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { productOfferingSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.state";
import { HttpClient, HttpHandler } from "@angular/common/http";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { mockStore, mockRouter, mockDatePipe } from "@empowered/testing";

const MOCK_RIDER_STATE = {
    checked: false,
    disableText: undefined,
    disabled: false,
    enrollmentRequirements: [],
    riderParentPlanSelectedBenefitAmount: undefined,
} as RiderState;

/**
 * Everything is false or empty array
 */
const MOCK_RIDER_STATE_VALIDATION_OPTIONS: RiderStateValidationOptions = {
    memberHasChild: false,
    memberHasSpouse: false,
    enrollments: [],
    enrollmentRiders: [],
    mandatoryRiderPlanIds: [],
    addOnRiderPlanIds: [],
    riderBrokerPlanIds: [],
    allBaseCoverageLevels: [],
    allBaseBenefitAmounts: [],
};

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

describe("RiderComponentStoreService", () => {
    let service: RiderComponentStoreService;
    let validateRiderStateService: ValidateRiderStateService;
    let planOfferingService: PlanOfferingService;
    let initialState: AccountsPartialState &
    ProductOfferingsPartialState &
    PlanOfferingsPartialState &
    MembersPartialState &
    SharedPartialState;

    beforeEach(() => {
        initialState = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
            },
            [MEMBERS_FEATURE_KEY]: {
                ...MembersState.initialState,
                selectedMemberId: 333,
                memberContactsEntities: memberContactsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: mockMemberContacts,
                            error: null,
                        },
                    },
                    { ...MembersState.initialState.memberContactsEntities },
                ),
            },
            [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                ...ProductOfferingsState.initialState,
                selectedReferenceDate: "1990-09-09",
                productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111, referenceDate: "1990-09-09" },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [],
                            error: null,
                        },
                    },
                    { ...ProductOfferingsState.initialState.productOfferingSetsEntities },
                ),
            },
            [SHARED_FEATURE_KEY]: {
                ...SharedState.initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
                selectedHeadsetState: { abbreviation: "AZ", name: "Arizona" },
                countryStates: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            name: "Arizona",
                            abbreviation: "AZ",
                        },
                    ],
                    error: null,
                },
            },
            [PLAN_OFFERINGS_FEATURE_KEY]: {
                ...PlanOfferingsState.initialState,
                selectedPlanId: 11,
                selectedPlanOfferingId: 555,
                planOfferingsEntities: planOfferingsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                            enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                            stateAbbreviation: "AZ",
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                    taxStatus: TaxStatus.POSTTAX,
                                    productOfferingId: 11,
                                    plan: {
                                        carrierId: CarrierId.AFLAC,
                                        characteristics: ["SUPPLEMENTARY"] as Characteristics[],
                                        product: { id: 8 } as Product,
                                    } as Plan,
                                } as PlanOffering,
                            ],
                            error: null,
                        },
                    },
                    { ...PlanOfferingsState.initialState.planOfferingsEntities },
                ),
                coverageLevelsEntities: coverageLevelsEntityAdapter.setMany(
                    [
                        {
                            identifiers: { mpGroup: 111, planId: 11, fetchRetainRiders: false },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "Individual", id: 1, eliminationPeriod: "0/7" } as CoverageLevel],
                                error: null,
                            },
                        },
                        {
                            identifiers: { mpGroup: 111, planId: 22, parentCoverageLevelId: 333, fetchRetainRiders: true },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "some rider coverage level", id: 2, eliminationPeriod: "4/7" } as CoverageLevel],
                                error: null,
                            },
                        },
                    ],
                    { ...PlanOfferingsState.initialState.coverageLevelsEntities },
                ),
            },
        };

        TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                HttpClient,
                HttpHandler,
                provideMockStore({ initialState }),
                RiderComponentStoreService,
                PlanPanelService,
                ProducerShopComponentStoreService,
                ValidateRiderStateService,
                ProducerShopHelperService,
                PlanOfferingService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
        });

        service = TestBed.inject(RiderComponentStoreService);
        validateRiderStateService = TestBed.inject(ValidateRiderStateService);
        planOfferingService = TestBed.inject(PlanOfferingService);
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("selectAllRiderStates()", () => {
        it("should get all RiderStates from ComponentStore", (done) => {
            expect.assertions(1);

            const mockRiderStates = [
                { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
            ];

            const mockValue = {
                ...MOCK_RIDER_STATE_VALIDATION_OPTIONS,
                riderStates: mockRiderStates,
            } as AddRiderOptions;

            service.upsertRiderStates(mockValue);

            service.selectAllRiderStates().subscribe((value) => {
                expect(value).toStrictEqual(mockRiderStates);
                done();
            });
        });
    });

    describe("selectRiderStates()", () => {
        it("should get RiderStates from ComponentStore by PanelIdentifiers", (done) => {
            expect.assertions(1);

            const mockRiderStates = [
                { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 3, planOfferingId: 222 } },
            ];

            const mockValue = {
                ...MOCK_RIDER_STATE_VALIDATION_OPTIONS,
                riderStates: mockRiderStates,
            } as AddRiderOptions;

            service.upsertRiderStates(mockValue);

            service.selectRiderStates({ planOfferingId: 111 }).subscribe((value) => {
                expect(value).toStrictEqual([
                    { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                ]);
                done();
            });
        });
    });

    describe("selectAllValidatedRiderStates()", () => {
        it("should get all RiderStates and validate them using RiderStateValidationOptions", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(validateRiderStateService, "getValidatedRiderStates");

            jest.spyOn(service, "selectAllRiderStates").mockReturnValueOnce(
                of([
                    { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                ]),
            );

            jest.spyOn(service, "getRiderStateValidationOptions").mockReturnValueOnce(of({ ...MOCK_RIDER_STATE_VALIDATION_OPTIONS }));

            jest.spyOn(planOfferingService, "planOfferingHasSupplementaryPlan").mockReturnValueOnce(false);
            service.selectAllValidatedRiderStates().subscribe((value) => {
                expect(spy).toBeCalledWith(
                    [
                        { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                        { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                    ],
                    { ...MOCK_RIDER_STATE_VALIDATION_OPTIONS },
                    false,
                );
                expect(value).toStrictEqual([
                    { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                ]);
                done();
            });
        });
    });

    describe("selectValidatedRiderStates()", () => {
        it("should get RiderStates filtered by PanelIdentifiers and validate them using RiderStateValidationOptions", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "selectAllValidatedRiderStates").mockReturnValueOnce(
                of([
                    { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 3, planOfferingId: 222 } },
                ]),
            );

            service.selectValidatedRiderStates({ planOfferingId: 111 }).subscribe((value) => {
                expect(value).toStrictEqual([
                    { ...MOCK_RIDER_STATE, identifiers: { riderPlanOfferingId: 1, planOfferingId: 111 } },
                    { ...MOCK_RIDER_STATE, checked: true, identifiers: { riderPlanOfferingId: 2, planOfferingId: 111 } },
                ]);
                done();
            });
        });
    });

    describe("getBaseCoveragelevels()", () => {
        it("should get BASE plan's CoverageLevels from global state", (done) => {
            expect.assertions(1);

            service.getBaseCoveragelevels(11).subscribe((value) => {
                expect(value).toStrictEqual([{ name: "Individual", id: 1, eliminationPeriod: "0/7" } as CoverageLevel]);
                done();
            });
        });
    });

    describe("getRiderCoverageLevels()", () => {
        it("should get RIDER plan's CoverageLevels from global state", (done) => {
            expect.assertions(1);

            service.getRiderCoverageLevels(22, 333, true).subscribe((value) => {
                expect(value).toStrictEqual([{ name: "some rider coverage level", id: 2, eliminationPeriod: "4/7" } as CoverageLevel]);
                done();
            });
        });
    });

    describe("getRiderPlanOfferingPricings()", () => {
        it("should get RIDER PlanOfferingPricings from global state", () => {
            const spy = jest.spyOn(PlanOfferingsSelectors, "getPlanOfferingPricings");

            service.getRiderPlanOfferingPricings(
                { riderPlanOfferingId: 111, riderParentPlanId: 777 } as RiderState,
                222,
                "some date",
                { memberIsTobaccoUser: true, spouseIsTobaccoUser: false },
                true,
                333,
                444,
                555,
            );
            expect(spy).toBeCalledWith(true, true, false, 111, 222, "some date", 777, 333, 444, 555);
        });
    });

    describe("getCoverageLevelByName()", () => {
        it("should get CoverageLevel by name", () => {
            expect(service.getCoverageLevelByName([{ name: "moo" }] as CoverageLevel[], "moo", [], false, "")).toStrictEqual({
                name: "moo",
            });
        });

        it("should return null if no name", () => {
            expect(service.getCoverageLevelByName([], null, [], false, "")).toBeNull();
        });
    });

    describe("getFilteredRiderPlanOfferingPricing()", () => {
        it("should exclude RIDER PlanOfferingPricings with mismatched selectedBenefitAmount", () => {
            const riderStates = { selectedCoverageLevelName: "some coverage level name", selectedBenefitAmount: 111 } as RiderState;
            const riderPlanOfferingPricings = [{ coverageLevelId: 1, benefitAmount: 222 }] as PlanOfferingPricing[];
            const coverageLevels = [{ id: 1, name: "some coverage level name" }] as CoverageLevel[];

            expect(
                service.getFilteredRiderPlanOfferingPricing(riderStates, riderPlanOfferingPricings, coverageLevels, [], false, 1),
            ).toBeNull();
        });

        it("should exclude RIDER PlanOfferingPricings with mismatched selected CoverageLevel", () => {
            const riderStates = { selectedCoverageLevelName: "some coverage level name", selectedBenefitAmount: 111 } as RiderState;
            const riderPlanOfferingPricings = [{ coverageLevelId: 999, benefitAmount: 111 }] as PlanOfferingPricing[];
            const coverageLevels = [{ id: 1, name: "some coverage level name" }] as CoverageLevel[];

            expect(
                service.getFilteredRiderPlanOfferingPricing(riderStates, riderPlanOfferingPricings, coverageLevels, [], false, 1),
            ).toBeNull();
        });

        it("should return RIDER PlanOfferingPricings with matching selected CoverageLevel", () => {
            const riderStates = { selectedCoverageLevelName: "some other coverage level name", selectedBenefitAmount: 111 } as RiderState;
            const riderPlanOfferingPricings = [
                { coverageLevelId: 1, benefitAmount: 111 },
                { coverageLevelId: 2, benefitAmount: 111 },
            ] as PlanOfferingPricing[];
            const coverageLevels = [
                { id: 1, name: "some coverage level name" },
                { id: 2, name: "some other coverage level name" },
            ] as CoverageLevel[];

            expect(
                service.getFilteredRiderPlanOfferingPricing(riderStates, riderPlanOfferingPricings, coverageLevels, [], false, 1),
            ).toStrictEqual({
                coverageLevelId: 2,
                benefitAmount: 111,
            });
        });

        it("should return first RIDER PlanOfferingPricings with matching coverageLevel id if RiderState doesn't have a selected CoverageLevel", () => {
            const riderStates = { selectedCoverageLevelName: "some other coverage level name", selectedBenefitAmount: 111 } as RiderState;
            const riderPlanOfferingPricings = [
                { coverageLevelId: 1, benefitAmount: 111 },
                { coverageLevelId: 3, benefitAmount: 111 },
            ] as PlanOfferingPricing[];
            const coverageLevels = [
                { id: 1, name: "some coverage level name" },
                { id: 3, name: "some third coverage level name" },
            ] as CoverageLevel[];

            expect(
                service.getFilteredRiderPlanOfferingPricing(riderStates, riderPlanOfferingPricings, coverageLevels, [], false, 1),
            ).toStrictEqual({
                coverageLevelId: 1,
                benefitAmount: 111,
            });
        });

        it("should return null if there is NO PlanOfferingPricings with matching coverageLevel id", () => {
            const riderStates = { selectedCoverageLevelName: "some unknown coverage level name", selectedBenefitAmount: 111 } as RiderState;
            const riderPlanOfferingPricings = [
                { coverageLevelId: 111, benefitAmount: 111 },
                { coverageLevelId: 222, benefitAmount: 111 },
            ] as PlanOfferingPricing[];
            const coverageLevels = [
                { id: -111, name: "some coverage level name" },
                { id: -222, name: "some other coverage level name" },
            ] as CoverageLevel[];

            expect(
                service.getFilteredRiderPlanOfferingPricing(riderStates, riderPlanOfferingPricings, coverageLevels, [], false, 1),
            ).toBeNull();
        });
    });

    describe("getBaseCoverageLevelRiderPlanOfferingPricings()", () => {
        it("should emit empty Array if there are NO BASE CoverageLevels", (done) => {
            expect.assertions(1);

            service.getBaseCoverageLevelRiderPlanOfferingPricings({} as RiderState, [], [], [], false).subscribe((value) => {
                expect(value).toStrictEqual([]);
                done();
            });
        });

        it("should group RIDER PlanOfferingPricing with each BASE CoverageLevel", (done) => {
            expect.assertions(3);

            const riderState = {
                riderPlanId: 444,
                selectedBenefitAmount: 333,
            } as RiderState;
            const baseCoverageLevels = [
                { id: 1, name: "some base coverage level" },
                { id: 2, name: "some other base coverage level" },
            ] as CoverageLevel[];
            const riderPlanOfferingPricings = [
                { coverageLevelId: 111, benefitAmount: 333 },
                { coverageLevelId: 222, benefitAmount: 333 },
            ] as PlanOfferingPricing[];

            const spy = jest
                .spyOn(service, "getRiderCoverageLevels")
                .mockImplementation((riderPlanId: number, baseCoverageLevelId: number) => {
                    if (baseCoverageLevelId === 1) {
                        return of([{ id: 111, name: "some coverage level name" }]);
                    }

                    return of([{ id: 222, name: "some other coverage level name" }]);
                });

            service
                .getBaseCoverageLevelRiderPlanOfferingPricings(riderState, baseCoverageLevels, [], riderPlanOfferingPricings, false)
                .subscribe((value) => {
                    expect(spy).nthCalledWith(1, 444, 1, false);
                    expect(spy).nthCalledWith(2, 444, 2, false);
                    expect(value).toStrictEqual([
                        {
                            riderPlanOfferingPricing: { coverageLevelId: 111, benefitAmount: 333 },
                            baseCoverageLevel: { id: 1, name: "some base coverage level" },
                        },
                        {
                            riderPlanOfferingPricing: { coverageLevelId: 222, benefitAmount: 333 },
                            baseCoverageLevel: { id: 2, name: "some other base coverage level" },
                        },
                    ]);
                    done();
                });
        });
    });

    describe("getBaseBenefitAmount()", () => {
        it("should return null if supplementaryPlan and BASE PlanId does NOT match riderParentPlanId", () => {
            expect(service.getBaseBenefitAmount({ riderParentPlanId: 111 } as RiderState, [], null, 222, true)).toBeNull();
        });

        it("should return selected RIDER BenefitAmount if it exists", () => {
            expect(
                service.getBaseBenefitAmount({ riderParentPlanId: 111, selectedBenefitAmount: 333 } as RiderState, [], null, 111, true),
            ).toBe(null);
        });

        it("should return selected RIDER ParentPlan BenefitAmount if it exists", () => {
            expect(
                service.getBaseBenefitAmount(
                    { riderParentPlanId: 111, riderParentPlanSelectedBenefitAmount: 444 } as RiderState,
                    [],
                    null,
                    111,
                    true,
                ),
            ).toBe(null);
        });

        it("should return BASE BenefitAmount if RIDER Plan id is Parent Plan id", () => {
            expect(service.getBaseBenefitAmount({ planId: 111, riderParentPlanId: 111 } as RiderState, [], 555, 111, true)).toBe(555);
        });

        it("should return RIDER Plan id is a mandatory RiderPlan id", () => {
            expect(
                service.getBaseBenefitAmount({ planId: -1, riderPlanId: 777, riderParentPlanId: 111 } as RiderState, [777], 555, 111, true),
            ).toBe(555);
        });

        it("should return null if RIDER Plan is not mandatory and Plan id isn't Parent Plan id", () => {
            expect(
                service.getBaseBenefitAmount({ planId: -1, riderPlanId: -2, riderParentPlanId: 111 } as RiderState, [888], 555, 111, true),
            ).toBe(555);
        });
    });

    describe("getParentCoverageLevelId()", () => {
        it("should return null if RiderState does NOT have ParentPlan id", () => {
            expect(service.getParentCoverageLevelId({} as RiderState, 111)).toBeNull();
        });

        it("should return RiderState's parent CoverageLevel id if RiderState does have ParentPlan id", () => {
            expect(service.getParentCoverageLevelId({ parentPlanCoverageLevelId: 1, riderParentPlanId: 111 } as RiderState, 111)).toBe(1);
        });
    });

    describe("getPanelIdentifiersFromRiderState()", () => {
        it("should get PlanPanel identifier from RiderState", () => {
            expect(
                service.getPanelIdentifiersFromRiderState({
                    identifiers: {
                        planOfferingId: 1,
                        cartId: 2,
                        enrollmentId: 3,
                    },
                } as RiderState),
            ).toStrictEqual({
                planOfferingId: 1,
                cartId: 2,
                enrollmentId: 3,
            });
        });
    });

    describe("isPanelRiderState()", () => {
        it("should return true if RiderState has matching identifiers with PanelIdentifier", () => {
            expect(
                service.isPanelRiderState(
                    {
                        planOfferingId: 1,
                        cartId: 2,
                        enrollmentId: 3,
                    },
                    {
                        identifiers: {
                            planOfferingId: 1,
                            cartId: 2,
                            enrollmentId: 3,
                        },
                    } as RiderState,
                ),
            ).toBe(true);
        });
    });

    describe("getUncheckedRiderStates()", () => {
        it("should uncheck RiderStates that are NOT disabled", () => {
            expect(
                service.getUncheckedRiderStates([
                    { checked: true, coverageLevelNames: [], benefitAmounts: [], eliminationPeriodNames: [] } as RiderState,
                ]),
            ).toStrictEqual([
                {
                    checked: false,
                    coverageLevelNames: [],
                    benefitAmounts: [],
                    eliminationPeriodNames: [],
                    selectedCoverageLevelName: null,
                    selectedBenefitAmount: null,
                    selectedEliminationPeriodName: null,
                } as RiderState,
            ]);
        });

        it("should ignore RiderStates that are disabled", () => {
            expect(
                service.getUncheckedRiderStates([
                    {
                        checked: true,
                        disabled: true,
                        coverageLevelNames: [],
                        benefitAmounts: [],
                        eliminationPeriodNames: [],
                    } as RiderState,
                ]),
            ).toStrictEqual([
                {
                    checked: true,
                    disabled: true,
                    coverageLevelNames: [],
                    benefitAmounts: [],
                    eliminationPeriodNames: [],
                    selectedCoverageLevelName: null,
                    selectedBenefitAmount: null,
                    selectedEliminationPeriodName: null,
                } as RiderState,
            ]);
        });

        it("should check RiderStates with matching EnrollmentRider.Plan.id and RiderState.riderPlanId", () => {
            expect(
                service.getUncheckedRiderStates(
                    [
                        {
                            checked: false,
                            riderPlanId: 111,
                            coverageLevelNames: [],
                            benefitAmounts: [],
                            eliminationPeriodNames: [],
                        } as RiderState,
                    ],
                    [{ plan: { id: 111 } } as EnrollmentRider],
                ),
            ).toStrictEqual([
                {
                    checked: true,
                    riderPlanId: 111,
                    coverageLevelNames: [],
                    benefitAmounts: [],
                    eliminationPeriodNames: [],
                    selectedCoverageLevelName: null,
                    selectedBenefitAmount: null,
                    selectedEliminationPeriodName: null,
                } as RiderState,
            ]);
        });
    });
});
