import { DatePipe } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, forwardRef, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import {
    AsyncStatus,
    CarrierId,
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    ShopPageType,
    Plan,
    GetCartItems,
    Enrollments,
    SettingsDropdownName,
    CombinedOfferings,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SharedService } from "@empowered/common-services";
import { provideMockStore } from "@ngrx/store/testing";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { DatesService } from "@empowered/ngrx-store/services/dates/dates.service";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { Observable, of, Subscription } from "rxjs";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    coverageDatesRecordEntityAdapter,
    planOfferingsEntityAdapter,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { productOfferingSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.state";
import { DateFilterFn, MatDatepicker } from "@angular/material/datepicker";
import { enrollmentsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.state";
import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { cartItemsSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.state";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { CoverageDatesComponent } from "./coverage-dates.component";
import { CoverageDatePickerFormValues, HasCoverageDateMoments, HasProductCoverageDates } from "./coverage-dates.model";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { mockDatePipe, MockReplaceTagPipe } from "@empowered/testing";

@Component({
    selector: "mat-error",
    template: "",
})
class MockMatErrorComponent {}

@Directive({
    selector: "[matDatepickerFilter]",
})
class MockMatDatepickerFilterDirective {
    @Input() matDatepickerFilter!: DateFilterFn<unknown>;
}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-checkbox",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatCheckboxComponent),
            multi: true,
        },
    ],
})
class MockMatCheckboxComponent {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-hint",
    template: "",
})
class MockMatHintComponent {}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatepickerToggleComponent {
    @Input() for!: string;
}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
} as SettingsDropdownComponentStore;

const mockSharedService = {
    dateClass: (givenDate: Date) => 0,
} as SharedService;

const mockInitialState = {
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        selectedMemberId: 222,
        crossBorderRulesEntities: {
            ids: ["111-222"],
            entities: {
                "111-222": {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [],
                        error: null,
                    },
                },
            },
        },
        memberContactsEntities: memberContactsEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 222,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockMemberContacts,
                    error: null,
                },
            },
            { ...MembersState.initialState.memberContactsEntities },
        ),
    },
    [ENROLLMENTS_FEATURE_KEY]: {
        ...EnrollmentsState.initialState,
        enrollmentsEntities: enrollmentsEntityAdapter.setOne(
            {
                identifiers: { memberId: 222, mpGroup: 111 },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [{ status: "ACTIVE", plan: { id: 1 } as Plan } as Enrollments],
                    error: null,
                },
            },
            { ...EnrollmentsState.initialState.enrollmentsEntities },
        ),
    },
    [PLAN_OFFERINGS_FEATURE_KEY]: {
        ...PlanOfferingsState.initialState,
        selectedShopPageType: ShopPageType.SINGLE_OE_SHOP,
        planOfferingsEntities: planOfferingsEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 222,
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    stateAbbreviation: "AZ",
                    referenceDate: "2021-09-01",
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.planOfferingsEntities },
        ),
        coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 222,
                    referenceDate: "2021-09-01",
                    coverageDatesEnrollmentType: CoverageDatesEnrollmentType.SINGLE_PLAN_YEAR,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: {},
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.coverageDatesRecordEntities },
        ),
    },
    [PRODUCT_OFFERINGS_FEATURE_KEY]: {
        ...ProductOfferingsState.initialState,
        selectedReferenceDate: "2021-09-01",
        productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
            {
                identifiers: { mpGroup: 111, referenceDate: "2021-09-01" },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [],
                    error: null,
                },
            },
            { ...ProductOfferingsState.initialState.productOfferingSetsEntities },
        ),
    },
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
        selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
        selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
        selectedHeadsetState: { abbreviation: "AZ", name: "Arizona" },
        countryStates: {
            status: AsyncStatus.SUCCEEDED,
            value: [
                {
                    name: "Arizona",
                    abbreviation: "AZ",
                },
            ],
            error: null,
        },
    },
    [SHOPPING_CARTS_FEATURE_KEY]: {
        ...ShoppingCartsState.initialState,
        getCartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 222,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 555,
                            planOfferingId: 11,
                            memberCost: 4,
                            totalCost: 4,
                            coverageLevelId: 2,
                            benefitAmount: 2,
                            enrollmentState: "AZ",
                        } as GetCartItems,
                    ],
                    error: null,
                },
            },
            { ...ShoppingCartsState.initialState.cartItemsSetsEntities },
        ),
    },
} as MembersPartialState &
AccountsPartialState &
EnrollmentsPartialState &
PlanOfferingsPartialState &
ProductOfferingsPartialState &
SharedPartialState;

describe("CoverageDatesComponent", () => {
    let component: CoverageDatesComponent;
    let fixture: ComponentFixture<CoverageDatesComponent>;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CoverageDatesComponent,
                MockMatFormFieldComponent,
                MockMatCheckboxComponent,
                MockMatHintComponent,
                MockMonIconComponent,
                MockMatLabelComponent,
                MockMatDatepickerToggleComponent,
                MockMatDatepickerComponent,
                MockMatDatePickerDirective,
                MockMatErrorComponent,
                MockMatDatepickerFilterDirective,
                MockReplaceTagPipe,
                // DatePipe,
            ],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: {
                        fetchPrimaryLanguageValues: () => ({
                            "primary.portal.coverage.minDate": "primary.portal.coverage.minDate",
                            "primary.portal.qle.addNewQle.dateCantBeMoreInFuture": "primary.portal.qle.addNewQle.dateCantBeMoreInFuture",
                            "primary.portal.coverage.invalidDate": "primary.portal.coverage.invalidDate",
                            "primary.portal.coverage.notAllowedDate": "primary.portal.coverage.notAllowedDate",
                        }),
                        fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
                    },
                },
                { provide: SettingsDropdownComponentStore, useValue: mockSettingsDropdownStore },
                { provide: SharedService, useValue: mockSharedService },
                DatesService,
                ProducerShopComponentStoreService,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageDatesComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("setCoverageDatesAndCheckSameasDefault", () => {
        it("should clear existing FormControls from FormArray", () => {
            const spy = jest.spyOn(component.coverageDatesArray, "clear");
            component.setCoverageDatesAndCheckSameasDefault(null, []);
            expect(spy).toBeCalledTimes(1);
        });

        it("should push a new FormControl for each CoverageDatePickerFormValues", () => {
            const defaultDate = new Date("2021-08-01");
            const momentCoverageDateSets: HasCoverageDateMoments[] = [
                {
                    defaultCoverageStartDate: new Date("2021-08-01"),
                } as HasCoverageDateMoments,
                {
                    defaultCoverageStartDate: new Date("2021-09-01"),
                } as HasCoverageDateMoments,
            ];

            component.setCoverageDatesAndCheckSameasDefault(defaultDate, momentCoverageDateSets);

            expect(component.coverageDatesArray.controls.length).toBe(2);
            expect(component.coverageDatesArray.value).toStrictEqual([
                momentCoverageDateSets[0].defaultCoverageStartDate,
                momentCoverageDateSets[1].defaultCoverageStartDate,
            ]);
        });

        it("should push a default FormControl for each CoverageDatePickerFormValues", () => {
            const defaultDate = new Date("2021-09-01");
            const momentCoverageDateSets: HasCoverageDateMoments[] = [
                {
                    defaultCoverageStartDate: new Date("2021-09-01"),
                } as HasCoverageDateMoments,
                {
                    defaultCoverageStartDate: new Date("2021-09-01"),
                } as HasCoverageDateMoments,
            ];

            component.setCoverageDatesAndCheckSameasDefault(defaultDate, momentCoverageDateSets);

            expect(component.coverageDatesArray.controls.length).toBe(2);
            expect(component.coverageDatesArray.value).toStrictEqual([
                momentCoverageDateSets[0].defaultCoverageStartDate,
                momentCoverageDateSets[1].defaultCoverageStartDate,
            ]);
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
        it("should reset FormGroup", () => {
            const spy1 = jest.spyOn(component, "onRevert");
            const spy2 = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
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

                component.useSharedDatePicker.setValue(true);

                component.form.setValue({
                    coverageDates: [],
                    sharedCoverageDate: new Date("1990/09/09"),
                });
            });

            it("should close dropdown if form is valid when portalRef exists", () => {
                expect(component.form.valid).toBe(true);
                const spy = jest.spyOn(portalRef, "hide");
                component.onApply();
                expect(spy).toBeCalledTimes(1);
            });
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

    describe("getCovageDatePickerFormValues()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2021/09/01"));
        });

        afterAll(() => {
            jest.useRealTimers();
        });
        it("should transform HasCoverageDates to CoverageDatePickerFormValues", () => {
            expect(
                component.getCovageDatePickerFormValues("some label", {
                    defaultCoverageStartDate: "2021-09-05",
                    earliestCoverageStartDate: "2021-09-01",
                    latestCoverageStartDate: "2021-09-10",
                }),
            ).toStrictEqual({
                label: "some label",
                coverageDates: {
                    defaultCoverageStartDate: "2021-09-05",
                    earliestCoverageStartDate: "2021-09-01",
                    latestCoverageStartDate: "2021-09-10",
                },
                coverageDateMoments: {
                    defaultCoverageStartDate: new Date("2021/09/05"),
                    earliestCoverageStartDate: new Date("2021/09/01"),
                    latestCoverageStartDate: new Date("2021/09/10"),
                },
                minMaxDateDifference: 10,
            } as CoverageDatePickerFormValues);
        });
    });

    describe("getEarliestCoverageDates()", () => {
        it("should get the earliest coverage dates from each product", () => {
            const productCoverageDates = [
                {
                    coverageDates: {
                        defaultCoverageStartDate: "3000-01-05",
                        earliestCoverageStartDate: "3000-02-01",
                        latestCoverageStartDate: "2000-03-10",
                    },
                },
                {
                    coverageDates: {
                        defaultCoverageStartDate: "2000-01-05",
                        earliestCoverageStartDate: "2000-02-01",
                        latestCoverageStartDate: "3000-03-10",
                    },
                },
            ] as HasProductCoverageDates[];

            expect(component.getEarliestCoverageDates(productCoverageDates)).toStrictEqual({
                defaultCoverageStartDate: "12/12/2021",
                earliestCoverageStartDate: "12/12/2021",
                latestCoverageStartDate: "12/12/2021",
            });
        });
        it("should include coverage dates with only a single date for Aflac products", () => {
            const productCoverageDates = [
                {
                    coverageDates: {
                        defaultCoverageStartDate: "3000-01-05",
                        earliestCoverageStartDate: "3000-02-01",
                        latestCoverageStartDate: "2000-03-10",
                    },
                },
                {
                    coverageDates: {
                        defaultCoverageStartDate: "2000-01-01",
                        earliestCoverageStartDate: "2000-01-01",
                        latestCoverageStartDate: "2000-01-01",
                    },
                },
            ] as HasProductCoverageDates[];

            expect(component.getEarliestCoverageDates(productCoverageDates)).toStrictEqual({
                defaultCoverageStartDate: "12/12/2021",
                earliestCoverageStartDate: "12/12/2021",
                latestCoverageStartDate: "12/12/2021",
            });
        });
    });

    describe("setFormGroupValues()", () => {
        it("should update shared datepicker value", () => {
            const spy = jest.spyOn(component.sharedDatePicker, "setValue");

            const defaultCoverageStartDate = new Date("2021-09-05");
            const earliestCoverageStartDate = new Date("2021-09-01");
            const latestCoverageStartDate = new Date("2021-09-10");

            component.setFormGroupValues(
                true,
                {
                    defaultCoverageStartDate,
                    earliestCoverageStartDate,
                    latestCoverageStartDate,
                },
                [],
            );

            expect(spy).toBeCalledWith(defaultCoverageStartDate);
        });

        it("should update each individual datepicker value", () => {
            const covageDatePickerFormValuesSet = [];

            const spy = jest.spyOn(component, "setCoverageDatesAndCheckSameasDefault");

            component.setFormGroupValues(true, {} as HasCoverageDateMoments, covageDatePickerFormValuesSet);

            expect(spy).toBeCalled();
        });

        it("should revert FormGroup validation", () => {
            const spy = jest.spyOn(component.form, "markAsPristine");
            component.setFormGroupValues(true, {} as HasCoverageDateMoments, []);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setAllIndividualDatepickers()", () => {
        beforeEach(() => {
            component.coverageDatesArray.clear();

            component.coverageDatesArray.push(new FormControl());
            component.coverageDatesArray.push(new FormControl());
            component.coverageDatesArray.push(new FormControl());
        });
        it("should clear all individual datepickers when shared datepicker has falsy value", () => {
            component.setAllIndividualDatepickers(null);

            expect(component.coverageDatesArray.controls[0].value).toBeNull();
            expect(component.coverageDatesArray.controls[1].value).toBeNull();
            expect(component.coverageDatesArray.controls[2].value).toBeNull();
        });

        it("should set all individual datepickers with shared datepicker value", () => {
            const sharedMomentValue = new Date("2021/09/10");

            component.setAllIndividualDatepickers(sharedMomentValue);

            // Check when shared value is between min/max
            expect(component.coverageDatesArray.controls[0].value).toStrictEqual(sharedMomentValue);
            expect(component.coverageDatesArray.controls[1].value).toStrictEqual(sharedMomentValue);
            expect(component.coverageDatesArray.controls[2].value).toStrictEqual(sharedMomentValue);
        });
    });

    describe("isAflacProduct()", () => {
        it("should return false if Product has zero PlanOfferings", () => {
            expect(component.isAflacProduct({ planOfferingsWithCoverageDates: [] } as CombinedOfferings)).toBe(false);
        });

        it("should return true if at least one Plan's CarrierId is Aflac (1)", () => {
            expect(
                component.isAflacProduct({
                    planOfferingsWithCoverageDates: [
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.AFLAC_DENTAL_AND_VISION,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.AFLAC,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.WAGEWORKS,
                                },
                            },
                        },
                    ],
                } as CombinedOfferings),
            ).toBe(true);
        });

        it("should return true if at least one Plan's CarrierId is AflacGroup (65)", () => {
            expect(
                component.isAflacProduct({
                    planOfferingsWithCoverageDates: [
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.AFLAC_DENTAL_AND_VISION,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.AFLAC_GROUP,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.WAGEWORKS,
                                },
                            },
                        },
                    ],
                } as CombinedOfferings),
            ).toBe(true);
        });

        it("should return false if none of the Plan's Carrier is Aflac (1) or AflacGroup (65)", () => {
            expect(
                component.isAflacProduct({
                    planOfferingsWithCoverageDates: [
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.AFLAC_DENTAL_AND_VISION,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.ARGUS,
                                },
                            },
                        },
                        {
                            planOffering: {
                                plan: {
                                    carrierId: CarrierId.WAGEWORKS,
                                },
                            },
                        },
                    ],
                } as CombinedOfferings),
            ).toBe(false);
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
