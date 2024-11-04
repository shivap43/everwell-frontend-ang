import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import {
    mockLanguageService,
    mockUtilService,
    mockStaticUtilService,
    mockStaticService,
    mockMatDialog,
    mockDomSanitizer,
    mockSharedService,
    mockUserService,
    mockAuthenticationService,
    mockMatDialogRef,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import {
    AccountInfo,
    AccountService,
    AuthenticationService,
    MemberListDisplayItem,
    MemberService,
    SearchMembers,
    StaticService,
} from "@empowered/api";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { MemberListComponent } from "./member-list.component";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { MatMenuModule } from "@angular/material/menu";
import { of, Subscription } from "rxjs";
import { SharedService } from "@empowered/common-services";
import { EnrollmentMethodModel, DualPlanYearService, StaticUtilService, UtilService, AccountInfoState } from "@empowered/ngxs-store";
import { AbstractNotificationModel, MemberListItem, NotificationType, ProducerCredential } from "@empowered/constants";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";
import { MemberListItemStatus } from "@empowered/constants";
import { MemberListDependent } from "@empowered/constants";
import { MatTableModule } from "@angular/material/table";

const acctDetails = {
    accountInfo: {
        id: 1,
        name: "Test Account",
        groupNumber: "456",
        primaryContact: {
            address: {
                state: "CA",
                zip: "93701",
            },
            phoneNumbers: [
                {
                    phoneNumber: "1234567890",
                    type: "business",
                },
            ],
            emailAddresses: [
                {
                    email: "test@test.com",
                    type: "business",
                },
            ],
            phoneNumber: "1234567890",
            cellPhoneNumber: "0123456789",
            email: "test@test.com",
            id: 5,
            name: "Joey Bobs",
            typeId: 6,
            type: {},
            primary: true,
        },
        situs: {
            state: {
                abbreviation: "CA",
                name: "California",
            },
            zip: "12345",
        },
        payFrequencyId: 2,
    },
};

const mpGroup = 123;

const mockStore = {
    selectSnapshot: () => {},
    select: () => of(""),
    dispatch: () => of(""),
} as unknown as Store;

const mockNotificationQueue = {
    getMemberListNotifications: (memberId: number, acctId: number) =>
        of({
            41: [
                {
                    directAccount: false,
                    type: "MULTIPLE",
                    category: "UPDATE",
                    displayText: "Application(s) pending employee signatures",
                    dismissable: true,
                    link: " ",
                    linkText: " ",
                    code: {
                        id: 12,
                        code: "ENROLLMENT_HEADSET_PENDING_SIGNATURE",
                        displayText:
                            "MPP completes application via headset enrollment and sends application for customer/employee signature",
                    },
                    id: 1925648,
                    groupId: 256014,
                    memberId: 48,
                },
            ],
        }),
};

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Pipe({
    name: "relations",
})
export class MockRelationsPipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}
@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

describe("MemberListComponent", () => {
    let component: MemberListComponent;
    let fixture: ComponentFixture<MemberListComponent>;
    let router: Router;
    let staticService: StaticService;
    let utilService: UtilService;
    let store: Store;
    let sharedService: SharedService;
    let userService: UserService;
    let matDialog: MatDialog;
    let matDialogRef: MatDialogRef<any>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MemberListComponent,
                MockConfigEnableDirective,
                MockHasPermissionDirective,
                MockRichTooltipDirective,
                MockRelationsPipe,
                MockMonSpinnerComponent,
            ],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([]),
                RouterTestingModule,
                ReactiveFormsModule,
                MatMenuModule,
                MatTableModule,
            ],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
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
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: NotificationQueueService,
                    useValue: mockNotificationQueue,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                MemberService,
                AccountService,
                FormBuilder,
                CurrencyPipe,
                DualPlanYearService,
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(MemberListComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        router.initialNavigation();
        staticService = TestBed.inject(StaticService);
        utilService = TestBed.inject(UtilService);
        store = TestBed.inject(Store);
        sharedService = TestBed.inject(SharedService);
        matDialog = TestBed.inject(MatDialog);
        matDialogRef = TestBed.inject(MatDialogRef);
        component.mpGroup = mpGroup;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getNotificationToolTipContent()", () => {
        it("should call getNotificationToolTip", () => {
            const spy = jest.spyOn(utilService, "getNotificationToolTip");
            component.getNotificationToolTipContent("notifications");
            expect(spy).toBeCalledWith("notifications", "notificationToolTip");
        });
    });
    describe("openConfirmAddressDialogForShop()", () => {
        it("should call setEnrollmentValuesForShop, and open the dialog", () => {
            const response = {
                afterClosed: () => of({ action: "shopSuccess" }),
            } as MatDialogRef<any>;
            jest.spyOn(matDialog, "open").mockReturnValue(response);
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(sharedService, "setEnrollmentValuesForShop");
            component.openConfirmAddressDialogForShop({ id: 1 } as MemberListDisplayItem, {} as EnrollmentMethodModel);
            expect(spy1).toBeCalledTimes(2);
            expect(spy2).toBeCalledWith({ action: "shopSuccess" }, {});
        });
    });

    describe("setIsDisableButton()", () => {
        it("should set boolean value to hide re-upload radio button", () => {
            component.fullMemberListResponse = {
                content: [
                    {
                        id: 1,
                        products: {
                            names: "Term Life",
                        },
                        email: "steve@gmail.com",
                        firstName: "Steve",
                        lastName: "Smith",
                    },
                    {
                        id: 2,
                        email: "johny@gmail.com",
                        firstName: "Johny",
                        lastName: "Bairstow",
                    },
                ] as MemberListItem[],
                totalElements: 4,
            } as SearchMembers;
            component.filterMemberResponse = [
                {
                    id: 1,
                    products: {
                        names: "Term Life",
                    },
                    email: "steve@gmail.com",
                    firstName: "Steve",
                    lastName: "Smith",
                },
            ] as MemberListItem[];
            component.setIsDisableButton();
            expect(component.isDisable).toBeTruthy();
        });
    });

    describe("showAlertMessage()", () => {
        it("should show success alert message when isSuccess is true", () => {
            component.showAlertMessage("Show success alert", true);
            expect(component.alertMessage).toEqual({
                show: true,
                type: "success",
                message: "Show success alert",
            });
        });

        it("should show warning alert message when isSuccess is false", () => {
            component.showAlertMessage("Show warning alert", false);
            expect(component.alertMessage).toEqual({
                show: true,
                type: "warning",
                message: "Show warning alert",
            });
        });
    });

    describe("hideAlertMessage()", () => {
        it("should hide alert message", () => {
            component.hideAlertMessage();
            expect(component.alertMessage).toEqual({
                show: false,
                type: "",
                message: "",
            });
        });
    });

    describe("coverageOptionSelect()", () => {
        beforeEach(() => {
            component.disableCoverageProducts = false;
            component.disableOptionNoBenefits = false;
        });
        it("should update the flags to disable products checkbox and enable no benefit option", () => {
            const selection = ["some string", "None"];
            component.coverageOptionSelect(selection);
            expect(component.disableCoverageProducts).toBeTruthy();
            expect(component.disableOptionNoBenefits).toBeFalsy();
        });
        it("should update the flags to enable products checkbox and disable no benefit option", () => {
            const selection = ["some string"];
            component.coverageOptionSelect(selection);
            expect(component.disableCoverageProducts).toBeFalsy();
            expect(component.disableOptionNoBenefits).toBeTruthy();
        });
    });

    describe("notificationWSData$", () => {
        it("should verify AccountInfoState.getAccountInfo is called", (done) => {
            const storeSpy = jest.spyOn(store, "selectSnapshot");
            component.notificationWSData$.subscribe((notificationData) => {
                expect(storeSpy).toBeCalledTimes(1);
                done();
            });
        });

        it("should verify getMemberListNotifications() data", (done) => {
            component.notificationWSData$.subscribe((notificationData) => {
                expect(notificationData).toStrictEqual({
                    41: [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "UPDATE",
                            displayText: "Application(s) pending employee signatures",
                            dismissable: true,
                            link: " ",
                            linkText: " ",
                            code: {
                                id: 12,
                                code: "ENROLLMENT_HEADSET_PENDING_SIGNATURE",
                                displayText:
                                    "MPP completes application via headset enrollment and sends application for customer/employee signature",
                            },
                            id: 1925648,
                            groupId: 256014,
                            memberId: 48,
                        },
                    ],
                });
                done();
            });
        });

        it("should verify credential data", (done) => {
            component["userService"].credential$.subscribe((userData) => {
                expect(userData).toStrictEqual(component.MemberInfo);
                done();
            });
        });

        it("should verify user credentials", (done) => {
            component["userService"].credential$.subscribe((userData) => {
                expect(userData).toStrictEqual({
                    adminId: 333,
                    groupId: 222,
                    memberId: 444,
                    name: { firstName: "Steve" },
                    producerId: 111,
                });
                done();
            });
        });

        it("should verify logged in producer id", (done) => {
            component["userService"].credential$.subscribe((userData: ProducerCredential) => {
                expect(userData.producerId).toStrictEqual(component.loggedInMemberId);
                done();
            });
        });

        it("should verify member list in table", () => {
            const mockMemberlistData = {
                content: [
                    {
                        id: 1,
                        products: {
                            names: "Term Life",
                        },
                        email: "steve@gmail.com",
                        firstName: "Steve",
                        lastName: "Smith",
                    },
                    {
                        id: 2,
                        email: "johny@gmail.com",
                        firstName: "Johny",
                        lastName: "Bairstow",
                    },
                ] as MemberListItem[],
                totalElements: 4,
            } as SearchMembers;
            const mockNotificationData = of({
                41: [
                    {
                        directAccount: false,
                        type: "MULTIPLE",
                        category: "UPDATE",
                        displayText: "Application(s) pending employee signatures",
                        dismissable: true,
                        link: " ",
                        linkText: " ",
                        code: {
                            id: 12,
                            code: "ENROLLMENT_HEADSET_PENDING_SIGNATURE",
                            displayText:
                                "MPP completes application via headset enrollment and sends application for customer/employee signature",
                        },
                        id: 1925648,
                        groupId: 256014,
                        memberId: 48,
                    },
                ],
            });
            const rxjs = jest.requireActual("rxjs");
            const combinelatestSpy = jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([mockNotificationData, mockMemberlistData]));
            component.getLanguageStrings();
            expect(combinelatestSpy).toHaveBeenCalledTimes(1);
        });

        it("should get correct notification count", () => {
            const account = {
                id: 61836,
                employeeId: "1",
                firstName: "Sammy",
                lastName: "Kohn",
                registered: true,
                status: MemberListItemStatus.ACTIVE,
                products: {
                    names: "Insurance A",
                    totalCost: 100,
                    pendingProducts: "5",
                },
                dependents: [
                    {
                        firstName: "Jeremy",
                        lastName: "Kohn",
                        relation: "son",
                    },
                ],
                notifications: [],
            };
            const notificationCount = 0;
            const notificationsForAccount: AbstractNotificationModel[] = [
                {
                    directAccount: false,
                    type: NotificationType.MULTIPLE,
                    category: "UPDATE",
                    displayText: "Application(s) pending employee signatures",
                    dismissable: true,
                    link: " ",
                    linkText: " ",
                    code: {
                        id: 12,
                        code: "ENROLLMENT_HEADSET_PENDING_SIGNATURE",
                        displayText:
                            "MPP completes application via headset enrollment and sends application for customer/employee signature",
                    },
                    id: 1925648,
                    groupId: 256014,
                    memberId: 48,
                },
            ];
            const count = component.getNotificationCount(account, notificationCount, notificationsForAccount);
            expect(count).toBe(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
