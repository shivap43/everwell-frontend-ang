import { TestBed } from "@angular/core/testing";
import { AsyncStatus, Permission, MemberDependent } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberDependentsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { TpiRestrictionsHelperService } from "./tpi-restrictions-helper.service";

const mockTPIRestrictionsForHQAccountsService = {
    canAccessTPIRestrictedModuleInHQAccount: () => of(false),
} as TPIRestrictionsForHQAccountsService;

export const mockInitialState = {
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
        memberDependentsEntities: memberDependentsEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 333,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [{ name: "some dependent" } as MemberDependent],
                    error: null,
                },
            },
            {
                ...MembersState.initialState.memberDependentsEntities,
            },
        ),
    },
} as AccountsPartialState & MembersPartialState & ProductsPartialState;

describe("TpiRestrictionsHelperService", () => {
    let service: TpiRestrictionsHelperService;
    let tpiRestrictions: TPIRestrictionsForHQAccountsService;
    let store: MockStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                {
                    provide: TPIRestrictionsForHQAccountsService,
                    useValue: mockTPIRestrictionsForHQAccountsService,
                },
            ],
        });
        service = TestBed.inject(TpiRestrictionsHelperService);
        tpiRestrictions = TestBed.inject(TPIRestrictionsForHQAccountsService);
        store = TestBed.inject(MockStore);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("isDependentRequiredForJuvenile()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return false for non-Juvenile products", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(tpiRestrictions, "canAccessTPIRestrictedModuleInHQAccount");
            service.isDependentRequiredForJuvenile().subscribe((result) => {
                expect(result).toBe(false);
                expect(spy).toBeCalledTimes(0);
                done();
            });
        });

        it("should return false for Juvenile products", (done) => {
            expect.assertions(2);
            store.setState({
                ...mockInitialState,
                [PRODUCTS_FEATURE_KEY]: {
                    ...ProductsState.initialState,
                    selectedProductId: 65,
                },
            });
            const spy = jest.spyOn(tpiRestrictions, "canAccessTPIRestrictedModuleInHQAccount");
            service.isDependentRequiredForJuvenile().subscribe((result) => {
                expect(result).toBe(false);
                expect(spy).toBeCalledWith(Permission.DEPENDENTS_READONLY, null, 111);
                done();
            });
        });
    });
});
