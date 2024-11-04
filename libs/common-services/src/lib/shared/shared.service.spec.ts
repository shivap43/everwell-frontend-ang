import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { SharedService } from "./shared.service";
import { mockAccountService, mockStaticService, mockStaticUtilService } from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { UserService, UserState } from "@empowered/user";
import { PlanPanelModel } from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { AccountService, StaticService } from "@empowered/api";
import { of } from "rxjs";

describe("SharedService", () => {
    let service: SharedService;
    let accountService: AccountService;
    let staticService: StaticService;
    let staticUtilService: StaticUtilService;
    let store: Store;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([UserState]), HttpClientTestingModule],
            providers: [
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                { provide: accountService, useValue: mockAccountService },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                provideMockStore({}),
                UserService,
            ],
        });

        service = TestBed.inject(SharedService);
        accountService = TestBed.inject(AccountService);
        staticService = TestBed.inject(StaticService);
        staticUtilService = TestBed.inject(StaticUtilService);
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            user: { producerId: 1 },
        });
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });
    describe("changeTpi()", () => {
        it("it should change tpi", () => {
            const spy = jest.spyOn(service["isTpi$"], "next");
            service.changeTpi(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("appFlowPDASubmitted()", () => {
        it("it should check if PDA submitted", () => {
            const spy = jest.spyOn(service["tpiAppFlowPDASubject$"], "next");
            service.appFlowPDASubmitted(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeProducerNotLicensedInEmployeeState()", () => {
        it("it should check if producer is licensed in employee state", () => {
            const spy = jest.spyOn(service["isProducerNotLicensedInEmployeeState$"], "next");
            service.changeProducerNotLicensedInEmployeeState(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeProducerNotLicensedInCustomerState()", () => {
        it("it should check if producer is licensed in customer state", () => {
            const spy = jest.spyOn(service["isProducerNotLicensedInCustomerState$"], "next");
            service.changeProducerNotLicensedInCustomerState(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeCurrentMemberEDeliveryAccess()", () => {
        it("it should change current E-Delivery access status of a member", () => {
            const spy = jest.spyOn(service["isEDeliveryPortalAccessed$"], "next");
            service.changeCurrentMemberEDeliveryAccess(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("changeShopReviewPage()", () => {
        it("it should change shop review page", () => {
            const spy = jest.spyOn(service["shopReviewPage$"], "next");
            const shopPageReview = {
                isReview: true,
                cartCount: 0,
                totalCost: 0,
                payfrequencyName: "string",
            };
            service.changeShopReviewPage(shopPageReview);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setStateZipFlag()", () => {
        it("it should set state zip flag", () => {
            const spy = jest.spyOn(service["stateZipFlag$"], "next");
            service.setStateZipFlag(true);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("checkUnpluggedDetails()", () => {
        it("it should check the unplugged details", () => {
            const spy = jest.spyOn(service["unpluggedParam$"], "next");
            const unpluggedDetails = {
                allowAccess: false,
                isCheckedOut: false,
                hasMaintenanceLock: false,
            };
            service.checkUnpluggedDetails(unpluggedDetails);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("checkPayrollMethodAndIdv()", () => {
        it("it should return true if Enrollment Method is Headset", () => {
            expect(service.checkPayrollMethodAndIdv("HEADSET", true, true, true)).toEqual(true);
        });

        it("it should return true if Enrollment Method is CALL_CENTER", () => {
            expect(service.checkPayrollMethodAndIdv("CALL_CENTER", true, true, true)).toEqual(true);
        });

        it("it should return true if Enrollment Method is VIRTUAL_FACE_TO_FACE", () => {
            expect(service.checkPayrollMethodAndIdv("VIRTUAL_FACE_TO_FACE", true, true, true)).toEqual(true);
        });

        it("it should return false if Enrollment Method is DEFAULT Value", () => {
            expect(service.checkPayrollMethodAndIdv("Default", true, true, true)).toEqual(false);
        });
    });

    describe("getIsOccupationClassA()", () => {
        it("it should return occupation class", () => {
            service.setIsOccupationClassA(true);
            expect(service.getIsOccupationClassA()).toEqual(true);
        });
    });

    describe("getIsDefaultOccupationClassA()", () => {
        it("it should return occupation class", () => {
            service.setIsDefaultOccupationClassA(true);
            expect(service.getIsDefaultOccupationClassA()).toEqual(true);
        });
    });

    describe("setConfig()", () => {
        it("should set the config value", () => {
            service.setConfig(true, false);
            expect(service.macTabConfig).toBe(false);
            expect(service.trainingConfig).toBe(true);
        });
    });

    describe("setBackUrl()", () => {
        it("should update backURL with new URL value ", () => {
            service.setBackUrl("/member/settings/update-password");
            expect(service.backURL).toStrictEqual("/member/settings/update-password");
        });

        it("should not update backURL value if value is change-password or notification url", () => {
            service.backURL = "/member/settings/update-password";
            service.setBackUrl("/member/settings/change-password");
            expect(service.backURL).toStrictEqual("/member/settings/update-password");
        });
    });
    describe("sortPlans()", () => {
        it("should sort Plans by displayOrder and name", () => {
            const data = [
                { plan: { displayOrder: 2, name: "a" } },
                { plan: { displayOrder: 3, name: "z" } },
                { plan: { displayOrder: 1, name: "z" } },
                { plan: { displayOrder: 3, name: "a" } },
                { plan: { displayOrder: 1, name: "a" } },
                { plan: { displayOrder: 2, name: "z" } },
            ] as PlanPanelModel[];
            service.sortPlans(data);
            expect(data).toStrictEqual([
                { plan: { displayOrder: 1, name: "a" } },
                { plan: { displayOrder: 1, name: "z" } },
                { plan: { displayOrder: 2, name: "a" } },
                { plan: { displayOrder: 2, name: "z" } },
                { plan: { displayOrder: 3, name: "a" } },
                { plan: { displayOrder: 3, name: "z" } },
            ] as PlanPanelModel[]);
        });

        it("should sort Plans by name if there are no displayOrders", () => {
            const data = [
                { plan: { name: "a" } },
                { plan: { name: "z" } },
                { plan: { name: "z" } },
                { plan: { name: "a" } },
                { plan: { name: "a" } },
                { plan: { name: "z" } },
            ] as PlanPanelModel[];
            service.sortPlans(data);
            expect(data).toStrictEqual([
                { plan: { name: "a" } },
                { plan: { name: "a" } },
                { plan: { name: "a" } },
                { plan: { name: "z" } },
                { plan: { name: "z" } },
                { plan: { name: "z" } },
            ] as PlanPanelModel[]);
        });

        it("should not mutate original array", () => {
            const mock = [{ plan: { displayOrder: 2 } }, { plan: { displayOrder: 1 } }] as PlanPanelModel[];
            service.sortPlans(mock);
            expect(mock).toStrictEqual([{ plan: { displayOrder: 1 } }, { plan: { displayOrder: 2 } }] as PlanPanelModel[]);
        });
    });

    describe("dateClass()", () => {
        it("should return dates except (29, 30, 31) of the month", () => {
            const res = service.dateClass(new Date("2002-08-31"));
            expect(res).toStrictEqual(undefined);
        });
    });

    describe("fetchWebexConfig()", () => {
        it("should fetch webex config when the method is invoked", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigValue");
            service.fetchWebexConfig();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("checkPRState()", () => {
        it("should check PR PDA config enabled when the method is invoked", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            service.checkPRState(123, 1);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("isSSNRequiredForPartialCensus()", () => {
        it("should invoke get configurations service when the method is called", () => {
            const spy = jest.spyOn(staticService, "getConfigurations");
            service.isSSNRequiredForPartialCensus(1231);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getPrimaryProducer()", () => {
        it("should get Producer Details", () => {
            const spy = jest.spyOn(accountService, "getAccountProducers");
            service.getPrimaryProducer("1234");
            expect(spy).toBeCalled();
        });
    });

    describe("getEnroller()", () => {
        it("should get Enroller Details", () => {
            const spy = jest.spyOn(accountService, "getAccountProducers");
            service.getEnroller("1234");
            expect(spy).toBeCalled();
        });
    });

    describe("isEmployerNameFieldEnabled()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should return [true, true] if employerName config is enabled and accountType is not in special category", (done) => {
            jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "TRUE", dataType: "BOOLEAN", name: "" },
                    { value: "TRIBAL_ACCOUNT", dataType: "LIST_STRING", name: "" },
                ]),
            );
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([{ value: "PAYROLL" }]));
            expect.assertions(2);
            service.isEmployerNameFieldEnabled(12345).subscribe(([isEmployerFieldEnabled, isEmployerFieldReadOnly]) => {
                expect(isEmployerFieldEnabled).toBe(true);
                expect(isEmployerFieldReadOnly).toBe(true);
                done();
            });
        });

        it("should return [true, false] if employerName config is enabled and accountType is in special category", (done) => {
            jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "TRUE", dataType: "BOOLEAN", name: "" },
                    { value: "TRIBAL_ACCOUNT", dataType: "LIST_STRING", name: "" },
                ]),
            );
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([{ value: "TRIBAL_ACCOUNT" }]));
            expect.assertions(2);
            service.isEmployerNameFieldEnabled(12345).subscribe(([isEmployerFieldEnabled, isEmployerFieldReadOnly]) => {
                expect(isEmployerFieldEnabled).toBe(true);
                expect(isEmployerFieldReadOnly).toBe(false);
                done();
            });
        });

        it("should return [false, true] if employerName config is disabled and accountType is in special category", (done) => {
            jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "FALSE", dataType: "BOOLEAN", name: "" },
                    { value: "TRIBAL_ACCOUNT", dataType: "LIST_STRING", name: "" },
                ]),
            );
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([{ value: "TRIBAL_ACCOUNT" }]));
            expect.assertions(2);
            service.isEmployerNameFieldEnabled(12345).subscribe(([isEmployerFieldEnabled, isEmployerFieldReadOnly]) => {
                expect(isEmployerFieldEnabled).toBe(false);
                expect(isEmployerFieldReadOnly).toBe(true);
                done();
            });
        });
    });

    describe("getStandardDemographicChangesConfig()", () => {
        it("should return true when the config is enabled", (done) => {
            jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            expect.assertions(1);
            service.getStandardDemographicChangesConfig().subscribe((data) => {
                expect(data).toBe(true);
                done();
            });
        });
    });

    describe("getPrivacyConfigforEnroller()", () => {
        it("should return config value if privacy config value is 1 for the enroller", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({ value: "[{\"PageName\":\"AccountContactPage\",\"Value\":1}]" });
            expect(service.getPrivacyConfigforEnroller("AccountContactPage")).toStrictEqual({ PageName: "AccountContactPage", Value: 1 });
        });

        it("should return undefined if config value is 0", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({ value: "[{\"PageName\":\"AccountContactPage\",\"Value\":0}]" });
            expect(service.getPrivacyConfigforEnroller("AccountContactPage")).toBe(undefined);
        });
    });

    describe("getStateZipFlag()", () => {
        it("should return the state zip code", (done) => {
            expect.assertions(1);
            service.getStateZipFlag().subscribe((data) => {
                expect(data).toBe(false);
                done();
            });
        });
    });

    describe("checkAgentSelfEnrolled()", () => {
        it("should return true if it's agent self enrollment", (done) => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue("MEMBER");
            expect.assertions(1);
            service.checkAgentSelfEnrolled().subscribe((isAgentSelfEnrolled) => {
                expect(isAgentSelfEnrolled).toBe(true);
                done();
            });
        });
    });
});
