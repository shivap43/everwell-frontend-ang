import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Observable, of, Subscription } from "rxjs";
import { DependentAgeComponent } from "./dependent-age.component";
import { LanguageService } from "@empowered/language";
import { Component, forwardRef, Input } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../../../services/producer-shop-helper/producer-shop-helper.service";
import { PlanOffering, SettingsDropdownName } from "@empowered/constants";
import { DependentAgeService } from "../../../../services/dependent-age/dependent-age.service";
import { DependentAge } from "./dependent-age.model";
import { PanelIdentifiers } from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import { mockPlanPanelService } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";

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
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

describe("DependentAgeComponent", () => {
    let component: DependentAgeComponent;
    let fixture: ComponentFixture<DependentAgeComponent>;
    let producerShopComponentStoreService: ProducerShopComponentStoreService;
    let mockPanelIdentifiers: PanelIdentifiers;
    let planPanelService: PlanPanelService;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DependentAgeComponent, MockMatRadioGroupComponent, MockMatRadioButtonComponent],
            imports: [ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                NGRXStore,
                provideMockStore({}),
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                { provide: LanguageService, useValue: mockLanguageService },
                FormBuilder,
                ProducerShopComponentStoreService,
                ProducerShopHelperService,
                DependentAgeService,
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DependentAgeComponent);
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

    describe("trackByDependentAge()", () => {
        it("should return the dependentAge value for tracking", () => {
            const value = component.trackByDependentAge(1, DependentAge.TEN);
            expect(value).toBe(10);
        });
    });

    describe("setFormValues()", () => {
        it("should set dependentAge form control value", () => {
            const spy = jest.spyOn(component.form.controls.dependentAge, "setValue");
            component.setFormValues(DependentAge.TEN);
            expect(spy).toBeCalledWith(10);
        });
    });

    describe("handleOnApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.handleOnApply(mockPanelIdentifiers);
            expect(spy).toBeCalled();
        });

        it("should exit early if dependentAge Form is invalid", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertDependentAgeState");
            component.form.controls.dependentAge.setValue(undefined);
            expect(component.form.valid).toBe(false);
            component.handleOnApply(mockPanelIdentifiers);
            expect(spy).not.toBeCalled();
        });

        it("should update producerShopComponentStoreService if form is valid", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertDependentAgeState");

            component.form.controls.dependentAge.setValue(10);
            component.handleOnApply(mockPanelIdentifiers);

            expect(spy).toBeCalledWith({
                dependentAge: 10,
                panelIdentifiers: {
                    planOfferingId: 999,
                },
            });
        });
        describe("using portalRef", () => {
            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(component.portalRef, "hide");
                component.form.controls.dependentAge.setValue(10);
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
        it("should set dependentAge form control value", () => {
            const spy = jest.spyOn(component, "setFormValues");
            component.handleOnReset(DependentAge.TEN, mockPanelIdentifiers);
            expect(spy).toBeCalledWith(10);
        });

        it("should update producerShopComponentStoreService on reset", () => {
            const spy = jest.spyOn(producerShopComponentStoreService, "upsertDependentAgeState");

            component.form.controls.dependentAge.setValue(10);
            component.handleOnReset(DependentAge.TEN, mockPanelIdentifiers);

            expect(spy).toBeCalledWith({
                dependentAge: 10,
                panelIdentifiers: {
                    planOfferingId: 999,
                },
            });
        });

        it("should mark form as pristine", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.handleOnReset(DependentAge.TEN, mockPanelIdentifiers);
            expect(spy).toBeCalled();
        });

        describe("using portalRef", () => {
            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(component.portalRef, "hide");
                component.form.controls.dependentAge.setValue(10);
                component.handleOnReset(DependentAge.TEN, mockPanelIdentifiers);
                expect(spy).toBeCalled();
            });

            it("should not error when portalRef does not exist", () => {
                // Remove reference to portalRef
                component.portalRef = undefined;
                const spy = jest.spyOn(portalRef, "hide");
                component.handleOnReset(DependentAge.TEN, mockPanelIdentifiers);
                // handleOnApply should not error just because portalRef doesn't exist
                expect(spy).not.toBeCalled();
            });
        });
    });

    describe("handleOnRevert()", () => {
        it("should set dependentAge form control value", () => {
            const spy = jest.spyOn(component, "setFormValues");
            component.handleOnRevert(true, DependentAge.TEN);
            expect(spy).toBeCalledWith(10);
        });

        it("should mark form as pristine", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.handleOnRevert(true, 10);
            expect(spy).toBeCalled();
        });
    });
});
