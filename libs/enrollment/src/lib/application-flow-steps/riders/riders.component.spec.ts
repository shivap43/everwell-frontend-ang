import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import { RidersComponent } from "./riders.component";
import { mockAppFlowService } from "@empowered/testing";
import { AppFlowService } from "@empowered/ngxs-store";
import { StepData } from "@empowered/constants";

describe("RidersComponent", () => {
    let component: RidersComponent;
    let fixture: ComponentFixture<RidersComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RidersComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RidersComponent);
        component = fixture.componentInstance;
    });

    describe("RidersComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("onBack()", () => {
        it("should be called on click of back button", () => {
            const spy = jest.spyOn(mockAppFlowService.planChanged$, "next");
            component.onBack();
            expect(spy).toBeCalledWith({ nextClicked: false, discard: false });
        });
    });
    describe("getRiderStepId()", () => {
        it("should return rider step id", () => {
            component.riderSequenceId = 5;
            expect(component.getRiderStepId(3, 4, 5)).toBe(`section_${component.riderSequenceId}_riders_${3}_${4}_${5}`);
        });
    });
    describe("openPdf()", () => {
        it("should open the pdf", () => {
            const spy = jest.spyOn(window, "open");
            component.openPdf("Location");
            expect(spy).toBeCalledWith("Location", "_blank");
        });
    });

    describe("getLastStepForFooter()", () => {
        it("should display the next product name by setting nextClick true, when at the last step of application", () => {
            const spy = jest.spyOn(mockAppFlowService["showNextProductFooter$"], "next");
            component.planObject = { lastStep: true } as StepData;
            component.riderApplications = [
                {
                    cartData: undefined,
                    planId: 0,
                    planName: "",
                    productId: 0,
                    productName: "",
                    appData: {
                        id: 0,
                        planId: 0,
                        riderApplicationIds: [],
                        sections: [
                            {
                                title: "",
                                steps: [{ step: [], showStep: false }],
                                showSection: false,
                            },
                        ],
                    },
                },
            ];
            const riderIndex = 0;
            const sectionIndex = 0;
            const stepIndex = 0;
            component.getLastStepForFooter(riderIndex, sectionIndex, stepIndex);
            expect(spy).toBeCalledWith({ nextClick: true, data: "" });
        });

        it("should not display the next product name by setting nextClick false, when not at the last step of application", () => {
            const spy = jest.spyOn(mockAppFlowService["showNextProductFooter$"], "next");
            component.planObject = { lastStep: false } as StepData;
            component.riderApplications = [
                {
                    cartData: undefined,
                    planId: 0,
                    planName: "",
                    productId: 0,
                    productName: "",
                    appData: {
                        id: 0,
                        planId: 0,
                        riderApplicationIds: [],
                        sections: [
                            {
                                title: "",
                                steps: [{ step: [], showStep: false }],
                                showSection: false,
                            },
                        ],
                    },
                },
            ];
            const riderIndex = 0;
            const sectionIndex = 0;
            const stepIndex = 0;
            component.getLastStepForFooter(riderIndex, sectionIndex, stepIndex);
            expect(spy).toBeCalledWith({ nextClick: false, data: null });
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
