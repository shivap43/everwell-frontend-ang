import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, forwardRef, Input } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { RouterTestingModule } from "@angular/router/testing";
import { Observable, of, Subscription } from "rxjs";
import { Router } from "@angular/router";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { MoreSettingsComponent } from "./more-settings.component";
import { PayFrequency, AppSettings, SettingsDropdownName, TobaccoStatusObject } from "@empowered/constants";
import { DisplayGender } from "./more-settings.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { mockStaticUtilService } from "@empowered/testing";

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent implements ControlValueAccessor {
    @Input() placeholder!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {}

@Component({
    selector: "mat-radio-group",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatRadioGroupComponent),
            multi: true,
        },
    ],
})
class MockMatRadioGroupComponent implements ControlValueAccessor {
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-radio-button",
    template: "",
})
class MockMatRadioButtonComponent {
    @Input() value!: string;
}

@Component({
    selector: "mat-checkbox",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatCheckboxComponent),
            multi: true,
        },
    ],
})
class MockMatCheckboxComponent implements ControlValueAccessor {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Directive({
    selector: "[matInput]",
})
class MockMatInputDirective {}

@Directive({
    selector: "[mat-flat-button]|[mat-button]",
})
class MockMatButtonDirective {}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

const mockAppFlowService = {
    setLatestTobaccoStatus: (tobaccoStatus: TobaccoStatusObject) => {},
} as AppFlowService;

const mockRouter = {
    url: "some route",
};

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

describe("MoreSettingsComponent", () => {
    let component: MoreSettingsComponent;
    let fixture: ComponentFixture<MoreSettingsComponent>;
    let appFlowService: AppFlowService;
    let staticUtilService: StaticUtilService;
    let router: Router;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MoreSettingsComponent,
                MockMatFormFieldComponent,
                MockMatSelectComponent,
                MockMatOptionComponent,
                MockMatRadioGroupComponent,
                MockMatRadioButtonComponent,
                MockMatCheckboxComponent,
                MockMatInputDirective,
                MockMatButtonDirective,
                MockMonAlertComponent,
            ],
            imports: [RouterTestingModule, ReactiveFormsModule],
            providers: [
                NGRXStore,
                provideMockStore({}),
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownStore,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },

                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                ProducerShopComponentStoreService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MoreSettingsComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;
        appFlowService = TestBed.inject(AppFlowService);
        staticUtilService = TestBed.inject(StaticUtilService);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getDisabledFormMessage()", () => {
        it("should use 'primary.portal.accountPendingEnrollments.employee' if url includes AppSettings.PAYROLL", () => {
            const url = "/payroll/";

            jest.spyOn(router, "url", "get").mockReturnValue(url);

            const value = component.getDisabledFormMessage({
                "primary.portal.accountPendingEnrollments.employee": "EMPLOYEE",
                "primary.portal.customer.title.single": "SINGLE",
                "primary.portal.shopQuote.specificPersonDisabledQuoteSettingsMessage": "some #type string",
            });

            expect(value).toBe("some employee string");
        });
    });

    describe("onApply()", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            component.form.setValue({
                mainForm: {
                    payFrequency: {
                        id: 2,
                        frequencyType: "MONTHLY",
                        name: "Monthly",
                        payrollsPerYear: 12,
                    },
                    incomeRate: "Annual",
                    annualTotal: "$80,000.00",
                    hourlyWage: "",
                    hoursPerWeek: "40",
                    weeksPerYear: "52",
                    hourlyTotal: "$80,000.00",
                    memberAge: "41",
                    spouseAge: "39",
                    memberGender: "MALE",
                    spouseGender: "FEMALE",
                    numberOfDependentsExcludingSpouse: 69,
                },
                tobaccoForm: {
                    memberIsTobaccoUser: false,
                    spouseIsTobaccoUser: false,
                },
            });
        });

        it("should update and validate FormGroup", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });

        describe("using portalRef", () => {
            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                expect(spy).toBeCalled();
            });

            it("should not error when portalRef does not exist", () => {
                // Remove reference to portalRef
                component.portalRef = undefined;
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                // onApply should not error just because portalRef doesn't exist
                expect(spy).not.toBeCalled();
            });
        });

        it("should exit early if tobacco FormGroup is invalid", () => {
            component.memberIsTobaccoUser.setValue(undefined);
            component.spouseIsTobaccoUser.setValue(undefined);

            expect(component.form.valid).toBe(false);

            const spy = jest.spyOn(appFlowService, "setLatestTobaccoStatus");

            component.onApply();

            expect(spy).not.toBeCalled();
        });

        it("should not set latest tobacco status using AppFlowService if tobacco FormGroup is disabled", () => {
            component.tobaccoForm.disable();

            expect(component.tobaccoForm.disabled).toBe(true);

            const spy = jest.spyOn(appFlowService, "setLatestTobaccoStatus");

            component.onApply();

            expect(spy).not.toBeCalled();
        });

        it("should set latest tobacco status using AppFlowService if tobacco FormGroup is enabled", () => {
            component.tobaccoForm.enable();

            expect(component.tobaccoForm.disabled).toBe(false);

            component.form.setValue({
                mainForm: {
                    payFrequency: {
                        id: 2,
                        frequencyType: "MONTHLY",
                        name: "Monthly",
                        payrollsPerYear: 12,
                    },
                    incomeRate: "Annual",
                    annualTotal: "$80,000.00",
                    hourlyWage: "",
                    hoursPerWeek: "40",
                    weeksPerYear: "52",
                    hourlyTotal: "$80,000.00",
                    memberAge: "41",
                    spouseAge: "39",
                    memberGender: "MALE",
                    spouseGender: "FEMALE",
                    numberOfDependentsExcludingSpouse: 69,
                },
                tobaccoForm: {
                    memberIsTobaccoUser: false,
                    spouseIsTobaccoUser: false,
                },
            });

            const spy = jest.spyOn(appFlowService, "setLatestTobaccoStatus");

            expect(component.form.valid).toBe(true);

            component.onApply();

            expect(spy).toBeCalledWith({
                tobaccoUser: false,
                spouseTobaccoUser: false,
                employeeTobaccoUpdated: false,
                spouseTobaccoUpdated: false,
            });
        });
    });

    describe("setFormDisabledState()", () => {
        it("should enable main FormGroup", () => {
            const spy = jest.spyOn(component.mainForm, "enable");
            component.setFormDisabledState(true, false, false);
            expect(component.mainForm.enabled).toBe(true);
            expect(component.mainForm.disabled).toBe(false);
            expect(spy).toBeCalledTimes(1);
        });

        it("should disable main FormGroup", () => {
            const spy = jest.spyOn(component.mainForm, "disable");
            component.setFormDisabledState(false, false, false);
            expect(component.mainForm.enabled).toBe(false);
            expect(component.mainForm.disabled).toBe(true);
            expect(spy).toBeCalledTimes(1);
        });

        it("should enable tobacco FormGroup", () => {
            const spy = jest.spyOn(component.tobaccoForm, "enable");
            component.setFormDisabledState(false, false, true);
            expect(component.tobaccoForm.enabled).toBe(true);
            expect(component.tobaccoForm.disabled).toBe(false);
            expect(spy).toBeCalledTimes(1);
        });

        it("should disable tobacco FormGroup", () => {
            const spy = jest.spyOn(component.tobaccoForm, "disable");
            component.setFormDisabledState(false, false, false);
            expect(component.tobaccoForm.enabled).toBe(false);
            expect(component.tobaccoForm.disabled).toBe(true);
            expect(spy).toBeCalledTimes(1);
        });

        it("should enable spouseIsTobaccoUser", () => {
            component.setFormDisabledState(false, true, true);
            expect(component.spouseIsTobaccoUser.enabled).toBe(true);
            expect(component.spouseIsTobaccoUser.disabled).toBe(false);
        });

        it("should disable spouseIsTobaccoUser", () => {
            component.setFormDisabledState(false, false, true);
            expect(component.spouseIsTobaccoUser.enabled).toBe(false);
            expect(component.spouseIsTobaccoUser.disabled).toBe(true);
        });
    });

    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should reset FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalled();
        });
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalled();
        });
    });

    describe("trackByPayFrequencyName()", () => {
        it("should return the payFrequencyName value for tracking", () => {
            const payFrequency = {
                id: 2,
                frequencyType: "MONTHLY",
                name: "Monthly",
                payrollsPerYear: 12,
            } as PayFrequency;
            const payFrequencyName = component.trackByPayFrequencyName(1, payFrequency);
            expect(payFrequencyName).toBe(payFrequency.name);
        });
    });

    describe("trackByDisplayGenderDisplay()", () => {
        it("should return the displayGenderDisplay value for tracking", () => {
            const displayGender = {
                display: "Male",
                gender: "MALE",
            } as DisplayGender;
            const displayGenderDisplay = component.trackByDisplayGenderDisplay(1, displayGender);
            expect(displayGenderDisplay).toBe(displayGender.display);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscriber$"], "next");
            const spy2 = jest.spyOn(component["unsubscriber$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
