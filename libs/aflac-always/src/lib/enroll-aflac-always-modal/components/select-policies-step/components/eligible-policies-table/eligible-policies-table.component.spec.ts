import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EligiblePoliciesTableComponent } from "./eligible-policies-table.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { Store } from "@ngxs/store";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MockReplaceTagPipe, mockMatDialog, mockStore } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatTableModule } from "@angular/material/table";
import { NGRXStore } from "@empowered/ngrx-store";

describe("EligiblePoliciesTableComponent", () => {
    let component: EligiblePoliciesTableComponent;
    let fixture: ComponentFixture<EligiblePoliciesTableComponent>;
    let ngrxStore: NGRXStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EligiblePoliciesTableComponent, MockReplaceTagPipe],
            imports: [HttpClientTestingModule, MatTableModule],
            providers: [
                NGRXStore,
                { provide: Store, useValue: mockStore },
                { provide: MatDialog, useValue: mockMatDialog },
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EligiblePoliciesTableComponent);
        component = fixture.componentInstance;
        ngrxStore = TestBed.inject(NGRXStore);
        jest.spyOn(ngrxStore, "dispatchIfIdle").mockImplementation(() => {});
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("registerOnTouched()", () => {
        it("should set onTouched to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnTouched(mockFn);
            expect(component.onTouched).toBe(mockFn);
        });
    });

    describe("registerOnValidatorChange", () => {
        it("should set onValidationChange to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnValidatorChange(mockFn);
            expect(component.onValidationChange).toBe(mockFn);
        });
    });

    describe("registerOnChange", () => {
        it("should set onChange to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnChange(mockFn);
            expect(component.onChange).toBe(mockFn);
        });
    });
});
