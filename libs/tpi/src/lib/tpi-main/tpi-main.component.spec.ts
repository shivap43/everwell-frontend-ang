import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { ShoppingService } from "@empowered/api";
import { TpiSSOModel } from "@empowered/constants";
import { TPIState } from "@empowered/ngxs-store";
import { mockRouter } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";

import { TpiMainComponent } from "./tpi-main.component";

const tpiSSODetail: TpiSSOModel = {
    productId: 12,
    planId: 2,
    user: {
        memberId: 12,
        groupId: 1,
        id: 12,
        username: "sample_username ",
        name: { firstName: "sample_name", lastName: "last_name" },
        partnerId: 123,
        consented: true,
        modal: false,
        producerId: 123,
    },
    modal: true,
};

describe("TpiMainComponent", () => {
    let component: TpiMainComponent;
    let fixture: ComponentFixture<TpiMainComponent>;
    let router: Router;
    let store: Store;
    let shoppingService: ShoppingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiMainComponent],
            providers: [
                {
                    provide: Router,
                    useValue: mockRouter,
                },
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([TPIState])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        shoppingService = TestBed.inject(ShoppingService);
        store.reset({
            ...store.snapshot(),
            TPIState: {
                tpiSSODetail,
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiMainComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onExit", () => {
        it("should close the modal", () => {
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.onExit();
            expect(spy).toBeCalledWith([EXIT]);
        });
    });

    describe("clearCartItem()", () => {
        it("should call clearShoppingCart service", () => {
            const spy = jest.spyOn(shoppingService, "clearShoppingCart");
            component.clearCartItem(tpiSSODetail);
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
