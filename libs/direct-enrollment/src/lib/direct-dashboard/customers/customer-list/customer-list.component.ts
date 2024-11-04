import {
    Component,
    OnInit,
    ViewChild,
    AfterViewInit,
    Input,
    OnChanges,
    Output,
    EventEmitter,
    OnDestroy,
    SimpleChanges,
} from "@angular/core";
import { MemberService, StaticService, State, MemberListDisplayItem, AccountService } from "@empowered/api";
import { ConfirmAddressDialogComponent, EnrollmentMethodComponent } from "@empowered/ui";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription, Subject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { AddCustomerComponent } from "../add-customer/add-customer.component";
import { LanguageService } from "@empowered/language";
import { takeUntil, filter } from "rxjs/operators";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
    SHOP_SUCCESS,
    AppSettings,
    EnrollmentMethod,
    MemberListItem,
    MemberListProduct,
    MemberListDependent,
    AbstractNotificationModel,
    ContactType,
} from "@empowered/constants";
import { EmpoweredPaginatorComponent } from "@empowered/ui";

import {
    AddAccountInfo,
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    SetDateFilterInfo,
    EnrollmentMethodModel,
    EnrollmentMethodStateModel,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

// Component level constants
const NY_ABBR = "NY";
const PRODUCT_COST_PRECISION = 2;
const NOTIFICATION_COUNT = "notificationCount";

interface CustomerListTableDataSource {
    id: number;
    name: string;
    coverageNameList: string[];
    dependents: MemberListDependent[];
    phoneNumber: string;
    email: string;
    products: MemberListProduct;
    hasPending: boolean;
    matTooltipContent: SafeHtml;
    notifications: AbstractNotificationModel[];
    notificationSum: number;
}
@Component({
    selector: "empowered-customer-list",
    templateUrl: "./customer-list.component.html",
    styleUrls: ["./customer-list.component.scss"],
})
export class CustomerListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    // TODO: This property doesn't exist for this Component,
    // but this property is expected to exist for its template. This logic requires a refactor
    activeCol?: string;
    @ViewChild(EmpoweredPaginatorComponent, { static: true }) paginator: EmpoweredPaginatorComponent;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    policyText: string;
    customerList: CustomerListTableDataSource[] = [];
    @Output() removeCustomer = new EventEmitter();
    @Input() customers: MemberListItem[];
    @Input() countExceedsMaximum: boolean;
    dataSource = new MatTableDataSource<CustomerListTableDataSource>();
    onInit = true;
    mpGroup: number;
    displayedColumns = ["name", "coverage", "dependents", "phoneNumber", "email", "notificationCount", "manage", "shop"];
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    enrollmentState: EnrollmentMethodStateModel;
    EnrollmentDialogRef: MatDialogRef<EnrollmentMethodComponent>;
    directStateAbbr: string;
    subscriptions: Subscription[] = [];
    unpluggedFeatureFlag: boolean;
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.direct.customerList.name",
        "primary.portal.direct.customerList.coverage",
        "primary.portal.direct.customerList.dependents",
        "primary.portal.direct.customerList.phoneNumber",
        "primary.portal.direct.customerList.manage",
        "primary.portal.direct.customerList.emailAdress",
        "primary.portal.direct.customerList.getNotificationDetails",
        "primary.portal.direct.customerList.shop",
        "primary.portal.direct.customerList.noResultsFound",
        "primary.portal.direct.customerList.showingResults",
        "primary.portal.customerList.paginator.customersPerPage",
        "primary.portal.customerList.paginator.customers",
        "primary.portal.common.remove",
        "primary.portal.common.page",
        "primary.portal.customerList.paginator.of",
        "primary.portal.direct.policy",
        "primary.portal.direct.policies",
        "primary.portal.notification.count",
        "primary.portal.qle.pendingText",
        "primary.portal.direct.policy",
        "primary.portal.direct.policies",
    ]);
    storedState: State[] = [];

    constructor(
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly matDialog: MatDialog,
        private readonly utilService: UtilService,
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly domSanitizer: DomSanitizer,
        private readonly staticUtil: StaticUtilService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * Initializing all variables and updating table columns based on configuration values
     * @returns Nothing
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.staticUtil
                .cacheConfigEnabled("general.feature.notifications.enable")
                .pipe(filter((res) => !res))
                .subscribe(() => {
                    this.displayedColumns = this.displayedColumns.filter((data) => data !== NOTIFICATION_COUNT);
                }),
        );
        this.unpluggedFeatureFlag = false;
        this.checkForUnpluggedFeature();
        this.mpGroup = this.route.snapshot.params.mpGroupId;
        this.mapDataToTable();
        this.directStateAbbr = this.store.selectSnapshot(EnrollmentMethodState.getDirectUserStateAbbr);
        // reset the filter info store if different account is selected
        const filterInfo = this.store.selectSnapshot(EnrollmentMethodState.getDateFilterInfo);
        if (filterInfo && filterInfo.mpGroup !== this.mpGroup) {
            this.store.dispatch(new SetDateFilterInfo(null));
        }
        this.setAccountInfoToStore();
    }
    /**
     * Assigning configuration value to unpluggedFeatureFlag variable
     * @returns Nothing
     */
    checkForUnpluggedFeature(): void {
        this.subscriptions.push(
            this.staticService.getConfigurations(AppSettings.UNPLUGGED_CONFIG).subscribe((configs) => {
                this.unpluggedFeatureFlag = configs.length && configs[0].value.toLowerCase() === "true";
            }),
        );
    }

    mapDataToTable(): void {
        this.updateCustomerList();
        this.dataSource.data = this.customerList;
    }

    /**
     * Life cycle hook called after view init used to initialize paginator and sort to data source
     */
    ngAfterViewInit(): void {
        if (this.paginator) {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
                if (sortHeaderId === "coverage") {
                    return data.coverageNameList.length;
                }
                if (sortHeaderId === "notificationCount") {
                    return data.notifications.length;
                }
                return typeof data[sortHeaderId] === "string" ? data[sortHeaderId].toLowerCase() : data[sortHeaderId];
            };
            this.onInit = false;
        }
    }

    routeToCustomerDashboard(customer: any): void {
        this.store.dispatch(new SetMemberIdentity(customer.id));
        this.store.dispatch(new SetMemberInfo(customer));
        this.router.navigate([`./${customer.id}/memberadd`], {
            relativeTo: this.route,
            queryParamsHandling: "preserve",
        });
    }

    addCustomer(): void {
        this.empoweredModalService.openDialog(AddCustomerComponent, {
            minWidth: "100%",
            height: "100%",
        });
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.customers?.currentValue) {
            this.updateCustomerList();
            this.dataSource.data = this.customerList;
        }
    }
    updateCustomerList(): void {
        this.customerList = [];
        this.customers.forEach((customer) => {
            if (customer.products?.names.split(",").length > 1) {
                this.policyText = `${customer.products.names.split(",").length} ${this.languageStrings["primary.portal.direct.policies"]}`;
            } else if (!customer.products) {
                this.policyText = "";
            } else {
                this.policyText = `${customer.products.names.split(",").length} ${this.languageStrings["primary.portal.direct.policy"]}`;
            }
            const hasPending = Boolean(customer.products?.pendingProducts);
            let coverageNameList = [];
            if (customer.products?.names) {
                coverageNameList = customer.products?.names?.split(",");
            }
            let pendingItemsList = [];
            if (customer.products?.pendingProducts) {
                pendingItemsList = customer.products?.pendingProducts?.split(",");
            }
            let coverageNameListForToolTip = [];
            if (coverageNameList) {
                coverageNameListForToolTip = coverageNameList.map((product) => {
                    let iconMkp = "";
                    if (pendingItemsList?.includes(product)) {
                        iconMkp = "<img class='icon-warning' src='assets/svgs/warning-triangle-yellow.svg' >" + " ";
                    }
                    return `${iconMkp}${product}`;
                });
            }
            const totalCost = customer.products?.totalCost || 0;
            const matTooltipContent = this.domSanitizer.bypassSecurityTrustHtml(
                `$${totalCost.toFixed(PRODUCT_COST_PRECISION)} <br><br> ${coverageNameListForToolTip.join(", ")}`,
            );

            // TODO : Add customer emailAdress, phoneNumber, coverage
            this.customerList.push({
                id: customer.id,
                coverageNameList: coverageNameList,
                products: customer.products,
                dependents: customer.dependents,
                email: customer.email,
                name: `${customer.lastName}, ${customer.firstName}`,
                phoneNumber: customer.phoneNumber,
                hasPending: hasPending,
                matTooltipContent: matTooltipContent,
                notifications: customer.notifications,
                notificationSum: customer.notificationSum ?? 0,
            });
        });
    }
    navigateToSpecificShop(customerId: number): void {
        this.router.navigate([`./${customerId}/enrollment/quote-shop/${this.mpGroup}/specific/${customerId}`], {
            relativeTo: this.route,
            queryParamsHandling: "preserve",
        });
    }

    /**
     * Set account data to store
     */
    setAccountInfoToStore(): void {
        this.accountService
            .getAccount(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.store.dispatch(
                    new AddAccountInfo({
                        accountInfo: response,
                        mpGroupId: this.mpGroup.toString(),
                    }),
                );
            });
    }

    specificShopNav(details: any): void {
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (details.id) {
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(details.id));
            this.store.dispatch(new SetMemberInfo(details));
            // eslint-disable-next-line max-len
            if (
                !(
                    this.specificEnrollmentObj &&
                    (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                    this.specificEnrollmentObj.mpGroup &&
                    this.specificEnrollmentObj.mpGroup === this.mpGroup &&
                    this.visitedMpGroupStateObj.indexOf(this.mpGroup.toString()) >= 0
                )
            ) {
                this.EnrollmentDialogRef = this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                    data: {
                        mpGroup: this.mpGroup,
                        detail: details,
                        route: this.route,
                        stateAbbr: this.directStateAbbr,
                    },
                });
            } else {
                const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                if (
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                ) {
                    this.memberService
                        .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((result) => {
                            if (result) {
                                if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                    this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroup,
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
                        .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
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
                                            mpGroup: this.mpGroup,
                                            detail: details,
                                            route: this.route,
                                            stateAbbr: result.body.address.state,
                                        },
                                    });
                                } else {
                                    if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(true);
                                    } else {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(false);
                                    }
                                    this.store.dispatch(new SetMemberIdentity(details.id));
                                    this.store.dispatch(new SetMemberInfo(details));
                                    const residentState = this.storedState.find(
                                        (state) => state.abbreviation === result.body.address.state,
                                    );
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentCity: currentEnrollmentObj.enrollmentCity,
                                            enrollmentState: currentEnrollmentObj.enrollmentState,
                                            headSetState: residentState ? residentState.name : undefined,
                                            headSetStateAbbreviation: result.body.address.state,
                                            enrollmentStateAbbreviation: currentEnrollmentObj.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                        }),
                                    );
                                    this.navigateToSpecificShop(details.id);
                                }
                            }
                        });
                }
            }
        }
    }
    getNotificationToolTipContent(notifications: any): any {
        return this.utilService.getNotificationToolTip(notifications, "notificationToolTip");
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - member details with member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: MemberListDisplayItem, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.empoweredModalService.openDialog(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroup, purpose: "shop" },
        });
        confirmAddressDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    this.navigateToSpecificShop(details.id);
                }
            });
    }
    /**
     * Destroying all subscriptions
     * @returns Nothing
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
