import { ComponentType, Overlay } from "@angular/cdk/overlay";
import { RouterTestingModule } from "@angular/router/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subject, Subscription, throwError } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA, Directive } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder } from "@angular/forms";
import { DatePipe, TitleCasePipe } from "@angular/common";
import {
    AccountDetails,
    AccountService,
    AflacService,
    AppTakerService,
    BenefitsOfferingService,
    Configuration,
    DashboardService,
} from "@empowered/api";
import { StaticUtilService, UtilService, SetPrivacyForEnroller } from "@empowered/ngxs-store";
import { DashboardComponent } from "./dashboard.component";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { ActivatedRoute, Router, NavigationStart, RouterEvent } from "@angular/router";
import { MatMenuModule } from "@angular/material/menu";
import {
    mockAflacService,
    mockUtilService,
    mockAccountService,
    mockBenefitsOfferingService,
    mockStaticUtilService,
    mockAppTakerService,
    mockDashboardService,
    mockLanguageService,
    MockReplaceTagPipe,
    mockDatePipe,
} from "@empowered/testing";
import {
    PartnerAccountType,
    ProspectType,
    StatusTypeValues,
    GroupAttribute,
    AccountProducer,
    AccountImportTypes,
    ToastType,
    Accounts,
} from "@empowered/constants";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { OpenToast, ToastModel } from "@empowered/ui";
import { RegistrationGuideComponent } from "./registration-guide/registration-guide.component";
import { ProducerAuthorizationCodePopupComponent } from "./producer-authorization-code-popup/producer-authorization-code-popup.component";
import { StoreModule } from "@ngrx/store";
import { provideMockStore, MockStore } from "@ngrx/store/testing";

const mockStore = {
    selectSnapshot: () => of(""),
    dispatch: () => of({}),
    select: () => of({}),
} as unknown as Store;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ type: "Remove" }),
        } as MatDialogRef<any>),
} as MatDialog;

interface RequiredPermissionConfig {
    requiredPermission?: string;
    requiredConfig?: string;
}

@Directive({
    selector: "[empoweredTpiRestrictedPermission]",
})
class MockEmpoweredTpiRestrictedPermissionDirective {
    @Input("empoweredTpiRestrictedPermission") permissionConfig: RequiredPermissionConfig;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

@Directive({
    selector: "[isRestricted]",
})
class MockIsRestrictedDirective {
    @Input() isRestricted;
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}
@Component({
    selector: "mat-tab",
    template: "",
})
class MockMatTabComponent {
    @Input() label;
}

@Component({
    selector: "mat-tab-group",
    template: "",
})
class MockMonMatGroupComponent {
    @Input() selectedIndex!: number;
}

const mockRoute = {
    parent: { snapshot: { params: { mpGroupId: 1234 } } },
};

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}
@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}
class MockRouter {
    events = new Subject<RouterEvent>();
    navigate(){}
}
const accountDetails: AccountDetails = {
    name: "chris evans",
    status: "INACTIVE",
    primaryContact: {
        address: {
            city: "test city",
            state: "Georgea",
        },
    },
} as AccountDetails;

describe("DashboardComponent", () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let utilService: UtilService;
    let aflacService: AflacService;
    let accountService: AccountService;
    let benefitOfferingService: BenefitsOfferingService;
    let staticUtil: StaticUtilService;
    let sharedService: SharedService;
    let store: Store;
    let mockStoreNgrx: MockStore;
    let empoweredModalService: EmpoweredModalService;
    let dialog: MatDialog;
    let appTakerService: AppTakerService;
    let dashboardService: DashboardService;
    let accountSubject: Subject<AccountDetails>;
    let mockRouter: MockRouter;

    beforeEach(async () => {
        accountSubject = new Subject<AccountDetails>();
        mockRouter = new MockRouter();
        await TestBed.configureTestingModule({
            declarations: [
                DashboardComponent,
                MockMatTabComponent,
                MockMonSpinnerComponent,
                MockMatFormFieldComponent,
                MockMonMatGroupComponent,
                MockConfigEnableDirective,
                MockReplaceTagPipe,
                MockEmpoweredTpiRestrictedPermissionDirective,
                MockIsRestrictedDirective,
                MockHasPermissionDirective,
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, MatMenuModule, StoreModule.forRoot({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                provideMockStore({
                    selectors: [
                        {
                            selector: 'getSelectedAccount',
                            value: accountSubject.asObservable()
                        }
                    ]
                }),
                FormBuilder,
                Overlay,
                Configuration,
                TitleCasePipe,
                {
                    provide: MatBottomSheet,
                    useValue: {},
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                { provide: Store, useValue: mockStore },
                { provide: MatDialog, useValue: mockMatDialog },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: aflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: accountService,
                    useValue: mockAccountService,
                },
                {
                    provide: benefitOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: staticUtil,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: AppTakerService,
                    useValue: mockAppTakerService,
                },
                {
                    provide: DashboardService,
                    useValue: mockDashboardService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        }).compileComponents();

        utilService = TestBed.inject(UtilService);
        aflacService = TestBed.inject(AflacService);
        accountService = TestBed.inject(AccountService);
        benefitOfferingService = TestBed.inject(BenefitsOfferingService);
        staticUtil = TestBed.inject(StaticUtilService);
        sharedService = TestBed.inject(SharedService);
        store = TestBed.inject(Store);
        mockStoreNgrx = TestBed.inject(MockStore);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        dialog = TestBed.inject(MatDialog);
        appTakerService = TestBed.inject(AppTakerService);
        dashboardService = TestBed.inject(DashboardService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        component.currentAccountDetails = {
            name: "AAAA",
            contact: { address: { state: "FL", zip: "32608" } },
            primaryContact: { address: { state: "FL", zip: "32608" } },
            situs: { state: { abbreviation: "FL", name: "Florida" }, zip: "32608" },
            payFrequencyId: 12,
            type: ProspectType.CLIENT,
            prospectInformation: { sicIrNumber: "1231", taxId: "12312" },
            subordinateProducerId: 12313,
            typeId: 12,
            status: StatusTypeValues.ACTIVE,
            partnerAccountType: PartnerAccountType.PAYROLL,
            partnerId: 12,
            employeeCount: 12,
            productsCount: 12,
            daysToEnroll: 12,
            enrollmentAssistanceAgreement: false,
        };
    });

    afterEach(() => {
        accountSubject.complete();
        mockRouter.events.complete();
        component.ngOnDestroy();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit", ()=>{
        it('should destroy the observable on NavigationStart event', ()=>{
            const destroySpy = jest.spyOn(component['destroy$'],'next');
            const navigationStartEvent = new NavigationStart(1,'http://localhost:4200/dashboard');
            mockRouter.events.next(navigationStartEvent);
            expect(destroySpy).toBeCalledTimes(0);
        })
    });

    describe.skip("validateZip()", () => {
        it("should validate zip using util", () => {
            const spy1 = jest.spyOn(utilService, "validateZip").mockReturnValue(of(true));
            component.validateZip();
            expect(spy1).toBeCalledWith("FL", "32608");
        });
    });

    describe("refreshAccount()", () => {
        it("should refresh account", () => {
            const spy1 = jest.spyOn(aflacService, "refreshAccount");
            component.refreshAccount();
            expect(spy1).toBeCalled();
        });
    });

    describe("checkPendingElements()", () => {
        it("check pending enrollments when no approval requests pending", () => {
            const spy1 = jest
                .spyOn(accountService, "getGroupAttributesByName")
                .mockReturnValue(of([{ id: 1, value: "COMPLETE" }] as GroupAttribute[]));
            const spy2 = jest.spyOn(benefitOfferingService, "getApprovalRequests").mockReturnValue(of([]));
            const spy3 = jest.spyOn(accountService, "clearPendingElements");
            component.checkPendingElements();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
        });
    });

    describe("navigateTo()", () => {
        it("should navigateTo", () => {
            const navigateSpy = jest.spyOn(mockRouter, "navigate");
            component.navigateTo("some path");
            expect(navigateSpy).toBeCalledTimes(1);
        });
    });

    describe("navigateToCommissionSplitTab()", () => {
        it("should navigateToCommissionSplitTab", () => {
            const navigateSpy = jest.spyOn(mockRouter, "navigate");
            component.navigateToCommissionSplitTab();
            expect(navigateSpy).toBeCalledWith(["commissions"], {
                queryParams: { page: "commission-split" },
                relativeTo: { parent: { snapshot: { params: { mpGroupId: 1234 } } } },
            });
        });
    });
    describe("getMaintananceLock()", () => {
        it("should call getMaintananceLock()", () => {
            const spy = jest.spyOn(appTakerService, "getMaintananceLock").mockReturnValue(of(false));
            component.mpGroup = 1234;
            component.getMaintananceLock();
            expect(spy).toBeCalledWith("1234");
            expect(component.isMaintananceLockFlag).toBe(false);
            expect(component.alertTypeAccess).toStrictEqual("ALLOWACCESS");
        });
    });
    
    describe("displayAccountNumber()", () => {
        it("should set accountNumberDisplay", () => {
            component.accountDetails = {
                ...accountDetails,
                importType: AccountImportTypes.AFLAC_GROUP,
                aflacGroupNumber: 12345,
            };
            component.displayAccountNumber();
            expect(component.accountNumberDisplay).toStrictEqual(" (primary.portal.accounts.accountList.ag12345)");
            component.accountDetails.importType = AccountImportTypes.SHARED_CASE;
            component.accountDetails.accountNumber = "1234";
            component.displayAccountNumber();
            expect(component.accountNumberDisplay).toStrictEqual(" (1234 / primary.portal.accounts.accountList.ag12345)");
            component.accountDetails = {
                ...accountDetails,
                accountNumber: "1234",
            };
            component.displayAccountNumber();
            expect(component.accountNumberDisplay).toStrictEqual(" (1234)");
        });
    });
    describe("getConvertedTextToTitleCase()", () => {
        it("should return title case converted string", () => {
            const result = component.getConvertedTextToTitleCase("dashboardComponent");
            expect(result).toStrictEqual("Dashboardcomponent");
        });
    });

    describe("getAccountProducerRole()", () => {
        it("should dispatch SetPrivacyForEnroller with boolean value", () => {
            const enroller = { producer: { id: 1 }, pendingInvite: true } as AccountProducer;
            jest.spyOn(sharedService, "getEnroller").mockReturnValue(of(enroller));
            const spy = jest.spyOn(store, "dispatch");
            component.getAccountProducerRole("23456");
            expect(spy).toBeCalledWith(new SetPrivacyForEnroller(true));
        });
    });

    describe("openEverwellRegistrationGuidePopup()", () => {
        it("should open registration guide pop-up", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openEverwellRegistrationGuidePopup();
            expect(spy).toBeCalledWith(RegistrationGuideComponent);
        });
    });

    describe("openAuthorizationCodePopUp()", () => {
        it("should open dialog with ProducerAuthorizationCodePopupComponent", () => {
            component.mpGroup = 34123;
            component.currentAccount = {
                producers: "assistance",
            };
            const spy = jest.spyOn(dialog, "open");
            component.openAuthorizationCodePopUp();
            expect(spy).toBeCalledWith(ProducerAuthorizationCodePopupComponent, {
                backdropClass: "backdrop-blur",
                data: {
                    mpGroup: 34123,
                    producerCheckoutData: "assistance",
                },
                width: "600px",
            });
        });
    });

    describe("getRole()", () => {
        it("should return role value", () => {
            component.assistingProdPrev = "WRITING_PRODUCER";
            component.assistingProd = "assisting producer";
            component.enrollerPrev = "ENROLLER";
            component.enroller = "enroller";
            component.primaryProducer = "primary producer";
            expect(component.getRole("WRITING_PRODUCER")).toStrictEqual("assisting producer");
        });
    });

    describe("openToast()", () => {
        it("should dispatch openToast with toastData value", () => {
            const spy = jest.spyOn(store, "dispatch");
            const message = "toast message";
            const toastData: ToastModel = {
                message: message,
                toastType: ToastType.WARNING,
            };
            component.openToast(message, ToastType.WARNING);
            expect(spy).toBeCalledWith(new OpenToast(toastData));
        });
    });

    describe("showRefreshAccountAlert()", () => {
        it("should set refreshAccountErrorAlertFlag to be true if isError is true", () => {
            component.showRefreshAccountAlert(true);
            expect(component.refreshAccountErrorAlertFlag).toBe(true);
        });

        it("should set refreshAccountSuccessAlertFlag to be true if isError is false", () => {
            component.showRefreshAccountAlert(false, { data: "refresh data" });
            expect(component.refreshAccountSuccessData).toStrictEqual(["data"]);
            expect(component.refreshAccountSuccessAlertFlag).toBe(true);
        });
    });

    describe("deactivateDialogMessage()", () => {
        it("should return 'noLongerViewAccountMessage' if noLongerViewAccountMsg is true", () => {
            component.languageStrings = {
                "primary.portal.dashboard.deactivateAccount.noLongerViewAccountMessage": "noLongerViewAccountMessage",
            } as Record<string, string>;
            component.noLongerViewAccountMsg = true;
            expect(component.deactivateDialogMessage()).toStrictEqual("noLongerViewAccountMessage");
        });

        it("should return 'viewAccountMessage' if viewAccountMsg is true", () => {
            component.languageStrings = {
                "primary.portal.dashboard.deactivateAccount.viewAccountMessage": "viewAccountMessage",
            } as Record<string, string>;
            component.viewAccountMsg = true;
            expect(component.deactivateDialogMessage()).toStrictEqual("viewAccountMessage");
        });

        it("should return undefined if both viewAccountMessage and viewAccountMsg are false", () => {
            component.noLongerViewAccountMsg = false;
            component.viewAccountMsg = false;
            expect(component.deactivateDialogMessage()).toBeUndefined();
        });
    });

    describe("getAccountDetails()", () => {
        it("should call getAccount() and dispatch action", () => {
            component.accountDetails = {
                ...accountDetails,
            }
            component.accountStatus = 'inactive';
            component.manageAccountButtonFlag = false;
            component.inactiveAccountFlag = true;
            component.accountHolderLocation = 'City State';
            component.mpGroup = 1234;
            const spy1 = jest.spyOn(mockStoreNgrx, "dispatch");
            component.getAccountDetails();
            accountSubject.next(accountDetails);
            fixture.detectChanges();
            expect(component.accountDetails).toEqual(accountDetails);
            expect(component.isLoading).toBe(false);
            expect(component.accountStatus).toBe('inactive');
            expect(component.manageAccountButtonFlag).toBe(false);
            expect(component.inactiveAccountFlag).toBe(true);
            expect(component.accountHolderLocation).toBe('City State');
        });
        it("should set showErrorMessage when there is an error", () => {
            const error = {
                message: "api error message",
                status: 400
            };
            const spy = jest.spyOn(component, 'showErrorAlertMessage');
            component.getAccountDetails();
            expect(component.isLoading).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
            const spy = jest.spyOn(component["destroy$"], "next");
            const spy2 = jest.spyOn(component["destroy$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
