import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BenefitAmountSelectionComponent } from "./benefit-amount-selection.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Store } from "@ngxs/store";
import { mockLanguageService, mockStore } from "@empowered/testing";
import { FormBuilder } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, NO_ERRORS_SCHEMA, SimpleChange } from "@angular/core";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { PlanOfferingPanel } from "@empowered/constants";

const planOfferingObj = {
    id: 1,
    plan: {
        id: 1319,
        name: "Waiver of Premium Rider",
        adminName: "Waiver of Premium Rider",
        description: "WoPR",
        productId: 29,
        displayOrder: 20,
        policySeries: "ICC1368054",
        planSeriesId: 163,
        carrierId: 1,
        characteristics: ["STACKABLE"],
        policyOwnershipType: "INDIVIDUAL",
        pricingModel: "UNIVERSAL",
        pricingEditable: false,
        enrollable: true,
        rider: true,
        dependentPlanIds: [],
        mutuallyExclusivePlanIds: [],
        carrierNameOverride: "Aflac",
    },
    coverageLevel: [{ id: 1 }],
    selectedPricing: {
        coverageLevelId: 245,
        benefitAmount: 20000,
        memberCost: 1.0662,
        totalCost: 1.0662,
        minAge: 59,
        maxAge: 59,
    },
    planPricing: [
        {
            coverageLevelId: 245,
            benefitAmount: 20000,
            memberCost: 1.0662,
            totalCost: 1.0662,
            minAge: 59,
            maxAge: 59,
        },
    ],
    ridersData: [
        {
            id: 30,
            plan: {
                id: 1319,
                name: "Waiver of Premium Rider",
                adminName: "Waiver of Premium Rider",
                description: "WoPR",
                productId: 29,
                displayOrder: 20,
                policySeries: "ICC1368054",
                planSeriesId: 163,
                carrierId: 1,
                characteristics: ["STACKABLE"],
                policyOwnershipType: "INDIVIDUAL",
                pricingModel: "UNIVERSAL",
                pricingEditable: false,
                enrollable: true,
                rider: true,
                dependentPlanIds: [],
                mutuallyExclusivePlanIds: [],
                carrierNameOverride: "Aflac",
            },

            productOfferingId: 1,
            validity: {
                effectiveStarting: "2023-09-21",
                expiresAfter: "2023-10-14",
            },
            type: "STANDARD",
            agentAssistanceRequired: false,
            returnOfPremiumRider: false,
            taxStatus: "POSTTAX",
            parentPlanId: 1307,
            parentPlanCoverageLevelId: 1,
            enrollmentRequirements: [],
            brokerSelected: false,
            coverageStartFunction: "NEXT_FIRST_OF_MONTH",
        },
    ],
} as PlanOfferingPanel;

const planObjNew = {
    id: 2,
    plan: {
        id: 1319,
        name: "Waiver of Premium Rider",
        adminName: "Waiver of Premium Rider",
        description: "WoPR",
        productId: 29,
        displayOrder: 20,
        policySeries: "ICC1368054",
        planSeriesId: 163,
        carrierId: 1,
        characteristics: ["STACKABLE"],
        policyOwnershipType: "INDIVIDUAL",
        pricingModel: "UNIVERSAL",
        pricingEditable: false,
        enrollable: true,
        rider: true,
        dependentPlanIds: [],
        mutuallyExclusivePlanIds: [],
        carrierNameOverride: "Aflac",
    },
    coverageLevel: [{ id: 1 }],
    selectedPricing: {
        coverageLevelId: 245,
        benefitAmount: 20000,
        memberCost: 1.0664,
        totalCost: 1.0664,
        minAge: 59,
        maxAge: 59,
    },
    planPricing: [
        {
            coverageLevelId: 245,
            benefitAmount: 20000,
            memberCost: 1.0664,
            totalCost: 1.0664,
            minAge: 59,
            maxAge: 59,
        },
    ],
    ridersData: [
        {
            id: 30,
            plan: {
                id: 1319,
                name: "Waiver of Premium Rider",
                adminName: "Waiver of Premium Rider",
                description: "WoPR",
                productId: 29,
                displayOrder: 20,
                policySeries: "ICC1368054",
                planSeriesId: 163,
                carrierId: 1,
                characteristics: ["STACKABLE"],
                policyOwnershipType: "INDIVIDUAL",
                pricingModel: "UNIVERSAL",
                pricingEditable: false,
                enrollable: true,
                rider: true,
                dependentPlanIds: [],
                mutuallyExclusivePlanIds: [],
                carrierNameOverride: "Aflac",
            },

            productOfferingId: 1,
            validity: {
                effectiveStarting: "2023-09-21",
                expiresAfter: "2023-10-14",
            },
            type: "STANDARD",
            agentAssistanceRequired: false,
            returnOfPremiumRider: false,
            taxStatus: "POSTTAX",
            parentPlanId: 1307,
            parentPlanCoverageLevelId: 1,
            enrollmentRequirements: [],
            brokerSelected: false,
            coverageStartFunction: "NEXT_FIRST_OF_MONTH",
        },
    ],
} as PlanOfferingPanel;

describe("BenefitAmountSelectionComponent", () => {
    let component: BenefitAmountSelectionComponent;
    let fixture: ComponentFixture<BenefitAmountSelectionComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [BenefitAmountSelectionComponent, ReplaceTagPipe],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                ChangeDetectorRef,
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BenefitAmountSelectionComponent);
        component = fixture.componentInstance;
        component.planOfferingObj = planOfferingObj;
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getRequiredData", () => {
        it("should set benefit amount array when RequiredData method is called", () => {
            component.getRequiredData();
            expect(component.benefitData).toEqual([
                {
                    benefitAmount: 20000,
                    coverageLevelId: 245,
                    maxAge: 59,
                    memberCost: 1.0662,
                    minAge: 59,
                    totalCost: 1.0662,
                },
            ]);
        });
    });

    describe("isSingleCoverageLevel", () => {
        it("should set isSingleCoverage to true when selected plan coverage level is not Declined", () => {
            component.isSingleCoverageLevel();
            expect(component.isSingleCoverage).toBeTruthy();
        });
    });

    describe("ngOnInit", () => {
        it("should set isSingleCoverage to true when OnInit is invoked", () => {
            component.ngOnInit();
            expect(component.isSingleCoverage).toBeTruthy();
        });
    });

    describe("selectByDefaultBenefitAmount", () => {
        beforeEach(() => {
            component.benefitData = [
                {
                    benefitAmount: 20000,
                    coverageLevelId: 245,
                    maxAge: 59,
                    memberCost: 1.0662,
                    minAge: 59,
                    totalCost: 1.0662,
                },
            ];
        });

        it("should set currentCoverageLevel when selectByDefaultBenefitAmount method is invoked", () => {
            component.selectByDefaultBenefitAmount();
            expect(component.currentCoverageLevel).toEqual({
                benefitAmount: 20000,
                coverageLevelId: 245,
                maxAge: 59,
                memberCost: 1.0662,
                minAge: 59,
                totalCost: 1.0662,
            });
        });
    });

    describe("getBenefitCost", () => {
        const bCost = {
            benefitAmount: 20000,
            coverageLevelId: 245,
            maxAge: 59,
            memberCost: 1.0662,
            minAge: 59,
            totalCost: 1.0662,
        };

        it("should get memberPrice when getBenefitCost is invoked", () => {
            const result = component.getBenefitCost(bCost);
            expect(result).toEqual("0.00");
        });
    });

    describe("getCoverageLevelCost", () => {
        const coverageLevel = {
            benefitAmount: 20000,
            coverageLevelId: 245,
            maxAge: 59,
            memberCost: 1.0662,
            minAge: 59,
            totalCost: 1.0662,
        };

        it("should get coverage level cost when getCoverageLevelCost is invoked", () => {
            const result = component.getCoverageLevelCost(coverageLevel);
            expect(result).toEqual(1.0662);
        });
    });

    describe("ngOnChanges()", () => {
        it("should set the new plan offering object when there is an input change detected", () => {
            component.planOfferingObj = planObjNew;
            component.ngOnChanges({
                planOfferingObj: new SimpleChange(null, component.planOfferingObj, false),
            });
            fixture.detectChanges();
            expect(component.planOfferingObj).toBe(planObjNew);
        });

        it("should set new Benefit Data when there is an input change detected for currentCoverageLevel", () => {
            component.currentCoverageLevel = {
                benefitAmount: 20000,
                coverageLevelId: 245,
                maxAge: 59,
                memberCost: 1.0664,
                minAge: 59,
                totalCost: 1.0664,
            };
            component.planOfferingObj = planObjNew;
            component.ngOnChanges({
                currentCoverageLevel: new SimpleChange(null, component.currentCoverageLevel, false),
            });
            fixture.detectChanges();
            expect(component.benefitData).toStrictEqual([
                {
                    benefitAmount: 20000,
                    coverageLevelId: 245,
                    maxAge: 59,
                    memberCost: 1.0664,
                    minAge: 59,
                    totalCost: 1.0664,
                },
            ]);
        });
    });
});
