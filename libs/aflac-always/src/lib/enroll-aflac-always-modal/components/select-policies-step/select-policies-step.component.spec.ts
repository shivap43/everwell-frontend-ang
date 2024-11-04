import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SelectPoliciesFormKeys, SelectPoliciesStepComponent } from "./select-policies-step.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { Store } from "@ngxs/store";
import { provideMockStore } from "@ngrx/store/testing";

describe("SelectPoliciesStepComponent", () => {
    let component: SelectPoliciesStepComponent;
    let fixture: ComponentFixture<SelectPoliciesStepComponent>;

    const mockStore = {
        select: () => of([]),
        selectSnapshot: () => "",
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectPoliciesStepComponent],
            providers: [{ provide: MatDialogRef, useValue: {} }, { provide: Store, useValue: mockStore }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelectPoliciesStepComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onChange()", () => {
        it("should set changed value", () => {
            component.onChange({} as SelectPoliciesFormKeys);
            expect(component.value).toBeTruthy();
        });
    });

    describe("writeValue()", () => {
        it("should set value", () => {
            component.writeValue({} as SelectPoliciesFormKeys);
            expect(component.value).toBeTruthy();
        });
    });
});
