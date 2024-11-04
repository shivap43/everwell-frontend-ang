import { Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup } from "@angular/forms";
import { Observable, of, Subject, Subscription } from "rxjs";
import { DropDownPortalComponent } from "../../components/drop-down-portal/drop-down-portal/drop-down-portal.component";
import { SettingsDropdownComponentStore } from "./+state/settings-dropdown-store.service";
import { SettingsDropdownContent } from "./settings-dropdown-content";
import { SettingsDropdownMeta } from "./settings-dropdown-meta.interface";
import { SettingsDropdownComponent } from "./settings-dropdown.component";
import { BackdropStyleInput, FooterAction, SettingsDropdownName } from "@empowered/constants";

const EXPECTED_SETTINGS_DROPDOWN_NAME = SettingsDropdownName.MORE;

const MOCK_SETTINGS_META: SettingsDropdownMeta = {
    name: EXPECTED_SETTINGS_DROPDOWN_NAME,
    class: "",
    trigger: {
        value: of(""),
    },
    backdrop: {
        anchor: {} as HTMLElement,
        style: "",
    },
    portal: {
        class: "",
        title: "",
    },
    footer: {
        reset: "reset",
        apply: "apply",
    },
};

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

const mockSettingsDropdownStore = {
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    setFooterAction: (observableOrValue: FooterAction) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

describe("SettingsDropdownComponent", () => {
    let component: SettingsDropdownComponent;
    let fixture: ComponentFixture<SettingsDropdownComponent>;
    let settingsDropdownStore: SettingsDropdownComponentStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SettingsDropdownComponent, MockDropdownPortalComponent, MockPortalTriggerDirective],
            providers: [
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownStore,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsDropdownComponent);
        component = fixture.componentInstance;
        component.portal = TestBed.createComponent(MockDropdownPortalComponent).componentInstance as DropDownPortalComponent;
        component.meta = MOCK_SETTINGS_META;

        settingsDropdownStore = TestBed.inject(SettingsDropdownComponentStore);
        component.settingsDropdownContent = {
            showResetButton$: of(true),
        } as SettingsDropdownContent;

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("portal.shown", () => {
        it("it should set active dropdown to meta name when portal.shown emits", () => {
            const spy = jest.spyOn(settingsDropdownStore, "setActiveDropdown");

            expect(component.meta.name).toBe(EXPECTED_SETTINGS_DROPDOWN_NAME);
            portalShownSubject.next();
            expect(spy).toBeCalledWith(EXPECTED_SETTINGS_DROPDOWN_NAME);
        });
    });

    describe("revert()", () => {
        it("should update footer action state to revert", () => {
            const spy = jest.spyOn(settingsDropdownStore, "setFooterAction");
            component.revert();
            expect(spy).toBeCalledWith(FooterAction.REVERT);
        });
    });

    describe("apply()", () => {
        it("should update footer action state to apply", () => {
            const spy = jest.spyOn(settingsDropdownStore, "setFooterAction");
            component.apply();
            expect(spy).toBeCalledWith(FooterAction.APPLY);
        });
    });

    describe("reset()", () => {
        it("should update footer action state to reset", () => {
            const spy = jest.spyOn(settingsDropdownStore, "setFooterAction");
            component.reset();
            expect(spy).toBeCalledWith(FooterAction.RESET);
        });
    });

    describe("ngOnDestroy", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
