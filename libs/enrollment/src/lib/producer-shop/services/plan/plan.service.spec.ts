import { TestBed } from "@angular/core/testing";
import { Characteristics, Plan } from "@empowered/constants";

import { PlanService } from "./plan.service";

describe("PlanService", () => {
    let service: PlanService;

    beforeEach(() => {
        service = TestBed.inject(PlanService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("isSupplementaryPlan()", () => {
        it("should return false if Plan has no characteristics", () => {
            expect(service.isSupplementaryPlan({} as Plan)).toBe(false);
        });

        it("should return false if characteristics excludes Characteristics.SUPPLEMENTARY", () => {
            expect(
                service.isSupplementaryPlan({
                    characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.COMPANY_PROVIDED],
                } as Plan),
            ).toBe(false);
        });

        it("should return true if characteristics includes Characteristics.SUPPLEMENTARY", () => {
            expect(
                service.isSupplementaryPlan({
                    characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.SUPPLEMENTARY, Characteristics.COMPANY_PROVIDED],
                } as Plan),
            ).toBe(true);
        });
    });

    describe("isStackablePlan()", () => {
        it("should return false if Plan has no characteristics", () => {
            expect(service.isStackablePlan({} as Plan)).toBe(false);
        });

        it("should return false if characteristics excludes Characteristics.STACKABLE", () => {
            expect(
                service.isStackablePlan({
                    characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.COMPANY_PROVIDED],
                } as Plan),
            ).toBe(false);
        });

        it("should return true if characteristics includes Characteristics.STACKABLE", () => {
            expect(
                service.isStackablePlan({
                    characteristics: [Characteristics.AUTOENROLLABLE, Characteristics.STACKABLE, Characteristics.COMPANY_PROVIDED],
                } as Plan),
            ).toBe(true);
        });
    });
});
