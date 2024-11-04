import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PaymentMethodStepComponent } from "./payment-method-step.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { provideMockStore } from "@ngrx/store/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockMatDialog, mockStore } from "@empowered/testing";

describe("PaymentMethodStepComponent", () => {
    let component: PaymentMethodStepComponent;
    let fixture: ComponentFixture<PaymentMethodStepComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaymentMethodStepComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Store, useValue: mockStore }, { provide: MatDialog, useValue: mockMatDialog }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentMethodStepComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
