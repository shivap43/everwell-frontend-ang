import { Component, forwardRef, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";

import { LanguageService } from "@empowered/language";
import { AsyncStatus, ProductId, RiskClass, RatingCode, Account, GroupAttributeName, SettingsDropdownName } from "@empowered/constants";
import { provideMockStore } from "@ngrx/store/testing";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { Observable, of, Subscription } from "rxjs";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { OccupationClassComponent } from "./occupation-class.component";
import { RiskClassFormValues } from "./occupation-class.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";

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

const mockInitialState = {
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        accountEntities: AccountsState.accountEntityAdapter.setAll(
            [
                {
                    identifiers: { mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            ratingCode: RatingCode.PEO,
                        } as Account,
                        error: null,
                    },
                },
            ],
            {
                ...AccountsState.initialState.accountEntities,
            },
        ),
        riskClassesEntities: AccountsState.riskClassesEntityAdapter.setAll(
            [
                {
                    identifiers: { mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            { id: 1, name: "account-risk-class-1" },
                            { id: 2, name: "account-risk-class-2" },
                            { id: 3, name: "account-risk-class-3" },
                        ],
                        error: null,
                    },
                },
            ],
            {
                ...AccountsState.initialState.riskClassesEntities,
            },
        ),
        dualPeoRiskClassIdsSetsEntities: AccountsState.dualPeoRiskClassIdsSetsEntityAdapter.setAll(
            [
                {
                    identifiers: { mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            aflacCarrierDualPeoRiskClassIds: {
                                [ProductId.ACCIDENT]: [1, 2, 3],
                                [ProductId.SHORT_TERM_DISABILITY]: [3, 4, 5],
                            },
                            dualPeoRiskClassIds: {
                                [ProductId.ACCIDENT]: [2],
                                [ProductId.SHORT_TERM_DISABILITY]: [4],
                            },
                        },
                        error: null,
                    },
                },
            ],
            {
                ...AccountsState.initialState.dualPeoRiskClassIdsSetsEntities,
            },
        ),
        groupAttributeRecordEntities: AccountsState.groupAttributeRecordEntityAdapter.setAll(
            [
                {
                    identifiers: { mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            [GroupAttributeName.INDUSTRY_CODE]: {
                                attribute: GroupAttributeName.INDUSTRY_CODE,
                                id: 98989898,
                                value: "account-risk-class-3",
                            },
                        },
                        error: null,
                    },
                },
            ],
            {
                ...AccountsState.initialState.groupAttributeRecordEntities,
            },
        ),
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        riskClassesEntities: MembersState.riskClassesEntityAdapter.setAll(
            [
                {
                    identifiers: { mpGroup: 111, memberId: 5 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            aflacCarrierRiskClasses: [
                                { id: 1, name: "member-risk-class-1" },
                                { id: 2, name: "member-risk-class-2" },
                                { id: 3, name: "member-risk-class-3" },
                            ],
                            memberRiskClasses: [{ id: 1, name: "member-risk-class-1" }],
                        },
                        error: null,
                    },
                },
            ],
            {
                ...MembersState.initialState.riskClassesEntities,
            },
        ),
        selectedMemberId: 5,
    },
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
        riskClasses: {
            status: AsyncStatus.SUCCEEDED,
            value: [
                { id: 1, name: "shared-risk-class-1" },
                { id: 2, name: "shared-risk-class-2" },
                { id: 3, name: "shared-risk-class-3" },
                { id: 4, name: "shared-risk-class-4" },
                { id: 5, name: "shared-risk-class-5" },
            ],
            error: null,
        },
    },
} as AccountsPartialState & MembersPartialState & SharedPartialState;

describe("OccupationClassComponent", () => {
    let component: OccupationClassComponent;
    let fixture: ComponentFixture<OccupationClassComponent>;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OccupationClassComponent, MockMatRadioGroupComponent, MockMatRadioButtonComponent],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                ProducerShopComponentStoreService,
                FormBuilder,
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OccupationClassComponent);
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

    describe("onReset()", () => {
        it("should emit onReset", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });

        it("should close dropdown when portalRef exists", () => {
            const spy = jest.spyOn(portalRef, "hide");
            component.onReset();
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

    describe("initializeForm()", () => {
        it("should clear existing FormControls from FormArray", () => {
            const spy = jest.spyOn(component.riskClassesFormArray, "clear");
            component.initializeForm([]);
            expect(spy).toBeCalledTimes(1);
        });

        describe("adding FormControls to FormArray", () => {
            it("should push a new FormControl for each RiskClassFormValue", () => {
                const riskClassFormValues: RiskClassFormValues[] = [
                    {
                        defaultRiskClass: { name: "first" } as RiskClass,
                        riskClasses: [],
                    },
                    {
                        defaultRiskClass: { name: "second" } as RiskClass,
                        riskClasses: [],
                    },
                ];

                const spy = jest.spyOn(component.riskClassesFormArray, "clear");
                component.initializeForm(riskClassFormValues);

                expect(component.riskClassesFormArray.controls.length).toBe(2);
                expect(component.riskClassesFormArray.value).toStrictEqual([{ name: "first" }, { name: "second" }]);
            });
        });
    });

    describe("onApply()", () => {
        it("should update and validate FormGroup", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });

        describe("using portalRef", () => {
            beforeEach(() => {
                jest.clearAllMocks();

                component.riskClassesFormArray.clear();
            });

            it("should close dropdown if form is valid when portalRef exists", () => {
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                expect(spy).toBeCalledTimes(1);
            });

            it("should not close dropdown if form not valid when portalRef exists", () => {
                // Setting default as null when value is required to trigger invalid state
                component.riskClassesFormArray.push(new FormControl(null, Validators.required));
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                expect(spy).not.toBeCalled();
            });

            it("should not eror when portalRef does not exist", () => {
                // Remove reference to portalRef
                component.portalRef = undefined;
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                // onApply should not error just because portalRef doesn't exist
                expect(spy).not.toBeCalled();
            });
        });
    });

    describe("getRiskClassFormValues()", () => {
        it("should exit early when no valid RatingCode is used", () => {
            const result = component.getRiskClassFormValues(
                [[{ id: 777, name: "this value should not matter" }]],
                [{ id: 777, name: "this value should not matter" }],
                null,
            );
            expect(result).toStrictEqual([]);
        });

        it("it should not include labels and just return arguments for STANDARD", () => {
            const result = component.getRiskClassFormValues(
                [
                    [
                        { id: 777, name: "risk-class-name" },
                        { id: 444, name: "risk-class-name-2" },
                    ],
                ],
                [{ id: 777, name: "risk-class-name" }],
                RatingCode.STANDARD,
            );
            expect(result).toStrictEqual([
                {
                    riskClasses: [
                        { id: 777, name: "risk-class-name" },
                        { id: 444, name: "risk-class-name-2" },
                    ],
                    defaultRiskClass: { id: 777, name: "risk-class-name" },
                },
            ]);
        });

        it("it should not include labels and just return arguments for PEO", () => {
            const result = component.getRiskClassFormValues(
                [
                    [
                        { id: 777, name: "risk-class-name" },
                        { id: 444, name: "risk-class-name-2" },
                    ],
                ],
                [{ id: 777, name: "risk-class-name" }],
                RatingCode.PEO,
            );
            expect(result).toStrictEqual([
                {
                    riskClasses: [
                        { id: 777, name: "risk-class-name" },
                        { id: 444, name: "risk-class-name-2" },
                    ],
                    defaultRiskClass: { id: 777, name: "risk-class-name" },
                },
            ]);
        });

        it("it should include labels and result two defaults for PEO DUAL.One for ACCIDENT and the second for SHORT_TERM_DISABILITY", () => {
            const result = component.getRiskClassFormValues(
                [
                    [
                        { id: 111, name: "accident-risk-class-name", productId: ProductId.ACCIDENT },
                        { id: 222, name: "accident-risk-class-name-2", productId: ProductId.ACCIDENT },
                    ],
                    [
                        { id: 333, name: "std-risk-class-name", productId: ProductId.SHORT_TERM_DISABILITY },
                        { id: 444, name: "std-risk-class-name-2", productId: ProductId.SHORT_TERM_DISABILITY },
                    ],
                ],
                [
                    { id: 111, name: "accident-risk-class-name", productId: ProductId.ACCIDENT },
                    { id: 333, name: "std-risk-class-name", productId: ProductId.SHORT_TERM_DISABILITY },
                ],
                RatingCode.DUAL,
            );
            expect(result).toStrictEqual([
                {
                    riskClasses: [
                        { id: 111, name: "accident-risk-class-name", productId: ProductId.ACCIDENT },
                        { id: 222, name: "accident-risk-class-name-2", productId: ProductId.ACCIDENT },
                    ],
                    defaultRiskClass: { id: 111, name: "accident-risk-class-name", productId: ProductId.ACCIDENT },
                    label: "primary.portal.shoppingCart.quoteLevelSettings.subHeader.accidentClass",
                },
                {
                    riskClasses: [
                        { id: 333, name: "std-risk-class-name", productId: ProductId.SHORT_TERM_DISABILITY },
                        { id: 444, name: "std-risk-class-name-2", productId: ProductId.SHORT_TERM_DISABILITY },
                    ],
                    defaultRiskClass: {
                        id: 333,
                        name: "std-risk-class-name",
                        productId: ProductId.SHORT_TERM_DISABILITY,
                    },
                    label: "primary.portal.shoppingCart.quoteLevelSettings.subHeader.stdClass",
                },
            ]);
        });
    });

    describe("trackByRiskClassName()", () => {
        it("should return the riskClassName value for tracking", () => {
            const riskClass = {
                id: 9,
                name: "name",
            };
            const riskClassName = component.trackByRiskClassName(1, riskClass);
            expect(riskClassName).toBe(riskClass.name);
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
