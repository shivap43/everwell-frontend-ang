import { TestBed } from "@angular/core/testing";
import { EnrollmentRequirement } from "@empowered/constants";
import { EnrollmentRequirementPlanType } from "../rider-state/rider-state.model";
import { BenefitAmountModifier, DependencyType, EnrollmentRequirementComparisonValues } from "./enrollment-requirements.model";
import { EnrollmentRequirementsService } from "./enrollment-requirements.service";

describe("EnrollmentRequirementsService", () => {
    let service: EnrollmentRequirementsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EnrollmentRequirementsService],
        });

        service = TestBed.inject(EnrollmentRequirementsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("getEnrollmentRequirementWithoutValues()", () => {
        it("should return the first EnrollmentRequirement that doesn't satisfies any of the comparison values", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const valueSets = [
                { relatedPlanId: 111 },
                // Expecting to not have EnrollmentRequirementComparisonValues with relatedPlanId 222
                { relatedPlanId: 333 },
            ] as EnrollmentRequirementComparisonValues[];

            expect(service.getEnrollmentRequirementWithoutValues(enrollmentRequirements, valueSets)).toStrictEqual({
                relatedPlanId: 222,
            });
        });

        it("should return null if every EnrollmentRequirement has some comparison value", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const valueSets = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
                { relatedPlanId: 444 },
            ] as EnrollmentRequirementComparisonValues[];

            expect(service.getEnrollmentRequirementWithoutValues(enrollmentRequirements, valueSets)).toBeNull();
        });
    });

    describe("getInvalidRequiredEnrollmentRequirement()", () => {
        it("should get first invalid REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN EnrollmentRequirement", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithoutValues");

            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { relatedPlanId: 444 },
            ] as EnrollmentRequirement[];

            // Expecting to not have planId 333
            const valueSets = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 444 },
            ] as EnrollmentRequirementComparisonValues[];

            const result = service.getInvalidRequiredEnrollmentRequirement(enrollmentRequirements, valueSets);

            expect(spy).toBeCalledWith(
                [
                    { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                    { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                ],
                valueSets,
            );
            expect(result).toStrictEqual({
                relatedPlanId: 333,
                dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
            });
        });

        it("should get return null if all EnrollmentRequirements are valid", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithoutValues");

            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { relatedPlanId: 444 },
            ] as EnrollmentRequirement[];

            // Expecting to not have planId 333
            const valueSets = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirementComparisonValues[];

            const result = service.getInvalidRequiredEnrollmentRequirement(enrollmentRequirements, valueSets);

            expect(spy).toBeCalledWith(
                [
                    { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                    { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                ],
                valueSets,
            );
            expect(result).toStrictEqual(null);
        });
    });

    describe("getInvalidSelectionEnrollmentRequirement()", () => {
        it("should get first invalid REQUIRES_SELECTION_IN_ANOTHER_PLAN EnrollmentRequirement", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithoutValues");

            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            // Expecting to not have planId 222
            const planIds = [111, 333];

            const result = service.getInvalidSelectionEnrollmentRequirement(enrollmentRequirements, planIds);

            expect(spy).toBeCalledWith(
                [{ relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN }],
                [
                    { relatedPlanId: 111, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                    { relatedPlanId: 333, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                ],
            );
            expect(result).toStrictEqual({
                relatedPlanId: 222,
                dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN,
            });
        });

        it("should get return null if all EnrollmentRequirements are valid", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithoutValues");

            const enrollmentRequirements = [
                { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN },
                { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const planIds = [111, 222];

            const result = service.getInvalidSelectionEnrollmentRequirement(enrollmentRequirements, planIds);

            expect(spy).toBeCalledWith(
                [
                    { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN },
                    { relatedPlanId: 222, dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN },
                ],
                [
                    { relatedPlanId: 111, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                    { relatedPlanId: 222, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                ],
            );
            expect(result).toBeNull();
        });
    });

    describe("getEnrollmentRequirementWithValue()", () => {
        it("should return the first EnrollmentRequirement that satisfies one of the comparison values", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const valueSets = [{ relatedPlanId: 222 }, { relatedPlanId: 333 }] as EnrollmentRequirementComparisonValues[];

            expect(service.getEnrollmentRequirementWithValue(enrollmentRequirements, valueSets)).toStrictEqual({
                relatedPlanId: 222,
            });
        });

        it("should return null if no EnrollmentRequirements are satisfied by any comparison value", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const valueSets = [{ relatedPlanId: 444 }, { relatedPlanId: 555 }] as EnrollmentRequirementComparisonValues[];

            expect(service.getEnrollmentRequirementWithValue(enrollmentRequirements, valueSets)).toBeNull();
        });
    });

    describe("getInvalidRequiredNonEnrollmentRequirement()", () => {
        it("should get first invalid REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN EnrollmentRequirement", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN },
                { relatedPlanId: 222 },
                { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN },
            ] as EnrollmentRequirement[];

            const valueSets = [{ relatedPlanId: 333 }] as EnrollmentRequirementComparisonValues[];

            expect(service.getInvalidRequiredNonEnrollmentRequirement(enrollmentRequirements, valueSets)).toStrictEqual({
                relatedPlanId: 333,
                dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
            });
        });

        it("should get return null if all EnrollmentRequirements are valid", () => {
            const enrollmentRequirements = [
                { relatedPlanId: 111 },
                { relatedPlanId: 222 },
                { relatedPlanId: 333 },
            ] as EnrollmentRequirement[];

            const valueSets = [{ relatedPlanId: 444 }, { relatedPlanId: 555 }] as EnrollmentRequirementComparisonValues[];

            expect(service.getInvalidRequiredNonEnrollmentRequirement(enrollmentRequirements, valueSets)).toBeNull();
        });
    });

    describe("getInvalidNonSelectionEnrollmentRequirement()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should get first invalid REQUIRES_NONSELECTION_IN_ANOTHER_PLAN EnrollmentRequirement", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithValue");

            const enrollmentRequirements = [
                { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                { relatedPlanId: 222 },
                { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
            ] as EnrollmentRequirement[];

            const planIds = [333];

            expect(service.getInvalidNonSelectionEnrollmentRequirement(enrollmentRequirements, planIds)).toStrictEqual({
                relatedPlanId: 333,
                dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
            });

            expect(spy).toBeCalledWith(
                [
                    { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                    { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                ],
                [{ relatedPlanId: 333, relatedPlanType: EnrollmentRequirementPlanType.RIDER }],
            );
        });

        it("should get return null if all EnrollmentRequirements are valid", () => {
            const spy = jest.spyOn(service, "getEnrollmentRequirementWithValue");

            const enrollmentRequirements = [
                { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                { relatedPlanId: 222 },
                { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
            ] as EnrollmentRequirement[];

            const planIds = [444, 555];

            expect(service.getInvalidNonSelectionEnrollmentRequirement(enrollmentRequirements, planIds)).toBeNull();

            expect(spy).toBeCalledWith(
                [
                    { relatedPlanId: 111, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                    { relatedPlanId: 333, dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN },
                ],

                [
                    { relatedPlanId: 444, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                    { relatedPlanId: 555, relatedPlanType: EnrollmentRequirementPlanType.RIDER },
                ],
            );
        });
    });

    describe("enrollmentRequirementsHasDependencyType()", () => {
        it("should return true if EnrollmentRequirements has DependencyType", () => {
            const enrollmentRequirements = [
                { dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD },
                { dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE },
                { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN },
            ] as EnrollmentRequirement[];

            const result = service.enrollmentRequirementsHasDependencyType(enrollmentRequirements, DependencyType.REQUIRES_ELIGIBLE_SPOUSE);

            expect(result).toBe(true);
        });

        it("should return false if EnrollmentRequirements DOES NOT have DependencyType", () => {
            const enrollmentRequirements = [
                { dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD },
                // Should be missing DependencyType.REQUIRES_ELIGIBLE_SPOUSE
                { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                { dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN },
            ] as EnrollmentRequirement[];

            const result = service.enrollmentRequirementsHasDependencyType(enrollmentRequirements, DependencyType.REQUIRES_ELIGIBLE_SPOUSE);

            expect(result).toBe(false);
        });
    });

    describe("enrollmentRequirementHasValues()", () => {
        it("should return false if EnrollmentRequirement has PlanType but passed planType doesn't match as expected", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                    relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                    relatedPlanType: EnrollmentRequirementPlanType.BASE,
                },
            );

            expect(result).toBe(false);
        });

        it("should return true if EnrollmentRequirement has no coverageLevels property and other values match", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                },
            );

            expect(result).toBe(true);
        });

        it("should return true if EnrollmentRequirement has no coverageLevels and other values match", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                    coverageLevels: [],
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                },
            );

            expect(result).toBe(true);
        });

        it("should return false if EnrollmentRequirement has coverageLevels but passed coverageLevelId isn't included", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                    coverageLevels: [{ id: 1 }, { id: 2 }, { id: 3 }],
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                    coverageLevelId: 4,
                },
            );

            expect(result).toBe(false);
        });

        it("should return false if EnrollmentRequirement has BenefitAmountModifier but passed benefitAmount doesn't compare as expected", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                    coverageLevels: [],
                    benefitAmountModifier: BenefitAmountModifier.EQUAL_TO,
                    benefitAmount: 9000,
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                    benefitAmount: -1,
                },
            );

            expect(result).toBe(false);
        });

        it("should return true if EnrollmentRequirement has BenefitAmountModifier but passed benefitAmount doesn't compare as expected", () => {
            const result = service.enrollmentRequirementHasValues(
                {
                    relatedPlanId: 111,
                    coverageLevels: [],
                    benefitAmountModifier: BenefitAmountModifier.EQUAL_TO,
                    benefitAmount: 9000,
                } as EnrollmentRequirement,
                {
                    relatedPlanId: 111,
                    benefitAmount: 9000,
                },
            );

            expect(result).toBe(true);
        });
    });

    describe("hasValidSpouseEnrollmentRequirement()", () => {
        it("should always return true if member has spouse", () => {
            expect(
                service.hasValidSpouseEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE },
                    ] as EnrollmentRequirement[],
                    true,
                ),
            ).toBe(true);
        });

        it("should return false if EnrollmentRequirements include DependencyType.REQUIRES_ELIGIBLE_SPOUSE but member does not have spouse", () => {
            expect(
                service.hasValidSpouseEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE },
                    ] as EnrollmentRequirement[],
                    false,
                ),
            ).toBe(false);
        });

        it("should return true if EnrollmentRequirements do NOT include DependencyType.REQUIRES_ELIGIBLE_SPOUSE", () => {
            expect(
                service.hasValidSpouseEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                    ] as EnrollmentRequirement[],
                    false,
                ),
            ).toBe(true);
        });
    });

    describe("hasValidChildEnrollmentRequirement()", () => {
        it("should always return true if member has child", () => {
            expect(
                service.hasValidChildEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD },
                    ] as EnrollmentRequirement[],
                    true,
                ),
            ).toBe(true);
        });

        it("should return false if EnrollmentRequirements include DependencyType.REQUIRES_ELIGIBLE_CHILD but member does not have child", () => {
            expect(
                service.hasValidChildEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD },
                    ] as EnrollmentRequirement[],
                    false,
                ),
            ).toBe(false);
        });

        it("should return true if EnrollmentRequirements do NOT include DependencyType.REQUIRES_ELIGIBLE_CHILD", () => {
            expect(
                service.hasValidChildEnrollmentRequirement(
                    [
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                        { dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN },
                    ] as EnrollmentRequirement[],
                    false,
                ),
            ).toBe(true);
        });
    });

    describe("compareNumericValues()", () => {
        describe("Default case", () => {
            it("should return false if no valid BenefitAmountModifier is used", () => {
                const result = service.compareNumericValues(1, "unknown" as BenefitAmountModifier, 1);
                expect(result).toBe(false);
            });
        });

        describe("BenefitAmountModifier.EQUAL_TO", () => {
            it("should return true if comparison is equal", () => {
                const result = service.compareNumericValues(500, BenefitAmountModifier.EQUAL_TO, 500);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT equal", () => {
                const result = service.compareNumericValues(500, BenefitAmountModifier.EQUAL_TO, -1);
                expect(result).toBe(false);
            });
        });

        describe("BenefitAmountModifier.GREATER_THAN", () => {
            it("should return true if comparison is greater than", () => {
                const result = service.compareNumericValues(2000, BenefitAmountModifier.GREATER_THAN, 100);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT greater than", () => {
                const result = service.compareNumericValues(100, BenefitAmountModifier.GREATER_THAN, 2000);
                expect(result).toBe(false);
            });
        });

        describe("BenefitAmountModifier.GREATER_THAN_EQUAL_TO", () => {
            it("should return true if comparison is equal", () => {
                const result = service.compareNumericValues(500, BenefitAmountModifier.GREATER_THAN_EQUAL_TO, 500);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT equal and is less than", () => {
                const result = service.compareNumericValues(500, BenefitAmountModifier.GREATER_THAN_EQUAL_TO, 9999);
                expect(result).toBe(false);
            });

            it("should return true if comparison is greater than", () => {
                const result = service.compareNumericValues(2000, BenefitAmountModifier.GREATER_THAN_EQUAL_TO, 100);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT greater than", () => {
                const result = service.compareNumericValues(100, BenefitAmountModifier.GREATER_THAN_EQUAL_TO, 2000);
                expect(result).toBe(false);
            });
        });

        describe("BenefitAmountModifier.LESS_THAN", () => {
            it("should return true if comparison is less than", () => {
                const result = service.compareNumericValues(100, BenefitAmountModifier.LESS_THAN, 2000);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT less than", () => {
                const result = service.compareNumericValues(2000, BenefitAmountModifier.LESS_THAN, 100);
                expect(result).toBe(false);
            });
        });

        describe("BenefitAmountModifier.LESS_THAN_EQUAL_TO", () => {
            it("should return true if comparison is equal", () => {
                const result = service.compareNumericValues(500, BenefitAmountModifier.LESS_THAN_EQUAL_TO, 500);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT equal and greater than", () => {
                const result = service.compareNumericValues(9999, BenefitAmountModifier.LESS_THAN_EQUAL_TO, 500);
                expect(result).toBe(false);
            });

            it("should return true if comparison is less than", () => {
                const result = service.compareNumericValues(100, BenefitAmountModifier.LESS_THAN_EQUAL_TO, 2000);
                expect(result).toBe(true);
            });

            it("should return false if comparison is NOT less than", () => {
                const result = service.compareNumericValues(2000, BenefitAmountModifier.LESS_THAN_EQUAL_TO, 100);
                expect(result).toBe(false);
            });
        });
    });

    describe("getFilteredEnrollmentRequirements()", () => {
        it("should filter EnrollmentRequirements by DependencyType", () => {
            const requiresEligbleChild = {
                dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD,
                relatedPlanId: 111,
            } as EnrollmentRequirement;
            const requiresEligbleSpouse = {
                dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                relatedPlanId: 222,
            } as EnrollmentRequirement;
            const enrollmentRequirements = [requiresEligbleChild, requiresEligbleSpouse] as EnrollmentRequirement[];

            const result = service.getFilteredEnrollmentRequirements(enrollmentRequirements, DependencyType.REQUIRES_ELIGIBLE_CHILD);

            expect(result).toStrictEqual([requiresEligbleChild]);
            expect(result[0]).toBe(requiresEligbleChild);
        });
    });
});
