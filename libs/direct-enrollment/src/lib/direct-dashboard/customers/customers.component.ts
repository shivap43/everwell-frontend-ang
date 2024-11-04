import { ConfigName, MemberListItem, MemberListProduct, AbstractNotificationModel, ProducerCredential } from "@empowered/constants";
import { finalize, debounceTime, switchMap, tap, map, shareReplay, filter, switchMapTo, take } from "rxjs/operators";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { AddCustomerComponent } from "./add-customer/add-customer.component";
import { MemberService, SearchMembers } from "@empowered/api";
import { ActivatedRoute, Router } from "@angular/router";
import { Select, Store } from "@ngxs/store";

import { EmpoweredModalService } from "@empowered/common-services";
import { EMPTY, Observable, Subject, Subscription, combineLatest, of } from "rxjs";
import { FormControl } from "@angular/forms";
import { RemoveCustomerComponent } from "./remove-customer/remove-customer.component";
import { AccountInfoState, SharedState, RegexDataType, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";

const SEARCH_DEBOUNCE_TIME = 1000;

@Component({
    selector: "empowered-customers",
    templateUrl: "./customers.component.html",
    styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit, OnDestroy {
    @ViewChild("CoverageFilter") coverageFilter;
    @ViewChild("NotificationsFilter") notificationsFilter;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.customer.title",
        "primary.portal.customer.zeroStateMsg",
        "primary.portal.customer.addCustomer",
        "primary.portal.customer.quote",
        "primary.portal.customer.searchCustomers",
        "primary.portal.customer.customerSearchHint",
        "primary.portal.customer.filters",
        "primary.portal.customer.coverage",
        "primary.portal.customer.customerRemoveDescription",
        "primary.portal.customer.allBenefits",
        "primary.portal.customer.all",
        "primary.portal.customer.noBenefits",
        "primary.portal.customer.notifications",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.common.close",
    ]);
    customers: SearchMembers;
    customersToDisplay: MemberListItem[];
    isSpinnerLoading = false;
    addCustomerScreenFlag = true;
    mpGroup;
    coverageConst = "COVERAGE";
    notificationsConst = "NOTIFICATIONS";
    customerCoverageProducts: string[] = [];
    selectedCoverageFilterOptions;
    selectedNotificationFilterOptions: AbstractNotificationModel[];
    coverageFilterStatusDisplayOptions;
    customerNotifications: AbstractNotificationModel[] = [];
    customerToRemove: MemberListItem;
    notificationsFilterStatusDisplayOptions;
    disableCoverageProducts = false;
    disableOptionNoBenefits = false;
    filterClassNames = {
        coverage: ["list-grid-filter", "filter-coverage-notification"],
        notification: ["list-grid-filter", "filter-notification"],
    };
    allCustomersResponse: SearchMembers;
    subscriptions: Subscription[] = [];
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    regex: RegexDataType;
    maxNumberOfRowsToBeShown: number;
    searchControl: FormControl = new FormControl("", { updateOn: "change" });
    maxNumberOfRowsToBeShown$ = this.staticUtil.cacheConfigValue(ConfigName.MAX_NUMBER_OF_CUSTOMERS).pipe(
        map((stringified) => +stringified),
        tap((maxRows) => (this.maxNumberOfRowsToBeShown = maxRows)),
        shareReplay(1),
    );
    hasPermissionToAccount: boolean;
    errorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly matDialog: MatDialog,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly staticUtil: StaticUtilService,
        private readonly modal: EmpoweredModalService,
        private readonly store: Store,
        private readonly notificationQueueService: NotificationQueueService,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
    ) {}

    /**
     * Initializes necessary variables, regEx, and data
     */
    ngOnInit(): void {
        this.hasPermissionToAccount = this.store.selectSnapshot(AccountInfoState.getPermissionToAccount);
        if (this.hasPermissionToAccount) {
            this.mpGroup = this.route.snapshot.params.mpGroupId;
            this.isSpinnerLoading = true;
            this.subscriptions.push(
                this.regex$.subscribe((regex) => {
                    this.regex = regex;
                }),
                this.searchControl.valueChanges
                    .pipe(
                        debounceTime(SEARCH_DEBOUNCE_TIME),
                        switchMap((key) => this.searchCustomers(key)),
                    )
                    .subscribe((customers) => {
                        this.customersToDisplay = customers;
                    }),
                this.getCustomers().subscribe(),
            );
        } else {
            this.isSpinnerLoading = false;
            this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.sorryPermissionDenied");
        }
    }

    /**
     * Opens the 'add customer' modal
     */
    addCustomer(): void {
        const matDialogRef = this.matDialog.open(AddCustomerComponent, {
            minWidth: "100%",
            height: "100%",
            data: {
                mpGroup: this.mpGroup,
            },
        });
        this.subscriptions.push(
            matDialogRef
                .afterClosed()
                .pipe(filter(Boolean))
                .subscribe((memberId: string) => {
                    this.navigateToCustomerDashboard(memberId);
                }),
        );
    }

    /**
     * Gets customers (all or those specified by searchParams)
     * @param searchParams object with 'filter' and 'search' as keys, that need to be passed as queryParams to the search call
     * @returns observable of a list of customers
     */
    getCustomers(searchParams: { filter?: string; search?: string } = {}): Observable<MemberListItem[]> {
        const INITIAL_PAGE_NUMBER = 1;
        const noSearchParams = !(searchParams && Object.keys(searchParams).length);

        const notificationWSData$ = this.userService.credential$.pipe(
            switchMap((credential: ProducerCredential) => (credential.producerId ? of(credential.producerId) : EMPTY)),
            take(1),
            switchMap((producerId) => this.notificationQueueService.getMemberListNotifications(producerId, this.mpGroup)),
        );
        return this.maxNumberOfRowsToBeShown$.pipe(
            switchMap((maxNumberOfRowsToBeShown) =>
                this.memberService.searchMembers({
                    payload: this.mpGroup,
                    searchHeaderObj: {
                        page: INITIAL_PAGE_NUMBER,
                        size: maxNumberOfRowsToBeShown,
                        ...searchParams,
                    },
                }),
            ),
            tap((customersResponse) => {
                if (noSearchParams) {
                    this.allCustomersResponse = customersResponse;
                }
                this.customers = customersResponse;
            }),
            map((customersResponse) => customersResponse.content),
            tap((customers) => {
                this.customersToDisplay = customers;
                if (customers.length && noSearchParams) {
                    this.customerCoverageProducts = this.getCoverageFilterOptions();
                    this.addCustomerScreenFlag = false;
                }
                this.isSpinnerLoading = false;
            }),
            // There are chances of below switchMap not emitting at all
            switchMap((customers) => combineLatest([of(customers), notificationWSData$])),
            map(([customers, notifications]) => {
                if (notifications && Object.keys(notifications).length) {
                    for (const customerId in notifications) {
                        if (Object.prototype.hasOwnProperty.call(notifications, customerId)) {
                            const customerIndex = customers.findIndex((customer) => customer.id === +customerId);
                            if (customerIndex !== -1) {
                                customers[customerIndex].notifications = notifications[customerId] ?? [];
                                customers[customerIndex].notificationSum = notifications[customerId].length ?? [];
                            }
                        }
                    }
                }
                return customers;
            }),
            tap((customers) => {
                if (customers.length && noSearchParams) {
                    this.customerNotifications = this.getNotificationFilterOptions();
                }
                this.customersToDisplay = this.utilService.copy(customers);
                if (noSearchParams) {
                    this.allCustomersResponse.content = this.utilService.copy(customers);
                }
                this.customers.content = this.utilService.copy(customers);
            }),
        );
    }
    getCoverageFilterOptions(): string[] {
        const products: MemberListProduct[] = [];
        this.customers.content.forEach((customer) => {
            if (customer.products) {
                products.push(customer.products);
            }
        });
        return Array.from(new Set(products.map((product) => product.names.split(",")).flat()));
    }
    /**
     * Generates a list of unique notifications from a list of customers to populate filter
     * @returns array of notifications with duplicates eliminated
     */
    getNotificationFilterOptions(): AbstractNotificationModel[] {
        return this.customers.content
            .map((customer) => customer.notifications)
            .reduce(
                (accumulator, current) => [
                    ...accumulator,
                    ...current.filter((currValue) => !accumulator.map((accValue) => accValue.code.code).includes(currValue.code.code)),
                ],
                [],
            );
    }

    /**
     * Searches customer records by the specified key which can be the customer's name/email/phone
     * @param key search key
     * @returns observable of the resulting list of members
     */
    searchCustomers(key: string): Observable<MemberListItem[]> {
        if (this.allCustomersResponse.totalElements > this.maxNumberOfRowsToBeShown) {
            return this.getCustomers(key.trim() ? { filter: this.getFilterText() } : undefined);
        }
        return of(
            this.customers.content.filter(
                (customer) =>
                    (customer.email && customer.email.toUpperCase().includes(key.trim().toUpperCase())) ||
                    (customer.firstName + customer.lastName).toUpperCase().includes(key.trim().toUpperCase()) ||
                    (customer.phoneNumber && customer.phoneNumber.includes(key.trim())),
            ),
        );
    }

    /**
     * Handles filter submission
     * @param filter identifies the type of the filter
     */
    onFilterApply(filterValue: string): void {
        if (filterValue === this.coverageConst) {
            this.coverageFilter.close();
            this.coverageFilterStatusDisplayOptions = this.selectedCoverageFilterOptions;
            if (this.allCustomersResponse.totalElements > this.maxNumberOfRowsToBeShown) {
                this.subscriptions.push(
                    this.getCustomers({
                        filter: this.getFilterText(),
                    }).subscribe(),
                );
            } else {
                this.filterByCoveredProducts();
            }
        }
        if (filterValue === this.notificationsConst) {
            this.notificationsFilter.close();
            this.notificationsFilterStatusDisplayOptions = this.selectedNotificationFilterOptions;
            if (this.allCustomersResponse.totalElements > this.maxNumberOfRowsToBeShown) {
                this.subscriptions.push(
                    this.getCustomers({
                        filter: this.getFilterText(),
                    }).subscribe(),
                );
            }
            this.filterByNotifications();
        }
    }
    filterByCoveredProducts(): void {
        if (this.selectedCoverageFilterOptions.length === 0) {
            this.customersToDisplay = this.customers.content;
        } else {
            this.customersToDisplay = this.customers.content.filter((customer) => {
                let flagToReturn = false;
                this.selectedCoverageFilterOptions.forEach((product) => {
                    if (product && customer.products?.names.split(",").indexOf(product) >= 0) {
                        flagToReturn = true;
                    } else if (product === "None" && customer.products?.names.split(",").length === 0) {
                        flagToReturn = true;
                    } else if (product === "All" && customer.products?.names.split(",").length === this.customerCoverageProducts.length) {
                        flagToReturn = true;
                        // un-comment after business clarifications
                        // this.selectedCoverageFilterOptions = [...this.customerCoverageProducts];
                        // this.selectedCoverageFilterOptions.push("All");
                    }
                });
                return flagToReturn;
            });
        }
    }
    /**
     * This method is triggered whenever the mat-option value changes
     */
    coverageOptionSelect(): void {
        if (this.selectedCoverageFilterOptions.length === 0) {
            this.disableCoverageProducts = false;
            this.disableOptionNoBenefits = false;
        } else if (this.selectedCoverageFilterOptions.length > 0 && this.selectedCoverageFilterOptions.includes("None")) {
            this.disableCoverageProducts = true;
            this.disableOptionNoBenefits = false;
        } else {
            this.disableCoverageProducts = false;
            this.disableOptionNoBenefits = true;
        }
    }

    /**
     * Filters customer list by notification codes selected
     */
    filterByNotifications(): void {
        this.customersToDisplay = this.customers.content.filter(
            (customer) =>
                this.selectedNotificationFilterOptions.length === 0 ||
                customer.notifications
                    .map((notification) => notification.code.code)
                    .reduce(
                        (accumulator, current) =>
                            accumulator ||
                            this.selectedNotificationFilterOptions.map((notification) => notification.code.code).includes(current),
                        false,
                    ),
        );
    }

    /**
     * Opens remove confirmation dialog and deletes record if 'remove' is clicked
     * @param customerId customer's ID
     */
    removeCustomerAndUpdateCustomerList(customerId: number): void {
        const customerToRemove: MemberListItem = this.customersToDisplay.find((customer) => customer.id === customerId);
        this.subscriptions.push(
            this.modal
                .openDialog(RemoveCustomerComponent, {
                    data: { name: `${customerToRemove.firstName} ${customerToRemove.lastName}` },
                })
                .afterClosed()
                .pipe(
                    filter(Boolean),
                    tap(() => (this.isSpinnerLoading = true)),
                    switchMapTo(this.memberService.deleteMember(this.mpGroup, customerId)),
                    switchMapTo(this.getCustomers()),
                    finalize(() => (this.isSpinnerLoading = false)),
                )
                .subscribe(),
        );
    }

    /**
     * This method is triggered on click of clear button in the coverage filter
     * @param onResetFilter indicates the filter to be reset
     */
    onReset(filterValue: string): void {
        if (filterValue === this.coverageConst) {
            this.selectedCoverageFilterOptions = [];
            this.coverageOptionSelect();
            this.customersToDisplay = this.customers.content;
            this.coverageFilterStatusDisplayOptions = [];
            this.coverageFilter.close();
        }
        if (filterValue === this.notificationsConst) {
            this.selectedNotificationFilterOptions = [];
            this.notificationsFilterStatusDisplayOptions = [];
            this.customersToDisplay = this.customers.content;
            this.notificationsFilter.close();
        }
        const filterText = this.getFilterText();
        if (this.allCustomersResponse.totalElements > this.maxNumberOfRowsToBeShown) {
            this.subscriptions.push(this.getCustomers(filterText ? { filter: filterText } : null).subscribe());
        }
    }
    selectAllProducts(): void {
        this.selectedCoverageFilterOptions = this.customerCoverageProducts;
    }

    /**
     * Routes to the member's dashboard
     * @param memberId customer's ID
     */
    navigateToCustomerDashboard(memberId: string): void {
        this.router.navigate([`./${memberId}/memberadd`], {
            relativeTo: this.activatedRoute,
            queryParamsHandling: "preserve",
        });
    }

    /**
     * Generates the filter text that needs to be passed to the search endpoint.
     * This is generally used when 'totalElements' is greater than some threshold value.
     * Pipe is used to separate different property/value pairs;
     * colon is used to specify the values assigned to a property;
     * comma is used to separate values that will be ORed.
     * Usage example: 'property1:value1,value2|property2:value3'
     * @returns the filter text
     * */
    getFilterText(): string {
        const filters = [];
        const VALUE_SEPARATOR = ",";
        if (this.searchControl.value) {
            filters.push(this.getSearchFilterValue());
        }
        if (this.coverageFilterStatusDisplayOptions && this.coverageFilterStatusDisplayOptions.length) {
            filters.push(`products:${this.selectedCoverageFilterOptions.join(VALUE_SEPARATOR)}`);
        }
        if (this.notificationsFilterStatusDisplayOptions && this.notificationsFilterStatusDisplayOptions.length) {
            const notificationOptions = this.selectedNotificationFilterOptions.map((option) => option.code.id).join(VALUE_SEPARATOR);
            filters.push(`notifications:${notificationOptions}`);
        }
        return filters.join("|");
    }

    /**
     * Determines the type of text (name/phone/email) from the search input and generates the filter text value
     * @returns the filter text
     */
    getSearchFilterValue(): string {
        let filterValue: string;
        const key = this.searchControl.value;
        const ALL_DIGITS = /^\d+$/;
        if (key.match(ALL_DIGITS)) {
            filterValue = `phone:${key}`;
        } else if (key.match(new RegExp(this.regex.EMAIL))) {
            filterValue = `emailAddresses:${key}`;
        } else {
            filterValue = `firstName:${key}|lastName:${key}`;
        }
        return filterValue;
    }
    /**
     * Cleans up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
