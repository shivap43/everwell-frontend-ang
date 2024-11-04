/* eslint-disable max-classes-per-file */

import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EnrollmentMethodSettingsComponent } from "./enrollment-method.component";
import { SharedService } from "@empowered/common-services";
import { combineLatest, Observable, of, Subscription } from "rxjs";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentMethodDetail, EnrollmentState } from "@empowered/api";
import { AsyncStatus, EnrollmentMethod, CountryState, MemberContact, SettingsDropdownName } from "@empowered/constants";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { SharedActions, SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { ChangeAddressDialogResult } from "./enrollment-method.model";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";

@Component({
    selector: "mat-radio-group",
    template: "",
})
class MockMatRadioGroupComponent {}

@Component({
    selector: "mat-radio-button",
    template: "",
})
class MockMatRadioButtonComponent {
    @Input() value!: string;
    @Input() disableControl!: string;
}

const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({}),
        } as MatDialogRef<any>),
} as MatDialog;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockSharedService = {
    currentProducerNotLicensedInEmployeeState: of(true),
    currentProducerNotLicensedInCustomerState: of(true),
} as SharedService;

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
    [ENROLLMENTS_FEATURE_KEY]: {
        ...EnrollmentsState.initialState,
        enrollmentMethodDetailsEntities: {
            ids: [111],
            entities: {
                111: {
                    identifiers: { mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{ description: "some description", name: "HEADSET" } as EnrollmentMethodDetail],
                        error: null,
                    },
                },
            },
        },
    },
} as SharedPartialState & AccountsPartialState & MembersPartialState & EnrollmentsPartialState;

@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

describe("EnrollmentMethodSettingsComponent", () => {
    let component: EnrollmentMethodSettingsComponent;
    let fixture: ComponentFixture<EnrollmentMethodSettingsComponent>;
    let mockDialog: MatDialog;
    let store: MockStore<SharedPartialState & MembersPartialState & AccountsPartialState & EnrollmentsPartialState>;
    let ngrxStore: NGRXStore;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                EnrollmentMethodSettingsComponent,
                MockMatRadioGroupComponent,
                MockMatRadioButtonComponent,
                MockLanguageDirective,
            ],
            imports: [ReactiveFormsModule, RouterTestingModule, NgxsModule.forRoot([])],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                FormBuilder,
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentMethodSettingsComponent);
        mockDialog = TestBed.inject(MatDialog);
        component = fixture.componentInstance;
        component.portalRef = portalRef;
        fixture.detectChanges();
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

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onReset()", () => {
        it("should reset FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onReset();
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

    describe("onHide()", () => {
        it("should revert FormGroup", () => {
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

    describe("trackByEnrollmentMethodDescription()", () => {
        it("should return the enrollmentMethodDescription value for tracking", () => {
            const enrollmentMethodDetail = {
                name: "name",
                description: "description",
                enrollmentStates: [
                    {
                        crossBorderAllowed: false,
                        state: {
                            abbreviation: "GA",
                            name: "Georgia",
                        } as CountryState,
                    } as EnrollmentState,
                ],
            } as EnrollmentMethodDetail;

            const enrollmentMethodDescription = component.trackByEnrollmentMethodDescription(1, enrollmentMethodDetail);
            expect(enrollmentMethodDescription).toBe(enrollmentMethodDetail.description);
        });
    });
    describe("setFormValue", () => {
        it("should set form value", () => {
            component.setFormValue("phone call");
            expect(component.form.value).toStrictEqual({ selectedEnrollmentMethod: "phone call" });
        });
    });

    describe("onApply()", () => {
        it("should exit the function if form value is invalid", () => {
            const spy1 = jest.spyOn(component["onApply$"], "next");
            const spy2 = jest.spyOn(component.form, "markAllAsTouched");
            component.form.setValue({
                selectedEnrollmentMethod: null,
            });
            component.onApply();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
        it("should open confirm address dialog if form is valid and enrollment method is not face to face", () => {
            const spy1 = jest.spyOn(component["onApply$"], "next");
            const spy2 = jest.spyOn(component.form, "markAllAsTouched");
            const spy3 = jest.spyOn(component, "openConfirmAddressDialog");
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
            });
            component.onApply();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
            expect(spy3).toBeCalled();
        });
        it("should invoke switchToFaceToFace function if form is valid and enrollment method is face to face", () => {
            const spy1 = jest.spyOn(component["onApply$"], "next");
            const spy2 = jest.spyOn(component.form, "markAllAsTouched");
            const spy3 = jest.spyOn(component, "switchToFaceToFace");
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
            });
            component.onApply();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
            expect(spy3).toBeCalled();
        });
    });
    describe("openConfirmAddressDialog()", () => {
        it("should set state and city to store on success of confirm address", (done) => {
            expect.assertions(4);
            const dialogResponse = {
                afterClosed: () =>
                    of({
                        action: ChangeAddressDialogResult.SHOP_SUCCESS,
                        newState: {
                            abbreviation: "GA",
                            name: "Georgia",
                        } as CountryState,
                        newCity: "Atlanta",
                    }),
            } as MatDialogRef<any>;
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
            });
            const spy1 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(dialogResponse);
            const spy2 = jest.spyOn(ngrxStore, "dispatch");
            const spy3 = jest.spyOn(portalRef, "hide");

            combineLatest([component["mpGroup$"], component["memberId$"], component["selectedEnrollmentMethod$"]]).subscribe(() => {
                component.openConfirmAddressDialog();
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith(
                    SharedActions.setSelectedEnrollmentMethodAndHeadsetStateAndCity({
                        enrollmentMethod: EnrollmentMethod.HEADSET,
                        headsetCountryState: {
                            abbreviation: "GA",
                            name: "Georgia",
                        },
                        city: "Atlanta",
                    }),
                );
                expect(spy2).toBeCalledTimes(1);
                expect(spy3).toBeCalledTimes(1);
                done();
            });
        });
        it.skip("should set form value if confirm address response is not success", (done) => {
            // TODO: Need to refactor this test
            expect.assertions(2);
            const dialogResponse = {
                afterClosed: () =>
                    of({
                        action: ChangeAddressDialogResult.ERROR,
                    }),
            } as MatDialogRef<any>;
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
            });
            const spy1 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(dialogResponse);
            const spy2 = jest.spyOn(component, "setFormValue");

            combineLatest([component["mpGroup$"], component["memberId$"], component["selectedEnrollmentMethod$"]]).subscribe(() => {
                component.openConfirmAddressDialog();
                expect(spy1).toBeCalledTimes(2);
                expect(spy2).toBeCalledWith("HEADSET");
                done();
            });
        });
    });
    describe("switchToFaceToFace()", () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it("should revert form state back to original EnrollmentMethod if no stateData from the SwitchEnrollmentDialogRef", (done) => {
            expect.assertions(2);
            const dialogResponse = {
                afterClosed: () => of(null),
            } as MatDialogRef<any>;
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
            });
            const spy1 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(dialogResponse);
            const spy2 = jest.spyOn(component, "setFormValue");
            combineLatest([
                component["mpGroup$"],
                component["memberId$"],
                component["selectedEnrollmentMethod$"],
                component["selectedMemberCountryState$"],
            ]).subscribe(() => {
                component.switchToFaceToFace();
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith("HEADSET");
                done();
            });
        });
        it("should route to shop page if SwitchEnrollmentDialogRef returns state data", (done) => {
            expect.assertions(2);
            const dialogResponse = {
                afterClosed: () => of({ stateData: true }),
            } as MatDialogRef<any>;
            component.form.setValue({
                selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
            });
            const spy1 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(dialogResponse);
            const spy2 = jest.spyOn(portalRef, "hide");
            combineLatest([
                component["mpGroup$"],
                component["memberId$"],
                component["selectedEnrollmentMethod$"],
                component["selectedMemberCountryState$"],
            ]).subscribe(() => {
                component.switchToFaceToFace();
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                done();
            });
        });
    });
});
