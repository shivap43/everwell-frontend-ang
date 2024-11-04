import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import {
    mockLanguageService,
    mockUtilService,
    mockUserService,
    mockActivatedRoute,
    mockMpGroupAccountService,
    MockConfigEnableDirective,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { MatMenuModule } from "@angular/material/menu";
import { Subscription, of } from "rxjs";
import { MPGroupAccountService } from "@empowered/common-services";
import { UtilService } from "@empowered/ngxs-store";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";
import { NotificationPopupComponent } from "./notification-popup.component";
import { MediaMatcher } from "@angular/cdk/layout";
import { NotificationService } from "@empowered/api";
import { CommonModule } from "@angular/common";

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

describe("NotificationPopupComponent", () => {
    let component: NotificationPopupComponent;
    let fixture: ComponentFixture<NotificationPopupComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NotificationPopupComponent, MockConfigEnableDirective],
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
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: NotificationQueueService,
                    useValue: mockNotificationQueue,
                },
                NotificationService,
                ChangeDetectorRef,
                MediaMatcher,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(NotificationPopupComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        router.initialNavigation();
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
