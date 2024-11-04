import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ShopCartService } from "./shop-cart.service";

describe("ShopCartService", () => {
    let service: ShopCartService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [],
        });

        service = TestBed.inject(ShopCartService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("expandShopCart()", () => {
        it("should set expandShopCart subject", () => {
            const spy = jest.spyOn(service["expandShopCart$"], "next");
            service.expandShoppingCart();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("displaySpinner()", () => {
        it("should set checkLoader subject", () => {
            const isLoad = {
                isLoading: true,
                isPlanLoading: true,
            };
            const spy = jest.spyOn(service["checkLoader$"], "next");
            service.displaySpinner(isLoad);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("reorderPlan()", () => {
        it("should set planOrderCreateQuote subject", () => {
            const spy = jest.spyOn(service["planOrderCreateQuote$"], "next");
            service.reorderPlan("plan");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("displayReviewKnockoutDialog()", () => {
        it("should set reviewKnockoutQuestion subject", () => {
            const spy = jest.spyOn(service["reviewKnockoutQuestion$"], "next");
            service.displayReviewKnockoutDialog("knockOutData");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeEditPlan()", () => {
        it("should set editPlanSource subject", () => {
            const spy = jest.spyOn(service["editPlanSource$"], "next");
            service.changeEditPlan({ cartItemId: 1, isCloseOverlay: false });
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeRemoveItem()", () => {
        it("should set removeItem subject", () => {
            const spy = jest.spyOn(service["removeItem$"], "next");
            const removeItem = {
                removeProductId: 1,
                removePlanId: 1,
                itemId: 1,
                isCloseOverlay: false,
            };
            service.changeRemoveItem(removeItem);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeHighlightedOverlay()", () => {
        it("should set closeOverlay subject", () => {
            const spy = jest.spyOn(service["closeOverlay$"], "next");
            const isOverlay = {
                isCartOpen: true,
                isMoreOpen: false,
            };
            service.changeHighlightedOverlay(isOverlay);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("closeExpandedOverlayCart()", () => {
        it("should set closeExpandedOverlay subject", () => {
            const spy = jest.spyOn(service["closeExpandedOverlay$"], "next");
            service.closeExpandedOverlayCart(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeCloseLocationOverlay()", () => {
        it("should set closeLocationOverlay subject", () => {
            const spy = jest.spyOn(service["closeLocationOverlay$"], "next");
            const locationOverlay = {
                isCloseOverlay: true,
                selectedState: { abbreviation: "GA", name: "Georgia" },
                selectedCity: "abc",
            };
            service.changeCloseLocationOverlay(locationOverlay);
            expect(spy).toBeCalledTimes(1);
        });
    });
});
