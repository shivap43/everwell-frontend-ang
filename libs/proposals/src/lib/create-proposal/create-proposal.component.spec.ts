import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { CreateProposalComponent } from "./create-proposal.component";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { mockLanguageService, mockDatePipe, MockTitleCasePipe } from "@empowered/testing";
import { EmpStepperService } from "@empowered/emp-stepper";

describe("CreateProposalComponent", () => {
    let component: CreateProposalComponent;
    let fixture: ComponentFixture<CreateProposalComponent>;
    let stepperService: EmpStepperService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreateProposalComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatBottomSheetRef,
                    useValue: {},
                },
                {
                    provide: MAT_BOTTOM_SHEET_DATA,
                    useValue: {},
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                EmpStepperService,
                {
                    provide: TitleCasePipe,
                    useClass: MockTitleCasePipe,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CreateProposalComponent);
        component = fixture.componentInstance;
        stepperService = TestBed.inject(EmpStepperService);
        component.isPendingProducts = false;
        component.defaultStepPosition = 2;
        component.isFinishResuming = false;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("resumeProposalLastStep()", () => {
        it("should called resumeProposal method when lastCompleted step and defaultStep are not same", () => {
            const spy = jest.spyOn(component, "resumeProposal");
            component.lastCompletedStep = { value: "reviewCompleteStep" };
            component.resumeProposalLastStep(false);
            expect(spy).toBeCalledWith(false);
        });

        it("should set resume proposal to true when lastCompleted step and defaultStep are same", () => {
            component.lastCompletedStep = { value: "productDetailsStep" };
            component.resumeProposalLastStep(false);
            expect(component.isFinishResuming).toBeTruthy();
        });
    });

    describe("resumeProposal()", () => {
        it("should finish resuming", () => {
            component.lastCompletedStep = { value: "productDetailsStep" };
            component.resumeProposal(false);
            expect(component.isFinishResuming).toBeTruthy();
        });
    });

    describe("incrementStep()", () => {
        it("should increment step if applicable", () => {
            component.defaultStepPosition = 1;
            component.steps.length = 2;
            component["incrementStep"]();
            expect(component.defaultStepPosition).toEqual(2);
        });
    });

    describe("determineButtonsState()", () => {
        it("should determine button state", () => {
            component.defaultStepPosition = 2;
            component.steps.length = 2;
            component["determineButtonsState"]();
            expect(component.doDisplayPrevious).toBeTruthy();
            expect(component.doDisplayNext).toBeFalsy();
            expect(component.doDisplayComplete).toBeTruthy();
        });
    });

    describe("onClickPrevious()", () => {
        it("should decrement step position and change buttons states", () => {
            component.defaultStepPosition = 2;
            component.steps.length = 3;
            component.onClickPrevious();
            expect(component.defaultStepPosition).toEqual(1);
            expect(component.doDisplayPrevious).toBeFalsy();
            expect(component.doDisplayNext).toBeTruthy();
            expect(component.doDisplayComplete).toBeFalsy();
        });
    });

    describe("onClickNext()", () => {
        it("should execute logic of next button when argument productLoading is true", () => {
            component.defaultStepPosition = 2;
            component.onClickNext(true);
            expect(component.steps[1].evaluateNextStep).toBeTruthy();
            expect(component.isPendingProducts).toBeTruthy();
        });

        it("should execute logic of next button when argument productLoading is false", () => {
            const spy = jest.spyOn(stepperService, "next");
            component.onClickNext(false);
            expect(component.steps[1].evaluateNextStep).toBeTruthy();
            expect(spy).toBeCalled();
        });
    });

    describe("isTouchedAction()", () => {
        it("should determine what tabs can be clicked", () => {
            const spy = jest.spyOn(component["enabledTabIdsSubject$"], "next");
            component.isTouchedAction(true);
            expect(spy).toBeCalledWith([""]);
        });
    });

    describe("determineStepPosition()", () => {
        it("should set the step number if the stepper is not going to an adjacent tab", () => {
            component.determineStepPosition(1);
            expect(component.defaultStepPosition).toStrictEqual(1);
        });
    });

    describe("saveLastCompletedStep()", () => {
        it("should update what the last saved step is", () => {
            component.lastCompletedStep = { id: 102, attribute: "", value: "" };
            component.saveLastCompletedStep("productDetailsStep");
            expect(component.lastCompletedStep.value).toStrictEqual("productDetailsStep");
        });

        it("should create lastCompletedStep and save last step", () => {
            component.lastCompletedStep = null;
            component.saveLastCompletedStep("productDetailsStep");
            expect(component.lastCompletedStep).toStrictEqual({ value: "productDetailsStep" });
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
