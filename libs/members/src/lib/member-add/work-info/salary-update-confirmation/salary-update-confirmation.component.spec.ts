import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { SalaryUpdateConfirmationComponent } from "./salary-update-confirmation.component";
const mockMatDialogRef = { close: () => {} };
@Component({
    selector: "empowered-modal",
    template: "",
})
class MockEmpoweredModalComponent {
    @Input() showCancel: boolean;
}
@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockEmpoweredModalHeaderComponent {}
@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockEmpoweredModalFooterComponent {}

describe("salaryConformationPopupComponent", () => {
    let component: SalaryUpdateConfirmationComponent;
    let fixture: ComponentFixture<SalaryUpdateConfirmationComponent>;
    let matDialogRef: MatDialogRef<SalaryUpdateConfirmationComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                SalaryUpdateConfirmationComponent,
                MockEmpoweredModalComponent,
                MockEmpoweredModalHeaderComponent,
                MockEmpoweredModalFooterComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(SalaryUpdateConfirmationComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    it("should called when clicked on submit button with true", () => {
        const spy = jest.spyOn(matDialogRef, "close");
        component.onSubmit();
        expect(spy).toBeCalledWith(true);
    });
});
