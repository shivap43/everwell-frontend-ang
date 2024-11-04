import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { TpiServices } from "./tpi.service";

describe("TpiServices", () => {
    let service: TpiServices;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            providers: [],
        });

        service = TestBed.inject(TpiServices);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("setStep()", () => {
        it("should set stepChange subject", () => {
            const spy = jest.spyOn(service["stepChange$"], "next");
            service.setStep(1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setPreviousStep()", () => {
        it("should set prevStep subject", () => {
            const spy = jest.spyOn(service["prevStep$"], "next");
            service.setPreviousStep("2");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setIsAgeError()", () => {
        it("should set ageError subject", () => {
            const spy = jest.spyOn(service["ageError$"], "next");
            service.setIsAgeError(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setSSOError()", () => {
        it("should set ssoError subject", () => {
            const spy = jest.spyOn(service["ssoError$"], "next");
            service.setSSOError(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getGroupId()", () => {
        it("should return the groupId", () => {
            const spy = jest.spyOn(Store.prototype, "selectSnapshot").mockReturnValue({ user: { groupId: 1234 } });
            expect(service.getGroupId()).toBe(1234);
        });
    });

    describe("getMemberId()", () => {
        it("should return the memberId", () => {
            const spy = jest.spyOn(Store.prototype, "selectSnapshot").mockReturnValue({ user: { memberId: 1 } });
            expect(service.getMemberId()).toBe(1);
        });
    });
});
