import { Component, OnInit, ViewChild, HostListener, OnDestroy, ChangeDetectorRef, AfterViewInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Select, Store } from "@ngxs/store";
import { ConfirmAddressDialogComponent, GenericSidenavComponent, EnrollmentMethodComponent } from "@empowered/ui";
import { MatDialog } from "@angular/material/dialog";
import { MediaMatcher } from "@angular/cdk/layout";
import {
    MonSideNavList,
    MemberService,
    AccountService,
    StaticService,
    EmpSidenavContent,
    AccountList,
    ShoppingService,
    MenuItem,
    EmploymentStatus,
    BenefitsOfferingService,
} from "@empowered/api";
import { MemberAddDialogData } from "../member-add/member-add-modal/member-add-modal.model";
import { TerminateEmployeeComponent } from "../member-add/terminate-employee/terminate-employee.component";
import { LanguageService } from "@empowered/language";
import { RehireEmployeeComponent } from "../member-add/rehire-employee/rehire-employee.component";
import { Observable, BehaviorSubject, Subject, Subscription, combineLatest, of } from "rxjs";
import { takeUntil, filter, tap, switchMap, map } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { MemberAddModalComponent } from "../member-add/member-add-modal/member-add-modal.component";
import { TerminationModalResponse } from "../member-add/model/member-work-model";
import { DatePipe } from "@angular/common";
import {
    SidenavIcon,
    Permission,
    SHOP_SUCCESS,
    AccountImportTypes,
    UserPermissionList,
    AppSettings,
    GroupedCartItems,
    DualPlanYearSettings,
    EnrollmentMethod,
    Portals,
    ContactType,
    CountryState,
    GetCartItems,
    AdminCredential,
    ProducerCredential,
    MemberProfile,
    Accounts,
    MemberQualifyingEvent,
    PlanYear,
} from "@empowered/constants";
import { MembersHelperService } from "../members-helper.service";

import {
    AddMemberInfo,
    MemberInfoState,
    AccountListState,
    AddAccountInfo,
    DualPlanYearState,
    QleOeShopModel,
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    EnrollmentMethodModel,
    EnrollmentMethodStateModel,
    SharedState,
    StaticUtilService,
    DualPlanYearService,
} from "@empowered/ngxs-store";
import { CartWarningPopupComponent } from "@empowered/ui";
import { TPIRestrictionsForHQAccountsService, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const SHOP = "shop";
const SUCCESS = "SUCCESS";
const EMPTY_STRING = "";
const SHOP_PAGE = "enrollment/quote-shop";
const CONFIG_EMAIL_TRACKING_ENABLED = "broker.group_portal.audit_history_tab.email_sms";
const CURRENT = "current";
const FUTURE = "future";
const PROSPECT = "prospect";
const PROFILE = "profile";
const AG = "primary.portal.accounts.accountList.ag";

@Component({
    selector: "empowered-member-dashboard",
    templateUrl: "./member-dashboard.component.html",
    styleUrls: ["./member-dashboard.component.scss"],
})
export class MemberDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    memberid: any;
    mpGroupId: number;
    portal: string;
    benefitsOffered = true;
    private unsubscribe$ = new Subject<void>();
    @ViewChild("genSideNav", { static: true }) genSideNav: GenericSidenavComponent;
    private readonly _mobileQueryListener: () => void;
    dashBoardSideNavLogo;
    dashBoardSideNavColor;
    mobileQuery: MediaQueryList;
    navOptions: MonSideNavList[];
    rehireDialogData: MemberAddDialogData;
    terminateDialogData: MemberAddDialogData;
    isSpinnerLoading: boolean;
    employeeData: any;
    editProfileModel: any;
    previousList: string;
    accountName: string;
    actionTaken: string;
    languageStrings: Record<string, string>;
    ADD = "add";
    EDIT = "edit";
    removeDialogData: MemberAddDialogData;
    SUCCESS = "success";
    activeEmployee = true;
    rehireEmployee = true;
    terminationDate: any;
    openDialog = true;
    accountDetails: Accounts;
    configurableCIFNo;
    isTestEmployee: boolean;
    private screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    credential: any;
    subscriptions: Subscription[] = [];
    configurationSubscriber: Subscription;
    isQLEEnrollment: boolean;
    isOEEnrollment: boolean;
    isDualPlanYear: boolean;
    isQleDuringOeEnrollment: boolean;
    isQleAfterOeEnrollment: boolean;
    planYearsData: PlanYear[] = [];
    qleYear: string;
    oeYear: string;

    unpluggedFeatureFlag: boolean;
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    data: any;
    enrollmentState: EnrollmentMethodStateModel;
    state: any;
    isUnplugged: boolean;
    currentAccount: AccountList;
    storedState: CountryState[] = [];
    private user: ProducerCredential & AdminCredential;
    isToHideButtons = false;
    isRemoveDisabled = false;
    HYBRID_CALL_CENTER_ID = 11;
    isAflacReadOnly: boolean;
    sendSecureMessage: boolean;
    printProfile: boolean;
    isBenefitDollarsEnabled = false;
    canAccessTPIModule$: Observable<boolean>;
    isProducer: boolean;
    employeeStatus: string;
    enrollmentType: string;
    qleEventData: MemberQualifyingEvent[];
    accountNumberDisplay: string;
    permissionEnum = Permission;
    @Select(MemberInfoState.getMemberInfo) member$: Observable<MemberProfile>;

    constructor(
        private readonly media: MediaMatcher,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly store: Store,
        private readonly modal: MatDialog,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly staticService: StaticService,
        private readonly userService: UserService,
        private readonly sharedService: SharedService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly datePipe: DatePipe,
        private readonly shoppingService: ShoppingService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly tpiRestrictionsService: TPIRestrictionsForHQAccountsService,
        private readonly membersHelperService: MembersHelperService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dateService: DateService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.dashBoardSideNavLogo = "assets/images/logo.png";
        this.dashBoardSideNavColor = "#00abb9";
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
    }

    // Runs check detection after initializing view
    ngAfterViewInit(): void {
        this.changeDetectorRef.detectChanges();
    }

    /**
     * @description Angular Life cycle hook
     * If producer portal, then we will check for permission and based on that we hide/show manage employee button.
     * @memberof MemberDashboardComponent
     */
    ngOnInit(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.send_secure_message"),
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.print_profile"),
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.benefitDollars"),
            this.membersHelperService.getEmployeeStatus(),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([sendSecureMessage, printProfile, isBenefitDollarsEnabled, status]) => {
                this.sendSecureMessage = sendSecureMessage;
                this.printProfile = printProfile;
                this.isBenefitDollarsEnabled = isBenefitDollarsEnabled;
                this.employeeStatus = status;
            });
        this.unpluggedFeatureFlag = false;
        this.getLanguageStrings();
        this.previousList = this.languageStrings["primary.portal.dashboard.employees"];
        this.sharedService.userPortal$.pipe(takeUntil(this.unsubscribe$)).subscribe((portal) => {
            this.portal = portal.type;
        });
        const params = this.route.snapshot.params;
        this.memberid = params["memberId"];
        this.mpGroupId = this.router.url.includes(PROSPECT) ? params["prospectId"] : params["mpGroupId"];
        this.userService.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((credential: ProducerCredential & AdminCredential) => {
                    this.user = credential;
                    return this.user.adminId ? this.storeEmployeeInfo() : of(null);
                }),
            )
            .subscribe();
        this.currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        if (this.currentAccount && this.currentAccount.status && this.currentAccount.status.length && this.currentAccount.locked) {
            this.isUnplugged = true;
        }
        const mpGroupObj: any = this.store.selectSnapshot(AccountListState.getGroup);
        if (mpGroupObj) {
            if (mpGroupObj.state) {
                this.state = mpGroupObj.state;
            } else if (mpGroupObj.situs && mpGroupObj.situs.state && mpGroupObj.situs.state.abbreviation !== "") {
                this.state = mpGroupObj.situs.state.abbreviation;
            }
        }
        this.subscriptions.push(
            this.staticService.getConfigurations("portal.member.terminate.ciferror.phoneno", this.mpGroupId).subscribe((data) => {
                this.configurableCIFNo = data[0].value;
            }),
        );
        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((width) => {
                if (this.mobileQuery.matches) {
                    this.genSideNav.dashboardSideNav.opened = false;
                } else {
                    this.genSideNav.dashboardSideNav.opened = true;
                }
            });
        this.getUpdatedHireDate();
        this.checkForDualPlanYear();
        if (this.portal === Portals.PRODUCER.toLowerCase()) {
            this.isProducer = true;
            combineLatest([
                this.tpiRestrictionsService.canAccessTPIRestrictedModuleInHQAccount(),
                this.tpiRestrictionsService.canAccessTPIRestrictedModuleInHQAccount(
                    UserPermissionList.AFLAC_HQ_PRODUCER_PROFILE_EDIT_PERMISSION,
                ),
            ])
                .pipe(
                    filter(([isNotHQAccount]) => !isNotHQAccount),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(([, data]) => {
                    this.isAflacReadOnly = !data;
                });
        }
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroupId, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.benefitsOffered = !!resp.length;
            });
    }
    /**
     * Method to get the updated hire date of an employee.
     */
    checkForDualPlanYear(): void {
        this.dualPlanYearService
            .dualPlanYear(this.memberid, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (data) {
                    this.isQLEEnrollment = data.isQleEnrollmentWindow;
                    this.isOEEnrollment = data.isOpenEnrollmentWindow;
                    this.isDualPlanYear = data.isDualPlanYear;
                    this.isQleDuringOeEnrollment = data.isQleDuringOeEnrollment;
                    this.isQleAfterOeEnrollment = data.isQleAfterOeEnrollment;
                    this.planYearsData = data.planYearsData;
                    this.qleYear = data.qleYear;
                    this.oeYear = data.oeYear;
                    this.qleEventData = data.qleEventData;
                }
                this.checkForUnpluggedFeature();
            });
    }

    /**
     * Method to get the updated hire date of an employee.
     */
    getUpdatedHireDate(): void {
        this.subscriptions.push(
            this.memberService.getMemberHireDate.subscribe((updatedHireDate) => {
                if (updatedHireDate !== EMPTY_STRING) {
                    this.employeeData = {
                        ...this.employeeData,
                        hireDate: updatedHireDate,
                    };
                }
            }),
        );
    }
    /**
     * @description checking for unplugged feature
     * @returns nothing
     */
    checkForUnpluggedFeature(): void {
        this.configurationSubscriber = this.staticService.getConfigurations(AppSettings.UNPLUGGED_CONFIG).subscribe(
            (configs) => {
                this.unpluggedFeatureFlag = configs.length && configs[0].value.toLowerCase() === "true";
            },
            () => {},
            () => {
                this.credential = this.user;
                if ((this.credential && this.credential.adminId) || this.unpluggedFeatureFlag) {
                    this.addnavOptionsAdmin();
                } else {
                    this.addnavOptions();
                }
                this.checkPermissions();
            },
        );
        this.subscriptions.push(this.configurationSubscriber);
    }
    /**
     * check permissions
     * @returns Nothing
     */
    checkPermissions(): void {
        this.subscriptions.push(
            this.store.select(SharedState.hasPermission("core.shopping.read")).subscribe((res) => {
                if (!res) {
                    this.addnavOptionsAdmin();
                }
            }),
        );
        this.subscriptions.push(
            this.store.select(SharedState.hasPermission("core.policyChangeRequest.read")).subscribe((response) => {
                if (!response) {
                    this.navOptions.forEach((element) => {
                        const index = element.subMenuItem.findIndex((ele) => ele.iconName === "pcr");
                        if (index > -1) {
                            element.subMenuItem.splice(index, 1);
                        }
                    });
                }
            }),
        );
        this.subscriptions.push(
            this.store
                .select(SharedState.hasPermission(Permission.SHOP_READ))
                .pipe(filter((response) => !response))
                .subscribe(() => {
                    this.navOptions = this.navOptions.filter((element) => element.menuIntem.name.toLowerCase() !== SHOP);
                }),
        );
        if (this.router.url.includes(PROSPECT)) {
            this.navOptions = this.navOptions.filter((element) => element.menuIntem.name.toLowerCase() === PROFILE);
        }
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
     * Language string for side Nav bar menu
     * @returns Nothing
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.member.terminate.heading",
            "primary.portal.member.viewAsEmployee.heading",
            "primary.portal.member.sendSecureMessage.heading",
            "primary.portal.member.printProfile.heading",
            "primary.portal.common.cancel",
            "primary.portal.member.rehire.column",
            "primary.portal.member.editterminate.column",
            "primary.portal.member.rehire.content",
            "primary.portal.common.rehire",
            "primary.portal.common.openNavigation",
            "primary.portal.common.sendSecureMessage",
            "primary.portal.member.terminate.gridtermination",
            "primary.portal.member.testText",
            "primary.portal.common.manageEmployee",
            "primary.portal.common.printProfile",
            "primary.portal.common.viewAsEmployee",
            "primary.portal.dashboard.employees",
            "primary.portal.memberDashboard.profile",
            "primary.portal.common.remove",
            "primary.portal.common.terminate",
            "primary.portal.common.resetPassword",
            "primary.portal.memberDashboard.primary",
            "primary.portal.memberDashboard.dependents",
            "primary.portal.memberDashboard.coverage",
            "primary.portal.memberDashboard.summary",
            "primary.portal.memberDashboard.beneficiaries",
            "primary.portal.memberDashboard.benefitDollars",
            "primary.portal.memberDashboard.pendingEnrollments",
            "primary.portal.memberDashboard.changes",
            "primary.portal.memberDashboard.lifeEvents",
            "primary.portal.memberDashboard.policyChangeRequests",
            "primary.portal.memberDashboard.shop",
            "primary.portal.memberDashboard.documentsAndNotes",
            "primary.portal.memberDashboard.auditHistory",
            "primary.portal.memberDashboard.activities",
            "primary.portal.memberDashboard.profileChanges",
            "primary.portal.memberDashboard.enrollments",
            "primary.portal.member.remove.header",
            "primary.portal.member.remove.content",
            "primary.portal.member.remove.title",
            "primary.portal.common.printProfile",
            "primary.portal.common.sendSecureMessage",
            "primary.portal.common.viewAsEmployee",
            "primary.portal.common.resetPassword",
            "primary.portal.common.terminate",
            "primary.portal.member.editterminate.column",
            "primary.portal.common.rehire",
            "primary.portal.shop.dualPlanYear.lifeEventEnrollment",
            "primary.portal.shop.dualPlanYear.openEnrollments",
            "primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollment",
            "primary.portal.shop.dualPlanYear.lifeEventFutureEnrollment",
            "primary.portal.sideNavBar.emailAndTexts",
            "primary.portal.sideNavBar.openEnrollment",
            "primary.portal.sideNavBar.lifeEventEnrollment",
            "primary.portal.sideNavBar.shop",
            "primary.portal.sideNavBar.enrollments",
            "primary.portal.sideNavBar.profileChanges",
            "primary.portal.sideNavBar.activities",
            "primary.portal.sideNavBar.documentsAndNotes",
            "primary.portal.sideNavBar.policyChangeRequests",
            "primary.portal.sideNavBar.pendingEnrollments",
            "primary.portal.sideNavBar.lifeEvents",
            "primary.portal.sideNavBar.benefitDollars",
            "primary.portal.sideNavBar.summary",
            "primary.portal.sideNavBar.completedForms",
            "primary.portal.sideNavBar.beneficiaries",
            "primary.portal.sideNavBar.dependents",
            "primary.portal.sideNavBar.primary",
            "primary.portal.sideNavBar.employees",
            "primary.portal.emailTracking.heading",
            AG,
        ]);
    }

    /**
     * @description Method to get the complete employee info
     * @returns {Observable<Accounts>}
     */
    storeEmployeeInfo(): Observable<Accounts> {
        this.isSpinnerLoading = true;
        return this.memberService.getMember(this.memberid, true, this.mpGroupId.toString()).pipe(
            takeUntil(this.unsubscribe$),
            tap(
                (result) => {
                    if (result) {
                        if (Object.keys(result.body.workInformation.termination).length !== 0) {
                            this.terminationDate = result.body.workInformation.termination.terminationDate;
                            const terminationDate = this.dateService.toDate(
                                this.datePipe.transform(this.terminationDate, AppSettings.DATE_FORMAT),
                            );
                            const today = new Date();
                            terminationDate.setHours(0, 0, 0);
                            today.setHours(0, 0, 0);
                            this.activeEmployee = terminationDate > today;
                            const rehireDate = new Date(
                                this.datePipe.transform(result.body.workInformation.hireDate, AppSettings.DATE_FORMAT),
                            );
                            rehireDate.setHours(0, 0, 0);
                            this.rehireEmployee = rehireDate > today;

                            if (rehireDate >= terminationDate && this.employeeStatus !== EmploymentStatus.TERMINATED) {
                                this.activeEmployee = rehireDate <= today;
                            }
                        }
                        this.employeeData = {
                            firstName: result.body.name.firstName,
                            lastName: result.body.name.lastName,
                            hireDate: result.body.workInformation.hireDate,
                        };
                        this.editProfileModel = result.body;
                    }
                },
                () => {
                    this.isSpinnerLoading = false;
                },
            ),
            switchMap(() => this.accountService.getAccount(this.mpGroupId.toString()).pipe(takeUntil(this.unsubscribe$))),
            tap(
                (res) => {
                    if (res) {
                        this.accountDetails = res;
                        this.accountName = res.name;
                        this.displayAccountNumber();
                        this.store.dispatch(
                            new AddAccountInfo({
                                accountInfo: res,
                                mpGroupId: this.mpGroupId.toString(),
                            }),
                        );
                        if (res.locked && res.thirdPartyPlatformsEnabled) {
                            this.addnavOptionsAdmin();
                        }

                        if (!this.activeEmployee && this.isProducer) {
                            this.navOptions = this.navOptions.filter((item) => item.menuIntem.path !== SHOP_PAGE);
                        }
                    }
                },
                () => {
                    this.isSpinnerLoading = false;
                },
                () => {
                    this.loadMemberData(this.memberid);
                },
            ),
        );
    }

    /**
     * to display account number next to account name in header
     */
    displayAccountNumber(): void {
        if (this.accountDetails) {
            if (this.accountDetails.importType === AccountImportTypes.AFLAC_GROUP && this.accountDetails.aflacGroupNumber) {
                this.accountNumberDisplay = ` (${this.languageStrings[AG]}${this.accountDetails.aflacGroupNumber})`;
            } else if (
                this.accountDetails.importType === AccountImportTypes.SHARED_CASE &&
                this.accountDetails.aflacGroupNumber &&
                this.accountDetails.accountNumber
            ) {
                // eslint-disable-next-line max-len
                this.accountNumberDisplay = ` (${this.accountDetails.accountNumber} / ${this.languageStrings[AG]}${this.accountDetails.aflacGroupNumber})`;
            } else if (this.accountDetails.accountNumber) {
                this.accountNumberDisplay = ` (${this.accountDetails.accountNumber})`;
            }
        }
    }

    loadMemberData(memberId: number): void {
        this.memberService
            .getMemberContact(memberId, ContactType.HOME, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (result) => {
                    if (result) {
                        this.data = result.body;
                        this.data.address["address2"] = this.data.address.address2 ? this.data.address.address2 : null;
                        this.data.address["city"] = this.data.address.city ? this.data.address.city : null;
                        this.data.address["countyId"] = this.data.address.countyId ? this.data.address.countyId.toString() : null;
                        this.data.address["country"] = this.data.address.country ? this.data.address.country : null;
                        const editAddressModel = this.data.address;
                        const editObject = { ...this.editProfileModel, ...{ address: editAddressModel } };
                        const workInfo = { ...editObject.workInformation };
                        workInfo["payrollFrequencyId"] = editObject.workInformation.payrollFrequencyId
                            ? editObject.workInformation.payrollFrequencyId.toString()
                            : undefined;
                        workInfo["organizationId"] = editObject.workInformation.organizationId
                            ? editObject.workInformation.organizationId.toString()
                            : undefined;
                        editObject.workInformation = { ...workInfo };
                        if (editObject.workInformation.termination && Object.entries(editObject.workInformation.termination).length !== 0) {
                            const termination = { ...editObject.workInformation.termination };
                            termination["terminationCodeId"] = editObject.workInformation.termination.terminationCodeId
                                ? editObject.workInformation.termination.terminationCodeId.toString()
                                : undefined;
                            editObject.workInformation.termination = { ...termination };
                        }
                        if (editObject.profile.correspondenceLocation === undefined) {
                            editObject.profile["correspondenceLocation"] = ContactType.HOME;
                        }
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: editObject,
                                activeMemberId: memberId,
                                mpGroupId: this.mpGroupId,
                            }),
                        );
                    }
                    this.isSpinnerLoading = false;
                },
                () => {
                    this.store.dispatch(
                        new AddMemberInfo({
                            memberInfo: this.editProfileModel,
                            activeMemberId: memberId,
                            mpGroupId: this.mpGroupId,
                        }),
                    );
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * @description Method to set menu items for Employee dashboard for a producer.
     **/
    addnavOptions(): void {
        this.store
            .select(DualPlanYearState)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((dualPlanYearData) => {
                    this.navOptions = [
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.profile"],
                                iconName: SidenavIcon.PROFILE_EMPLOYEE,
                            },
                            subMenuItem: this.addMemberSubMenu(),
                        },
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.coverage"],
                                iconName: SidenavIcon.COVERAGE,
                            },
                            subMenuItem: this.addCoverageSubMenu(),
                        },
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.shop"],
                                iconName: SidenavIcon.SHOP,
                                path: "enrollment/quote-shop",
                            },
                            subMenuItem: this.addShopSubMenu(dualPlanYearData),
                        },
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.changes"],
                                iconName: SidenavIcon.CHANGES,
                                hasPermission$: this.store
                                    .select(SharedState.hasPermission(Permission.MEMBER_RESTRICT_NAVIGATION_CHANGES))
                                    .pipe(map((response) => !response)),
                            },
                            subMenuItem: this.addChangesSubMenu(),
                        },
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.documentsAndNotes"],
                                iconName: SidenavIcon.DOCUMENTS,
                                path: "documents",
                                hasPermission$: this.store
                                    .select(SharedState.hasPermission(Permission.MEMBER_RESTRICT_NAVIGATION_DOCUMENT_NOTES))
                                    .pipe(map((response) => !response)),
                            },
                            subMenuItem: [],
                        },
                        {
                            menuIntem: {
                                name: this.languageStrings["primary.portal.memberDashboard.auditHistory"],
                                iconName: SidenavIcon.AUDIT_HISTORY,
                                hasPermission$: this.store
                                    .select(SharedState.hasPermission(Permission.MEMBER_RESTRICT_NAVIGATION_AUDIT_HISTORY))
                                    .pipe(map((response) => !response)),
                            },
                            subMenuItem: this.auditHistorySubMenu(),
                        },
                    ];
                }),
                switchMap(() => this.storeEmployeeInfo()),
            )
            .subscribe();
    }

    /**
     * Method to return sub menu items for shop for dual plan year scenario
     * @param dualPlanYearData dual plan year related info.
     * @returns sub menu items for shop.
     */
    addShopSubMenu(dualPlanYearData: QleOeShopModel): MenuItem[] {
        this.mapDualPlanYearData(dualPlanYearData);
        if (dualPlanYearData.isDualPlanYear && dualPlanYearData.isQleDuringOeEnrollment) {
            return [
                {
                    name: this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventEnrollment"].replace(
                        "##planYearQLE##",
                        dualPlanYearData.qleYear,
                    ),
                    iconName: "shop-page-QLE",
                    path: "",
                    routerLinkActive: false,
                },
                {
                    name: this.languageStrings["primary.portal.shop.dualPlanYear.openEnrollments"].replace(
                        "##planYearOE##",
                        dualPlanYearData.oeYear,
                    ),
                    iconName: "shop-page-OE",
                    path: "",
                    routerLinkActive: false,
                },
            ];
        }
        if (dualPlanYearData.isDualPlanYear && dualPlanYearData.isQleAfterOeEnrollment) {
            if (this.qleYear === this.oeYear) {
                return [
                    {
                        name: this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollment"].replace(
                            "##planYearQLE##",
                            dualPlanYearData.qleYear,
                        ),
                        iconName: "shop-page-QLE",
                        path: "",
                        routerLinkActive: false,
                    },
                    {
                        name: this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventFutureEnrollment"].replace(
                            "##planYearQLE##",
                            dualPlanYearData.oeYear,
                        ),
                        iconName: "shop-page-OE",
                        path: "",
                        routerLinkActive: false,
                    },
                ];
            }
            return [
                {
                    name: this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollment"].replace(
                        "##planYearQLE##",
                        dualPlanYearData.qleYear,
                    ),
                    iconName: "shop-page-QLE",
                    path: "",
                    routerLinkActive: false,
                },
                {
                    name: this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventFutureEnrollment"].replace(
                        "##planYearQLE##",
                        dualPlanYearData.oeYear,
                    ),
                    iconName: "shop-page-OE",
                    path: "",
                    routerLinkActive: false,
                },
            ];
        }
        return [];
    }

    /**
     * Mapping dualPlan year to class variables
     * @param dualPlanYearData dual plan year related data
     */
    mapDualPlanYearData(dualPlanYearData: QleOeShopModel): void {
        this.isQLEEnrollment = dualPlanYearData.isQleEnrollmentWindow;
        this.isOEEnrollment = dualPlanYearData.isOpenEnrollmentWindow;
        this.isDualPlanYear = dualPlanYearData.isDualPlanYear;
        this.isQleDuringOeEnrollment = dualPlanYearData.isQleDuringOeEnrollment;
        this.isQleAfterOeEnrollment = dualPlanYearData.isQleAfterOeEnrollment;
        this.planYearsData = dualPlanYearData.planYearsData;
        this.qleYear = dualPlanYearData.qleYear;
        this.oeYear = dualPlanYearData.oeYear;
    }

    /**
     * Method to return sub menu items for Changes
     **/
    addChangesSubMenu(): MenuItem[] {
        return [
            {
                name: this.languageStrings["primary.portal.memberDashboard.lifeEvents"],
                iconName: "life-events",
                path: "life-events",
            },
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
        ];
    }
    /**
     * Method to return sub menu items for Member add
     * @returns a list of menu items under member sub menu
     **/
    addMemberSubMenu(): MenuItem[] {
        return [
            {
                name: this.languageStrings["primary.portal.memberDashboard.primary"],
                iconName: "profile-changes",
                path: "memberadd",
            },
            {
                name: this.languageStrings["primary.portal.memberDashboard.dependents"],
                iconName: "dependent",
                path: "dependents",
            },
        ];
    }
    /**
     * Method to return sub menu items for Coverage
     * @returns a list of menu items under coverage sub menu
     **/
    addCoverageSubMenu(): MenuItem[] {
        const coverageMenuItems = [
            {
                name: this.languageStrings["primary.portal.memberDashboard.summary"],
                iconName: "coverage-summary",
                path: "coverage-summary",
            },
            {
                name: this.languageStrings["primary.portal.memberDashboard.beneficiaries"],
                iconName: "beneficiary",
                path: "beneficiaries",
            },
            {
                name: this.languageStrings["primary.portal.memberDashboard.benefitDollars"],
                iconName: "benefit-dollars",
                path: "benefit-dollars",
            },
        ];

        // remove benefit dollars tab if the feature is not enabled
        if (!this.isBenefitDollarsEnabled) {
            coverageMenuItems.pop();
        }

        return coverageMenuItems;
    }
    /**
     * Method to return sub menu items for Changes
     * @returns MenuItem[] for sub menu list
     **/
    auditHistorySubMenu(): MenuItem[] {
        return [
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
            {
                name: this.languageStrings["primary.portal.emailTracking.heading"],
                iconName: "emails-and-texts",
                path: "emails-and-texts",
                isConfigEnabled$: this.staticUtilService.cacheConfigEnabled(CONFIG_EMAIL_TRACKING_ENABLED),
            },
        ];
    }
    /**
     * Navigation link in side navbar for Admin portal
     * @returns Nothing
     */
    addnavOptionsAdmin(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.memberDashboard.profile"],
                    iconName: SidenavIcon.PROFILE_EMPLOYEE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.primary"],
                        iconName: "profile-changes",
                        path: "memberadd",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.dependents"],
                        iconName: "dependent",
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
                        iconName: "beneficiary",
                        path: "beneficiaries",
                    },
                    {
                        name: this.languageStrings["primary.portal.memberDashboard.benefitDollars"],
                        iconName: "benefit-dollars",
                        path: "benefit-dollars",
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
                        name: this.languageStrings["primary.portal.memberDashboard.lifeEvents"],
                        iconName: "life-events",
                        path: "life-events",
                    },
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
                    path: "documents",
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
                    {
                        name: this.languageStrings["primary.portal.emailTracking.heading"],
                        iconName: "emails-and-texts",
                        path: "emails-and-texts",
                        isConfigEnabled$: this.staticUtilService.cacheConfigEnabled(CONFIG_EMAIL_TRACKING_ENABLED),
                    },
                ],
            },
        ];

        // remove benefit dollars tab if the feature is not enabled
        if (!this.isBenefitDollarsEnabled) {
            const EMPLOYEE_MENU_ITEM = 1;
            this.navOptions[EMPLOYEE_MENU_ITEM].subMenuItem.pop();
        }
    }
    /**
     * Navigate to selected route option
     * @param selectedOption {string}: selected navigation option
     * @returns Nothing
     */
    // eslint-disable-next-line complexity
    navitageToSelectedOption(selectedOption: string): void {
        if (this.isDualPlanYear) {
            selectedOption = this.checkForDualPlanYearSelection(selectedOption);
        }
        switch (selectedOption) {
            case this.languageStrings[EmpSidenavContent.EMPLOYEES]: {
                const url = this.getEmployeeListUrl();
                this.router.navigate([url], {
                    relativeTo: this.route,
                });
                break;
            }
            case this.languageStrings[EmpSidenavContent.PRIMARY]: {
                let memberUrl;
                let subUrl = "payroll";
                if (this.user && this.user.producerId) {
                    if (this.router.url.indexOf("prospect") !== -1) {
                        subUrl = "payroll/prospect";
                    }
                    memberUrl = `/${this.portal}/${subUrl}/${this.mpGroupId}/member/${this.memberid}/memberadd`;
                } else if (this.user && this.user.adminId) {
                    memberUrl = `/${this.portal}/accountList/${this.mpGroupId}/member/${this.memberid}/memberadd`;
                }
                this.router.navigate([memberUrl], {
                    relativeTo: this.route,
                });
                break;
            }
            case this.languageStrings[EmpSidenavContent.DEPENDENTS]:
                this.router.navigate(["dependents"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.BENEFICIARIES]:
                this.router.navigate(["beneficiaries"], { relativeTo: this.route });
                break;
            case this.languageStrings[EmpSidenavContent.COMPLETED_FORMS]:
                this.router.navigate(["forms"], { relativeTo: this.route });
                break;
            case this.languageStrings[EmpSidenavContent.SUMMARY]:
                this.router.navigate(["enrollment/benefit-summary/coverage-summary"], { relativeTo: this.route });
                break;
            case this.languageStrings[EmpSidenavContent.BENEFIT_DOLLARS]:
                this.router.navigate(["benefit-dollars"], { relativeTo: this.route });
                break;
            case this.languageStrings[EmpSidenavContent.LIFE_EVENTS]:
                this.router.navigate(["qle/life-events"], { relativeTo: this.route });
                break;
            case this.languageStrings[EmpSidenavContent.PENDING_ENROLLMENTS]:
                this.router.navigate(["pending-applications/view-enrollments/manage"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.POLICY_CHANGE_REQUESTS]:
                this.router.navigate(["change-requests", { mpGroupId: this.mpGroupId, memberId: this.memberid }], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.DOCUMENTS_AND_NOTES]:
                this.router.navigate(["documents"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.ACTIVITIES]:
                this.router.navigate(["activities"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.PROFILE_CHANGES]:
                this.router.navigate(["profile"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.ENROLLMENTS]:
                this.router.navigate(["enrollments"], {
                    relativeTo: this.route,
                });
                break;
            case this.languageStrings[EmpSidenavContent.SHOP]:
                this.navigateToShopPage();
                break;
            case this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT]:
                this.checkForDualPlanCartItems(this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT]);
                break;
            case this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT]:
                this.checkForDualPlanCartItems(this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT]);
                break;
            case this.languageStrings[EmpSidenavContent.EMAIL]:
                this.router.navigate(["emails-and-texts"], {
                    relativeTo: this.route,
                });
                break;
        }
    }

    /**
     * Used in Dual Plan Year scenario to know which shop has been selected.
     * @param selectedOption string selected menu from employee dashboard;
     * @return string label for side nav menu
     */
    checkForDualPlanYearSelection(selectedOption: string): string {
        if (selectedOption.includes(DualPlanYearSettings.LIFE_EVENT_ENROLLMENT)) {
            if (selectedOption.includes(CURRENT)) {
                return this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT];
            }
            if (selectedOption.includes(FUTURE)) {
                return this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT];
            }
            if (selectedOption.includes(this.oeYear) && this.isQleAfterOeEnrollment) {
                return this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT];
            }
            return this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT];
        }
        if (selectedOption.includes(DualPlanYearSettings.OPEN_YEAR_ENROLLMENT)) {
            return this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT];
        }
        return selectedOption;
    }
    /**
     * This method checks if cart contains items for OE when QLE is selected and vice-versa.
     * @param enrollmentType Type of enrollment (QLE or OE);
     */
    checkForDualPlanCartItems(enrollmentType: string): void {
        this.isSpinnerLoading = true;
        this.subscriptions.push(
            this.shoppingService
                .getCartItems(this.memberid, this.mpGroupId, "planOfferingId")
                .pipe(map((cartItems) => this.checkForCartItems(cartItems)))
                .subscribe(
                    (cartContains) => {
                        this.isSpinnerLoading = false;
                        if (
                            (enrollmentType === this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT] &&
                                cartContains === DualPlanYearSettings.OE_SHOP) ||
                            (enrollmentType === this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT] &&
                                cartContains === DualPlanYearSettings.QLE_SHOP)
                        ) {
                            const dialogRef = this.empoweredModalService.openDialog(CartWarningPopupComponent, {
                                data: {
                                    memberName: this.employeeData.firstName,
                                    memberId: this.memberid,
                                    groupId: this.mpGroupId,
                                    selectedShop:
                                        enrollmentType === this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT]
                                            ? DualPlanYearSettings.QLE_SHOP
                                            : enrollmentType === this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT]
                                            ? DualPlanYearSettings.OE_SHOP
                                            : null,
                                    qleYear: this.qleYear,
                                    oeYear: this.oeYear,
                                    isQleAfterOE: this.isQleAfterOeEnrollment,
                                    isQleDuringOE: this.isQleDuringOeEnrollment,
                                    qleEventData: this.qleEventData,
                                },
                            });

                            this.subscriptions.push(
                                dialogRef.afterClosed().subscribe((afterClosedResponse) => {
                                    if (afterClosedResponse === SUCCESS) {
                                        this.navigateToShopPage();
                                        this.enrollmentType = enrollmentType;
                                    }
                                }),
                            );
                        } else {
                            this.enrollmentType = enrollmentType;
                            this.navigateToShopPage();
                        }
                    },
                    () => (this.isSpinnerLoading = false),
                ),
        );
    }

    /**
     * Check for cart items based on plan type to navigate to shop page.
     * @param cartItems cart data
     * @returns current shop page type
     */
    checkForCartItems(cartItems: GetCartItems[]): string | DualPlanYearSettings {
        const latestPlanYear = this.planYearsData.length - 1;
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        if (!cartItems.length) {
            return EMPTY_STRING;
        }
        const groupedCartItems: GroupedCartItems = this.dualPlanYearService.groupCartItems(cartItems);
        if (groupedCartItems.preTaxPlans.length) {
            return groupedCartItems.preTaxPlans[0].planOffering.planYearId === this.planYearsData[latestPlanYear].id
                ? DualPlanYearSettings.OE_SHOP
                : DualPlanYearSettings.QLE_SHOP;
        }
        if (groupedCartItems.postTaxPlans.length) {
            return dualPlanYearData?.selectedShop === DualPlanYearSettings.OE_SHOP
                ? DualPlanYearSettings.OE_SHOP
                : DualPlanYearSettings.QLE_SHOP;
        }
        return EMPTY_STRING;
    }
    /**
     * This method sets the store value based on the shop selected by the user.
     * @param enrollmentType Type of enrollment (QLE or OE);
     */
    setShopSourceForDualPlanYear(enrollmentType: string): void {
        if (enrollmentType === this.languageStrings[EmpSidenavContent.LIFE_EVENT_ENROLLMENT]) {
            this.dualPlanYearService.setSelectedShop(DualPlanYearSettings.QLE_SHOP);
        } else if (enrollmentType === this.languageStrings[EmpSidenavContent.OPEN_ENROLLMENT]) {
            this.dualPlanYearService.setSelectedShop(DualPlanYearSettings.OE_SHOP);
        }
    }

    /**
     * Method to navigate to shop page
     */
    navigateToShopPage(): void {
        this.isSpinnerLoading = true;
        if (this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo)) {
            this.data = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        }
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        if (this.data.id) {
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(this.data.id));
            this.store.dispatch(new SetMemberInfo(this.data));
            if (this.benefitsOffered) {
                if (
                    !(
                        this.specificEnrollmentObj &&
                        (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                        this.specificEnrollmentObj.mpGroup &&
                        this.specificEnrollmentObj.mpGroup === this.mpGroupId &&
                        this.visitedMpGroupStateObj.indexOf(this.mpGroupId.toString()) >= 0
                    ) ||
                    (this.specificEnrollmentObj && this.specificEnrollmentObj.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE)
                ) {
                    this.isSpinnerLoading = false;
                    this.dialog.open(EnrollmentMethodComponent, {
                        backdropClass: "backdrop-blur",
                        maxWidth: "600px", // 600px max-width based on the definition in abstract.
                        panelClass: "shopping-experience",
                        data: {
                            mpGroup: this.mpGroupId,
                            detail: this.data,
                            route: this.route,
                            stateAbbr: this.state,
                            openingFrom: "dashboard",
                            method: this.specificEnrollmentObj ? this.specificEnrollmentObj.enrollmentMethod : undefined,
                        },
                    });

                    if (this.isDualPlanYear) {
                        this.setShopSourceForDualPlanYear(this.enrollmentType);
                    }
                } else {
                    const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                    this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                    if (
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                    ) {
                        this.memberService
                            .getMemberContact(this.data.id, ContactType.HOME, this.mpGroupId.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    this.isSpinnerLoading = false;
                                    if (result) {
                                        if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                            this.dialog.open(EnrollmentMethodComponent, {
                                                backdropClass: "backdrop-blur",
                                                maxWidth: "600px", // 600px max-width based on the definition in abstract.
                                                panelClass: "shopping-experience",
                                                data: {
                                                    mpGroup: this.mpGroupId,
                                                    detail: this.data,
                                                    route: this.route,
                                                    stateAbbr: this.state,
                                                    openingFrom: "dashboard",
                                                    method: currentEnrollmentObj ? currentEnrollmentObj.enrollmentMethod : undefined,
                                                },
                                            });
                                            if (this.isDualPlanYear) {
                                                this.setShopSourceForDualPlanYear(this.enrollmentType);
                                            }
                                        } else {
                                            this.openConfirmAddressDialogForShop(currentEnrollmentObj);
                                        }
                                    }
                                },
                                (error) => {
                                    this.isSpinnerLoading = false;
                                },
                            );
                    } else {
                        this.memberService
                            .getMemberContact(this.data.id, ContactType.HOME, this.mpGroupId.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(this.data.id));
                                    this.store.dispatch(new SetMemberInfo(this.data));
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
                                    if (result) {
                                        if (!this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr)) {
                                            this.sharedService.changeProducerNotLicensedInEmployeeState(true);
                                        } else {
                                            this.sharedService.changeProducerNotLicensedInEmployeeState(false);
                                        }
                                    }
                                    if (this.isDualPlanYear) {
                                        this.setShopSourceForDualPlanYear(this.enrollmentType);
                                    }
                                    this.isSpinnerLoading = false;
                                    // eslint-disable-next-line max-len
                                    const url = `/producer/payroll/${this.mpGroupId}/member/${this.memberid}/enrollment/quote-shop/${this.mpGroupId}/specific/${this.memberid}`;
                                    this.router
                                        .navigateByUrl(`/producer/payroll/${this.mpGroupId}/member/${this.memberid}`, {
                                            skipLocationChange: true,
                                        })
                                        .then(() => this.router.navigate([url]));
                                },
                                () => {
                                    this.isSpinnerLoading = false;
                                },
                            );
                    }
                }
            } else {
                // eslint-disable-next-line max-len
                const url = `/producer/payroll/${this.mpGroupId}/member/${this.data.id}/enrollment/quote-shop/${this.mpGroupId}/specific/${this.data.id}`;
                this.router
                    .navigateByUrl(`/producer/payroll/${this.mpGroupId}/member/${this.data.id}`, {
                        skipLocationChange: true,
                    })
                    .then(() => this.router.navigate([url]));
                this.isSpinnerLoading = false;
            }
        } else {
            this.isSpinnerLoading = false;
        }
    }

    /**
     * Method to open confirm address popup
     * @param currentEnrollmentObj Enrollment data
     * @returns void
     */
    openConfirmAddressDialogForShop(currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: this.data.id, mpGroup: this.mpGroupId, purpose: "shop" },
        });
        this.subscriptions.push(
            confirmAddressDialogRef.afterClosed().subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(this.data.id));
                    this.store.dispatch(new SetMemberInfo(this.data));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    if (this.isDualPlanYear) {
                        this.setShopSourceForDualPlanYear(this.enrollmentType);
                        // eslint-disable-next-line max-len
                        const url = `/producer/payroll/${this.mpGroupId}/member/${this.memberid}/enrollment/quote-shop/${this.mpGroupId}/specific/${this.memberid}`;
                        this.router
                            .navigateByUrl(`/producer/payroll/${this.mpGroupId}/member/${this.memberid}`, {
                                skipLocationChange: true,
                            })
                            .then(() => this.router.navigate([url]));
                    } else {
                        this.router.navigate(["enrollment/quote-shop/" + this.mpGroupId + "/specific/", +this.data.id], {
                            relativeTo: this.route,
                        });
                    }
                }
            }),
        );
    }

    /**
     * It opens the employee termination form modal
     * @param text is of type string and it is an action from manage employee dropdown
     */
    openModal(text: string): void {
        // Harcoding title for modals, as some changes might come in future.
        switch (text) {
            case "viewAsEmployee":
                this.actionTaken = this.languageStrings["primary.portal.member.viewAsEmployee.heading"];
                break;
            case "sendSecureMessage":
                this.actionTaken = this.languageStrings["primary.portal.member.sendSecureMessage.heading"];
                break;
            case "printProfile":
                this.actionTaken = this.languageStrings["primary.portal.member.printProfile.heading"];
                break;
            case "terminate": {
                this.actionTaken = this.languageStrings["primary.portal.member.terminate.heading"];
                this.terminateDialogData = {
                    title: `${this.actionTaken} ${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    content: {
                        memberId: this.memberid,
                        mpGroupId: this.mpGroupId,
                        action: this.ADD,
                        employeeData: this.employeeData,
                    },
                    primaryButton: {
                        buttonTitle: this.actionTaken,
                    },
                    secondaryButton: {
                        buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    },
                };
                const terminateRef = this.modal.open(TerminateEmployeeComponent, {
                    minWidth: "100%",
                    height: "100%",
                    panelClass: "census-manual-entry",
                    data: this.terminateDialogData,
                });
                this.subscriptions.push(
                    terminateRef.afterClosed().subscribe((result) => {
                        const url = this.getEmployeeListUrl();
                        if (result && result.terminationDate && result.partnerServiceResult) {
                            this.router.navigate([url], {
                                state: {
                                    terminationDate: result.terminationDate,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && !result.partnerServiceResult && result.futureDate) {
                            this.router.navigate([url], {
                                state: {
                                    cifError: this.configurableCIFNo,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                    terminationDate: result.terminationDate,
                                    futureDate: result.futureDate,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.partnerServiceResult === "") {
                            this.router.navigate([url], {
                                state: {
                                    cifError: this.configurableCIFNo,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                    terminationDate: result.terminationDate,
                                },
                                relativeTo: this.route,
                            });
                        }
                    }),
                );
                break;
            }
            case "editTerminate": {
                this.actionTaken = this.languageStrings["primary.portal.member.editterminate.column"];
                this.terminateDialogData = {
                    title: this.languageStrings["primary.portal.member.editterminate.column"].replace(
                        "##EmployeeName##",
                        `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    ),
                    content: {
                        memberId: this.memberid,
                        mpGroupId: this.mpGroupId,
                        action: this.EDIT,
                        employeeData: this.employeeData,
                    },
                    primaryButton: {
                        buttonTitle: this.actionTaken,
                    },
                    secondaryButton: {
                        buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    },
                };
                const editTerminateRef = this.modal.open(TerminateEmployeeComponent, {
                    minWidth: "100%",
                    height: "100%",
                    panelClass: "census-manual-entry",
                    data: this.terminateDialogData,
                });
                this.subscriptions.push(
                    editTerminateRef.afterClosed().subscribe((result) => {
                        const url = this.getEmployeeListUrl();
                        if (result && result.editMode) {
                            this.editTerminationMode(result, url);
                        } else if (result && result.currentReason && result.partnerServiceResult === SUCCESS) {
                            this.router.navigate([url], {
                                state: {
                                    editReason: result.currentReason,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.currentReason && result.partnerServiceResult === "") {
                            this.router.navigate([url], {
                                state: {
                                    editReasonFurtherAction: result.currentReason,
                                    CIEerrorFurtherAction: this.configurableCIFNo,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.futureDate && result.terminationDate) {
                            this.router.navigate([url], {
                                state: {
                                    editFutureTerminationDate: result.terminationDate,
                                    CIEerrorFurtherAction: this.configurableCIFNo,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.terminationDate && result.isCoverageDateChanged) {
                            this.router.navigate([url], {
                                state: {
                                    isCoverageDateChanged: true,
                                    terminateDate: result.terminationDate,
                                    cifError: this.configurableCIFNo,
                                    partnerServiceResult: result.partnerServiceResult,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.terminationDate) {
                            this.router.navigate([url], {
                                state: {
                                    editTerminationDate: result.terminationDate,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        } else if (result && result.partnerServiceResult === "") {
                            this.router.navigate([url], {
                                state: {
                                    cifError: this.configurableCIFNo,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        }
                    }),
                );
                break;
            }
            case "rehire": {
                this.actionTaken = this.languageStrings["primary.portal.member.rehire.column"];
                this.rehireDialogData = {
                    title: `Select rehire date for ${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    content: {
                        heading: this.languageStrings["primary.portal.member.rehire.content"].replace(
                            "##EmployeeName##",
                            `${this.employeeData.firstName}`,
                        ),
                        memberId: this.memberid,
                        mpGroupId: this.mpGroupId,
                        terminationDate: this.terminationDate,
                    },
                    primaryButton: {
                        buttonTitle: this.actionTaken,
                    },
                    secondaryButton: {
                        buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    },
                };
                const modalRef = this.modal.open(RehireEmployeeComponent, {
                    width: "700px",
                    data: this.rehireDialogData,
                });
                this.subscriptions.push(
                    modalRef.afterClosed().subscribe((result) => {
                        const url = this.getEmployeeListUrl();
                        if (result) {
                            this.router.navigate([url], {
                                state: {
                                    rehireDate: result.terminationDate,
                                    name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                                },
                                relativeTo: this.route,
                            });
                        }
                    }),
                );
                break;
            }
            case "remove": {
                this.actionTaken = this.languageStrings["primary.portal.member.remove.title"];
                this.removeDialogData = {
                    title: this.languageStrings["primary.portal.member.remove.header"].replace(
                        "##EmployeeName##",
                        ` ${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    ),
                    content: this.languageStrings["primary.portal.member.remove.content"].replace(
                        "##EmployeeName##",
                        `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    ),
                    primaryButton: {
                        buttonTitle: this.languageStrings["primary.portal.member.remove.title"],
                    },
                    secondaryButton: {
                        buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    },
                    memberId: this.memberid,
                    mpGroupId: this.mpGroupId,
                };
                const removeModalRef = this.modal.open(MemberAddModalComponent, {
                    width: "600px",
                    data: this.removeDialogData,
                });
                this.subscriptions.push(
                    removeModalRef.afterClosed().subscribe((result) => {
                        const url = this.getEmployeeListUrl();
                        if (result) {
                            this.router.navigate([url]);
                        }
                    }),
                );
                break;
            }
            default:
                this.actionTaken = "";
                break;
        }
    }

    /**
     * This method will navigate to given url based on the condition met to show messages on the member-list page.
     * @param result response after closing the modal.
     * @param url URL to be redirected to.
     */
    editTerminationMode(result: TerminationModalResponse, url: string): void {
        const employeeFullName = `${this.employeeData.firstName} ${this.employeeData.lastName}`;
        if (result.terminationDate && result.currentReason && result.partnerServiceResult === SUCCESS) {
            this.router.navigate([url], {
                state: {
                    editMode: result.editMode,
                    terminateDate: result.terminationDate,
                    partnerServiceResult: result.partnerServiceResult,
                    editReason: result.currentReason,
                    name: employeeFullName,
                },
                relativeTo: this.route,
            });
        } else if (result.terminationDate && result.currentReason && result.partnerServiceResult === "") {
            this.router.navigate([url], {
                state: {
                    editMode: result.editMode,
                    terminateDate: result.terminationDate,
                    partnerServiceResult: result.partnerServiceResult,
                    editReason: result.currentReason,
                    cifError: this.configurableCIFNo,
                    name: employeeFullName,
                },
                relativeTo: this.route,
            });
        } else if (result.futureDate && result.terminationDate) {
            if (result.partnerServiceResult === SUCCESS) {
                this.router.navigate([url], {
                    state: {
                        futureDate: result.futureDate,
                        editTerminationDate: result.terminationDate,
                        editMode: result.editMode,
                        name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                        partnerServiceResult: result.partnerServiceResult,
                    },
                    relativeTo: this.route,
                });
            } else {
                this.router.navigate([url], {
                    state: {
                        editMode: result.editMode,
                        futureDate: result.futureDate,
                        terminateDate: result.terminationDate,
                        cifError: this.configurableCIFNo,
                        name: `${this.employeeData.firstName} ${this.employeeData.lastName}`,
                    },
                    relativeTo: this.route,
                });
            }
        } else if (result.comments) {
            this.router.navigate([url], {
                state: {
                    editMode: result.editMode,
                    comments: result.comments,
                    name: employeeFullName,
                },
                relativeTo: this.route,
            });
        }
    }

    /**
     * Get the url to redirect based on route url
     */
    getEmployeeListUrl(): string {
        let url = "";
        const portal = this.portal.toLowerCase();
        this.credential = this.credential ? this.credential : JSON.parse(sessionStorage.getItem("user"));
        if (this.credential && this.credential.producerId) {
            if (this.router.url.indexOf("prospect") !== -1) {
                url = `/${portal}/payroll/prospect/${this.mpGroupId}/employees`;
            } else {
                url = `/${portal}/payroll/${this.mpGroupId}/dashboard/employees`;
            }
        } else if (this.credential && this.credential.adminId) {
            url = `/${portal}/accountList/${this.mpGroupId}/dashboard/employees`;
        }
        return url;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();

        this.subscriptions.forEach((element) => element.unsubscribe());
    }
}
