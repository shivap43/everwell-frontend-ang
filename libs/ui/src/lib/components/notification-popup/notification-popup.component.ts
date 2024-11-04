import { Observable, Subject, Subscription, of } from "rxjs";
import { Component, OnInit, Input, ChangeDetectorRef, AfterViewChecked, ViewChild, OnDestroy, ElementRef } from "@angular/core";
import { UtilService } from "@empowered/ngxs-store";
import { NotificationService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { MediaMatcher } from "@angular/cdk/layout";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import {
    AppSettings,
    NotificationTypes,
    AbstractNotificationModel,
    NotificationType,
    MultipleNotificationModel,
} from "@empowered/constants";
import { SharedState, PathState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { MatTabGroup } from "@angular/material/tabs";
import { MPGroupAccountService } from "@empowered/common-services";
import { NotificationQueueService } from "@empowered/util/websockets";
import { filter, switchMap, take, takeUntil, tap } from "rxjs/operators";

const DIRECT_TAB_INDEX = 2;
const DIRECT_TAB = "DIRECT";
const PATH_VARIABLE_MP_GROUP = "mpGroupId";
interface CategorizedNotifications {
    [key: string]: (AbstractNotificationModel & { categorizedNotificationCount: number })[];
}
/**
 * Notification-popup component is used to display All notification, Account specific notification and direct sale notification
 * @input isAuthenticated is type boolean used to store boolean value depends on user is authenticated or not
 * @param producerId is type number used to hold producer Id
 * @param memberId is a type number used to hold member Id
 * @param adminId is a type number used to hold admin Id
 * @param mpGroup is a type number used to get group Id
 * @param portal is a type string used to get portal type
 * @param payrollPage is of type boolean used to store whether page is payroll or not
 * @param directPage is of type boolean used to store whether page is direct page or not
 * @param notificationsList is of type AbstractNotificationModel[] used to store notifications
 * @param totalNotificationCount is of type number is used to store total notification count
 * @param totalAccountNotificationCount is of type number used to get total specific account notification count
 * @param totalDirectSaleNotificationCount is of type number used to get total direct notification count
 *
 */
@Component({
    selector: "empowered-notification-popup",
    templateUrl: "./notification-popup.component.html",
    styleUrls: ["./notification-popup.component.scss"],
})
export class NotificationPopupComponent implements OnInit, AfterViewChecked, OnDestroy {
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("notificationFlag") set setNotificationFlag(flag: boolean) {
        this.isNotificationFlag = {
            position: flag ? "absolute" : "relative",
        };
    }
    @Input() isAuthenticated: boolean;
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    @ViewChild("headerNotification") headerNotification: ElementRef;
    langStrings = {};
    private readonly _mobileQueryListener: () => void;
    mobileQuery: MediaQueryList;
    producerId: number;
    memberId: number;
    adminId: number;
    mpGroup: number;
    portal: string;
    payrollPage: boolean;
    directPage: boolean;
    isLoading: boolean;
    notificationsList: AbstractNotificationModel[];
    directNotificationsList: AbstractNotificationModel[];
    totalNotificationCount: number;
    notificationtype: any;
    totolReminderNotificationCount = 0;
    totolUpdateNotificationCount = 0;
    totolCtaNotificationCount = 0;
    notificationsAccountList: any;
    totalAccountNotificationCount = 0;
    totalDirectSaleNotificationCount = 0;
    notificationCount = 0;
    accountSelectionFlag: boolean;
    isNotificationFlag = {};
    subscriptions: Subscription[] = [];
    showNotificationViewLinks: boolean;
    notificationTray = "notificationTray";
    private readonly unsubscribe$: Subject<void> = new Subject();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.notification.notification",
        "primary.portal.notification.allAccounts",
        "primary.portal.notification.thisAccount",
        "primary.portal.notification.actionNeeded",
        "primary.portal.notification.reminders",
        "primary.portal.notification.updates",
        "primary.portal.notification.noMessage",
        "primary.portal.notification.view",
        "primary.portal.notification.clear",
        "primary.portal.notification.directAccounts",
        "primary.portal.notificationMember.seperator",
        "primary.portal.notification.moreThan99Records",
        "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText",
        "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText",
    ]);

    loggedInUserId: number;
    credential$ = this.userService.credential$.pipe(
        filter((credential) => JSON.stringify(credential) !== "{}" && this.isAuthenticated),
        take(1),
        tap((credential) => {
            if ("producerId" in credential) {
                this.producerId = credential.producerId;
                this.portal = AppSettings.PORTAL_PRODUCER;
                this.loggedInUserId = credential.producerId;
            } else if ("adminId" in credential && this.portal === AppSettings.PORTAL_ADMIN) {
                this.adminId = credential.adminId;
                this.loggedInUserId = credential.adminId;
            } else if ("memberId" in credential && this.portal === AppSettings.PORTAL_MEMBER) {
                this.memberId = credential.memberId;
            }
        }),
    );
    notificationWSData$ = this.credential$.pipe(
        filter((credential) => !!this.loggedInUserId && !!this.mpGroup),
        switchMap(() => this.notificationQueueService.getGroupNotifications(this.loggedInUserId, this.mpGroup)),
        takeUntil(this.unsubscribe$),
    );
    notificationsWSList$ = this.credential$.pipe(
        filter((credential) => !!this.loggedInUserId),
        switchMap(() => this.notificationQueueService.getProducerNotifications(this.loggedInUserId)),
        takeUntil(this.unsubscribe$),
    );

    constructor(
        private readonly utilService: UtilService,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly route: ActivatedRoute,
        private readonly cdRef: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly media: MediaMatcher,
        private readonly store: Store,
        private readonly router: Router,
        private readonly notificationQueueService: NotificationQueueService,
    ) {
        this.mobileQuery = this.media.matchMedia("(max-width: 1200px)");
    }

    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.notificationtype = NotificationTypes;
        this.getUserRole();
        this.getMpGroup();
        this.hasNotificationTriggered();
        this.apiResponse();
        this.getNotificationsForAllAccounts();
    }

    /**
     * Implementing push based notifications using websocket for account specific notifications
     * @returns nothing
     */
    getNotificationsForAccountWS(): void {
        this.notificationWSData$
            .pipe(
                tap((wsData) => {
                    if (wsData) {
                        this.totalAccountNotificationCount = this.getTotalNotificationCount(wsData);
                        this.notificationsAccountList = this.utilService.getNotificationToolTip(
                            this.notificationService.getNotificationDisplayText(
                                wsData,
                                this.totalAccountNotificationCount > 1
                                    ? this.languageStrings[
                                        "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText"
                                    ]
                                    : this.languageStrings[
                                        "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText"
                                    ],
                            ),
                            this.notificationTray,
                        );
                    }
                    this.notificationsAccountList = this.categorizedResponse(this.notificationsAccountList);
                    if (this.tabGroup) {
                        this.tabGroup.selectedIndex = 1;
                    }
                    this.isLoading = false;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Applying focus on header notification items for accessibility
     * @returns nothing
     */
    applyFocus(): void {
        this.headerNotification?.nativeElement.focus();
    }

    hasNotificationTriggered(): void {
        this.subscriptions.push(
            this.utilService.isNotificationTriggered.subscribe((isTriggered) => {
                if (isTriggered) {
                    this.apiResponse();
                }
            }),
        );
    }

    /**
     * Sets MP-Group
     * @returns nothing
     */
    getMpGroup(): void {
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$.subscribe((account) => {
                if (account && this.mpGroup !== account.id) {
                    this.mpGroup = account.id;
                    this.apiResponse();
                    this.getNotificationsForAccountWS();
                } else {
                    this.mpGroup = undefined;
                }
            }),
        );
    }
    /**
     * Calling Notification api once we are receiving response from notification events or API side
     * @returns nothing
     */
    apiResponse(): void {
        if (this.isAuthenticated && this.directPage && this.tabGroup) {
            this.tabGroup.selectedIndex = DIRECT_TAB_INDEX;
        }
        this.cdRef.detectChanges();
    }

    /**
     * Used to get all notification related to the user account which include Direct as well as Payroll and All notification
     */
    getNotificationsForAllAccounts(): void {
        this.notificationsWSList$
            .pipe(
                tap(
                    (wsData) => {
                        if (wsData) {
                            const totalCount = this.getTotalNotificationCount(wsData);
                            this.utilService.setTotalNotificationCount(totalCount);
                            this.preparePayrollNotifications(wsData);
                            this.prepareDirectNotifications(wsData);
                        }
                        this.isLoading = false;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    preparePayrollNotifications(response: AbstractNotificationModel[]): void {
        this.notificationsList = response.filter((value) => {
            if (!value.directAccount) {
                return value;
            }
            return undefined;
        });

        this.totalNotificationCount = this.getTotalNotificationCount(this.notificationsList);
        if (this.notificationsList.length > 0) {
            this.notificationsList = this.utilService.getNotificationToolTip(this.notificationsList, this.notificationTray);
            this.notificationsList = this.categorizedResponse(this.notificationsList);
        }
    }

    /**
     * @description prepareDirectNotifications is used to calculate total number of direct notifications and get only direct notifications
     * @param response is of type AbstractNotificationModel consisting of all notifications
     * @returns void
     */
    prepareDirectNotifications(response: AbstractNotificationModel[]): void {
        this.directNotificationsList = response.filter((value) => {
            if (value.directAccount) {
                return value;
            }
            return undefined;
        });
        this.totalDirectSaleNotificationCount = this.getTotalNotificationCount(this.directNotificationsList);
        if (this.directNotificationsList.length > 0) {
            this.directNotificationsList = this.utilService.getNotificationToolTip(this.directNotificationsList, this.notificationTray);
            this.directNotificationsList = this.categorizedResponse(this.directNotificationsList);
        }
    }

    emptyNotificationObj(notificationsList: any): boolean {
        return notificationsList ? Object.keys(notificationsList).length === 0 : false;
    }
    /**
     * @description function to categorized notifications into categories CTA, Reminder and Update
     * @param notificationsList list of all notifications
     * @return notificationsList contains categorized notifications for 3 categories
     */
    categorizedResponse(notificationsList: any): any {
        let notificationData = [];
        if (notificationsList && notificationsList.length > 0) {
            notificationsList.forEach((notification) => {
                notificationData = notificationData.concat(notification.categorizedObj);
                notificationData = notificationData.filter((v) => Object.keys(v).length !== 0);
            });
        }
        notificationsList = this.setNotificationData(notificationData);
        for (const key in notificationsList) {
            if (key) {
                // eslint-disable-next-line no-prototype-builtins
                if (!notificationsList.hasOwnProperty(NotificationTypes.CTA)) {
                    Object.assign(notificationsList, { CTA: [{}] });
                }
                // eslint-disable-next-line no-prototype-builtins
                if (!notificationsList.hasOwnProperty(NotificationTypes.REMINDER)) {
                    Object.assign(notificationsList, {
                        REMINDER: [],
                    });
                }
                // eslint-disable-next-line no-prototype-builtins
                if (!notificationsList.hasOwnProperty(NotificationTypes.UPDATE)) {
                    Object.assign(notificationsList, {
                        UPDATE: [],
                    });
                }
            }
        }
        return notificationsList;
    }

    /**
     * Categorizes a notifications list
     * @param notificationData AbstractNotificationModel array
     * @returns object where the category is key and the notifications under the category are value
     */
    setNotificationData(notificationData: AbstractNotificationModel[]): CategorizedNotifications {
        const sorted = {};
        if (notificationData && notificationData.length > 0) {
            notificationData.forEach((x) => {
                if (sorted[x.category] === undefined) {
                    sorted[x.category] = [];
                }
                sorted[x.category].push(x);
                sorted[x.category].categorizedNotificationCount = this.getTotalCategorizedNotificationCount(sorted[x.category]);
            });
        }
        return sorted;
    }

    /**
     * Returns total number of notifications under a category
     * @param categorizedNotifications array of notifications under a category
     * @returns total number of notifications under the category
     */
    getTotalCategorizedNotificationCount(categorizedNotifications: MultipleNotificationModel[]): number {
        return categorizedNotifications.reduce((accumulator, notification) => {
            let count = 0;
            if (notification.count) {
                count = notification.count;
            } else if (!notification.count && notification.type === NotificationType.SINGLE) {
                count = 1;
            }
            return accumulator + count;
        }, 0);
    }

    getTotalNotificationCount(notifications: any): number {
        let notificationCount = 0;
        if (notifications && notifications.length > 0) {
            notifications.forEach((elem) => {
                if (elem.count) {
                    notificationCount = notificationCount + elem.count;
                } else if (!elem.count && elem.type === AppSettings.SINGLE) {
                    notificationCount++;
                }
            });
        }
        return notificationCount;
    }

    /**
     * This method gets the User Role
     */
    getUserRole(): void {
        this.subscriptions.push(
            this.store.select(PathState.getPathParameter(PATH_VARIABLE_MP_GROUP)).subscribe((pathParameter) => {
                if (pathParameter?.type === DIRECT_TAB) {
                    this.directPage = true;
                } else {
                    this.directPage = false;
                }
                this.cdRef.detectChanges();
            }),
        );
    }

    viewNotifications(notification: any): void {
        this.router.navigate([notification.linkText], { relativeTo: this.route });
    }

    clearNotifications(notification: any): void {
        this.isLoading = true;
        // Check notification.code once we are receiving data from API side
        if (notification.type === AppSettings.MULTIPLE) {
            this.subscriptions.push(
                this.notificationService.dismissNotifications(notification.code.id, this.portal).subscribe(
                    () => {
                        this.apiResponse();
                        this.isLoading = false;
                    },
                    () => {
                        this.isLoading = false;
                    },
                ),
            );
        } else {
            this.subscriptions.push(
                this.notificationService.dismissNotification(notification.id, this.portal).subscribe(
                    () => {
                        this.apiResponse();
                        this.isLoading = false;
                    },
                    () => {
                        this.isLoading = false;
                    },
                ),
            );
        }
    }

    ngAfterViewChecked(): void {
        this.cdRef.detectChanges();
    }

    ngOnDestroy(): void {
        this.loggedInUserId = null;
        this.subscriptions.forEach((element) => {
            element.unsubscribe();
        });
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
