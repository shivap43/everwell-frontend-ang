import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberService, BenefitsOfferingService, ShoppingService, EnrollmentService, AccountService, CoreService } from "@empowered/api";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { UserService } from "@empowered/user";
import { Store } from "@ngxs/store";
import { forkJoin, Subscription, Observable, of, iif, defer, combineLatest, Subject } from "rxjs";
import { ShopQleCoveragePopupComponent } from "./shop-qle-coverage-popup/shop-qle-coverage-popup.component";
import { switchMap, tap, map, shareReplay, catchError, takeUntil } from "rxjs/operators";
import { HttpResponse } from "@angular/common/http";
import {
    DateFormats,
    ConfigName,
    ClientErrorResponseCode,
    PayFrequency,
    HeaderObject,
    DualPlanYearSettings,
    EnrollmentMethod,
    Characteristics,
    Product,
    GetCartItems,
    MemberBeneficiary,
    Enrollments,
    MemberProfile,
    MemberDependent,
    MemberContact,
    MemberQualifyingEvent,
    PlanYear,
} from "@empowered/constants";
import { CartWarningPopupComponent } from "@empowered/ui";
import { QleOeShopModel, SetHeaderObject, StaticUtilService, UtilService, DualPlanYearService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const CART_INDEX = 3;

@Component({
    selector: "empowered-member-home",
    templateUrl: "./member-home.component.html",
    styleUrls: ["./member-home.component.scss"],
})
export class MemberHomeComponent implements OnInit, OnDestroy {
    isLoading: boolean;
    accountList = [];
    DETAILS = "details";
    errorMessage: string;
    showErrorMessage: boolean;
    errorMessageArray = [];
    ERROR = "error";
    mpGroup: string;
    userData: any;
    userState = "";
    POSTTAX = "POSTTAX";
    INDIVIDUAL = "INDIVIDUAL";
    COVERAGEURL = "../coverage/enrollment/benefit-summary/coverage-summary";
    optionsURL = this.COVERAGEURL;
    SHOPURL = "../enrollment/shop";
    WIZARDURL = "../wizard/welcome";
    PROFILEURL = "../household/profile";
    RESOURCEURL = "../resources";
    SUPPORTURL = "../support";
    MESSAGEURL = "/member/messages";
    expandPlanOfferings = "plan.productId";
    STR_HOME = "HOME";
    STR_APRROVED = "APPROVED";
    headerObject: HeaderObject;
    isEnrollmentOpenFlag = false;
    pyName: string;
    daysLeft: number;
    enrollmentNotificationMessage: string;
    TIME_CONSTANT = 0;
    MILLISECONDS = 1000;
    SECONDS = 60;
    MINUTES = 60;
    INDEX_COUNT = 1;
    MAX_CHARACTER_COUNT = 60;
    HOURS = 24;
    STR_COMMA_SEPARATOR = ", ";
    qleYear: string;
    oeYear: string;
    dualPlanYear: QleOeShopModel;
    isDualPlanYear = false;
    isQleDuringOeEnrollment = false;
    isQleAfterOeEnrollment: boolean;
    cartContainsOf: string;
    MEMBER = "member";
    SUCCESS = "SUCCESS";
    cartItems: GetCartItems[] = [];
    PLAN_OFFERING_ID = "planOfferingId";
    memberCount = 1;
    isOldWidgetTemplate = false;
    isZeroStateCoverageWidget = false;
    isCoverageWidgetLoading = false;
    ongoingEnrollments: PlanYear[];
    upcomingEnrollment: PlanYear[];
    payFrequncy: PayFrequency;
    dateFormat = DateFormats.DATE_FORMAT_M_D_YY;
    enrollmentData: Enrollments[];
    productList: string;
    payrollDeductionAmount: number;
    upcomingEnrollmentString: string;
    memberContact: MemberContact;
    dependentCount: number;
    beneficiaryCount: number;
    qualifiedLifeEvents: MemberQualifyingEvent[];
    productListFull: boolean;
    isSelfEnrollment = false;
    payFrequencyId: number;
    isOldWidgetTemplate$: Observable<boolean> = this.staticUtil.cacheConfigEnabled(ConfigName.MMP_WIDGET_LAYOUT);
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.members.memberDashboard.welcomeText",
        "primary.portal.members.memberDashboard.enrollNotification",
        "primary.portal.platformName",
        "primary.portal.members.memberDashboard.welcomeDescription",
        "primary.portal.members.memberDashboard.seeMyOptionButton",
        "primary.portal.members.memberDashboard.goToInboxButton",
        "primary.portal.members.memberDashboard.seeResourcesButton",
        "primary.portal.members.memberDashboard.seeMyCoverageButton",
        "primary.portal.members.memberDashboard.getSupportButton",
        "primary.portal.members.memberDashboard.seeMyHouseholdButton",
        "primary.portal.members.memberDashboard.myCoverageWidget.header",
        "primary.portal.members.memberDashboard.messagesWidget.header",
        "primary.portal.members.memberDashboard.resourcesWidget.header",
        "primary.portal.members.memberDashboard.supportWidget.header",
        "primary.portal.members.memberDashboard.myHouseholdWidget.header",
        "primary.portal.members.memberDashboard.myHouseholdWidget.description",
        "primary.portal.members.memberDashboard.myCoverageWidget.description",
        "primary.portal.members.memberDashboard.messagesWidget.description",
        "primary.portal.members.memberDashboard.resourcesWidget.description",
        "primary.portal.members.memberDashboard.supportWidget.description",
        "primary.portal.members.memberDashboard.seeMyInfoButton",
        "primary.portal.members.memberDashboard.heroImg",
        "primary.portal.memberWizard.title.yearRound",
        "primary.portal.memberWizard.subtitle.yearRound",
        "primary.portal.memberWizard.title.openEnrollment",
        "primary.portal.memberWizard.title.specialEnrollment",
        "primary.portal.memberWizard.subtitle.comman",
        "primary.portal.memberHome.dualPlanYear.shopCoverage",
        "primary.portal.members.home.nextYearCoverage",
        "primary.portal.members.home.memberLifeEnrollment",
        "primary.portal.members.home.newYearCoverage",
        "primary.portal.memberHome.dualPlanYear.updateCoverage.current",
        "primary.portal.memberHome.dualPlanYear.updateCoverage.future",
        "primary.portal.members.memberDashboard.dontHaveCoverage",
        "primary.portal.members.memberDashboard.viewCoverageButton",
        "primary.portal.members.memberDashboard.myHouseholdWidget.members",
        "primary.portal.members.memberDashboard.myHouseholdWidget.dependents",
        "primary.portal.members.memberDashboard.myHouseholdWidget.allocatedBeneficiaries",
        "primary.portal.members.memberDashboard.myHouseholdWidget.reviewMyProfileButton",
        "primary.portal.members.memberDashboard.lifeEventEnrollment",
        "primary.portal.members.memberDashboard.openEnrollment",
        "primary.portal.members.memberDashboard.notificationsWidget.header",
        "primary.portal.members.memberDashboard.notificationsWidget.description",
        "primary.portal.members.memberDashboard.openNotificationsButton",
        "primary.portal.members.memberDashboard.policy",
        "primary.portal.members.memberDashboard.policies",
        "primary.portal.members.memberDashboard.more",
        "primary.portal.members.memberDashboard.myHouseholdWidget.memberLabel",
        "primary.portal.memberHome.coverageDate.widget",
    ]);
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly router: Router,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly langService: LanguageService,
        private readonly mService: MemberService,
        private readonly benefitOffService: BenefitsOfferingService,
        private readonly userService: UserService,
        private readonly shoppingService: ShoppingService,
        private readonly replacePipe: ReplaceTagPipe,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly utilService: UtilService,
        private readonly enrollmentService: EnrollmentService,
        private readonly accountService: AccountService,
        private readonly coreService: CoreService,
        private readonly sharedService: SharedService,
        private readonly staticUtil: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * @description initial component initializations and required function calls
     * @returns {void}
     */
    ngOnInit(): void {
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(
                tap((response) => {
                    this.isSelfEnrollment = response;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.headerObject = {
            title: "",
        };
        this.productList = "";
        this.upcomingEnrollmentString = "";
        this.payrollDeductionAmount = 0;
        this.upcomingEnrollment = [];
        this.ongoingEnrollments = [];
        this.productListFull = false;
        this.getUserData();
        this.getCoverageWidgetData();
    }
    /**
     * @description get all data required of member
     * @returns {void}
     */
    getUserData(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((data: any) => {
            this.isLoading = false;
            if (data) {
                this.userData = data;
                this.isLoading = true;
                this.mService
                    .getMemberContact(this.userData.memberId, this.STR_HOME, this.userData.groupId)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (address) => {
                            this.memberContact = address.body;
                            this.userState = address.body.address.state;
                            this.isLoading = false;
                            this.getOnloadData();
                        },
                        (error) => {
                            this.isLoading = false;
                        },
                    );
            }
            this.isLoading = false;
        });
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS]?.length > 0) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = error.message;
        }
        this.showErrorMessage = true;
    }

    seeOptions(): void {
        this.router.navigate([this.WIZARDURL], { relativeTo: this.route });
    }
    seeCoverage(): void {
        this.router.navigate([this.COVERAGEURL], { relativeTo: this.route });
    }
    seeInfo(): void {
        this.router.navigate([this.PROFILEURL], { relativeTo: this.route });
    }

    /**
     * This Function will open the notification panel.
     */
    openNotificationPanel(): void {
        this.utilService.invokeNotification();
    }
    seeResources(): void {
        this.router.navigate([this.RESOURCEURL], { relativeTo: this.route });
    }
    getSupport(): void {
        this.router.navigate([this.SUPPORTURL], {
            relativeTo: this.route,
        });
    }
    /**
     * @description setting up store data as per selected shop
     * @param shop selected shop
     */
    setStoreData(shop: string): void {
        if (
            shop === DualPlanYearSettings.OE_SHOP ||
            shop === DualPlanYearSettings.QLE_SHOP ||
            shop === DualPlanYearSettings.NEW_PY_QLE_SHOP
        ) {
            this.dualPlanYearService.setSelectedShop(shop);
        }
        this.seeOptions();
    }
    /**
     * @description to open warning pop up getting response after close
     * @param shopSelected selected shop
     */
    openWarningPopUp(shopSelected: string): void {
        const cartWarningDialogRef = this.empoweredModalService.openDialog(CartWarningPopupComponent, {
            data: {
                memberPortal: true,
                isQleAfterOE: this.isQleAfterOeEnrollment,
                selectedShop: shopSelected,
                memberId: this.userData.memberId,
                groupId: this.userData.groupId,
                memberName: this.userData.name.firstName,
                oeYear: this.dualPlanYear.oeYear,
                qleYear: this.dualPlanYear.qleYear,
                isQleDuringOE: this.isQleDuringOeEnrollment,
            },
        });
        cartWarningDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response === this.SUCCESS) {
                    this.setStoreData(shopSelected);
                }
            });
    }
    /**
     * to route to wizard or to open warning pop up as per condition after clicking on update qle coverage button
     */
    updateQleCoverage(): void {
        this.cartContainsOf = this.dualPlanYearService.checkCartItems(
            this.cartItems,
            this.userData.memberId,
            this.userData.groupId,
            DualPlanYearSettings.QLE_SHOP,
        );
        if (this.cartContainsOf === DualPlanYearSettings.NEW_PY_QLE_SHOP || this.cartContainsOf === DualPlanYearSettings.OE_SHOP) {
            this.openWarningPopUp(DualPlanYearSettings.QLE_SHOP);
        } else {
            this.setStoreData(DualPlanYearSettings.QLE_SHOP);
        }
    }
    /**
     * to route to wizard as per selection from confirmation pop up as per condition after clicking on shop for next year button
     */
    shopNextPlanYearCoverage(): void {
        const dialogRef = this.empoweredModalService.openDialog(ShopQleCoveragePopupComponent);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.cartContainsOf = this.dualPlanYearService.checkCartItems(
                    this.cartItems,
                    this.userData.memberId,
                    this.userData.groupId,
                    response,
                );
                if (this.isQleAfterOeEnrollment && this.cartContainsOf === DualPlanYearSettings.OE_SHOP) {
                    this.cartContainsOf = DualPlanYearSettings.NEW_PY_QLE_SHOP;
                }
                if (this.cartContainsOf && response && response !== this.cartContainsOf) {
                    this.openWarningPopUp(response);
                } else if (
                    response === DualPlanYearSettings.OE_SHOP ||
                    response === DualPlanYearSettings.QLE_SHOP ||
                    response === DualPlanYearSettings.NEW_PY_QLE_SHOP
                ) {
                    this.setStoreData(response);
                }
            });
    }
    /**
     * Function used for loading initial data required for component
     */
    getOnloadData(): void {
        this.isLoading = true;
        const enrollmentMethod = this.isSelfEnrollment ? EnrollmentMethod.FACE_TO_FACE : EnrollmentMethod.SELF_SERVICE;
        this.dualPlanYearService
            .dualPlanYear(this.userData.memberId, this.userData.groupId)
            .pipe(
                switchMap((response) => {
                    const referenceDate = this.dualPlanYearService.getReferenceDate();
                    this.dualPlanYear = response;
                    this.isDualPlanYear = this.dualPlanYear.isDualPlanYear;
                    this.isQleDuringOeEnrollment = this.dualPlanYear.isQleDuringOeEnrollment;
                    this.isQleAfterOeEnrollment = this.dualPlanYear.isQleAfterOeEnrollment;
                    if (this.isQleAfterOeEnrollment && this.cartContainsOf === DualPlanYearSettings.OE_SHOP) {
                        this.cartContainsOf = DualPlanYearSettings.NEW_PY_QLE_SHOP;
                    }
                    this.qleYear = this.dualPlanYear.qleYear;
                    this.oeYear = this.dualPlanYear.oeYear;
                    return forkJoin([
                        this.benefitOffService.getPlanYears(this.userData.groupId, false),
                        this.mService.getMemberQualifyingEvents(this.userData.memberId, this.userData.groupId),
                        this.shoppingService
                            .getPlanOfferings(
                                "",
                                enrollmentMethod,
                                this.userState,
                                {},
                                this.userData.memberId,
                                this.userData.groupId,
                                this.expandPlanOfferings,
                                referenceDate,
                            )
                            .pipe(
                                catchError((error) => {
                                    this.showErrorAlertMessage(error);
                                    return of([]);
                                }),
                            ),
                        this.getCartItems(),
                    ]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (dataList) => {
                    this.isLoading = false;
                    if (!this.isDualPlanYear) {
                        this.setMemberWizardFlow(dataList[0], dataList[1]);
                    }
                    this.cartItems = dataList[CART_INDEX];
                },
                (error) => {
                    this.isLoading = false;
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * Service call to get cart items. Remove agent assisted plans added to cart by agent, if present in the cart.
     * @returns Observable of GetCartItems array
     */
    getCartItems(): Observable<GetCartItems[]> {
        const getCartObservable$ = this.shoppingService.getCartItems(this.userData.memberId, this.userData.groupId, this.PLAN_OFFERING_ID);
        return getCartObservable$.pipe(
            switchMap((cartItems) =>
                iif(
                    () =>
                        cartItems.some(
                            (item) => item.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE && item.planOffering.agentAssistanceRequired,
                        ),
                    forkJoin(
                        cartItems
                            .filter(
                                (item) =>
                                    item.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE && item.planOffering.agentAssistanceRequired,
                            )
                            .map((cartItem) =>
                                this.shoppingService.deleteCartItem(this.userData.memberId, cartItem.id, this.userData.groupId),
                            ),
                    ).pipe(switchMap(() => getCartObservable$)),
                    of(cartItems),
                ),
            ),
        );
    }

    /**
     * @description Function used to determine scenario of member wizard to show appropriate Header title
     * @param planYearData {PlanYear[]}
     * @param qleData {MemberQualifyingEvent[]}
     * @returns nothing
     */
    setMemberWizardFlow(planYearData: PlanYear[], qleData: MemberQualifyingEvent[]): void {
        this.isOpenEnrollment(planYearData);
        let headerTitle = "";
        if (planYearData.length === 0 || this.isSelfEnrollment) {
            headerTitle = this.languageStrings["primary.portal.memberWizard.title.yearRound"];
        } else if (this.isEnrollementOpenFoPlanYear(planYearData)) {
            if (this.isTwoYearsInPlanYear(planYearData)) {
                if (qleData.length !== 0 && this.isEnrollementOpenForQLE(qleData)) {
                    headerTitle = this.languageStrings["primary.portal.memberWizard.title.specialEnrollment"].replace(
                        "##PLANYEAR##",
                        this.getPlanYear(planYearData, true),
                    );
                } else {
                    headerTitle = this.languageStrings["primary.portal.memberWizard.title.openEnrollment"].replace(
                        "##PLANYEAR##",
                        this.getPlanYear(planYearData, true),
                    );
                }
            } else if (qleData.length !== 0 && this.isEnrollementOpenForQLE(qleData)) {
                headerTitle = this.languageStrings["primary.portal.memberWizard.title.specialEnrollment"].replace(
                    "##PLANYEAR##",
                    this.getPlanYear(planYearData, false),
                );
            } else {
                headerTitle = this.languageStrings["primary.portal.memberWizard.title.openEnrollment"].replace(
                    "##PLANYEAR##",
                    this.getPlanYear(planYearData, false),
                );
            }
        } else if (qleData.length !== 0 && this.isEnrollementOpenForQLE(qleData)) {
            headerTitle = this.languageStrings["primary.portal.memberWizard.title.specialEnrollment"].replace(
                "##PLANYEAR##",
                this.getPlanYear(planYearData, false),
            );
        } else {
            headerTitle = this.languageStrings["primary.portal.memberWizard.title.yearRound"];
        }
        this.headerObject = { ...this.headerObject, title: headerTitle };
        this.store.dispatch(new SetHeaderObject(this.headerObject));
    }
    // function used to determine plan year to show in header title
    getPlanYear(pyData: PlanYear[], isTwoYeas: boolean): string {
        let pyTemp = null;
        pyData.forEach((py) => {
            if (
                pyTemp === null ||
                Number(py.coveragePeriod.effectiveStarting.substring(0, 4)) >
                    Number(pyTemp.coveragePeriod.effectiveStarting.substring(0, 4))
            ) {
                pyTemp = py;
            }
        });
        if (isTwoYeas) {
            return pyTemp.coveragePeriod.effectiveStarting.substring(0, 4) + "-" + pyTemp.coveragePeriod.expiresAfter.substring(0, 4);
        }
        return pyTemp.coveragePeriod.effectiveStarting.substring(0, 4);
    }
    // function used to determine whethere Plan year falls in two different years
    isTwoYearsInPlanYear(pyData: PlanYear[]): boolean {
        let pyTemp = null;
        pyData.forEach((py) => {
            if (
                pyTemp === null ||
                Number(py.coveragePeriod.effectiveStarting.substring(0, 4)) >
                    Number(pyTemp.coveragePeriod.effectiveStarting.substring(0, 4))
            ) {
                pyTemp = py;
            }
        });
        if (
            Number(pyTemp.coveragePeriod.effectiveStarting.substring(0, 4)) !== Number(pyTemp.coveragePeriod.expiresAfter.substring(0, 4))
        ) {
            return true;
        }
        return false;
    }
    // function used to determine whethere today's date falls in enrollment dates
    isEnrollementOpen(py: PlanYear | MemberQualifyingEvent): boolean {
        let flag = false;
        const enrollmentPeriod = !py["enrollmentValidity"] ? py["enrollmentPeriod"] : py["enrollmentValidity"];
        const startDate = this.dateService.toDate(enrollmentPeriod.effectiveStarting).valueOf();
        const endDate = this.dateService.toDate(enrollmentPeriod.expiresAfter).valueOf();
        const nowDate = new Date().valueOf();
        if (startDate <= nowDate && endDate >= nowDate) {
            flag = true;
        }
        return flag;
    }
    /**
     * @description Checks whether the plan year is in openEnrollment or
     * not from the array of planYears available
     * @param planYear:PlanYear[]*
     * @returns {void}
     * @memberof MemberHomeComponent
     */
    isOpenEnrollment(planYear: PlanYear[]): void {
        planYear.forEach((py) => {
            const enrollmentStartDate = this.dateService.toDate(py.enrollmentPeriod.effectiveStarting);
            const enrollmentEndDate = this.dateService.toDate(py.enrollmentPeriod.expiresAfter);
            const currentDate = new Date();
            if (enrollmentStartDate <= currentDate && enrollmentEndDate >= currentDate) {
                this.isEnrollmentOpenFlag = true;
            }
            if (this.isEnrollmentOpenFlag) {
                const noOfDays = Math.round(
                    (enrollmentEndDate.setHours(this.TIME_CONSTANT) - currentDate.setHours(this.TIME_CONSTANT)) /
                        (this.MILLISECONDS * this.SECONDS * this.MINUTES * this.HOURS),
                );
                this.daysLeft = noOfDays + 1;
                this.pyName = py.name;
            }
            this.enrollmentNotificationMessage = this.replacePipe.transform("primary.portal.members.memberDashboard.enrollNotification", {
                "#days": this.daysLeft,
                "#year": this.pyName,
            });
        });
    }
    // function used to determine whethere QLE enrollment is open
    isEnrollementOpenForQLE(qleData: MemberQualifyingEvent[]): boolean {
        if (qleData.length > 0 && qleData.findIndex((x) => x.status === this.STR_APRROVED && this.isEnrollementOpen(x)) !== -1) {
            return true;
        }
        return false;
    }
    /**
     * @description function used to determine whethere Plan Year enrollment is open
     * @param planYear list of plan years associated with group
     * @returns boolean
     */
    isEnrollementOpenFoPlanYear(planYear: PlanYear[]): boolean {
        let flag = false;
        let recentPlanYear: PlanYear = null;
        planYear.forEach((py) => {
            if (
                recentPlanYear === null ||
                this.dateService.toDate(py.enrollmentPeriod.effectiveStarting).valueOf() >
                    this.dateService.toDate(recentPlanYear.enrollmentPeriod.effectiveStarting).valueOf()
            ) {
                recentPlanYear = py;
            }
        });
        if (recentPlanYear !== null) {
            flag = this.isEnrollementOpen(recentPlanYear);
        }
        return flag;
    }
    /**
     * @description get all data required for widget
     * @returns {void}
     */
    getCoverageWidgetData(): void {
        this.isCoverageWidgetLoading = true;
        const apiArray = this.configureApiCallForWidget();
        apiArray
            .pipe(
                switchMap(([qleData, enrollmentData, planYears, memberData, productData, cartItems, riderAmount]) =>
                    this.configureDataForCoverageWidget(
                        cartItems,
                        qleData,
                        enrollmentData,
                        planYears,
                        memberData,
                        productData,
                        riderAmount,
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([payFrequencies, memberDependentsData, memberBeneficiariesData]) => {
                if (payFrequencies) {
                    this.payFrequncy = payFrequencies.find((pFrequency) => pFrequency.id === this.payFrequencyId);
                }
                if (memberDependentsData) {
                    this.dependentCount = memberDependentsData.length;
                    this.memberCount += memberDependentsData.length;
                }
                if (memberBeneficiariesData) {
                    const allocatedBeneficiaries = memberBeneficiariesData.filter((beneficiary) => beneficiary.allocations.length > 0);
                    this.beneficiaryCount = allocatedBeneficiaries.length;
                }
            });
    }
    /**
     * @description this function will configure open and upcoming enrollment
     * @param planYear list of plan years associated with group
     * @returns {void}
     */
    configurePlanYear(planYears: PlanYear[]): void {
        if (planYears.length === 0) {
            return;
        }
        planYears.forEach((pYear) => {
            const startDate = this.dateService.toDate(pYear.enrollmentPeriod.effectiveStarting),
                endDate = this.dateService.toDate(pYear.enrollmentPeriod.expiresAfter),
                nowDate = new Date(Date.now());
            if ((startDate <= nowDate && endDate >= nowDate) || startDate >= nowDate) {
                this.ongoingEnrollments.push(pYear);
            }
        });
        this.ongoingEnrollments.sort((pYear1: PlanYear, pYear2: PlanYear) =>
            pYear1.enrollmentPeriod.effectiveStarting > pYear2.enrollmentPeriod.effectiveStarting ? 1 : -1,
        );
    }
    /**
     * @description Function to configure All Api calls in a array
     * @returns {  Observable<
        [
            MemberQualifyingEvent[],
            Enrollments[],
            PlanYear[],
            HttpResponse<MemberProfile>,
            Product[],
            GetCartItems[],
            number
        ]
     >}  :  Return type Observable  API
     */
    configureApiCallForWidget(): Observable<
        [MemberQualifyingEvent[], Enrollments[], PlanYear[], HttpResponse<MemberProfile>, Product[], GetCartItems[], number]
    > {
        const enrollments$ = this.enrollmentService.getEnrollments(this.userData.memberId, this.userData.groupId, "").pipe(shareReplay(1));
        return forkJoin(
            this.mService.getMemberQualifyingEvents(this.userData.memberId, this.userData.groupId),
            enrollments$,
            this.benefitOffService.getPlanYears(this.userData.groupId, false),
            this.mService.getMember(this.userData.memberId, true, this.userData.groupId),
            this.coreService.getProducts(),
            this.shoppingService.getCartItems(this.userData.memberId, this.userData.groupId, this.PLAN_OFFERING_ID),
            enrollments$.pipe(
                switchMap(
                    (enrollments) =>
                        iif(
                            () => enrollments && enrollments.length > 0,
                            defer(() => this.getTotalEnrollmentRiderAmount(this.userData.memberId, this.userData.groupId, enrollments)),
                            of(0),
                        ) as Observable<number>,
                ),
            ),
        );
    }

    /**
     * @description this function add both memberCostPerPayPeriod and riders cost
     * @param enrollments Array of Enrollments
     * @param memberId member's ID
     * @param accountId account id of the selected account
     * @returns enrollments[] enrollment data
     */
    getEnrollmentsWithRiderCost(enrollments: Enrollments[], memberId: number, accountId: number): Observable<Enrollments[]> {
        return combineLatest(
            enrollments.map((enrollment) =>
                this.enrollmentService.getEnrollmentRiders(memberId, enrollment.id, accountId).pipe(
                    map((rider) =>
                        rider.length
                            ? {
                                  ...enrollment,
                                  memberCostPerPayPeriod: rider.reduce(
                                      (a, member) => a + member.memberCostPerPayPeriod,
                                      enrollment.memberCostPerPayPeriod,
                                  ),
                              }
                            : enrollment,
                    ),
                ),
            ),
        );
    }
    /**
     * @description Function to configure data required for household widget
     * @param cartItems Cart items to check whether enrollment is in cart
     * @param qleData Qualifying event data for configuring widget information
     * @param enrollmentData Array of Enrollments on going for user for configuring widget information
     * @param planYears Array of Plan Years data for configuring widget information
     * @param memberData Member profile data for configuring widget information
     * @param productData Products data for configuring widget information
     * @param riderAmount Rider amount to calculate premium
     * @returns Observable<[PayFrequency[], MemberDependent[], MemberBeneficiary[]]>
     */
    configureDataForCoverageWidget(
        cartItems: GetCartItems[],
        qleData: MemberQualifyingEvent[],
        enrollmentData: Enrollments[],
        planYears: PlanYear[],
        memberData: HttpResponse<MemberProfile>,
        productData: Product[],
        riderAmount: number,
    ): Observable<[PayFrequency[], MemberDependent[], MemberBeneficiary[]]> {
        this.isCoverageWidgetLoading = false;
        if (enrollmentData && enrollmentData.length === 0) {
            this.isZeroStateCoverageWidget = true;
        }
        this.isOpenEnrollment(planYears);
        enrollmentData = enrollmentData.filter((enrollment) => this.displayCompanyProvidedPlans(enrollment, cartItems));
        this.enrollmentData = enrollmentData;

        this.getEnrollmentsWithRiderCost(enrollmentData, this.userData.memberId, this.userData.accountId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((enrollments) => {
                this.payrollDeductionAmount = enrollments.reduce((acc, enrollment) => acc + enrollment.memberCostPerPayPeriod, 0);
            });
        this.enrollmentData.forEach((enrollment, $index) => {
            const pname = productData.find((prod) => prod.id === enrollment.plan.productId).name;
            if (!this.productListFull) {
                if (this.productList.length + pname.length > this.MAX_CHARACTER_COUNT) {
                    this.productList += ` & ${this.enrollmentData.length - $index} ${
                        this.languageStrings["primary.portal.members.memberDashboard.more"]
                    } `;
                    this.productListFull = true;
                } else {
                    if ($index > 0) {
                        this.productList += this.STR_COMMA_SEPARATOR;
                    }
                    this.productList += pname;
                }
            }
        });
        if (qleData) {
            this.qualifiedLifeEvents = qleData;
        }
        this.configurePlanYear(planYears);
        this.payFrequencyId = memberData.body.workInformation.payrollFrequencyId;
        return forkJoin([
            this.accountService.getPayFrequencies(),
            this.mService.getMemberDependents(this.userData.memberId, true, this.userData.groupId),
            this.mService.getMemberBeneficiaries(this.userData.memberId, this.userData.groupId, true),
        ]);
    }
    /**
     * Returns the total sum of the member cost per pay period of all riders under each enrollment
     * @param memberId member's ID
     * @param groupId member's MP-group
     * @param enrollments list of policies the member is enrolled in
     * @returns observable of the sum of the member cost per pay period of all riders under each enrollment
     */
    getTotalEnrollmentRiderAmount(memberId: number, groupId: number, enrollments: Enrollments[]): Observable<number> {
        return forkJoin(enrollments.map((enrollment) => this.enrollmentService.getEnrollmentRiders(memberId, enrollment.id, groupId))).pipe(
            map((allEnrollmentRiders) =>
                allEnrollmentRiders
                    .reduce((accumulator, current) => [...accumulator, ...current], [])
                    .map((rider) => rider.memberCostPerPayPeriod)
                    .reduce((accumulator, current) => accumulator + current, 0),
            ),
        );
    }
    /**
     * Method to display company provided plans based on conditions
     * @param data: Enrollment needs to be checked
     * @param cartItems: List of cart items to check enrollment is in cart
     * @returns TRUE if plan needs to be displayed else false
     */
    displayCompanyProvidedPlans(data: Enrollments, cartItems: GetCartItems[]): boolean {
        let display = true;
        if (
            data.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
            data.plan.characteristics.includes(Characteristics.AUTOENROLLABLE)
        ) {
            const item = cartItems.find((cartItem) => cartItem.enrollmentId === data.id);
            display = !item || !this.isEnrollmentOpenFlag;
        }
        return display;
    }
    /**
     * @description Unsubscribing all the subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
