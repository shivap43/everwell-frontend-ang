import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { mockRateSheetsComponentStoreService, mockSettingsDropdownComponentStore, mockStore } from "@empowered/testing";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { PaymentFrequencyComponent } from "./payment-frequency.component";
import { Store } from "@ngxs/store";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { DatePipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";

describe("PaymentFrequencyComponent", () => {
    let component: PaymentFrequencyComponent;
    let fixture: ComponentFixture<PaymentFrequencyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaymentFrequencyComponent],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({}),
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownComponentStore,
                },
                DatePipe,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentFrequencyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should reset FormGroup", () => {
            const spy1 = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyComplete = jest.spyOn(component["unsubscriber$"], "complete");
            component.ngOnDestroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
