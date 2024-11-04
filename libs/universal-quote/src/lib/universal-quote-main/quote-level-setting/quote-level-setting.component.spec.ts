import { Overlay, OverlayPositionBuilder } from "@angular/cdk/overlay";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, ElementRef, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { DropDownPortalComponent } from "@empowered/ui";
import { mockDropDownPortal, mockLanguageService, MockTitleCasePipe, mockUserService, mockUtilService } from "@empowered/testing";
import { UtilService } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { NgxsModule } from "@ngxs/store";
import { UniversalService } from "../universal.service";
import { QuoteLevelSettingComponent } from "./quote-level-setting.component";
import { BackdropStyleInput } from "@empowered/constants";
import { Subject } from "rxjs";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

const portalShownSubject = new Subject<void>();
const portalHiddenSubject = new Subject<void>();
@Component({
    selector: "empowered-drop-down-portal",
    template: "",
})
class MockDropdownPortalComponent {
    @Input() backdropAnchor: HTMLElement;
    @Input() ariaTitle: string;
    @Input() backdropStyle: BackdropStyleInput = BackdropStyleInput.NONE;
    @Input() portalClass = "";

    shown = portalShownSubject.asObservable();
    hidden = portalHiddenSubject.asObservable();
}

@Directive({
    selector: "[empoweredPortalTrigger]",
})
class MockPortalTriggerDirective {
    @Input("empoweredPortalTrigger") portalRef: DropDownPortalComponent;
}
describe("QuoteLevelSettingComponent", () => {
    let component: QuoteLevelSettingComponent;
    let fixture: ComponentFixture<QuoteLevelSettingComponent>;
    const formBuilder = new FormBuilder();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                QuoteLevelSettingComponent,
                MockTitleCasePipe,
                MockPortalTriggerDirective,
                MockMonSpinnerComponent,
                MockDropdownPortalComponent,
            ],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialog, useValue: {} },
                { provide: UniversalService, useValue: {} },
                { provide: UtilService, useValue: mockUtilService },
                { provide: UserService, useValue: mockUserService },
                { provide: Overlay, useValue: {} },
                { provide: OverlayPositionBuilder, useValue: {} },
                { provide: ElementRef, useValue: {} },
                FormBuilder,
                DatePipe,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuoteLevelSettingComponent);
        component = fixture.componentInstance;
        component.allStates = [
            {
                abbreviation: "AL",
                name: "Alabama",
            },
            {
                abbreviation: "AK",
                name: "Alaska",
            },
            {
                abbreviation: "CO",
                name: "Colorado",
            },
        ];
        component.settingForm = formBuilder.group({
            state: "Colorado",
            channel: "Payroll",
            payFrequency: "Weekly",
            riskClass: "B",
        });
        component.updateSettingForm = {
            state: "",
            channel: "",
            payFrequency: "",
            riskClass: "",
        };
        component.matSelectPanel = {
            state: "Colorado",
            channel: "Payroll",
            payFrequency: "Weekly",
            riskClass: "C",
        };
        component.statePanel =
            component.channelPanel =
            component.frequencyPanel =
            component.riskClassPanel =
                mockDropDownPortal as DropDownPortalComponent;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeSettingForm()", () => {
        it("should initialize the quote level setting form", () => {
            component.initializeSettingForm("Alabama", "Payroll", "Monthly", "C");
            expect(component.settingForm.controls.state.value).toEqual("Alabama");
            expect(component.settingForm.controls.channel.value).toEqual("Payroll");
            expect(component.settingForm.controls.payFrequency.value).toEqual("Monthly");
            expect(component.settingForm.controls.riskClass.value).toEqual("C");
        });
    });

    describe("getStateName()", () => {
        it("should get state name based on state abbreviation", () => {
            expect(component.getStateName("AL")).toEqual("Alabama");
        });
    });

    describe("getAbbreviation()", () => {
        it("should get state name based on state abbreviation", () => {
            expect(component.getAbbreviation("Colorado")).toEqual("CO");
        });
    });

    describe("settingsOpened()", () => {
        it("should set settingsApplied and settingsChanged to false when settings dropdown is open", () => {
            component.settingsOpened(true, "state");
            expect(component.settingsPortalIsOpen).toBeTruthy();
            expect(component.settingsApplied).toBeFalsy();
            expect(component.settingsChanged).toBeFalsy();
        });
    });

    describe("updateSelectedSettings()", () => {
        it("should update the selected settings", () => {
            component.updateSelectedSettings();
            expect(component.matSelectPanel.state).toEqual("Colorado");
            expect(component.matSelectPanel.channel).toEqual("Payroll");
            expect(component.matSelectPanel.payFrequency).toEqual("Weekly");
            expect(component.matSelectPanel.riskClass).toEqual("B");
        });
    });

    describe("closePanel()", () => {
        it("should close the dropdown portal", () => {
            const spy1 = jest.spyOn(component.statePanel, "hide");
            const spy2 = jest.spyOn(component.channelPanel, "hide");
            const spy3 = jest.spyOn(component.frequencyPanel, "hide");
            const spy4 = jest.spyOn(component.riskClassPanel, "hide");
            component.closePanel();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(spy4).toBeCalled();
        });
    });

    describe("panelChange()", () => {
        it("should update form control values to default if user select any values but not click on apply", () => {
            component.panelChange(false, "state");
            expect(component.settingForm.controls.state.value).toEqual("Colorado");
        });
    });

    describe("getUpdatedSettingFormValue()", () => {
        it("should return updated setting form values", () => {
            const returnValue = component.getUpdatedSettingFormValue();
            expect(returnValue).toEqual(component.settingForm.value);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
