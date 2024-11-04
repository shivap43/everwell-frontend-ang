import { TestBed } from "@angular/core/testing";
import { MissingInfoType, CoverageLevel, EnrollmentRequirement, EnrollmentRider, Enrollments } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { DependencyType } from "../enrollment-requirements/enrollment-requirements.model";
import { EnrollmentRequirementsService } from "../enrollment-requirements/enrollment-requirements.service";
import {
    BenefitAmountState,
    CoverageLevelState,
    PanelIdentifiers,
} from "../producer-shop-component-store/producer-shop-component-store.model";
import { EnrollmentRequirementPlanType, RiderState } from "../rider-state/rider-state.model";
import { RiderStateService } from "../rider-state/rider-state.service";

import { RiderDisabledStateService } from "./rider-disabled-state.service";

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

describe("RiderDisabledStateService", () => {
    let service: RiderDisabledStateService;
    let languageService: LanguageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RiderDisabledStateService,
                RiderStateService,
                EnrollmentRequirementsService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        });

        service = TestBed.inject(RiderDisabledStateService);
        languageService = TestBed.inject(LanguageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("getRiderDisabledState()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(service, "isDisabledBasedOnInvolvingBrokerPlan").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnInvolvingBrokerPlan",
            });
            jest.spyOn(service, "isDisabledBasedOnBeingAnAddOnRider").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnBeingAnAddOnRider",
            });
            jest.spyOn(service, "isDisabledBasedOnBeingMandatory").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnBeingMandatory",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredSpouseDependent").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredSpouseDependent",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredChildDependent").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredChildDependent",
            });
            jest.spyOn(service, "isDisabledBasedOnParentPlanId").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnParentPlanId",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredSelections").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredSelections",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredNonSelections").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredNonSelections",
            });
            jest.spyOn(service, "isDisabledBasedOnLackOfSalaryInformation").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnLackOfSalaryInformation",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredEnrollmentInPlan").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredEnrollmentInPlan",
            });
            jest.spyOn(service, "isDisabledBasedOnRequiredNonEnrollmentInPlan").mockReturnValue({
                disabled: false,
                disableText: "mocked isDisabledBasedOnRequiredNonEnrollmentInPlan",
            });
        });

        it("should return enabled RiderDisableState if all cases determine RiderState should NOT be disabled", () => {
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
            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should check isDisabledBasedOnInvolvingBrokerPlan", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnInvolvingBrokerPlan" };

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

            jest.spyOn(service, "isDisabledBasedOnInvolvingBrokerPlan").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnBeingAnAddOnRider", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnBeingAnAddOnRider" };
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

            jest.spyOn(service, "isDisabledBasedOnBeingAnAddOnRider").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnBeingMandatory", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnBeingMandatory" };
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

            jest.spyOn(service, "isDisabledBasedOnBeingMandatory").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredSpouseDependent", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredSpouseDependent" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredSpouseDependent").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredChildDependent", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredChildDependent" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredChildDependent").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnParentPlanId", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnParentPlanId" };
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

            jest.spyOn(service, "isDisabledBasedOnParentPlanId").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredSelections", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredSelections" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredSelections").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredNonSelections", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredNonSelections" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredNonSelections").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnLackOfSalaryInformation", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnLackOfSalaryInformation" };
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

            jest.spyOn(service, "isDisabledBasedOnLackOfSalaryInformation").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredEnrollmentInPlan", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredEnrollmentInPlan" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredEnrollmentInPlan").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });

        it("should check isDisabledBasedOnRequiredNonEnrollmentInPlan", () => {
            const mock = { disabled: true, disableText: "mocked isDisabledBasedOnRequiredNonEnrollmentInPlan" };
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

            jest.spyOn(service, "isDisabledBasedOnRequiredNonEnrollmentInPlan").mockReturnValue(mock);

            const result = service.getRiderDisabledState(
                {} as RiderState,
                [],
                {
                    memberHasSpouse: false,
                    memberHasChild: true,
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

            expect(result).toBe(mock);
        });
    });

    describe("isDisabledBasedOnBeingMandatory()", () => {
        it("should return enabled RiderDisableState if RiderState DOES NOT have a mandatory riderPlanId", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnBeingMandatory(riderState, [111, 222, 333, 555]);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if RiderState has a mandatory riderPlanId", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnBeingMandatory(riderState, [111, 222, 333, 444, 555]);

            expect(result).toStrictEqual({ disabled: true });
        });
    });

    describe("isDisabledBasedOnBeingAnAddOnRider()", () => {
        it("should return enabled RiderDisableState if Rider is NOT an ADD ON rider", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnBeingAnAddOnRider(riderState, [111, 222, 333, 555]);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if Rider is an ADD ON rider", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnBeingAnAddOnRider(riderState, [111, 222, 333, 444, 555]);

            expect(result).toStrictEqual({ disabled: true });
        });
    });

    describe("isDisabledBasedOnInvolvingBrokerPlan()", () => {
        it("should return enabled RiderDisableState if Rider DOES NOT involve a broker planId", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnInvolvingBrokerPlan(riderState, [111, 222, 333, 555]);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if Rider involves a broker planId", () => {
            const riderState = {
                riderPlanId: 444,
            } as RiderState;

            const result = service.isDisabledBasedOnInvolvingBrokerPlan(riderState, [111, 222, 333, 444, 555]);

            expect(result).toStrictEqual({ disabled: true });
        });
    });

    describe("isDisabledBasedOnLackOfSalaryInformation()", () => {
        it("should return disabled RiderDisableState if RiderState has MissingInfoType.SALARY", () => {
            const riderState = {
                missingInformation: MissingInfoType.SALARY,
            } as RiderState;

            const result = service.isDisabledBasedOnLackOfSalaryInformation(riderState);

            expect(result).toStrictEqual({ disabled: true });
        });

        it("should return enabled RiderDisableState if RiderState DOES NOT have MissingInfoType.SALARY", () => {
            const riderState = {} as RiderState;

            const result = service.isDisabledBasedOnLackOfSalaryInformation(riderState);

            expect(result).toStrictEqual({ disabled: false });
        });
    });

    describe("isDisabledBasedOnParentPlanId()", () => {
        it("should return enabled RiderDisableState if NO RiderState with riderParentPlanId is found", () => {
            const riderState = { riderParentPlanId: 111 } as RiderState;

            const riderStates = [
                { riderPlanId: 222, checked: true },
                { riderPlanId: 333, checked: true },
            ] as RiderState[];

            const result = service.isDisabledBasedOnParentPlanId(riderState, riderStates, true);
            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if RiderState with riderParentPlanId IS NOT checked", () => {
            const riderState = { riderParentPlanId: 111 } as RiderState;

            const riderStates = [
                { riderPlanId: 222, checked: true },
                { riderPlanId: 111, checked: false },
                { riderPlanId: 333, checked: true },
            ] as RiderState[];

            const result = service.isDisabledBasedOnParentPlanId(riderState, riderStates, true);
            expect(result).toStrictEqual({ disabled: true });
        });

        it("should return enabled RiderDisableState if RiderState with riderParentPlanId IS checked", () => {
            const riderState = { riderParentPlanId: 111 } as RiderState;

            const riderStates = [
                { riderPlanId: 222, checked: false },
                { riderPlanId: 111, checked: true },
            ] as RiderState[];

            const result = service.isDisabledBasedOnParentPlanId(riderState, riderStates, true);
            expect(result).toStrictEqual({ disabled: false });
        });
    });

    describe("isDisabledBasedOnRequiredEnrollmentInPlan()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(service, "getRequiresEnrollmentMessage").mockReturnValueOnce("mocked required enrollment message");
        });

        it("should return enabled RiderDisableState if no enrollmentRequirements have DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    plan: {
                        id: 111,
                    },
                },
            ] as Enrollments[];

            const enrollmentRiders = [{ plan: { id: 222 } }] as EnrollmentRider[];

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

            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                enrollments,
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if Rider BASE plan satisfies EnrollmentRequirement", () => {
            const riderState = {
                // Rider's BASE plan matches relatedPlanId of EnrollmentRequirements
                planId: 111,
                parentPlanCoverageLevelId: 777,
                identifiers: {
                    // planOfferingId to fetch coverage level Id from coverage level state
                    planOfferingId: 1528,
                },
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanName: "some plan name 1",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [
                            // Expected CoverageLevel that should match selected CoverageLevel
                            { id: 29 },
                        ],
                    },
                ],
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
                planOfferingId: 1528,
            } as PanelIdentifiers;

            const allBaseCoverageLevels: CoverageLevelState[] = [{ coverageLevel, panelIdentifiers }];
            const allBaseBenefitAmounts: BenefitAmountState[] = [{ benefitAmount: 10000, panelIdentifiers }];
            expect(riderState.planId).toBe(riderState.enrollmentRequirements[0].relatedPlanId);

            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                [],
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if all BASE plans are included in Enrollments", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    plan: { id: 111 },
                },
                {
                    plan: { id: 222 },
                },
            ] as Enrollments[];

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
            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                enrollments,
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if a BASE plan is NOT included in enrollments", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    plan: { id: 111 },
                },
                {
                    // Supposed to not match with EnrollmentRequirements
                    plan: { id: 333 },
                },
            ] as Enrollments[];

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
            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                enrollments,
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: true, disableText: "mocked required enrollment message" });
        });

        it("should return enabled RiderDisableState if all RIDER plans are included in EnrollmentRiders", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollmentRiders = [
                {
                    plan: {
                        id: 111,
                    },
                },
                {
                    plan: {
                        id: 222,
                    },
                },
            ] as EnrollmentRider[];

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
            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                [],
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if all RIDER plans are included in EnrollmentRiders", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollmentRiders = [
                {
                    plan: {
                        id: 111,
                    },
                },
                {
                    plan: {
                        // Supposed to not match with RiderState
                        id: 333,
                    },
                },
            ] as EnrollmentRider[];

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
            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                [],
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: true, disableText: "mocked required enrollment message" });
        });

        it("should use a generic disable text if invalid EnrollmentRequirement based on Rider's BASE plan returning disabled RiderDisableState", () => {
            const riderState = {
                identifiers: {},
                // Since Rider's BASE plan matches relatedPlanId of EnrollmentRequirements
                // and failed requirements, this will result in the generic error message
                planId: 111,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanName: "some plan name 1",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [
                            // Expected CoverageLevel that shouldn't match selected CoverageLevel
                            // This will trigger disable state
                            { id: 999 },
                        ],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanName: "some plan name 2",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            jest.resetAllMocks();

            const spy = jest.spyOn(service, "getRequiresEnrollmentMessage");
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

            expect(riderState.planId).toBe(riderState.enrollmentRequirements[0].relatedPlanId);

            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                [],
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(spy).not.toBeCalled();

            expect(result).toStrictEqual({
                disabled: true,
                disableText: "primary.portal.shoppingExperience.applicantIneligible",
            });
        });

        it("should use a custom disable text that includes plan name when returning disabled RiderDisableState", () => {
            const riderState = {
                identifiers: {},
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanName: "some plan name 1",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanName: "some plan name 2",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
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
            jest.resetAllMocks();

            const spy = jest
                .spyOn(service, "getRequiresEnrollmentMessage")
                .mockImplementation((riderName) => `custom message required enrollment: ${riderName}`);

            const result = service.isDisabledBasedOnRequiredEnrollmentInPlan(
                riderState,
                [],
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(spy).toBeCalledWith("some plan name 1");

            expect(result).toStrictEqual({
                disabled: true,
                disableText: "custom message required enrollment: some plan name 1",
            });
        });
    });

    describe("isDisabledBasedOnRequiredNonEnrollmentInPlan()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(service, "getRequiresNonEnrollmentMessage").mockReturnValueOnce("mocked nonrequired enrollment message");
        });

        it("should return enabled RiderDisableState if no enrollmentRequirements have DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    plan: { id: 111 },
                },
            ] as Enrollments[];

            const enrollmentRiders = [{ plan: { id: 222 } }] as EnrollmentRider[];
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

            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                enrollments,
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if NONE of the BASE plans are included in Enrollments", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    // Supposed to not match
                    plan: { id: 333 },
                },
                {
                    // Supposed to not match
                    plan: { id: 444 },
                },
            ] as Enrollments[];
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

            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                enrollments,
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if a BASE plan included in enrollments", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollments = [
                {
                    // Supposed to match an EnrollmentRequirement
                    plan: { id: 111 },
                },
                {
                    // Supposed to not match with EnrollmentRequirements
                    plan: { id: 333 },
                },
            ] as Enrollments[];
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

            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                enrollments,
                [],
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: true, disableText: "mocked nonrequired enrollment message" });
        });

        it("should return enabled RiderDisableState if NONE of the RIDER plans are included in Enrollments", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollmentRiders = [
                {
                    plan: {
                        // Supposed to not match with EnrollmentRequirements
                        id: 333,
                    },
                    coverageLevel: {
                        id: -1,
                    },
                },
                {
                    plan: {
                        // Supposed to not match with EnrollmentRequirements
                        id: 444,
                    },
                    coverageLevel: {
                        id: -1,
                    },
                },
            ] as EnrollmentRider[];
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
            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                [],
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if a RIDER plans included in enrollments", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollmentRiders = [
                {
                    plan: {
                        // Supposed to match an EnrollmentRequirement
                        id: 222,
                    },
                    coverageLevel: {
                        id: -1,
                    },
                },
                {
                    plan: {
                        // Supposed to not match with EnrollmentRequirements
                        id: 444,
                    },
                    coverageLevel: {
                        id: -1,
                    },
                },
            ] as EnrollmentRider[];
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
            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                [],
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(result).toStrictEqual({ disabled: true, disableText: "mocked nonrequired enrollment message" });
        });

        it("should use a custom disable text that includes plan name when returning disabled RiderDisableState", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                        relatedPlanName: "some plan name 1",
                        relatedPlanType: EnrollmentRequirementPlanType.BASE,
                        coverageLevels: [],
                    },
                    {
                        dependencyType: DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN,
                        relatedPlanId: 222,
                        relatedPlanName: "some plan name 2",
                        relatedPlanType: EnrollmentRequirementPlanType.RIDER,
                        coverageLevels: [],
                    },
                ],
            } as RiderState;

            const enrollmentRiders = [
                {
                    plan: {
                        // Supposed to match an EnrollmentRequirement
                        id: 222,
                    },
                    coverageLevel: {
                        id: -1,
                    },
                },
            ] as EnrollmentRider[];

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

            jest.resetAllMocks();

            const spy = jest
                .spyOn(service, "getRequiresNonEnrollmentMessage")
                .mockImplementation((riderName) => `custom message nonrequired enrollment: ${riderName}`);

            const result = service.isDisabledBasedOnRequiredNonEnrollmentInPlan(
                riderState,
                [],
                enrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            );

            expect(spy).toBeCalledWith("some plan name 2");

            expect(result).toStrictEqual({
                disabled: true,
                disableText: "custom message nonrequired enrollment: some plan name 2",
            });
        });
    });

    describe("isDisabledBasedOnRequiredNonSelections()", () => {
        it("should return enabled RiderDisableState if NO EnrollmentRequirements with DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        // Meant to not be DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                        relatedPlanId: 111,
                    },
                ],
            } as RiderState;

            const riderStates = [{ checked: true, riderPlanId: 111 }] as RiderState[];

            const result = service.isDisabledBasedOnRequiredNonSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return enabled RiderDisableState if no RiderStates have a matching riderPlanId", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                    },
                ],
            } as RiderState;

            const riderStates = [{ checked: true, riderPlanId: 333 }] as RiderState[];

            const result = service.isDisabledBasedOnRequiredNonSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if some RiderState has a matching riderPlanId", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN,
                        relatedPlanId: 111,
                    },
                ],
            } as RiderState;

            const riderStates = [{ checked: true, riderPlanId: 111 }] as RiderState[];

            const result = service.isDisabledBasedOnRequiredNonSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: true });
        });

        describe("should avoid infinite loop when validating other RiderStates", () => {
            it("should be able to return enabled RiderDisableState when there are more than 2 dependent RiderStates", () => {
                const riderStates = [
                    {
                        // Checked is valid since the other 2 are not checked
                        checked: true,
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
                        checked: false,
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
                        checked: false,
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

                const result = service.isDisabledBasedOnRequiredNonSelections(riderStates[0], riderStates);

                expect(result).toStrictEqual({ disabled: false });
            });

            it("should be able to return disabled RiderDisableState when there are more than 2 dependent RiderStates", () => {
                const riderStates = [
                    {
                        // Checked is invalid since the other 2 are checked
                        checked: true,
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
                        checked: true,
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
                        checked: true,
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

                const result = service.isDisabledBasedOnRequiredNonSelections(riderStates[0], riderStates);

                expect(result).toStrictEqual({ disabled: true });
            });
        });
    });

    describe("isDisabledBasedOnRequiredSelections()", () => {
        it("should return disabled RiderDisableState if NO EnrollmentRequirements with DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        // Meant to not be DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                        relatedPlanId: 111,
                    },
                ],
            } as RiderState;

            const riderStates = [{ checked: true, riderPlanId: 111 }] as RiderState[];

            const result = service.isDisabledBasedOnRequiredSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if every RiderState doesn't have a required plan", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanId: 111,
                    },
                ],
            } as RiderState;

            const riderStates = [
                { checked: true, riderPlanId: 222 },
                { checked: true, riderPlanId: 333 },
                { checked: true, riderPlanId: 444 },
            ] as RiderState[];

            const result = service.isDisabledBasedOnRequiredSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: true });
        });

        it("should return enabled RiderDisableState if all required RiderState are checked", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanId: 111,
                    },
                    {
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanId: 222,
                    },
                ],
            } as RiderState;

            const riderStates = [
                { checked: true, riderPlanId: 111 },
                { checked: true, riderPlanId: 222 },
                { checked: true, riderPlanId: 333 },
                { checked: true, riderPlanId: 444 },
            ] as RiderState[];

            const result = service.isDisabledBasedOnRequiredSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: false });
        });

        it("should return disabled RiderDisableState if a required RiderState is not checked", () => {
            const riderState = {
                enrollmentRequirements: [
                    {
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanId: 111,
                    },
                    {
                        // We have to do type assertion here since Producer Shop Rewrite,
                        // introduces a new enum `REQUIRES_SELECTION_IN_ANOTHER_PLAN`
                        dependencyType: DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN as DependencyType,
                        relatedPlanId: 222,
                    },
                ],
            } as RiderState;

            const riderStates = [
                { checked: true, riderPlanId: 111 },
                { checked: false, riderPlanId: 222 },
                { checked: true, riderPlanId: 333 },
                { checked: true, riderPlanId: 444 },
            ] as RiderState[];

            const result = service.isDisabledBasedOnRequiredSelections(riderState, riderStates);

            expect(result).toStrictEqual({ disabled: true });
        });
    });

    describe("isDisabledBasedOnRequiredSpouseDependent()", () => {
        it("should return disabled RiderDisableState if EnrollmentRequirement has DependencyType.REQUIRES_ELIGIBLE_SPOUSE and member DOES NOT have spouse", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredSpouseDependent(riderState, false);

            expect(result).toStrictEqual({
                disabled: true,
                disableText: "primary.portal.shoppingExperience.applicantIneligible",
            });
        });

        it("should return disabled RiderDisableState if EnrollmentRequirement has DependencyType.REQUIRES_ELIGIBLE_SPOUSE and member DOES have spouse", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_SPOUSE,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredSpouseDependent(riderState, true);

            expect(result).toStrictEqual({
                disabled: false,
            });
        });

        it("should return enabled RiderDisableState if EnrollmentRequirement doesn't include DependencyType.REQUIRES_ELIGIBLE_SPOUSE", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredSpouseDependent(riderState, false);

            expect(result).toStrictEqual({
                disabled: false,
            });
        });
    });

    describe("isDisabledBasedOnRequiredChildDependent()", () => {
        it("should return disabled RiderDisableState if EnrollmentRequirement has DependencyType.REQUIRES_ELIGIBLE_CHILD and member DOES NOT have child", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredChildDependent(riderState, false);

            expect(result).toStrictEqual({
                disabled: true,
                disableText: "primary.portal.shoppingExperience.applicantIneligible",
            });
        });

        it("should return disabled RiderDisableState if EnrollmentRequirement has DependencyType.REQUIRES_ELIGIBLE_CHILD and member DOES have child", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ELIGIBLE_CHILD,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredChildDependent(riderState, true);

            expect(result).toStrictEqual({
                disabled: false,
            });
        });

        it("should return enabled RiderDisableState if EnrollmentRequirement doesn't include DependencyType.REQUIRES_ELIGIBLE_CHILD", () => {
            const riderState = {
                disabled: true,
                enrollmentRequirements: [
                    {
                        dependencyType: DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN,
                    },
                ],
            } as RiderState;

            const result = service.isDisabledBasedOnRequiredChildDependent(riderState, false);

            expect(result).toStrictEqual({
                disabled: false,
            });
        });
    });

    describe("getRequiresEnrollmentMessage()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return string with plan name in language string", () => {
            const spy = jest
                .spyOn(languageService, "fetchSecondaryLanguageValue")
                .mockReturnValueOnce("Should replace this part: ##planName##");
            const result = service.getRequiresEnrollmentMessage("some plan name");
            expect(spy).toBeCalledWith("secondary.portal.enrollment.requiresEnrollmentRider");
            expect(result).toBe("Should replace this part: some plan name");
        });
    });

    describe("getRequiresNonEnrollmentMessage()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return string with plan name in language string", () => {
            const spy = jest
                .spyOn(languageService, "fetchSecondaryLanguageValue")
                .mockReturnValueOnce("Another example of replacing this part: ##planName##");
            const result = service.getRequiresNonEnrollmentMessage("some plan name");
            expect(spy).toBeCalledWith("secondary.portal.enrollment.requiresNonEnrollmentRider");
            expect(result).toBe("Another example of replacing this part: some plan name");
        });
    });
});
