import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { ProducerShopHelperService } from "./../../services/producer-shop-helper/producer-shop-helper.service";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { StandardPlanComponent } from "./standard-plan.component";
import { LanguageService } from "@empowered/language";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { of } from "rxjs";
import { RiderComponentStoreService } from "../../services/rider-component-store/rider-component-store.service";
import { ProductCoverageDate } from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import {
    AsyncData,
    AsyncStatus,
    EnrollmentMethod,
    ProductId,
    TobaccoInformation,
    RiskClass,
    Characteristics,
    TaxStatus,
    Plan,
    PlanOffering,
    Product,
    ProductOffering,
    GetCartItems,
    Enrollments,
} from "@empowered/constants";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { State } from "@empowered/ngrx-store/ngrx-states/app.state";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import { StoreModule } from "@ngrx/store";
import { NgxsModule } from "@ngxs/store";
import { MockReplaceTagPipe, mockPlanPanelService } from "@empowered/testing";

@Component({
    template: "",
    selector: "empowered-plan-prices",
})
class MockPlanPricesComponent {
    @Input() planOffering!: PlanOffering;
}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockAddUpdateCartHelperService = {
    openKnockoutDialog: (fromSpouseKnockout) => of(null),
} as ManageCartItemsHelperService;

@Component({
    template: "",
    selector: "empowered-plan-settings",
})
class MockPlanSettingsComponent {
    @Input() backdropAnchor!: HTMLElement;
    @Input() planOffering!: PlanOffering;
}

@Component({
    selector: "empowered-plan-details-link",
    template: "",
})
class MockPlanDetailsLinkComponent {
    @Input() planOffering!: PlanOffering;
}

@Component({
    selector: "empowered-add-update-cart-button-wrapper",
    template: "",
})
class MockAddUpdateCartButtonWrapperComponent {
    @Input() planOffering!: PlanOffering;
}
@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() backdrop = false;
    @Input() enableSpinner = false;
}
describe("StandardPlanComponent", () => {
    let component: StandardPlanComponent;
    let fixture: ComponentFixture<StandardPlanComponent>;
    let store: MockStore<State>;
    let ngrxStore: NGRXStore;
    let service: ProducerShopComponentStoreService;
    let producerShopHelperService: ProducerShopHelperService;
    const initialState = {
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
        },
        [PRODUCTS_FEATURE_KEY]: {
            ...ProductsState.initialState,
            selectedProductId: 8,
        },
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
            selectedMPGroup: 111,
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
            selectedMemberId: 333,
            memberContactsEntities: {
                ids: ["111-333"],
                entities: {
                    "111-333": {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: mockMemberContacts,
                            error: null,
                        },
                    },
                },
            },
        },
        [SHOPPING_CARTS_FEATURE_KEY]: {
            ...ShoppingCartsState.initialState,
            selectedCartItemId: 555,
            cartItemsSetsEntities: {
                ids: ["333-111"],
                entities: {
                    "333-111": {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                } as GetCartItems,
                            ],
                            error: null,
                        },
                    },
                },
            },
        },
        [ENROLLMENTS_FEATURE_KEY]: {
            ...EnrollmentsState.initialState,

            enrollmentsEntities: {
                ids: ["111-333"],
                entities: {
                    "111-333": {
                        identifiers: { memberId: 333, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ status: "ACTIVE", plan: { id: 1 } as Plan } as Enrollments],
                            error: null,
                        },
                    },
                },
            },
        },
        [SHARED_FEATURE_KEY]: {
            ...SharedState.initialState,
            selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
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
            selectedCountryState: {
                name: "Arizona",
                abbreviation: "AZ",
            },
            selectedHeadsetState: {
                name: "Arizona",
                abbreviation: "AZ",
            },
        },
        [PLAN_OFFERINGS_FEATURE_KEY]: {
            ...PlanOfferingsState.initialState,
            selectedPlanId: 11,
            selectedPlanOfferingId: 555,
            planOfferingsEntities: {
                ids: [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`],
                entities: {
                    [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`]: {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                            enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                            stateAbbreviation: "AZ",
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                    taxStatus: TaxStatus.POSTTAX,
                                    productOfferingId: 11,
                                    plan: {
                                        characteristics: [] as Characteristics[],
                                        product: { id: 8 } as Product,
                                    } as Plan,
                                } as PlanOffering,
                            ],
                            error: null,
                        },
                    },
                },
            },
        },
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
            selectedReferenceDate: "1990-09-09",

            productOfferingSetsEntities: {
                ids: ["111-1990-09-09"],
                entities: {
                    "111-1990-09-09": {
                        identifiers: {
                            mpGroup: 111,
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 11, product: { id: 8 } } as ProductOffering],
                            error: null,
                        },
                    },
                },
            },
        },
    };
    beforeEach(
        async () =>
            await TestBed.configureTestingModule({
                declarations: [
                    StandardPlanComponent,
                    MockPlanPricesComponent,
                    MockPlanSettingsComponent,
                    MockPlanDetailsLinkComponent,
                    MockAddUpdateCartButtonWrapperComponent,
                    MockMonSpinnerComponent,
                    MockReplaceTagPipe,
                ],
                imports: [ReactiveFormsModule, HttpClientTestingModule],
                providers: [
                    FormBuilder,
                    NGRXStore,
                    provideMockStore({
                        initialState,
                    }),
                    {
                        provide: LanguageService,
                        useValue: mockLanguageService,
                    },
                    {
                        provide: ManageCartItemsHelperService,
                        useValue: mockAddUpdateCartHelperService,
                    },
                    ProducerShopComponentStoreService,
                    RiderComponentStoreService,
                    ProducerShopHelperService,
                    {
                        provide: PlanPanelService,
                        useValue: mockPlanPanelService,
                    },
                ],
                schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            }).compileComponents(),
    );
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
        fixture = TestBed.createComponent(StandardPlanComponent);
        component = fixture.componentInstance;
        service = TestBed.inject(ProducerShopComponentStoreService);
        producerShopHelperService = TestBed.inject(ProducerShopHelperService);
        component.planPanel = {
            planOffering: {
                id: 555,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                },
            } as PlanOffering,
            cartItemInfo: {
                id: 1,
            } as GetCartItems,
            enrollment: {
                id: 999,
                plan: {
                    id: 777,
                },
                validity: {
                    expiresAfter: "2022-11-11",
                },
            } as Enrollments,
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onCancel()", () => {
        it("should cancel the standard card view", () => {
            const spy = jest.spyOn(component["onCancel$"], "next");
            component.onCancel();
            expect(spy).toBeCalled();
        });
    });

    describe("deleteAndCancelChanges()", () => {
        it("should delete And Cancel Changes of standard view", () => {
            const spy = jest.spyOn(component["deletedCartItemId$"], "next");
            component.deleteAndCancelChanges(1);
            expect(spy).toBeCalledWith(1);
        });
    });
    describe("updateSpouseResponses()", () => {
        it("should update Spouse Responses", () => {
            const spy = jest.spyOn(component["updatePlanResponses$"], "next");
            component.updateSpouseResponses();
            expect(spy).toBeCalled();
        });
    });
    describe("getSelectedProductCoverageDateOnAsyncValue()", () => {
        it("should get coverage date selected ProductId from global state", (done) => {
            expect.assertions(1);
            const mockValue = [{ productId: 8 as ProductId, date: "1990-09-01" }] as ProductCoverageDate[];
            const mockAsyncData: AsyncData<ProductCoverageDate[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setProductCoverageDates(mockAsyncData);
            service.getSelectedProductCoverageDateOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual({ productId: 8, date: "1990-09-01" });
                done();
            });
        });
    });

    describe("getSelectedProductRiskClassOnAsyncValue()", () => {
        it("should get RiskClass based on CarrierId and ProductId from global state", (done) => {
            expect.assertions(1);
            const mockValue = [{ id: 1 }, { id: 2 }] as RiskClass[];
            const mockAsyncData: AsyncData<RiskClass[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setRiskClasses(mockAsyncData);
            service.getSelectedProductRiskClassOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(null);
                done();
            });
        });
    });

    describe("selectTobaccoInformationOnAsyncValue()", () => {
        it("should get TobaccoInformation from ComponentStore when it has AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(1);
            const mockValue = { memberIsTobaccoUser: true } as TobaccoInformation;
            const mockAsyncData: AsyncData<TobaccoInformation> = {
                status: AsyncStatus.SUCCEEDED,
                value: mockValue,
                error: null,
            };
            service.setTobaccoInformation(mockAsyncData);
            service.selectTobaccoInformationOnAsyncValue().subscribe((value) => {
                expect(value).toStrictEqual(mockValue);
                done();
            });
        });
    });
    describe("isReEnrollmentPlan$", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2000-09-15"));
        });

        afterAll(() => {
            jest.useRealTimers();
        });
        it("should be false as the plan cant be re enrolled ", (done) => {
            expect.assertions(1);
            jest.spyOn(producerShopHelperService, "inOpenEnrollment").mockReturnValue(of(true));
            jest.spyOn(producerShopHelperService, "isOEAndEnrollmentDueToExpire").mockReturnValue(false);
            component.isReEnrollmentPlan$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });
});
