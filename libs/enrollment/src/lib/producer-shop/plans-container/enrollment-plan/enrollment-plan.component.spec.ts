import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

import { EnrollmentPlanComponent } from "./enrollment-plan.component";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import {
    AsyncStatus,
    Flow,
    PayFrequency,
    EnrollmentMethod,
    CoverageLevelNames,
    ShopPageType,
    TaxStatus,
    CoverageLevel,
    Plan,
    PlanOffering,
    GetCartItems,
    EnrollmentRider,
    MemberBeneficiary,
    EnrollmentBeneficiary,
    Enrollments,
} from "@empowered/constants";
import { PayFrequencyObject } from "@empowered/api";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute, Params } from "@angular/router";
import { of, Subject } from "rxjs";
import { Router } from "@angular/router";
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
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { mockPlanPanelService, mockProducerShopHelperService, mockRouter } from "@empowered/testing";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";

const editable = false;
@Component({
    selector: "empowered-plan-details-link",
    template: "",
})
class MockPlanDetailsLinkComponent {
    @Input() planOffering!: PlanOffering;
}

@Component({
    selector: "empowered-end-coverage-link",
    template: "",
})
class MockEndCoverageLinkComponent {
    @Input() planOffering!: PlanOffering;
}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-divider",
    template: "",
})
class MockMatDividerComponent {}

@Component({
    selector: "empowered-add-update-cart-button-wrapper",
    template: "",
})
class MockAddUpdateCartButtonWrapperComponent {
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

const mockDatePipe = {
    transform: (date: string) => date,
} as DatePipe;

const mockRouteParams = new Subject<Params>();

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

@Pipe({
    name: "payrollFrequencyCalculator",
})
class MockPayrollFrequencyCalculatorPipe implements PipeTransform {
    transform(value: number, pfObject?: PayFrequencyObject): number {
        return 1;
    }
}

const mockPayrollFrequencyCalculatorPipe = new MockPayrollFrequencyCalculatorPipe();

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

describe("EnrollmentPlanComponent", () => {
    let component: EnrollmentPlanComponent;
    let fixture: ComponentFixture<EnrollmentPlanComponent>;
    let store: MockStore<State>;
    let ngrxStore: NGRXStore;
    let producerShopHelperService: ProducerShopHelperService;
    const initialState = {
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
        },
        [PLAN_OFFERINGS_FEATURE_KEY]: {
            ...PlanOfferingsState.initialState,
            selectedShopPageType: ShopPageType.SINGLE_OE_SHOP,
        },
        [PRODUCTS_FEATURE_KEY]: {
            ...ProductsState.initialState,
            selectedProductId: 8,
        },
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
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
                                },
                                name: {
                                    firstName: "AAA",
                                    lastName: "BBB",
                                },
                            },
                            error: null,
                        },
                    },
                },
            },
            qualifyingEventsEntities: {
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
        [ENROLLMENTS_FEATURE_KEY]: {
            ...EnrollmentsState.initialState,
            selectedEnrollmentId: 1,
            enrollmentsEntities: {
                ids: ["111-333"],
                entities: {
                    "111-333": {
                        identifiers: { memberId: 333, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    status: "ACTIVE",
                                    carrierStatus: "ACTIVE",
                                    plan: { id: 1, characteristics: [], productId: 1 } as Plan,
                                    id: 1,
                                    coverageLevel: {
                                        displayOrder: 3,
                                        iconLocation: "{fileServer}/images/coveragelevels/{pixelSize}/coverage-family-one-parent.svg",
                                        id: 29,
                                        name: "One Parent Family",
                                        retainCoverageLevel: false,
                                        spouseCovered: false,
                                    },
                                    taxStatus: TaxStatus.PRETAX,
                                    validity: {
                                        effectiveStarting: "2022-01-01",
                                        expiresAfter: "2022-12-31",
                                    },
                                } as Enrollments,
                            ],
                            error: null,
                        },
                    },
                },
            },
            enrollmentRidersEntities: {
                ids: ["111-333-1"],
                entities: {
                    "111-333-1": {
                        identifiers: { mpGroup: 111, memberId: 333, enrollmentId: 1 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 1, memberCostPerPayPeriod: 5, totalCost: 10 } as EnrollmentRider],
                            error: null,
                        },
                    },
                },
            },
            enrollmentBeneficiariesEntities: {
                ids: ["333-1-111"],
                entities: {
                    "333-1-111": {
                        identifiers: { memberId: 333, enrollmentId: 1, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [],
                            error: null,
                        },
                    },
                },
            },
        },
        [SHARED_FEATURE_KEY]: {
            ...SharedState.initialState,
            selectedFlow: Flow.DIRECT,
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
            declarations: [
                EnrollmentPlanComponent,
                MockPlanDetailsLinkComponent,
                MockMatLabelComponent,
                MockMatDividerComponent,
                MockAddUpdateCartButtonWrapperComponent,
                MockEndCoverageLinkComponent,
                MockReplaceTagPipe,
            ],
            providers: [
                NGRXStore,
                provideMockStore({
                    initialState,
                }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                RouterTestingModule,
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                ProducerShopComponentStoreService,
                {
                    provide: PayrollFrequencyCalculatorPipe,
                    useValue: mockPayrollFrequencyCalculatorPipe,
                },
                {
                    provide: ProducerShopHelperService,
                    useValue: mockProducerShopHelperService,
                },
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
            ],
            imports: [HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(MockStore);
        ngrxStore = TestBed.inject(NGRXStore);
        producerShopHelperService = TestBed.inject(ProducerShopHelperService);

        jest.spyOn(store, "dispatch").mockImplementation(() => {
            /* stub */
        });
        // Ignore trying to use cache and always dispatch action
        jest.spyOn(ngrxStore, "dispatch").mockImplementation((action) => {
            store.dispatch(action);
        });
        jest.spyOn(producerShopHelperService, "inOpenEnrollment").mockReturnValue(of(true));
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentPlanComponent);
        component = fixture.componentInstance;
        component.editable = editable;
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
                id: 1,
                memberCostPerPayPeriod: 1,
                coverageLevel: {
                    displayOrder: 3,
                    iconLocation: "{fileServer}/images/coveragelevels/{pixelSize}/coverage-family-one-parent.svg",
                    id: 29,
                    name: "One Parent Family",
                    retainCoverageLevel: false,
                    spouseCovered: false,
                } as CoverageLevel,
            } as Enrollments,
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("trackByEnrollmentBeneficiary()", () => {
        it("should return unique identifier for EnrollmentBeneficiary", () => {
            const beneficiary = { id: 13 } as MemberBeneficiary;
            const enrollmentBeneficiary = {
                beneficiaryId: 1,
                beneficiary,
            } as EnrollmentBeneficiary;
            expect(component.trackByEnrollmentBeneficiary(11, enrollmentBeneficiary)).toBe("13-1");
        });
    });

    describe("navigateToPCR()", () => {
        it("should navigate to PCR page", () => {
            const spy = jest.spyOn(component["navigateToPCR$"], "next");
            component.navigateToPCR();
            expect(spy).toBeCalled();
        });
    });

    describe("onEdit()", () => {
        it("should open enrollment in edit mode", () => {
            const spy = jest.spyOn(component["onEdit$"], "next");
            component.onEdit();
            expect(spy).toBeCalled();
        });
    });

    describe("enrollments$", () => {
        it("Get all enrollments for the member, the length of enrollments is 1", (done) => {
            expect.assertions(1);
            component.enrollments$.subscribe((result) => {
                expect(result.length).toBe(1);
                done();
            });
        });
    });

    describe("mpGroup$", () => {
        it("get the mpGroupId of the account selected", (done) => {
            expect.assertions(1);
            component.mpGroup$.subscribe((result) => {
                expect(result).toBe(111);
                done();
            });
        });
    });

    describe("selectedMPGroupId$", () => {
        it("get the memberId of the member selected ", (done) => {
            expect.assertions(1);
            component.memberId$.subscribe((result) => {
                expect(result).toBe(333);
                done();
            });
        });
    });

    describe("isDirectFlow$", () => {
        it("Set direct flow to be true", (done) => {
            expect.assertions(1);
            component.isDirectFlow$.subscribe((result) => {
                expect(result).toBe(true);
                done();
            });
        });
    });

    describe("isSelectedEnrollment$", () => {
        it("should set selected enrollment id as 1", (done) => {
            component.selectedEnrollment$.subscribe((result) => {
                expect(result.id).toBe(1);
                done();
            });
        });
    });

    describe("dependentCoverageLevel$", () => {
        it("should return Coverage level One Parent Famliy since its a dependent coverage", (done) => {
            component.dependentCoverageLevel$.subscribe((result) => {
                expect(result).toBe(CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE);
                done();
            });
        });
    });

    describe("coverageDateText$", () => {
        it("should set coverageDateText as startDate - expiryDate, since enrollment has an expiry date", (done) => {
            component.coverageDateText$.subscribe((result) => {
                expect(result).toBe("2022-01-01 - 2022-12-31");
                done();
            });
        });
    });

    describe("coverageLevelName$", () => {
        it("should set coverage level of enrollment as One Parent Family", (done) => {
            component.coverageLevelName$.subscribe((result) => {
                expect(result).toBe(CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE);
                done();
            });
        });
    });

    describe("notAutoEnrolledEnrollment$", () => {
        it("should have the notAutoEnrolledEnrollment set as selectedEnrollment since enrollment is not auto enrollable", (done) => {
            component.notAutoEnrolledEnrollment$.subscribe((result) => {
                expect(result.id).toBe(1);
                done();
            });
        });
    });

    describe("enrolledRiders$", () => {
        it("should check the length of riders associated with the enrollment", (done) => {
            component.enrolledRiders$.subscribe((result) => {
                expect(result.length).toBe(1);
                done();
            });
        });

        it("should check the first rider's id", (done) => {
            component.enrolledRiders$.subscribe((result) => {
                expect(result[0].id).toBe(1);
                done();
            });
        });
    });

    describe("ridersMemberCostPerPayPeriod$", () => {
        it("should check the ridersMemberCostPerPayPeriod of the enrolledRiders", (done) => {
            component.ridersMemberCostPerPayPeriod$.subscribe((result) => {
                expect(result).toBe(5);
                done();
            });
        });
    });

    describe("ridersTotalCost$", () => {
        it("should check the ridersTotalCost of the enrolledRiders", (done) => {
            component.ridersTotalCost$.subscribe((result) => {
                expect(result).toBe(10);
                done();
            });
        });
    });

    describe("accountPayFrequency$", () => {
        it("should check the payrollsPerYear for the 1st account pay frequency", (done) => {
            component.accountPayFrequency$.subscribe((result) => {
                expect(result[0].payrollsPerYear).toBe(52);
                done();
            });
        });
    });

    describe("enablePlanWithdrawLink$", () => {
        it("should not enable WithdrawLink", (done) => {
            expect.assertions(1);
            component.enablePlanWithdrawLink$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });

    describe.skip("reEnrollable$", () => {
        // TODO: Need to refactor the following tests
        it("should not allow reEnrollment", (done) => {
            component.editable = false;
            expect.assertions(1);
            component.reEnrollable$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });

        it("should allow reEnrollment", (done) => {
            component.editable = true;
            expect.assertions(1);
            component.reEnrollable$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });

    describe("enableEndCoverageLink$", () => {
        it("should not enable EndCoverageLink", (done) => {
            expect.assertions(1);
            component.enableEndCoverageLink$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });

    describe("nonEditableEnrollmentWithExpirationDate$", () => {
        it("should set nonEditableEnrollmentWithExpirationDate to true", (done) => {
            expect.assertions(1);
            component.nonEditableEnrollmentWithExpirationDate$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });

    describe("isGrandFatherEnrollment$", () => {
        it("should set isGrandFatherEnrollment to true", (done) => {
            component.isGrandFatherEnrollment$.subscribe((result) => {
                expect(result).toEqual(false);
                done();
            });
        });
    });

    describe("beneficiaries$", () => {
        it("should set beneficiaries as empty array", (done) => {
            component.beneficiaries$.subscribe((result) => {
                expect(result).toStrictEqual([]);
                done();
            });
        });

        it("should check if beneficiaries length is zero", (done) => {
            component.beneficiaries$.subscribe((result) => {
                expect(result.length).toStrictEqual(0);
                done();
            });
        });
    });

    describe("memberData$", () => {
        it("should check member id", (done) => {
            component.memberData$.subscribe((result) => {
                expect(result.id).toEqual(333);
                done();
            });
        });

        it("should check member first name", (done) => {
            component.memberData$.subscribe((result) => {
                expect(result.name.firstName).toEqual("AAA");
                done();
            });
        });
    });
});
