import { BucketPlanFlowComponent } from "./bucket-plan-flow.component";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BenefitsOfferingService, CoreService, MemberService, ShoppingService } from "@empowered/api";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { DatePipe } from "@angular/common";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}
@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return String(value);
    }
}
describe("BucketPlanFlowComponent", () => {
    let component: BucketPlanFlowComponent;
    let fixture: ComponentFixture<BucketPlanFlowComponent>;
    let appFlowService: AppFlowService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                BucketPlanFlowComponent,
                MockMonSpinnerComponent,
                MockReplaceTagPipe,
                MockRichTooltipDirective,
                MockCurrencyPipe,
                MockMonAlertComponent,
            ],
            providers: [
                StaticUtilService,
                BenefitsOfferingService,
                MemberService,
                ShoppingService,
                CoreService,
                LanguageService,
                DatePipe,
                AppFlowService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(BucketPlanFlowComponent);
        component = fixture.componentInstance;
        appFlowService = TestBed.inject(AppFlowService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("nextStep()", () => {
        it("should call onNextClick() method of appFlowService", () => {
            const spy = jest.spyOn(appFlowService, "onNextClick");
            component.planObject = {
                currentStep: 1,
                currentSection: {
                    title: "Sample Title",
                },
            };
            component.nextStep();
            expect(spy).toBeCalled();
        });
    });
    describe("getMinMaxLimits()", () => {
        beforeEach(() => {
            component.contributionLimits = {
                minFamilyContribution: 10,
                maxFamilyContribution: 100,
                minContribution: 15,
                maxContribution: 80,
            };
            component.familyCoveragelevel = true;
            component.isHSA = true;
        });
        it("should set the minLimit and maxLimit based on FamilyContribution if it satisfies the condition", () => {
            component.getMinMaxLimits();
            expect(component.minLimit).toEqual(component.contributionLimits.minFamilyContribution);
            expect(component.maxLimit).toEqual(component.contributionLimits.maxFamilyContribution);
        });
        it("should set the minLimit and maxLimit based on Contribution if does not satisfy the condition", () => {
            component.isHSA = false;
            component.getMinMaxLimits();
            expect(component.minLimit).toEqual(component.contributionLimits.minContribution);
            expect(component.maxLimit).toEqual(component.contributionLimits.maxContribution);
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
