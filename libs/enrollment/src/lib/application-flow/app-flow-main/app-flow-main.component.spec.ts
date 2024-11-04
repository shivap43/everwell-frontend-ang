import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { ShoppingCartDisplayService } from "@empowered/api";
import { ApplicationResponse, CustomSection } from "@empowered/constants";
import { AppFlowService } from "@empowered/ngxs-store";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { AppFlowMainComponent } from "./app-flow-main.component";
import { mockAppFlowService } from "@empowered/testing";
import { StoreModule } from "@ngrx/store";

const mockStore = {
    selectSnapshot: () => of(""),
    dispatch: () => of({}),
    select: () => of({}),
} as unknown as Store;

const mockDatePipe = {
    transform: (date: string) => "12/12/2021",
} as DatePipe;

const mockRouter = {
    url: "some route",
} as Router;

@Component({
    template: "",
    selector: "empowered-planinfo-compact",
})
export class MockEmpoweredPlaininfoCompactComponent {
    @Input() application;
}

@Directive({
    selector: "[scrollSpy]",
})
class MockSpiedTagsDirective {
    @Input() spiedTags: string[];
}

describe("AppFlowMainComponent", () => {
    let component: AppFlowMainComponent;
    let fixture: ComponentFixture<AppFlowMainComponent>;
    let shoppingCartDisplayService: ShoppingCartDisplayService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppFlowMainComponent, MockEmpoweredPlaininfoCompactComponent, MockSpiedTagsDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), StoreModule.forRoot({})],
            providers: [
                { provide: Store, useValue: mockStore },
                { provide: DatePipe, useValue: mockDatePipe },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppFlowMainComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngAfterViewInit()", () => {
        it("should set the step height dynamically based on section", () => {
            component.appStepDynamicHeight = null;
            component.appFlowPlan = {
                nativeElement: {
                    clientHeight: 10,
                },
            };
            component.ngAfterViewInit();
            expect(component.appStepDynamicHeight).toEqual(10);
        });
    });

    describe("getTpiAssistingAdminId()", () => {
        it("should get assisting admin id in TPI flow", () => {
            const spy = jest.spyOn(mockAppFlowService, "getTpiAssistingAdminId");
            const adminId = mockAppFlowService.getTpiAssistingAdminId();
            expect(spy).toBeCalled();
            expect(component.tpiAssistingAdminId).toStrictEqual(adminId);
        });
    });

    describe("loadActiveStepSectionDetails()", () => {
        it("should load active step section details", () => {
            component.loadActiveStepSectionDetails(1, 2);
            expect(component.currentSectionIndex).toStrictEqual(1);
            expect(component.currentStepIndex).toStrictEqual(2);
            const sectionId = component.getSectionId("1");
            const stepId = component.getStepId("1", "2");
            expect(component.activeSectionId).toStrictEqual(sectionId);
            expect(component.activestepId).toStrictEqual(stepId);
        });
    });

    describe("saveSkippedStepResponse()", () => {
        it("should Save skipped step responses", () => {
            const mockResponses = [
                {
                    type: "QUESTION",
                    stepId: 23809,
                    value: ["yes"],
                    planQuestionId: 3469,
                    key: "accbde2d83b2df1f90ec1be30f324506",
                },
            ] as ApplicationResponse[];
            const data = component.saveSkippedStepResponse(mockResponses, 1);
            shoppingCartDisplayService.saveApplicationResponse(1, 1, 219032, mockResponses).subscribe((resp) => {
                expect(data).toStrictEqual(resp);
            });
        });
    });

    describe("getSectionId()", () => {
        it("should get section Id", () => {
            const mockResp = "section_0";
            expect(component.getSectionId("0")).toStrictEqual(mockResp);
        });
    });

    describe("getStepId()", () => {
        it("should get step Id", () => {
            const mockResp = "section_0_step_0";
            expect(component.getStepId("0", "0")).toStrictEqual(mockResp);
        });
    });

    describe("scrollToDiv()", () => {
        it("should get section to be scrolled", () => {
            const section = "section_0_step_0";
            component.scrollToDiv(section);
            expect(component.sectionToScroll).toStrictEqual(section);
        });
    });

    describe("getSectionIndexFromId()", () => {
        it("should get section index from section id", () => {
            const section = "section_0_step_1";
            expect(component.getSectionIndexFromId(section)).toEqual(1);
        });
        it("should return section index as undefined when sectionId is undefined", () => {
            expect(component.getSectionIndexFromId(undefined)).toBeUndefined();
        });
    });

    describe("getLastStepForFooter()", () => {
        it("should display the next product name by setting nextClick true, when at the last step of application", () => {
            const spy = jest.spyOn(mockAppFlowService["showNextProductFooter$"], "next");
            const sectionIndex = 0;
            const stepIndex = 0;
            const riderSection = { sectionId: 2 } as CustomSection;
            component.updatedPlanObject = {
                application: {
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
            };
            component.getLastStepForFooter(sectionIndex, stepIndex, riderSection);
            expect(spy).toBeCalledWith({ nextClick: true, data: "" });
        });

        it("should not display the next product name by setting nextClick false, when not at the last step of application", () => {
            const spy = jest.spyOn(mockAppFlowService["showNextProductFooter$"], "next");
            const riderSection = { sectionId: 2 } as CustomSection;
            component.getLastStepForFooter(1, 1, riderSection);
            expect(spy).toBeCalledWith({ nextClick: false, data: null });
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
