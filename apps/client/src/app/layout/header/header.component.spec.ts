import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import {
    AccountService,
    AdminService,
    AflacService,
    EnrollmentService,
    MemberService,
    NotificationService,
    StaticService,
} from "@empowered/api";
import {
    MockHasPermissionDirective,
    MockConfigEnableDirective,
    mockAccountService,
    mockActivatedRoute,
    mockAdminService,
    mockAflacService,
    mockCsrfService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMemberService,
    mockMpGroupAccountService,
    mockSharedService,
    mockStaticService,
    mockStaticUtilService,
    mockStore,
    mockUserService,
    mockUtilService,
} from "@empowered/testing";
import { EmpoweredModalService, MPGroupAccountService, RouteInterceptorService, SharedService } from "@empowered/common-services";
import { NgxsModule, Store } from "@ngxs/store";
import { BreakPointUtilService, MemberHomeState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";
import { ActivatedRoute, Router } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { MatIconRegistry } from "@angular/material/icon";
import { MediaMatcher } from "@angular/cdk/layout";
import { CsrfService } from "@empowered/util/csrf";
import { Overlay, OverlayPositionBuilder } from "@angular/cdk/overlay";
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, NO_ERRORS_SCHEMA } from "@angular/core";
import { Subscription, of } from "rxjs";
import { BreakpointSizes } from "@empowered/constants";
import { MatMenuModule } from "@angular/material/menu";

describe("HeaderComponent", () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let store: Store;
    let notificationQueueService: NotificationQueueService;
    let userService: UserService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderComponent, MockConfigEnableDirective, MockHasPermissionDirective],
            imports: [RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot([MemberHomeState]), MatMenuModule],
            providers: [
                {
                    provide: CsrfService,
                    useValue: mockCsrfService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MemberService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: AdminService,
                    useValue: mockAdminService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: RouteInterceptorService,
                    useValue: {},
                },
                {
                    provide: NotificationService,
                    useValue: {
                        getNotifications: of([]),
                    },
                },
                {
                    provide: EnrollmentService,
                    useValue: {
                        pendingEnrollments$: of([]),
                    },
                },
                {
                    provide: BreakPointUtilService,
                    useValue: {
                        breakpointObserver$: of({
                            size: BreakpointSizes.MD,
                            orientation: "PORTRAIT",
                        }),
                    },
                },
                {
                    provide: NotificationQueueService,
                    useValue: {
                        getMemberNotifications: () => of([]),
                    },
                },
                {
                    provide: ElementRef,
                    useValue: {},
                },
                {
                    provide: Router,
                    useValue: {},
                },
                {
                    provide: MatDialog,
                    useValue: {},
                },
                MatIconRegistry,
                MediaMatcher,
                Overlay,
                OverlayPositionBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        notificationQueueService = TestBed.inject(NotificationQueueService);
        userService = TestBed.inject(UserService);
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        window.scrollTo = jest.fn();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getAccountNotifications$()", () => {
        it("should subscribe and output getAccountNotifications observable", (done) => {
            const spyNotifications = jest.spyOn(notificationQueueService, "getMemberNotifications").mockReturnValue(of([]));
            component.getAccountNotifications$.subscribe((notifications) => {
                expect(notifications).toStrictEqual([]);
                expect(spyNotifications).toBeCalled();
                done();
            });
            fixture.detectChanges();
        });
    });

    describe("getUserRole()", () => {
        it("should check credentials", (done) => {
            component.userService.credential$.subscribe((credentials) => {
                expect(credentials).toStrictEqual({
                    groupId: 222,
                    name: {
                        firstName: "Steve",
                    },
                    producerId: 111,
                    adminId: 333,
                    memberId: 444,
                });
                done();
            });
            component.getUserRole();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
