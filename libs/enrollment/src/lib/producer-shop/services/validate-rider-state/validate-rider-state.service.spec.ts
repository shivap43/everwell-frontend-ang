import { TestBed } from "@angular/core/testing";
import { CoverageLevel, EnrollmentRequirement } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { DependencyType } from "../enrollment-requirements/enrollment-requirements.model";
import {
    BenefitAmountState,
    CoverageLevelState,
    PanelIdentifiers,
} from "../producer-shop-component-store/producer-shop-component-store.model";
import { RiderDisabledStateService } from "../rider-disabled-state/rider-disabled-state.service";
import { EnrollmentRequirementPlanType, RiderState } from "../rider-state/rider-state.model";
import { RiderStateService } from "../rider-state/rider-state.service";

import { ValidateRiderStateService } from "./validate-rider-state.service";

// Mock LanguageService converts tagName to the expected language string (just the tagName)
const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages, tagName) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages, tagName) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

describe("ValidateRiderStateService", () => {
    let service: ValidateRiderStateService;
    let riderDisabledStateService: RiderDisabledStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ValidateRiderStateService,
                RiderDisabledStateService,
                RiderStateService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        });

        service = TestBed.inject(ValidateRiderStateService);
        riderDisabledStateService = TestBed.inject(RiderDisabledStateService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("riderStateShouldBeChecked()", () => {
        it("should return true if rider is mandatory", () => {
            const riderState = {
                disabled: false,
                riderPlanId: 444,
                riderHasPrice: true,
            } as RiderState;

            const result = service.riderStateShouldBeChecked(riderState, [], { disabled: true }, [111, 222, 333, 444, 555], [], []);

            expect(result).toBe(true);
        });

        it("should return false if rider is NOT mandatory, NOT ADD ON Riders NOT involved with Broker Plans, and not previously checked", () => {
            const riderState = {
                disabled: false,
            } as RiderState;

            const result = service.riderStateShouldBeChecked(riderState, [], { disabled: true }, [111, 222, 333, 555], [], []);

            expect(result).toBe(false);
        });

        it("should return true if ADD ON Rider Selection related EnrollmentRequirements are satisfied", () => {
            const riderState = {
                riderPlanId: 111,
                checked: false,
                disabled: true,
                enrollmentRequirements: [
                    {
                        relatedPlanId: 222,
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                    },
                ],
            } as RiderState;

            const otherRiderStates = [
                {
                    checked: true,
                    riderPlanId: 222,
                },
            ] as RiderState[];

            const result = service.riderStateShouldBeChecked(riderState, otherRiderStates, { disabled: false }, [], [111], []);

            expect(result).toBe(true);
        });

        it("should return true if Rider is related to Broker Plan and Broker related EnrollmentRequirements are satisfied", () => {
            const riderState = {
                riderPlanId: 333,
                checked: false,
                disabled: true,
                brokerSelected: true,
                enrollmentRequirements: [
                    {
                        relatedPlanId: 222,
                        dependencyType: DependencyType.REQUIRES_BROKERS_PLAN_SELECTION,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                    },
                ],
            } as RiderState;

            const otherRiderStates = [
                {
                    checked: true,
                    riderPlanId: 222,
                },
            ] as RiderState[];

            const result = service.riderStateShouldBeChecked(riderState, otherRiderStates, { disabled: false }, [], [], [333]);

            expect(result).toBe(true);
        });

        it("should default to returning previous checked state", () => {
            const uncheckedRiderState = {
                checked: false,
            } as RiderState;

            const uncheckedResult = service.riderStateShouldBeChecked(
                uncheckedRiderState,
                [],
                {
                    disabled: false,
                },
                [],
                [],
                [],
            );

            expect(uncheckedRiderState.checked).toBe(false);

            expect(uncheckedResult).toBe(false);

            const checkedRiderState = {
                checked: true,
            } as RiderState;

            const checkedResult = service.riderStateShouldBeChecked(checkedRiderState, [], { disabled: false }, [], [], []);

            expect(checkedRiderState.checked).toBe(true);

            expect(checkedResult).toBe(true);
        });
    });

    describe("getValidatedRiderState()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should update checked, disabled, disableText", () => {
            const riderState = {
                riderPlanId: 111,
                disabled: true,
                disableText: "should be replaced",
                checked: false,
            } as RiderState;

            const coverageLevel = {
                displayOrder: 3,
                iconLocation: "one_parent_family.jpeg",
                id: 29,
                name: "One Parent Family",
                retainCoverageLevel: false,
                spouseCovered: false,
            } as CoverageLevel;

            const panelIdentifiers = {
                cartId: undefined,
                enrollmentId: undefined,
                planOfferingId: 111,
            } as PanelIdentifiers;

            const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
            const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

            jest.spyOn(riderDisabledStateService, "getRiderDisabledState").mockReturnValueOnce({
                disabled: false,
                disableText: "some new label",
            });

            jest.spyOn(service, "riderStateShouldBeChecked").mockReturnValueOnce(true);

            const result = service.getValidatedRiderState(riderState, [], {
                memberHasSpouse: false,
                memberHasChild: true,
                enrollments: [],
                enrollmentRiders: [],
                mandatoryRiderPlanIds: [],
                addOnRiderPlanIds: [],
                riderBrokerPlanIds: [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            });

            expect(result).toStrictEqual({
                riderPlanId: 111,
                disabled: false,
                disableText: "some new label",
                riderParentPlanSelectedBenefitAmount: undefined,
                checked: true,
            });
        });
    });

    describe("getValidatedRiderStates()", () => {
        it("should not mutate original array or the RiderStates of the array", () => {
            const riderStates = [
                {
                    identifiers: {},
                    riderPlanId: 111,
                    enrollmentRequirements: [],
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    checked: false,
                    disabled: false,
                },
                {
                    identifiers: {},
                    riderPlanId: 222,
                    enrollmentRequirements: [],
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    checked: false,
                    disabled: false,
                },
                {
                    identifiers: {},
                    riderPlanId: 333,
                    enrollmentRequirements: [],
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    checked: false,
                    disabled: false,
                },
            ] as RiderState[];

            const coverageLevel = {
                displayOrder: 3,
                iconLocation: "one_parent_family.jpeg",
                id: 29,
                name: "One Parent Family",
                retainCoverageLevel: false,
                spouseCovered: false,
            } as CoverageLevel;

            const panelIdentifiers = {
                cartId: undefined,
                enrollmentId: undefined,
                planOfferingId: 111,
            } as PanelIdentifiers;

            const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
            const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

            const results = service.getValidatedRiderStates(
                riderStates,
                {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                },
                true,
            );

            // Shouldn't change the values of the array (not the important part of the test)
            expect(riderStates).toStrictEqual(results);
            // This part is important, the reference to the array shouldn't be the same,
            // nor should any of the RiderState objects have the same reference
            expect(riderStates).not.toBe(results);
            expect(riderStates[0]).not.toBe(results[0]);
            expect(riderStates[1]).not.toBe(results[1]);
            expect(riderStates[2]).not.toBe(results[2]);
        });

        it("should return a validated array of RiderStates based on the given array and other arguments", () => {
            const riderStates = [
                {
                    riderPlanId: 111,
                },
                {
                    riderPlanId: 222,
                },
                {
                    riderPlanId: 333,
                },
            ] as RiderState[];
            const coverageLevel = {
                displayOrder: 3,
                iconLocation: "one_parent_family.jpeg",
                id: 29,
                name: "One Parent Family",
                retainCoverageLevel: false,
                spouseCovered: false,
            } as CoverageLevel;

            const panelIdentifiers = {
                cartId: undefined,
                enrollmentId: undefined,
                planOfferingId: 111,
            } as PanelIdentifiers;

            const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
            const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

            const spy = jest.spyOn(service, "getValidatedRiderState").mockImplementation((riderState) => riderState);

            const result = service.getValidatedRiderStates(
                riderStates,
                {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                },
                true,
            );

            expect(spy).nthCalledWith(
                1,
                {
                    riderPlanId: 111,
                },
                riderStates,
                {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                },
                true,
            );
            expect(spy).nthCalledWith(
                2,
                {
                    riderPlanId: 222,
                },
                riderStates,
                {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                },
                true,
            );
            expect(spy).nthCalledWith(
                3,
                {
                    riderPlanId: 333,
                },
                riderStates,
                {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                },
                true,
            );

            expect(result).toStrictEqual([
                {
                    riderPlanId: 111,
                },
                {
                    riderPlanId: 222,
                },
                {
                    riderPlanId: 333,
                },
            ]);
        });

        describe("should avoid infinite loop when validating other RiderStates", () => {
            const allDisabledRiderStates = [
                {
                    identifiers: {},
                    checked: false,
                    disabled: true,
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    riderPlanId: 111,
                    enrollmentRequirements: [
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 222,
                        },
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 333,
                        },
                    ] as EnrollmentRequirement[],
                },
                {
                    identifiers: {},
                    checked: false,
                    disabled: true,
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    riderPlanId: 222,
                    enrollmentRequirements: [
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 111,
                        },
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 333,
                        },
                    ] as EnrollmentRequirement[],
                },
                {
                    identifiers: {},
                    checked: false,
                    disabled: true,
                    disableText: undefined,
                    riderParentPlanSelectedBenefitAmount: undefined,
                    riderPlanId: 333,
                    enrollmentRequirements: [
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 111,
                        },
                        {
                            dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                            relatedPlanId: 222,
                        },
                    ] as EnrollmentRequirement[],
                },
            ] as RiderState[];

            it("should return array with one checked since the original has only one is checked", () => {
                const riderStatesWithOneChecked = [
                    { ...allDisabledRiderStates[0], checked: true, disabled: false },
                    { ...allDisabledRiderStates[1], checked: false, disabled: true },
                    { ...allDisabledRiderStates[2], checked: false, disabled: true },
                ];
                const coverageLevel = {
                    displayOrder: 3,
                    iconLocation: "one_parent_family.jpeg",
                    id: 29,
                    name: "One Parent Family",
                    retainCoverageLevel: false,
                    spouseCovered: false,
                } as CoverageLevel;

                const panelIdentifiers = {
                    cartId: undefined,
                    enrollmentId: undefined,
                    planOfferingId: 111,
                } as PanelIdentifiers;

                const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
                const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

                const result = service.getValidatedRiderStates(riderStatesWithOneChecked, {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                });

                // Should allow this since only one being checked is okay
                expect(result).toStrictEqual(riderStatesWithOneChecked);
            });

            it("should return array with one checked if the original has two checked", () => {
                const riderStatesWithTwoChecked = [
                    { ...allDisabledRiderStates[0], checked: true, disabled: false },
                    { ...allDisabledRiderStates[1], checked: true, disabled: false },
                    { ...allDisabledRiderStates[2], checked: false, disabled: true },
                ];
                const coverageLevel = {
                    displayOrder: 3,
                    iconLocation: "one_parent_family.jpeg",
                    id: 29,
                    name: "One Parent Family",
                    retainCoverageLevel: false,
                    spouseCovered: false,
                } as CoverageLevel;

                const panelIdentifiers = {
                    cartId: undefined,
                    enrollmentId: undefined,
                    planOfferingId: 111,
                } as PanelIdentifiers;

                const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
                const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

                const result = service.getValidatedRiderStates(riderStatesWithTwoChecked, {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                });

                // Should allow this since only one being checked is okay
                expect(result).toStrictEqual(allDisabledRiderStates);
            });

            it("should return array with one checked if the original has three checked", () => {
                const riderStatesWithThreeChecked = [
                    { ...allDisabledRiderStates[0], checked: true, disabled: false },
                    { ...allDisabledRiderStates[1], checked: true, disabled: false },
                    { ...allDisabledRiderStates[2], checked: true, disabled: false },
                ];
                const coverageLevel = {
                    displayOrder: 3,
                    iconLocation: "one_parent_family.jpeg",
                    id: 29,
                    name: "One Parent Family",
                    retainCoverageLevel: false,
                    spouseCovered: false,
                } as CoverageLevel;

                const panelIdentifiers = {
                    cartId: undefined,
                    enrollmentId: undefined,
                    planOfferingId: 111,
                } as PanelIdentifiers;

                const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
                const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];

                const result = service.getValidatedRiderStates(riderStatesWithThreeChecked, {
                    memberHasSpouse: false,
                    memberHasChild: false,
                    enrollments: [],
                    enrollmentRiders: [],
                    mandatoryRiderPlanIds: [],
                    addOnRiderPlanIds: [],
                    riderBrokerPlanIds: [],
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                });

                // Should allow this since only one being checked is okay
                expect(result).toStrictEqual(allDisabledRiderStates);
            });
        });
    });
});
