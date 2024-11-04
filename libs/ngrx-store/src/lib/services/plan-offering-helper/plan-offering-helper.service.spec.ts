import { TestBed } from "@angular/core/testing";
import { CrossBorderRule, Enrollment, EnrollmentStateRelation } from "@empowered/api";
import {
    CrossBorderAlertType,
    EnrollmentMethod,
    ProductId,
    Characteristics,
    Plan,
    PlanOffering,
    Product,
    ProductOffering,
    GetCartItems,
    Enrollments,
} from "@empowered/constants";

import {
    PlanOfferingHelperService,
    matchEnrollmentWithPlanOffering,
    autoEnrolledAndInCart,
    getStackedPlanOfferingData,
    isReEnrollable,
    filteredPlanOfferings,
} from "./plan-offering-helper.service";

describe("PlanOfferingHelperService", () => {
    let service: PlanOfferingHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlanOfferingHelperService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("checkCrossBorderRestriction()", () => {
        it("should return CrossBorderAlertType.NONE if enrollmentMethod is not FACE_TO_FACE", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT,
                        residentState: "CA",
                        allowEnrollment: false,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.CALL_CENTER,
            );
            expect(result).toBe(CrossBorderAlertType.NONE);
        });

        it("should return CrossBorderAlertType.NONE is no rule with allowEnrollment is found", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT,
                        residentState: "CA",
                        allowEnrollment: true,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.FACE_TO_FACE,
            );
            expect(result).toBe(CrossBorderAlertType.NONE);
        });

        it("should return CrossBorderAlertType.NONE if enrollmentStateRelation is DIFFERENT_FROM_RESIDENT and residentState matches selectedState", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT,
                        residentState: "AZ",
                        allowEnrollment: false,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.FACE_TO_FACE,
            );
            expect(result).toBe(CrossBorderAlertType.NONE);
        });

        it("should return CrossBorderAlertType.NONE if enrollmentStateRelation is SAME_AS_RESIDENT and residentState doesn't matches selectedState", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.SAME_AS_RESIDENT,
                        residentState: "CA",
                        allowEnrollment: false,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.FACE_TO_FACE,
            );
            expect(result).toBe(CrossBorderAlertType.NONE);
        });

        it("should return CrossBorderAlertType.WARNING if enrollmentMethod is FACE_TO_FACE, selectedState matches residentState, and enrollmentStateRelation is SAME_AS_RESIDENT", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.SAME_AS_RESIDENT,
                        residentState: "AZ",
                        releaseBusiness: false,
                        allowEnrollment: true,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.FACE_TO_FACE,
            );

            expect(result).toBe(CrossBorderAlertType.WARNING);
        });

        it("should return CrossBorderAlertType.ERROR if enrollmentMethod is FACE_TO_FACE, selectedState matches residentState, and enrollmentStateRelation is SAME_AS_RESIDENT", () => {
            const result = service.checkCrossBorderRestriction(
                [
                    {
                        enrollmentStateRelation: EnrollmentStateRelation.SAME_AS_RESIDENT,
                        residentState: "AZ",
                        allowEnrollment: false,
                    } as CrossBorderRule,
                ],
                "AZ",
                EnrollmentMethod.FACE_TO_FACE,
            );

            expect(result).toBe(CrossBorderAlertType.ERROR);
        });
    });

    describe("removeProductOfferingsWithoutPlanOffering()", () => {
        it("should return combineOfferingsData after removing productOfferings without planOffering", () => {
            const result = service.removeProductOfferingsWithoutPlanOffering([
                {
                    productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                    planOfferingsWithCartAndEnrollment: [
                        {
                            planOffering: {
                                id: 555,
                            } as PlanOffering,
                            cartItemInfo: {
                                id: 555,
                            } as GetCartItems,
                        },
                    ],
                },
                {
                    productOffering: { id: 22, product: { id: 9 } as Product } as ProductOffering,
                    planOfferingsWithCartAndEnrollment: [],
                },
            ]);
            expect(result).toStrictEqual([
                {
                    productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                    planOfferingsWithCartAndEnrollment: [
                        {
                            planOffering: {
                                id: 555,
                            } as PlanOffering,
                            cartItemInfo: {
                                id: 555,
                            } as GetCartItems,
                        },
                    ],
                },
            ]);
        });
    });

    describe("isAutoEnrollable()", () => {
        it("should return true as an auto enrollable plan", () => {
            const planOffering = {
                id: 555,
                productOfferingId: 11,
                plan: {
                    characteristics: ["AUTOENROLLABLE"] as Characteristics[],
                    product: { id: 8 } as Product,
                } as Plan,
            } as PlanOffering;
            const result = service.isAutoEnrollable(planOffering);
            expect(result).toBe(true);
        });
    });

    describe("isLifePlan()", () => {
        it("should return true as Life plan", () => {
            const result = service.isLifePlan(ProductId.JUVENILE_WHOLE_LIFE);
            expect(result).toBe(true);
        });
    });

    describe("matchEnrollmentWithPlanOffering()", () => {
        it("should return those enrollments which match with plan offerings", () => {
            const planOffering = {
                id: 555,
                productOfferingId: 11,
                plan: { plan: { id: 12 }, characteristics: ["AUTOENROLLABLE"] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;
            const result = matchEnrollmentWithPlanOffering([planOffering], [{ plan: { plan: { id: 12 } } as Plan } as Enrollments]);
            expect(result).toStrictEqual([{ plan: { plan: { id: 12 } } as Plan } as Enrollments]);
        });
    });

    describe("autoEnrolledAndInCart()", () => {
        it("should return true if auto enrolled plan is still in cart", () => {
            const existingCoverage = {
                id: 1,
            } as Enrollments;
            const cartItem = {
                enrollmentId: 1,
            } as GetCartItems;
            const planOffering = {
                id: 555,
                productOfferingId: 11,
                plan: { plan: { id: 12 }, characteristics: ["AUTOENROLLABLE"] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;

            const result = autoEnrolledAndInCart(existingCoverage, planOffering, cartItem);

            expect(result).toStrictEqual(true);
        });
    });

    describe("getStackedPlanOfferingData()", () => {
        it("should return stacked plan offering panel data based on enrollments and cart items", () => {
            const planOffering = {
                id: 555,
                productOfferingId: 11,
                plan: { plan: { id: 12 }, characteristics: ["AUTOENROLLABLE"] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;
            const enrollment = { id: 1 } as Enrollments;
            const cartItem1 = { enrollmentId: 1 } as GetCartItems;
            const cartItem2 = { enrollmentId: 2 } as GetCartItems;
            const result = getStackedPlanOfferingData(planOffering, [enrollment], [cartItem1, cartItem2]);
            expect(result).toStrictEqual([
                {
                    cartItemInfo: { enrollmentId: 1 },
                    enrollment: { id: 1 },
                    planOffering: {
                        id: 555,
                        plan: { characteristics: ["AUTOENROLLABLE"], plan: { id: 12 }, product: { id: 8 } },
                        productOfferingId: 11,
                    },
                },
                {
                    planOffering: {
                        id: 555,
                        plan: { characteristics: ["AUTOENROLLABLE"], plan: { id: 12 }, product: { id: 8 } },
                        productOfferingId: 11,
                    },
                },
            ]);
        });
    });

    describe("isReEnrollable()", () => {
        it("returns true if existing coverage is re-enrollable", () => {
            const planOffering = {
                id: 555,
                productOfferingId: 11,
                plan: { plan: { id: 12 }, characteristics: [] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;
            const enrollment = {
                id: 1,
                carrierStatus: "ACTIVE",
                taxStatus: "PRETAX",
                plan: { plan: { id: 12 } } as Plan,
                validity: { expiresAfter: "23/01/2021" },
            } as Enrollments;

            const result = isReEnrollable(planOffering, [enrollment]);
            expect(result).toStrictEqual(true);
        });
    });

    describe("filteredPlanOfferings()", () => {
        let planOffering1: PlanOffering;
        let planOffering2: PlanOffering;
        let enrollment: Enrollments;
        beforeEach(() => {
            planOffering1 = {
                id: 555,
                productOfferingId: 11,
                plan: { id: 121, characteristics: [] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;
            planOffering2 = {
                id: 556,
                productOfferingId: 12,
                plan: { id: 123, characteristics: ["SUPPLEMENTARY"] as Characteristics[], product: { id: 8 } as Product } as Plan,
            } as PlanOffering;
            enrollment = {
                id: 1,
                carrierStatus: "ACTIVE",
                taxStatus: "PRETAX",
                plan: { plan: { id: 12 }, dependentPlanIds: [123] } as Plan,
                validity: { expiresAfter: "23/01/2021" },
                status: "APPROVED",
                policyNumber: "PS10201",
            } as Enrollments;
        });
        it("should return supplementary plan only if their base plans are enrolled", () => {
            const result = filteredPlanOfferings([planOffering1, planOffering2], [enrollment], 12);
            expect(result).toStrictEqual([planOffering2]);
        });
        it("should filter out supplementary plan if base plan is not enrolled", () => {
            planOffering2.plan.id = 1;
            const result = filteredPlanOfferings([planOffering2], [enrollment], 12);
            expect(result).toStrictEqual([]);
        });
    });
});
