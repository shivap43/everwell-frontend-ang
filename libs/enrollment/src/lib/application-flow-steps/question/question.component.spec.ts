import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import { mockDatePipe, mockMatDialog, MockReplaceTagPipe, mockAppFlowService } from "@empowered/testing";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { QuestionComponent } from "./question.component";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { ConfigName, KnockoutType, Operation, Option, Question } from "@empowered/constants";
import { of } from "rxjs";
import { InputType } from "@empowered/api";
import { StoreModule } from "@ngrx/store";
import { Store } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";
import { provideMockStore } from "@ngrx/store/testing";
import { BasePlanApplicationPanel, KnockoutData, StepData } from "@empowered/constants";
import { ViewportScroller } from "@angular/common";

describe("QuestionComponent", () => {
    let component: QuestionComponent;
    let fixture: ComponentFixture<QuestionComponent>;
    let staticUtilService: StaticUtilService;
    let store: Store;
    let viewportScroller: ViewportScroller;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuestionComponent, MockReplaceTagPipe],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, StoreModule.forRoot({})],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                {
                    provide: ViewportScroller,
                    useValue: {
                        scrollToAnchor: jest.fn(),
                    },
                },
                FormBuilder,
                StaticUtilService,
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionComponent);
        staticUtilService = TestBed.inject(StaticUtilService);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        viewportScroller = TestBed.inject(ViewportScroller);
    });

    describe("PlaninfoCompactComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("getStepDataIndex", () => {
        it("should return step index id", () => {
            component.divId = "DivId";
            component.getStepDataIndex(5);
            expect(component.getStepDataIndex(5)).toBe("DivId5");
        });
    });
    describe("scrollToSection()", () => {
        it("should scroll to given section", () => {
            const id = "5";
            component.scrollToSection(id);
            expect(component.sectionToScroll).toBe(id);
        });
    });
    describe("numberValidation()", () => {
        it("should check eventType and call preventDefault", () => {
            const event = { type: "keypress", keyCode: 60, preventDefault: () => {} };
            const spy = jest.spyOn(event, "preventDefault");
            component.numberValidation(event);
            expect(spy).toBeCalled();
        });
        it("should check eventType and not call preventDefault when key press is out of range", () => {
            const event = { type: "keypress", keyCode: 50, preventDefault: () => {} };
            const spy = jest.spyOn(event, "preventDefault");
            component.numberValidation(event);
            expect(spy).not.toBeCalled();
        });
    });

    describe("getQuestionIDsForSelfServiceEnrollment()", () => {
        it("should call cache config service when getQuestionIDsForSelfServiceEnrollment is called", () => {
            const spy1 = jest
                .spyOn(staticUtilService, "cacheConfigValue")
                .mockReturnValue(of(ConfigName.MEMBER_SELFSERVICE_POLICYREPLACE_KNOCKOUTQUESTIONID));
            component.getQuestionIDsForSelfServiceEnrollment();
            expect(spy1).toBeCalledWith(ConfigName.MEMBER_SELFSERVICE_POLICYREPLACE_KNOCKOUTQUESTIONID);
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

    describe("onBack()", () => {
        it("should call on back method", () => {
            const next = jest.spyOn(mockAppFlowService["planChanged$"], "next");
            component.onBack();
            expect(next).toBeCalledTimes(1);
        });
    });

    describe("getShowedOptions()", () => {
        it("should return option with showOption flag as true", () => {
            expect(
                component.getShowedOptions([
                    {
                        showOption: true,
                    },
                    {
                        showOption: false,
                    },
                ] as Option[]).length,
            ).toBe(1);
        });
    });

    describe("resetValues()", () => {
        it("should reset values", () => {
            component.resetValues();
            expect(component.isKnockout).toBe(false);
            expect(component.isSpouseKnockout).toBe(false);
            expect(component.isChildKnockOut).toBe(false);
            expect(component.showError).toBe(false);
        });
    });

    describe("getValue()", () => {
        it("should return first value of the array values", () => {
            const value = component.getValue([100], false);
            expect(value).toBe(100);
        });

        it("should return null", () => {
            const value = component.getValue([], false);
            expect(value).toBe(null);
        });
    });

    describe("createOtherGroup", () => {
        it("should create a formGroup with the correct value", () => {
            // mock data
            const required = true;
            const value: number[] = [];
            const constraints = [{ type: "", operation: Operation.EQUALS, value: "yes" }];
            const options: Option = {
                backToStepElement: "product",
                backToStepLink: "no",
                value: "Products",
                label: "radio",
                constraints: constraints,
                knockoutType: KnockoutType.NOT_APPLICABLE,
            };
            const question: Question = {
                id: 5,
                required: false,
                key: "Select",
                readOnly: false,
                constraints: { type: "", operation: Operation.EQUALS, value: "yes" },
                inputType: InputType.RADIO,
                text: "Are you the proposed insured, actively at work with the employer listed above ?",
                options: [options],
            };

            const result: FormGroup = component.createOtherGroup(required, value, question);

            // Assert form group is created
            expect(result).toBeInstanceOf(FormGroup);

            // Assert the value is updated correctly, no selection has been made
            expect(result.value).toEqual({
                element: null,
            });
        });
    });

    describe("handleBackToStepLink", () => {
        beforeEach(() => {
            component.planObject = {
                application: {
                    cartData: { cartItemId: 1 },
                },
            } as StepData;
            component.application = {
                appData: {
                    sections: [
                        {
                            steps: [
                                {
                                    step: [
                                        { id: 1, question: { name: "replace_existing_insurance" } },
                                        { id: 2, question: { name: "Aflac_Life_GI" } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                cartData: { cartItemId: 1 },
            } as BasePlanApplicationPanel;
        });
        it("should scroll back to the section ", () => {
            const mockdata = {
                stepLink: "Click to coverage section",
                step: "",
                text: "",
            } as KnockoutData;
            const spy1 = jest.spyOn(store, "selectSnapshot").mockReturnValue([
                {
                    appData: {
                        planId: 1,
                        id: 1,
                        sections: [{ steps: [{ step: [{ id: 1, question: { name: "replace_existing_insurance" } }] }] }],
                    },
                    cartData: { cartItemId: 1 },
                },
            ]);
            const spy = jest.spyOn(component, "handleBackToStepLink");
            component.handleBackToStepLink(mockdata);
            expect(spy1).toBeCalledWith(EnrollmentState.GetApplicationPanel);
            expect(spy).toBeCalled();
        });
        it("should scroll back to the Eligibility question ", () => {
            const mockdata = {
                stepLink: "Click to Replacement question",
                step: "",
                text: "",
            } as KnockoutData;
            jest.spyOn(store, "selectSnapshot").mockReturnValue([
                {
                    appData: {
                        planId: 1,
                        id: 1,
                        sections: [{ steps: [{ step: [{ id: 1, question: { name: "replace_existing_insurance" } }] }] }],
                    },
                    cartData: { cartItemId: 1 },
                },
            ]);
            component.handleBackToStepLink(mockdata);
            expect(viewportScroller.scrollToAnchor).toHaveBeenCalledWith("replace_existing_insurance");
        });
        it("should scroll back to the GI question ", () => {
            const mockdata = {
                stepLink: "Click to GI question",
                step: "",
                text: "",
            } as KnockoutData;
            jest.spyOn(store, "selectSnapshot").mockReturnValue([
                {
                    appData: { planId: 1, id: 1, sections: [{ steps: [{ step: [{ id: 2, question: { name: "Aflac_Life_GI" } }] }] }] },
                    cartData: { cartItemId: 1 },
                },
            ]);
            component.handleBackToStepLink(mockdata);
            expect(viewportScroller.scrollToAnchor).toHaveBeenCalledWith("Aflac_Life_GI");
        });
    });

    describe("hideAndShowQuestions", () => {
        it("should hide and show the question", () => {
            component.updatedAppResponses = [
                {
                    stepId: 617420,
                    value: [],
                    key: "",
                    type: "QUESTION",
                    planQuestionId: 51422,
                },
            ];
            component.stepsData = [
                {
                    step: {
                        id: 617420,
                        question: {
                            id: 51422,
                            text: "assigning to the insurer",
                            inputType: "RADIO",
                            required: false,
                            readOnly: true,
                            constraints: [],
                            hideUnlessConstraint: [],
                            requiredConstraint: [],
                            options: [
                                {
                                    value: "yes",
                                    label: "Yes",
                                    constraints: [],
                                    knockoutType: "NOT_APPLICABLE",
                                    knockoutText: "",
                                    required: false,
                                    preselected: true,
                                    requiredConstraint: [],
                                    showOption: true,
                                },
                                {
                                    value: "no",
                                    label: "No",
                                    constraints: [],
                                    knockoutType: "NOT_APPLICABLE",
                                    knockoutText: "",
                                    required: false,
                                    preselected: false,
                                    requiredConstraint: [],
                                    showOption: true,
                                },
                                {
                                    value: "",
                                    label: "No",
                                    constraints: [],
                                    knockoutType: "NOT_APPLICABLE",
                                    knockoutText: "",
                                    required: false,
                                    preselected: true,
                                    requiredConstraint: [],
                                    showOption: true,
                                },
                            ],
                        },
                    },
                },
            ];
            const spy = jest.spyOn(component, "hideAndShowQuestions");
            component.hideAndShowQuestions();
            expect(spy).toBeCalled();
        });
    });
});
