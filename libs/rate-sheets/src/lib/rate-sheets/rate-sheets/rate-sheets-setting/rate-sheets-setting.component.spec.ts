import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BackdropStyleInput, SettingsDropdownName } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockRateSheetsComponentStoreService } from "@empowered/testing";
import { DropDownPortalComponent, SettingsDropdownContent, SettingsDropdownMeta } from "@empowered/ui";
import { of } from "rxjs";
import { RateSheetsComponentStoreService } from "../rate-sheets-component-store/rate-sheets-component-store.service";
import { RateSheetsSettingComponent } from "./rate-sheets-setting.component";
import { TitleCasePipe } from "@angular/common";

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

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
    selector: "empowered-state",
})
class MockStateComponent {
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-payment-frequency",
})
class MockPaymentFrequencyComponent {
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-job-class",
})
class MockJobClassComponent {
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-channel",
})
class MockChannelComponent {
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Component({
    template: "",
    selector: "empowered-rate-sheet-more-settings",
})
class MockMoreSettingsComponent {
    @Input() meta!: SettingsDropdownMeta;
    @Input() portalRef?: DropDownPortalComponent;
}

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}
describe("RateSheetsSettingComponent", () => {
    let component: RateSheetsSettingComponent;
    let fixture: ComponentFixture<RateSheetsSettingComponent>;
    let languageService: LanguageService;
    let rateSheetsComponentStoreService: RateSheetsComponentStoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RateSheetsSettingComponent,
                MockSettingsDropdownComponent,
                MockStateComponent,
                MockPaymentFrequencyComponent,
                MockJobClassComponent,
                MockChannelComponent,
                MockMoreSettingsComponent,
                MockMonSpinnerComponent,
            ],
            providers: [
                RateSheetsComponentStoreService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
                {
                    provide: TitleCasePipe,
                    useClass: MockTitleCasePipe,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RateSheetsSettingComponent);
        component = fixture.componentInstance;
        languageService = TestBed.inject(LanguageService);
        rateSheetsComponentStoreService = TestBed.inject(RateSheetsComponentStoreService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit", () => {
        it("should set meta data for state portal", () => {
            const result = {
                name: "state",
                class: "rate-sheet-setting",
                trigger: {
                    label: "primary.portal.rateSheets.state",
                    value: of("Georgia"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets state",
                    title: "primary.portal.shared.drop-down-modal.opened",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const spy1 = jest.spyOn(component, "getMeta").mockReturnValue(result);
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(JSON.stringify(component.statePortalMeta)).toEqual(JSON.stringify(result));
        });

        it("should set meta data for channel portal", () => {
            const result = {
                name: "channel",
                class: "rate-sheet-setting",
                trigger: {
                    label: "primary.portal.rateSheets.channel",
                    value: of("Payroll"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets channel",
                    title: "primary.portal.shared.drop-down-modal.opened",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const spy1 = jest.spyOn(component, "getMeta").mockReturnValue(result);
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(JSON.stringify(component.channelPortalMeta)).toEqual(JSON.stringify(result));
        });

        it("should set meta data for payment frequency portal", () => {
            const result = {
                name: "payment",
                class: "rate-sheet-setting",
                trigger: {
                    label: "Payment frequency",
                    value: of("Monthly"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets payment",
                    title: "primary.portal.shared.drop-down-modal.opened",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const spy1 = jest.spyOn(component, "getMeta").mockReturnValue(result);
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(JSON.stringify(component.paymentFrequencyPortalMeta)).toEqual(JSON.stringify(result));
        });

        it("should set meta data for job class portal", () => {
            const result = {
                name: "job",
                class: "rate-sheet-setting",
                trigger: {
                    label: "Job class",
                    value: of("A"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets job",
                    title: "primary.portal.shared.drop-down-modal.opened",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const spy1 = jest.spyOn(component, "getMeta").mockReturnValue(result);
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(JSON.stringify(component.jobClassPortalMeta)).toEqual(JSON.stringify(result));
        });

        it("should set meta data for more settings portal", () => {
            const result = {
                name: "more",
                class: "rate-sheet-setting",
                trigger: {
                    label: null,
                    value: of("More"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets more",
                    title: "Entered portal",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const spy1 = jest.spyOn(component, "getMeta").mockReturnValue(result);
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(component.moreSettingsPortalMeta).toStrictEqual(result);
        });
    });

    describe("getMeta", () => {
        it("should get meta data for settings dropdown state", () => {
            const result = {
                name: "state",
                class: "rate-sheet-setting",
                trigger: {
                    label: "State",
                    value: of("Georgia"),
                },
                backdrop: {
                    anchor: null,
                    style: BackdropStyleInput.LIGHT,
                },
                portal: {
                    class: "rate-sheets state",
                    title: "Entered portal",
                },
                footer: {
                    apply: "primary.portal.common.apply",
                    reset: "primary.portal.common.reset",
                },
            } as SettingsDropdownMeta;
            const response = component.getMeta(SettingsDropdownName.STATE, of("Georgia"), "Entered portal", "State");
            expect(JSON.stringify(response)).toEqual(JSON.stringify(result));
        });
    });

    describe("getLanguageStrings", () => {
        it("should get required language strings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.getLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });
});
