import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input } from "@angular/core";
import {
    AccountListService,
    FilterParameters,
    StaticService,
    ProducerService,
    AccountListResponse,
    AccountList,
    SearchProducer,
} from "@empowered/api";
import { DataFilter } from "@empowered/ui";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { OverlayPositionBuilder, Overlay, OverlayRef, OverlayConfig } from "@angular/cdk/overlay";
import { CreateProspectComponent } from "./create-prospect/create-prospect.component";
import { ProducerFilterComponent } from "../producer-filter/producer-filter.component";
import { ComponentPortal } from "@angular/cdk/portal";
import { AccountsService } from "@empowered/common-services";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { ProdData, OverlayOpen, ProducerCredential } from "@empowered/constants";
import { MatSelect } from "@angular/material/select";
import { Subscription, Observable, combineLatest } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";
import { switchMap, filter, tap } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { PaginationConstants, Permission, ROLE } from "@empowered/constants";

enum ProducerFilterOptions {
    MY_ACCOUNTS = "1",
    TEAMS_ACC = "2",
    UNASSIGNED = "3",
    ALL_ACCOUNTS = "4",
    SPECIFIC_PRODUCER = "5",
}

@Component({
    selector: "empowered-prospect-accounts",
    templateUrl: "./prospect-accounts.component.html",
    styleUrls: ["./prospect-accounts.component.scss"],
})
export class ProspectAccountsComponent implements OnInit, OnDestroy {
    filterParams: FilterParameters = {
        filter: "",
        search: "",
        property: "",
        page: "",
        size: "",
        value: "",
    };
    zeroState = true;
    filterClassNames = {
        status: ["list-grid-filter", "filter-status"],
        renewal: ["list-grid-filter", "filter-renewal"],
        state: ["list-grid-filter", "filter-state"],
        notification: ["list-grid-filter", "filter-notification"],
        employeeCount: ["list-grid-filter", "filter-employeeCount"],
    };
    accountList: any;
    prospectData = [];
    stateData = [];
    searchState = true;
    searchString = "";
    searchInputEventTargetObj: string;
    producerFilterVal: any;
    filteredStateData = [];
    searchTermOnEnter: string;
    producerFilterDropdown: boolean;
    producerFilter;
    stateFilter;
    stateControl;
    savedStateChipList: any[];
    stateFilterVal: any;
    stateFilterValresult: string;
    stateChipList = [];
    dispError: string;
    producerFilterFlag: boolean;
    stateDropdown: any;
    thresholdFilter = "";
    subordinateFlag = false;
    filterChoiceState: any;
    allSelected = false;
    statesSubscription: Subscription;
    stateOnClick = [];
    isApply = false;
    dropdownStatus = true;
    isDisplayState: any;
    compareZero = 0;
    producerDisplay = "";
    filterOpen = false;
    threshold = false;
    producerBtn = false;
    overlayRef: OverlayRef;
    producerNameForOverlay: string;
    producerOptionSelectedForOverlay: string;
    accountNumber: string;
    myControl = new FormControl();
    options: string[] = ["One", "Two", "Three"];
    @Input() currentProducer: string;
    createProspectDialogRef: MatDialogRef<CreateProspectComponent>;
    @ViewChild("producerFilterTrigger") producerFilterTrigger: ElementRef;
    @ViewChild("stateFilterDropdown") stateFilterDropdown: MatSelect;
    subscriptions: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospects.converttoAccount",
        "primary.portal.prospects.prospects",
        "primary.portal.prospects.addProspects",
        "primary.portal.prospects.noprospectsAdded",
        "primary.portal.prospects.finishSetting",
        "primary.portal.prospects.searchProspects",
        "primary.portal.prospects.prospectNameor",
        "primary.portal.prospects.prospectName",
        "primary.portal.prospects.accountNumber",
        "primary.portal.prospects.filters",
        "primary.portal.prospects.producer",
        "primary.portal.prospects.state",
        "primary.portal.prospects.addProspect",
        "primary.portal.prospects.createNew",
        "primary.portal.prospects.import",
        "primary.portal.prospects.primaryProducer",
        "primary.portal.prospects.dateCreated",
        "primary.portal.prospects.manage",
        "primary.portal.prospects.completeAAOD",
        "primary.portal.prospects.viewcreateProposals",
        "primary.portal.prospects.noresultFound",
        "primary.portal.direct.customerList.showingResults",
        "primary.portal.producerFilter.producer",
        "primary.portal.accounts.accountList.state",
        "primary.portal.common.selectAll",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.accounts.accountList.name",
        "primary.portal.accounts.accountList.id",
    ]);
    defaultFilter = "type:PROSPECT";
    filter = {
        query: {
            name: "",
            groupNumber: "",
            id: undefined,
            products: [],
            producers: [],
            notificationCount: [],
            state: [],
            notifications: [],
            primaryProducer: "",
        },
        ranges: {
            employeeCount: [],
            renewalDate: [],
        },
        strictFields: {
            status: [],
        },
        freeText: {
            name: "",
            groupNumber: "",
        },
    };
    matDialog: any;
    isSpinnerLoading = false;
    searchData: any[];
    subordinateProducerIds: number[] = [];
    isHqAdmin: boolean;
    currentProducerId: number;
    searchedProducer: SearchProducer;
    loggedInProducerId = NaN;
    hasDeactivatePermission: boolean;
    totalProspects: number;

    constructor(
        private readonly accountListService: AccountListService,
        private readonly utilService: UtilService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly accountsService: AccountsService,
        private readonly dataFilter: DataFilter,
        private readonly elementRef: ElementRef,
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly route: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly userService: UserService,
        private readonly producerService: ProducerService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * open popup to add prospect
     */
    openCreateProspectPopUp(): void {
        const dialogRef = this.dialog.open(CreateProspectComponent, {
            backdropClass: "backdrop-blur",
            minWidth: "600px",
            panelClass: "create-prospect",
        });
        dialogRef.afterClosed().subscribe((mpGroup) => {
            if (mpGroup) {
                this.navigateToProspectDashboard(mpGroup);
            }
        });
    }
    openDialog(): void {
        this.createProspectDialogRef = this.dialog.open(CreateProspectComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "create-prospect",
        });
    }
    /**
     * set forms and get permissions, prospect list for producer
     */
    ngOnInit(): void {
        this.producerFilter = this.fb.control("");
        this.stateFilter = this.fb.control("");
        this.stateControl = this.fb.control("");
        this.getPermissions();
        this.getStates();
        this.onChangeOfProducer();
        this.subscriptions.push(
            this.accountsService
                .getProspectAccountResetStatus()
                .pipe(
                    filter((resp) => resp),
                    switchMap((resp) => {
                        this.isSpinnerLoading = true;
                        const producerFilter = `producers.id:${this.currentProducerId}|${this.defaultFilter}`;
                        return this.getProspectList(this.isHqAdmin ? producerFilter : this.defaultFilter);
                    }),
                )
                .subscribe((prospectList) => {
                    if (!prospectList.content.length) {
                        this.zeroState = true;
                    }
                    this.setProspectList(prospectList);
                    this.isSpinnerLoading = false;
                }),
        );
    }
    /**
     * get required permissions
     */
    getPermissions(): void {
        this.subscriptions.push(
            combineLatest([
                this.userService.credential$,
                this.staticUtilService.hasPermission(Permission.DEACTIVATE_PROSPECT),
                this.staticUtilService.hasPermission(Permission.ACCOUNTLIST_ROLE_20),
            ])
                .pipe(
                    tap(([credential, userPermission, hasPermission]: [ProducerCredential, boolean, boolean]) => {
                        if (credential.producerId) {
                            this.loggedInProducerId = credential.producerId;
                        }
                        this.hasDeactivatePermission = userPermission;
                        this.isHqAdmin = hasPermission;
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * get the producer ids and set prospect list
     */
    onChangeOfProducer(): void {
        const params = {
            supervisorProducerId: null,
            includeInactiveProducers: true,
            page: PaginationConstants.PAGE,
            size: PaginationConstants.SIZE,
        };
        let anyProducerSearched = false;
        this.subscriptions.push(
            combineLatest([this.accountsService.producerForProspect$, this.accountsService.isAnyAccViewed])
                .pipe(
                    switchMap(([producer, isProducerSearched]) => {
                        this.zeroState = true;
                        anyProducerSearched = isProducerSearched;
                        this.searchedProducer = producer;
                        if (producer && isProducerSearched) {
                            this.currentProducerId = producer.id;
                            this.currentProducer = `${producer.name.firstName} ${producer.name.lastName}`;
                        }
                        return this.userService.credential$;
                    }),
                    switchMap((credential) => {
                        if ("producerId" in credential) {
                            if (this.currentProducerId === credential.producerId) {
                                this.currentProducer = "";
                            }
                            if (!anyProducerSearched) {
                                this.currentProducerId = credential.producerId;
                            }
                        }
                        params.supervisorProducerId = this.currentProducerId;
                        return this.producerService.producerSearch(params);
                    }),
                    switchMap((subordinates) => {
                        let producerFilter = this.defaultFilter;
                        this.subordinateProducerIds = [];
                        this.subordinateProducerIds = subordinates.content.map((subordinate) => subordinate.id);
                        producerFilter = `producers.id:${this.currentProducerId}|${this.defaultFilter}`;
                        return this.isHqAdmin ? this.getProspectList(producerFilter) : this.getProspectList(this.defaultFilter);
                    }),
                    switchMap((prospectList) => {
                        if (prospectList.content.length) {
                            this.zeroState = false;
                        }
                        this.setProspectList(prospectList);
                        return this.getSelectedProducer();
                    }),
                    switchMap((resp: OverlayOpen) => {
                        this.closeOverlay(resp.isOpen);
                        this.isSpinnerLoading = false;
                        return this.stateFilter.valueChanges;
                    }),
                )
                .subscribe((stateFilterValue) => {
                    this.stateFilterVal = stateFilterValue;
                }),
        );
    }
    /**
     * get the prospect list
     * @param filterValue optional filter values to get prospect list
     * @returns prospect list as observable based on the provided filter value
     */
    getProspectList(filterValue?: string): Observable<AccountListResponse> {
        this.isSpinnerLoading = true;
        const filterParams = {
            filter: filterValue ? filterValue : this.defaultFilter,
            search: "",
            property: "",
            page: PaginationConstants.PAGE,
            size: PaginationConstants.SIZE,
            value: "",
            includeAllSubordinates: !!this.subordinateProducerIds.length,
        };
        return this.accountListService.getListAccounts(filterParams);
    }
    /**
     * set the prospect list
     * @param prospects prospects received from API
     */
    setProspectList(prospects: AccountListResponse): void {
        this.totalProspects = prospects.totalElements;
        this.accountList = this.utilService.copy(prospects);
        this.accountList.content.forEach((prospect: AccountList) => {
            prospect.canDeactivateProspect =
                this.hasDeactivatePermission ||
                prospect.producers.some(
                    (producer) => producer.id === this.currentProducerId && producer.accountProducerRole !== ROLE.ENROLLER,
                );
        });
        this.accountList.content.map((item) => {
            // condition to check whether producers array is empty or not
            if (item.producers !== undefined) {
                if (item.producers.length > 0 && item.producers.filter((producer) => producer.primary === true).length > 0) {
                    item["primaryProducer"] =
                        item.producers.filter((producer) => producer.primary === true)[0].firstName +
                        " " +
                        item.producers.filter((producer) => producer.primary === true)[0].lastName;
                } else {
                    item["primaryProducer"] = this.languageStrings["primary.portal.accounts.accountList.unassigned"];
                    if (item.inactiveProducerId) {
                        item["inactiveProducerName"] = item.inactiveProducerId.name;
                    }
                }
            }
            this.setInvited();
        });
    }
    /**
     * check the invited prospects to set the view invitation link
     */
    setInvited(): void {
        this.accountList.content.forEach((prospect) => {
            prospect.invited =
                prospect.producers.filter(
                    (producer) =>
                        (producer.id === this.currentProducerId || this.subordinateProducerIds.includes(producer.id)) &&
                        !producer.pendingInvitation,
                ).length === 0;
        });
        this.prospectData = this.searchData = this.accountList.content;
    }
    /**
     * close the overlay
     * @param isOpen status of overlay
     */
    closeOverlay(isOpen: boolean): void {
        if (isOpen) {
            this.overlayRef.dispose();
            this.accountsService.closeExpandedOverlayProducer({ isOpen: false });
            this.filterOpen = false;
            this.producerBtn = false;
        }
    }
    openFunc(): void {
        this.producerFilterDropdown = !this.producerFilterDropdown;
    }
    /**
     * filter the prospect list based on the search and filter values
     */
    filterDataObject(): void {
        if (!this.threshold) {
            this.filter = this.utilService.copy(this.filter);
            if (
                this.producerOptionSelectedForOverlay === ProducerFilterOptions.MY_ACCOUNTS ||
                this.producerOptionSelectedForOverlay === ProducerFilterOptions.ALL_ACCOUNTS
            ) {
                this.setAcceptedProspects(this.filter.query.state);
            } else {
                this.prospectData = this.searchData = this.dataFilter.transform(this.accountList.content, this.filter);
            }
        } else if (this.threshold) {
            this.filterParams.search = this.filter.freeText.name;
            {
                if (this.stateFilterVal && this.stateFilterVal.length > this.compareZero) {
                    this.thresholdFilter = this.thresholdFilter + "state:" + this.stateFilterVal + "|";
                    this.filterChoiceState = this.stateFilter.value;
                    this.isDisplayState = ": " + this.filterDisplayContent(this.stateData, this.stateFilterVal, "stateFilter");
                    this.stateFilterDropdown.close();
                } else {
                    this.stateFilterDropdown.close();
                }
            }
        }
    }
    /**
     * set prospect list and add accepted invites to my prospects
     * @param states selected states in state filter
     */
    setAcceptedProspects(states: string[]): void {
        const prospects = this.dataFilter.transform(this.accountList.content, this.filter);
        this.prospectData = this.searchData = [
            ...prospects,
            ...this.accountList.content.filter(
                (prospect) =>
                    prospect.producers.length > 1 &&
                    prospect.producers.filter(
                        (producer) =>
                            producer.id === this.currentProducerId &&
                            !producer.primary &&
                            (states.includes(prospect.state.toLowerCase()) || !states.length),
                    ).length > 0 &&
                    !prospects.map((duplicateProspect) => duplicateProspect.id).includes(prospect.id),
            ),
        ];
        this.checkDuplicateProspects();
    }
    /**
     * set the invitation status based on subordinates and their pendingInvitation status
     */
    checkDuplicateProspects(): void {
        this.prospectData = this.prospectData
            .filter(
                (prospect) =>
                    !prospect.invited &&
                    prospect.producers.some((producer) => producer.id === this.currentProducerId && producer.pendingInvitation),
            )
            .map((prospect) => {
                prospect.invited = true;
            });
        this.prospectData = this.searchData;
    }
    filterDisplayContent(optionsList: any, selectedOptions: any, filterName: string): any {
        let str = "";
        let arr = [];
        if (selectedOptions) {
            selectedOptions.forEach((element) => {
                if (element) {
                    str = str.concat(element);
                    arr = arr.concat(" " + element.toUpperCase());
                }
            });
        }
        if (str.length + arr.length * 2 - 1 > 30) {
            if (optionsList.length === arr.length) {
                return "All";
            }
            return arr.length;
        }
        if (optionsList.length === arr.length) {
            return "All";
        }
        return arr;
    }
    /**
     * get the current selected option in producer filter and filter the prospect list
     * @returns OverlayOpen status
     */
    getSelectedProducer(): Observable<OverlayOpen> {
        return combineLatest([this.accountsService.isProducerFilter, this.accountsService.currentProducer]).pipe(
            switchMap(([showProducerFilter, producer]) => {
                this.subordinateFlag = showProducerFilter;
                this.producerNameForOverlay = producer.producerName;
                this.producerOptionSelectedForOverlay = producer.filterByProducer;
                // primaryProducer filter gets updated to the latest producerName value every time the filter is changed
                this.filter.query.primaryProducer = producer.producerName;
                // producerDisplay is assigned with the updated producerName value every time the filter is changed
                this.producerDisplay = producer.producerName ? ": " + producer.producerName : "";
                this.producerFilterFlag = this.producerDisplay !== "" ? true : false;
                this.filterDataObject();
                this.isSpinnerLoading = false;
                return this.accountsService.expandedOverlay;
            }),
        );
    }
    /**
     * load producer filter overlay
     */
    loadExpandedView(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");
        this.filterOpen = true;
        this.producerBtn = true;
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.producerFilterTrigger)
            .withPositions([
                {
                    originX: "start",
                    originY: "bottom",
                    overlayX: "start",
                    overlayY: "top",
                    offsetY: 10,
                },
            ])
            .withLockedPosition(true);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            backdropClass: "productfilter-backdrop-view",
            panelClass: "producer-filter",
        });

        const popupComponentPortal = new ComponentPortal(ProducerFilterComponent);

        this.overlayRef = this.overlay.create(overlayConfig);

        this.overlayRef.backdropClick().subscribe(() => {
            this.overlayRef.dispose();
            bodyElement.classList.remove("negate-blur");
            this.filterOpen = false;
            this.producerBtn = false;
        });

        this.overlayRef.attach(popupComponentPortal);
        this.subscriptions.push(
            this.accountsService.currentProducer
                .pipe(
                    filter(
                        (currentProducer: ProdData) =>
                            currentProducer.producerName !== undefined ||
                            currentProducer.producerName !== null ||
                            currentProducer.producerName !== "",
                    ),
                    switchMap(() => this.getSelectedProducer()),
                )
                .subscribe((response) => {
                    this.closeOverlay(response.isOpen);
                }),
        );

        let prod = {};
        prod = {
            producerName: this.producerNameForOverlay,
            filterByProducer: this.producerOptionSelectedForOverlay,
        };
        this.accountsService.changeSelectedProducer(this.utilService.copy(prod));
    }
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    chipListDisplay(): any {
        if (this.filteredStateData.length > 0) {
            this.stateChipList.push(this.stateFilter.value[0]);
            this.stateFilter.setValue(this.stateChipList);
            this.stateControl.setValue("");
        } else {
            this.stateChipList = this.stateFilter.value;
        }
    }
    clickOutsideElement(event: any): void {
        event.stopPropagation();
        if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj && !this.threshold) {
            this.filterDataObjectOnEnter();
        } else if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj && this.threshold) {
            this.dropdownStatus = false;
        }
    }
    filterDataObjectOnEnter(): void {
        this.dropdownStatus = false;
        this.filter.freeText.name = this.searchTermOnEnter;
        this.filter.freeText.groupNumber = this.searchTermOnEnter;
        this.filterDataObject();
    }
    clickOutside(val: string): void {
        if (!this.isApply) {
            switch (val) {
                case "stateFilter":
                    this.stateFilter.setValue(this.stateOnClick);
                    this.stateChipList = this.stateOnClick;
                    break;
            }
        }
        this.isApply = false;
    }
    addRemoveState(stateName: string): void {
        const index = this.stateChipList.indexOf(stateName);
        if (index >= 0) {
            this.stateChipList.splice(index, 1);
        }
        this.stateFilter.setValue(this.stateChipList);
    }
    updateFilteredState(): void {
        this.stateControl.valueChanges.subscribe((val) => {
            this.stateFilterSearch(val);
        });
    }
    /**
     * Method to filter search by state
     * @param filteredSearch state text
     * @returns returns filtered state data
     */
    stateFilterSearch(filteredSearch: string): any {
        if (filteredSearch) {
            this.filteredStateData = this.stateDropdown.filter(
                (option) => option.abbreviation.toLowerCase().indexOf(filteredSearch.toLowerCase()) === 0,
            );
        } else {
            this.filteredStateData = [];
        }

        return this.stateData;
    }
    /**
     * get states list
     */
    getStates(): void {
        this.statesSubscription = this.staticService.getStates().subscribe(
            (value) => {
                this.stateDropdown = value;
                this.stateData = this.stateDropdown;
            },
            (error) => error,
        );
    }
    resetChips(): void {
        this.stateFilterVal = [];
        this.stateChipList = [];
        this.filter.query.state = [];
        this.stateFilter.setValue([]);
        this.removeText();
    }
    removeText(): void {
        /* setTimeout is required since it's a mat autocomplete clicking on any value
       from the dropdown will consider as click outside and
       the value will not get appended in the input field*/
        setTimeout(() => {
            // this.matInput.nativeElement.value = "";
            this.stateControl.setValue("");
        }, 250);
    }
    toggleSelectionAll(): void {
        this.allSelected = !this.allSelected;
        if (this.allSelected) {
            this.stateFilterVal = this.stateData.map((element) => element.abbreviation.toLowerCase());
            this.stateFilter.setValue(this.stateFilterVal);
            this.stateChipList = this.stateFilter.value;
        } else {
            this.stateFilter.setValue([]);
            this.stateChipList = [];
        }
    }
    resetVal(val: string): void {
        this.dispError = "";
        this.isApply = true;
        switch (val) {
            case "stateFilter":
                this.stateFilterVal = [];
                this.stateOnClick = [];
                this.stateChipList = [];
                this.filter.query.state = [];
                this.stateFilterDropdown.close();
                this.stateFilter.setValue([]);
                this.isDisplayState = "";
                break;
        }
        this.filterDataObject();
    }
    filterApply(val: string): any {
        this.isApply = true;
        if (!this.threshold) {
            switch (val) {
                case "stateFilter":
                    this.filterChoiceState = this.stateFilter.value;
                    this.filter.query.state = this.stateFilterVal;
                    this.stateOnClick = [...this.stateFilter.value];
                    this.savedStateChipList = this.stateChipList;

                    this.stateControl.setValue("");
                    this.isDisplayState = ": " + this.filterDisplayContent(this.stateDropdown, this.stateFilterVal, "stateFilter");
                    this.stateFilterDropdown.close();
                    this.stateFilterDropdown.focus();
                    break;
            }
        }
        this.filterDataObject();
    }
    searchDropdownClose(): void {
        this.searchState = true;
    }
    /**
     * Function to filter the prospect data with the entered keyword
     * @param key keyword to search with
     */
    searchAccounts(key: string): void {
        this.searchString = key;
        if (key.length < 3) {
            this.prospectData = this.searchData;
            this.searchState = true;
        } else {
            this.searchState = false;
            this.prospectData = this.searchData.filter(
                (account) =>
                    (account.name && account.name.toLowerCase().indexOf(key.trim().toLowerCase()) >= 0) ||
                    (account.groupNumber && account.groupNumber.toLowerCase().indexOf(key.trim().toLowerCase()) >= 0),
            );
        }
    }
    navigateToProspectDashboard(mpGroup: number): void {
        this.route.navigate([`./prospect/${mpGroup}`], { relativeTo: this.activatedRoute });
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        if (this.statesSubscription) {
            this.statesSubscription.unsubscribe();
        }
        this.subscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
    }
}
