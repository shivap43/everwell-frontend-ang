import { CUSTOM_ELEMENTS_SCHEMA, Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { LanguageService } from "@empowered/language";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { Observable, of, Subscription } from "rxjs";
import { EnrollmentLocationComponent } from "./enrollment-location.component";
import { SharedActions, SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { AsyncStatus, EnrollmentMethod, CountryState, MemberContact, SettingsDropdownName } from "@empowered/constants";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { withLatestFrom } from "rxjs/operators";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

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

const mockInitialState = {
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
        selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
        selectedCity: "Atlanta",
        selectedCountryState: {
            abbreviation: "GA",
            name: "Georgia",
        } as CountryState,
        selectedHeadsetState: {
            abbreviation: "GA",
            name: "Georgia",
        } as CountryState,
        countryStates: {
            status: AsyncStatus.SUCCEEDED,
            value: [
                {
                    abbreviation: "GA",
                    name: "Georgia",
                },
                {
                    abbreviation: "AZ",
                    name: "Arizona",
                },
                {
                    abbreviation: "NY",
                    name: "New York",
                },
            ] as CountryState[],
            error: null,
        },
    },
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        selectedMemberId: 222,
        memberContactsEntities: {
            ids: [111 - 222],
            entities: {
                "111-222": {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{}] as MemberContact[],
                        error: null,
                    },
                },
            },
        },
    },
} as SharedPartialState & AccountsPartialState & MembersPartialState;
describe("EnrollmentLocationComponent", () => {
    let component: EnrollmentLocationComponent;
    let fixture: ComponentFixture<EnrollmentLocationComponent>;
    let store: MockStore<SharedPartialState & MembersPartialState & AccountsPartialState>;
    let ngrxStore: NGRXStore;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentLocationComponent, MockMatFormFieldComponent],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [ReactiveFormsModule, MatAutocompleteModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(MockStore);
        ngrxStore = TestBed.inject(NGRXStore);

        jest.spyOn(store, "dispatch").mockImplementation(() => {
            /* stub */
        });
        // Ignore trying to use cache and always dispatch action
        jest.spyOn(ngrxStore, "dispatch").mockImplementation((action) => {
            store.dispatch(action);
        });
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentLocationComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("compareStateValue()", () => {
        const stateData1 = {
            abbreviation: "GA",
            name: "Georgia",
        } as CountryState;
        it("should return state name", () => {
            expect(component.compareStateValue(stateData1, stateData1)).toStrictEqual(true);
        });
        it("should return state name", () => {
            const stateData2 = { abbreviation: "AZ", name: "Arizona" } as CountryState;

            expect(component.compareStateValue(stateData1, stateData2)).toStrictEqual(false);
        });
    });
    describe("onReset()", () => {
        it("should reset FormGroup", () => {
            const spy1 = jest.spyOn(component, "onRevert");
            const spy2 = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should invoke revert function", () => {
            const spy1 = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy1).toBeCalledTimes(1);
        });
    });
    describe("setSelectedStateAndCity()", () => {
        it("should dispatch ngrx action to set selected state and city", () => {
            const spy1 = jest.spyOn(ngrxStore, "dispatch");
            const countryStateData = {
                abbreviation: "GA",
                name: "Georgia",
            } as CountryState;
            expect(component.setSelectedStateAndCity(countryStateData, "Atlanta"));
            expect(spy1).toBeCalledWith(
                SharedActions.setSelectedCountryStateAndCity({
                    countryState: countryStateData,
                    city: "Atlanta",
                }),
            );
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("disableOnFaceToFace()", () => {
        it("should disable form when enrollment method is not face-to-face", (done) => {
            expect.assertions(3);
            component.form.setValue({
                state: {
                    abbreviation: "GA",
                    name: "Georgia",
                } as CountryState,
                city: "atlanta",
            });
            component["selectedEnrollmentMethod$"]
                .pipe(withLatestFrom(component["selectedCountryState$"]))
                .subscribe(([selectedEnrollmentMethod, selectedState]) => {
                    component.form.disable({ emitEvent: false });
                    component.disableOnFaceToFace();
                    expect(selectedEnrollmentMethod).toBe(EnrollmentMethod.HEADSET);
                    expect(selectedState.abbreviation).toBe("GA");
                    expect(component.form.disabled).toBe(true);
                    done();
                });
        });
        it("should disable state and enable city in form when state is NY", (done) => {
            expect.assertions(4);
            store.setState({
                ...mockInitialState,
                [SHARED_FEATURE_KEY]: {
                    ...mockInitialState[SHARED_FEATURE_KEY],
                    selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    selectedCountryState: {
                        abbreviation: "NY",
                        name: "New York",
                    } as CountryState,
                    selectedHeadsetState: {
                        abbreviation: "NY",
                        name: "New York",
                    } as CountryState,
                },
            });
            component.form.setValue({
                state: {
                    abbreviation: "GA",
                    name: "New York",
                } as CountryState,
                city: "atlanta",
            });
            component["selectedEnrollmentMethod$"]
                .pipe(withLatestFrom(component["selectedCountryState$"]))
                .subscribe(([selectedEnrollmentMethod, selectedState]) => {
                    component.form.controls.state.disable({ emitEvent: false });
                    component.form.controls.state.enable({ emitEvent: false });
                    component.disableOnFaceToFace();
                    expect(selectedEnrollmentMethod).toBe(EnrollmentMethod.FACE_TO_FACE);
                    expect(selectedState.abbreviation).toBe("NY");
                    expect(component.form.controls.state.disabled).toBe(true);
                    expect(component.form.controls.city.disabled).toBe(false);
                    done();
                });
        });
    });

    describe("removeCityText()", () => {
        beforeEach(() => {
            component.form.setValue({
                state: {
                    abbreviation: "GA",
                    name: "Georgia",
                } as CountryState,
                city: "atlanta",
            });
        });
        it("should set city value to form if it is a valid city", () => {
            const cities = ["Atlanta", "Columbus"];
            const spy = jest.spyOn(component.form.controls.city, "setValue");
            expect(component.removeCityText(cities));
            expect(spy).toBeCalledWith("Atlanta");
        });
        it("should set  empty string to form if it is a invalid city", () => {
            const cities = ["Columbus"];
            const spy = jest.spyOn(component.form.controls.city, "setValue");
            expect(component.removeCityText(cities));
            expect(spy).toBeCalledWith("");
        });
    });
    describe("updateCityBasedOnState()", () => {
        it("should dispatch action to load cities and reset the city form control", () => {
            const spy1 = jest.spyOn(ngrxStore, "dispatch");
            const spy2 = jest.spyOn(component.form.controls.city, "reset");
            const countryStateData = {
                abbreviation: "GA",
                name: "Georgia",
            } as CountryState;
            expect(component.updateCityBasedOnState(countryStateData, EnrollmentMethod.FACE_TO_FACE));
            expect(spy1).toBeCalledWith(SharedActions.loadCities({ stateAbbreviation: countryStateData.abbreviation }), true);
            expect(spy2).toBeCalledTimes(1);
        });
    });
    describe("onApply()", () => {
        it("should update and validate FormGroup", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("using portalRef and dispatch action to store", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            component.form.setValue({
                state: {
                    abbreviation: "GA",
                    name: "Georgia",
                } as CountryState,
                city: "atlanta",
            });
            store.setState({
                ...mockInitialState,
                [SHARED_FEATURE_KEY]: {
                    ...mockInitialState[SHARED_FEATURE_KEY],
                    selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                },
            });
        });

        it("should close dropdown if form is valid  when portalRef exists and dispatch state and city to store", () => {
            expect(component.form.valid).toBe(true);
            const spy1 = jest.spyOn(component, "setSelectedStateAndCity");
            const countryStateData = {
                abbreviation: "GA",
                name: "Georgia",
            } as CountryState;
            const spy2 = jest.spyOn(portalRef, "hide");
            const spy3 = jest.spyOn(component["onApply$"], "next");
            component.onApply();
            expect(spy1).toBeCalledWith(countryStateData, "Atlanta");
            expect(spy2).toBeCalledTimes(1);
            expect(spy3).toBeCalledTimes(1);
        });
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalled();
        });
    });

    describe("trackByCountryStateName()", () => {
        it("should return the countryStateName value for tracking", () => {
            const state = {
                abbreviation: "GA",
                name: "Georgia",
            } as CountryState;
            const stateName = component.trackByCountryStateName(1, state);
            expect(stateName).toBe(state.name);
        });
    });

    describe("trackByCity()", () => {
        it("should return the city value for tracking", () => {
            expect(component.trackByCity(1, "city")).toBe("city");
        });
    });
});
