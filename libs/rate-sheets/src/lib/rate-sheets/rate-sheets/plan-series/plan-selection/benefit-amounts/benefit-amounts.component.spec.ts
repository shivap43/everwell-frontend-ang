import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BenefitAmountsComponent } from "./benefit-amounts.component";
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";
import { RateSheetBenefitAmount } from "@empowered/constants";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, ViewChild } from "@angular/core";

const mockMinimumBenefitAmountsSTD: RateSheetBenefitAmount[] = [
    { units: 5, amount: 500 },
    { units: 6, amount: 600 },
    { units: 7, amount: 700 },
    { units: 8, amount: 800 },
    { units: 9, amount: 900 },
    { units: 10, amount: 1000 },
    { units: 11, amount: 1100 },
    { units: 12, amount: 1200 },
    { units: 13, amount: 1300 },
    { units: 14, amount: 1400 },
    { units: 15, amount: 1500 },
    { units: 16, amount: 1600 },
    { units: 17, amount: 1700 },
    { units: 18, amount: 1800 },
    { units: 19, amount: 1900 },
    { units: 20, amount: 2000 },
    { units: 21, amount: 2100 },
    { units: 22, amount: 2200 },
    { units: 23, amount: 2300 },
    { units: 24, amount: 2400 },
    { units: 25, amount: 2500 },
    { units: 26, amount: 2600 },
    { units: 27, amount: 2700 },
    { units: 28, amount: 2800 },
    { units: 29, amount: 2900 },
    { units: 30, amount: 3000 },
    { units: 31, amount: 3100 },
    { units: 32, amount: 3200 },
    { units: 33, amount: 3300 },
    { units: 34, amount: 3400 },
    { units: 35, amount: 3500 },
    { units: 36, amount: 3600 },
    { units: 37, amount: 3700 },
    { units: 38, amount: 3800 },
    { units: 39, amount: 3900 },
    { units: 40, amount: 4000 },
    { units: 41, amount: 4100 },
    { units: 42, amount: 4200 },
    { units: 43, amount: 4300 },
    { units: 44, amount: 4400 },
    { units: 45, amount: 4500 },
    { units: 46, amount: 4600 },
    { units: 47, amount: 4700 },
    { units: 48, amount: 4800 },
    { units: 49, amount: 4900 },
    { units: 50, amount: 5000 },
    { units: 51, amount: 5100 },
    { units: 52, amount: 5200 },
    { units: 53, amount: 5300 },
    { units: 54, amount: 5400 },
    { units: 55, amount: 5500 },
    { units: 56, amount: 5600 },
    { units: 57, amount: 5700 },
    { units: 58, amount: 5800 },
    { units: 59, amount: 5900 },
    { units: 60, amount: 6000 },
];

const mockMinBenefitAmount = {
    units: 5,
    amount: 500,
};

@Component({
    selector: "empowered-host-component",
    template:
        "<empowered-benefit-amounts [formControl]='benefitAmountFormControl' [benefitAmountOptions]='benefitAmounts'></empowered-benefit-amounts>",
})
class TestHostComponent {
    @ViewChild(BenefitAmountsComponent) benefitAmountsComponent: BenefitAmountsComponent;
    benefitAmountFormControl = new FormControl([]);
    benefitAmounts = [];
}
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("BenefitAmountsComponent", () => {
    let testHost: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BenefitAmountsComponent, TestHostComponent, MockRichTooltipDirective],
            providers: [NGRXStore, provideMockStore({}), FormBuilder, { provide: LanguageService, useValue: mockLanguageService }],
            imports: [ReactiveFormsModule, FormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        testHost = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(testHost).toBeTruthy();
    });

    it("should initialize language strings", () => {
        expect(testHost.benefitAmountsComponent.languageStrings).toBeTruthy();
    });

    describe("getMaxBenefitAmounts()", () => {
        it("should get max benefit options based on min", () => {
            testHost.benefitAmountsComponent.minimumBenefitAmounts = mockMinimumBenefitAmountsSTD;
            testHost.benefitAmountsComponent.getMaxBenefitAmounts(mockMinBenefitAmount.amount);
            expect(testHost.benefitAmountsComponent.maxBenefitAmountOptions).toStrictEqual([
                { units: 5, amount: 500 },
                { units: 6, amount: 600 },
                { units: 7, amount: 700 },
                { units: 8, amount: 800 },
                { units: 9, amount: 900 },
                { units: 10, amount: 1000 },
                { units: 11, amount: 1100 },
                { units: 12, amount: 1200 },
                { units: 13, amount: 1300 },
                { units: 14, amount: 1400 },
            ]);
        });
    });

    describe("writeValue()", () => {
        it("should return null if undefined", () => {
            const spy = jest.spyOn(testHost.benefitAmountsComponent, "writeValue");
            testHost.benefitAmountsComponent.writeValue(undefined);
            expect(spy).toReturnWith(undefined);
        });
    });

    describe("registerOnChange()", () => {
        it("should update onChange", () => {
            testHost.benefitAmountsComponent.registerOnChange(() => {});
            expect(testHost.benefitAmountsComponent.onChange.toString()).toEqual("() => { }");
        });
    });

    describe("registerOnTouched()", () => {
        it("should update onTouched", () => {
            testHost.benefitAmountsComponent.registerOnTouched(() => {});
            expect(testHost.benefitAmountsComponent.onTouched.toString()).toEqual("() => { }");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(testHost.benefitAmountsComponent["unsubscribe$"], "next");
            const spyComplete = jest.spyOn(testHost.benefitAmountsComponent["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
