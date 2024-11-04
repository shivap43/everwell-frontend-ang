import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy, ElementRef, Injector, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { DataFilter } from "@empowered/ui";
import { DatePipe } from "@angular/common";
import { Store, Select } from "@ngxs/store";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import { Router, ActivatedRoute } from "@angular/router";
import { PolicyChangeRequestStatus, PolicyChangeRequestService, PolicyTransactionForms, AccountService } from "@empowered/api";
import { Subscription, of, Observable, Subject, combineLatest } from "rxjs";
import { PolicyChangeRequestViewComponent } from "../policy-change-request-view/policy-change-request-view.component";
import { PolicyChangeRequestComponent } from "../policy-change-request.component";
import { NgxMaskPipe } from "ngx-mask";
// TODO: PortalInjector is deprecated
// Switch to Injector.create or use the following resources to refactor:
// https://github.com/angular/material.angular.io/issues/701
// https://github.com/angular/angular/issues/35548#issuecomment-588551120
import { PortalInjector, ComponentPortal } from "@angular/cdk/portal";
import { OverlayPositionBuilder, Overlay, OverlayRef, OverlayConfig } from "@angular/cdk/overlay";
import { MoreFilterComponent } from "../more-filter/more-filter.component";
import { CONTAINER_DATA } from "../container-data";
import { RouterState, RouterStateModel } from "@ngxs/router-plugin";
import { pluck, filter, tap, catchError, switchMap, map } from "rxjs/operators";
import {
    ClientErrorResponseCode,
    DateFormats,
    PolicyChangeRequestList,
    AppSettings,
    ConfigName,
    PartnerAccountType,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import {
    AccountListState,
    AccountTypes,
    BreakpointData,
    BreakPointUtilService,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { SharedService } from "@empowered/common-services";

const CUSTOMER_ID = "customerId";
const MP_GROUP_ID = "mpGroupId";

@Component({
    selector: "empowered-policy-change-request-list",
    templateUrl: "./policy-change-request-list.component.html",
    styleUrls: ["./policy-change-request-list.component.scss"],
    providers: [DataFilter, DatePipe],
})
export class PolicyChangeRequestListComponent implements OnInit, AfterContentInit, OnDestroy {
    @ViewChild("statusFilterDropdown") statusFilterDropdown: MatSelect;
    @ViewChild("accountFilterDropdown") accountFilterDropdown: MatSelect;
    @ViewChild("dateSubmittedFilterDropdown") dateSubmittedFilterDropdown: MatSelect;
    @ViewChild(MatPaginator, { static: true }) matPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) matSort: MatSort;
    @ViewChild("moreFilterOrigin") moreFilterOrigin: ElementRef;

    PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>;
    forMobileDevices = false;
    forMediumDevices = false;
    form: FormGroup;
    statuses = this.fb.control([]);
    accounts = this.fb.control("");
    startDate = this.fb.control("");
    endDate = this.fb.control("");
    pageNumberControl = this.fb.control(1);
    dataSource = new MatTableDataSource<any>();

    maxDate = new Date();
    minEndDate: string | Date;
    minStartDate: string | Date;

    subscriptions: Subscription[] = [];
    isFilterApplied = false;

    statusList = [
        PolicyChangeRequestStatus.COMPLETED,
        PolicyChangeRequestStatus.IN_PROGRESS,
        PolicyChangeRequestStatus.ADDITIONAL_INFO_REQUIRED,
        PolicyChangeRequestStatus.WITHDRAWN,
        PolicyChangeRequestStatus.SUBMITTED,
    ];

    selectedVal = "";
    filterDataStatusList: string[] = [];
    policyList = [];
    displayedColumnsArray: string[];

    filterDataStartDate: string;
    filterDataEndDate: string;
    displayAccountContent: string;
    displayStatusContent: string;
    displayDateSubmittedContent: string;
    searchTerm: string;
    searchTermOnEnter: string;
    noResultsFound: string;
    noResultsFoundMessage: string;
    activeCol: string;
    inputDropdownSearchTerm: string;
    searchInputEventTargetObj: string;
    accountFilterSelectedValue: string;
    filterDataAccountName: string;
    isMemberPortal: string;
    portal: string;

    dropdownStatus = false;
    filterOpen = false;
    resultsLoaded = false;

    totalPoliciesCount: number;
    memberId: number;
    mpGroup: number;
    timeOut: any;
    sort: any;
    paginator: any;
    accountList = [];
    accountDetailsList = [];
    isDateInvalid: boolean;

    filter = {
        query: {
            policyHolderName: "",
            status: [],
            account: "",
            affectedPolicyNumbers: "",
        },
        dateSubmitted: {
            startDate: "",
            endDate: "",
        },
        freeText: {
            policyHolderName: "",
            affectedPolicyNumbers: "",
        },
    };

    latestOperation =
    PolicyChangeRequestList.SEARCH ||
        PolicyChangeRequestList.accountType ||
        PolicyChangeRequestList.statusType ||
        PolicyChangeRequestList.dateSubmittedType;
    pcrLanguagePath = "primary.portal.dashboard.policyChangeRequestList";
    names = "general.policy_change_request.transaction.table.increments";

    policyChangeRequestListColumnsMap = [
        {
            propertyName: "policyHolderName",
            isSortable: true,
        },
        {
            propertyName: "requestNumber",
            isSortable: true,
        },
        {
            propertyName: "requestType",
            isSortable: true,
        },
        {
            propertyName: PolicyChangeRequestList.dateSubmittedType,
            isSortable: false,
        },
        {
            propertyName: PolicyChangeRequestList.statusType,
            isSortable: true,
        },
        {
            propertyName: "manage",
            isSortable: false,
        },
    ];

    pageSizeOptions: number[] = AppSettings.pageSizeOptions;
    languageStrings = {
        policyChangeRequests: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.policyChangeRequests`),
        noPolicyChangeRequestMPP: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.noPolicyChangeRequestMPP`),
        noPolicyChangeRequestMAPMMP: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.noPolicyChangeRequestMAPMMP`),
        searchHint: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.searchHint`),
        startDateErrorMessage: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.startDateErrorMessage`),
        endDateErrorMessage: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.endDateErrorMessage`),
        filters: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.filters`),
        clear: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.clear`),
        apply: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.apply`),
        close: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.close`),
        downloadReport: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.downloadReport`),
        searchPolicies: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.searchPolicy`),
        requestAChange: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.requestAChange`),
        status: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.status`),
        dateSubmitted: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.dateSubmitted`),
        account: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.account`),
        after: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.after`),
        before: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.before`),
        checkbox: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.checkbox"),
        info: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.info"),
        warning: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.warning"),
        policyHolderName: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.policyHolderName`),
        policyNumber: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.policyNumber`),
        noChangeRequestAccount: this.language.fetchPrimaryLanguageValue(`${this.pcrLanguagePath}.noChangeRequestAccount`),
        more: this.language.fetchPrimaryLanguageValue("primary.portal.common.moreFilter"),
    };
    languageStringsArray: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.workLabel.startDate",
        "primary.portal.members.workLabel.endDate",
        "primary.portal.members.workLabel.dateFormat",
        "primary.portal.dashboard.policyChangeRequestList.table.column.viewAndEdit",
        "primary.portal.dashboard.policyChangeRequestList.page",
    ]);

    selectInputEventTargetObj: any;
    isLoading: boolean;
    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    showErrorMessage: boolean;
    languageStringsFromDB: Record<string, string>;
    successMessage: string;
    producerId: number;
    showZeroStateMessage: boolean;
    secondaryLanguageStrings: any;
    overlayRef: OverlayRef;
    moreFilterResponse;
    moreFormControls;
    statusSelectedData: any[] = [];
    appliedFilter: any[] = [];
    validationRegex: any;
    globalPCR: boolean;
    loginPortalMPP$: Observable<boolean> = this.sharedService.userPortal$.pipe(map((portal) => portal.type === "producer"));
    isDirectFlow = false;
    isMemberFlow = false;
    isAflacAlways$: Observable<boolean>;
    private readonly unsubscribe$ = new Subject<void>();

    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(RouterState) router$: Observable<RouterStateModel>;

    constructor(
        private readonly router: Router,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly user: UserService,
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly datePipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly maskPipe: NgxMaskPipe,
        private readonly cdRef: ChangeDetectorRef,
        private readonly elementRef: ElementRef,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly injector: Injector,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly utilService: UtilService,
        private readonly dateService: DateService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
        private readonly accountService: AccountService,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                    this.getFormFields();
                }
            }),
        );
        this.subscriptions.push(
            this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
                if (resp.size === "MD" || resp.size === "SM") {
                    this.forMediumDevices = true;
                    this.forMobileDevices = true;
                } else {
                    this.forMediumDevices = false;
                    this.forMobileDevices = false;
                }
            }),
        );

        this.subscriptions.push(
            this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
                if (resp.size === "SM") {
                    this.forMobileDevices = true;
                } else {
                    this.forMobileDevices = false;
                }
            }),
        );
    }

    /**
     * Life cycle hook of angular. Called on initialization of component.
     * Initializing language strings, settings member details, calling initial APIs.
     */
    ngOnInit(): void {
        this.isDateInvalid = true;
        this.getLanguageStrings();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.setMpGroup();
        this.accountList = [];
        this.getFormData();
        this.getApiResponse();
        this.displayedColumnsArray = this.getDisplayColumns();

        // TODO - Checking for Direct Path to hide Aflac Always Card EVE-38426
        this.isDirectFlow = this.router.url.indexOf("direct") !== -1;

        // Method to check whether to show Aflac Always Card
        this.checkAflacAlways();
    }

    /**
     * Set mpGroup, memberId and global PCR flag
     */
    setMpGroup(): void {
        if (this.router.url.indexOf("producer/change-requests") > -1) {
            this.showZeroStateMessage = true;
            this.globalPCR = true;
        }
        this.subscriptions.push(
            this.route.params.subscribe((params: any) => {
                if ("mpGroupId" in params) {
                    this.mpGroup = +params["mpGroupId"];
                }
                if ("memberId" in params) {
                    this.memberId = +params["memberId"];
                }
            }),
        );
        this.subscriptions.push(
            this.user.credential$.subscribe((credential) => {
                if ("producerId" in credential) {
                    this.producerId = credential.producerId;
                }
                if ("memberId" in credential) {
                    this.memberId = credential.memberId;
                    this.mpGroup = credential.groupId;
                    this.isMemberFlow = this.router.url.indexOf("member") > -1;
                }
                const mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
                if (!this.mpGroup && mpGroupObj && !this.globalPCR) {
                    this.mpGroup = mpGroupObj.id;
                }
            }),
        );
        if (this.router.url.indexOf("direct") > -1) {
            this.subscriptions.push(
                this.router$
                    .pipe(
                        pluck("state", "params"),
                        filter((params) => params && params[CUSTOMER_ID] && params[MP_GROUP_ID]),
                    )
                    .subscribe((params) => {
                        this.memberId = params[CUSTOMER_ID];
                        this.mpGroup = params[MP_GROUP_ID];
                    }),
            );
        }
    }

    getFormData(): void {
        this.getFormFields();
        // fetching all selected status options value as an array and showing clear button
        this.subscriptions.push(
            this.statuses.valueChanges.subscribe((value) => {
                this.filterDataStatusList = value;
            }),
        );

        // fetching all selected product options value as an array and showing clear button
        this.subscriptions.push(
            this.accounts.valueChanges.subscribe((value) => {
                if (value && value.length && this.filterDataAccountName !== value) {
                    this.filterDataAccountName = value;
                }
            }),
        );

        // fetch start date
        this.subscriptions.push(
            this.startDate.valueChanges.subscribe((value) => {
                this.filterDataStartDate = this.datePipe.transform(value, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                if (
                    this.dateService.checkIsAfter(
                        this.dateService.toDate(this.filterDataStartDate),
                        this.dateService.toDate(this.filterDataEndDate || ""),
                    )
                ) {
                    this.startDate.setErrors({ startDateError: true });
                } else {
                    this.startDate.setErrors(null);
                }
            }),
        );

        // fetch end date
        this.subscriptions.push(
            this.endDate.valueChanges.subscribe((value) => {
                this.filterDataEndDate = this.datePipe.transform(value, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                if (
                    this.dateService.checkIsAfter(
                        this.dateService.toDate(this.filterDataStartDate || ""),
                        this.dateService.toDate(this.filterDataEndDate),
                    )
                ) {
                    this.endDate.setErrors({ endDateError: true });
                } else {
                    this.endDate.setErrors(null);
                }
            }),
        );
    }

    getFormFields(): void {
        this.form = this.fb.group({
            searchInput: this.fb.control("", {
                validators: [Validators.pattern(this.validationRegex ? this.validationRegex.SEARCH_FIELD : null)],
                updateOn: "blur",
            }),
            startDate: this.fb.control(""),
            endDate: this.fb.control(""),
        });
    }

    /**
     * Method to fetch policy change requests
     */
    getApiResponse(): void {
        this.isLoading = false;
        this.subscriptions.push(
            this.policyChangeRequestService
                .refreshListChangeForms(this.mpGroup, this.memberId)
                .pipe(
                    catchError(() => of(null)),
                    switchMap(() => this.policyChangeRequestService.getListChangeForms(this.mpGroup, this.memberId)),
                    tap(() => (this.isLoading = false)),
                )
                .subscribe(
                    (policyList) => {
                        policyList.map((policy) => {
                            policy.dateSubmitted = this.datePipe.transform(policy.dateSubmitted, DateFormats.MONTH_DAY_YEAR);
                            policy.requestType = PolicyTransactionForms[policy.requestType];
                            policy.status = PolicyChangeRequestStatus[policy.status];
                            if (policy && policy.account) {
                                policy.account = policy.account.name;
                            }
                        });

                        this.resultsLoaded = true;
                        // Sort policies newest first (default order).
                        this.dataSource.data = policyList.sort(
                            (policyA, policyB) =>
                                this.dateService.toDate(policyB.dateSubmitted).getTime() -
                                this.dateService.toDate(policyA.dateSubmitted).getTime(),
                        );
                        this.pageSizeOptions = this.updatePageSizeOptions(AppSettings.pageSizeOptions);
                        this.isLoading = true;
                        policyList.forEach((policy) => {
                            if (policy && policy.account) {
                                this.accountList.push(policy.account);
                            }
                        });
                        this.distinctValue();
                        this.policyList = policyList;
                        this.totalPoliciesCount = policyList.length;
                    },
                    (error) => {
                        this.isLoading = true;
                        this.showErrorAlertMessage(error);
                    },
                ),
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS] && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.dashboard.policyChangeRequestList.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }
    distinctValue(): void {
        this.accountList = this.accountList.map((item) => item).filter((value, index, self) => self.indexOf(value) === index);
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    getDisplayColumns(): string[] {
        if (this.memberId) {
            this.isMemberPortal = "policyHolderName";
        } else {
            this.isMemberPortal = "";
        }
        return this.policyChangeRequestListColumnsMap
            .filter((val) => this.isMemberPortal !== val.propertyName)
            .map((col) => col.propertyName);
    }

    /**
     * Function is for navigating to Policy change flow
     * Open Mat dialog for PolicyChangeRequest Component and handle the functionality after dialog close.
     */
    navigateToPolicyChangeFlow(): void {
        this.PCRDialogRef = this.dialog.open(PolicyChangeRequestComponent, {
            width: "100%",
            data: {
                mpGroup: this.mpGroup,
            },
        });
        this.subscriptions.push(
            this.PCRDialogRef.afterClosed().subscribe((response) => {
                if (response === PolicyChangeRequestList.submitted) {
                    this.successMessage = this.languageStringsFromDB["primary.portal.dashboard.policyChangeRequestList.successMessage"];
                    this.getApiResponse();
                }
            }),
        );
    }

    // Opening filter when user click on it
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }

    downloadPolicyList(): void {
        this.subscriptions.push(
            this.policyChangeRequestService.downloadPolicyChangeRequests(this.mpGroup).subscribe((response) => {
                const blob = new Blob([response], {
                    type: "application/vnd.ms-excel",
                });

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if ((window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(blob);
                } else {
                    const fileurl = URL.createObjectURL(blob);
                    window.open(fileurl, "_blank");
                }
            }),
        );
    }

    // Reset options or showing previous selected option if user click outside without applying filter
    resetFilterOptions(type: string): void {
        switch (type) {
            case PolicyChangeRequestList.statusType:
                if (this.filter.query.status.length !== 0) {
                    this.statuses.setValue(this.filter.query.status);
                } else {
                    this.statuses.setValue([]);
                }
                this.statusSelectedData = [];
                break;
            case PolicyChangeRequestList.accountType:
                if (this.filter.query.account) {
                    this.accounts.setValue(this.filter.query.account);
                } else {
                    this.accounts.setValue("");
                }
                break;
            case PolicyChangeRequestList.dateSubmittedType:
                if (!this.filter.dateSubmitted.startDate && !this.filter.dateSubmitted.endDate) {
                    this.startDate.setValue(null);
                    this.endDate.setValue(null);
                } else if (this.filter.dateSubmitted.startDate && !this.filter.dateSubmitted.endDate) {
                    this.startDate.setValue(this.dateService.toDate(this.filter.dateSubmitted.startDate).toISOString());
                    this.endDate.setValue(null);
                } else if (!this.filter.dateSubmitted.startDate && this.filter.dateSubmitted.endDate) {
                    this.startDate.setValue("");
                    this.endDate.setValue(this.dateService.toDate(this.filter.dateSubmitted.endDate).toISOString());
                } else {
                    this.startDate.setValue(this.dateService.toDate(this.filter.dateSubmitted.startDate).toISOString());
                    this.endDate.setValue(this.dateService.toDate(this.filter.dateSubmitted.endDate).toISOString());
                    this.isFilterApplied = false;
                }
        }
    }

    // Clear all selected filter options
    clearFilterList(type: string): void {
        switch (type) {
            case PolicyChangeRequestList.accountType:
                this.accounts.setValue("");
                this.filterDataAccountName = "";
                this.submitFilterList(type);
                break;
            case PolicyChangeRequestList.statusType:
                this.displayStatusContent = "";
                this.statusSelectedData = [];
                this.statuses.setValue([]);
                this.filterDataStatusList = [];
                this.submitFilterList(type);
                break;
            case PolicyChangeRequestList.dateSubmittedType:
                this.filter.dateSubmitted.startDate = "";
                this.filter.dateSubmitted.endDate = "";
                this.startDate.setValue("");
                this.endDate.setValue("");
                this.displayDateSubmittedContent = "";
                this.isFilterApplied = false;
                this.submitFilterList(type);
                break;
            default:
                break;
        }
    }

    // Apply selected filter option and return results based on it
    submitFilterList(type: string): boolean | undefined {
        switch (type) {
            case PolicyChangeRequestList.accountType:
                this.filter.query.account = this.filterDataAccountName;
                if (!this.filterDataAccountName) {
                    this.filter.query.account = "";
                    this.displayAccountContent = "";
                } else {
                    this.filter.query.account = this.filterDataAccountName;
                    this.displayAccountContent = this.filterDisplayContent(this.accountList, this.filterDataAccountName);
                }
                this.accountFilterDropdown.close();
                this.latestOperation = PolicyChangeRequestList.accountType;
                break;
            case PolicyChangeRequestList.statusType:
                this.filterDataStatusList = this.statuses.value;
                if (this.filterDataStatusList.length === 0) {
                    this.filter.query.status = [];
                    this.displayStatusContent = "";
                } else {
                    this.filter.query.status = this.filterDataStatusList;
                    this.displayStatusContent = this.filterDisplayContent(this.statusList, this.filterDataStatusList);
                }
                this.statusFilterDropdown.close();
                this.latestOperation = PolicyChangeRequestList.statusType;
                break;
            case PolicyChangeRequestList.dateSubmittedType:
                if (
                    this.endDate.hasError("endDateError") ||
                    this.startDate.hasError("startDateError") ||
                    this.startDate.hasError("incorrect") ||
                    this.endDate.hasError("incorrect")
                ) {
                    return false;
                }
                if (!this.filterDataStartDate && !this.filterDataEndDate) {
                    this.displayDateSubmittedContent = "";
                    this.filter.dateSubmitted.startDate = this.filterDataStartDate;
                    this.filter.dateSubmitted.endDate = this.filterDataEndDate;
                    this.isFilterApplied = false;
                } else if (this.filterDataStartDate && !this.filterDataEndDate) {
                    this.filter.dateSubmitted.startDate = this.filterDataStartDate;
                    this.displayDateSubmittedContent =
                        this.languageStrings.after + this.datePipe.transform(this.filterDataStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                    this.isFilterApplied = true;
                } else if (!this.filterDataStartDate && this.filterDataEndDate) {
                    this.filter.dateSubmitted.endDate = this.filterDataEndDate;
                    this.displayDateSubmittedContent =
                        this.languageStrings.before + this.datePipe.transform(this.filterDataEndDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                    this.isFilterApplied = true;
                } else {
                    this.filter.dateSubmitted.startDate = this.filterDataStartDate;
                    this.filter.dateSubmitted.endDate = this.filterDataEndDate;
                    this.displayDateSubmittedContent = `: ${this.datePipe.transform(
                        this.filterDataStartDate,
                        AppSettings.DATE_FORMAT_MM_DD_YYYY,
                    )} - ${this.datePipe.transform(this.filterDataEndDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)}`;
                    this.isFilterApplied = true;
                }
                this.dateSubmittedFilterDropdown.close();
                this.latestOperation = PolicyChangeRequestList.dateSubmittedType;
                break;
            default:
                break;
        }
        this.filterDataObject();
        return undefined;
    }

    // if selected options charater count should be greater than 30 then return option count or selected all
    filterDisplayContent(optionsList: any, selectedOptions: any): any {
        let str = "";
        const colonSpace = ": ";
        if (Array.isArray(selectedOptions)) {
            selectedOptions.forEach((element: any) => {
                str = str.concat(element.toLowerCase());
            });
            if (optionsList.length && selectedOptions.length === 0) {
                return colonSpace + PolicyChangeRequestList.noneProductsSelected;
            }
            if (optionsList.length === selectedOptions.length) {
                return colonSpace + PolicyChangeRequestList.allProductsSelected;
            }
            if (optionsList.length && str.length < PolicyChangeRequestList.maxCharLenToDisplay) {
                return (
                    colonSpace +
                    selectedOptions.map((val: any) => (val = val.charAt(0).toUpperCase() + val.substr(1).toLowerCase())).join(", ")
                );
            }
            if (optionsList.length && str.length >= PolicyChangeRequestList.maxCharLenToDisplay) {
                return colonSpace + selectedOptions.length;
            }
        } else {
            return colonSpace + selectedOptions;
        }
    }

    // close filter dropdown list
    closeFilterList(type: string): void {
        if (type === PolicyChangeRequestList.accountType) {
            this.accountFilterDropdown.close();
        }
    }

    // Setting input event
    searchInputEvent(event: any): void {
        this.searchInputEventTargetObj = event.target;
    }

    // filter out records based on available search term
    clickOutsideElement(event: any): void {
        if (
            event.target.innerText &&
            this.filterDataAccountName &&
            event.target.innerText.trim() === this.filterDataAccountName.toString()
        ) {
            // setTimeOut to load the data for drop down
            const to = setTimeout(() => {
                clearTimeout(to);
                this.accountFilterDropdown.open();
            }, 10);
        }
        if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj) {
            this.filterDataObjectOnEnter();
        }
    }

    // live search result getting from this function
    applySearchFilter(event: any): void {
        this.latestOperation = PolicyChangeRequestList.SEARCH;
        const searchValue = event.target.value;
        this.searchTerm = this.removeLeadingSpace(searchValue);
        this.searchTermOnEnter = this.removeLeadingSpace(searchValue);
        this.filter.query.policyHolderName = "";
        this.filter.query.affectedPolicyNumbers = "";
        this.dropdownStatus = true;
        if (searchValue.indexOf(":") > -1) {
            const property = searchValue.substring(0, searchValue.indexOf(":"));
            const value = searchValue.substring(searchValue.indexOf(":") + 1, searchValue.length);
            if (this.removeLeadingSpace(value).length >= 3 && value) {
                this.searchTerm = this.removeLeadingSpace(value);
            } else {
                this.searchTerm = "";
            }
            this.searchTermOnEnter = this.removeLeadingSpace(value);
            this.filterByIdName(property);
            this.dropdownStatus = false;
        } else if (this.searchTerm.length >= 3) {
            this.filter.freeText.affectedPolicyNumbers = this.searchTerm;
            this.filter.freeText.policyHolderName = this.searchTerm;
            // setTimeOut to filter data using custom pipe
            this.timeOut = setTimeout(() => {
                this.filterDataObject();
            }, 1000);
        } else {
            this.filter.freeText.affectedPolicyNumbers = "";
            this.filter.freeText.policyHolderName = "";
        }
        if (event.key === PolicyChangeRequestList.escapeKey) {
            this.dropdownStatus = false;
        } else if (event.key === PolicyChangeRequestList.enterKey) {
            this.filterDataObjectOnEnter();
        }
        if (this.searchTerm.length < 3) {
            clearTimeout(this.timeOut);
            this.filterDataObject();
        }
    }

    // if user select policy name or number then it will filter base on that
    filterByIdName(searchType: string): void {
        this.filter.freeText.affectedPolicyNumbers = "";
        this.filter.freeText.policyHolderName = "";
        if (this.searchTerm.length >= 3) {
            this.filter.query.policyHolderName = "";
            this.filter.query.affectedPolicyNumbers = "";
            if (searchType.replace(/\s/g, "").toLowerCase() === PolicyChangeRequestList.nameType) {
                this.inputDropdownSearchTerm = this.languageStrings.policyHolderName;
                this.filter.query.policyHolderName = this.removeLeadingSpace(this.searchTerm);
            } else if (searchType.replace(/\s/g, "").toLowerCase() === PolicyChangeRequestList.numberType) {
                this.inputDropdownSearchTerm = this.languageStrings.policyNumber;
                this.filter.query.affectedPolicyNumbers = this.removeLeadingSpace(this.searchTerm.toString());
            }
            // setTimeOut to filter data using custom pipe
            setTimeout(() => {
                this.filterDataObject();
            }, 1000);
        }
        if (this.searchTerm && searchType) {
            this.form.controls["searchInput"].setValue(this.inputDropdownSearchTerm + ": " + this.removeLeadingSpace(this.searchTerm));
        }
        this.dropdownStatus = false;
    }

    // Remove leading all leading white spaces
    removeLeadingSpace(value: string): string {
        return value.replace(/^\s+/g, "");
    }

    // when user click on tab button then it should be hide search drop down
    onKey(event: any): void {
        if (event.key === PolicyChangeRequestList.tabKey) {
            this.dropdownStatus = false;
        }
    }

    // Caling custome filter pipe
    filterDataObject(): void {
        this.filter = this.utilService.copy(this.filter);
        this.dataSource.data = this.dataFilter.transform(this.policyList, this.filter);
        this.noResultsFoundMessage = this.getFilterParams();
        this.pageSizeOptions = this.updatePageSizeOptions(AppSettings.pageSizeOptions);
        // eslint-disable-next-line no-underscore-dangle
        this.matPaginator._changePageSize(AppSettings.pageSizeOptions[0]);
    }

    // Function call when user press enter or click outside of search box
    filterDataObjectOnEnter(): void {
        this.dropdownStatus = false;
        this.filter.freeText.policyHolderName = this.searchTermOnEnter;
        this.filter.freeText.affectedPolicyNumbers = this.searchTermOnEnter;
        this.filterDataObject();
    }

    // Getting no records found message
    getFilterParams(): string | undefined {
        if (this.dataSource.data.length === 0) {
            if (
                this.filter.freeText.affectedPolicyNumbers ||
                this.filter.freeText.policyHolderName ||
                this.filter.query.policyHolderName ||
                this.filter.query.affectedPolicyNumbers
            ) {
                if (this.filter.freeText.affectedPolicyNumbers) {
                    this.noResultsFound = this.filter.freeText.affectedPolicyNumbers;
                } else {
                    if (this.filter.query.policyHolderName) {
                        this.noResultsFound = this.filter.query.policyHolderName;
                    } else {
                        if (this.filter.freeText.policyHolderName) {
                            this.noResultsFound = this.filter.freeText.policyHolderName;
                        } else {
                            this.noResultsFound = this.filter.query.affectedPolicyNumbers;
                        }
                    }
                }
            }
            if (this.latestOperation === "search") {
                return this.noResultsFound;
            }
            if (this.filterPropertyValueCount() >= 2) {
                return "selected filters";
            }
            if (this.filter.query.account.length !== 0) {
                return this.filter.query.account;
            }
            if (this.filter.query.status.length !== 0) {
                return this.filter.query.status.join(", ");
            }
            if (this.filter.dateSubmitted.startDate && this.filter.dateSubmitted.endDate) {
                return this.filter.dateSubmitted.startDate + "-" + this.filter.dateSubmitted.endDate;
            }
            if (this.filter.dateSubmitted.startDate) {
                return this.filter.dateSubmitted.startDate;
            }
            if (this.filter.dateSubmitted.endDate) {
                return this.filter.dateSubmitted.endDate;
            }
            return this.noResultsFound;
        }
        return undefined;
    }

    filterPropertyValueCount(): number {
        let count = 0;
        if (this.filter.query.status.length > 0) {
            count++;
        }
        if (this.filter.query.account.length > 0) {
            count++;
        }
        if (this.filter.dateSubmitted.startDate || this.filter.dateSubmitted.endDate) {
            count++;
        }
        return count;
    }

    sortData(event: any): void {
        this.activeCol = event.active;
    }

    viewAndEditPolicyChanges(policyObj: any): void {
        if (policyObj.id) {
            this.dialog.open(PolicyChangeRequestViewComponent, {
                width: "667px",
                data: {
                    formId: policyObj.id,
                },
            });
        }
    }

    ngAfterContentInit(): void {
        if (this.matPaginator) {
            this.dataSource.paginator = this.matPaginator;
            // eslint-disable-next-line no-underscore-dangle
            this.matPaginator._changePageSize(AppSettings.pageSizeOptions[0]);
            this.dataSource.sort = this.matSort;
            // By default items per page is set to the first available option.
            this.subscriptions.push(
                this.matPaginator.page.subscribe((page: PageEvent) => {
                    this.pageNumberControl.setValue(page.pageIndex + 1);
                }),
            );
            const sortState: any = {
                active: this.policyChangeRequestListColumnsMap[3].propertyName,
                direction: "desc",
            };
            this.dataSource.sort.active = sortState.active;
            this.dataSource.sort.direction = sortState.direction;
            this.dataSource.sort.sortChange.emit(sortState);
        }
        this.cdRef.detectChanges();
    }

    // Dynamically updating page size options
    updatePageSizeOptions(globalPageSizeOptions: number[]): number[] {
        const dataLength = this.dataSource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = 0; i < pageSizeOptionsLength; i++) {
            const nextIndex = i + 1;
            if (dataLength < globalPageSizeOptions[0]) {
                return [];
            }
            if (dataLength >= globalPageSizeOptions[i] && dataLength < globalPageSizeOptions[nextIndex]) {
                return globalPageSizeOptions.slice(0, nextIndex);
            }
        }
        return globalPageSizeOptions;
    }

    // Adding this input listener because using valueChanges.subscribe throws RangeError: Maximum call stack size exceeded.
    pageInputChanged(pageNumber: string): void {
        if (this.totalPoliciesCount > 0 && pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.matPaginator.getNumberOfPages()) {
            this.matPaginator.pageIndex = +pageNumber - 1;
            this.matPaginator.page.next({
                pageIndex: this.matPaginator.pageIndex,
                pageSize: this.matPaginator.pageSize,
                length: this.matPaginator.length,
            });
        }
    }

    validateStartDate(control: string, event: any): string | undefined {
        if (control === "startDate" && (this.startDate.value === null || this.startDate.value === "") && event !== "") {
            this.startDate.setErrors({
                incorrect: true,
            });
            return this.secondaryLanguageStrings.invalidDateFormat;
        }
        return undefined;
    }
    validateEndDate(control: string, event: any): string | undefined {
        if (control === "endDate" && (this.endDate.value === null || this.endDate.value === "") && event !== "") {
            this.endDate.setErrors({
                incorrect: true,
            });
            return this.secondaryLanguageStrings.invalidDateFormat;
        }
        return undefined;
    }

    getLanguageStrings(): void {
        this.languageStringsFromDB = this.language.fetchPrimaryLanguageValues([
            "primary.portal.dashboard.policyChangeRequestList.successMessage",
        ]);
        this.secondaryLanguageStrings = {
            invalidDateFormat: this.language.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat"),
        };
    }
    // More Filter

    moreFilterView(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([
                {
                    originX: "end",
                    originY: "bottom",
                    overlayX: "end",
                    overlayY: "top",
                },
            ])
            .withLockedPosition(true)
            .setOrigin(this.moreFilterOrigin);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            width: 350,
            maxHeight: 600,
            backdropClass: "expanded-card-view",
            panelClass: "account-list-more-view",
        });

        const popupComponentPortal = new ComponentPortal(
            MoreFilterComponent,
            null,
            this.createInjector([this.statusList, this.appliedFilter, this.statusSelectedData]),
        );
        this.overlayRef = this.overlay.create(overlayConfig);

        this.subscriptions.push(
            this.overlayRef.backdropClick().subscribe((res) => {
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
            }),
        );

        const overlayInstance = this.overlayRef.attach(popupComponentPortal);
        this.subscriptions.push(
            overlayInstance.instance.filterApplied.subscribe((resp) => {
                this.moreFilterResponse = resp;
                this.filter.query.status = this.moreFilterResponse.selectedStatusData;
                const selectedStatusData = this.moreFilterResponse.selectedStatusData;
                this.statusSelectedData = selectedStatusData;

                this.filterDataObject();
                this.overlayRef.dispose();
            }),
        );
        this.subscriptions.push(
            overlayInstance.instance.resetMoreFilterSubject.subscribe((resp) => {
                this.moreFormControls = resp;

                this.moreFormControls.forEach((each) => {
                    if (each === "statusFilter") {
                        this.clearFilterList("status");
                        this.statusSelectedData = [];
                        this.filter.query.status = this.statusSelectedData;
                    }
                    this.filterDataObject();
                });

                this.overlayRef.dispose();
            }),
        );
    }
    createInjector(dataToPass: any[]): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }

    /**
     * Method to check Aflac Always
     * @returns void
     */
    checkAflacAlways(): void {
        this.isAflacAlways$ = combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_ENABLE),
            this.accountService.getAccount(this.mpGroup.toString()),
            this.accountService.getGroupAttributesByName(
                [AccountTypes.ACH_ACCOUNT, AccountTypes.LIST_BILL_ACCOUNT, AccountTypes.EBS_ACCOUNT],
                this.mpGroup,
            ),
        ]).pipe(
            map(([reviseAflacAlwaysConfig, account, groupAttributesByName]) => {
                // If Revise Aflac Always feature config is off, don't show Aflac Always card
                if (!reviseAflacAlwaysConfig) {
                    return false;
                } else {
                    // Get account info partner account type for direct bill
                    const isDirectBillPartnerAccountType = account.partnerAccountType === PartnerAccountType.PAYROLLDIRECTBILL;
                    // Get account info partner account types for PDA (Union, Association, Nonpayroll)
                    const isCompletePdaPartnerAccountType =
                        account.partnerAccountType === PartnerAccountType.UNION ||
                        account.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                        account.partnerAccountType === PartnerAccountType.NONPAYROLL;
                    // Account/Group Attributes
                    let isAchAccount = false;
                    let isListBill = false;
                    let isEbsAccount = false;
                    // If ACH or if EBS set value to check and hide card
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.ACH_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isAchAccount = true;
                    }
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.EBS_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isEbsAccount = true;
                    }
                    // If List Bill set value to check to show/hide card
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.LIST_BILL_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isListBill = true;
                    }
                    // Boolean check for qualifying AA criteria
                    // If not EBS/ACH proceed to show/hide card
                    if (!isEbsAccount && !isAchAccount) {
                        // Check if Direct Bill attribute to hide card
                        if (isDirectBillPartnerAccountType) {
                            return false;
                        }
                        // Check if PDA Partner (Union, Association, Nonpayroll) AND List Bill attribute to show/hide card
                        if (isCompletePdaPartnerAccountType) {
                            if (!isListBill) {
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            }),
        );
    }

    // destroying subscribers here for preventing memory leakage
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
