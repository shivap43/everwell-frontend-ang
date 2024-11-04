import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { PdaPolicy } from "@empowered/ui";
import { MockMonSpinnerComponent, mockActivatedRoute, mockDatePipe, mockLanguageService, mockRouter, mockStore } from "@empowered/testing";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { TpiPdaFormComponent } from "./tpi-pda-form.component";
import { PdaForm } from "@empowered/api";
import { EnrollmentMethodModel } from "@empowered/ngxs-store";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { MatFooterRowDef, MatHeaderRowDef, MatRowDef } from "@angular/material/table";
import { StoreModule } from "@ngrx/store";

describe("TpiPdaFormComponent", () => {
    let component: TpiPdaFormComponent;
    let fixture: ComponentFixture<TpiPdaFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiPdaFormComponent, MockMonSpinnerComponent, MatRowDef, MatFooterRowDef, MatHeaderRowDef],
            imports: [HttpClientTestingModule, MatMenuModule, StoreModule.forRoot({})],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                FormBuilder,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiPdaFormComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("checkTaxValues()", () => {
        it("should set hasNewPreTax value to be true if element has newPreTax value", () => {
            const element = {
                newPreTax: 48,
                policyName: "sample name",
            } as PdaPolicy;
            component.checkTaxValues(element);
            expect(component.hasNewPreTax).toBe(true);
        });
        it("should set hasNewPostTax value to be true if element has newPostTax value", () => {
            const element = {
                newPostTax: 46,
                policyName: "sample name",
            } as PdaPolicy;
            component.checkTaxValues(element);
            expect(component.hasNewPostTax).toBe(true);
        });
        it("should set hasOldPreTax value to be true if element has oldPreTax value", () => {
            const element = {
                oldPreTax: 43,
                policyName: "sample name",
            } as PdaPolicy;
            component.checkTaxValues(element);
            expect(component.hasOldPreTax).toBe(true);
        });
        it("should set hasOldPostTax value to be true if element has oldPostTax value", () => {
            const element = {
                oldPostTax: 46,
                policyName: "sample name",
            } as PdaPolicy;
            component.checkTaxValues(element);
            expect(component.hasOldPostTax).toBe(true);
        });
    });

    describe("checkEmpOldPreTax()", () => {
        it("should update totalOldPreCost value", () => {
            const employeeLifePolicy = {
                oldPreTax: 12,
                policyName: "sample name",
            } as PdaPolicy;
            const element = {
                oldPreTax: 45,
                policyName: "sample name",
            } as PdaPolicy;
            component.totalOldPreCost = 0;
            component.checkEmpOldPreTax(employeeLifePolicy, element);
            expect(component.totalOldPreCost).toStrictEqual(45);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });

    describe("definePdaForm()", () => {
        it("should define the pda form adn check for Pin enrollment", () => {
            const spy = jest.spyOn(component, "checkForPinEnrollment");
            component.definePdaForm();
            expect(component.pdaForm).toBeDefined();
            expect(Object.keys(component.pdaForm.controls).length).toBe(16);
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("setEnrollmentState()", () => {
        it("should set the enrollment state to PR when there is no state in the enrollment object", () => {
            component.pdaFormValues = {} as PdaForm;
            component.showPRStateForm = true;
            component.setEnrollmentState();
            expect(component.pdaFormValues.enrollmentState).toStrictEqual("PR");
        });

        it("should set the enrollment state to GA when there is state in the enrollment object", () => {
            component.pdaFormValues = {} as PdaForm;
            component.enrollmentObj = { enrollmentStateAbbreviation: "GA" } as EnrollmentMethodModel;
            component.setEnrollmentState();
            expect(component.pdaFormValues.enrollmentState).toStrictEqual("GA");
        });

        it("should set the enrollment state to the member's state if there is no value in the enrollment object", () => {
            component.pdaFormValues = {} as PdaForm;
            component.pdaFormData = { memberAddress: { state: "NY" } } as PdaForm;
            component.setEnrollmentState();
            expect(component.pdaFormValues.enrollmentState).toStrictEqual("NY");
        });
    });
});
