import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { NgxsModule } from "@ngxs/store";
import { AffectedPoliciesComponent } from "./affected-policies.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxMaskPipe } from "ngx-mask";
import { Subscription } from "rxjs";
import { MatDatepicker } from "@angular/material/datepicker";

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

describe("AffectedPoliciesComponent", () => {
    let component: AffectedPoliciesComponent;
    let fixture: ComponentFixture<AffectedPoliciesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AffectedPoliciesComponent, MockMatDatePickerDirective, MockMonSpinnerComponent, MockMonIconComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: Router, useValue: {} },
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
                { provide: NgxMaskPipe, useValue: {} },
            ],
            imports: [ReactiveFormsModule, NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AffectedPoliciesComponent);
        component = fixture.componentInstance;
    });

    describe("AffectedPoliciesComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("createFormControl()", () => {
            it("should initialize the form", () => {
                component.affectedPoliciesForm = null;
                component.validationRegex = {
                    ALPHANUMERIC: "sample",
                };
                component.createFormControl();
                expect(component.affectedPoliciesForm).toBeInstanceOf(FormGroup);
                expect(component.affectedPoliciesControls).toBe(component.affectedPoliciesForm.controls);
            });

            describe("showNoResponseMessage()", () => {
                beforeEach(() => {
                    component.affectedPoliciesForm = null;
                    component.validationRegex = {
                        ALPHANUMERIC: "sample",
                    };
                    component.createFormControl();
                });
                it("should set noPolicyFound error when no policy is found", () => {
                    component.showNoResponseMessage(true);
                    expect(component.affectedPoliciesForm.controls["policyNumber"].errors["noPolicyFound"]).toBe(true);
                });

                it("should set nullify errors if policy is found", () => {
                    component.showNoResponseMessage(false);
                    expect(component.affectedPoliciesForm.controls["policyNumber"].errors).toBe(null);
                });
            });
        });

        describe("ngOnDestroy()", () => {
            it("Should cleanup subscriptions", () => {
                const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
                const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");
                const unsubscribeSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.subscriptions = [new Subscription()];

                fixture.destroy();

                expect(nextSpy).toHaveBeenCalled();
                expect(completeSpy).toHaveBeenCalled();
                expect(unsubscribeSpy).toHaveBeenCalled();
            });
        });
    });
});
