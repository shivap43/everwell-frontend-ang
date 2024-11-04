import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Observable, of, Subscription } from "rxjs";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { Component, forwardRef, Input } from "@angular/core";
import { RouterTestingModule } from "@angular/router/testing";
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { BenefitAmountComponent } from "./benefit-amount.component";
import { LanguageService } from "@empowered/language";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
import { PlanOffering, SettingsDropdownName } from "@empowered/constants";
import { PanelIdentifiers } from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import { mockPlanPanelService } from "@empowered/testing";

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
const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

describe("BenefitAmountComponent", () => {
    let component: BenefitAmountComponent;
    let fixture: ComponentFixture<BenefitAmountComponent>;
    let producerShopComponentStoreService: ProducerShopComponentStoreService;
    let mockPanelIdentifiers: PanelIdentifiers;
    let planPanelService: PlanPanelService;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BenefitAmountComponent, MockMatRadioGroupComponent, MockMatRadioButtonComponent],
            imports: [ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({}),
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                ProducerShopComponentStoreService,
                PlanOfferingService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BenefitAmountComponent);
        component = fixture.componentInstance;
        component.planPanel = {
            planOffering: {
                id: 999,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                },
            } as PlanOffering,
        };
        component.portalRef = portalRef;
        producerShopComponentStoreService = TestBed.inject(ProducerShopComponentStoreService);
        planPanelService = TestBed.inject(PlanPanelService);
        jest.spyOn(planPanelService, "getPanelIdentifiers").mockReturnValue({
            planOfferingId: 1,
            cartId: 2,
            enrollmentId: 3,
        });
        fixture.detectChanges();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        mockPanelIdentifiers = {
            planOfferingId: 999,
        };
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("handleOnApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.handleOnApply(mockPanelIdentifiers);
            expect(spy).toBeCalled();
        });

        it("should exit early if benefitAmount Form is invalid", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertBenefitAmountState");
            component.form.controls.selectedBenefitAmount.setValue(undefined);
            expect(component.form.valid).toBe(false);
            component.handleOnApply(mockPanelIdentifiers);
            expect(spy).not.toBeCalled();
        });

        it("should update producerShopComponentStoreService if form is valid", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertBenefitAmountState");

            component.form.controls.selectedBenefitAmount.setValue(10000);
            component.handleOnApply(mockPanelIdentifiers);

            expect(spy).toBeCalledWith({
                benefitAmount: 10000,
                panelIdentifiers: {
                    planOfferingId: 999,
                },
            });
        });
        describe("using portalRef", () => {
            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(component.portalRef, "hide");
                component.form.controls.selectedBenefitAmount.setValue(10000);
                component.handleOnApply(mockPanelIdentifiers);
                expect(spy).toBeCalled();
            });

            it("should not error when portalRef does not exist", () => {
                // Remove reference to portalRef
                component.portalRef = undefined;
                const spy = jest.spyOn(portalRef, "hide");
                component.handleOnApply(mockPanelIdentifiers);
                // handleOnApply should not error just because portalRef doesn't exist
                expect(spy).not.toBeCalled();
            });
        });
    });

    describe("handleOnReset()", () => {
        it("should set benefitAmount form control value", () => {
            const spy = jest.spyOn(component, "setFormValues");
            component.handleOnReset(10000, mockPanelIdentifiers);
            expect(spy).toBeCalledWith(10000);
        });

        it("should update producerShopComponentStoreService on reset", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertBenefitAmountState");

            component.form.controls.selectedBenefitAmount.setValue(10000);
            component.handleOnReset(10000, mockPanelIdentifiers);

            expect(spy).toBeCalledWith({
                benefitAmount: 10000,
                panelIdentifiers: {
                    planOfferingId: 999,
                },
            });
        });

        it("should mark form as pristine", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.handleOnReset(10000, mockPanelIdentifiers);
            expect(spy).toBeCalled();
        });

        describe("using portalRef", () => {
            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(component.portalRef, "hide");
                component.form.controls.selectedBenefitAmount.setValue(10000);
                component.handleOnApply(mockPanelIdentifiers);
                expect(spy).toBeCalled();
            });

            it("should not error when portalRef does not exist", () => {
                // Remove reference to portalRef
                component.portalRef = undefined;
                const spy = jest.spyOn(portalRef, "hide");
                component.handleOnApply(mockPanelIdentifiers);
                // handleOnApply should not error just because portalRef doesn't exist
                expect(spy).not.toBeCalled();
            });
        });
    });

    describe("handleOnRevert()", () => {
        it("should set benefitAmount form control value", () => {
            const spy = jest.spyOn(component, "setFormValues");
            component.handleOnRevert(true, 10000);
            expect(spy).toBeCalledWith(10000);
        });

        it("should mark form as pristine", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.handleOnRevert(true, 10000);
            expect(spy).toBeCalled();
        });
    });

    describe("onApply()", () => {
        it("should emit onApply", () => {
            const spy = jest.spyOn(component["onApply$"], "next");
            component.onApply();
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
        it("should emit onReset", () => {
            const spy = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert Form", () => {
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

    describe("setFormValues()", () => {
        it("should set benefitAmount form control value", () => {
            const spy = jest.spyOn(component.form.controls.selectedBenefitAmount, "setValue");
            component.setFormValues(10000);
            expect(spy).toBeCalledWith(10000);
        });
    });

    describe("trackByBenefitAmount()", () => {
        it("should return the benefitAmount value for tracking", () => {
            const benefitAmount = 10000;
            const value = component.trackByBenefitAmount(1, benefitAmount);
            expect(value).toBe(benefitAmount);
        });
    });
});
