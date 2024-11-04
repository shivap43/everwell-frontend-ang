import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BillingAddressStepComponent } from "./billing-address-step.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { mockMatDialog, mockStore } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("BillingAddressStepComponent", () => {
    let component: BillingAddressStepComponent;
    let fixture: ComponentFixture<BillingAddressStepComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BillingAddressStepComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Store, useValue: mockStore }, { provide: MatDialog, useValue: mockMatDialog }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BillingAddressStepComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
