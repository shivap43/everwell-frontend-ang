import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { AppFlowService } from "@empowered/ngxs-store";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { AppSettings } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { ApplicantDetailsComponent } from "./applicant-details.component";
import {
    MockMatButtonDirective,
    MockMatCheckboxComponent,
    MockMatFormFieldComponent,
    MockMatInputDirective,
    MockMatOptionComponent,
    MockMatRadioButtonComponent,
    MockMatRadioGroupComponent,
    MockMatSelectComponent,
    mockAppFlowService,
    mockLanguageService,
    mockRouter,
    mockSettingsDropdownStore,
} from "@empowered/testing";
import { DisplayGender } from "../more-settings/more-settings.model";

describe("ApplicantDetailsComponent", () => {
    let component: ApplicantDetailsComponent;
    let fixture: ComponentFixture<ApplicantDetailsComponent>;
    let appFlowService: AppFlowService;
    let router: Router;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ApplicantDetailsComponent,
                MockMatFormFieldComponent,
                MockMatSelectComponent,
                MockMatOptionComponent,
                MockMatRadioGroupComponent,
                MockMatRadioButtonComponent,
                MockMatCheckboxComponent,
                MockMatInputDirective,
                MockMatButtonDirective,
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
                ProducerShopComponentStoreService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApplicantDetailsComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;

        appFlowService = TestBed.inject(AppFlowService);
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
                "primary.portal.shopQuote.specificPersonDisabledAgeAndGenderMessage": "some #type string",
            });

            expect(value).toBe("some employee string");
        });
    });

    describe("setFormDisabledState()", () => {
        it("should enable main FormGroup", () => {
            const spy = jest.spyOn(component.mainForm, "enable");
            component.setFormDisabledState(true, false);
            expect(component.mainForm.enabled).toBe(true);
            expect(component.mainForm.disabled).toBe(false);
            expect(spy).toBeCalledTimes(1);
        });

        it("should disable main FormGroup", () => {
            const spy = jest.spyOn(component.mainForm, "disable");
            component.setFormDisabledState(false, false);
            expect(component.mainForm.enabled).toBe(false);
            expect(component.mainForm.disabled).toBe(true);
            expect(spy).toBeCalledTimes(1);
        });

        it("should enable tobacco FormGroup", () => {
            const spy = jest.spyOn(component.tobaccoForm, "enable");
            component.setFormDisabledState(false, true);
            expect(component.tobaccoForm.enabled).toBe(true);
            expect(component.tobaccoForm.disabled).toBe(false);
            expect(spy).toBeCalledTimes(1);
        });

        it("should disable tobacco FormGroup", () => {
            const spy = jest.spyOn(component.tobaccoForm, "disable");
            component.setFormDisabledState(false, false);
            expect(component.tobaccoForm.enabled).toBe(false);
            expect(component.tobaccoForm.disabled).toBe(true);
            expect(spy).toBeCalledTimes(1);
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
