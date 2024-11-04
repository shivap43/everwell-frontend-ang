import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, Pipe, PipeTransform, forwardRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { StaticUtilService } from "@empowered/ngxs-store";
import { mockLanguageService, mockStaticUtilService } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { UniversalService } from "../universal.service";
import { MoreSettingsComponent } from "./more-settings.component";

@Component({
    selector: "empowered-zip-code-input",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockEmpoweredZipCodeInputComponent),
            multi: true,
        },
    ],
})
class MockEmpoweredZipCodeInputComponent implements ControlValueAccessor {
    @Input() validateOnStateChange;
    @Input() formControl;
    @Input() stateControlValue;
    @Input() readonly;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}
@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}

@Directive({
    selector: "[empoweredNumberValidation]",
})
class MockNumberValidationDirective {
    @Input() allowDecimals: boolean;
    @Input() allowDashes: boolean;
}

describe("MoreSettingsComponent", () => {
    let component: MoreSettingsComponent;
    let fixture: ComponentFixture<MoreSettingsComponent>;
    const formBuilder = new FormBuilder();
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MoreSettingsComponent, MockTitleCasePipe, MockEmpoweredZipCodeInputComponent, MockNumberValidationDirective],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: UniversalService,
                    useValue: {},
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
            ],
            imports: [NgxsModule.forRoot(), ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MoreSettingsComponent);
        component = fixture.componentInstance;
        component.salaryForm = formBuilder.group({
            salarySelection: "hourly",
            annually: 500000,
            hourlyRate: 500,
            hoursPerWeek: 40,
            weeksPerYear: 48,
            hourlyAnnually: 1920,
        });
        languageService = TestBed.inject(LanguageService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeMoreSettingForm()", () => {
        it("should initialize the moreSettingForm", () => {
            component.initializeMoreSettingForm(25, "female", 1022449, "00969", false, 25, "male");
            expect(component.moreSettingForm.controls.age.value).toEqual(25);
            expect(component.moreSettingForm.controls.gender.value).toEqual("female");
            expect(component.moreSettingForm.controls.sicCode.value).toEqual(1022449);
            expect(component.moreSettingForm.controls.zipCode.value).toEqual("00969");
            expect(component.moreSettingForm.controls.tobaccoUser.value).toEqual(false);
            expect(component.moreSettingForm.controls.spouseAge.value).toEqual(25);
            expect(component.moreSettingForm.controls.spouseGender.value).toEqual("male");
        });
    });

    describe("initializeSalaryForm()", () => {
        it("should initialize salaryForm", () => {
            component.initializeSalaryForm("annual", 500000);
            expect(component.salaryForm.controls.salarySelection.value).toEqual("annual");
            expect(component.salaryForm.controls.annually.value).toEqual(500000);
            expect(component.salaryForm.controls.hourlyAnnually.disabled).toBeTruthy();
        });
    });

    describe("resetIfInvalid()", () => {
        it("should reset annually field of salaryForm if salaryForm is invalid and HTMLInputElement event value is hourly", () => {
            const event = {
                value: "hourly",
            } as HTMLInputElement;
            component.salaryForm.setErrors({ formInvalid: true });
            component.resetIfInvalid(event);
            expect(component.salaryForm.controls.annually.value).toEqual(null);
        });
    });

    describe("getLanguageStrings", () => {
        it("should get the languageStrings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.getLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setHourlySalary", () => {
        it("should set the hourly salary", () => {
            component.setHourlySalary();
            expect(component.salaryForm.controls["hourlyAnnually"].value).toEqual(960000);
        });
        it("should set the hourly salary to null if hourlyRate is missing", () => {
            component.salaryForm.controls.hourlyRate.setValue(null);
            component.setHourlySalary();
            expect(component.salaryForm.controls["hourlyAnnually"].value).toBeNull();
        });
        it("should set the hourly salary to null if hoursPerWeek is missing", () => {
            component.salaryForm.controls.hoursPerWeek.setValue(null);
            component.setHourlySalary();
            expect(component.salaryForm.controls["hourlyAnnually"].value).toBeNull();
        });
        it("should set the hourly salary to null if weeksPerYear is missing", () => {
            component.salaryForm.controls.weeksPerYear.setValue(null);
            component.setHourlySalary();
            expect(component.salaryForm.controls["hourlyAnnually"].value).toBeNull();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
            const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(nextSpy).toHaveBeenCalledTimes(1);
            expect(completeSpy).toHaveBeenCalledTimes(1);
        });
    });
});
