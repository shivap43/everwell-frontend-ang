import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { StaticUtilService } from "@empowered/ngxs-store";
import {
    mockCoreService,
    MockCoverageNamePipe,
    MockCurrencyPipe,
    mockLanguageService,
    mockMatDialog,
    MockReplaceTagPipe,
    mockStaticUtilService,
    mockStore,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { CoreService, ShoppingService } from "@empowered/api";
import { DateService } from "@empowered/date";
import { RiderSelectionComponent } from "./rider-selection.component";
import { MatDialog } from "@angular/material/dialog";
import { EnrollmentMethod, PlanOffering, PlanOfferingPanel, MoreSettings } from "@empowered/constants";
import { of, Subscription } from "rxjs";

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

const mockShoppingServiceLocal = {
    getPlanOfferingRiders: (
        planOfferingId: string,
        mpGroup: number,
        enrollmentMethod: EnrollmentMethod,
        enrollmentState: string,
        memberId: number,
    ) => of([planOfferingObj] as unknown as PlanOffering[]),

    getPlanOfferingPricing: (
        planOfferingId: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        parentPlanId?: number,
        parentPlanCoverageLevelId?: number,
        baseBenefitAmount?: number,
        childAge?: number,
        coverageEffectiveDate?: string,
        riskClassId?: number,
        fromApplicationFlow: boolean = false,
        shoppingCartItemId?: number,
        includeFee?: boolean,
    ) =>
        of([
            {
                coverageLevelId: 244,
                benefitAmount: 5000.0,
                memberCost: 0.48,
                totalCost: 0.48,
                minAge: 18,
                maxAge: 59,
            },
        ]),
} as unknown as ShoppingService;

describe("RiderSelectionComponent", () => {
    let component: RiderSelectionComponent;
    let fixture: ComponentFixture<RiderSelectionComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
            declarations: [RiderSelectionComponent, MockReplaceTagPipe, MockCoverageNamePipe, MockCurrencyPipe],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingServiceLocal,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                ChangeDetectorRef,
                DateService,
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RiderSelectionComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        component.planOfferingObj = planOfferingObj;
        component.allPlanOfferings = [planOfferingObj];
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getAllDataForRiders()", () => {
        it("Should rider option enabled if the max age is below 59 years old before the coverage effective date", () => {
            component.memberAgeOnCoverageEffectiveDate = 55;
            component.getAllDataForRiders();
            expect(component.isRiderDisabledList[0]).toBeFalsy();
        });

        it("Should rider option disabled if the max age is above 59 years old before the coverage effective date", () => {
            component.memberAgeOnCoverageEffectiveDate = 61;
            component.getAllDataForRiders();
            expect(component.isRiderDisabledList[0]).toBeTruthy();
        });
    });

    describe("isRiderExist()", () => {
        it("Should return true when rider exists in allRiderDetails", () => {
            const rider = { id: 1 } as PlanOfferingPanel;
            component.allRiderDetails = [{ riders: true, riderDetails: { id: 1, plan: {}, taxStatus: "POSTTAX" } as any, disable: false }];
            const result = component.isRiderExist(rider);
            expect(result).toBe(true);
        });

        it("Should return false when allRiderDetails is undefined", () => {
            const rider = { id: 1 } as PlanOfferingPanel;
            component.allRiderDetails = undefined;
            const result = component.isRiderExist(rider);
            expect(result).toBe(false);
        });

        it("Should return false when rider does not exists in allRiderDetails", () => {
            const rider = { id: 3 } as PlanOfferingPanel;
            component.allRiderDetails = [{ riders: true, riderDetails: { id: 1, plan: {}, taxStatus: "POSTTAX" } as any, disable: false }];
            const result = component.isRiderExist(rider);
            expect(result).toBe(false);
        });

        it("Should return false when allRiderDetails is an empty array", () => {
            const rider = { id: 3 } as PlanOfferingPanel;
            component.allRiderDetails = [];
            const result = component.isRiderExist(rider);
            expect(result).toBe(false);
        });
    });

    describe("checkForSinglePricing()", () => {
        it("Should return true when a coverage level has exactly one pricing", () => {
            const rider = {
                coverageLevel: [{ id: 1 }, { id: 2 }],
                planPricing: [
                    {
                        coverageLevelId: 1,
                        benefitAmount: 20000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                    {
                        coverageLevelId: 2,
                        benefitAmount: 10000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                ],
            } as PlanOfferingPanel;
            const result = component.checkForSinglePricing(rider);
            expect(result).toBe(true);
        });

        it("Should return false when no coverage level has exactly one pricing", () => {
            const rider = {
                coverageLevel: [{ id: 1 }],
                planPricing: [
                    {
                        coverageLevelId: 1,
                        benefitAmount: 20000,
                        memberCost: 1.062,
                        totalCost: 1.062,
                        minAge: 58,
                        maxAge: 58,
                    },
                    {
                        coverageLevelId: 1,
                        benefitAmount: 10000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                ],
            } as PlanOfferingPanel;
            const result = component.checkForSinglePricing(rider);
            expect(result).toBe(false);
        });

        it("Should return false when if planPricing is empty", () => {
            const rider = {
                coverageLevel: [{ id: 1 }, { id: 2 }],
                planPricing: [],
            } as PlanOfferingPanel;
            const result = component.checkForSinglePricing(rider);
            expect(result).toBe(false);
        });

        it("Should return true for a mix of multiple and single pricing, as long as one has exactly one pricing", () => {
            const rider = {
                coverageLevel: [{ id: 1 }, { id: 2 }],
                planPricing: [
                    {
                        coverageLevelId: 1,
                        benefitAmount: 20000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                    {
                        coverageLevelId: 2,
                        benefitAmount: 10000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                    {
                        coverageLevelId: 2,
                        benefitAmount: 1000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                ],
            } as PlanOfferingPanel;
            const result = component.checkForSinglePricing(rider);
            expect(result).toBe(true);
        });

        it("Should stop checking further if count > 1 for any coverage level", () => {
            const rider = {
                coverageLevel: [{ id: 1 }, { id: 2 }],
                planPricing: [
                    {
                        coverageLevelId: 1,
                        benefitAmount: 20000,
                        memberCost: 1.062,
                        totalCost: 1.062,
                        minAge: 58,
                        maxAge: 58,
                    },
                    {
                        coverageLevelId: 1,
                        benefitAmount: 10000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                    {
                        coverageLevelId: 2,
                        benefitAmount: 25000,
                        memberCost: 1.0662,
                        totalCost: 1.0662,
                        minAge: 59,
                        maxAge: 59,
                    },
                ],
            } as PlanOfferingPanel;
            const result = component.checkForSinglePricing(rider);
            expect(result).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe all subscriptions during component destruction", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
