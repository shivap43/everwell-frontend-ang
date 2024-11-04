import { Component, OnDestroy, OnInit } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup } from "@angular/forms";
import { Observable, of, Subscription } from "rxjs";
import { FooterAction, SettingsDropdownName } from "@empowered/constants";
import { SettingsDropdownComponentStore } from "./+state/settings-dropdown-store.service";
import { SettingsDropdownContent } from "./settings-dropdown-content";

const EXPECTED_SETTINGS_DROPDOWN_NAME = SettingsDropdownName.METHOD;

@Component({
    selector: "empowered-settings-dropdown-content-mock",
    template: "",
})
class MockSettingsDropdownContentComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    constructor(protected readonly settingsDropdownStore: SettingsDropdownComponentStore) {
        super(settingsDropdownStore, EXPECTED_SETTINGS_DROPDOWN_NAME);
    }

    ngOnInit(): void {
        super.onInit();
    }

    onHide(): void {}

    onShow(): void {}

    onApply(): void {}

    onRevert(): void {}

    onReset(): void {}
}

const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

// To test the abstract class, we need to create an instance with some class that extends the abstract class
describe("SettingsDropdownContent", () => {
    let component: MockSettingsDropdownContentComponent;
    let fixture: ComponentFixture<MockSettingsDropdownContentComponent>;
    let settingsDropdownStore: SettingsDropdownComponentStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MockSettingsDropdownContentComponent],
            providers: [
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownStore,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        settingsDropdownStore = TestBed.inject(SettingsDropdownComponentStore);
    });

    describe("onShow()", () => {
        it("should be called when selectActiveDropdown() emits component's SettingsDropdownName", () => {
            jest.spyOn(settingsDropdownStore, "selectActiveDropdown").mockReturnValue(of(EXPECTED_SETTINGS_DROPDOWN_NAME));

            // Create a fresh component so it runs ngOnInit with the mocked settingsDropdownStore
            fixture = TestBed.createComponent(MockSettingsDropdownContentComponent);
            component = fixture.componentInstance;

            const spy = jest.spyOn(component, "onShow");

            fixture.detectChanges();

            expect(component["name"]).toBe(EXPECTED_SETTINGS_DROPDOWN_NAME);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should be called when selectActiveDropdown() emits anything else than component's SettingsDropdownName", () => {
            const OTHER_SETTINGS_DROPDOWN_NAME = SettingsDropdownName.MORE;

            jest.spyOn(settingsDropdownStore, "selectActiveDropdown").mockReturnValue(of(OTHER_SETTINGS_DROPDOWN_NAME));

            // Create a fresh component so it runs ngOnInit with the mocked settingsDropdownStore
            fixture = TestBed.createComponent(MockSettingsDropdownContentComponent);
            component = fixture.componentInstance;

            const spy = jest.spyOn(component, "onHide");

            fixture.detectChanges();

            expect(component["name"]).not.toBe(OTHER_SETTINGS_DROPDOWN_NAME);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("FooterActions", () => {
        beforeEach(() => {
            // Mock SettingsDropdownContent is active
            jest.spyOn(settingsDropdownStore, "selectActiveDropdown").mockReturnValue(of(EXPECTED_SETTINGS_DROPDOWN_NAME));

            // Create a fresh component so it runs ngOnInit with the mocked settingsDropdownStore
            fixture = TestBed.createComponent(MockSettingsDropdownContentComponent);
            component = fixture.componentInstance;
        });

        describe("onApply()", () => {
            it("should be called when SettingsDropdownContent is active and Store emits FooterAction.APPLY", () => {
                jest.spyOn(settingsDropdownStore, "selectFooter").mockReturnValue(of({ footerAction: FooterAction.APPLY }));

                const spy = jest.spyOn(component, "onApply");

                fixture.detectChanges();

                expect(spy).toBeCalledTimes(1);
            });
        });

        describe("onRevert()", () => {
            it("should be called when SettingsDropdownContent is active and Store emits FooterAction.REVERT", () => {
                jest.spyOn(settingsDropdownStore, "selectFooter").mockReturnValue(of({ footerAction: FooterAction.REVERT }));

                const spy = jest.spyOn(component, "onRevert");

                fixture.detectChanges();

                expect(spy).toBeCalledTimes(1);
            });
        });

        describe("onReset()", () => {
            it("should be called when SettingsDropdownContent is active and Store emits FooterAction.RESET", () => {
                jest.spyOn(settingsDropdownStore, "selectFooter").mockReturnValue(of({ footerAction: FooterAction.RESET }));

                const spy = jest.spyOn(component, "onReset");

                fixture.detectChanges();

                expect(spy).toBeCalledTimes(1);
            });
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MockSettingsDropdownContentComponent);
        component = fixture.componentInstance;
        settingsDropdownStore = TestBed.inject(SettingsDropdownComponentStore);
        fixture.detectChanges();
    });

    it("should create an instance", () => {
        expect(component).toBeTruthy();
    });

    it("should call onInit on ngOnInit", () => {
        const spy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(component)), "onInit");
        component.ngOnInit();
        expect(spy).toBeCalled();
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
