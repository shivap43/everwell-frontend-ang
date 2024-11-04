import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule } from "@ngxs/store";
import { DependentsComponent } from "./dependents.component";
import { mockAppFlowService, mockMatDialog } from "@empowered/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { Overlay } from "@angular/cdk/overlay";
import { AppFlowService } from "@empowered/ngxs-store";
import { CustomSection, StepData } from "@empowered/constants";
describe("DependentsComponent", () => {
    let component: DependentsComponent;
    let fixture: ComponentFixture<DependentsComponent>;
    let appFlowService: AppFlowService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DependentsComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                DatePipe,
                FormBuilder,
                MatBottomSheet,
                Overlay,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DependentsComponent);
        component = fixture.componentInstance;
        appFlowService = TestBed.inject(AppFlowService);
    });

    describe("DependentsComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("checkPrePopulationStatus", () => {
        it("should check prepopulation status and return true if vsp dependents selected", () => {
            const id = 5;
            component.selectedVspDependents = [2, 3, 4, 5];
            expect(component.checkPrePopulationStatus(id)).toBe(true);
        });
        it("should return undefined if length of selectedVspDependents is 0", () => {
            const id = 5;
            component.selectedVspDependents = [];
            expect(component.checkPrePopulationStatus(id)).toBe(undefined);
        });
    });
    describe("onNext()", () => {
        it("should call onNextClick() method of appFlowService", () => {
            const spy = jest.spyOn(appFlowService, "onNextClick");
            component.planObject = {
                currentStep: 1,
                currentSection: {
                    title: "Sample Title",
                } as CustomSection,
            } as StepData;
            component.onNext();
            expect(spy).toBeCalled();
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
