import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { PlanSettingsComponent } from "./plan-settings.component";
import { PlanOfferingService } from "../../../services/plan-offering/plan-offering.service";
import { RiderComponentStoreService } from "../../../services/rider-component-store/rider-component-store.service";
import { PlanOfferingWithCartAndEnrollment, PlanOffering } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownContent, SettingsDropdownMeta } from "@empowered/ui";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PanelIdentifiers } from "../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { of } from "rxjs";
import { mockPlanPanelService } from "@empowered/testing";
import { PlanPanelService } from "../../../services/plan-panel/plan-panel.service";
@Component({
    template: "",
    selector: "empowered-settings-dropdown",
})
class MockSettingsDropdownComponent {
    @Input() settingsDropdownContent!: SettingsDropdownContent;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}
@Component({
    template: "",
    selector: "empowered-benefit-amount",
})
class MockBenefitAmountComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}
@Component({
    template: "",
    selector: "empowered-elimination-period",
})
class MockEliminationPeriodComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}
@Component({
    template: "",
    selector: "empowered-dependent-age",
})
class MockDependentAgeComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-riders",
})
class MockRidersComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

const mockLanguageService = {
    fetchPrimaryLanguageValue: (key: string) => key,
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockRiderComponentStoreService = {
    getRiderStatesWithPlanPricings: (panelIdentifiers: PanelIdentifiers) => of([]),
};

describe("PlanSettingsComponent", () => {
    let component: PlanSettingsComponent;
    let fixture: ComponentFixture<PlanSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PlanSettingsComponent,
                MockDependentAgeComponent,
                MockRidersComponent,
                MockBenefitAmountComponent,
                MockEliminationPeriodComponent,
                MockSettingsDropdownComponent,
            ],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                ProducerShopComponentStoreService,
                {
                    provide: RiderComponentStoreService,
                    useValue: mockRiderComponentStoreService,
                },
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
                PlanOfferingService,
            ],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSettingsComponent);
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
    });

    describe("component creation", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
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
