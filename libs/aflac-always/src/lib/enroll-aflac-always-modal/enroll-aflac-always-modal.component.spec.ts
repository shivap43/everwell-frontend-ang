import { provideMockStore } from "@ngrx/store/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EnrollAflacAlwaysModalComponent } from "./enroll-aflac-always-modal.component";
import { CUSTOM_ELEMENTS_SCHEMA, Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { Store } from "@ngxs/store";
import { of } from "rxjs";
import {
    mockAppFlowService,
    mockAflacAlwaysHelperService,
    mockMatDialog,
    mockMatDialogData,
    mockStaticUtilService,
    MockComponent,
} from "@empowered/testing";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { MatStepper, MatStepperModule } from "@angular/material/stepper";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AflacAlwaysHelperService } from "./services/aflac-always-helper.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { StepperSelectionEvent } from "@angular/cdk/stepper";

@Component({
    template: "",
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mat-stepper",
})
export class MockMatStepperComponent {
    selectedIndex = 0;
    previous() {}
}

describe("EnrollAflacAlwaysModalComponent", () => {
    let component: EnrollAflacAlwaysModalComponent;
    let fixture: ComponentFixture<EnrollAflacAlwaysModalComponent>;
    let appFlowService: AppFlowService;
    let aflacAlwaysHelperService: AflacAlwaysHelperService;
    let router: Router;

    const mockStore = {
        select: () => of([]),
        selectSnapshot: () => "",
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollAflacAlwaysModalComponent, MockMatStepperComponent, MockComponent],
            imports: [
                MatStepperModule,
                BrowserAnimationsModule,
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([{ path: "tpi/exit", component: MockComponent }]),
            ],
            providers: [
                { provide: MatDialogRef, useValue: mockMatDialog },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: AppFlowService, useValue: mockAppFlowService },
                { provide: AflacAlwaysHelperService, useValue: mockAflacAlwaysHelperService },
                { provide: Store, useValue: mockStore },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollAflacAlwaysModalComponent);
        appFlowService = TestBed.inject(AppFlowService);
        aflacAlwaysHelperService = TestBed.inject(AflacAlwaysHelperService);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onNextClick()", () => {
        it("should set payment step when stepper selected index is 1 and isBilling is false", () => {
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.stepper = { selectedIndex: 1 } as MatStepper;
            // component.stepper.selectedIndex. = 1;
            component.isBilling = false;
            component.onNextClick();
            expect(spy).toBeCalledWith(1);
            expect(component.isNextButtonClicked).toBe(true);
        });

        it("should set billing step when stepper selected index is 1 and isBilling is true", () => {
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.stepper = { selectedIndex: 2 } as MatStepper;
            // component.stepper.selectedIndex = 2;
            component.isBilling = true;
            component.onNextClick();
            expect(spy).toBeCalledWith(2);
            expect(component.isNextButtonClicked).toBe(true);
        });

        it("should call proceedToPaymentStepCheck method selected index is 0", () => {
            component.stepper = { selectedIndex: 0 } as MatStepper;
            const spy = jest.spyOn(component, "proceedToPaymentStepCheck");
            component.onNextClick();
            expect(spy).toBeCalledTimes(1);
            expect(component.isNextButtonClicked).toBe(true);
        });
    });

    describe("nextStep()", () => {
        it("should update 'activeStep' and 'isBilling' when 'stepIndex' is not 2", () => {
            const spy = jest.spyOn(appFlowService, "initalizeBillingStep");
            component.isNextButtonClicked = false;
            component.isStepCompleted = [true,true,false];
            const event: StepperSelectionEvent =  { selectedIndex: 1, previouslySelectedIndex: 0, selectedStep:null, previouslySelectedStep:null};
            component.nextStep(event);
            expect(component.activeStep).toBe(1);
            expect(component.isBilling).toBe(false);
            expect(spy).not.toHaveBeenCalled();
        });

        it("should call 'initalizeBillingStep' and 'paymentStepPosition' when 'stepIndex' is 1 and 'stepper.selectedIndex' is 2", () => {
            const spy = jest.spyOn(appFlowService, "initalizeBillingStep");
            const spy2 = jest.spyOn(appFlowService.paymentStepPosition, "next");
            component.isNextButtonClicked = false;
            component.isStepCompleted = [true,true,true];
            component.stepper = { selectedIndex: 2} as MatStepper;
            const event: StepperSelectionEvent =  { selectedIndex: 1, previouslySelectedIndex: 2, selectedStep:null, previouslySelectedStep:null};
            component.nextStep(event);
            expect(spy).toHaveBeenCalledWith(false);
            expect(spy2).toHaveBeenCalledWith(1);
        });

        it("should set 'isBilling', 'isBillingFromStepper', and 'isNextButtonClicked' when 'stepIndex' is 2 and 'stepper.selectedIndex' is 1 or 3", () => {
            jest.useFakeTimers();
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.isNextButtonClicked = false;
            component.isStepCompleted = [true,true,true];
            component.stepper = { selectedIndex: 0} as MatStepper;
            const event: StepperSelectionEvent =  { selectedIndex: 2, previouslySelectedIndex: 0, selectedStep:null, previouslySelectedStep:null};
            component.nextStep(event);
            expect(component.isBilling).toBe(true);
            expect(component.isBillingFromStepper).toBe(true);
            expect(component.activeStep).toBe(1);
            //expect(component.isNextButtonClicked).toBe(true);
            jest.advanceTimersByTime(3000);
            expect(spy).toHaveBeenCalledWith(1);
            expect(component.isBillingFromStepper).toBe(false);
        });

        it("should call 'paymentStepNext$' directly when 'stepIndex' is 2 and 'stepper.selectedIndex' is 1 or 3", () => {
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.isNextButtonClicked = false;
            component.isStepCompleted = [true,true,true];
            component.stepper = { selectedIndex: 3} as MatStepper;
            const event: StepperSelectionEvent =  { selectedIndex: 2, previouslySelectedIndex: 3, selectedStep:null, previouslySelectedStep:null};
            component.nextStep(event);
            expect(component.isBilling).toBe(true);
            //expect(component.isNextButtonClicked).toBe(true);
            expect(spy).toHaveBeenCalledWith(1);
        });
        
        it("should reset isNextButtonClicked to false at the end of the method", () => {
            component.isNextButtonClicked = true;
            component.isStepCompleted = [true,true,true];
            const event: StepperSelectionEvent =  { selectedIndex: 0, previouslySelectedIndex: 1, selectedStep:null, previouslySelectedStep:null};
            component.nextStep(event);
            expect(component.isNextButtonClicked).toBe(false);
        });
    });

    describe("onCancel()", () => {
        it("should re-set all on initialize billing step to false when AA modal is cancelled", () => {
            const spy = jest.spyOn(appFlowService, "initalizeBillingStep");
            component.onCancel();
            expect(spy).toBeCalledWith(false);
        });

        it("should re-set all on initialize isBilling flag to false when AA modal is cancelled", () => {
            component.onCancel();
            expect(component.isBilling).toBe(false);
        });
    });

    describe("onBackClick()", () => {
        it("should goto payment method step when current step is billing addr and back button is clicked", () => {
            component.stepper.selectedIndex = 3;
            component.onBackClick();
            expect(component.isBilling).toBe(true);
            expect(component.isNextButtonClicked).toBe(false);
        });

        it("should goto select policies step when current step is payment method and back button is clicked", () => {
            component.stepper.selectedIndex = 1;
            component.onBackClick();
            expect(component.activeStep).toBe(0);
            expect(component.isNextButtonClicked).toBe(false);
        });
    });

    describe("proceedToBilling()", () => {
        it("should set paymentStepNext to 1 when isBilling is false and proceed to billing address page", () => {
            component.isBilling = false;
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.proceedToBilling();
            expect(component.isPaymentMethodComplete).toBe(true);
            expect(spy).toHaveBeenCalledWith(1);
            expect(component.isStepCompleted[1]).toBe(true);
        });

        it("should set paymentStepNext to 2 when isBilling is true and proceed to payment settings page", () => {
            component.isBilling = true;
            const spy = jest.spyOn(appFlowService.paymentStepNext$, "next");
            component.proceedToBilling();
            expect(component.isBillingAddressComplete).toBe(true);
            expect(spy).toHaveBeenCalledWith(2);
            expect(component.isStepCompleted[2]).toBe(true);
        });
    });

    describe("onSaveAndCompleteClick()", () => {
        it("should call save and submit behaviour subject when save and submit button is clicked", () => {
            const spy = jest.spyOn(aflacAlwaysHelperService.saveAndSubmit$, "next");
            component.onSaveAndCompleteClick();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onExit()", () => {
        it("should navigate to exit route", () => {
            const spy = jest.spyOn(router, "navigate");
            component.onExit();
            expect(spy).toHaveBeenCalledWith(["tpi/exit"]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should destroy subscriptions", () => {
            const spy1 = jest.spyOn(component.unsubscribe$, "next");
            const spy2 = jest.spyOn(component.unsubscribe$, "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("proceedToBilling()", () => {
        it("should set isPaymentMethodComplete as true when isBilling is false", () => {
            component.isPaymentMethodComplete = false;
            component.isBilling = false;
            const spy = jest.spyOn(appFlowService["paymentStepNext$"], "next");
            component.proceedToBilling();
            expect(component.isPaymentMethodComplete).toBeTruthy();
            expect(spy).toHaveBeenCalled();
        });

        it("should set isBillingAddressComplete as true when isBilling is true", () => {
            component.isBillingAddressComplete = false;
            component.isBilling = true;
            const spy = jest.spyOn(appFlowService["paymentStepNext$"], "next");
            component.proceedToBilling();
            expect(component.isBillingAddressComplete).toBeTruthy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
