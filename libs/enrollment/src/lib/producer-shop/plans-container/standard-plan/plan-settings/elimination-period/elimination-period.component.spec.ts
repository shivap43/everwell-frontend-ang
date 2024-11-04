import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { Observable, of, Subscription } from "rxjs";
import { EliminationPeriodComponent } from "./elimination-period.component";
import { Component, forwardRef, Input } from "@angular/core";
import { RouterTestingModule } from "@angular/router/testing";
import { PlanOffering, SettingsDropdownName } from "@empowered/constants";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ValidateRiderStateService } from "../../../../services/validate-rider-state/validate-rider-state.service";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
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

const mockValidateRiderStateService = {} as ValidateRiderStateService;
describe("EliminationPeriodComponent", () => {
    let component: EliminationPeriodComponent;
    let fixture: ComponentFixture<EliminationPeriodComponent>;
    let planPanelService: PlanPanelService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EliminationPeriodComponent, MockMatRadioGroupComponent, MockMatRadioButtonComponent],
            imports: [ReactiveFormsModule, RouterTestingModule],
            providers: [
                ProducerShopComponentStoreService,
                PlanOfferingService,
                FormBuilder,
                NGRXStore,
                provideMockStore({}),
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                { provide: ValidateRiderStateService, useValue: mockValidateRiderStateService },
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EliminationPeriodComponent);
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
        planPanelService = TestBed.inject(PlanPanelService);
        jest.spyOn(planPanelService, "getPanelIdentifiers").mockReturnValue({
            planOfferingId: 1,
            cartId: 2,
            enrollmentId: 3,
        });
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("setFormValues()", () => {
        it("Set form values", () => {
            const eliminationPeriodsState = {
                id: 1,
                name: "some name",
                eliminationPeriod: "0/0 days",
            };
            component.setFormValues(eliminationPeriodsState);
            expect(component.form.controls.selectedEliminationPeriod.value).toBe(eliminationPeriodsState);
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

    describe("trackByEliminationPeriodName()", () => {
        it("should return the eliminationPeriodName value for tracking", () => {
            const eliminationPeriod = {
                id: 1,
                name: "some name",
                eliminationPeriod: "0/0 days",
            } as EliminationPeriod;
            const eliminationPeriodName = component.trackByEliminationPeriodName(1, eliminationPeriod);
            expect(eliminationPeriodName).toBe(eliminationPeriod.name);
        });
    });
});
