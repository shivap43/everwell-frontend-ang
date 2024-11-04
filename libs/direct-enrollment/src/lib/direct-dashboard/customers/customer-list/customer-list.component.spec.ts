import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    Directive,
    Input,
    NO_ERRORS_SCHEMA,
    Pipe,
    PipeTransform,
    SimpleChanges,
    TemplateRef,
} from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { CustomerListComponent } from "./customer-list.component";
import {
    mockLanguageService,
    mockUtilService,
    mockStaticUtilService,
    mockStaticService,
    mockMatDialog,
    mockDomSanitizer,
    mockSharedService,
    mockEmpoweredModalService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountService, MemberListDisplayItem, MemberService, StaticService } from "@empowered/api";
import { MemberListItem, MemberListProduct, Accounts } from "@empowered/constants";
import { of, Subscription } from "rxjs";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { MatHeaderRowDef, MatTableDataSource, MatTableModule } from "@angular/material/table";
import { CurrencyPipe, Location } from "@angular/common";
import { EnrollmentMethodState, EnrollmentMethodModel, StaticUtilService, AddAccountInfo, UtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { RelationsPipe } from "@empowered/ui";
import { MatMenuModule } from "@angular/material/menu";
const customers = [
    {
        id: 1,
        firstName: "John",
        lastName: "David",
        email: "johndavid@gmail.com",
        phoneNumber: "1234567890",
        products: { names: "Term Life", pendingProducts: null, totalCost: 10 } as MemberListProduct,
        dependents: [{ firstName: "Chris", lastName: "Evans" }],
        notifications: [{ directAccount: true }],
    },
];
const specificEnrollment = {
    enrollmentState: "Georgea",
    mpGroup: 111,
};
const visitedMpGroups = ["111", "222"];
const enrollmentState = {
    name: "Georgea",
    abbreviation: "GA",
};

const mockSubscription = [
    {
        unsubscribe: () => {},
    },
] as Subscription[];

@Component({
    selector: "empowered-member-add",
    template: "",
})
class MockMemberAddComponent {}

@Component({
    selector: "empowered-quote-shop-mpp",
    template: "",
})
export class MockQuoteShopMppComponent {}

@Pipe({
    name: "relations",
})
export class MockRelationsPipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("CustomerListComponent", () => {
    let component: CustomerListComponent;
    let fixture: ComponentFixture<CustomerListComponent>;
    let staticService: StaticService;
    let accountService: AccountService;
    let store: Store;
    let stateForNgxsStore: Store;
    let utilService: UtilService;
    let router: Router;
    let sharedService: SharedService;
    let location: Location;
    let empoweredModalService: EmpoweredModalService;
    let memberService: MemberService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CustomerListComponent,
                MockMemberAddComponent,
                MockQuoteShopMppComponent,
                MockRelationsPipe,
                MockHasPermissionDirective,
                MockRichTooltipDirective,
            ],
            imports: [
                HttpClientTestingModule,
                MatMenuModule,
                MatTableModule,
                NgxsModule.forRoot([EnrollmentMethodState]),
                RouterTestingModule.withRoutes([
                    {
                        path: ":customerId/memberadd",
                        component: MockMemberAddComponent,
                    },
                    {
                        path: ":customerId/enrollment/quote-shop/:mpGroup/specific/:customerId",
                        component: MockQuoteShopMppComponent,
                    },
                ]),
            ],
            providers: [
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: RelationsPipe,
                    useValue: MockRelationsPipe,
                },
                MemberService,
                AccountService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CustomerListComponent);
        component = fixture.componentInstance;
        staticService = TestBed.inject(StaticService);
        accountService = TestBed.inject(AccountService);
        store = TestBed.inject(Store);
        stateForNgxsStore = {
            ...store.snapshot(),
            EnrollmentMethodState: {
                specificEnrollment: {},
                visitedMpGroups: visitedMpGroups,
            },
        };
        store.reset(stateForNgxsStore);
        utilService = TestBed.inject(UtilService);
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        sharedService = TestBed.inject(SharedService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        memberService = TestBed.inject(MemberService);
        router.initialNavigation();
        component.mpGroup = 111;
        jest.clearAllMocks();
    });
    const currentEnrollment = {
        enrollmentMethod: "HEADSET",
        enrollmentCity: "city",
        enrollmentState: "Georgea",
        enrollmentStateAbbreviation: "GA",
        userType: "userType",
        memberId: 2,
        mpGroup: 111,
    };
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("checkForUnpluggedFeature()", () => {
        it("should call getConfigurations()", () => {
            const spy = jest.spyOn(staticService, "getConfigurations");
            component.checkForUnpluggedFeature();
            expect(spy).toBeCalledWith("general.feature.disable.for_unplugged");
            expect(component.unpluggedFeatureFlag).toBe(true);
        });
    });
    describe("mapDataToTable()", () => {
        it("should call updateCustomerList()", () => {
            component.customers = customers as MemberListItem[];
            const spy = jest.spyOn(component, "updateCustomerList");
            component.mapDataToTable();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("setAccountInfoToStore()", () => {
        it("should call getAccount() and dispatch action", () => {
            const spy1 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({ id: 1 } as Accounts));
            const spy2 = jest.spyOn(store, "dispatch");
            component.setAccountInfoToStore();
            expect(spy1).toBeCalledWith("111");
            expect(spy2).toBeCalledWith(
                new AddAccountInfo({
                    accountInfo: { id: 1 },
                    mpGroupId: "111",
                }),
            );
        });
    });
    describe("getNotificationToolTipContent()", () => {
        it("should call getNotificationToolTip", () => {
            const spy = jest.spyOn(utilService, "getNotificationToolTip");
            component.getNotificationToolTipContent("notifications");
            expect(spy).toBeCalledWith("notifications", "notificationToolTip");
        });
    });
    describe("routeToCustomerDashboard()", () => {
        it("should navigate to customer dashboard and dispatch actions", fakeAsync(() => {
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(router, "navigate");
            component.routeToCustomerDashboard({ id: 1 });
            expect(spy1).toBeCalledTimes(2);
            expect(spy2).toBeCalledTimes(1);
            tick();
            expect(location.path()).toBe("/1/memberadd");
        }));
    });
    describe("addCustomer()", () => {
        it("should open dialog", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.addCustomer();
            expect(spy).toBeCalled();
        });
    });
    describe("ngOnChanges()", () => {
        it("should call updateCustomerList", () => {
            component.customers = customers as MemberListItem[];
            component.dataSource = new MatTableDataSource<any>(customers);
            component.onInit = false;
            const spy = jest.spyOn(component, "updateCustomerList");
            component.ngOnChanges({ customers: { currentValue: {} } } as unknown as SimpleChanges);
            expect(spy).toBeCalledTimes(1);
            expect(component.dataSource.data).toStrictEqual([
                {
                    id: 1,
                    coverageNameList: ["Term Life"],
                    products: { names: "Term Life", pendingProducts: null, totalCost: 10 } as MemberListProduct,
                    dependents: [{ firstName: "Chris", lastName: "Evans" }],
                    email: "johndavid@gmail.com",
                    name: "David, John",
                    phoneNumber: "1234567890",
                    hasPending: false,
                    matTooltipContent: "$10.00 <br><br> Term Life",
                    notificationSum: 0,
                    notifications: [{ directAccount: true }],
                },
            ]);
        });
    });
    describe("openConfirmAddressDialogForShop()", () => {
        it("should call setEnrollmentValuesForShop, navigateToSpecificShop and dispatch actions", () => {
            const response = {
                afterClosed: () => of({ action: "shopSuccess" }),
            } as MatDialogRef<any>;
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(response);
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(sharedService, "setEnrollmentValuesForShop");
            const spy3 = jest.spyOn(component, "navigateToSpecificShop");
            component.openConfirmAddressDialogForShop({ id: 1 } as MemberListDisplayItem, {} as EnrollmentMethodModel);
            expect(spy1).toBeCalledTimes(2);
            expect(spy2).toBeCalledWith({ action: "shopSuccess" }, {});
            expect(spy3).toBeCalledWith(1);
        });
    });
    describe("navigateToSpecificShop()", () => {
        it("should navigate to shop page", fakeAsync(() => {
            const spy = jest.spyOn(router, "navigate");
            component.navigateToSpecificShop(1);
            tick();
            expect(spy).toBeCalledTimes(1);
            expect(location.path()).toBe("/1/enrollment/quote-shop/111/specific/1");
        }));
    });
    describe("updateCustomerList()", () => {
        it("should set language value for policyText", () => {
            component.customers = customers as MemberListItem[];
            component.updateCustomerList();
            expect(component.policyText).toStrictEqual("1 primary.portal.direct.policy");
            component.customers[0].products = { names: "Term Life,Dental", pendingProducts: null } as MemberListProduct;
            component.updateCustomerList();
            expect(component.policyText).toStrictEqual("2 primary.portal.direct.policies");
        });
    });
    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            component.subscriptions = mockSubscription;
            const spy = jest.spyOn(mockSubscription[0], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toBeCalled();
        });
    });
    describe("specificShopNav", () => {
        it("openDialog should be called when specificEnrollmentObj data is not there", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.specificShopNav({ id: 1 });
            expect(spy).toBeCalledTimes(1);
        });
        it("should call getMemberContact when enrollment method is HEADSET or CALL_CENTER", () => {
            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: specificEnrollment,
                    visitedMpGroups: visitedMpGroups,
                    currentEnrollment: currentEnrollment,
                    enrollmentStateArray: [enrollmentState],
                },
            });
            const spy1 = jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "PR",
                        },
                    },
                }),
            );
            const spy2 = jest.spyOn(empoweredModalService, "openDialog");
            component.specificShopNav({ id: 1 });
            expect(spy1).toBeCalledWith(1, "HOME", "111");
            expect(spy2).toBeCalledTimes(1);
        });
        it("should call matDialog open when api response state does not match with enrollmentStateArray states", () => {
            jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "GA",
                        },
                    },
                }),
            );
            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: specificEnrollment,
                    visitedMpGroups: visitedMpGroups,
                    currentEnrollment: {
                        ...currentEnrollment,
                        enrollmentMethod: "CALL_CENTER",
                    },
                    enrollmentStateArray: [enrollmentState],
                },
            });
            const spy3 = jest.spyOn(empoweredModalService, "openDialog");
            component.specificShopNav({ id: 1 });
            expect(spy3).toBeCalled();
        });
        it(`should call getMemberContact when enrollment method is other than HEADSET and CALL_CENTER and
         should call openDialog if api response state NY and enrollment method is other than NY or vice versa`, () => {
            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: specificEnrollment,
                    visitedMpGroups: visitedMpGroups,
                    currentEnrollment: {
                        ...currentEnrollment,
                        enrollmentMethod: "FACE_TO_FACE",
                    },
                    enrollmentStateArray: [enrollmentState],
                },
            });
            const spy1 = jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "NY",
                        },
                    },
                }),
            );
            const spy2 = jest.spyOn(empoweredModalService, "openDialog");
            component.specificShopNav({ id: 1 });
            expect(spy1).toBeCalledWith(1, "HOME", "111");
            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: specificEnrollment,
                    visitedMpGroups: visitedMpGroups,
                    currentEnrollment: {
                        ...currentEnrollment,
                        enrollmentStateAbbreviation: "NY",
                        enrollmentMethod: "FACE_TO_FACE",
                    },
                    enrollmentStateArray: [enrollmentState],
                },
            });
            jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "GA",
                        },
                    },
                }),
            );
            component.specificShopNav({ id: 1 });
            expect(spy2).toBeCalledTimes(2);
        });
        it("should call changeProducerNotLicensedInCustomerState and dispatch actions", () => {
            jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "GA",
                        },
                    },
                }),
            );
            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: specificEnrollment,
                    visitedMpGroups: visitedMpGroups,
                    currentEnrollment: {
                        ...currentEnrollment,
                        enrollmentMethod: "FACE_TO_FACE",
                    },
                    enrollmentStateArray: [enrollmentState],
                },
            });
            const spy1 = jest.spyOn(sharedService, "changeProducerNotLicensedInCustomerState");
            const spy2 = jest.spyOn(store, "dispatch");
            component.specificShopNav({ id: 1 });
            expect(spy1).toBeCalledWith(false);
            expect(spy2).toBeCalledTimes(5);
        });
    });
});
