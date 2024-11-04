import { Component, OnInit, ViewChild, OnDestroy, Optional, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabGroup, MatTabChangeEvent } from "@angular/material/tabs";
import { Subscription } from "rxjs";
import { FormGroup, FormControl, FormBuilder } from "@angular/forms";
import {
    SearchProducer,
    ProducerService,
    PRODUCER_GRID,
    AccountListService,
    FilterParameters,
    AccountList,
    Producer,
    AccountListResponse,
} from "@empowered/api";
import {
    PaginationConstants,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    SearchType,
    AppSettings,
    ProducerDialogData,
    Params,
    NavLink,
} from "@empowered/constants";
import { Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AddProducerList, ProducerListState, SetSearchedProducer } from "@empowered/ngxs-store";
import { filter, switchMap } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { Router } from "@angular/router";

const PRODUCER_URL = "payroll";

@Component({
    selector: "empowered-search-producer",
    templateUrl: "./search-producer.component.html",
    styleUrls: ["./search-producer.component.scss"],
})
export class SearchProducerComponent implements OnInit, OnDestroy {
    @ViewChild("tabs", { static: true }) tabs: MatTabGroup;
    @ViewChild(MatSort) sort: MatSort;

    subscriber: Subscription[] = [];

    type: string;
    mpGroupId: number;
    SEARCH = "SEARCH";
    RECENT = "RECENT";
    STATE: "STATE";
    CARRIER = "CARRIER";
    navLinks: NavLink[];
    SEARCH_PRODUCER = "";
    RECENT_PRODUCER = "";
    searchProducerForm: FormGroup;
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    producersList: SearchProducer[];
    recentProducersList: SearchProducer[];
    selectedProducerData: SearchProducer;
    displayColumns: string[];
    displayedColumns: string[];
    dataSource: MatTableDataSource<SearchProducer>;
    searchedAccountList: AccountList[];
    producerAccountData: MatTableDataSource<AccountList>;
    disableSearch: boolean;
    data: SearchProducer[];
    step = 0;
    pageSize: number;
    pageNumber = 1;
    supervisonProducerId: number;
    isSpinnerLoading = false;
    addProducerStep2 = true;
    languageString: Record<string, string>;
    setInfo = "";
    loggedInProducerId: number;
    configCount: number;
    prodCount: number;
    CONFIG_STR = "group.producers.carrier_and_license_display.max_producers";
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    errorMessage: string;
    showErrorMessage = false;
    companyCode: string;
    isDirect = false;
    hasRoleTwentyDirectPermission = false;
    RECENT_PRODUCER_LIST_MAX_LENGTH = 10;
    isAccountRole20: boolean;
    showProducer = false;
    showAccounts = false;
    searchTypeEnum = SearchType;
    byProducerHint = true;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.addSingleProducer.closeModal",
        "primary.portal.direct.directSales",
        "primary.portal.account.direct.searchProducerTitle",
        "primary.portal.commission.producer.single.search",
        "primary.portal.commission.producer.single.hint",
        "primary.portal.commission.producer.single.tab.recent",
        "primary.portal.commission.producer.single.table.name",
        "primary.portal.commission.producer.single.table.licensedStates",
        "primary.portal.commission.producer.single.state",
        "primary.portal.commission.producer.single.states",
        "primary.portal.commission.producer.single.noState",
        "primary.portal.commission.producer.single.table.npn",
        "primary.portal.common.view",
        "primary.portal.direct.producer.direct.noRecentProd",
        "primary.portal.direct.producer.single.recentProd",
        "primary.portal.common.cancel",
        "primary.portal.search.producer.noResult",
        "primary.portal.search.producer.noResultText",
        "primary.portal.commission.producer.single.tab.search",
        "primary.portal.direct.producer.pendedbusiness.noRecentProd",
        "primary.portal.formRepository.searchType",
        "primary.portal.accounts.accountList.unassigned",
        "primary.portal.accounts.accountList.accountNameColumn",
        "primary.portal.accounts.accountList.primaryProducerColumn",
        "primary.portal.accounts.byProducer",
        "primary.portal.accounts.accountList.accountNameId",
        "primary.portal.commission.producer.account.search",
    ]);
    constructor(
        private readonly dialogRef: MatDialogRef<SearchProducerComponent>,
        private readonly store: Store,
        private readonly formBuilder: FormBuilder,
        private readonly producerService: ProducerService,
        private readonly languageService: LanguageService,
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly dialogData: ProducerDialogData,
        private readonly userService: UserService,
        private readonly accountListService: AccountListService,
        private readonly route: Router,
    ) {}
    /**
     * Initializes the form and sets the recent search based on role
     */
    ngOnInit(): void {
        this.pageSize = AppSettings.PAGE_SIZE_1000;
        this.producersList = [];
        this.recentProducersList = [];
        this.step = 0;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.isDirect = this.dialogData.isDirect;
        this.hasRoleTwentyDirectPermission = this.dialogData.roleTwentyDirectPermission;
        this.isAccountRole20 = this.dialogData.roleTwentyAccountPermission;
        if (this.hasRoleTwentyDirectPermission || this.isAccountRole20) {
            this.setLoggedInUserInRecentSearch();
        } else {
            this.recentProducersList = [];
        }
        this.disableSearch = false;
        this.initializeSearchForm();
        this.setLanguageStrings();
        this.navLinks = [
            { label: this.SEARCH_PRODUCER, id: 1, type: this.SEARCH },
            { label: this.RECENT_PRODUCER, id: 2, type: this.RECENT },
        ];
    }
    /**
     * Sets the role 20 logged in user in recent search
     */
    setLoggedInUserInRecentSearch(): void {
        const params: Params = {};
        let userId: number;
        let loggedInProducer: SearchProducer;
        this.subscriber.push(
            this.userService.credential$
                .pipe(
                    filter(() => this.hasRoleTwentyDirectPermission === true || this.isAccountRole20),
                    switchMap((userData) => {
                        params["size"] = this.pageSize;
                        params["page"] = this.pageNumber;
                        params["search"] = userData.name.firstName;
                        if ("producerId" in userData) {
                            userId = userData.producerId;
                        }
                        return this.producerService.producerSearch(params);
                    }),
                )
                .subscribe((searchedProducers) => {
                    loggedInProducer = searchedProducers.content.find((producer) => producer.id === userId);
                    if (loggedInProducer) {
                        loggedInProducer.fullName = `${loggedInProducer.name.lastName}, ${loggedInProducer.name.firstName}`;
                        loggedInProducer.intersectedState = loggedInProducer.licenses;
                        this.store.dispatch(new AddProducerList(loggedInProducer));
                    }
                }),
        );
    }

    /**
     * resets all tables and nav links
     */
    reloadData(): void {
        this.producersList = [];
        this.recentProducersList = [];
        this.searchedAccountList = [];
        this.type = this.SEARCH;
        this.initializeSearchForm();
        this.navLinks = [
            { label: this.SEARCH_PRODUCER, id: 1, type: this.SEARCH },
            { label: this.RECENT_PRODUCER, id: 2, type: this.RECENT },
        ];
    }

    /**
     * Close the Popup and reset the data.
     */
    onCancelClick(): void {
        this.dialogRef.close();
        this.reloadData();
    }
    /**
     * Sets the data in tabs on change of selected tab
     * @param id tab change event
     */
    showTab(id: MatTabChangeEvent): void {
        this.step = id.index;
        this.isSpinnerLoading = true;
        if (id.index === 0) {
            this.type = this.navLinks[0].type;
            const formvalue = this.searchProducerForm.value;
            if (formvalue && formvalue.producerData && formvalue.producerData.serachProd !== "" && this.producersList.length > 0) {
                this.setMatDataSource(this.producersList);
            } else {
                this.isSpinnerLoading = false;
                this.dataSource = undefined;
            }
        } else {
            this.type = this.navLinks[1].type;
            this.fetchRecentProducers();
        }
    }
    /**
     * Set the form and default values of the forms
     */
    initializeSearchForm(): void {
        this.searchProducerForm = this.formBuilder.group({
            searchType: [],
            producerData: this.formBuilder.group({
                serachProd: [""],
            }),
        });
        this.searchProducerForm.controls.searchType.setValue(SearchType.BY_PRODUCER);
    }
    /**
     * Search for the accounts or producers based on  search type and requested partial or complete value
     * @param valid validity of the form
     */
    search(valid: boolean): void {
        this.showErrorMessage = false;
        if (valid) {
            this.isSpinnerLoading = true;
            if (this.searchProducerForm.controls.searchType.value === SearchType.BY_PRODUCER) {
                this.searchByProducer();
            } else if (this.searchProducerForm.controls.searchType.value === SearchType.BY_PRODUCER_ACC) {
                this.searchByProducerAccount();
            }
        }
    }
    /**
     * Finds other producers' accounts (by account name / number entered in the search input)
     */
    searchByProducerAccount(): void {
        this.searchedAccountList = [];
        this.showProducer = false;
        let primaryProducer: Producer;
        const filterParams: FilterParameters = {
            filter: "",
            search: this.searchProducerForm.value.producerData.serachProd.toLowerCase().trim(),
            property: "",
            page: PaginationConstants.PAGE,
            size: PaginationConstants.SIZE,
            value: "",
        };
        this.subscriber.push(
            this.accountListService.getListAccounts(filterParams).subscribe(
                (results: AccountListResponse) => {
                    if (results.content && results.content.length !== 0) {
                        results.content.forEach((searchResult) => {
                            if (searchResult.producers.find((producer) => producer.primary === true)) {
                                primaryProducer = searchResult.producers.find((producer) => producer.primary === true);
                                searchResult.primaryProducer = `${primaryProducer.firstName} ${primaryProducer.lastName}`;
                            } else {
                                searchResult.primaryProducer = this.languageStrings["primary.portal.accounts.accountList.unassigned"];
                            }
                            searchResult.locked = Boolean(searchResult.lock);
                        });
                        this.searchedAccountList = results.content;
                    } else {
                        this.isSpinnerLoading = false;
                    }
                    this.displayColumns = [PRODUCER_GRID.ACCOUNT, PRODUCER_GRID.PRIMARY_PRODUCER, PRODUCER_GRID.MANAGE];
                    this.producerAccountData = new MatTableDataSource(this.searchedAccountList);
                    this.isSpinnerLoading = false;
                    this.showAccounts = true;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
    }
    /**
     * Search by producer and set the table data
     */
    searchByProducer(): void {
        this.showAccounts = false;
        const queryStr = this.getQueryParamString();
        this.subscriber.push(
            this.producerService.producerSearch(queryStr).subscribe(
                (value) => {
                    this.producersList = value.content;
                    this.prodCount = value.totalElements;
                    if (value.content && value.content.length !== 0) {
                        for (let prod of this.producersList) {
                            prod = this.getProducerExInfo(prod);
                        }
                    } else {
                        this.isSpinnerLoading = false;
                    }
                    this.isSpinnerLoading = false;
                    this.setMatDataSource(this.producersList);
                    this.showProducer = true;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.producersList = [];
                        this.setMatDataSource(this.producersList);
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            ),
        );
    }
    /**
     * Set the table data based on the search result when searched by producer
     * @return Returns prod
     */
    getProducerExInfo(prod: SearchProducer): SearchProducer {
        prod.fullName = `${prod.name.lastName}, ${prod.name.firstName}`;
        prod.intersectedState = prod.licenses;
        this.isSpinnerLoading = false;
        return prod;
    }

    /**
     * set the query params for search by producer
     * @returns params to search the producer
     */
    getQueryParamString(): Params {
        const params: Params = {};
        params["size"] = this.pageSize;
        params["page"] = this.pageNumber;
        if (this.searchProducerForm.value.producerData.serachProd && this.searchProducerForm.value.producerData.serachProd !== "") {
            params["search"] = this.searchProducerForm.value.producerData.serachProd.toLowerCase();
        }
        return params;
    }

    /**
     * set the table columns and data
     * @param filteredData data to be set in table
     */
    setMatDataSource(filteredData: SearchProducer[]): void {
        this.displayedColumns = [PRODUCER_GRID.NAME, PRODUCER_GRID.STATES, PRODUCER_GRID.NPN, PRODUCER_GRID.MANAGE];
        this.dataSource = new MatTableDataSource(filteredData);
        this.data = this.dataSource.data;
        this.isSpinnerLoading = false;
    }

    /**
     * Get the recent viewed producers and set table data in My Recent Producers tab
     */
    fetchRecentProducers(): void {
        this.subscriber.push(
            this.store.select(ProducerListState.getProducerList).subscribe((recentProducersList) => {
                this.recentProducersList = recentProducersList;
                if (this.recentProducersList) {
                    if (this.recentProducersList.length > this.RECENT_PRODUCER_LIST_MAX_LENGTH) {
                        this.recentProducersList = this.recentProducersList.slice(
                            this.recentProducersList.length - this.RECENT_PRODUCER_LIST_MAX_LENGTH,
                            this.recentProducersList.length,
                        );
                    }
                    this.recentProducersList = this.recentProducersList.slice().reverse();
                    this.setMatDataSource(this.recentProducersList);
                }
                this.isSpinnerLoading = false;
            }),
        );
    }

    /**
     * Sets no result message
     * @return Returns no result message of type string
     */
    getNoDataOnFilterErrorMessage(): string {
        if (this.step === 0) {
            return this.languageStrings["primary.portal.search.producer.noResult"].replace(
                "##selectedFilter##",
                this.searchProducerForm.value.producerData.serachProd,
            );
        }
        return this.languageStrings["primary.portal.search.producer.noResultText"];
    }

    /**
     * Sets the labels for tabs
     */
    setLanguageStrings(): void {
        this.SEARCH_PRODUCER = this.languageStrings["primary.portal.commission.producer.single.tab.search"];
        this.RECENT_PRODUCER = this.languageStrings["primary.portal.commission.producer.single.tab.recent"];
    }

    /**
     * Sets error string
     * @param err Error received from API
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        this.showErrorMessage = true;
        if (error && error.status === ClientErrorResponseCode.RESP_400) {
            if (error.code === ClientErrorResponseType.BAD_REQUEST) {
                this.errorMessage = this.languageStrings["primary.portal.search.producer.noResult"].replace(
                    "##selectedFilter##",
                    this.searchProducerForm.value.producerData.serachProd,
                );
            } else {
                this.errorMessage = error.message;
            }
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
        }
    }
    /**
     * Close the popup and set the producer data to store
     * @param producerData Redirect to the producer's view of accounts/ pended business
     * @param searchType represents the search type based on which the data will be sent after closed
     */
    goToDirect(producerData: SearchProducer, searchType: string): void {
        if (this.route.url.includes(PRODUCER_URL)) {
            this.store.dispatch(new SetSearchedProducer(producerData));
        }
        if (searchType === SearchType.BY_PRODUCER) {
            this.store.dispatch(new AddProducerList(producerData));
            this.dialogRef.close({ producerData, searchType });
        }
    }
    /**
     * Close the popup, set the producer data to store and redirect to account dashboard
     * @param producer data of producer to redirect to the account dashboard
     * @param searchType represents the search type based on which the data will be sent after closed
     */
    redirectToAccount(producer: AccountList, searchType: string): void {
        if (searchType === SearchType.BY_PRODUCER_ACC) {
            this.dialogRef.close({ producer, searchType });
        }
    }
    /**
     * change the hint based on selected radio button
     * @param event represents the change of the selected radio button
     */
    changeSearchType(event: HTMLInputElement): void {
        if (event.value === SearchType.BY_PRODUCER) {
            this.byProducerHint = true;
        } else if (event.value === SearchType.BY_PRODUCER_ACC) {
            this.byProducerHint = false;
        }
    }
    /**
     * Unsubscribe all subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
