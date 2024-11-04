import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockUtilService, mockUserService, mockActivatedRoute, MockConfigEnableDirective } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MatMenuModule } from "@angular/material/menu";
import { Subscription, of } from "rxjs";
import { UtilService } from "@empowered/ngxs-store";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";
import { MemberNotificationComponent } from "./member-notification.component";
import { NotificationService } from "@empowered/api";

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
    getMemberNotifications: (groupId: number, memberId: number) => of({ test: "test" }),
};

describe("MemberNotificationComponent", () => {
    let component: MemberNotificationComponent;
    let fixture: ComponentFixture<MemberNotificationComponent>;
    let router: Router;
    let notificationQueueService: NotificationQueueService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemberNotificationComponent, MockConfigEnableDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, ReactiveFormsModule, MatMenuModule],
            providers: [
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: NotificationQueueService,
                    useValue: mockNotificationQueue,
                },
                NotificationService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(MemberNotificationComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        notificationQueueService = TestBed.inject(NotificationQueueService);
        router.initialNavigation();
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getUserRole()", () => {
        it("should call notificationWSData$", (done) => {
            const spy = jest.spyOn(notificationQueueService, "getMemberNotifications");
            component.getUserRole();
            component.notificationWSData$.subscribe(() => {
                expect(spy).toBeCalled();
                done();
            });
        });
    });

    describe("getTotalNotificationCount()", () => {
        it("should check notifications count", () => {
            const notifications = [{ count: 5 }];
            const totalCount = component.getTotalNotificationCount(notifications);
            expect(totalCount).toBe(5);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all notifications", () => {
            component.notifications = new Subscription();
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });

        it("should unsubscribe from get link config", () => {
            component.getLinkDisplayConfiguration = new Subscription();
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });

        it("should clean up subscriptions", () => {
            component.notifications = null;
            component.getLinkDisplayConfiguration = null;
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
