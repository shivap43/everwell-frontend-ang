import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { SearchProducer } from "@empowered/api";
import { Admin, OverlayOpen, ProdData } from "@empowered/constants";
import { AccountsService } from "./accounts.service";

describe("AccountsService", () => {
    let service: AccountsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [],
        });

        service = TestBed.inject(AccountsService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("setProductSearchList()", () => {
        it("should set setProductSearchList", () => {
            service.setProductSearchList("hello");
            expect(service.producerSearchList).toBe("hello");
        });
    });

    describe("getproducerSearchList()", () => {
        it("should return the value of getproducerSearchList", () => {
            service.producerSearchList = "welcome";
            expect(service.getproducerSearchList()).toBe("welcome");
        });
    });

    describe("setAnyProducerViewed()", () => {
        it("should set isAnyAccountViewed subject", () => {
            const spy = jest.spyOn(service["isAnyAccountViewed$"], "next");
            service.setAnyProducerViewed(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("viewProducerFilter()", () => {
        it("should set showProducerFilter subject", () => {
            const spy = jest.spyOn(service["showProducerFilter$"], "next");
            service.viewProducerFilter(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateResetProspect()", () => {
        it("should set resetProspect subject", () => {
            const spy = jest.spyOn(service["resetProspect$"], "next");
            service.updateResetProspect$(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeSelectedProducer()", () => {
        it("should set prodNameSource subject", () => {
            const spy = jest.spyOn(service["prodNameSource$"], "next");
            service.changeSelectedProducer({ producerName: "aaa" } as ProdData);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("closeExpandedOverlayProducer()", () => {
        it("should set closeExpandedOverlay subject", () => {
            const spy = jest.spyOn(service["closeExpandedOverlay$"], "next");
            service.closeExpandedOverlayProducer({ isOpen: true } as OverlayOpen);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setWritingNumberOfProducer()", () => {
        it("should set wnOfProducer to equal the value passed", () => {
            service.setWritingNumberOfProducer({ id: 1 } as Admin);
            expect(service.wnOfProducer).toEqual({ id: 1 });
        });
    });

    describe("getWritingNumberOfProducer()", () => {
        it("should return the value of wnOfProducer", () => {
            service.wnOfProducer = { id: 1 } as Admin;
            const result = service.getWritingNumberOfProducer();
            expect(result).toEqual({ id: 1 });
        });
    });

    describe("setProducerForProspectList()", () => {
        it("should set the producer prospect list subject", () => {
            const spy = jest.spyOn(service["searchedProducerForProspect$"], "next");
            service.setProducerForProspectList({ id: 1 } as SearchProducer);
            expect(spy).toBeCalledTimes(1);
        });
    });
});
