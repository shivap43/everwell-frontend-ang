import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PolicyChangeRequestConfirmationPopupComponent } from "./policy-change-request-confirmation-popup.component";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal",
})
class MockModalComponent {
    @Input() showCancel: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal-header",
})
class MockModalHeaderComponent {}

@Component({
    template: "",
    selector: "empowered-modal-footer",
})
class MockModalFooterComponent {}

const data = ["cancelButton : Cancel", "continueButton : Continue", "requestType : Change address"];

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("PolicyChangeRequestConfirmationPopupComponent", () => {
    let component: PolicyChangeRequestConfirmationPopupComponent;
    let fixture: ComponentFixture<PolicyChangeRequestConfirmationPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PolicyChangeRequestConfirmationPopupComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
            ],
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
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PolicyChangeRequestConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCancelClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalledWith("cancel");
        });
    });

    describe("onContinueClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onContinueClick();
            expect(spy1).toBeCalledWith("continue");
        });
    });
});
