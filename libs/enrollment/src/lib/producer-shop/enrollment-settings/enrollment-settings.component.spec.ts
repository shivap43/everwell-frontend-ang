import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA, TemplateRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { of } from "rxjs";
import { ProducerShopComponentStoreService } from "../services/producer-shop-component-store/producer-shop-component-store.service";
import { EnrollmentSettingsComponent } from "./enrollment-settings.component";
import { CombinedOfferings, RiskClass } from "@empowered/constants";
import { ProductCoverageDate } from "../services/producer-shop-component-store/producer-shop-component-store.model";
import { DropDownPortalComponent, SettingsDropdownContent, SettingsDropdownMeta } from "@empowered/ui";
import { EmpoweredModalService } from "@empowered/common-services";
import { mockDateService, mockStaticUtilService } from "@empowered/testing";
import { DateService } from "@empowered/date";
import { StaticUtilService } from "@empowered/ngxs-store";

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
    selector: "empowered-enrollment-location",
})
class MockEnrollmentLocationComponent {
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-enrollment-method-settings",
})
class MockEnrollmentMethodSettingsComponent {
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-coverage-dates",
})
class MockCoverageDatesComponent {
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-occupation-class",
})
class MockOccupationClassComponent {
    @Input() form!: FormGroup;
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-producer-shop-more-settings",
})
class MockMoreSettingsComponent {
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

const mockMatDialog = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

describe("EnrollmentSettingsComponent", () => {
    let component: EnrollmentSettingsComponent;
    let fixture: ComponentFixture<EnrollmentSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MockSettingsDropdownComponent,
                EnrollmentSettingsComponent,
                MockEnrollmentLocationComponent,
                MockEnrollmentMethodSettingsComponent,
                MockCoverageDatesComponent,
                MockOccupationClassComponent,
                MockMoreSettingsComponent,
            ],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                ProducerShopComponentStoreService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getCoverageDatesLabel()", () => {
        it("should return coverage dates label as Custom", () => {
            const combinedOfferings = [
                {
                    productOffering: {
                        product: {
                            id: 1,
                        },
                    },
                    defaultCoverageStartDate: "2022-05-23",
                },
                {
                    productOffering: {
                        product: {
                            id: 2,
                        },
                    },
                    defaultCoverageStartDate: "2022-05-23",
                },
            ] as CombinedOfferings[];
            const selectedProductCoverageDates = [
                {
                    productId: 1,
                    date: "2022-05-24",
                },
                {
                    productId: 1,
                    date: "2022-05-25",
                },
            ] as ProductCoverageDate[];
            expect(component.getCoverageDatesLabel(combinedOfferings, selectedProductCoverageDates)).toBe(
                "primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom",
            );
        });

        it("should return coverage dates label as Default", () => {
            const combinedOfferings = [
                {
                    productOffering: {
                        product: {
                            id: 1,
                        },
                    },

                    defaultCoverageStartDate: null,
                },
                {
                    productOffering: {
                        product: {
                            id: 2,
                        },
                    },

                    defaultCoverageStartDate: null,
                },
            ] as CombinedOfferings[];
            const selectedProductCoverageDates = [
                {
                    productId: 1,
                    date: "2022-05-23",
                },
                {
                    productId: 2,
                    date: "2022-05-24",
                },
            ] as ProductCoverageDate[];
            expect(component.getCoverageDatesLabel(combinedOfferings, selectedProductCoverageDates)).toBe("primary.portal.classes.default");
        });

        it("should return coverage date as a label if start dates are the same", () => {
            component.coverageDateBoldConfigEnabled = true;
            const combinedOfferings = [
                {
                    productOffering: {
                        product: {
                            id: 1,
                        },
                    },

                    defaultCoverageStartDate: "2022-05-23",
                },
                {
                    productOffering: {
                        product: {
                            id: 2,
                        },
                    },

                    defaultCoverageStartDate: "2022-05-23",
                },
            ] as CombinedOfferings[];
            const selectedProductCoverageDates = [
                {
                    productId: 1,
                    date: "2022-05-23",
                },
                {
                    productId: 2,
                    date: "2022-05-23",
                },
            ] as ProductCoverageDate[];
            expect(component.getCoverageDatesLabel(combinedOfferings, selectedProductCoverageDates)).toBe("2022-05-23");
        });
    });

    describe("getOccupationClassLabel()", () => {
        it("should return empty string if no risk classes", () => {
            expect(component.getOccupationClassLabel(null)).toStrictEqual("");
        });
        it("should show RiskClasses by name with comma separated,", () => {
            const riskClass = {
                name: "RISK_CLASS_A",
            } as RiskClass;
            expect(component.getOccupationClassLabel([riskClass, riskClass])).toStrictEqual("RISK_CLASS_A");
        });
        it("should show only one name if both RiskClasses match,", () => {
            const riskClasses = [
                {
                    name: "RISK_CLASS_A",
                },
                { name: "RISK_CLASS_B" },
            ] as [RiskClass, RiskClass];
            expect(component.getOccupationClassLabel(riskClasses)).toStrictEqual("RISK_CLASS_A, RISK_CLASS_B");
        });
    });

    describe("openEmployerContributionsDialog()", () => {
        it("should open employer contribution dialog", () => {
            const spy = jest.spyOn(component["openEmployerContributionsDialog$"], "next");
            component.openEmployerContributionsDialog();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getLanguageStrings()", () => {
        it("check primary languages", () => {
            expect(component.getLanguageStrings()).toStrictEqual({
                "primary.portal.accounts.accountList.accountLocationColumn": "primary.portal.accounts.accountList.accountLocationColumn",
                "primary.portal.classes.default": "primary.portal.classes.default",
                "primary.portal.common.apply": "primary.portal.common.apply",
                "primary.portal.common.reset": "primary.portal.common.reset",
                "primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom":
                    "primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom",
                "primary.portal.enrollment.enrollment-settings.occupation-class":
                    "primary.portal.enrollment.enrollment-settings.occupation-class",
                "primary.portal.members.contactLabel.method": "primary.portal.members.contactLabel.method",
                "primary.portal.shared.drop-down-modal.opened": "primary.portal.shared.drop-down-modal.opened",
                "primary.portal.shopQuote.more": "primary.portal.shopQuote.more",
                "primary.portal.shoppingCart.quoteLevelSettings.footer.benefitBank":
                    "primary.portal.shoppingCart.quoteLevelSettings.footer.benefitBank",
                "primary.portal.sidenav.aflacCoverageStart": "primary.portal.sidenav.aflacCoverageStart",
                "primary.portal.sidenav.coverageDates": "primary.portal.sidenav.coverageDates",
                "primary.portal.activityHistory.none": "primary.portal.activityHistory.none",
                "primary.portal.census.manualEntry.spouse": "primary.portal.census.manualEntry.spouse",
                "primary.portal.coverage.unknown": "primary.portal.coverage.unknown",
                "primary.portal.pendedBusiness.resolveApplicationModal.applicant":
                    "primary.portal.pendedBusiness.resolveApplicationModal.applicant",
                "primary.portal.register.personalInfo.female": "primary.portal.register.personalInfo.female",
                "primary.portal.register.personalInfo.male": "primary.portal.register.personalInfo.male",
            });
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
