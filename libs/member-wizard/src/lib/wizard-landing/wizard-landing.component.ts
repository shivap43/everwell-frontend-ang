import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Router, NavigationStart, Event as NavigationEvent, RouterStateSnapshot } from "@angular/router";
import {
    MemberService,
    AccountService,
    EnrollmentService,
    ShoppingService,
    CoreService,
    BenefitsOfferingService,
    Carrier,
    GetShoppingCart,
    ShoppingCartDisplayService,
} from "@empowered/api";
import { Select, Store } from "@ngxs/store";

import { Observable, Subscription, forkJoin, of, Subject, combineLatest, iif } from "rxjs";
import { UserService } from "@empowered/user";
import { Location, DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { map, take, catchError, filter, tap, switchMap, first, finalize } from "rxjs/operators";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";

import {
    SetExitPopupStatus,
    EnrollmentState,
    SetMemberPayFrequency,
    SetDependentList,
    SetUserData,
    SetWizardMenuTab,
    SetMemberRelations,
    SetCoverageData,
    SetCurrentFlow,
    SetTotalCost,
    SetPlanYear,
    SetScenarioObject,
    SetAllCarriersMMP,
    MemberWizardState,
    DualPlanYearState,
    QleOeShopModel,
    SharedState,
    SetHeaderObject,
    UtilService,
    DualPlanYearService,
} from "@empowered/ngxs-store";

import {
    TPI,
    DateFormats,
    ClientErrorResponseCode,
    HeaderObject,
    ScenarioObject,
    AppSettings,
    Validity,
    DualPlanYearSettings,
    EnrollmentMethod,
    PlanChoice,
    Characteristics,
    NextTab,
    PolicyObject,
    MEMBERWIZARD,
    CoverageLevel,
    PlanOffering,
    ProductOffering,
    GetCartItems,
    MemberCredential,
    EnrollmentRider,
    Enrollments,
    MemberDependent,
    PlanOfferingPanel,
    MemberQualifyingEvent,
    PlanYear,
    DateFnsFormat,
    CompanyCode,
    CarrierId,
} from "@empowered/constants";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const SHOP = "Shop";

@Component({
    selector: "empowered-wizard-landing",
    templateUrl: "./wizard-landing.component.html",
    styleUrls: ["./wizard-landing.component.scss"],
})
export class WizardLandingComponent implements OnInit, OnDestroy {
    memberShopLink = "wizard/enrollment/shop";
    fullmemberShopLink = "/member/wizard/enrollment/shop";
    fullmemberAppFlow = "/member/wizard/enrollment/app-flow";
    enrollmentRiders = "enrollmentRiders";
    showNav: boolean;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.enrollmentWizard.welcome",
        "primary.portal.enrollmentWizard.backToWelcome",
        "primary.portal.enrollmentWizard.myHousehold",
        "primary.portal.enrollmentWizard.backToMyHousehold",
        "primary.portal.enrollmentWizard.getStarted",
        "primary.portal.enrollmentWizard.coverage",
        "primary.portal.enrollmentWizard.reviewMyCoverage",
        "primary.portal.enrollmentWizard.shop",
        "primary.portal.enrollmentWizard.startShopping",
    ]);
    wizardTabs = [
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.welcome"],
            link: "wizard/welcome",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToWelcome"],
            nextButtonLabel: "",
        },
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.myHousehold"],
            link: "wizard/myhousehold",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToMyHousehold"],
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.getStarted"],
        },
        /* TODO - This will be a part of DAY 2
        {
             label: "Preference",
             link: "wizard/preferences",
        }, */
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.coverage"],
            link: "wizard/coverage",
            backButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.backToCoverage"],
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.reviewMyCoverage"],
        },
        {
            label: this.languageStrings["primary.portal.enrollmentWizard.shop"],
            link: "wizard/enrollment/shop",
            backButtonLabel: "",
            nextButtonLabel: this.languageStrings["primary.portal.enrollmentWizard.startShopping"],
        },
    ];
    activeLink: string;
    allSubscriptions: Subscription[];
    isLoading = true;
    userData: MemberCredential;
    @Select(MemberWizardState.GetWizardTabMenu) wizardTab$: Observable<NextTab[]>;
    memberName: string;
    nextTab: NextTab;
    STR_WELCOME = "welcome";
    STR_HOME = "HOME";
    STR_MEMBER_ROUTE = "member/";
    STR_MYHOUSEHOLD = "My Household";
    STR_COVERAGE = "Coverage";
    STR_APRROVED = "APPROVED";
    STR_COMPANY_PROVIDED = "COMPANY_PROVIDED";
    STR_POSTTAX = "POSTTAX";
    STR_CONTACT = "contact";
    STR_PRODUCT = "product";
    STR_CARRIER = "carrier";
    STR_IS_UPDATE = "isUpdate";
    STR_POLICY_CHANGES = "policyChanges";
    STR_LAST_LOGIN = "lastLogin";
    STR_HOME_URL = "member/home";
    currentWizardFlow: MEMBERWIZARD;
    coverageStartDate: Date;
    coverageEndDate: Date;
    enrollmentStartDate: Date;
    enrollmentEndDate: Date;
    qleEndDate: Date;
    enrollDate: string;
    appSetting = AppSettings;
    pricingData;
    memberEnrollmentData;
    sceanrioObject: ScenarioObject;
    isApplicationFlow: boolean;
    cartContains: string;
    EMPTY = "";
    dualPlanYearData: QleOeShopModel;
    NEXT_PLAN_YEAR_INDEX = 1;
    QLE_INDEX = 0;
    isDualPlanYear = false;
    isQleDuringOeEnrollment = false;
    isQleAfterOeEnrollment = false;
    selectedShopForDualPlan: string;
    qleExpiryDate = "";
    headerObject: HeaderObject;
    EMPLOYEE_NAME_PLACEHOLDER = "##employeeName##";
    PLAN_YEAR_QLE_PLACEHOLDER = "##planYearQLE##";
    PLAN_DATE_PLACEHOLDER = "##planDate##";
    PLAN_YEAR_OE_PLACEHOLDER = "##planYearOE##";
    @Select(MemberWizardState.GetPlanYear) planYearData$: Observable<PlanYear[]>;
    @Select(DualPlanYearState) dualPlanYearData$: Observable<QleOeShopModel>;
    isSelfEnrollment = false;
    private readonly allowNavigation$ = new Subject<boolean>();
    cartItems: GetCartItems[];
    exitPopupStatus = false;
    isTpi = false;
    isExitEnrollment = false;
    planOfferings: PlanOffering[];
    @Select(EnrollmentState.GetExitPopupStatus) exitPopupStatus$: Observable<boolean>;
    isSpinnerLoading: boolean;
    planYearId = undefined;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly languageService: LanguageService,
        private readonly router: Router,
        private readonly mService: MemberService,
        private readonly cd: ChangeDetectorRef,
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly eService: EnrollmentService,
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly benefitOffService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly enrollmentsService: EnrollmentService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly sharedService: SharedService,
        private readonly location: Location,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly util: UtilService,
        private shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly dateService: DateService,
    ) {
        this.allSubscriptions = [];
        this.allSubscriptions.push(
            this.mService.wizardCurrentTab$.subscribe((tab) => {
                if (!isNaN(tab) && this.mService.wizardTabMenu && this.mService.wizardTabMenu.length) {
                    this.activeLink = this.mService.wizardTabMenu[tab].link;
                }
            }),
        );
        this.getDualPlanYearData();
        this.exitPopupStatus$.subscribe((x) => (this.exitPopupStatus = x));
        if (this.router.url.indexOf(TPI.TPI) >= 0) {
            this.isTpi = true;
        }
    }

    /**
     *
     * @description performs necessary function and calculation on initialization of the component
     * @memberof WizardLandingComponent
     */
    ngOnInit(): void {
        this.allSubscriptions.push(
            this.sharedService
                .checkAgentSelfEnrolled()
                .pipe(
                    tap((response) => {
                        this.isSelfEnrollment = response;
                    }),
                )
                .subscribe(),
        );
        this.cd.detectChanges();
        this.allSubscriptions.push(
            this.wizardTab$.subscribe((tabs) => {
                this.wizardTabs = tabs;
            }),
        );
        this.getLanguages();
        this.store.dispatch(new SetWizardMenuTab(this.mService.getMemberWizardTabMenu()));
        this.isLoading = true;
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.allSubscriptions.push(
            this.userService.credential$
                .pipe(
                    tap((data) => {
                        if (data === undefined) {
                            this.isLoading = false;
                        }
                    }),
                    filter((data) => data !== undefined),
                    switchMap((data: MemberCredential) => {
                        this.userData = data;
                        this.isLoading = true;
                        this.memberName = data.name.firstName;
                        return this.mService.getMemberContact(data.memberId, this.STR_HOME, data.groupId.toString());
                    }),
                    switchMap((contact) => {
                        const udata = { ...this.userData };
                        udata[this.STR_CONTACT] = contact.body;
                        this.store.dispatch(new SetUserData(udata));
                        this.userData = udata;
                        this.getMemberWizardData();
                        return of(null);
                    }),
                    tap(() => {
                        const stateCode = this.getCurrentStateCompanyCode();
                        this.store.dispatch(new SetAllCarriersMMP(stateCode));
                    }),
                    catchError((error) => {
                        this.isLoading = false;
                        return of(null);
                    }),
                )
                .subscribe(),
        );
        this.mService.wizardCurrentTab$.next(0);
        this.allSubscriptions.push(
            this.planYearData$.subscribe((planYearData) => {
                if (this.userData && planYearData.length) {
                    const temp = [];
                    temp.push(planYearData);
                    this.setMessageDate(temp);
                    this.configureScenarioObject(this.currentWizardFlow);
                }
            }),
        );
        this.checkRouteForAppFlow(this.router.url);

        this.allSubscriptions.push(
            this.router.events
                .pipe(filter((event: NavigationEvent) => event instanceof NavigationStart))
                .subscribe((event: NavigationStart) => {
                    if (event.url === this.fullmemberShopLink) {
                        this.configureMemberWizardForShop();
                    } else {
                        this.checkRouteForAppFlow(event.url);
                    }
                }),
        );
    }
    // get Index of given link
    getIndexOfLink(link: string): number {
        return this.wizardTabs.findIndex((x) => x.link === link);
    }
    // set Shop tab active when accessed directly to shop experience
    configureMemberWizardForShop(): void {
        this.showNav = true;
        this.mService.wizardCurrentTab$.next(this.getIndexOfLink(this.memberShopLink));
    }
    /**
     * Get All data from API and Passed to processing functions
     */
    getMemberWizardData(): void {
        const apiArray = this.configureApiArray();
        this.isLoading = true;
        this.allSubscriptions.push(
            combineLatest(apiArray)
                .pipe(
                    switchMap(
                        ([
                            memberDependents,
                            relations,
                            memberInfo,
                            enrollments,
                            productOfferings,
                            planOfferings,
                            planYears,
                            qualifyingEvents,
                            searchEnrollments,
                            planChoices,
                            cartItems,
                        ]) => {
                            this.planOfferings = planOfferings;
                            this.cartItems = cartItems;
                            this.setMessageDate(planYears);
                            this.store.dispatch(new SetPlanYear(planYears));
                            if (planOfferings.length > 0) {
                                this.getPricingData(enrollments, productOfferings, planOfferings, planChoices, cartItems);
                                this.setMemberWizardFlow(planOfferings, planYears, qualifyingEvents, cartItems);
                            } else {
                                this.showInEligiableDialog();
                                this.getPricingData(enrollments, productOfferings, [], planChoices, cartItems);
                                this.setMemberWizardFlow([], planYears, qualifyingEvents, cartItems);
                            }
                            this.configureMyHouseHold(memberDependents);
                            this.store.dispatch(new SetMemberRelations(relations));
                            this.configurePayFrequency(memberInfo.body.workInformation.payrollFrequencyId);
                            this.store.dispatch(new SetUserData(this.getUserDataObject(memberInfo.body)));
                            this.memberEnrollmentData = searchEnrollments;
                            this.checkHiredate(memberInfo.body.workInformation.hireDate);
                            this.mService.setMemberHireDate = memberInfo.body.workInformation.hireDate;
                            this.isLoading = false;
                            return of(null);
                        },
                    ),
                    switchMap(() => {
                        const DECLINED_COVERAGE_ID = 2;
                        const itemsExcludingCompanyProvidedOrDeclinedPlans = this.cartItems.filter((cartItem) => {
                            const offering = this.planOfferings?.find((planOffering) => planOffering.id === cartItem.planOfferingId);
                            return (
                                !(
                                    offering?.plan?.characteristics?.length &&
                                    offering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED)
                                ) && cartItem.coverageLevelId !== DECLINED_COVERAGE_ID
                            );
                        });
                        // Checks if the cart contains plans other than self service
                        const hasPlanOtherthanSelfService =
                            this.planOfferings &&
                            !itemsExcludingCompanyProvidedOrDeclinedPlans.every(
                                (item) => item.enrollmentMethod === EnrollmentMethod.SELF_SERVICE,
                            );
                        // Checks if the cart contains plans other than Face to Face
                        const hasPlanOtherThanF2F =
                            this.planOfferings &&
                            !itemsExcludingCompanyProvidedOrDeclinedPlans.every(
                                (item) => item.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE,
                            );
                        return iif(
                            () => (!this.isSelfEnrollment && hasPlanOtherthanSelfService) || (this.isSelfEnrollment && hasPlanOtherThanF2F),
                            this.shoppingService
                                .clearShoppingCart(this.userData.memberId, this.userData.groupId, false)
                                .pipe(switchMap(() => this.updatedShoppingCart())),
                            of(null),
                        );
                    }),
                    switchMap(() => this.shoppingService.acquireShoppingCartLock(this.userData.memberId, this.userData.groupId)),
                    catchError(() => {
                        this.isLoading = false;
                        return this.shoppingService.acquireShoppingCartLock(this.userData.memberId, this.userData.groupId);
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * updated shoppingCart on update of cart items
     * @returns Observable of getShoppingCart
     */
    updatedShoppingCart(): Observable<GetShoppingCart> {
        return this.shoppingService.getShoppingCart(this.userData.memberId, this.userData.groupId, this.planYearId).pipe(
            tap(
                (CartDetails) => {
                    this.shoppingCartDisplayService.setShoppingCart(CartDetails);
                },
                (error) => {
                    this.isLoading = false;
                },
            ),
        );
    }

    /**
     * This method will remove shop tab if member's hire date is in future.
     * @param hireDate member's hire date
     */
    checkHiredate(hireDate: string): void {
        if (!hireDate || this.dateService.checkIsAfter(this.dateService.toDate(hireDate))) {
            this.wizardTabs = this.wizardTabs.filter((wizardtab) => wizardtab.label !== SHOP);
        }
    }

    // Configure and Get User Data Object,
    getUserDataObject(profileData: MemberCredential): MemberCredential {
        const uData = profileData;
        uData.memberId = this.userData.memberId;
        uData.groupId = this.userData.groupId;
        uData[this.STR_CONTACT] = this.userData[this.STR_CONTACT];
        return uData;
    }
    /**
     * Extract Dates for filling in Messages
     * @param planYearData: Plan year array
     */
    setMessageDate(planYearData: PlanYear[]): void {
        if (planYearData && planYearData.length > 0) {
            const planYears = planYearData.filter((planData) => this.isEnrollementOpen(planData.enrollmentPeriod));
            if (planYears.length) {
                const planYear = planYears.reduce((pYear1, pYear2) =>
                    this.dateService.isBefore(
                        this.dateService.toDate(pYear1.enrollmentPeriod.expiresAfter || Date.now()),
                        this.dateService.toDate(pYear2.enrollmentPeriod.expiresAfter || Date.now()),
                    )
                        ? pYear2
                        : pYear1,
                );
                if (planYear.coveragePeriod) {
                    this.coverageStartDate = this.dateService.toDate(planYear.coveragePeriod.effectiveStarting);
                    this.coverageEndDate = this.dateService.toDate(planYear.coveragePeriod.expiresAfter);
                }
                if (planYear.enrollmentPeriod) {
                    this.enrollmentStartDate = this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting);
                    this.enrollmentEndDate = this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter);
                }
                this.enrollDate = this.checkEnrollmentInTwoYear(
                    this.datePipe.transform(this.enrollmentStartDate, DateFormats.YEAR),
                    this.datePipe.transform(this.enrollmentEndDate, DateFormats.YEAR),
                );
            }
        }
    }
    /**
     * @description to determine the scenario of member wizard
     * @param planData
     * @param planYearData
     * @param qleData
     * @param cartData
     */
    setMemberWizardFlow(
        planData: PlanOfferingPanel[],
        planYearData: PlanYear[],
        qleData: MemberQualifyingEvent[],
        cartData: GetCartItems[],
    ): void {
        if (this.isDualPlanYear) {
            this.currentWizardFlow = this.setMemberWizardFLowForDualPlan(cartData);
            this.setHeaderTitle();
        } else if (!planYearData.length || this.isAllContinuousAndCompanyPlan(planData)) {
            const isContinousPlanAdded = this.isNewContinousAdded(planData);
            const isCompanyPlanAdded = this.isNewCompanyProvodedPlansAdded(planData);
            // UpDated Moqup :: Scenario 2 :: Continuous FreshMan with Continous plan enrolled
            if (!isContinousPlanAdded && !isCompanyPlanAdded) {
                this.currentWizardFlow = MEMBERWIZARD.CONT_NO_PLAN_ADDED;
            } else if (isContinousPlanAdded && isCompanyPlanAdded) {
                // UpDated Moqup :: Scenario 5:: Continuous FreshMan with new Continous plan + NEW company-provided
                this.currentWizardFlow = MEMBERWIZARD.CONT_NEW_COMPANY_AND_CONTI_PLAN_ADDED;
            } else if (isCompanyPlanAdded) {
                // UpDated Moqup :: Scenario 3:: Continuous FreshMan with  NEW company-provided
                this.currentWizardFlow = MEMBERWIZARD.CONT_NEW_COMPANY_PLAN_ADDED;
            } else {
                // UpDated Moqup :: Scenario 4:: Continuous FreshMan with  NEW Continous plan added
                this.currentWizardFlow = MEMBERWIZARD.CONT_NEW_CONTI_PLAN_ADDED;
            }
        } else if (planYearData.some((planYear) => this.isEnrollementOpen(planYear.enrollmentPeriod))) {
            if (qleData.length !== 0 && this.isEnrollementOpenForQLE(qleData)) {
                if (!this.hasCartItems(cartData)) {
                    // New Added Moqup Wise 7  nd scenario
                    this.currentWizardFlow = MEMBERWIZARD.DUAL_FIRST_VISIT;
                } else {
                    // New Added Moqup Wise 7A nd scenario
                    this.currentWizardFlow = MEMBERWIZARD.DUAL_ENROLLMENT_NOT_COMPLETED;
                }
            } else if (!this.hasCartItems(cartData)) {
                // New Added Moqup Wise 1 nd scenario
                this.currentWizardFlow = MEMBERWIZARD.OE_FRESHMAN_OR_NON_FRESHMAN;
                //  this.checkAllContinousProductEnrolled(enrollmentData, planData);
            } else {
                // New Added Moqup Wise 1A nd scenario
                this.currentWizardFlow = MEMBERWIZARD.OE_NOT_FINISHED;
            }
        } else if (qleData.length !== 0 && this.isEnrollementOpen(qleData[0].enrollmentValidity)) {
            this.qleEndDate = this.dateService.toDate(qleData[0].enrollmentValidity.expiresAfter);
            if (!this.hasCartItems(cartData)) {
                // New Added Moqup Wise 6 nd scenario
                this.currentWizardFlow = MEMBERWIZARD.ONLY_SEP_FIRST_VISIT;
            } else {
                // New Added Moqup Wise 6A nd scenario
                this.currentWizardFlow = MEMBERWIZARD.ONLY_SEP_NOT_COMPLETED;
            }
        } else {
            //  Enrollment is close , SEP closed if any , Coverage Period started"
            this.currentWizardFlow = MEMBERWIZARD.NONE;
        }
        this.configureScenarioObject(this.currentWizardFlow);
        this.store.dispatch(new SetCurrentFlow(this.currentWizardFlow));
    }
    /**
     * Configures data for household tab
     * @param data array of member's dependents
     */
    configureMyHouseHold(data: MemberDependent[]): void {
        const dArray: MemberDependent[] = [...data];
        let count = 0;
        this.isLoading = true;
        if (data && data.length > 0) {
            data.forEach((d, $index) => {
                this.mService
                    .getDependentContact(this.userData.memberId, d.id.toString(), this.userData.groupId)
                    .pipe(take(1))
                    .subscribe(
                        (dContact) => {
                            const temContact = { ...dArray[$index], contact: dContact };
                            dArray[$index] = temContact;
                            count++;
                            if (count === data.length) {
                                this.isLoading = false;
                                this.store.dispatch(new SetDependentList(dArray));
                            }
                        },
                        (error) => {
                            count++;
                            if (count === data.length) {
                                this.isLoading = false;
                                this.store.dispatch(new SetDependentList(dArray));
                            }
                        },
                    );
            });
        } else {
            this.isLoading = false;
            this.store.dispatch(new SetDependentList([]));
        }
    }
    /**
     * Configure data for coverages
     * @param data1: Enrollments array
     * @param data2: Product offering array
     * @param data3: Plan offering array
     * @param data4: Plan choice array
     */
    configureCoverage(data1: Enrollments[], data2: ProductOffering[], data3: PlanOfferingPanel[], data4: PlanChoice[]): void {
        if (data1.length !== 0) {
            let cost = 0;
            let count = 0;
            let totalCost = 0;
            const coverageArray = [];
            this.isLoading = true;
            data1.forEach((planOffering: Enrollments) => {
                const coverageObject = { ...planOffering };

                Object.defineProperty(coverageObject, this.STR_PRODUCT, {
                    value: data2.find((x) => x.product.id === planOffering.plan.productId),
                    configurable: true,
                    enumerable: true,
                });
                if (planOffering.coverageLevel.id && planOffering.plan.carrierId) {
                    // Get current state company code for carrier
                    let currentState = this.getCurrentStateCompanyCode();
                    currentState = (planOffering.plan.carrierId === CarrierId.AFLAC) ? currentState : null;
                    forkJoin([
                        this.coreService.getCoverageLevel(planOffering.coverageLevel.id.toString()),
                        this.coreService.getCarrier(planOffering.plan.carrierId, currentState),
                        this.enrollmentsService.getEnrollmentRiders(this.userData.memberId, planOffering.id, this.userData.groupId),
                    ])
                        .pipe(take(1))
                        .subscribe((cdata) => {
                            const [coverageLevelData, carrierData, enrollmentRiders] = cdata;
                            this.configureCoveragePlanOffering(
                                coverageObject,
                                coverageLevelData,
                                carrierData,
                                data3,
                                data4,
                                enrollmentRiders,
                            );
                            coverageArray.push(coverageObject);
                            cost = cost + coverageObject.memberCost;
                            count++;
                            if (count === data1.length) {
                                totalCost += cost;
                                this.isLoading = false;
                                this.store.dispatch(new SetCoverageData(coverageArray));
                                this.store.dispatch(new SetTotalCost(totalCost));
                            }
                        });
                } else {
                    cost = cost + coverageObject.memberCost;
                    count++;
                    if (count === data1.length) {
                        totalCost += cost;
                        this.isLoading = false;
                        this.store.dispatch(new SetCoverageData(coverageArray));
                        this.store.dispatch(new SetTotalCost(totalCost));
                    }
                }
            });
        } else {
            const currentTabs = this.mService.getMemberWizardTabMenu();
            const tempTab = currentTabs.findIndex((x) => x.label === this.STR_COVERAGE);
            this.mService.setMemberWizardTabMenu(currentTabs.filter((x, $index) => $index !== tempTab));
            this.store.dispatch(new SetWizardMenuTab(this.mService.wizardTabMenu));
            if (this.router.url === this.fullmemberShopLink) {
                this.configureMemberWizardForShop();
            }
            this.isLoading = false;
        }
    }
    /**
     *
     * This method |is used to configure coverage summary data for coverage tab
     * @param coverageObject contains basic Plan Enrollment of member
     * @param coverageData  contain Coverage Level selected from Plan Enrolled
     * @param carrierData  contain Carriers of Plan enrollment
     * @param planOfferingData  contain all Plan Offering for member
     * @param planChoice  contain plan choice of group
     * @param enrollmentRiders  contain Riders opted for enrollment
     * @returns void
     */
    configureCoveragePlanOffering(
        coverageObject: Enrollments,
        coverageData: CoverageLevel,
        carrierData: Carrier,
        planOfferingData: PlanOfferingPanel[],
        planChoice: PlanChoice[],
        enrollmentRiders: EnrollmentRider[],
    ): void {
        coverageObject.coverageLevel = coverageData;
        Object.defineProperty(coverageObject, this.STR_CARRIER, {
            value: carrierData,
            configurable: true,
            enumerable: true,
        });
        Object.defineProperty(coverageObject, this.enrollmentRiders, {
            value: enrollmentRiders,
            configurable: true,
            enumerable: true,
        });
        enrollmentRiders.forEach((rider) => {
            coverageObject.memberCost += rider.memberCost;
        });
        if (this.isAvailableForUpdate(coverageObject, planOfferingData)) {
            Object.defineProperty(coverageObject, this.STR_IS_UPDATE, { value: true, configurable: true });
        } else {
            Object.defineProperty(coverageObject, this.STR_IS_UPDATE, { value: false, configurable: true });
        }
        Object.defineProperty(coverageObject, this.STR_POLICY_CHANGES, {
            value: this.getPolicyChanges(coverageObject, planChoice),
            configurable: true,
        });
    }
    // get Member's confogured Pay Frequency , Service has return type ANY so Placed as Any here in parameter
    configurePayFrequency(payrollFrequencyId: number): void {
        this.accountService
            .getPayFrequencies()
            .pipe(take(1))
            .subscribe((data) => {
                const payFrequency = data.find((payfrequncy) => payfrequncy.id === payrollFrequencyId);
                this.store.dispatch(new SetMemberPayFrequency(payFrequency));
            });
    }
    // TO check whether all continous plans are enrolled
    checkAllContinousProductEnrolled(enrolledData: Enrollments[], planData: PlanOfferingPanel[]): boolean {
        let flag = false;
        const continousPlans = planData.filter((plan) => !plan.planYearId);
        const continousProductNotEnrolled = [];
        continousPlans.forEach((plan) => {
            if (
                continousProductNotEnrolled.findIndex((x) => x === plan.productOfferingId) === -1 &&
                enrolledData.findIndex((y) => y.planOfferingId === plan.id) === -1
            ) {
                continousProductNotEnrolled.push(plan.productOfferingId);
            }
        });
        if (continousProductNotEnrolled.length === 0) {
            flag = true;
        }
        return flag;
    }
    // TO check company provided plan is available in plan Offerings
    checkForCompanyProvidedPlan(planData: PlanOfferingPanel[]): boolean {
        let flag = false;
        const companyProvidedPlan = planData.filter(
            (plan) => plan.plan.characteristics.findIndex((x) => x === this.STR_COMPANY_PROVIDED) !== -1,
        );
        if (companyProvidedPlan.length > 0) {
            flag = true;
        }
        return flag;
    }
    // TO check QLE is approved
    isQLEApproved(qleData: MemberQualifyingEvent[]): boolean {
        let flag = false;
        const sepStartedQle = qleData.filter(
            (event) =>
                event.status !== this.STR_APRROVED ||
                this.dateService.toDate(event.enrollmentValidity?.effectiveStarting).getMilliseconds() >= Date.now(),
        );
        if (sepStartedQle.length > 0) {
            flag = true;
        }
        return flag;
    }
    // To check Whether plan is available for update
    isAvailableForUpdate(planOff: PlanOffering | Enrollments, planOffData: PlanOffering[]): boolean {
        let flag = false;
        if (planOffData && planOff) {
            const idx = planOffData.findIndex((x) => x.plan.id === planOff.plan.id);
            if (idx !== -1) {
                flag = true;
            }
        }
        return flag;
    }
    /**
     * Method to get pricing data
     * @param edata Array of enrollments
     * @param productData Array of product offerings
     * @param planData Array of plan offerings
     * @param planChoiceData Array of plan choices
     * @param cartItems Array of cart items
     */
    getPricingData(
        edata: Enrollments[],
        productData: ProductOffering[],
        planData: PlanOfferingPanel[],
        planChoiceData: PlanChoice[],
        cartItems: GetCartItems[],
    ): void {
        const pricingData = [];
        let count = 0;
        this.isLoading = true;
        const isOE = this.store.selectSnapshot(MemberWizardState.IsOpenEnrollment);
        edata = edata.filter((enrollment) => this.displayCompanyProvidedPlans(enrollment, cartItems, isOE));
        const nonDeclinedEnrollments = edata.filter(
            (plan) =>
                !plan.plan.characteristics.length ||
                plan.plan.characteristics.some((characteristic) => characteristic !== Characteristics.DECLINE),
        );
        nonDeclinedEnrollments.forEach((eplan) => {
            this.shoppingService
                .getPlanOfferingPricing(
                    eplan.planOfferingId.toString(),
                    this.userData[this.STR_CONTACT].address.state,
                    {},
                    this.userData.memberId,
                    this.userData.groupId,
                )
                .pipe(take(1))
                .subscribe(
                    (tpricingData) => {
                        pricingData.push({ id: eplan.id, pricingData: tpricingData });
                        count++;
                        if (count === nonDeclinedEnrollments.length) {
                            this.configureCoverage(nonDeclinedEnrollments, productData, planData, planChoiceData);
                            this.pricingData = pricingData;
                            this.isLoading = false;
                        } else {
                            this.isLoading = true;
                        }
                    },
                    (error) => {
                        count++;
                        if (count === nonDeclinedEnrollments.length) {
                            this.configureCoverage(nonDeclinedEnrollments, productData, planData, planChoiceData);
                            this.pricingData = pricingData;
                            this.isLoading = false;
                        } else {
                            this.isLoading = true;
                        }
                    },
                );
        });
        if (edata.length === 0 || nonDeclinedEnrollments.length === 0) {
            this.configureCoverage(edata, productData, planData, planChoiceData);
        }
    }
    // To get Policy Changes
    getPolicyChanges(planOff: Enrollments, planChoiceData: PlanChoice[]): PolicyObject {
        const tempPlan = this.memberEnrollmentData.find((x) => x.id === planOff.id);
        let coveragePricing = 0;
        // ToDO Languange Changes
        let tempDescription = "TODO: Derive message which will define the reason of cost change";
        const planOffPricing = this.pricingData.find((x) => x.id === planOff.id);
        if (tempPlan.benefitAmount) {
            coveragePricing = planOffPricing
                ? planOffPricing.pricingData.find(
                    (y) => y.coverageLevelId === tempPlan.coverageLevel.id && y.benefitAmount === tempPlan.benefitAmount,
                )
                : 0;
        } else {
            coveragePricing = planOffPricing ? planOffPricing.pricingData.find((y) => y.coverageLevelId === planOff.coverageLevel.id) : 0;
        }
        const choicePlan = planChoiceData.find((x) => x.plan.id === planOff.plan.id);
        if (
            !choicePlan ||
            (!choicePlan.continuous &&
                choicePlan.enrollmentPeriod &&
                this.dateService.toDate(choicePlan.enrollmentPeriod.effectiveStarting).getMilliseconds() < Date.now())
        ) {
            // ToDO Languange Changes
            tempDescription = this.languageStrings["primary.portal.enrollmentWizard.policyDiscountinued"];
            coveragePricing = 0 - planOff.memberCost;
        }
        return {
            newCost: coveragePricing - tempPlan.memberCost,
            description: tempDescription,
        };
    }
    checkDataExistInStore(): boolean {
        const currentState = this.store.selectSnapshot(MemberWizardState.GetCurrentState);
        const defaultState = this.store.selectSnapshot(MemberWizardState.GetDefaultState);
        if (
            defaultState.coverageData === currentState.coverageData &&
            defaultState.currentFlow === currentState.currentFlow &&
            defaultState.dependentList === currentState.dependentList &&
            defaultState.payFrequency === currentState.payFrequency &&
            defaultState.relations === currentState.relations &&
            defaultState.totalCost === currentState.totalCost
        ) {
            return true;
        }
        this.currentWizardFlow = currentState.currentFlow;
        return false;
    }
    enrollmentOver(planYearData: PlanYear[]): boolean {
        let flag = true;
        planYearData.forEach((pyear) => {
            if (this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(pyear.enrollmentPeriod.effectiveStarting).getMilliseconds())) {
                flag = false;
            }
        });
        return flag;
    }
    /**
     * @description to get dual plan year data
     */
    getDualPlanYearData(): void {
        this.allSubscriptions.push(
            this.dualPlanYearData$.subscribe((dualPlanYearData) => {
                if (dualPlanYearData) {
                    this.dualPlanYearData = dualPlanYearData;
                    this.isDualPlanYear = dualPlanYearData.isDualPlanYear;
                    this.isQleDuringOeEnrollment = dualPlanYearData.isQleDuringOeEnrollment;
                    this.isQleAfterOeEnrollment = this.dualPlanYearData.isQleAfterOeEnrollment;
                    this.selectedShopForDualPlan = this.dualPlanYearData.selectedShop;
                    if (this.dualPlanYearData.qleEventData && this.dualPlanYearData.qleEventData.length) {
                        this.qleExpiryDate = this.dateService.format(
                            this.dateService.toDate(
                                this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter || Date.now(),
                            ),
                            DateFnsFormat.LONG_MONTH_AND_DAY,
                        );
                    }
                }
            }),
        );
    }
    /**
     * to set title for header
     */
    setHeaderTitle(): void {
        if (this.selectedShopForDualPlan === DualPlanYearSettings.QLE_SHOP) {
            const languageKey = this.isQleDuringOeEnrollment
                ? "primary.portal.members.coverage.dualPlanYear.eventEnrollment"
                : "primary.portal.members.coverage.dualPlanYear.eventEnrollment.current";
            this.headerObject = {
                title: this.languageStrings[languageKey],
            };
            this.store.dispatch(new SetHeaderObject(this.headerObject));
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.OE_SHOP) {
            this.headerObject = {
                title: this.languageStrings["primary.portal.members.coverage.dualPlanYear.enrollmentOpen"],
            };
            this.store.dispatch(new SetHeaderObject(this.headerObject));
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.NEW_PY_QLE_SHOP) {
            this.headerObject = {
                title: this.languageStrings["primary.portal.members.coverage.dualPlanYear.eventEnrollment.future"],
            };
            this.store.dispatch(new SetHeaderObject(this.headerObject));
        }
    }
    /**
     * @description to determine wizard flow if its a dual plan year
     * @param cartData as cart items array
     * @returns wizard flow numeric value
     */
    setMemberWizardFLowForDualPlan(cartData: GetCartItems[]): number {
        let currentFlow = MEMBERWIZARD.NONE;
        const cartContent = this.dualPlanYearService.checkCartItems(cartData);
        this.cartContains =
            cartContent === DualPlanYearSettings.OE_SHOP && this.isQleAfterOeEnrollment
                ? DualPlanYearSettings.NEW_PY_QLE_SHOP
                : cartContent;
        if (this.selectedShopForDualPlan === DualPlanYearSettings.QLE_SHOP && this.cartContains === this.EMPTY) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_QLE;
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.QLE_SHOP && this.cartContains === DualPlanYearSettings.QLE_SHOP) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_QLE_NOT_COMPLETED;
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.OE_SHOP && this.cartContains === this.EMPTY) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_OE;
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.OE_SHOP && this.cartContains === DualPlanYearSettings.OE_SHOP) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_OE_NOT_COMPLETED;
        } else if (this.selectedShopForDualPlan === DualPlanYearSettings.NEW_PY_QLE_SHOP && this.cartContains === this.EMPTY) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_NEW_PY_QLE;
        } else if (
            this.selectedShopForDualPlan === DualPlanYearSettings.NEW_PY_QLE_SHOP &&
            this.cartContains === DualPlanYearSettings.NEW_PY_QLE_SHOP
        ) {
            currentFlow = MEMBERWIZARD.DUAL_PLAN_YEAR_NEW_PY_QLE_NOT_COMPLETED;
        }
        return currentFlow;
    }
    /**
     * set up data for qle flow
     */
    setScenarioObjectForQle(): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.welcomeLifeEventEnrollment"].replace(
            this.EMPLOYEE_NAME_PLACEHOLDER,
            this.memberName,
        );
        this.sceanrioObject.description = DualPlanYearSettings.QUALIFYING_EVENT;
        this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.members.wizard.dualPlanYear.updateCoverage"];
        this.nextTab = null;
    }
    /**
     * set up data for open enrollment flow
     */
    setScenarioObjectForOe(): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.welcomeOpenEnrollment"].replace(
            this.EMPLOYEE_NAME_PLACEHOLDER,
            this.memberName,
        );
        this.sceanrioObject.description = DualPlanYearSettings.OPEN_ENROLLMENT;
        this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.members.wizard.dualPlanYear.shopCoverage"];
        this.nextTab = null;
    }

    /**
     * set up data for qle when open enrollment is closed for new plan year
     * @param newPlanYear: indicates if data is set for new plan year qle
     */
    setScenarioObjectForNewQLE(newPlanYear: boolean): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.welcomeLifeEventEnrollment"].replace(
            this.EMPLOYEE_NAME_PLACEHOLDER,
            this.memberName,
        );
        this.sceanrioObject.description = DualPlanYearSettings.NEW_PY_QLE_SHOP;
        this.sceanrioObject.buttonTitle = newPlanYear
            ? this.languageStrings["primary.portal.member.wizard.dualPlanYear.updateCoverage.future"]
            : this.languageStrings["primary.portal.memberHome.dualPlanYear.updateCoverage.current"];
        this.nextTab = null;
    }

    /**
     * set up data for qle incomplete flow
     */
    setScenarioObjectForIncompleteQle(): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.readyCoverage"].replace(
            this.EMPLOYEE_NAME_PLACEHOLDER,
            this.memberName,
        );
        const languageKey = this.isQleDuringOeEnrollment
            ? "primary.portal.members.wizard.dualPlanYear.coverageInProgress"
            : "primary.portal.members.wizard.dualPlanYear.currentPYCoverageInProgress";
        this.sceanrioObject.description = this.languageStrings[languageKey].replace(
            this.PLAN_DATE_PLACEHOLDER,
            this.dateService.format(
                this.dateService.toDate(this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter || Date.now()),
                DateFnsFormat.LONG_MONTH_AND_DAY,
            ),
        );
        this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.members.wizard.dualPlanYear.continueCoverage"];
        this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
    }
    /**
     * set up data for incomplete open enrollment flow
     */
    setScenarioObjectForIncompleteOe(): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.readyEnrollment"].replace(
            this.EMPLOYEE_NAME_PLACEHOLDER,
            this.memberName,
        );
        this.sceanrioObject.description = this.languageStrings["primary.portal.members.wizard.dualPlanYear.enrollmentInProgress"].replace(
            this.PLAN_DATE_PLACEHOLDER,
            this.dateService.format(
                new Date(
                    this.util.getCurrentTimezoneOffsetDate(
                        this.dualPlanYearData.planYearsData[this.NEXT_PLAN_YEAR_INDEX].enrollmentPeriod.expiresAfter,
                    ),
                ),
                DateFnsFormat.LONG_MONTH_AND_DAY,
            ),
        );
        this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.noCoverage.dualPlanYear.continueEnrollment"];
        this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
    }

    /**
     * set up data for incomplete new plan year qle
     */
    setScenarioObjectForIncompleteNewQLE(): void {
        this.sceanrioObject.title = this.languageStrings["primary.portal.members.wizard.dualPlanYear.readyNewPYCoverage"].replace(
            "##firstName##",
            this.memberName,
        );
        this.sceanrioObject.description = this.languageStrings[
            "primary.portal.members.wizard.dualPlanYear.newPYCoverageInProgress"
        ].replace("##qleEndDate##", String(this.util.getCurrentTimezoneOffsetDate(this.qleExpiryDate)));
        this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.members.wizard.dualPlanYear.continueCoverage"];
        this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
    }
    /**
     * configuring scenario object as per the current flow
     * @param currentFlow as numeric value for current wizard flow
     */
    configureScenarioObject(currentFlow: number): void {
        this.isSpinnerLoading = true;
        this.sceanrioObject = {
            title: "",
            description: "",
            buttonTitle: "",
        };
        switch (currentFlow) {
            case MEMBERWIZARD.NONE: // Temperary Scenario for navigation
                // TODO : Language need to implemented as Contents are not availble
                this.sceanrioObject.title = "Enrollment is closed";
                this.sceanrioObject.description = "Enrollment is close , SEP closed if any , Coverage Period started";
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.getStarted"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.OE_FRESHMAN_OR_NON_FRESHMAN:
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.welcomeEnrollement"]
                    .replace("#coverageStartDate", this.enrollDate)
                    .replace("#memberName", this.memberName);
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.nonOleMsg"].replace(
                    "#enrollmentEndDate",
                    this.getDayWithOrdinal(
                        this.datePipe.transform(
                            this.util.getCurrentTimezoneOffsetDate(this.enrollmentEndDate.toString()),
                            DateFormats.LONG_MONTH_DAY,
                        ),
                    ),
                );
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.getStarted"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.OE_NOT_FINISHED:
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.readyToFinish"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.readyToFinishMsg"]
                    .replace(
                        "#coverageStartDate",
                        this.datePipe.transform(
                            this.util.getCurrentTimezoneOffsetDate(this.coverageStartDate.toString()),
                            DateFormats.YEAR,
                        ),
                    )
                    .replace(
                        "#enrollmentEndDate",
                        this.getDayWithOrdinal(
                            this.datePipe.transform(
                                this.util.getCurrentTimezoneOffsetDate(this.enrollmentEndDate.toString()),
                                DateFormats.LONG_MONTH_DAY,
                            ),
                        ),
                    );

                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.continueEnrollment"];
                this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
                break;
            case MEMBERWIZARD.CONT_NO_PLAN_ADDED: // 2 Scenario
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.ooeVoluntaryBenefits"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.ooeVoluntaryBenefitsMsg"];
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.seeMyOption"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.CONT_NEW_COMPANY_PLAN_ADDED: // 3 scenario
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.ooeNewBenefits"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.ooeVoluntaryBenefitsMsg"];
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.seeMyOption"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.CONT_NEW_CONTI_PLAN_ADDED: // 4 scenario
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.ooeNewBenefits"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.ooeNewBenefitsContinuousMsg"];
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.seeMyOption"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.CONT_NEW_COMPANY_AND_CONTI_PLAN_ADDED: // 5 scenario
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.ooeNewBenefits"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description =
                    this.languageStrings["primary.portal.enrollmentWizard.ooeNewContinuousAndCompnanyProvidedMsg"];
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.seeMyOption"];
                this.nextTab = null;
                break;
            case MEMBERWIZARD.ONLY_SEP_FIRST_VISIT:
                // Special Enrollment Period (SEP) - Scenario 6
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentBegun"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentBegunMsg"].replace(
                    "#enrollmentEndDate",
                    this.getDayWithOrdinal(
                        this.datePipe.transform(
                            this.util.getCurrentTimezoneOffsetDate(this.qleEndDate.toString()),
                            DateFormats.LONG_MONTH_DAY,
                        ),
                    ),
                );
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.updateMyCoverage"];
                this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "coverage");
                break;
            case MEMBERWIZARD.ONLY_SEP_NOT_COMPLETED:
                // Scenario 6a
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentFinish"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentFinishMsg"]
                    .replace(
                        "#currentYear",
                        this.datePipe.transform(this.util.getCurrentTimezoneOffsetDate(new Date().toString()), DateFormats.YEAR),
                    )
                    .replace(
                        "#enrollmentEndDate",
                        this.getDayWithOrdinal(
                            this.datePipe.transform(
                                this.util.getCurrentTimezoneOffsetDate(this.qleEndDate.toString()),
                                DateFormats.LONG_MONTH_DAY,
                            ),
                        ),
                    );
                this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.continueUpdates"];
                break;
            case MEMBERWIZARD.DUAL_FIRST_VISIT:
                // Dual SEP + OE - Scenerio 7
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentBegun"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.dualSepAndOeBegunMsg"]
                    .replace(
                        "#currentYear",
                        this.datePipe.transform(this.util.getCurrentTimezoneOffsetDate(Date.now().toString()), DateFormats.YEAR),
                    )
                    .replace(
                        "#enrollmentEndDate",
                        this.getDayWithOrdinal(
                            this.datePipe.transform(
                                this.util.getCurrentTimezoneOffsetDate(this.enrollmentEndDate.toString()),
                                DateFormats.LONG_MONTH_DAY,
                            ),
                        ),
                    )
                    .replace(
                        "#nextYear",
                        this.datePipe.transform(
                            this.util.getCurrentTimezoneOffsetDate(this.coverageStartDate.toString()),
                            DateFormats.YEAR,
                        ),
                    );
                this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "coverage");
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.updateYearCoverage"].replace(
                    "#currentYear",
                    this.enrollDate,
                );
                break;
            case MEMBERWIZARD.DUAL_ENROLLMENT_NOT_COMPLETED:
                // Sceneria 7a
                this.sceanrioObject.title = this.languageStrings["primary.portal.enrollmentWizard.specialEnrollmentFinish"].replace(
                    "#memberName",
                    this.memberName,
                );
                this.sceanrioObject.description = this.languageStrings["primary.portal.enrollmentWizard.dualSepAndOeFinishMsg"]
                    .replace(
                        "#currentYear",
                        this.datePipe.transform(this.util.getCurrentTimezoneOffsetDate(Date.now().toString()), DateFormats.YEAR),
                    )
                    .replace(
                        "#enrollmentEndDate",
                        this.getDayWithOrdinal(
                            this.datePipe.transform(
                                this.util.getCurrentTimezoneOffsetDate(this.enrollmentEndDate.toString()),
                                DateFormats.LONG_MONTH_DAY,
                            ),
                        ),
                    )
                    .replace(
                        "#nextYear",
                        this.datePipe.transform(
                            this.util.getCurrentTimezoneOffsetDate(this.coverageStartDate.toString()),
                            DateFormats.YEAR,
                        ),
                    );
                this.sceanrioObject.buttonTitle = this.languageStrings["primary.portal.enrollmentWizard.continueUpdates"];
                this.nextTab = this.mService.wizardTabMenu.find((x) => x.label.toLowerCase() === "shop");
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_QLE:
                if (this.isQleDuringOeEnrollment) {
                    this.setScenarioObjectForQle();
                } else {
                    this.setScenarioObjectForNewQLE(false);
                }
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_QLE_NOT_COMPLETED:
                this.setScenarioObjectForIncompleteQle();
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_OE:
                this.setScenarioObjectForOe();
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_OE_NOT_COMPLETED:
                this.setScenarioObjectForIncompleteOe();
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_NEW_PY_QLE:
                this.setScenarioObjectForNewQLE(true);
                break;
            case MEMBERWIZARD.DUAL_PLAN_YEAR_NEW_PY_QLE_NOT_COMPLETED:
                this.setScenarioObjectForIncompleteNewQLE();
                break;
        }
        this.store.dispatch(new SetScenarioObject(this.sceanrioObject));
        this.isSpinnerLoading = false;
    }
    /**
     * Check whether we have cart items
     * @param cartData Cart items array
     * @returns boolean flag as true or false
     */
    hasCartItems(cartData: GetCartItems[]): boolean {
        const memberCartItems = cartData.filter((cplan) => cplan.enrollmentMethod === "SELF_SERVICE");
        if (memberCartItems.length > 0) {
            return true;
        }
        return false;
    }
    // TO check New continous plan is added
    isNewContinousAdded(planData: PlanOfferingPanel[]): boolean {
        const lastLogin = this.dateService.toDate(this.userData[this.STR_LAST_LOGIN]);
        const newAddedPlans = planData.filter((planOff) => this.dateService.toDate(planOff.validity.effectiveStarting) >= lastLogin);
        if (newAddedPlans.length > 0) {
            return true;
        }
        return false;
    }
    // TO check New company provided plan is added
    isNewCompanyProvodedPlansAdded(planData: PlanOfferingPanel[]): boolean {
        const lastLogin = this.dateService.toDate(this.userData[this.STR_LAST_LOGIN]);
        const newCompanyAddedPlans = planData.filter(
            (planOff) =>
                this.dateService.toDate(planOff.validity.effectiveStarting) >= lastLogin &&
                planOff.plan.characteristics.findIndex((c) => c.toLowerCase() === this.STR_COMPANY_PROVIDED.toLowerCase()) !== -1,
        );
        if (newCompanyAddedPlans.length > 0) {
            return true;
        }
        return false;
    }
    /**
     * To check whether enrollment is open for given enrollment Period
     * @param enrollmentPeriod: start and end dates of an enrollment period
     * @returns boolean: true if the current date is in between the enrollment period
     */
    isEnrollementOpen(enrollmentPeriod: Validity): boolean {
        if (enrollmentPeriod) {
            const startDate = this.dateService.format(
                this.dateService.toDate(enrollmentPeriod.effectiveStarting),
                DateFormats.YEAR_MONTH_DAY,
            );
            const endDate = this.dateService.format(
                this.dateService.toDate(enrollmentPeriod.expiresAfter || Date.now()),
                DateFormats.YEAR_MONTH_DAY,
            );
            const nowDate = this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY);
            if (startDate <= nowDate && endDate >= nowDate) {
                return true;
            }
        }
        return false;
    }
    // To chech whether QLE enrollment is OPEN
    isEnrollementOpenForQLE(qleData: MemberQualifyingEvent[]): boolean {
        if (
            qleData.length > 0 &&
            qleData.findIndex((x) => x.status === this.STR_APRROVED && this.isEnrollementOpen(x.enrollmentValidity)) !== -1
        ) {
            return true;
        }
        return false;
    }
    // Check whether enrollment falls in 2 years
    checkEnrollmentInTwoYear(year1: string, year2: string): string {
        const eDate = year1 === year2 ? year1 : `${year1}-${year2}`;
        return eDate;
    }
    getDayWithOrdinal(sDate: string): string | undefined {
        if (sDate) {
            const monthDate = sDate.split(" ");
            const monthName = monthDate[0];
            const dateDay = +monthDate[1];
            const s = [
                this.languageStrings["primary.portal.enrollmentWizard.dayth"],
                this.languageStrings["primary.portal.enrollmentWizard.dayst"],
                this.languageStrings["primary.portal.enrollmentWizard.daynd"],
                this.languageStrings["primary.portal.enrollmentWizard.dayrd"],
            ];
            const v = dateDay % 100;
            return `${monthName} ${dateDay}${s[(v - 20) % 10] || s[v] || s[0]}`;
        }
        return undefined;
    }
    /**
     * @description  To check all continuous and company provided plans
     * @param planData array of all offering plans
     * @return whether plan offerings has all Continuous and Company Provided Plans
     */
    isAllContinuousAndCompanyPlan(planData: PlanOfferingPanel[]): boolean {
        const continuousAndCompanyPlans = planData.filter(
            (planOff) =>
                planOff.plan.characteristics.indexOf(Characteristics.COMPANY_PROVIDED) ||
                (planOff.taxStatus === this.STR_POSTTAX && planOff.plan.policyOwnershipType === this.appSetting.INDIVIDUAL),
        );
        return planData.length === continuousAndCompanyPlans.length;
    }

    /**
     * Function to open a dialog if member is Ineligible
     * @returns void
     */
    showInEligiableDialog(): void {
        const dialogData = {
            title: this.languageStrings["primary.portal.enrollmentWizard.headerInEligibility"],
            content:
                this.store.selectSnapshot(SharedState.getState).memberMPGroupAccount &&
                this.store.selectSnapshot(SharedState.getState).memberMPGroupAccount.partnerAccountType === "PAYROLL"
                    ? this.languageStrings["primary.portal.enrollmentWizard.header2InEligibility"]
                    : this.languageStrings["primary.portal.enrollmentWizard.header3InEligibility"],
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.enrollmentWizard.gotit"],
                buttonAction: () => {
                    this.dialog.closeAll();
                },
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.enrollmentWizard.exitShop"],
                buttonAction: () => {
                    this.router.navigate([this.STR_HOME_URL]);
                },
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    /**
     * Get all languages of Labels and Strings
     */
    getLanguages(): void {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.enrollmentWizard.policyDiscountinued",
            "primary.portal.enrollmentWizard.seeNewOption",
            "primary.portal.enrollmentWizard.welcomeEnrollement",
            "primary.portal.enrollmentWizard.nonOleMsg",
            "primary.portal.enrollmentWizard.getStarted",
            "primary.portal.enrollmentWizard.readyToFinish",
            "primary.portal.enrollmentWizard.readyToFinishMsg",
            "primary.portal.enrollmentWizard.continueEnrollment",
            "primary.portal.enrollmentWizard.ooeVoluntaryBenefits",
            "primary.portal.enrollmentWizard.ooeVoluntaryBenefitsMsg",
            "primary.portal.enrollmentWizard.ooeNewBenefits",
            "primary.portal.enrollmentWizard.ooeNewBenefitsMsg",
            "primary.portal.enrollmentWizard.ooeNewBenefitsContinuousMsg",
            "primary.portal.enrollmentWizard.ooeNewContinuousAndCompnanyProvidedMsg",
            "primary.portal.enrollmentWizard.seeMyOption",
            "primary.portal.enrollmentWizard.updateMyCoverage",
            "primary.portal.enrollmentWizard.specialEnrollmentBegun",
            "primary.portal.enrollmentWizard.specialEnrollmentBegunMsg",
            "primary.portal.enrollmentWizard.specialEnrollmentFinish",
            "primary.portal.enrollmentWizard.specialEnrollmentFinishMsg",
            "primary.portal.enrollmentWizard.continueUpdates",
            "primary.portal.enrollmentWizard.dualSepAndOeBegunMsg",
            "primary.portal.enrollmentWizard.updateYearCoverage",
            "primary.portal.enrollmentWizard.dualSepAndOeFinishMsg",
            "primary.portal.enrollmentWizard.dayth",
            "primary.portal.enrollmentWizard.dayst",
            "primary.portal.enrollmentWizard.daynd",
            "primary.portal.enrollmentWizard.dayrd",
            "primary.portal.enrollmentWizard.gotit",
            "primary.portal.enrollmentWizard.exitShop",
            "primary.portal.enrollmentWizard.headerInEligibility",
            "primary.portal.enrollmentWizard.header2InEligibility",
            "primary.portal.enrollmentWizard.header3InEligibility",
            "primary.portal.members.coverage.dualPlanYear.shopCoverage",
            "primary.portal.members.coverage.dualPlanYear.updateCoverage",
            "primary.portal.members.wizard.dualPlanYear.welcomeLifeEventEnrollment",
            "primary.portal.members.wizard.dualPlanYear.updateCoverage",
            "primary.portal.members.wizard.dualPlanYear.welcomeOpenEnrollment",
            "primary.portal.members.wizard.dualPlanYear.shopCoverage",
            "primary.portal.members.wizard.dualPlanYear.readyEnrollment",
            "primary.portal.members.wizard.dualPlanYear.enrollmentInProgress",
            "primary.portal.members.wizard.dualPlanYear.continueEnrollment",
            "primary.portal.members.wizard.dualPlanYear.readyCoverage",
            "primary.portal.members.wizard.dualPlanYear.coverageInProgress",
            "primary.portal.members.wizard.dualPlanYear.continueCoverage",
            "primary.portal.members.coverage.dualPlanYear.eventEnrollment",
            "primary.portal.members.coverage.dualPlanYear.eventEnrollment.current",
            "primary.portal.members.coverage.dualPlanYear.eventEnrollment.future",
            "primary.portal.memberHome.dualPlanYear.updateCoverage.current",
            "primary.portal.member.wizard.dualPlanYear.updateCoverage.future",
            "primary.portal.members.coverage.dualPlanYear.enrollmentOpen",
            "primary.portal.noCoverage.dualPlanYear.continueEnrollment",
            "primary.portal.members.wizard.dualPlanYear.readyNewPYCoverage",
            "primary.portal.members.wizard.dualPlanYear.newPYCoverageInProgress",
            "primary.portal.members.wizard.dualPlanYear.currentPYCoverageInProgress",
            "primary.portal.shoppingExperience.exitTitle",
            "primary.portal.shoppingExperience.exitContent",
            "primary.portal.brandingModalExit.buttonExit",
            "primary.portal.brandingModalExit.buttonCancel",
        ]);
    }

    /**
     * Function to configure All Api calls in a array , Return type Observable of any as there are different type of response from all API
     * @returns Observable<any>[]
     */
    configureApiArray(): Observable<any>[] {
        const apiArray: Observable<any>[] = [];
        const referenceDate = this.dualPlanYearService.getReferenceDate();
        const enrollmentMethod = this.isSelfEnrollment ? EnrollmentMethod.FACE_TO_FACE : EnrollmentMethod.SELF_SERVICE;
        apiArray.push(this.mService.getMemberDependents(this.userData.memberId, true, this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(this.accountService.getDependentRelations(this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(this.mService.getMember(this.userData.memberId, true, this.userData.groupId.toString()).pipe(map((data) => data)));
        apiArray.push(this.eService.getEnrollments(this.userData.memberId, this.userData.groupId, "").pipe(map((data) => data)));
        apiArray.push(this.shoppingService.getProductOfferingsSorted(this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(
            this.shoppingService
                .getPlanOfferings(
                    null,
                    enrollmentMethod,
                    this.userData[this.STR_CONTACT].address.state,
                    {},
                    this.userData.memberId,
                    this.userData.groupId,
                    "",
                    referenceDate,
                )
                .pipe(map((data) => data))
                .pipe(
                    catchError((error) => {
                        if (
                            error.status !== ClientErrorResponseCode.RESP_400 ||
                            error.error.language?.languageTag !== "error.detail.displayText.getPlanOfferings.400.member.tooOld"
                        ) {
                            return of([]);
                        }
                        return this.shoppingService
                            .clearShoppingCart(this.userData.memberId, this.userData.groupId, false)
                            .pipe(map(() => []));
                    }),
                ),
        );
        apiArray.push(this.benefitOffService.getPlanYears(this.userData.groupId, false).pipe(map((data) => data)));
        apiArray.push(this.mService.getMemberQualifyingEvents(this.userData.memberId, this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(this.eService.searchMemberEnrollments(this.userData.memberId, this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(this.benefitOffService.getPlanChoices(false, false, this.userData.groupId).pipe(map((data) => data)));
        apiArray.push(
            this.shoppingService
                .getCartItems(this.userData.memberId, this.userData.groupId, "planOfferingId", this.planYearId)
                .pipe(map((data) => data)),
        );
        return apiArray;
    }
    checkRouteForAppFlow(url: string): void {
        if (url.indexOf(this.fullmemberAppFlow) !== -1) {
            this.showNav = false;
        } else {
            this.showNav = true;
        }
    }
    /** *
     * Method to open modal for user to confirm the exit from the page
     * @returns void
     */
    openAlert(): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.shoppingExperience.exitTitle"],
            content: this.languageStrings["primary.portal.shoppingExperience.exitContent"],
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.brandingModalExit.buttonExit"],
                buttonAction: this.onAlertConfirm.bind(this, true),
                buttonClass: "mon-btn-primary",
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.brandingModalExit.buttonCancel"],
                buttonAction: this.onAlertConfirm.bind(this, false),
            },
        };
        this.empoweredModal.openDialog(MonDialogComponent, {
            data: dialogData,
        });
    }
    /** *
     * canDeactivate method to decide whether to trigger the exit confirmation popup.
     * @param nextState: object of type RouterStateSnapshot which contains information on the next state(for eg. url)
     * @returns Observable<boolean> OR boolean which decides whether user can exit/change this view/page or not.
     */
    @HostListener("window:beforeunload")
    canDeactivate(nextState?: RouterStateSnapshot): Observable<boolean> | boolean {
        if (!this.isTpi && (nextState || ({} as RouterStateSnapshot)).url.includes("/home")) {
            this.location.replaceState(this.router.url);
            this.openAlert();
            return this.allowNavigation$.asObservable();
        }
        this.allowNavigation$.next(true);
        this.allowNavigation$.complete();
        return of(true);
    }
    /** *
     * onAlertConfirm method to set exit popup status.
     * @params flag which is of boolean type, which is the user response on the exit popup
     * @returns void
     */
    onAlertConfirm(flag: boolean): void {
        if (flag) {
            if (this.userData.memberId && this.userData.groupId) {
                this.allSubscriptions.push(
                    this.shoppingService
                        .getShoppingCart(this.userData.memberId, this.userData.groupId, this.planYearId)
                        .pipe(
                            filter((response) => response.productOfferingsInCart.length > 0),
                            switchMap(() => this.shoppingService.releaseShoppingCartLock(this.userData.memberId, this.userData.groupId)),
                            finalize(() => {
                                this.allowNavigation$.next(flag);
                                this.allowNavigation$.complete();
                            }),
                        )
                        .subscribe(),
                );
            }
            this.store.dispatch(new SetExitPopupStatus(false));
        }
    }

    /**
     * Method to display company provided plans based on conditions
     * @param data: Enrollment needs to be checked
     * @param cartItems: List of cart items to check enrollment is in cart
     * @param isEnrollmentOpenFlag TRUE if plan year is in OE else FALSE
     * @returns TRUE if plan needs to be displayed else false
     */
    displayCompanyProvidedPlans(data: Enrollments, cartItems: GetCartItems[], isEnrollmentOpenFlag: boolean): boolean {
        let display = true;
        if (
            data.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
            data.plan.characteristics.includes(Characteristics.AUTOENROLLABLE)
        ) {
            const item = cartItems.find((cartItem) => cartItem.enrollmentId === data.id);
            display = !item || !isEnrollmentOpenFlag;
        }
        return display;
    }

    /**
     * Method to get current state company code for carriers
     * @returns string: current state company code
     */
    getCurrentStateCompanyCode(): string {
        let stateCode: string;
        const currentState = this.store.selectSnapshot(MemberWizardState.GetCurrentState);
        if (currentState?.userData) {
            stateCode = currentState?.userData?.contact?.address.state === CompanyCode.NY ?
                CompanyCode.NY :
                null;
        } else {
            stateCode = currentState?.coverageData[0]?.state === CompanyCode.NY ?
                CompanyCode.NY :
                null;
        }
        return stateCode;
    }

    /**
     * @description clears subscription and releases cart lock on component destruction
     * @memberof WizardLandingComponent
     */
    ngOnDestroy(): void {
        this.shoppingService.releaseShoppingCartLock(this.userData.memberId, this.userData.groupId).pipe(first()).subscribe();
        this.allSubscriptions.forEach((sub) => sub.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
