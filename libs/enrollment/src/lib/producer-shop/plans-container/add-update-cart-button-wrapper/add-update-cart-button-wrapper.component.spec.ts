import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentType } from "@angular/cdk/portal";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { PlanOfferingService } from "../../services/plan-offering/plan-offering.service";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { RiderComponentStoreService } from "../../services/rider-component-store/rider-component-store.service";

import { AddUpdateCartButtonWrapperComponent } from "./add-update-cart-button-wrapper.component";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { DatePipe } from "@angular/common";
import { AgeService } from "../../services/age/age.service";

import {
    AddToCartItem,
    CarrierId,
    PlanOfferingCostInfo,
    PlanOfferingWithCartAndEnrollment,
    ProductId,
    EnrollmentMethod,
    Characteristics,
    CoverageLevelId,
    RiderCart,
    Plan,
    PlanOffering,
    Product,
    GetCartItems,
    EnrollmentRider,
} from "@empowered/constants";
import { RiderStateWithPlanPricings } from "../../services/rider-component-store/rider-component-store.model";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

const SELECTED_BENEFIT_AMOUNT = 10000;
const SELECTED_RISK_CLASS_ID = 1;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(null),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
};

describe("AddUpdateCartButtonWrapperComponent", () => {
    let component: AddUpdateCartButtonWrapperComponent;
    let fixture: ComponentFixture<AddUpdateCartButtonWrapperComponent>;
    let manageCartItemsHelperService: ManageCartItemsHelperService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddUpdateCartButtonWrapperComponent],
            imports: [HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot([])],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: Store, useValue: mockStore },
                DatePipe,
                ManageCartItemsHelperService,
                ProducerShopComponentStoreService,
                PlanOfferingService,
                RiderComponentStoreService,
                AgeService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUpdateCartButtonWrapperComponent);
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
        };
        manageCartItemsHelperService = TestBed.inject(ManageCartItemsHelperService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("addUpdateCart()", () => {
        it("should emit addCartSubject", () => {
            const spy = jest.spyOn(component["addCartSubject$"], "next");
            component.addUpdateCart();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("isBaseCartAndSelectedValueDifferent()", () => {
        const planData = {
            planOffering: {
                id: 111,
                plan: {
                    id: 222,
                    characteristics: Characteristics.AUTOENROLLABLE,
                } as unknown as Plan,
            } as PlanOffering,
        } as PlanOfferingWithCartAndEnrollment;
        it("should return false if cart info does not exist", () => {
            expect(
                component.isBaseCartAndSelectedValueDifferent(planData, 27, SELECTED_BENEFIT_AMOUNT, SELECTED_RISK_CLASS_ID, 0),
            ).toStrictEqual(false);
        });
        it("should check other conditions if no plan data", () => {
            expect(
                component.isBaseCartAndSelectedValueDifferent(null, 28, SELECTED_BENEFIT_AMOUNT, SELECTED_RISK_CLASS_ID, 10),
            ).toStrictEqual(false);
        });

        it("should return true if plan has aflac carrier id and mismatch in risk class id of cart item", () => {
            const planDataWithCartObject = {
                planOffering: {
                    id: 333,
                    plan: {
                        id: 444,
                        carrierId: CarrierId.AFLAC,
                        characteristics: Characteristics.COMPANY_PROVIDED,
                    } as unknown as Plan,
                } as PlanOffering,
                cartItemInfo: {
                    riskClassOverrideId: 2,
                } as AddToCartItem,
            } as PlanOfferingWithCartAndEnrollment;
            expect(
                component.isBaseCartAndSelectedValueDifferent(
                    planDataWithCartObject,
                    27,
                    SELECTED_BENEFIT_AMOUNT,
                    SELECTED_RISK_CLASS_ID,
                    0,
                ),
            ).toStrictEqual(true);
        });

        it("should return true if dependent age is changed", () => {
            const planDataWithCartObject3 = {
                planOffering: {
                    id: 333,
                    plan: {
                        id: 444,
                        carrierId: CarrierId.ADV,
                        characteristics: Characteristics.COMPANY_PROVIDED,
                        product: {
                            id: ProductId.JUVENILE_WHOLE_LIFE,
                        } as Product,
                    } as unknown as Plan,
                } as PlanOffering,
                cartItemInfo: {
                    riskClassOverrideId: 2,
                    dependentAge: 10,
                } as AddToCartItem,
            } as PlanOfferingWithCartAndEnrollment;
            expect(
                component.isBaseCartAndSelectedValueDifferent(
                    planDataWithCartObject3,
                    27,
                    SELECTED_BENEFIT_AMOUNT,
                    SELECTED_RISK_CLASS_ID,
                    0,
                ),
            ).toStrictEqual(true);
        });

        it("should return true if coverage level is changed", () => {
            const planDataWithCartObject3 = {
                planOffering: {
                    id: 333,
                    plan: {
                        id: 444,
                        carrierId: CarrierId.ADV,
                        characteristics: Characteristics.COMPANY_PROVIDED,
                        product: {
                            id: ProductId.ACCIDENT,
                        } as Product,
                    } as unknown as Plan,
                } as PlanOffering,
                cartItemInfo: {
                    riskClassOverrideId: 2,
                    dependentAge: 0,
                    coverageLevelId: 28,
                } as AddToCartItem,
            } as PlanOfferingWithCartAndEnrollment;
            expect(
                component.isBaseCartAndSelectedValueDifferent(
                    planDataWithCartObject3,
                    27,
                    SELECTED_BENEFIT_AMOUNT,
                    SELECTED_RISK_CLASS_ID,
                    0,
                ),
            ).toStrictEqual(true);
        });

        it("should return true if benefit amount is changed", () => {
            const planDataWithCartObject3 = {
                planOffering: {
                    id: 333,
                    plan: {
                        id: 444,
                        carrierId: CarrierId.ADV,
                        characteristics: Characteristics.COMPANY_PROVIDED,
                        product: {
                            id: ProductId.ACCIDENT,
                        } as Product,
                    } as unknown as Plan,
                } as PlanOffering,
                cartItemInfo: {
                    enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                    enrollmentState: "Georgia",
                    riskClassOverrideId: 2,
                    dependentAge: 0,
                    coverageLevelId: 27,
                    benefitAmount: 15000,
                } as AddToCartItem,
            } as PlanOfferingWithCartAndEnrollment;
            expect(
                component.isBaseCartAndSelectedValueDifferent(
                    planDataWithCartObject3,
                    27,
                    SELECTED_BENEFIT_AMOUNT,
                    SELECTED_RISK_CLASS_ID,
                    0,
                ),
            ).toStrictEqual(true);
        });
        it("should return false if benefit amount and coveragelevel id and dependent age is not changed", () => {
            const planDataWithCartObject3 = {
                planOffering: {
                    id: 333,
                    plan: {
                        id: 444,
                        carrierId: CarrierId.ADV,
                        characteristics: Characteristics.COMPANY_PROVIDED,
                        product: {
                            id: ProductId.JUVENILE_WHOLE_LIFE,
                        } as Product,
                    } as unknown as Plan,
                } as PlanOffering,
                cartItemInfo: {
                    enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                    enrollmentState: "Georgia",
                    riskClassOverrideId: 2,
                    dependentAge: 0,
                    coverageLevelId: 27,
                    benefitAmount: SELECTED_BENEFIT_AMOUNT,
                } as AddToCartItem,
            } as PlanOfferingWithCartAndEnrollment;
            expect(
                component.isBaseCartAndSelectedValueDifferent(
                    planDataWithCartObject3,
                    27,
                    SELECTED_BENEFIT_AMOUNT,
                    SELECTED_RISK_CLASS_ID,
                    0,
                ),
            ).toStrictEqual(false);
        });
    });

    describe("isRiderCartAndSelectionValueDifferent()", () => {
        it("should return false if 0 valid riders in cart and 0 selected riders", () => {
            const cartItemInfo = {
                id: 111,
                riders: [
                    {
                        planId: 222,
                        coverageLevelId: CoverageLevelId.DECLINED,
                    },
                ],
            } as GetCartItems;
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 333,
                        },
                        checked: false,
                    },
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {} as PlanOfferingCostInfo;
            expect(component.isRiderCartAndSelectionValueDifferent(cartItemInfo, selectedPlanCost, riderStatesWithPricing)).toStrictEqual(
                false,
            );
        });
        it("should return false if cart item does not exist", () => {
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 333,
                        },
                        checked: false,
                    },
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = { selectedBenefitAmount: SELECTED_BENEFIT_AMOUNT } as PlanOfferingCostInfo;
            expect(component.isRiderCartAndSelectionValueDifferent(null, selectedPlanCost, riderStatesWithPricing)).toStrictEqual(false);
        });
        it("should return true if number of valid riders in cart and selected riders are not equal", () => {
            const cartItemInfo = {
                id: 111,
                riders: [
                    {
                        planId: 222,
                        coverageLevelId: CoverageLevelId.DECLINED,
                    },
                ],
            } as GetCartItems;
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 333,
                        },
                        checked: true,
                    },
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {} as PlanOfferingCostInfo;
            expect(component.isRiderCartAndSelectionValueDifferent(cartItemInfo, selectedPlanCost, riderStatesWithPricing)).toStrictEqual(
                true,
            );
        });
        it("should return true if enrolled riders and selected riders length is equal and change in coverage level or benefit amount", () => {
            const cartItemInfo = {
                id: 111,
                riders: [
                    {
                        planId: 222,
                        coverageLevelId: 3,
                    },
                ],
                planOfferingId: 111,
            } as GetCartItems;
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 333,
                            planOfferingId: 111,
                        },
                        checked: true,
                        riderParentPlanId: 11,
                    },
                    baseBenefitAmount: SELECTED_BENEFIT_AMOUNT,
                    pricingDatas: [
                        {
                            riderPlanOfferingPricing: {
                                benefitAmount: SELECTED_BENEFIT_AMOUNT,
                                coverageLevelId: 3,
                                memberCost: 10,
                                totalCost: 20,
                            },
                        },
                    ],
                },
            ] as RiderStateWithPlanPricings[];
            const mockRiderCartData = [
                {
                    cartItemId: 111,
                    planOfferingId: 111,
                    benefitAmount: 1000,
                    coverageLevelId: 4,
                    memberCost: 10,
                    totalCost: 20,
                    baseRiderId: 11,
                },
            ] as RiderCart[];
            const selectedPlanCost = {
                planOfferingPricingCoverage: {
                    coverageLevel: {
                        id: 3,
                    },
                },
            } as PlanOfferingCostInfo;
            const spy = jest.spyOn(manageCartItemsHelperService, "getRiderCarts").mockReturnValueOnce(mockRiderCartData);

            expect(component.isRiderCartAndSelectionValueDifferent(cartItemInfo, selectedPlanCost, riderStatesWithPricing)).toStrictEqual(
                true,
            );
            expect(spy).toBeCalledWith([], selectedPlanCost, riderStatesWithPricing);
        });
    });

    describe("isEnrolledRiderAndSelectionValueDifferent()", () => {
        it("should return false if 0 enrolled riders and 0 selected riders", () => {
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 222,
                        },
                        checked: false,
                    },
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {} as PlanOfferingCostInfo;
            expect(component.isEnrolledRiderAndSelectionValueDifferent(null, selectedPlanCost, riderStatesWithPricing)).toStrictEqual(
                false,
            );
        });
        it("should return true if number of enrolled riders and selected riders are not equal", () => {
            const enrolledRiders = [
                {
                    planId: 111,
                },
            ] as EnrollmentRider[];
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 222,
                        },
                        checked: true,
                        riderPlanId: 222,
                    },
                    pricingDatas: [
                        {
                            riderPlanOfferingPricing: {},
                            baseCoverageLevel: {
                                id: 27,
                            },
                        },
                    ],
                },
                {
                    riderState: {
                        identifiers: {
                            cartId: 333,
                        },
                        checked: true,
                        riderPlanId: 333,
                    },
                    pricingDatas: [
                        {
                            riderPlanOfferingPricing: {},
                            baseCoverageLevel: {
                                id: 27,
                            },
                        },
                    ],
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {} as PlanOfferingCostInfo;
            expect(
                component.isEnrolledRiderAndSelectionValueDifferent(enrolledRiders, selectedPlanCost, riderStatesWithPricing),
            ).toStrictEqual(true);
        });
        it("should check differences when enrolled riders and selected riders length is equal and return true if do not get existing enrolled rider", () => {
            const enrolledRiders = [
                {
                    planId: 111,
                    plan: {
                        id: 111,
                    },
                },
            ] as EnrollmentRider[];
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 111,
                        },
                        checked: true,
                        riderPlanId: 333,
                    },
                    pricingDatas: [
                        {
                            riderPlanOfferingPricing: {},
                            baseCoverageLevel: {
                                id: 27,
                            },
                        },
                    ],
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {
                planOfferingPricingCoverage: {
                    coverageLevel: {
                        id: 28,
                    },
                },
            } as PlanOfferingCostInfo;
            expect(
                component.isEnrolledRiderAndSelectionValueDifferent(enrolledRiders, selectedPlanCost, riderStatesWithPricing),
            ).toStrictEqual(true);
        });
        it("should return true if enrolled riders and selected riders length is equal and change in coverage level or benefit amount ", () => {
            const enrolledRiders = [
                {
                    planId: 111,
                    plan: {
                        id: 111,
                    },
                    coverageLevelId: 28,
                    coverageLevel: {
                        id: 28,
                    },
                    benefitAmount: 2000,
                },
            ] as EnrollmentRider[];
            const riderStatesWithPricing = [
                {
                    riderState: {
                        identifiers: {
                            cartId: 111,
                        },
                        checked: true,
                        riderPlanId: 111,
                    },
                    pricingDatas: [
                        {
                            riderPlanOfferingPricing: {
                                benefitAmount: SELECTED_BENEFIT_AMOUNT,
                                coverageLevelId: 27,
                            },
                            baseCoverageLevel: {
                                id: 27,
                            },
                        },
                    ],
                },
            ] as RiderStateWithPlanPricings[];
            const selectedPlanCost = {
                planOfferingPricingCoverage: {
                    coverageLevel: {
                        id: 27,
                    },
                },
            } as PlanOfferingCostInfo;
            expect(
                component.isEnrolledRiderAndSelectionValueDifferent(enrolledRiders, selectedPlanCost, riderStatesWithPricing),
            ).toStrictEqual(true);
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
