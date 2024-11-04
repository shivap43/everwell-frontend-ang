import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { CoreService } from "@empowered/api";
import { CarrierId, Characteristics, StaticStep } from "@empowered/constants";
import { NgxsModule } from "@ngxs/store";
import { AppFlowSidenavComponent } from "./app-flow-sidenav.component";

const mockDatePipe = {
    transform: (date: string) => "12/12/2021",
} as DatePipe;

@Component({
    template: "",
    selector: "mat-vertical-stepper",
})
export class MockMatVerticalStepperComponent {}

@Component({
    template: "",
    selector: "mat-step",
})
export class MockMatStepComponent {
    @Input() completed;
    @Input() editable;
}

describe("AppFlowSidenavComponent", () => {
    let component: AppFlowSidenavComponent;
    let fixture: ComponentFixture<AppFlowSidenavComponent>;
    let coreService: CoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppFlowSidenavComponent, MockMatVerticalStepperComponent, MockMatStepComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [{ provide: DatePipe, useValue: mockDatePipe }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        coreService = TestBed.inject(CoreService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppFlowSidenavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("displayPDAStep()", () => {
        it("should display PDA step in app flow", () => {
            const resp = component.applicationData?.every(
                (data) =>
                    data.cartData.planOffering.plan.carrierId !== CarrierId.AFLAC ||
                    data.cartData.planOffering.plan.characteristics.some((characteristic) =>
                        [Characteristics.COMPANY_PROVIDED, Characteristics.AUTOENROLLABLE].includes(characteristic),
                    ),
            );
            expect(component.onlyVASandPCPlans).toStrictEqual(resp);
        });
    });

    describe("getStaticSteps()", () => {
        it("should update static steps to One_Signature, PDA, Confirmation if showPda is true", () => {
            const steps = ["One_Signature", "PDA", "Confirmation"];
            component.showPda = true;
            component.onlyVASandPCPlans = false;
            const resp = component.getStaticSteps();
            expect(resp).toStrictEqual(steps);
        });

        it("should update static steps to One_Signature, Confirmation if showPda is false", () => {
            const steps = ["One_Signature", "Confirmation"];
            component.showPda = false;
            component.onlyVASandPCPlans = false;
            const resp = component.getStaticSteps();
            expect(resp).toStrictEqual(steps);
        });
    });

    describe("getCarrierDetails()", () => {
        it("should Get the details of carrier based on carrier ID", () => {
            const id = 1;
            component.getCarrierDetails();
            coreService.getCarrier(id).subscribe((data) => {
                expect(component.carrierDetails[id]).toStrictEqual(data);
            });
        });
    });

    describe("addBillingSteps()", () => {
        beforeEach(() => {
            component.showPda = true;
            component.onlyVASandPCPlans = false;
            component.staticStep = StaticStep;
            component.showAflacAlways = true;
            component.showBilling = true;
            component.resumeCheckCompleted = true;
        });
        it("should add Paylogix_Payment & Payment billing steps if showAflacAlways is false and showEBSBilling is true", () => {
            component.showAflacAlways = false;
            component.showEBSBilling = true;
            component.carrierIds = [1];
            component.addBillingSteps();
            expect(component.carrierLength).toStrictEqual(1);
            expect(component.sideNavSteps).toStrictEqual(["Paylogix_Payment", "Payment", "One_Signature", "PDA", "Confirmation"]);
        });

        it("should add payment billing steps based on based on carrierIds index value of one", () => {
            component.carrierIds = [1, 3, 4];
            component.addBillingSteps();
            expect(component.carrierLength).toStrictEqual(2);
            expect(component.sideNavSteps).toStrictEqual(["Payment", "Payment", "Aflac_Always", "One_Signature", "PDA", "Confirmation"]);
        });

        it("should display the billing steps with Aflac_Always as first step if showBilling is false", () => {
            component.showBilling = false;
            component.carrierLength = 5;
            component.addBillingSteps();
            expect(component.sideNavSteps).toStrictEqual(["Aflac_Always", "One_Signature", "PDA", "Confirmation"]);
        });

        it("should display the billing steps with EBE_PAYMENT as first step if showBilling and showAflacAlways are false and showEBSBilling is true", () => {
            component.showAflacAlways = false;
            component.showBilling = false;
            component.carrierIds = [1, 3, 4];
            component.carrierLength = 5;
            component.showEBSBilling = true;
            component.addBillingSteps();
            expect(component.sideNavSteps).toStrictEqual(["Paylogix_Payment", "One_Signature", "PDA", "Confirmation"]);
        });

        it("should display the billing steps return by getStaticSteps method if showBilling, showAflacAlways and showEBSBilling are false", () => {
            component.showAflacAlways = false;
            component.showBilling = false;
            component.showEBSBilling = false;
            component.addBillingSteps();
            expect(component.sideNavSteps).toStrictEqual(["One_Signature", "PDA", "Confirmation"]);
        });
    });
});
