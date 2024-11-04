import { ComponentType } from "@angular/cdk/portal";
import { TemplateRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { AsyncStatus, EnrollmentMethod } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { EnrollmentsActions } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { provideMockStore } from "@ngrx/store/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { of } from "rxjs";
import { ImportPolicyLinkComponent } from "./import-policy-link.component";

const mockMatDialog = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(true),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

describe("ImportPolicyLinkComponent", () => {
    let component: ImportPolicyLinkComponent;
    let fixture: ComponentFixture<ImportPolicyLinkComponent>;
    let ngrxStore: NGRXStore;
    const mockedInitialState = {
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
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockedInitialState }),
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
            ],
            declarations: [ImportPolicyLinkComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportPolicyLinkComponent);
        component = fixture.componentInstance;
        ngrxStore = TestBed.inject(NGRXStore);
        fixture.detectChanges();
    });
    describe("ImportPolicyLinkComponent creation", () => {
        it("should create ImportPolicyLink component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("importPolicy()", () => {
        it("should emit observable importPolicyLinkClicked$ on getting invoked", () => {
            const spy = jest.spyOn(component["importPolicyLinkClicked$"], "next");
            component.importPolicy();
            expect(spy).toBeCalled();
        });
    });

    describe("openImportPolicyModal()", () => {
        it("should modal for importing the policy", () => {
            const spy = jest.spyOn(ngrxStore, "dispatch");
            component.openImportPolicyModal(555, 1, 5, "AZ", "FACE_TO_FACE");
            expect(spy).toBeCalledWith(EnrollmentsActions.loadEnrollments({ memberId: 1, mpGroup: 555 }));
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
