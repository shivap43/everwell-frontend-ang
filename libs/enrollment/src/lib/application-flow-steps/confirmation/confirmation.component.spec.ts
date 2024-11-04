import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { MatTableModule } from "@angular/material/table";
import { NgxsModule, Store } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { DatePipe } from "@angular/common";

import { ConfirmationComponent } from "./confirmation.component";
import { AflacLegalNamePipe, HasPermissionDirective, SendEnrollmentSummaryEmailModalService } from "@empowered/ui";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { AccountService, CoreService, FormType, MemberService, SignaturePlan } from "@empowered/api";
import {
    mockAccountService,
    mockActivatedRoute,
    mockCoreService,
    mockDomSanitizer,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockStaticUtilService,
    mockSendEnrollmentSummaryEmailModalService,
} from "@empowered/testing";
import { AccountTypes, StaticUtilService } from "@empowered/ngxs-store";
import {
    Accounts,
    ConfigName,
    Configurations,
    Contact,
    EnrollmentMethod,
    PartnerAccountType,
    ProductNames,
    ProspectInformation,
    ProspectType,
    SitusState,
    StatusTypeValues,
} from "@empowered/constants";
import { StoreModule } from "@ngrx/store";

const mockGetAccountPayrollResponse = {
    id: 1,
    name: "test",
    contact: {} as Contact<"user">,
    primaryContact: {} as Contact<"default">,
    situs: {
        state: {
            abbreviation: "VA",
            name: "Virginia",
        },
        zip: "24541",
    } as SitusState,
    payFrequencyId: 1,
    type: ProspectType.CLIENT,
    prospectInformation: {
        sicIrNumber: "test",
        taxId: "test",
    } as ProspectInformation,
    subordinateProducerId: 1,
    typeId: 1,
    status: StatusTypeValues.ACTIVE,
    partnerAccountType: PartnerAccountType.PAYROLL,
    partnerId: 1,
    employeeCount: 1,
    productsCount: 1,
    daysToEnroll: 1,
    enrollmentAssistanceAgreement: false,
} as Accounts;

describe("ConfirmationComponent", () => {
    let component: ConfirmationComponent;
    let fixture: ComponentFixture<ConfirmationComponent>;
    let memberService: MemberService;
    let staticUtilService: StaticUtilService;
    let accountService: AccountService;
    let coreService: CoreService;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmationComponent, HasPermissionDirective, ReplaceTagPipe, AflacLegalNamePipe],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([]),
                RouterTestingModule,
                ReactiveFormsModule,
                MatTableModule,
                StoreModule.forRoot({}),
            ],
            providers: [
                FormBuilder,
                DatePipe,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                MemberService,
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                Store,
                {
                    provide: SendEnrollmentSummaryEmailModalService,
                    useValue: mockSendEnrollmentSummaryEmailModalService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        memberService = TestBed.inject(MemberService);
        accountService = TestBed.inject(AccountService);
        coreService = TestBed.inject(CoreService);
        store = TestBed.inject(Store);
        component.pdaFormType = FormType.PDA;
        component.pdaId = 12;
        component.memberId = 1;
        component.mpGroup = 12345;
        component.dialogRef = {
            close: () => {},
        };
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit", () => {
        it("Puerto rico config", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            expect(spy1).toBeDefined();
            expect(component.isPRPDAConfigEnabled).toBeFalsy();
            expect(component.contactInfo).toEqual("abc@gmail.com");
        });
    });

    describe("downloadForm()", () => {
        it("should call downloadMemberForm and download blob on success api response", () => {
            const spy1 = jest.spyOn(memberService, "downloadMemberForm").mockReturnValueOnce(of("Downloaded"));
            component.downloadForm();
            expect(spy1).toBeCalledWith(1, "PDA", 12, "12345");
            expect(spy1).toBeDefined();
            expect(component.loadSpinner).toBe(false);
        });
        it("should call downloadMemberForm and show error message on api error", () => {
            const spy1 = jest.spyOn(memberService, "downloadMemberForm").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );
            expect(spy1).toBeDefined();
            expect(component.loadSpinner).toBe(true);
        });
    });

    describe("checkAflacAlways", () => {
        it("Puerto rico config", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            expect(spy1).toBeDefined();
            expect(component.isPRPDAConfigEnabled).toBeFalsy();
        });
    });

    describe("checkAflacAlways()", () => {
        it("should return false if config is disabled", (done) => {
            expect.assertions(5);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "FALSE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(spy4).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return true if Union AND List Bill with qualifying product", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.UNION,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.LIST_BILL_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(true);
                done();
            });
        });

        it("should return false if Union and NOT List Bill with qualifying product", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.UNION,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return true if qualifying account (Payroll) with qualifying product", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(true);
                done();
            });
        });

        it("should return false if ebs account", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.EBS_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false if ach account", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.ACH_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false if only life plan", (done) => {
            expect.assertions(5);
            component.planData = [{ productName: ProductNames.TERM_LIFE }];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "WL,TL,JWL,JTL" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(
                of([
                    {
                        id: 67,
                        name: "Juvenile Term Life",
                        code: "JTL",
                    },
                    {
                        id: 47,
                        name: "Dental",
                        code: "Dental",
                    },
                    {
                        id: 65,
                        name: "Juvenile Whole Life",
                        code: "JWL",
                    },
                    {
                        id: 45,
                        name: "Cancer",
                        code: "Cancer",
                    },
                    {
                        id: 29,
                        name: "Term Life",
                        code: "TL",
                    },
                    {
                        id: 28,
                        name: "Whole Life",
                        code: "WL",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(spy4).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false incase of ineligible state set in config", (done) => {
            expect.assertions(5);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "GA" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            jest.spyOn(store, "select").mockReturnValue(of(null)); // be sure to mock the implementation here
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                address: { address1: "131 W TAYLOR ST", address2: "", city: "GRIFFIN", state: "GA", zip: "30223" },
            }); // same here

            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(spy4).toBeCalled();

            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false if direct bill account", (done) => {
            expect.assertions(4);
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.PAYROLLDIRECTBILL,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should not display aflac always card when AA TPI config is disabled", (done) => {
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "FALSE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            component.isTpi = true;

            component.checkAflacAlways();
            expect.assertions(1);
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toBe(false);
                done();
            });
        });

        it("should display Aflac Always card when AA TPI config is enabled and account is PAYROLL", (done) => {
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            component.isTpi = true;

            component.checkAflacAlways();
            expect.assertions(1);
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toBe(true);
                done();
            });
        });

        it("should call TPI Config when Observable is subscribed from TPI flow", (done) => {
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            component.isTpi = true;

            component.checkAflacAlways();

            expect.assertions(2);
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toBe(true);
                expect(spy1).toHaveBeenCalledWith([
                    ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_TPI,
                    ConfigName.AFLAC_ALWAYS_EXCLUDED_PRODUCTS,
                    ConfigName.AFLAC_ALWAYS_INELIGIBLE_STATE,
                ]);

                done();
            });
        });

        it("should call Base Everwell Config when Observable is subscribed from base everwell", (done) => {
            component.planData = [{}];
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { dataType: "boolean", value: "TRUE" },
                    { dataType: "string", value: "" },
                    { dataType: "string", value: "" },
                ] as Configurations[]),
            );
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of(mockGetAccountPayrollResponse));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            const spy4 = jest.spyOn(coreService, "getProducts").mockReturnValue(of([]));
            component.isTpi = false;

            component.checkAflacAlways();

            expect.assertions(2);
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toBe(true);
                expect(spy1).toHaveBeenCalledWith([
                    ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_ENABLE,
                    ConfigName.AFLAC_ALWAYS_EXCLUDED_PRODUCTS,
                    ConfigName.AFLAC_ALWAYS_INELIGIBLE_STATE,
                ]);

                done();
            });
        });
    });

    describe("isAflacAlwaysEligibleState()", () => {
        it("should return false if member is from in-eligible state", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                address: { address1: "131 W TAYLOR ST", address2: "", city: "GRIFFIN", state: "GA", zip: "30223" },
            });
            expect(component.isAflacAlwaysEligibleState(["GA"])).toBe(false);
        });

        it("should return true if member is not from in-eligible state", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({
                address: { address1: "131 W TAYLOR ST", address2: "", city: "GRIFFIN", state: "GA", zip: "30223" },
            });
            expect(component.isAflacAlwaysEligibleState(["CA"])).toBeTruthy();
        });
    });

    describe("fetchCallCenterData()", () => {
        it("should return true if it is a call center enrollment", () => {
            const credentialMock = {
                producerId: 121991,
                callCenterId: 11,
            };
            component.enrollmentMethod = EnrollmentMethod.CALL_CENTER;
            component.fetchCallCenterData(credentialMock, true);

            expect(component.isPinSignature).toBeTruthy();
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
    describe("closeDialog()", () => {
        it("should close out the dialog", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy).toBeCalled();
        });
    });

    describe("loadTotalCost()", () => {
        it("should totalCost be equal to sum of total cost and plan cost", () => {
            component.totalCost = 0;
            const planListMock: SignaturePlan[] = [
                {
                    planId: 1,
                    planName: "Test Plan",
                    productName: "Test Product",
                    cartId: 12,
                    planOfferingId: 23,
                    cost: 32,
                    carrierId: 57,
                },
            ];
            component.loadTotalCost(planListMock);
            expect(component.totalCost).toBe(32);
        });
    });

    describe("displayCoverageButton()", () => {
        it("should return true where oeFlag is true and qleFlag is false", () => {
            component.oeFlag = true;
            component.qleFlag = false;
            const result = component.displayCoverageButton();
            expect(result).toBeTruthy();
        });

        it("should return true when isQLEApproved is true", () => {
            component.oeFlag = true;
            component.qleFlag = true;
            component.isQLEApproved = true;
            const result = component.displayCoverageButton();
            expect(result).toBeTruthy();
        });

        it("should return false when oeFlag is false", () => {
            component.oeFlag = true;
            component.isQLEApproved = false;
            component.qleFlag = true;
            const result = component.displayCoverageButton();
            expect(result).toBeFalsy();
        });
    });
});
