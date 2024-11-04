import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PolicyChangeRequestListComponent } from "./policy-change-request-list.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import {
    mockAccountService,
    mockDatePipe,
    mockDateService,
    mockLanguageService,
    mockMatDialog,
    mockPolicyChangeRequestService,
    mockRouter,
    mockSharedService,
    mockStaticUtilService,
    mockStore,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { MaterialModule } from "@empowered/ui";
import { DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { NgxMaskPipe } from "ngx-mask";
import { AccountTypes, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { AccountService, PolicyChangeRequestService } from "@empowered/api";
import { NgxsModule, Store } from "@ngxs/store";
import { BehaviorSubject, of } from "rxjs";
import { Overlay } from "@angular/cdk/overlay";
import { RouterTestingModule } from "@angular/router/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
    Accounts,
    Contact,
    PartnerAccountType,
    ProspectInformation,
    ProspectType,
    SitusState,
    StatusTypeValues,
} from "@empowered/constants";
import { SharedService } from "@empowered/common-services";

const mockRoute = {
    params: new BehaviorSubject<Params>({}).asObservable(),
} as ActivatedRoute;

describe("PolicyChangeRequestListComponent", () => {
    let component: PolicyChangeRequestListComponent;
    let fixture: ComponentFixture<PolicyChangeRequestListComponent>;
    let staticUtilService: StaticUtilService;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PolicyChangeRequestListComponent],
            imports: [NgxsModule.forRoot([]), RouterTestingModule, MaterialModule, BrowserAnimationsModule],
            providers: [
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                FormBuilder,
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: PolicyChangeRequestService,
                    useValue: mockPolicyChangeRequestService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                NgxMaskPipe,
                Overlay,
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PolicyChangeRequestListComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        accountService = TestBed.inject(AccountService);
        component.mpGroup = 12345;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("checkAflacAlways()", () => {
        it("should return false if config is disabled", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(false));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
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

        it("should return true if Union AND List Bill with qualifying product", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
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

        it("should return true if qualifying account (Payroll) with qualifying product", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
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
                    partnerAccountType: PartnerAccountType.PAYROLL,
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
                expect(data).toStrictEqual(true);
                done();
            });
        });

        it("should return false if ebs account", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
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
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
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

        it("should return false if direct bill account", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
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
    });
});
