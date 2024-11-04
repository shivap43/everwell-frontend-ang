import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { CensusBusinessService } from "@empowered/api-service";
import {
    BenefitsOfferingState,
    ExceptionBusinessService,
    SetAccountThirdPartyPlatforms,
    SetEligibleEmployees,
    SetThirdPartyPlatformRequirement,
} from "@empowered/ngxs-store";
import { AbstractControl, FormControl } from "@angular/forms";
import { AccountService, ApprovalRequest, BenefitsOfferingService } from "@empowered/api";
import { Exceptions, PlanChoice, PlanPanel, PlansProductData } from "@empowered/constants";
import { mockAccountService, mockDatePipe } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { BenefitOfferingHelperService } from "./benefit-offering-helper.service";
import { StoreModule } from "@ngrx/store";
import { SideNavProductData } from "./constants/side-nav-product-data.model";

describe("BenefitOfferingHelperService", () => {
    let service: BenefitOfferingHelperService;
    let accountService: AccountService;
    let exceptionBusinessService: ExceptionBusinessService;
    let censusBusinessService: CensusBusinessService;
    let store: Store;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([BenefitsOfferingState]), StoreModule.forRoot({})],
            providers: [
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                BenefitsOfferingService,
            ],
        });
        service = TestBed.inject(BenefitOfferingHelperService);
        accountService = TestBed.inject(AccountService);
        exceptionBusinessService = TestBed.inject(ExceptionBusinessService);
        censusBusinessService = TestBed.inject(CensusBusinessService);
        store = TestBed.inject(Store);
    });

    describe("BenefitOfferingHelperService", () => {
        it("should be created", () => {
            expect(service).toBeTruthy();
        });
    });
    describe("changeProductSelected()", () => {
        it("should change the selected product", () => {
            const spy = jest.spyOn(service["selectedProducts$"], "next");
            service.changeProductSelected([
                {
                    id: 1,
                    name: "Accident",
                    code: "",
                },
            ]);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateResetProducts$()", () => {
        it("should update the product by reset", () => {
            const spy = jest.spyOn(service["resetProducts$"], "next");
            service.updateResetProducts$(true);
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("isMasterAppStatusApproved()", () => {
        it("should return as false because of Not Approved", (done) => {
            expect.assertions(1);
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValueOnce(
                of([
                    {
                        value: "Not Approved",
                    },
                ]),
            );
            service.isMasterAppStatusApproved().subscribe((masterAppStatus) => {
                expect(masterAppStatus).toStrictEqual(false);
                done();
            });
        });
        it("should return as true because of Approved", (done) => {
            expect.assertions(1);
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValueOnce(
                of([
                    {
                        value: "Approved",
                    },
                ]),
            );
            service.isMasterAppStatusApproved().subscribe((masterAppStatus) => {
                expect(masterAppStatus).toStrictEqual(true);
                done();
            });
        });
    });
    describe("checkForPlanYearNameValidation()", () => {
        it("should reset checkForPlanYearNameValidation", () => {
            expect(service.checkForPlanYearNameValidation("plan year one")).toBe(false);
        });
    });
    describe("getPlansCountToDisplayInPendingAlert()", () => {
        it("should get plan count with pending reason status of 'SUBMITTED_TO_HQ'", () => {
            expect(
                service.getPlansCountToDisplayInPendingAlert(
                    {
                        status: "SUBMITTED_TO_HQ",
                    } as ApprovalRequest,
                    [
                        {
                            requiredSetup: ["ENROLLMENT", "PLAN_YEAR"],
                        },
                    ] as PlanChoice[],
                ),
            ).toBe(1);
        });

        it("should get plan count with reason other than 'SUBMITTED_TO_HQ'", () => {
            expect(
                service.getPlansCountToDisplayInPendingAlert({
                    approvalItems: [
                        {
                            object: "PLAN",
                        },
                    ],
                } as ApprovalRequest),
            ).toBe(1);
        });
    });
    describe("getVasExceptions()", () => {
        it("should return list of exceptions", (done) => {
            expect.assertions(1);
            jest.spyOn(exceptionBusinessService, "getVasExceptions").mockReturnValueOnce(
                of([
                    {
                        id: 7,
                        type: "dependent type",
                    } as Exceptions,
                ]),
            );
            service.getVasExceptions("76123").subscribe((data) => {
                expect(data[0].id).toBe(7);
                done();
            });
        });

        it("should return empty exception list ", (done) => {
            expect.assertions(1);
            jest.spyOn(exceptionBusinessService, "getVasExceptions").mockReturnValueOnce(of([]));
            service.getVasExceptions("76123").subscribe((exceptions) => {
                expect(exceptions).toStrictEqual([]);
                done();
            });
        });
    });

    describe("getThirdPartyPlatformRequirements()", () => {
        it("should dispatch SetThirdPartyPlatformRequirement if isTPPAccount is true", (done) => {
            const spy2 = jest.spyOn(store, "dispatch").mockReturnValue(of({}));
            const spy1 = jest.spyOn(store, "selectSnapshot").mockReturnValue({
                thirdPartyPlatformRequired: true,
            });
            expect.assertions(3);
            service.getThirdPartyPlatformRequirements(true).subscribe((res) => {
                expect(spy2).toBeCalledWith(new SetThirdPartyPlatformRequirement());
                expect(spy1).toBeCalledTimes(2);
                expect(res).toStrictEqual({
                    thirdPartyPlatformRequired: true,
                });
                done();
            });
        });

        it("should return observable of ThirdPartyPlatformRequirement value if isTPPAccount is false", (done) => {
            const spy1 = jest.spyOn(store, "selectSnapshot").mockReturnValue({
                thirdPartyPlatformRequired: true,
            });
            expect.assertions(2);
            service.getThirdPartyPlatformRequirements(false).subscribe((res) => {
                expect(spy1).toBeCalledTimes(1);
                expect(res).toStrictEqual({
                    thirdPartyPlatformRequired: true,
                });
                done();
            });
        });
    });

    describe("fetchAccountTPPStatus()", () => {
        it("should dispatch  SetAccountThirdPartyPlatforms if isTPPAccount is null", (done) => {
            const spy2 = jest.spyOn(store, "dispatch").mockReturnValue(of({}));
            const spy1 = jest.spyOn(store, "selectSnapshot").mockReturnValue(null);
            expect.assertions(4);
            service.fetchAccountTPPStatus().subscribe((res) => {
                expect(spy2).toBeCalledWith(new SetAccountThirdPartyPlatforms());
                expect(spy1).toBeCalledTimes(2);
                expect(spy1).toBeCalledWith(BenefitsOfferingState.getAccountTPPStatus);
                expect(res).toStrictEqual(null);
                done();
            });
        });

        it("should return observable of boolean value if isTPPAccount is not equal to null  ", (done) => {
            const spy1 = jest.spyOn(store, "selectSnapshot").mockReturnValue(true);
            expect.assertions(2);
            service.fetchAccountTPPStatus().subscribe((res) => {
                expect(spy1).toBeCalledWith(BenefitsOfferingState.getAccountTPPStatus);
                expect(res).toStrictEqual(true);
                done();
            });
        });
    });

    describe("getCensusEstimate()", () => {
        it("should return estimated number of employee value  ", (done) => {
            expect.assertions(3);
            const spy2 = jest.spyOn(store, "dispatch");
            const spy1 = jest.spyOn(censusBusinessService, "getCensusEstimate").mockReturnValue(of(1));
            service.getCensusEstimate().subscribe((res) => {
                expect(res).toBe(1);
                expect(spy2).toBeCalledWith(new SetEligibleEmployees(1));
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
        describe("resetSpecificFormControlErrors()", () => {
            it("should set error value if form control is invalid ", () => {
                const expiresAfter: AbstractControl = new FormControl("111-22-9929");
                expiresAfter.setErrors({ "feature-date": "Invalid Date" });
                service.resetSpecificFormControlErrors(expiresAfter, "past-date");
                expect(expiresAfter.errors).toStrictEqual({ "feature-date": "Invalid Date" });
            });

            it("should set error as null if form control is valid", () => {
                const expiresAfter: AbstractControl = new FormControl("111-22-9929");
                expiresAfter.setErrors({ "feature-date": "Invalid Date" });
                service.resetSpecificFormControlErrors(expiresAfter, "feature-date");
                expect(expiresAfter.errors).toBe(null);
            });
        });

        describe("isPreviousProduct()", () => {
            it("should return true if products are HQFunded or EmpFunded ", () => {
                const isHQFunded = false;
                const isEmpFunded = true;
                const productList = [];
                const plansList = [];
                const result = service.isPreviousProduct(isHQFunded, isEmpFunded, productList, plansList);
                expect(result).toBe(true);
            });

            it("should return true if plans are selected and productId matches", () => {
                const isHQFunded = false;
                const isEmpFunded = false;
                const productList = [{ productId: 1 }, { productId: 2 }] as PlansProductData[];
                const plansList = [
                    { selected: true, productIdNumber: "1" },
                    { selected: false, productIdNumber: "1" },
                ] as PlanPanel[];
                const result = service.isPreviousProduct(isHQFunded, isEmpFunded, productList, plansList);
                expect(result).toBe(true);
            });

            it("should return false if plans are selected and productId doesn't matches", () => {
                const isHQFunded = false;
                const isEmpFunded = false;
                const productList = [{ productId: 1 }, { productId: 2 }] as PlansProductData[];
                const plansList = [
                    { selected: true, productIdNumber: "2" },
                    { selected: false, productIdNumber: "1" },
                ] as PlanPanel[];
                const result = service.isPreviousProduct(isHQFunded, isEmpFunded, productList, plansList);
                expect(result).toBe(false);
            });
        });

        describe("getBenefitEligibleEmployeeCount()", () => {
            it("should call getGroupAttributesByName from accountService on calling getBenefitEligibleEmployeeCount", () => {
                const spy = jest.spyOn(accountService, "getGroupAttributesByName");
                service.getBenefitEligibleEmployeeCount();
                expect(spy).toHaveBeenCalled();
            });
        });

        describe("isChangingToValidProduct()", () => {
            it("should call isChangingToValidProduct", () => {
                const productList = [
                    {
                        id: "1",
                        name: "TestProduct",
                        completed: true,
                    },
                ] as SideNavProductData[];
                const result = service.isChangingToValidProduct(productList, "1", 0);
                expect(result).toBeFalsy();
            });

            it("should call isChangingToValidProduct", () => {
                const productList = [
                    {
                        id: "1",
                        name: "TestProduct1",
                        completed: true,
                    },
                    {
                        id: "2",
                        name: "TestProduct2",
                        completed: true,
                    },
                ] as SideNavProductData[];
                const result = service.isChangingToValidProduct(productList, "2", 0);
                expect(result).toBeTruthy();
            });
        });
    });
});
