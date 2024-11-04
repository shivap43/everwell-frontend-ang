import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { ChangeBeneficiaryComponent } from "./change-beneficiary.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Subscription } from "rxjs";
import { MatDatepicker } from "@angular/material/datepicker";
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}
@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}
@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "empowered-add-edit-beneficiary",
    template: "",
})
class MockAddEditBeneficiaryComponent {
    @Input() beneficiary: any;
    @Input() isPrimaryBeneficiary: any;
    @Input() beneficiaryId: number;
}
describe("ChangeBeneficiaryComponent", () => {
    let component: ChangeBeneficiaryComponent;
    let fixture: ComponentFixture<ChangeBeneficiaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ChangeBeneficiaryComponent,
                MockRichTooltipDirective,
                MockAddEditBeneficiaryComponent,
                MockMatDatePickerDirective,
                MockMonIconComponent,
                MockMonSpinnerComponent,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
                { provide: NgxMaskPipe, useValue: {} },
            ],
            imports: [ReactiveFormsModule, NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeBeneficiaryComponent);
        component = fixture.componentInstance;
    });

    describe("ChangeBeneficiaryComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("createFormControl()", () => {
            it("should create changeBeneficiary form instance", () => {
                component.changeBeneficiaryForm = null;
                component.createFormControl();
                expect(component.changeBeneficiaryForm).toBeInstanceOf(FormGroup);
            });
        });

        describe("validateBeneficiarySelection()", () => {
            it("should set error flag to true, for invalid beneficiary", () => {
                component.primaryBeneficiaryList = [];
                component.validateBeneficiarySelection();
                expect(component.showErrorMessage).toBe(true);
            });
        });

        describe("checkIsBeneficarySaved()", () => {
            it("should determine if beneficiary is saved, if either expandBeneficiaryToggle or expandContingentBeneficiaryToggle is true", () => {
                component.expandBeneficiaryToggle = true;
                component.expandContingentBeneficiaryToggle = true;
                component.checkIsBeneficarySaved();
                expect(component.isBeneFiciarySaved).toBe(true);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should unsubscribe from subscriptions", () => {
                const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];

                fixture.destroy();
                expect(subscriptionSpy).toHaveBeenCalled();
            });
        });
    });
});
