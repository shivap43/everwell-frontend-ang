import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { ProductsContainerComponent } from "./products-container.component";
import {
    AsyncStatus,
    EnrollmentMethod,
    Characteristics,
    CombinedOfferings,
    TaxStatus,
    Plan,
    PlanOffering,
    Product,
    ProductOffering,
    GetCartItems,
    Enrollments,
} from "@empowered/constants";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { ProductDetails } from "./products-container.model";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() backdrop = false;
    @Input() enableSpinner = false;
}
@Component({
    selector: "mat-tab-group",
    template: "",
})
class MockMonMatGroupComponent {
    @Input() selectedIndex!: number;
}

@Component({
    selector: "mat-tab",
    template: "",
})
class MockMonMatComponent {}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {}

describe("ProductsContainerComponent", () => {
    let component: ProductsContainerComponent;
    let fixture: ComponentFixture<ProductsContainerComponent>;
    let ngrxStore: NGRXStore;
    const initialState = {
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
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ProductsContainerComponent,
                MockMonSpinnerComponent,
                MockMonMatGroupComponent,
                MockMonMatComponent,
                MockMonIconComponent,
            ],
            providers: [NGRXStore, provideMockStore({ initialState })],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
        ngrxStore = TestBed.inject(NGRXStore);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProductsContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("ProductsContainerComponent creation", () => {
        it("should create Products Container Component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("onProductSelection()", () => {
        it("should dispatch product offering identifiers to global Store", () => {
            const combinedOfferings = [
                {
                    productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                    planOfferingsWithCoverageDates: [
                        {
                            planOffering: {
                                id: 555,
                                taxStatus: TaxStatus.POSTTAX,
                                productOfferingId: 11,
                            } as PlanOffering,
                        },
                    ],
                } as CombinedOfferings,
            ];
            const spy = jest.spyOn(ngrxStore, "dispatch");
            component.onProductSelection(0, combinedOfferings);
            expect(spy).toBeCalledWith(
                GlobalActions.setSelectedProductOfferingIdentifiers({
                    productId: 8,
                    productOfferingId: 11,
                }),
            );
        });
    });
    describe("trackByProductId()", () => {
        it("should return the product id for tracking", () => {
            const productDetails = {
                name: "Accident",
                id: 2,
            } as ProductDetails;
            const productId = component.trackByProductId(1, productDetails);
            expect(productId).toBe(productDetails.id);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscriber$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
