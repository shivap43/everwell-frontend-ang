import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Enrollments, GetCartItems, PlanOfferingPanel, ProductOfferingPanel } from "@empowered/constants";
import { mockDatePipe, mockMatDialog, mockRouter, mockStore } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { ProductInfoComponent } from "./product-info.component";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AflacLegalNamePipe } from "@empowered/ui";
import { provideMockStore } from "@ngrx/store/testing";

describe("ProductInfoComponent", () => {
    let component: ProductInfoComponent;
    let fixture: ComponentFixture<ProductInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot()],
            declarations: [ProductInfoComponent, AflacLegalNamePipe],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: Store, useValue: mockStore },
                { provide: DatePipe, useValue: mockDatePipe },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProductInfoComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getPlanEnrollment()", () => {
        it("should return plan if planOffering id matches enrollment id", () => {
            const planOffering = {
                id: 12456,
            } as PlanOfferingPanel;
            component.enrollments = [{ planOfferingId: 14536 }, { planOfferingId: 12456 }] as Enrollments[];
            const res = component.getPlanEnrollment(planOffering);
            expect(res).toStrictEqual({ planOfferingId: 12456 });
        });
    });

    describe("datediff()", () => {
        it("should return number of days between two dates", () => {
            const dateToday = new Date("2023-03-06");
            const expiresOn = new Date("2023-12-24");
            const res = component.datediff(dateToday, expiresOn);
            expect(res).toStrictEqual(293);
        });
    });

    describe("getInCartPlan()", () => {
        it("should return plan if planOffering id matches", () => {
            const productOffering = {
                planOfferings: [
                    { id: 1, plan: { id: 21345, name: "Accident" } },
                    { id: 2, plan: { id: 11349, name: "Cancer" } },
                ],
            } as ProductOfferingPanel;
            component.cartItems = [{ planOfferingId: 2 }, { planOfferingId: 5 }] as GetCartItems[];
            const res = component.getInCartPlan(productOffering);
            expect(res).toStrictEqual({ id: 11349, name: "Cancer" });
        });

        it("should return undefined if planOffering id is not matches", () => {
            const productOffering = {
                planOfferings: [
                    { id: 1, plan: { id: 21345, name: "Accident" } },
                    { id: 2, plan: { id: 11349, name: "Cancer" } },
                ],
            } as ProductOfferingPanel;
            component.cartItems = [{ planOfferingId: 8 }, { planOfferingId: 5 }] as GetCartItems[];
            const res = component.getInCartPlan(productOffering);
            expect(res).toStrictEqual(undefined);
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
