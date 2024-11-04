import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { mockStore } from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { Store } from "@ngxs/store";
import { AppFlowService } from "./app-flow.service";
import { StaticStep } from "@empowered/constants";
import { BehaviorSubject } from "rxjs";

describe("ShopCartService", () => {
    let service: AppFlowService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                DatePipe,
                provideMockStore({}),
            ],
        });

        service = TestBed.inject(AppFlowService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("updateCoverageLevelName()", () => {
        it("should set coverageLevelName subject", () => {
            const spy = jest.spyOn(service["coverageLevelName$"], "next");
            service.updateCoverageLevelName("Individual");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changePlanDetails()", () => {
        it("should set pinDetails subject", () => {
            const spy = jest.spyOn(service["pinDetails$"], "next");
            service.changePlanDetails("Accident");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateAncillary()", () => {
        it("should set updateAncillary subject", () => {
            const spy = jest.spyOn(service["updateAncillary$"], "next");
            service.updateAncillary(1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("knockoutTrigger()", () => {
        it("should set knockoutTrigger subject", () => {
            const spy = jest.spyOn(service["knockoutTrigger$"], "next");
            service.knockoutTrigger("Yes");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("UpdateRiderDetails()", () => {
        it("should set UpdateRiderDetails subject", () => {
            const spy = jest.spyOn(service["UpdateRiderDetails$"], "next");
            service.UpdateRiderDetails(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("exitStatus()", () => {
        it("should set exitStatus subject", () => {
            const spy = jest.spyOn(service["exitStatus$"], "next");
            service.exitStatus(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("emitVf2fStep()", () => {
        it("should set vf2fSubSteps subject", () => {
            const spy = jest.spyOn(service["vf2fSubSteps$"], "next");
            service.emitVf2fStep(1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onVf2fSubStepChange()", () => {
        it("should set vf2fSubStepChange subject", () => {
            const spy = jest.spyOn(service["vf2fSubStepChange$"], "next");
            service.onVf2fSubStepChange(1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("emitAdditionalContributionAmount()", () => {
        it("should set additionalContributionAmountSubject subject", () => {
            const spy = jest.spyOn(service["additionalContributionAmountSubject$"], "next");
            service.emitAdditionalContributionAmount("100");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onNextTPIButton() should get the next button name in the TPI footer", () => {
        it("when on lastStep and is only nextProduct", () => {
            const lastStep = true;
            const nextProduct = "asdf";
            const hasAflacAlways = false;
            const fromDirect = false;
            const hasEBSBilling = false;
            const spy = jest.spyOn(service, "onNextTPIButton");
            service.onNextTPIButton(lastStep, nextProduct, hasAflacAlways, fromDirect, hasEBSBilling);
            expect(spy).toReturnWith(nextProduct);
        });

        it("when on lastStep and is only hasAflacAlways", () => {
            const lastStep = true;
            const nextProduct = null;
            const hasAflacAlways = true;
            const fromDirect = false;
            const hasEBSBilling = false;
            const spy = jest.spyOn(service, "onNextTPIButton");
            service.onNextTPIButton(lastStep, nextProduct, hasAflacAlways, fromDirect, hasEBSBilling);
            expect(spy).toReturnWith(StaticStep.AFLAC_ALWAYS);
        });

        it("when on lastStep and is either fromDirect or hasEBSBilling", () => {
            const lastStep = true;
            const nextProduct = null;
            const hasAflacAlways = true;
            const fromDirect = true;
            const hasEBSBilling = false;
            const spy = jest.spyOn(service, "onNextTPIButton");
            service.onNextTPIButton(lastStep, nextProduct, hasAflacAlways, fromDirect, hasEBSBilling);
            expect(spy).toReturnWith(StaticStep.BILLING);
        });

        it("when on lastStep", () => {
            const lastStep = true;
            const nextProduct = null;
            const hasAflacAlways = false;
            const fromDirect = false;
            const hasEBSBilling = false;
            const spy = jest.spyOn(service, "onNextTPIButton");
            service.onNextTPIButton(lastStep, nextProduct, hasAflacAlways, fromDirect, hasEBSBilling);
            expect(spy).toReturnWith(StaticStep.ONE_SIGNATURE);
        });

        it("when not on lastStep", () => {
            const lastStep = false;
            const nextProduct = null;
            const hasAflacAlways = false;
            const fromDirect = false;
            const hasEBSBilling = false;
            const spy = jest.spyOn(service, "onNextTPIButton");
            service.onNextTPIButton(lastStep, nextProduct, hasAflacAlways, fromDirect, hasEBSBilling);
            expect(spy).toReturnWith(undefined);
        });
    });

    describe("setReviewAflacStatus()", () => {
        it("should set reviewAflacAlwaysStatus subject", () => {
            const spy = jest.spyOn(service["reviewAflacAlwaysStatus$"], "next");
            service.setReviewAflacStatus("APPROVE");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getReviewAflacAlwaysStatus()", () => {
        it("should return instance of reviewAflacAlwaysStatus subject", () => {
            const result = service.getReviewAflacAlwaysStatus();
            expect(result).toBeInstanceOf(BehaviorSubject);
        });
    });

    describe("setReviewAflacInitial()", () => {
        it("should set reviewAflacInitial subject", () => {
            const spy = jest.spyOn(service["reviewAflacAlwaysInitial$"], "next");
            service.setReviewAflacInitial("ABC");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getReviewAflacInitial()", () => {
        it("should return instance of reviewAflacInitial subject", () => {
            const result = service.getReviewAflacAlwaysInitial();
            expect(result).toBeInstanceOf(BehaviorSubject);
        });
    });
});
