import {
    AsyncStatus,
    CarrierId,
    EnrollmentMethod,
    ProductId,
    Characteristics,
    TaxStatus,
    Plan,
    PlanOffering,
    Product,
} from "@empowered/constants";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { planOfferingsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";

export const initialState = {
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        selectedMemberId: 222,
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
    [PRODUCTS_FEATURE_KEY]: {
        ...ProductsState.initialState,
        selectedProductId: ProductId.SHORT_TERM_DISABILITY,
    },
    [PLAN_OFFERINGS_FEATURE_KEY]: {
        ...PlanOfferingsState.initialState,
        selectedPlanOfferingId: 555,
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
                    value: [
                        {
                            id: 555,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                characteristics: [] as Characteristics[],
                                product: { id: 8 } as Product,
                                carrierId: CarrierId.AFLAC,
                            } as Plan,
                        } as PlanOffering,
                    ],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.planOfferingsEntities },
        ),
    },
    [PRODUCT_OFFERINGS_FEATURE_KEY]: {
        ...ProductOfferingsState.initialState,
        selectedReferenceDate: "2021-09-01",
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
} as MembersPartialState & AccountsPartialState & ProductOfferingsPartialState & PlanOfferingsPartialState & SharedPartialState;
