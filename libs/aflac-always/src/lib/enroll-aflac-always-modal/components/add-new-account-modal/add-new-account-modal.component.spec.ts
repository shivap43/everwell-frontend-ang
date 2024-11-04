import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddNewAccountModalComponent } from "./add-new-account-modal.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { Store } from "@ngxs/store";
import { provideMockStore } from "@ngrx/store/testing";
import { mockMatDialogRef } from "@empowered/testing";

describe("AddNewAccountModalComponent", () => {
    let component: AddNewAccountModalComponent;
    let fixture: ComponentFixture<AddNewAccountModalComponent>;
    let matDialogRef: MatDialogRef<AddNewAccountModalComponent>;

    const mockStore = {
        select: () => of([]),
        selectSnapshot: () => "",
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddNewAccountModalComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: Store, useValue: mockStore },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddNewAccountModalComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCancel()", () => {
        it("should close the popup on calling onCancel", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.onCancel();
            expect(spy1).toBeCalled();
        });
    });

    describe("onClear()", () => {
        it("should reset the form on calling onClear", () => {
            component.formGroup.patchValue({
                accountHolderName: "Test",
                accountNumber: 123,
                accountType: "SAVINGS",
                confirmAccountNumber: 123,
                routingNumber: 123,
            });
            component.onClear();
            expect(component.formGroup.value).toEqual({
                accountHolderName: null,
                accountNumber: null,
                accountType: null,
                confirmAccountNumber: null,
                routingNumber: null,
            });
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize form on calling ngOnInit", () => {
            component.formGroup = null;
            component.ngOnInit();
            expect(component.formGroup).toBeTruthy();
        });
    });
});
