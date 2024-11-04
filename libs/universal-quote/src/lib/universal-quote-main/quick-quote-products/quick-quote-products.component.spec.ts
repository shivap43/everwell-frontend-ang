import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { UniversalService } from "../universal.service";
import { QuickQuoteProductsComponent } from "./quick-quote-products.component";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

describe("QuickQuoteProductsComponent", () => {
    let component: QuickQuoteProductsComponent;
    let fixture: ComponentFixture<QuickQuoteProductsComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MockMonIconComponent, QuickQuoteProductsComponent],
            providers: [UniversalService],
            imports: [NgxsModule.forRoot()],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickQuoteProductsComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should set selectedIndex to 0 on initial load", () => {
            component.mattabStepper = { selectedIndex: null };
            component.ngOnInit();
            expect(component.mattabStepper.selectedIndex).toBe(0);
        });
    });

    describe("getProductStatus()", () => {
        it("should return true if plans related to product has planPriceSelection", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 1, plans: [{ planPriceSelection: [1, 2] }] }]);
            const returnVal = component.getProductStatus(1);
            expect(returnVal).toBe(true);
        });
        it("should return true if plans related to product has rateSheetSelection", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 1, plans: [{ rateSheetSelection: true }] }]);
            const returnVal = component.getProductStatus(1);
            expect(returnVal).toBe(true);
        });
        it("should return true if plans related to product has multiplePlanPriceSelections", () => {
            enum Enum {
                KEY1 = 1,
                KEY2 = 2,
            }
            const multiplePlanPriceSelections: Readonly<Record<number, number[]>> = {
                [Enum.KEY1]: [100, 200],
                [Enum.KEY2]: [300, 400],
            };
            jest.spyOn(store, "selectSnapshot").mockReturnValue([{ productId: 1, plans: [{ multiplePlanPriceSelections }] }]);
            const returnVal = component.getProductStatus(1);
            expect(returnVal).toBe(true);
        });
        it("should return false if plans related to product has none of the above selections", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue([
                { productId: 1, plans: [{ rateSheetSelection: false, multiplePlanPriceSelections: {}, planPriceSelection: [] }] },
            ]);
            const returnVal = component.getProductStatus(1);
            expect(returnVal).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
