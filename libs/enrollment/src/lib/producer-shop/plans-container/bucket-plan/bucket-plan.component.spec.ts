import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ProductContributionLimit } from "@empowered/api";
import {
    PayFrequency,
    PlanOffering,
    GetCartItems,
    Enrollments,
    MemberProfile,
    WorkInformation,
    MemberQualifyingEvent,
    PlanYear,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { initialState } from "../../services/async-state/async-state.mock";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { BucketPlanComponent } from "./bucket-plan.component";
import { combineLatest } from "rxjs";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { AsyncStatus, PlanOfferingWithCartAndEnrollment } from "@empowered/constants";
import { MockReplaceTagPipe } from "../../../../../../testing/src/lib/mock-pipes/mockReplaceTagPipe";
import { HttpClient, HttpHandler } from "@angular/common/http";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { mockStore, mockRouter, mockDatePipe } from "@empowered/testing";
import { DualPlanYearService } from "@empowered/ngxs-store";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

const mockDualPlanYear = {
    planYearsData: [
        {
            type: "AFLAC_INDIVIDUAL",
            locked: true,
            id: 1,
            name: "py1",
            coveragePeriod: {
                effectiveStarting: "2023-10-01",
                expiresAfter: "2024-09-30",
            },
            enrollmentPeriod: {
                effectiveStarting: "2023-09-15",
                expiresAfter: "2023-09-15",
            },
            activeEnrollments: false,
        } as PlanYear,
    ],
    qleEventData: [
        {
            createdBy: "PRODUCER",
            id: 1,
            type: {
                code: "NEW_HIRE",
                daysToReport: 90,
                description: "New Hire",
                id: 58,
            },
            eventDate: "2023-08-01",
            enrollmentValidity: {
                effectiveStarting: "2023-09-18",
                expiresAfter: "2023-12-16",
            },
            createDate: "2023-09-18",
            adminComment: "",
            status: "IN_PROGRESS",
        } as MemberQualifyingEvent,
    ],
};
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "empowered-plan-details-link",
    template: "",
})
class MockPlanDetailsLinkComponent {
    @Input() planOffering!: PlanOffering;
}

@Component({
    selector: "empowered-add-update-cart-bucket-plan-button-wrapper",
    template: "",
})
class MockAddUpdateCartButtonWrapperComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
}

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

describe("BucketPlanComponent", () => {
    let component: BucketPlanComponent;
    let fixture: ComponentFixture<BucketPlanComponent>;
    let store: MockStore<AccountsPartialState & MembersPartialState & ProductOfferingsPartialState>;
    let ngrxStore: NGRXStore;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                BucketPlanComponent,
                MockMatFormFieldComponent,
                MockRichTooltipDirective,
                MockMatLabelComponent,
                MockPlanDetailsLinkComponent,
                MockAddUpdateCartButtonWrapperComponent,
                MockMonIconComponent,
                MockReplaceTagPipe,
            ],
            providers: [
                NGRXStore,
                HttpClient,
                HttpHandler,
                provideMockStore({ initialState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: DualPlanYearService,
                    useValue: mockDualPlanYear,
                },
                FormBuilder,
                ProducerShopComponentStoreService,
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
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
    beforeEach(() => {
        fixture = TestBed.createComponent(BucketPlanComponent);
        component = fixture.componentInstance;
        component.planPanel = {
            planOffering: {
                id: 999,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                },
            } as PlanOffering,
            cartItemInfo: {
                memberCost: 1,
            } as GetCartItems,
            enrollment: {
                memberCostPerPayPeriod: 1,
            } as Enrollments,
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("setErrorOnInvalidForm()", () => {
        it("should update the form value and the validity on error", () => {
            component.setErrorOnInvalidForm();
        });
    });

    describe("onCancel()", () => {
        it("should cancel the enrollment card view", () => {
            component.onCancel();
        });
    });
    describe("payFrequencies$", () => {
        it("should get value from payFrequencies NGRX state", (done) => {
            expect.assertions(1);
            store.setState({
                ...initialState,
                [MEMBERS_FEATURE_KEY]: {
                    ...initialState[MEMBERS_FEATURE_KEY],
                    membersEntities: {
                        ids: ["111-333"],
                        entities: {
                            "111-333": {
                                identifiers: {
                                    mpGroup: 111,
                                    memberId: 333,
                                },
                                data: {
                                    status: AsyncStatus.SUCCEEDED,
                                    value: {
                                        id: 333,
                                        workInformation: {
                                            payrollFrequencyId: 1,
                                        } as WorkInformation,
                                    } as MemberProfile,
                                    error: null,
                                },
                            },
                        },
                    },
                },
                [ACCOUNTS_FEATURE_KEY]: {
                    ...initialState[ACCOUNTS_FEATURE_KEY],
                    selectedMPGroup: 111,
                    payFrequenciesEntities: {
                        ids: [111],
                        entities: {
                            "111": {
                                identifiers: { mpGroup: 111 },
                                data: {
                                    status: AsyncStatus.SUCCEEDED,
                                    value: [{ id: 1, payrollsPerYear: 52 } as PayFrequency],
                                    error: null,
                                },
                            },
                        },
                    },
                },
            });
            component["payFrequency$"].subscribe((payFrequency) => {
                expect(payFrequency).toStrictEqual({ id: 1, payrollsPerYear: 52 } as PayFrequency);
                done();
            });
        });
    });

    describe("rangeOfContribution$", () => {
        it("should get initialized with dependent data and contribution limit from NGRX state", (done) => {
            expect.assertions(2);
            store.setState({
                ...initialState,
                [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                    ...initialState[PRODUCT_OFFERINGS_FEATURE_KEY],
                    contributionLimitsEntities: {
                        ids: [111 - 8],
                        entities: {
                            "111-8": {
                                identifiers: {
                                    mpGroup: 111,
                                    productId: 8,
                                },
                                data: {
                                    status: AsyncStatus.SUCCEEDED,
                                    value: {
                                        minContribution: 0,
                                        maxContribution: 0,
                                    } as ProductContributionLimit,
                                    error: null,
                                },
                            },
                        },
                    },
                },
                [MEMBERS_FEATURE_KEY]: {
                    ...initialState[MEMBERS_FEATURE_KEY],
                    memberDependentsEntities: {
                        ids: ["111-333"],
                        entities: {
                            "111-333": {
                                identifiers: {
                                    mpGroup: 111,
                                    memberId: 333,
                                },
                                data: {
                                    status: AsyncStatus.SUCCEEDED,
                                    value: [],
                                    error: null,
                                },
                            },
                        },
                    },
                },
            });
            combineLatest([component["selectedContributionLimit$"], component["dependentsData$"]]).subscribe(
                ([selectedContributionLimit, dependentsData]) => {
                    expect(selectedContributionLimit).toStrictEqual({
                        minContribution: 0,
                        maxContribution: 0,
                    });
                    expect(dependentsData).toStrictEqual([]);
                    done();
                },
            );
        });
    });
    describe("restrictNegativeValue()", () => {
        it("should restrict minus value", () => {
            const event = { key: "-", charCode: 45, preventDefault: () => {} } as KeyboardEvent;
            const spy = jest.spyOn(event, "preventDefault");

            component.restrictNegativeValue(event);
            expect(spy).toBeCalledTimes(1);
        });
        it("should restrict plus value", () => {
            const event = { key: "+", charCode: 43, preventDefault: () => {} } as KeyboardEvent;
            const spy = jest.spyOn(event, "preventDefault");

            component.restrictNegativeValue(event);
            expect(spy).toBeCalledTimes(1);
        });
        it("should let user enter numeric characters", () => {
            const event = { key: "1", charCode: 49, preventDefault: () => {} } as KeyboardEvent;
            const spy = jest.spyOn(event, "preventDefault");

            component.restrictNegativeValue(event);
            expect(spy).toBeCalledTimes(0);
        });
    });
});
