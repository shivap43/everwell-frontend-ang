import { ComponentType } from "@angular/cdk/portal";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { AsyncStatus, EnrollmentMethod, TaxStatus, PlanOffering, EnrollmentRider, Enrollments } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { AuthState } from "@empowered/ngrx-store/ngrx-states/auth";
import { AUTH_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/auth/auth.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { enrollmentsEntityAdapter, enrollmentRidersEntityAdapter } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.state";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import {
    planOfferingsEntityAdapter,
    planOfferingRidersEntityAdapter,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { ReinstateButtonWrapperComponent } from "./reinstate-button-wrapper.component";
import { Credential } from "@empowered/constants";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ completed: true }),
        } as MatDialogRef<any>),
} as MatDialog;

export const initialState = {
    [AUTH_FEATURE_KEY]: {
        ...AuthState.initialState,
        user: {
            status: AsyncStatus.SUCCEEDED,
            value: { id: "111", type: "some type", adminId: 121, producerId: 543 } as unknown as unknown as Credential,
            error: null,
        },
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
        memberContactsEntities: memberContactsEntityAdapter.setOne(
            {
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
            { ...MembersState.initialState.memberContactsEntities },
        ),
    },
    [ENROLLMENTS_FEATURE_KEY]: {
        ...EnrollmentsState.initialState,
        enrollmentsEntities: enrollmentsEntityAdapter.setOne(
            {
                identifiers: { memberId: 333, mpGroup: 111 },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [{ status: "ACTIVE", plan: { id: 1 }, planOfferingId: 555 } as Enrollments],
                    error: null,
                },
            },
            { ...EnrollmentsState.initialState.enrollmentsEntities },
        ),
        enrollmentRidersEntities: enrollmentRidersEntityAdapter.setOne(
            {
                identifiers: { enrollmentId: 1, mpGroup: 111, memberId: 333 },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            memberCost: 1,
                            id: 55500,
                            plan: {
                                id: 555,
                            },
                        } as EnrollmentRider,
                    ],
                    error: null,
                },
            },
            {
                ...EnrollmentsState.initialState.enrollmentRidersEntities,
            },
        ),
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
        planOfferingsEntities: planOfferingsEntityAdapter.setOne(
            {
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
                                characteristics: [],
                                product: { id: 8 },
                            },
                        } as PlanOffering,
                    ],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.planOfferingsEntities },
        ),
        planOfferingRidersEntities: planOfferingRidersEntityAdapter.setOne(
            {
                identifiers: {
                    planOfferingId: 555,
                    mpGroup: 111,
                    memberId: 333,
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    stateAbbreviation: "AZ",
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [{ id: 55500, taxStatus: TaxStatus.PRETAX, productOfferingId: 11, plan: { id: 555 } } as PlanOffering],
                    error: null,
                },
            },

            { ...PlanOfferingsState.initialState.planOfferingRidersEntities },
        ),
    },
};

describe("ReinstateButtonWrapperComponent", () => {
    let component: ReinstateButtonWrapperComponent;
    let fixture: ComponentFixture<ReinstateButtonWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReinstateButtonWrapperComponent],
            providers: [
                NGRXStore,
                provideMockStore({ initialState }),
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReinstateButtonWrapperComponent);
        component = fixture.componentInstance;
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
            enrollment: {
                id: 1,
                plan: {
                    id: 1,
                },
            } as Enrollments,
        };
        fixture.detectChanges();
    });

    describe("ReinstateButtonWrapperComponent", () => {
        it("should create reinstate button wrapper component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("reinstate()", () => {
        it("should instantiate reinstate$ subject", () => {
            const spy = jest.spyOn(component["reinstate$"], "next");
            component.reinstate();
            expect(spy).toBeCalled();
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
