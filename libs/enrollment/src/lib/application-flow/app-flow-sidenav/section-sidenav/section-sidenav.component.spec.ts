import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SectionSidenavComponent } from "./section-sidenav.component";
import { MockRichTooltipDirective, mockAppFlowService } from "@empowered/testing";
import { AppFlowService } from "@empowered/ngxs-store";

@Component({
    selector: "mat-vertical-stepper",
    template: "",
})
class MockMatVerticalStepperComponent {
    @Input() selectedIndex!: boolean;
}

@Component({
    selector: "mat-step",
    template: "",
})
class MockMatStepComponent {
    @Input() selectedIndex!: boolean;
    @Input() completed!: number;
}

describe("SectionSidenavComponent", () => {
    let component: SectionSidenavComponent;
    let fixture: ComponentFixture<SectionSidenavComponent>;
    let appFlowService: AppFlowService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SectionSidenavComponent, MockMatVerticalStepperComponent, MockMatStepComponent, MockRichTooltipDirective],
            providers: [{ provide: AppFlowService, useValue: mockAppFlowService }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SectionSidenavComponent);
        appFlowService = TestBed.inject(AppFlowService);
        component = fixture.componentInstance;
        component.planData = {
            appData: {
                sections: [{ title: "test" }]
            }
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnChanges()", () => {
        it("should set scrolled to true when unLockAllSteps is true", () => {
            expect.assertions(1);
            component.unLockAllSteps = true;
            component.ngOnChanges();
            expect(component.scrolled).toBeTruthy();
        });
    });

    describe("onSectionChange()", () => {
        it("should set scrolled to false if true", () => {
            expect.assertions(1);
            component.scrolled = true;
            const event = new Event("click");
            component.onSectionChange(event);
            expect(component.scrolled).toBeFalsy();
        });

        it("should set unlock to false if true", () => {
            expect.assertions(1);
            component.unlock = true;
            const event = new Event("click");
            component.onSectionChange(event);
            expect(component.unlock).toBeFalsy();
        });

        it("should call appFlowService when scrolled and unlock are the default false", () => {
            expect.assertions(3);
            const spy = jest.spyOn(appFlowService.CustomSectionChanged$, "next");
            const event = new Event("click");
            component.onSectionChange(event);
            expect(spy).toBeCalled();
            expect(component.scrolled).toBeFalsy();
            expect(component.unlock).toBeFalsy();
        });
    });
});
