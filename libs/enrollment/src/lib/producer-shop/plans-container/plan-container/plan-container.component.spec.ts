import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApplicationStatusTypes } from "@empowered/api";
import {
    AsyncStatus,
    EnrollmentMethod,
    ShopPageType,
    Characteristics,
    PlanType,
    TaxStatus,
    Plan,
    PlanOffering,
    Product,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { State } from "@empowered/ngrx-store/ngrx-states/app.state";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { planOfferingsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { MockReplaceTagPipe, mockPlanPanelService } from "@empowered/testing";
import { StoreModule } from "@ngrx/store";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { TpiRestrictionsHelperService } from "../../services/tpi-restriction-helper/tpi-restrictions-helper.service";
import { EndCoverageStatus } from "../plans-container.model";
import { PlanContainerComponent } from "./plan-container.component";
import { EndCoverageIconClass, EndCoverageIconName, EnrollmentStatusIconClass, EnrollmentStatusIconName } from "./plan-container.model";

@Component({
    template: "",
    selector: "empowered-standard-plan",
})
class MockStandardPlanComponent {}

@Component({
    template: "",
    selector: "empowered-bucket-plan",
})
class MockBucketPlanComponent {}

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

const mockTpiRestrictionsHelperService = {
    isDependentRequiredForJuvenile: () => of(false),
} as TpiRestrictionsHelperService;

const mockPlanPanel = {
    planOffering: {
        id: 555,
        taxStatus: TaxStatus.POSTTAX,
        productOfferingId: 11,
        plan: {
            id: 123,
            characteristics: [] as Characteristics[],
            product: { id: 8 } as Product,
        } as Plan,
    } as PlanOffering,
};

const mockPlanOfferingState = {
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
    },
    [PLAN_OFFERINGS_FEATURE_KEY]: {
        ...PlanOfferingsState.initialState,
        selectedPlanId: 11,
        selectedPlanOfferingId: 555,
        selectedDependentPlanOfferingIds: [5551, 5552],
        selectedShopPageType: ShopPageType.DUAL_QLE_SHOP,
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
                    value: [mockPlanPanel.planOffering],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.planOfferingsEntities },
        ),
    },
    [PRODUCT_OFFERINGS_FEATURE_KEY]: {
        ...ProductOfferingsState.initialState,
        selectedReferenceDate: "1990-09-09",
    },
};

describe("PlanContainerComponent", () => {
    let component: PlanContainerComponent;
    let fixture: ComponentFixture<PlanContainerComponent>;
    let producerShopHelperService: ProducerShopHelperService;
    let store: MockStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [PlanContainerComponent, MockStandardPlanComponent, MockBucketPlanComponent, MockReplaceTagPipe],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockPlanOfferingState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ManageCartItemsHelperService,
                    useValue: mockAddUpdateCartHelperService,
                },
                {
                    provide: TpiRestrictionsHelperService,
                    useValue: mockTpiRestrictionsHelperService,
                },
                ProducerShopComponentStoreService,
                ProducerShopHelperService,
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        producerShopHelperService = TestBed.inject(ProducerShopHelperService);
        store = TestBed.inject(MockStore);
        fixture = TestBed.createComponent(PlanContainerComponent);
        component = fixture.componentInstance;
        component.planPanel = mockPlanPanel;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getEnrollmentStatusIconData()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should return Enrolled status icon data when enrollmentStatus is ApplicationStatusTypes.Enrolled", () => {
            const iconData = component.getEnrollmentStatusIconData(ApplicationStatusTypes.Enrolled);
            expect(iconData).toStrictEqual({ class: EnrollmentStatusIconClass.ENROLLED, name: EnrollmentStatusIconName.ENROLLED });
        });

        it("should return Active status icon data when enrollmentStatus is ApplicationStatusTypes.Active", () => {
            const iconData = component.getEnrollmentStatusIconData(ApplicationStatusTypes.Active);
            expect(iconData).toStrictEqual({ class: EnrollmentStatusIconClass.ACTIVE, name: EnrollmentStatusIconName.ACTIVE });
        });

        it("should return Lapsed status icon data when enrollmentStatus is ApplicationStatusTypes.Lapsed", () => {
            const iconData = component.getEnrollmentStatusIconData(ApplicationStatusTypes.Lapsed);
            expect(iconData).toStrictEqual({ class: EnrollmentStatusIconClass.LAPSED, name: EnrollmentStatusIconName.LAPSED });
        });

        it("should return Ended status icon data when enrollmentStatus is ApplicationStatusTypes.Ended", () => {
            const iconData = component.getEnrollmentStatusIconData(ApplicationStatusTypes.Ended);
            expect(iconData).toStrictEqual({ class: EnrollmentStatusIconClass.ENDED, name: EnrollmentStatusIconName.ENDED });
        });

        it("should return null status icon data when enrollmentStatus is null", () => {
            const iconData = component.getEnrollmentStatusIconData(null);
            expect(iconData).toStrictEqual(null);
        });

        it("should return null status icon data when enrollmentStatus is not one of above ApplicationStatus", () => {
            const iconData = component.getEnrollmentStatusIconData(ApplicationStatusTypes.Pending);
            expect(iconData).toStrictEqual(null);
        });
    });

    describe("getEndCoverageIconData()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should return Active EndCoverage status icon data when endCoverageStatus is EndCoverageStatus.ACTIVE", () => {
            const iconData = component.getEndCoverageIconData(EndCoverageStatus.ACTIVE);
            expect(iconData).toStrictEqual({ class: EndCoverageIconClass.ACTIVE, name: EndCoverageIconName.ACTIVE });
        });
        it("should return Active EndCoverage status icon data when endCoverageStatus is EndCoverageStatus.ENDED", () => {
            const iconData = component.getEndCoverageIconData(EndCoverageStatus.ENDED);
            expect(iconData).toStrictEqual({ class: EndCoverageIconClass.ENDED, name: EndCoverageIconName.ENDED });
        });
        it("should return Active EndCoverage status icon data when endCoverageStatus is EndCoverageStatus.END_COVERAGE_REQUESTED", () => {
            const iconData = component.getEndCoverageIconData(EndCoverageStatus.END_COVERAGE_REQUESTED);
            expect(iconData).toStrictEqual({
                class: EndCoverageIconClass.END_COVERAGE_REQUESTED,
                name: EndCoverageIconName.END_COVERAGE_REQUESTED,
            });
        });

        it("should return null status icon data when endCoverageStatus is null", () => {
            const iconData = component.getEndCoverageIconData(null);
            expect(iconData).toStrictEqual(null);
        });

        it("should return null status icon data when getEndCoverageIconData is not one of above EndCoverageStatus", () => {
            const iconData = component.getEndCoverageIconData("test" as EndCoverageStatus);
            expect(iconData).toStrictEqual(null);
        });
    });

    describe("onPlanSelection()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should update PlanPanel identifiers", () => {
            const spy = jest.spyOn(producerShopHelperService, "setSelectedPlanDataToStore");

            component.onPlanSelection(mockPlanPanel);

            expect(spy).toBeCalledWith(mockPlanPanel);
        });
    });

    describe("getEndCoverageStatus()", () => {
        beforeAll(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2022-05-08"));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it("should return 'EndCoverageStatus.END_COVERAGE_REQUESTED' when  endCoverageStatus is 'PENDING_HR_APPROVAL'", () => {
            const coverageStatus = component.getEndCoverageStatus("PENDING_HR_APPROVAL", "2022-05-08");
            expect(coverageStatus).toStrictEqual(EndCoverageStatus.END_COVERAGE_REQUESTED);
        });

        it("should return 'EndCoverageStatus.END_COVERAGE_REQUESTED' when  endCoverageStatus is 'COVERAGE_CANCELLATION_REQUEST_SUBMITTED'", () => {
            const coverageStatus = component.getEndCoverageStatus("COVERAGE_CANCELLATION_REQUEST_SUBMITTED", "2022-05-08");
            expect(coverageStatus).toStrictEqual(EndCoverageStatus.END_COVERAGE_REQUESTED);
        });

        it("should return 'EndCoverageStatus.ENDED' when  endCoverageStatus is 'COVERAGE_CANCELLED' and endCoverageDate is past date", () => {
            const coverageStatus = component.getEndCoverageStatus("COVERAGE_CANCELLED", "2022-05-07");
            expect(coverageStatus).toStrictEqual(EndCoverageStatus.ENDED);
        });

        it("should return 'EndCoverageStatus.ACTIVE' when  endCoverageStatus is 'COVERAGE_CANCELLED' and endCoverageDate is future date", () => {
            const coverageStatus = component.getEndCoverageStatus("COVERAGE_CANCELLED", "2022-05-12");
            expect(coverageStatus).toStrictEqual(EndCoverageStatus.ACTIVE);
        });

        it("should return 'undefined' when  endCoverageStatus is random status", () => {
            const coverageStatus = component.getEndCoverageStatus("RANDOM", "");
            expect(coverageStatus).toStrictEqual(undefined);
        });
    });

    describe("getPlanType()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return 'PlanType.STANDARD', when it is a standard and not redirect/ bucket plan", (done) => {
            expect.assertions(1);
            component.getPlanType().subscribe((result) => {
                expect(result).toBe(PlanType.STANDARD);
                done();
            });
        });

        it("should return 'PlanType.STANDARD', when there is no plan offering", (done) => {
            expect.assertions(1);
            store.setState({
                ...mockPlanOfferingState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockPlanOfferingState[PLAN_OFFERINGS_FEATURE_KEY],
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
                                value: [],
                                error: null,
                            },
                        },
                        { ...PlanOfferingsState.initialState.planOfferingsEntities },
                    ),
                },
            } as State);

            component.getPlanType().subscribe((result) => {
                expect(result).toBe(PlanType.STANDARD);
                done();
            });
        });

        it("should return 'PlanType.REDIRECT', when type is Redirect", (done) => {
            expect.assertions(1);
            const redirectPlanOffering = { ...mockPlanPanel.planOffering, type: PlanType.REDIRECT };
            store.setState({
                ...mockPlanOfferingState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockPlanOfferingState[PLAN_OFFERINGS_FEATURE_KEY],
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
                                value: [redirectPlanOffering],
                                error: null,
                            },
                        },
                        { ...PlanOfferingsState.initialState.planOfferingsEntities },
                    ),
                },
            } as State);

            component.getPlanType().subscribe((result) => {
                expect(result).toBe(PlanType.REDIRECT);
                done();
            });
        });

        it("should return 'PlanType.BUCKET', when carrier Id is 52(Wage works)", (done) => {
            expect.assertions(1);

            const bucketPlanData = {
                ...mockPlanPanel.planOffering.plan,
                carrierId: 52,
            } as Plan;
            const bucketPlanOffering = { ...mockPlanPanel.planOffering, plan: bucketPlanData };
            store.setState({
                ...mockPlanOfferingState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockPlanOfferingState[PLAN_OFFERINGS_FEATURE_KEY],
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
                                value: [bucketPlanOffering],
                                error: null,
                            },
                        },
                        { ...PlanOfferingsState.initialState.planOfferingsEntities },
                    ),
                },
            } as State);

            component.getPlanType().subscribe((result) => {
                expect(result).toBe(PlanType.BUCKET);
                done();
            });
        });

        it("should return 'PlanType.BUCKET', when product is FSA(39) and not auto enrollable", (done) => {
            expect.assertions(1);

            const bucketPlanData = {
                ...mockPlanPanel.planOffering.plan,
                product: { id: 39 },
            } as Plan;
            const bucketPlanOffering = { ...mockPlanPanel.planOffering, plan: bucketPlanData };
            store.setState({
                ...mockPlanOfferingState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockPlanOfferingState[PLAN_OFFERINGS_FEATURE_KEY],
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
                                value: [bucketPlanOffering],
                                error: null,
                            },
                        },
                        { ...PlanOfferingsState.initialState.planOfferingsEntities },
                    ),
                },
            } as State);

            component.getPlanType().subscribe((result) => {
                expect(result).toBe(PlanType.BUCKET);
                done();
            });
        });
    });

    describe("updatePlanResponses()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should post data to 'this.updatePlanResponses$' subject", () => {
            const spy = jest.spyOn(component["updatePlanResponses$"], "next");
            component.updatePlanResponses(mockPlanPanel);
            expect(spy).toBeCalledWith(mockPlanPanel);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscriber$"], "next");
            const complete = jest.spyOn(component["unsubscriber$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
