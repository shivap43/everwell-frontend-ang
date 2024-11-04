import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ImportData, PolicyChangeRequestCancelPopupComponent } from "./policy-change-request-cancel-popup.component";

const data = {
    cancelButton: "cancel",
    requestType: "request",
    description: "description",
    cancelModalDisplayType: "type",
} as ImportData;

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("PolicyChangeRequestCancelPopupComponent", () => {
    let component: PolicyChangeRequestCancelPopupComponent;
    let fixture: ComponentFixture<PolicyChangeRequestCancelPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PolicyChangeRequestCancelPopupComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PolicyChangeRequestCancelPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCloseClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCloseClick();
            expect(spy1).toBeCalledWith();
        });
    });

    describe("onCancelClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalledWith("cancel");
        });
    });

    describe("onRemoveClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onRemoveClick();
            expect(spy1).toBeCalledWith("remove");
        });
    });
});
