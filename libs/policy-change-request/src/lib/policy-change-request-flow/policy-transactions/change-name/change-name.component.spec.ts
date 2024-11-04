import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { Subscription } from "rxjs";
import { ChangeNameComponent } from "./change-name.component";

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

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("ChangeNameComponent", () => {
    let component: ChangeNameComponent;
    let fixture: ComponentFixture<ChangeNameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangeNameComponent, MockMonIconComponent, MockMonSpinnerComponent, MockRichTooltipDirective],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeNameComponent);
        component = fixture.componentInstance;
    });

    describe("ChangeNameComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("createFormControl()", () => {
            beforeEach(() => {
                component.changeNameForm = null;
                component.validationRegex = { NAME: "Sample_Validation" };
                component.createFormControl();
            });
            it("should create formControl", () => {
                expect(component.changeNameForm).toBeInstanceOf(FormGroup);
            });

            describe("validateDocument()", () => {
                beforeEach(() => {
                    component.isSupportiveDocumentsRequired = null;
                    component.changeNameForm.controls["name"].patchValue({
                        lastName: "sameple_lastname",
                    });
                });
                it("should require supportive documents, if policyholder lastname is not equal to entered lastname", () => {
                    component.changeNameForm.controls["documentIds"].setValue([]);
                    component.policyHolderLastName = "different_lastname";
                    component.validateDocument();
                    expect(component.isSupportiveDocumentsRequired).toBe(true);
                });

                it("should not require supportive documents, if policyholder lastname is equal to entered lastname", () => {
                    component.changeNameForm.controls["documentIds"].setValue([1]);
                    component.policyHolderLastName = "sample_lastname";
                    component.validateDocument();
                    expect(component.isSupportiveDocumentsRequired).toBe(false);
                });
            });
        });

        describe("ngOnDestroy()", () => {
            it("Should cleanup subscriptions", () => {
                const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];
                fixture.destroy();
                expect(subscriptionSpy).toHaveBeenCalled();
            });
        });
    });
});
