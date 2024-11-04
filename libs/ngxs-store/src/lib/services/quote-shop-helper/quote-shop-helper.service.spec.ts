import { UserState } from "@empowered/user";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { mockStore } from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { QuoteShopHelperService } from "./quote-shop-helper.service";
import { DependencyTypes, PlanOfferingPanel } from "@empowered/constants";

describe("QuoteShopHelperService", () => {
    let service: QuoteShopHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot([UserState])],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                DatePipe,
                provideMockStore({}),
            ],
        });

        service = TestBed.inject(QuoteShopHelperService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("changeSelectedStdJobClass()", () => {
        it("should set the JOB class as selected", () => {
            const spy = jest.spyOn(service["selectedStdJobClass$"], "next");
            service.changeSelectedStdJobClass({
                id: 1,
                name: "Standard class",
            });
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeEnrollmentData()", () => {
        it("should set the enrollment data in the subject", () => {
            const spy = jest.spyOn(service["enrollmentData$"], "next");
            service.changeEnrollmentData({
                enrollmentStateAbbr: "GA",
                enrollmentMethod: "F2F",
            });
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeSelectedProductOfferingIndex()", () => {
        it("should set the selected product offering index as 5", () => {
            const spy = jest.spyOn(service["selectedProductOfferingIndex$"], "next");
            service.changeSelectedProductOfferingIndex(5);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("currentOccupationClassData()", () => {
        it("should set the selected occupation class", () => {
            const spy = jest.spyOn(service["occupationClass$"], "next");
            service.currentOccupationClassData({
                id: 1,
                name: "D",
            });
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("closeAfterSelect()", () => {
        it("should collapse product side-nav drop down for smaller screens", () => {
            const spy = jest.spyOn(service["closeAfterSelect$"], "next");
            service.closeAfterSelect(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onRiderBenAmountChange()", () => {
        it("should set base benefit amount change riders dependent benefit amount change", () => {
            const spy = jest.spyOn(service["riderBenAmountChange$"], "next");
            service.onRiderBenAmountChange({
                id: 12,
            } as PlanOfferingPanel);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("riderBrokerSelected()", () => {
        it("should return true as enrollment requires have broker plan selection", () => {
            const value = service.riderBrokerSelected({
                enrollmentRequirements: [{ dependencyType: DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION }],
                brokerSelected: true,
            } as unknown as PlanOfferingPanel);
            expect(value).toBe(true);
        });

        it("should return false as enrollment requires doesn't have broker plan selection", () => {
            const value = service.riderBrokerSelected({
                enrollmentRequirements: [DependencyTypes.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN],
            } as unknown as PlanOfferingPanel);
            expect(value).toBe(false);
        });
    });

    describe("resetSelectedPlanIndex()", () => {
        it("should reset selected plan index with 0", () => {
            const spy = jest.spyOn(service["selectedPlanIndex$"], "next");
            service.resetSelectedPlanIndex();
            expect(spy).toBeCalledTimes(1);
        });
    });
});
