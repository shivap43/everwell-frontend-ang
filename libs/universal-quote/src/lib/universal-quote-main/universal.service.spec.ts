import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { UniversalService } from "./universal.service";

describe("UniversalService", () => {
    let service: UniversalService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [] });
        service = TestBed.inject(UniversalService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("updateEliminationPeriod()", () => {
        it("should update the update elimination period by 7/7 value", () => {
            const spy = jest.spyOn(service["setEliminationPeriod$"], "next");
            service.updateEliminationPeriod("7/7");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateBenefitAmount()", () => {
        it("should update the benefit amount value of 100 with selected plan benefit amount value", () => {
            const spy = jest.spyOn(service["setBenefitAmount$"], "next");
            service.updateBenefitAmount({
                benefitAmountValue: { key: 0, value: "100" } as unknown as Map<number, string>,
                planBenAmtRadio: { key: 10, value: "100" } as unknown as Map<number, string>,
            });
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateSelectedRiderBenefitAmount()", () => {
        it("should update the benefit amount value as 500 for selected rider", () => {
            const spy = jest.spyOn(service["riderSelectedBenefitAmount$"], "next");
            service.updateSelectedRiderBenefitAmount({ key: 0, value: 500 } as unknown as Map<number, number>);
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("updateChildAge()", () => {
        it("should update the child age as 14 for plan id '1010'", () => {
            const spy = jest.spyOn(service["setChildAge$"], "next");
            service.updateChildAge({ planId: 1010, childAge: 14 });
            expect(spy).toBeCalledTimes(1);
        });
    });
});
