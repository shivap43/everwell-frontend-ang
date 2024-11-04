import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlanTypeComponent } from "./plan-type.component";
import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { ADVPlanType } from "@empowered/constants";

@Component({
    selector: "empowered-host-component",
    template: "<empowered-plan-type [formControl]='formControl' [planTypes]='planTypes'></empowered-plan-type>",
})
class TestHostComponent {
    @ViewChild(PlanTypeComponent) planTypeComponent: PlanTypeComponent;
    formControl = new FormControl([]);
    planTypes = [];
}

describe("PlanTypeComponent", () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanTypeComponent, TestHostComponent],
            providers: [NGRXStore, provideMockStore({})],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component.planTypeComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(component.planTypeComponent.formControl.value).toStrictEqual([]);
        });

        it("should propagate values from the model to the view", () => {
            component.formControl.setValue([ADVPlanType.EMPLOYEE_PAID, ADVPlanType.EMPLOYER_PAID]);
            expect(component.planTypeComponent.formControl.value).toStrictEqual([ADVPlanType.EMPLOYEE_PAID, ADVPlanType.EMPLOYER_PAID]);
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize coverage level component", () => {
            component.planTypeComponent.ngOnInit();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component.planTypeComponent["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component.planTypeComponent["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
