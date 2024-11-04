import { Component, OnInit, ViewChild, HostListener, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { MonSideNavList, MemberService, EmpSidenavContent, StaticService, MemberListDisplayItem } from "@empowered/api";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { ConfirmAddressDialogComponent, GenericSidenavComponent, EnrollmentMethodComponent } from "@empowered/ui";
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { UserService } from "@empowered/user";
import { SidenavIcon, SHOP_SUCCESS, AppSettings, EnrollmentMethod, ContactType, CountryState } from "@empowered/constants";
import {
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    EnrollmentMethodModel,
    SharedState,
} from "@empowered/ngxs-store";

// Component level constants
const NY_ABBR = "NY";

@Component({
    selector: "empowered-customer-dashboard",
    templateUrl: "./customer-dashboard.component.html",
    styleUrls: ["./customer-dashboard.component.scss"],
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
    @ViewChild("genSideNav", { static: true }) genSideNav: GenericSidenavComponent;
    visitedMpGroupStateObj: string[];
    enrollmentState: any;
    storedState: CountryState[];

    mobileQuery: MediaQueryList;
    navOptions: MonSideNavList[];
    previousListName: string;
    mpGroupId: any;
    memberId: any;
    isLoading: boolean;
    memberDetails: any;
    private screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    private unsubscribe$ = new Subject<void>();
    configurationSubscriber: Subscription;
    unpluggedFeatureFlag: boolean;
    specificEnrollmentObj: EnrollmentMethodModel;
    memberName$ = this.store.select(EnrollmentMethodState.getMemberInfo).pipe(
        map((member) => {
            const [lastName, firstName] = member.name && member.name.split(", ");
            return lastName && firstName ? `${firstName} ${lastName}` : "";
        }),
    );
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.openNavigation",
        "primary.portal.memberDashboard.primary",
        "primary.portal.directDashboard.customers",
        "primary.portal.memberDashboard.profile",
        "primary.portal.memberDashboard.dependents",
        "primary.portal.memberDashboard.coverage",
        "primary.portal.memberDashboard.summary",
        "primary.portal.memberDashboard.beneficiaries",
        "primary.portal.memberDashboard.benefitDollars",
        "primary.portal.memberDashboard.pendingEnrollments",
        "primary.portal.memberDashboard.changes",
        "primary.portal.memberDashboard.policyChangeRequests",
        "primary.portal.memberDashboard.shop",
        "primary.portal.memberDashboard.documentsAndNotes",
        "primary.portal.memberDashboard.auditHistory",
        "primary.portal.memberDashboard.activities",
        "primary.portal.memberDashboard.profileChanges",
        "primary.portal.memberDashboard.enrollments",
        "primary.portal.sideNavBar.customers",
        "primary.portal.sideNavBar.shop",
        "primary.portal.sideNavBar.enrollments",
        "primary.portal.sideNavBar.profileChanges",
        "primary.portal.sideNavBar.activities",
        "primary.portal.sideNavBar.documentsAndNotes",
        "primary.portal.sideNavBar.policyChangeRequests",
        "primary.portal.sideNavBar.summary",
        "primary.portal.sideNavBar.beneficiaries",
        "primary.portal.sideNavBar.dependents",
        "primary.portal.sideNavBar.primary",
        "primary.portal.sideNavBar.pendingEnrollments",
    ]);
    directStateAbbr: any;
    EnrollmentDialogRef: MatDialogRef<EnrollmentMethodComponent>;
    portal: string;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly media: MediaMatcher,
        private readonly memberService: MemberService,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
    }

    ngOnInit(): void {
        this.unpluggedFeatureFlag = false;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.portal = "/" + this.portal.toLowerCase();
        this.checkForUnpluggedFeature();
        this.previousListName = this.languageStrings["primary.portal.directDashboard.customers"];
        this.mpGroupId = this.route.snapshot.params.mpGroupId;
        this.memberId = this.route.snapshot.params.customerId;
        this.directStateAbbr = this.store.selectSnapshot(EnrollmentMethodState.getDirectUserStateAbbr);
        this.fetchMemberDetails();
        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.mobileQuery.matches) {
                    this.genSideNav.dashboardSideNav.opened = false;
                } else {
                    this.genSideNav.dashboardSideNav.opened = true;
                }
            });
        // this.routeToPersonalInfo();
    }

    checkForUnpluggedFeature(): void {
        this.configurationSubscriber = this.staticService.getConfigurations(AppSettings.UNPLUGGED_CONFIG).subscribe(
            (configs) => {
                this.unpluggedFeatureFlag = configs.length && configs[0].value.toLowerCase() === "true";
            },
            () => {},
            () => {
                this.userService.credential$.subscribe((res: any) => {
                    if ((res && res.adminId) || this.unpluggedFeatureFlag) {
                        this.addNavigationOptionsAdmin();
                    } else {
                        this.addNavigationOptions();
                    }
                    this.checkPermissions();
                });
            },
        );
    }
    checkPermissions(): void {
        this.store
            .select(SharedState.hasPermission("core.shopping.read"))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (!response) {
                    this.addNavigationOptionsAdmin();
                }
            });
    }

    @HostListener("window:resize", ["$event"])
    onResize(event: Event & { target: { innerWidth: number } }) {
        this.screenWidth$.next(event.target.innerWidth);
        if (!this.mobileQuery.matches) {
            this.genSideNav.dashboardSideNav.opened = true;
        } else {
            this.genSideNav.dashboardSideNav.opened = false;
        }
    }

    getScreenWidth(): Observable<number> {
        return this.screenWidth$.asObservable();
    }
    /**
     * Get member data to set member details
     */
    fetchMemberDetails(): void {
        this.isLoading = true;
        this.memberService
            .getMember(this.memberId, true, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    if (res) {
                        this.memberDetails = res.body;
                    }
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * This function will configure sidenav with all required options for admin
     * @returns void
     */
    addNavigationOptionsAdmin(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.profile"],
                    iconName: SidenavIcon.PROFILE_EMPLOYEE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.primary"],
                        iconName: "personal-info",
                    },
                    { name: this.languageStrings["primary.portal.memberDashboard.dependents"], iconName: "dependents" },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.coverage"],
                    iconName: SidenavIcon.COVERAGE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.summary"],
                        iconName: "coverage-summary",
                        path: "coverage-summary",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.beneficiaries"],
                        iconName: "beneficiaries",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.changes"],
                    iconName: SidenavIcon.CHANGES,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.pendingEnrollments"],
                        iconName: "pending-enrollments",
                        path: "pending-applications",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.policyChangeRequests"],
                        iconName: "pcr",
                        path: "change-requests",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.documentsAndNotes"],
                    iconName: SidenavIcon.DOCUMENTS,
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.auditHistory"],
                    iconName: SidenavIcon.AUDIT_HISTORY,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.activities"],
                        iconName: "activity-history",
                        path: "activities",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.profileChanges"],
                        iconName: "profile-history",
                        path: "profile",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.enrollments"],
                        iconName: "enrollment-history",
                        path: "/enrollments",
                    },
                ],
            },
        ];
    }
    /**
     * This function will configure sidenav with all required options
     * @returns void
     */
    addNavigationOptions(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.profile"],
                    iconName: SidenavIcon.PROFILE_EMPLOYEE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.primary"],
                        iconName: "personal-info",
                        path: "memberadd",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.dependents"],
                        iconName: "dependents",
                        path: "dependents",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.coverage"],
                    iconName: SidenavIcon.COVERAGE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.summary"],
                        iconName: "coverage-summary",
                        path: "coverage-summary",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.beneficiaries"],
                        iconName: "beneficiaries",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.shop"],
                    iconName: SidenavIcon.SHOP,
                    path: "/enrollment/quote-shop/",
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.changes"],
                    iconName: SidenavIcon.CHANGES,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.pendingEnrollments"],
                        iconName: "pending-enrollments",
                        path: "pending-applications",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.policyChangeRequests"],
                        iconName: "pcr",
                        path: "change-requests",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.documentsAndNotes"],
                    iconName: SidenavIcon.DOCUMENTS,
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.auditHistory"],
                    iconName: SidenavIcon.AUDIT_HISTORY,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.activities"],
                        iconName: "activity-history",
                        path: "activities",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.profileChanges"],
                        iconName: "profile-history",
                        path: "profile",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.enrollments"],
                        iconName: "enrollment-history",
                        path: "/enrollments",
                    },
                ],
            },
        ];
    }

    routeToCoverageSummary(): void {
        this.router.navigate(["./coverage-summary"], { relativeTo: this.route });
    }

    routeToCustomerList(): void {
        this.router.navigate(["../"], { relativeTo: this.route, queryParamsHandling: "preserve" });
    }

    routeToDocumentNote(): void {
        this.router.navigate(["./documents"], { relativeTo: this.route });
    }

    routeToDependents(): void {
        this.router.navigate(["./dependents"], { relativeTo: this.route });
    }

    routeToBeneficairy(): void {
        this.router.navigate(["./beneficiaries"], { relativeTo: this.route });
    }

    routeToPersonalInfo(): void {
        this.router.navigate(["./memberadd"], { relativeTo: this.route });
    }

    routeToActivities(): void {
        this.router.navigate(["./activities"], { relativeTo: this.route });
    }

    routeToEnrollments(): void {
        this.router.navigate(["./enrollments"], { relativeTo: this.route });
    }

    routeToProfile(): void {
        this.router.navigate(["./profile"], { relativeTo: this.route });
    }

    navigateToPCR(): void {
        this.router.navigate(["change-requests"], { relativeTo: this.route });
    }
    /**
     * Navigate to selected route option
     * @param route {any}: selected navigation option
     * @returns Nothing
     */
    navitageToSelectedOption(route: any): void {
        // TODO: Name labels will be replaced by language strings once language is implemented
        switch (route) {
            case this.languageStrings[EmpSidenavContent.CUSTOMERS]:
                this.routeToCustomerList();
                break;
            case this.languageStrings[EmpSidenavContent.SUMMARY]:
                this.routeToCoverageSummary();
                break;
            case this.languageStrings[EmpSidenavContent.SHOP]:
                this.navigateToShopPage();
                break;
            case this.languageStrings[EmpSidenavContent.DOCUMENTS_AND_NOTES]:
                this.routeToDocumentNote();
                break;
            case this.languageStrings[EmpSidenavContent.DEPENDENTS]:
                this.routeToDependents();
                break;
            case this.languageStrings[EmpSidenavContent.BENEFICIARIES]:
                this.routeToBeneficairy();
                break;
            case this.languageStrings[EmpSidenavContent.PRIMARY]:
                this.routeToPersonalInfo();
                break;
            case this.languageStrings[EmpSidenavContent.ACTIVITIES]:
                this.routeToActivities();
                break;
            case this.languageStrings[EmpSidenavContent.PROFILE_CHANGES]:
                this.routeToProfile();
                break;
            case this.languageStrings[EmpSidenavContent.ENROLLMENTS]:
                this.routeToEnrollments();
                break;
            case this.languageStrings[EmpSidenavContent.POLICY_CHANGE_REQUESTS]:
                this.navigateToPCR();
                break;
            case this.languageStrings[EmpSidenavContent.PENDING_ENROLLMENTS]:
                this.router.navigate(["pending-applications/view-enrollments/manage"], {
                    relativeTo: this.route,
                });
                break;
        }
    }
    // following function routes the user to the shop page directly or through enrollement pop-up based on various conditions and data
    navigateToShopPage(): void {
        const details = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        // condition to check whether current user's ID is available or not and fetch data from store if available
        if (details.id) {
            this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
            this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(details.id));
            this.store.dispatch(new SetMemberInfo(details));
            // condition to check if enrollement values have been set in store for current session or if enrollement pop-up is required.
            if (
                !(
                    this.specificEnrollmentObj &&
                    (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                    this.specificEnrollmentObj.mpGroup &&
                    this.specificEnrollmentObj.mpGroup === this.mpGroupId &&
                    this.visitedMpGroupStateObj.indexOf(this.mpGroupId) >= 0
                )
            ) {
                this.EnrollmentDialogRef = this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                    data: {
                        mpGroup: this.mpGroupId,
                        detail: details,
                        route: this.route,
                        stateAbbr: this.directStateAbbr,
                    },
                });
            } else {
                const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                // condition to check if confirmAddress dialog is required or not
                if (
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                ) {
                    this.memberService
                        .getMemberContact(details.id, ContactType.HOME, this.mpGroupId.toString())
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((result) => {
                            if (result) {
                                if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                    this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroupId,
                                            detail: details,
                                            route: this.route,
                                            stateAbbr: this.directStateAbbr,
                                        },
                                    });
                                } else {
                                    this.openConfirmAddressDialogForShop(details, currentEnrollmentObj);
                                }
                            }
                        });
                } else {
                    this.memberService
                        .getMemberContact(details.id, ContactType.HOME, this.mpGroupId.toString())
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((result) => {
                            if (result) {
                                if (
                                    (currentEnrollmentObj.enrollmentStateAbbreviation !== NY_ABBR &&
                                        result.body.address.state === NY_ABBR) ||
                                    (currentEnrollmentObj.enrollmentStateAbbreviation === NY_ABBR && result.body.address.state !== NY_ABBR)
                                ) {
                                    this.EnrollmentDialogRef = this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroupId,
                                            detail: details,
                                            route: this.route,
                                            stateAbbr: result.body.address.state,
                                        },
                                    });
                                } else {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(details.id));
                                    this.store.dispatch(new SetMemberInfo(details));
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentCity: currentEnrollmentObj.enrollmentCity,
                                            enrollmentState: this.enrollmentState.currentEnrollment.enrollmentState,
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                        }),
                                    );
                                    if (!this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr)) {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(true);
                                    } else {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(false);
                                    }
                                    this.router.navigate(
                                        [
                                            // eslint-disable-next-line max-len
                                            `${this.portal}/direct/customers/${this.mpGroupId}/${details.id}/enrollment/quote-shop/${this.mpGroupId}/specific/`,
                                            +details.id,
                                        ],
                                        {
                                            relativeTo: this.route,
                                        },
                                    );
                                }
                            }
                        });
                }
            }
        }
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - member details with member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: MemberListDisplayItem, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroupId, purpose: "shop" },
        });
        confirmAddressDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    this.router.navigate(
                        [
                            this.portal +
                                "/direct/customers/" +
                                `${currentEnrollmentObj.mpGroup}/${details.id}` +
                                "/enrollment/quote-shop/" +
                                currentEnrollmentObj.mpGroup +
                                "/specific/" +
                                details.id,
                        ],
                        {
                            relativeTo: this.route,
                        },
                    );
                }
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();

        if (this.configurationSubscriber) {
            this.configurationSubscriber.unsubscribe();
        }
    }
}
