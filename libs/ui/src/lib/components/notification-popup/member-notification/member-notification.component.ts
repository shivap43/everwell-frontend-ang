import { Router, ActivatedRoute } from "@angular/router";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { NotificationService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { UtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { Observable, Subject, Subscription, of } from "rxjs";
import { AppSettings } from "@empowered/constants";
import { filter, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { NotificationQueueService } from "@empowered/util/websockets";

@Component({
    selector: "empowered-member-notification",
    templateUrl: "./member-notification.component.html",
    styleUrls: ["./member-notification.component.scss"],
})
export class MemberNotificationComponent implements OnInit, OnDestroy {
    getLinkDisplayConfiguration: Subscription;
    notifications: Subscription;
    mpGroup: number;
    memberId: number;
    notificationsMembertList: any;
    notificationCount = 0;
    totalNotificationCount = 0;
    isLoading: boolean;
    notificationWSData$: Observable<any>;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.notification.member.notification",
        "primary.portal.notification.member.noMessages",
        "primary.portal.notification.member.view",
        "primary.portal.notification.member.clear",
        "primary.portal.notification.member.reset",
        "primary.portal.notificationMember.seperator",
    ]);
    notificationResponse: any;
    totalCount: number;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
        private readonly language: LanguageService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly notificationQueueService: NotificationQueueService,
    ) {}

    ngOnInit(): void {
        this.getUserRole();
        this.isLoading = true;
        this.apiResponse();
    }

    apiResponse(): void {
        this.notificationWSData$
            .pipe(
                tap(
                    (response) => {
                        this.totalCount = this.getTotalNotificationCount(response);
                        this.utilService.setTotalNotificationCount(this.totalCount);
                        this.notificationsMembertList = this.utilService.getNotificationToolTip(response, "notificationTray");
                        let notificationData = [];
                        if (this.notificationsMembertList && this.notificationsMembertList.length > 0) {
                            this.notificationsMembertList.forEach((notification) => {
                                if (Object.keys(notification.categorizedObj[0]).length !== 0) {
                                    notificationData = notificationData.concat(notification);
                                }
                            });
                        }
                        this.notificationsMembertList = notificationData;
                        this.isLoading = false;
                    },
                    (error) => {
                        this.isLoading = false;
                        this.notificationsMembertList = [];
                    },
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    clearNotification(notification: any): void {
        if (notification.type === AppSettings.MULTIPLE) {
            this.notificationService
                .dismissNotifications(notification.code, AppSettings.PORTAL_MEMBER)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.apiResponse();
                });
        } else {
            this.notificationService
                .dismissNotification(notification.id, AppSettings.PORTAL_MEMBER)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.apiResponse();
                });
        }
    }

    getTotalNotificationCount(notifications: any): number {
        let notificationCount = 0;
        notifications.forEach((elem) => {
            if (elem.count) {
                notificationCount = notificationCount + elem.count;
            } else if (!elem.count && elem.type === AppSettings.SINGLE) {
                notificationCount++;
            }
        });
        return notificationCount;
    }

    viewNotifications(notification: any): void {
        this.router.navigate([notification.linkText], { relativeTo: this.route });
    }

    getUserRole(): void {
        this.notificationWSData$ = this.userService.credential$.pipe(
            filter((credential) => JSON.stringify(credential) !== "{}"),
            tap((credential) => {
                if ("memberId" in credential) {
                    this.memberId = credential.memberId;
                    this.mpGroup = credential.groupId;
                }
            }),
            switchMap(() => this.notificationQueueService.getMemberNotifications(this.mpGroup, this.memberId)),
            takeUntil(this.unsubscribe$),
        );
    }

    ngOnDestroy(): void {
        if (this.getLinkDisplayConfiguration) {
            this.getLinkDisplayConfiguration.unsubscribe();
        }
        if (this.notifications) {
            this.notifications.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
