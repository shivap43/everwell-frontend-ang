import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ChangeGenderComponent } from "./change-gender.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NgxsModule } from "@ngxs/store";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxMaskPipe } from "ngx-mask";
import { Subscription } from "rxjs";
import { mockMatDialog } from "@empowered/testing";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";
import { MatDatepicker } from "@angular/material/datepicker";

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Component({
    template: "",
    selector: "empowered-pcr-file-upload",
})
class MockPcrFileUploadComponent {
    @Input() formId: number;
    @Input() mpGroup: number;
    @Input() memberId: number;
    @Input() cifNumber: string;
    @Input() isFileUploadFromTransaction: boolean;
    @Input() documentIds = [];
    @Input() newDocumentIds: Array<number>;
}
describe("ChangeGenderComponent", () => {
    let component: ChangeGenderComponent;
    let fixture: ComponentFixture<ChangeGenderComponent>;
    let mockDialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangeGenderComponent, MockMatDatePickerDirective, MockPcrFileUploadComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: NgxMaskPipe, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeGenderComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
    });

    describe("ChangeGenderComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("createFormControl()", () => {
            it("should create the change-gender form", () => {
                component.changeGenderForm = null;
                component.createFormControl();
                expect(component.changeGenderForm).toBeInstanceOf(FormGroup);
                expect(component.changeGenderControls).toBe(component.changeGenderForm.controls);
            });
        });

        describe("openConfirmationPopup()", () => {
            it("should open PolicyChangeRequestConfirmationPopupComponent popup", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.openConfirmationPopup();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestConfirmationPopupComponent, expect.anything());
            });
        });

        describe("cancel()", () => {
            it("should open the PolicyChangeRequestCancelPopupComponent popup", () => {
                const openSpy = jest.spyOn(mockDialog, "open");
                component.cancel();
                expect(openSpy).toHaveBeenCalledWith(PolicyChangeRequestCancelPopupComponent, expect.anything());
            });
        });

        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const subSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];
                component.ngOnDestroy();
                expect(subSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
