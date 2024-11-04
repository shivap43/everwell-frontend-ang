import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { mockMatDialog, mockMatDialogRef } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { EditStatusPopUpComponent } from "./edit-status-pop-up.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

describe("EditStatusPopUpComponent", () => {
    let component: EditStatusPopUpComponent;
    let fixture: ComponentFixture<EditStatusPopUpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditStatusPopUpComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { particularStatus: "sample_status" } },
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot(), RouterTestingModule, ReactiveFormsModule, FormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditStatusPopUpComponent);
        component = fixture.componentInstance;
    });

    describe("EditStatusPopUpComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("closeForm()", () => {
            it("should close the popup", () => {
                const spy1 = jest.spyOn(component["dialogRef"], "close");
                component.closeForm();
                expect(spy1).toBeCalledWith(null);
            });
        });

        describe("updateStatus()", () => {
            it("should close the popup if pending statuses and selected status matches", () => {
                const closeSpy = jest.spyOn(component["dialogRef"], "close");
                component.defaultStatus = "sample_status";
                component.pendingStatus = [{ name: "sample_status_1" }, { name: "sample_status" }];
                component.updateStatus({});
                expect(closeSpy).toHaveBeenCalled();
            });
        });

        describe("onChange()", () => {
            it("should set radioValue as event value if status are not matching", () => {
                component.defaultStatus = "sample_status";
                component.radioValue = "sample_status_1";
                component.onChange({ value: "changed" });
                expect(component.radioValue).toBe("changed");
            });
        });

        describe("enableAddStatus()", () => {
            it("should set enableAdd as true when user clicks on enter custom status link", () => {
                component.enableAdd = false;
                component.enableAddStatus();
                expect(component.enableAdd).toBe(true);
            });
        });
    });
});
