import { TestBed } from "@angular/core/testing";
import { Characteristics, PlanType, PlanOffering, PlanYear } from "@empowered/constants";

import { PlanOfferingService } from "./plan-offering.service";

describe("PlanOfferingService", () => {
    let service: PlanOfferingService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [] });
        service = TestBed.inject(PlanOfferingService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getPlan()", () => {
        it("should get plan of PlanOffering", () => {
            expect(service.getPlan({ plan: { id: 111 } } as PlanOffering)).toStrictEqual({ id: 111 });
        });
    });

    describe("getPlanId()", () => {
        it("should get the Plan id of PlanOffering", () => {
            expect(service.getPlanId({ plan: { id: 111 } } as PlanOffering)).toBe(111);
        });
    });

    describe("getPlanName()", () => {
        it("should get the Plan name of PlanOffering", () => {
            expect(service.getPlanName({ plan: { name: "plan name" } } as PlanOffering)).toBe("plan name");
        });
    });

    describe("getProduct()", () => {
        it("should get product of PlanOffering", () => {
            expect(service.getProduct({ plan: { product: { id: 222 } } } as PlanOffering)).toStrictEqual({ id: 222 });
        });
    });

    describe("getProductId()", () => {
        it("should get Product id of PlanOffering", () => {
            expect(service.getProductId({ plan: { product: { id: 222 } } } as PlanOffering)).toBe(222);
        });
    });

    describe("getProductOfferingId()", () => {
        it("should get ProductOffering id of PlanOffering", () => {
            expect(service.getProductOfferingId({ productOfferingId: 333 } as PlanOffering)).toBe(333);
        });
    });

    describe("isRedirectPlanOffering()", () => {
        it("should return true if PlanOffering type is PlanType.REDIRECT", () => {
            expect(service.isRedirectPlanOffering({ type: PlanType.REDIRECT } as PlanOffering)).toBe(true);
        });
    });

    describe("planOfferingHasSupplementaryPlan()", () => {
        it("should return false if Plan has no characteristics", () => {
            expect(service.planOfferingHasSupplementaryPlan({ plan: {} } as PlanOffering)).toBe(false);
        });

        it("should return false if characteristics excludes Characteristics.SUPPLEMENTARY", () => {
            expect(
                service.planOfferingHasSupplementaryPlan({
                    plan: { characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.COMPANY_PROVIDED] },
                } as PlanOffering),
            ).toBe(false);
        });

        it("should return true if characteristics includes Characteristics.SUPPLEMENTARY", () => {
            expect(
                service.planOfferingHasSupplementaryPlan({
                    plan: {
                        characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.SUPPLEMENTARY, Characteristics.COMPANY_PROVIDED],
                    },
                } as PlanOffering),
            ).toBe(true);
        });
    });

    describe("planOfferingHasStackablePlan()", () => {
        it("should return false if Plan has no characteristics", () => {
            expect(service.planOfferingHasStackablePlan({ plan: {} } as PlanOffering)).toBe(false);
        });

        it("should return false if characteristics excludes Characteristics.STACKABLE", () => {
            expect(
                service.planOfferingHasStackablePlan({
                    plan: { characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.COMPANY_PROVIDED] },
                } as PlanOffering),
            ).toBe(false);
        });

        it("should return true if characteristics includes Characteristics.STACKABLE", () => {
            expect(
                service.planOfferingHasStackablePlan({
                    plan: {
                        characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.STACKABLE, Characteristics.COMPANY_PROVIDED],
                    },
                } as PlanOffering),
            ).toBe(true);
        });
    });

    describe("getOpenEnrollmentPlanYears()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2022/06/21"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return empty array when plan years input is empty", () => {
            expect(service.getOpenEnrollmentPlanYears([])).toStrictEqual([]);
        });

        it("should return empty array when plan years enrollment period is expired", () => {
            expect(
                service.getOpenEnrollmentPlanYears([
                    {
                        enrollmentPeriod: {
                            effectiveStarting: "2021-01-01",
                            expiresAfter: "2021-01-31",
                        },
                    },
                ] as PlanYear[]),
            ).toStrictEqual([]);
        });

        it("should return plan year array when plan years enrollment period is ongoing", () => {
            expect(
                service.getOpenEnrollmentPlanYears([
                    {
                        enrollmentPeriod: {
                            effectiveStarting: "2022-06-01",
                            expiresAfter: "2022-07-31",
                        },
                    },
                ] as PlanYear[]),
            ).toStrictEqual([
                {
                    enrollmentPeriod: {
                        effectiveStarting: "2022-06-01",
                        expiresAfter: "2022-07-31",
                    },
                },
            ]);
        });
    });
});
