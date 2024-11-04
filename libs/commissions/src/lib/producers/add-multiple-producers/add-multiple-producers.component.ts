import { ClientErrorResponseCode, ClientErrorResponseType, AppSettings, CountryState } from "@empowered/constants";
import { Component, OnInit, OnDestroy, ViewChild, Optional, Inject } from "@angular/core";
import { SelectionModel } from "@angular/cdk/collections";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Store } from "@ngxs/store";
import { CommissionsState, UtilService } from "@empowered/ngxs-store";
import {
    ProducerService,
    CoreService,
    AccountService,
    AccountInvitation,
    StaticService,
    BenefitsOfferingService,
    CarrierAppointment,
} from "@empowered/api";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { Subscription, Observable, Subject } from "rxjs";

import { DataFilter } from "@empowered/ui";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { SafeHtml } from "@angular/platform-browser";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";

@Component({
    selector: "empowered-add-multiple-producers",
    templateUrl: "./add-multiple-producers.component.html",
    styleUrls: ["./add-multiple-producers.component.scss"],
    providers: [DataFilter],
})
export class AddMultipleProducersComponent implements OnInit, OnDestroy {
    @ViewChild("stateHierarchyFilterDropdown") stateHierarchyFilterDropdown: MatSelect;
    @ViewChild("carrierHierarchyFilterDropdown") carrierHierarchyFilterDropdown: MatSelect;
    @ViewChild("stateAllProducerFilterDropdown", { static: true }) stateAllProducerFilterDropdown: MatSelect;
    @ViewChild("carrierAllProducerFilterDropdown", { static: true }) carrierAllProducerFilterDropdown: MatSelect;

    recentProducerDataList = [];
    recentList = [];
    hierarchyList = [];
    allProducerList = [];
    myhierarchyDataList = [];
    allProducerDataList = [];
    alreadyLoadedRecentProducer = false;
    alreadyLoadedMyhierarchy = false;
    alreadyLoadedAllProducer = false;

    isFilterApplyMyHierarchy = false;

    allProducerForm: FormGroup;
    myhierarchyForm: FormGroup;
    subscriber: Subscription[] = [];
    hierarchyStateSelectedData: any[];
    hierarchyCarrierSelectedData: any[];
    isHierarchyFilterApply = false;
    benefitOfferingStatesData: any[];

    displayColumns: string[];
    languageStrings: Record<string, string>;
    LicensedStateList: CountryState[];
    carrierList: any[];
    mpGroupId: number;
    loggedInProducerId: number;
    initialSelection = [];
    allowMultiSelect = true;
    selection: any;
    dataSource: any;
    configCount: number;
    prodCount: number;
    CONFIG_STR = "group.producers.carrier_and_license_display.max_producers";
    filterType = {
        CARRIER: "CARRIER",
        STATE: "STATE",
    };
    dataSourceFields = {
        ID: "id",
        NAME: "name",
        LICENSED_STATES: "licensedStates",
        NPN: "npn",
        LICENSED_STATES_TOOLTIP: "licensedStateTooltip",
        CARRIER_TOOLTIP: "carrierTooltip",
        ASSOCIATED_PRODUCER: "associatedProducer",
    };
    columnName = {
        SELECT: "select",
        NAME: "name",
        STATES: "states",
        NPN: "npn",
    };
    formField = {
        STATE_FILTER: "stateFilter",
        CARRIER_FILTER: "carrierFilter",
    };
    step = 0;
    pageNumber = 1;
    pageSize: number;
    searchTerm = undefined;
    isDirect: boolean;
    hierarchyFilter = {
        searchText: undefined,
        carrierFilter: [],
        stateFilter: [],
    };
    allProducerFilter = {
        searchText: undefined,
        carrierFilter: [],
        stateFilter: [],
    };

    minimumSearchLength = 3;
    isSpinnerLoading = false;
    showErrorMessage = false;
    errorMessage = "";

    tabType = {
        MY_RECENT_PRODUCERS: "MY_RECENT_PRODUCERS",
        MY_HIERARCHY: "MY_HIERARCHY",
        ALL_PRODUCERS: "ALL_PRODUCERS",
    };
    showHeirarchyTab: boolean;
    producersInvited = false;

    constructor(
        private readonly dialogRef: MatDialogRef<AddMultipleProducersComponent>,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly producerService: ProducerService,
        private readonly language: LanguageService,
        private readonly coreService: CoreService,
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: any,
    ) {}

    ngOnInit(): void {
        this.pageSize = AppSettings.PAGE_SIZE_1000;
        this.getLanguageStrings();
        this.displayColumns = [this.columnName.SELECT, this.columnName.NAME, this.columnName.STATES, this.columnName.NPN];
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.mpGroupId = this.store.selectSnapshot(CommissionsState.groupId);
        this.loggedInProducerId = this.data.loggedInProducerId;
        this.showHeirarchyTab = this.data.showHeirarchyTab;
        this.isDirect = this.data.isDirect;
        this.getBenefitOfferingStates();
        this.intializeForm();
        this.selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);
        this.getConfigurations();
        this.onSelectRecentProducerTab();
        this.getAllProducersLicensedStates();
        this.getCarriers();
    }

    intializeForm(): void {
        this.allProducerForm = this.fb.group({
            nameFilter: [""],
            carrierFilter: [""],
            stateFilter: [""],
        });
        this.myhierarchyForm = this.fb.group({
            searchProducer: [""],
            carrierFilter: [""],
            stateFilter: [""],
        });
    }
    // Selection Section
    isAllSelected(): boolean | undefined {
        if (this.dataSource && this.dataSource.data) {
            const numSelected = this.selection.selected.length;
            const numRows = this.dataSource.data.length;
            return numSelected === numRows;
        }
        return undefined;
    }

    onAllElementSelection(event: any): void {
        if (event && this.dataSource && this.dataSource.data) {
            this.dataSource.data.forEach((row) => {
                if (event.checked) {
                    this.selection.select(row.id);
                } else if (this.selection.isSelected(row.id)) {
                    this.selection.toggle(row.id);
                }
            });
        }
    }
    onSingleElementSelection(event: any, element: any): void {
        if (event) {
            this.selection.toggle(element.id);
        }
    }
    setSelection(): void {
        this.selection = new SelectionModel<any>(this.allowMultiSelect, this.selection.selected);
    }

    OnTabChange(event: MatTabChangeEvent): void {
        this.step = event.index;
        this.dataSource = [];
        this.hideErrorAlertMessage();
        if (this.step === 0) {
            this.onSelectRecentProducerTab();
        } else if (this.step === 1) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            this.showHeirarchyTab ? this.onSelectHierarchyTab() : this.onSelectAllProducerTab();
        } else if (this.step === 2) {
            this.onSelectAllProducerTab();
        }
    }
    /**
     * @description returns true if the carrier is unique else false
     * @param carrierName {string} the name of the carrier
     * @param index {number} the index of the carrier
     * @param carrierArr {string[]} the carrier array
     * @returns {boolean} if the carrier is unique or not
     */
    uniqueCarriers(carrierName: string, index: number, carrierArr: string[]): boolean {
        return carrierArr.indexOf(carrierName) === index;
    }
    /**
     * @description generates the html to display for carrier tool tip
     * @param data {CarrierAppointment[]} the carrier data
     * @returns {SafeHtml} the html to display for carrier tool tip
     */
    getCarrierTooltip(data: CarrierAppointment[]): SafeHtml | undefined {
        if (data && data.length > 0) {
            const carrierArr = [];
            const title = this.languageStrings["primary.portal.commission.producer.multiple.table.carriers"];
            for (const carrierData of data) {
                carrierArr.push(carrierData.carrier.name);
            }
            return this.utilService.refactorTooltip(carrierArr.filter(this.uniqueCarriers), title);
        }
        return undefined;
    }
    getLicensedStateTooltip(data: any[]): any {
        if (data && data.length > 0) {
            const stateArr = [];
            const title = this.languageStrings["primary.portal.commission.producer.multiple.table.availableState"];
            for (const stateData of data) {
                stateArr.push(stateData.state.abbreviation + ": " + stateData.number);
            }
            return this.utilService.refactorTooltip(stateArr, title);
        }
    }
    closePopup(): void {
        this.dialogRef.close(false);
    }
    addProdcuers(): void {
        this.hideErrorAlertMessage();
        const selectedRow = this.selection.selected;
        if (!selectedRow.length) {
            this.showErrorMessage = true;
            this.errorMessage = this.languageStrings["primary.portal.commission.producer.multiple.producerMustSelected"];
        } else {
            const inviteProducerObject: AccountInvitation = {
                invitedProducerIds: selectedRow,
                message: " ",
            };
            this.producersInvited = true;
            this.subscriber.push(
                this.accountService.inviteProducer(inviteProducerObject, this.mpGroupId).subscribe(
                    (Response) => {
                        this.producersInvited = false;
                        this.dialogRef.close(true);
                    },
                    (Error) => {
                        this.producersInvited = false;
                        this.showErrorAlertMessage(Error);
                    },
                ),
            );
        }
    }
    getNoDataOnFilterErrorMessage(): string {
        let filterErrorMessage = this.languageStrings["primary.portal.commission.producer.multiple.noResultText"];
        if (this.step === 0) {
            return filterErrorMessage;
        }
        const filter = this.step === 1 ? this.hierarchyFilter : this.allProducerFilter;
        const isSearchFilter = filter.searchText && filter.searchText !== "";
        const isNoFilter = !filter.carrierFilter.length && !filter.stateFilter.length;
        const isBothFilter = filter.carrierFilter.length && filter.stateFilter.length;
        const isAnyFilter =
            (!filter.carrierFilter.length && filter.stateFilter.length) || (filter.carrierFilter.length && !filter.stateFilter.length);

        if (isNoFilter) {
            filterErrorMessage = isSearchFilter
                ? this.languageStrings["primary.portal.commission.producer.multiple.noResult"].replace(
                    "##selectedFilter##",
                    filter.searchText,
                )
                : this.languageStrings["primary.portal.commission.producer.multiple.noResultText"];
        } else if (isBothFilter) {
            filterErrorMessage = isSearchFilter
                ? this.languageStrings["primary.portal.commission.producer.multiple.noResultSearchSelectedFilter"].replace(
                    "##search##",
                    filter.searchText,
                )
                : this.languageStrings["primary.portal.commission.producer.multiple.noResultSelectedFilter"];
        } else if (isAnyFilter) {
            let carrierText = this.languageStrings["primary.portal.commission.producer.multiple.all.carriers"];
            if (this.carrierList.length !== filter.carrierFilter.length) {
                const carrierObj = this.carrierList.filter((x) => filter.carrierFilter.indexOf(x.id) !== -1);
                carrierText = carrierObj.map((x) => x.name).join(",");
            }
            let stateText = this.languageStrings["primary.portal.commission.producer.multiple.all.states"];
            if (this.LicensedStateList.length !== filter.stateFilter.length) {
                const stateObj = this.LicensedStateList.filter((x) => filter.stateFilter.indexOf(x.abbreviation) !== -1);
                stateText = stateObj.map((x) => x.name).join(",");
            }
            const txt = isSearchFilter
                ? this.languageStrings["primary.portal.commission.producer.multiple.noResultSearchAndFilter"].replace(
                    "##search##",
                    filter.searchText,
                )
                : this.languageStrings["primary.portal.commission.producer.multiple.noResult"];
            filterErrorMessage = filter.carrierFilter.length
                ? txt.replace(
                    "##selectedFilter##",
                    this.languageStrings["primary.portal.commission.producer.multiple.filter.carrier"] + ": " + carrierText,
                )
                : txt.replace(
                    "##selectedFilter##",
                    this.languageStrings["primary.portal.commission.producer.multiple.filter.state"] + ": " + stateText,
                );
        }
        return filterErrorMessage;
    }

    // Recent Producers section
    onSelectRecentProducerTab(): void {
        if (this.alreadyLoadedRecentProducer) {
            this.dataSource = new MatTableDataSource(this.recentProducerDataList);
            this.setSelection();
        } else {
            this.isSpinnerLoading = true;
            this.subscriber.push(
                this.loadRecentProducerData().subscribe((list) => {
                    this.isSpinnerLoading = false;
                    this.dataSource = new MatTableDataSource(list);
                    this.recentProducerDataList = [...this.dataSource.data];
                    this.alreadyLoadedRecentProducer = true;
                }),
            );
        }
    }
    loadRecentProducerData(): Observable<Array<any>> {
        const returnFlag = new Subject<any>();
        this.subscriber.push(
            this.producerService.getRecentlyInvitedProducers(this.loggedInProducerId.toString(), this.mpGroupId).subscribe(
                (list) => {
                    this.recentList = list;
                    this.prodCount = list.length;
                    this.recentList.forEach((element) => {
                        this.setDataSources(element, this.recentList, returnFlag);
                    });
                    returnFlag.next(this.recentList);
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.dataSource = [];
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
        return returnFlag.asObservable();
    }

    // My Hierarchy section
    onSelectHierarchyTab(): void {
        if (this.alreadyLoadedMyhierarchy && !this.isFilterApplyMyHierarchy) {
            this.dataSource = new MatTableDataSource(this.myhierarchyDataList);
            this.setSelection();
        } else {
            this.isSpinnerLoading = true;
            this.subscriber.push(
                this.loadHierarchyProducerData().subscribe((list) => {
                    this.isSpinnerLoading = false;
                    this.dataSource = new MatTableDataSource(list);
                    this.myhierarchyDataList = [...this.dataSource.data];
                    this.alreadyLoadedMyhierarchy = true;
                    this.isFilterApplyMyHierarchy = false;
                }),
            );
        }
    }
    loadHierarchyProducerData(): Observable<Array<any>> {
        const returnFlag = new Subject<any>();
        const paramStr = this.getQueryParamForHierarchyTab();
        this.subscriber.push(
            this.producerService.producerSearch(paramStr).subscribe(
                (Response) => {
                    this.hierarchyList = Response.content;
                    this.prodCount = Response.totalElements;
                    this.hierarchyList.forEach((element) => {
                        this.setDataSources(element, this.hierarchyList, returnFlag);
                    });
                    returnFlag.next(this.hierarchyList);
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.dataSource = [];
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
        return returnFlag.asObservable();
    }
    getAllProducersLicensedStates(): void {
        this.subscriber.push(
            this.producerService.getAllProducersLicensedStates(this.mpGroupId).subscribe(
                (Response) => {
                    this.LicensedStateList = Response;
                },
                (Error) => {
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
    }
    /**
     * Method to get carrier details
     */
    getCarriers(): void {
        this.subscriber.push(
            this.coreService.getCarriers().subscribe(
                (Response) => {
                    this.carrierList = [...Response].sort((a, b) => (a.name > b.name ? 1 : -1));
                },
                (Error) => {
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
    }
    hierarchyFilterApply(type: string): void {
        this.isHierarchyFilterApply = true;
        if (type === this.filterType.STATE) {
            this.hierarchyFilter.stateFilter = this.myhierarchyForm.get(this.formField.STATE_FILTER).value;
            this.hierarchyStateSelectedData = this.hierarchyFilter.stateFilter;
            this.stateHierarchyFilterDropdown.close();
        } else if (type === this.filterType.CARRIER) {
            this.hierarchyFilter.carrierFilter = this.myhierarchyForm.get(this.formField.CARRIER_FILTER).value;
            this.hierarchyCarrierSelectedData = this.hierarchyFilter.carrierFilter;
            this.carrierHierarchyFilterDropdown.close();
        }
        this.isFilterApplyMyHierarchy = true;
        this.onSelectHierarchyTab();
    }
    hierarchyFilterReset(type: string): void {
        this.isHierarchyFilterApply = true;
        if (type === this.filterType.STATE) {
            this.myhierarchyForm.get(this.formField.STATE_FILTER).setValue([]);
            this.hierarchyFilter.stateFilter = [];
            this.hierarchyStateSelectedData = [];
            this.stateHierarchyFilterDropdown.close();
        } else if (type === this.filterType.CARRIER) {
            this.myhierarchyForm.get(this.formField.CARRIER_FILTER).setValue([]);
            this.hierarchyFilter.carrierFilter = [];
            this.hierarchyCarrierSelectedData = [];
            this.carrierHierarchyFilterDropdown.close();
        }
        this.isFilterApplyMyHierarchy = true;
        this.onSelectHierarchyTab();
    }
    hierarchyFilterClickOutside(type: string): void {
        if (!this.isHierarchyFilterApply) {
            if (type === this.filterType.STATE) {
                this.myhierarchyForm
                    .get(this.formField.STATE_FILTER)
                    .setValue(this.hierarchyStateSelectedData ? this.hierarchyStateSelectedData : []);
            } else if (type === this.filterType.CARRIER) {
                this.myhierarchyForm
                    .get(this.formField.CARRIER_FILTER)
                    .setValue(this.hierarchyCarrierSelectedData ? this.hierarchyCarrierSelectedData : []);
            }
        }
        this.isHierarchyFilterApply = false;
    }
    applySearchFilter(searchValue: any): void {
        if (searchValue.target.value.length >= this.minimumSearchLength) {
            this.hierarchyFilter.searchText = searchValue.target.value;
            this.isFilterApplyMyHierarchy = true;
            this.onSelectHierarchyTab();
        } else if (searchValue.target.value.length === 0) {
            this.hierarchyFilter.searchText = undefined;
            this.isFilterApplyMyHierarchy = true;
            this.onSelectHierarchyTab();
        }
    }
    getQueryParamForHierarchyTab(): any {
        const params = {};
        let statefilterText: string;
        let carrierfilterText: string;
        params["supervisorProducerId"] = this.loggedInProducerId;
        if (this.hierarchyFilter.searchText && this.hierarchyFilter.searchText !== "") {
            params["search"] = this.hierarchyFilter.searchText.toLowerCase();
        }
        if (this.hierarchyFilter.stateFilter && this.hierarchyFilter.stateFilter.length) {
            statefilterText = "producerListItem.license.state:" + this.hierarchyFilter.stateFilter.join(",");
        }
        if (this.hierarchyFilter.carrierFilter && this.hierarchyFilter.carrierFilter.length) {
            carrierfilterText = "producerListItem.carrierId:" + this.hierarchyFilter.carrierFilter.join(",");
        }
        if (statefilterText && carrierfilterText) {
            params["filter"] = statefilterText + "|" + carrierfilterText;
        } else if ((!statefilterText && carrierfilterText) || (statefilterText && !carrierfilterText)) {
            params["filter"] = statefilterText ? statefilterText : carrierfilterText;
        }

        return params;
    }

    // All Producer section
    onSelectAllProducerTab(): void {
        if (this.alreadyLoadedAllProducer) {
            this.dataSource = new MatTableDataSource(this.allProducerDataList);
            this.setSelection();
        }
    }
    /**
     * This function is to get producers list and set in mat table data source format.
     */
    onFilterAllProducer(): void {
        this.isSpinnerLoading = true;
        this.subscriber.push(
            this.loadAllProducerData().subscribe((list) => {
                this.isSpinnerLoading = false;
                const producerList = [...list].sort((a, b) => (a.name.lastName.toLowerCase() > b.name.lastName.toLowerCase() ? 1 : -1));
                this.dataSource = new MatTableDataSource(producerList);
                this.allProducerDataList = [...this.dataSource.data];
                this.alreadyLoadedAllProducer = true;
            }),
        );
    }
    loadAllProducerData(): Observable<Array<any>> {
        const returnFlag = new Subject<any>();
        const paramStr = this.getQueryParamForAllProducerTab();
        this.subscriber.push(
            this.producerService.producerSearch(paramStr).subscribe(
                (Response) => {
                    this.allProducerList = Response.content;
                    this.prodCount = Response.totalElements;
                    this.allProducerList.forEach((element) => {
                        this.setDataSources(element, this.allProducerList, returnFlag);
                    });
                    returnFlag.next(this.allProducerList);
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.dataSource = [];
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
        return returnFlag.asObservable();
    }
    getQueryParamForAllProducerTab(): any {
        const values = this.allProducerForm.value;
        this.allProducerFilter = {
            searchText: values.nameFilter,
            carrierFilter: values.carrierFilter,
            stateFilter: values.stateFilter,
        };
        let statefilterText: string;
        let carrierfilterText: string;
        const params = {};
        if (!this.isDirect) {
            params["associatedAccountId"] = this.mpGroupId;
        }
        params["size"] = this.pageSize;
        params["page"] = this.pageNumber;
        if (this.allProducerFilter.searchText && this.allProducerFilter.searchText !== "") {
            params["search"] = this.allProducerFilter.searchText.toLowerCase();
        }
        if (this.allProducerFilter.stateFilter && this.allProducerFilter.stateFilter.length) {
            statefilterText = "producerListItem.license.state:" + this.allProducerFilter.stateFilter.join(",");
        }
        if (this.allProducerFilter.carrierFilter && this.allProducerFilter.carrierFilter.length) {
            carrierfilterText = "producerListItem.carrierId:" + this.allProducerFilter.carrierFilter.join(",");
        }
        if (statefilterText && carrierfilterText) {
            params["filter"] = statefilterText + "|" + carrierfilterText;
        } else if ((!statefilterText && carrierfilterText) || (statefilterText && !carrierfilterText)) {
            params["filter"] = statefilterText ? statefilterText : carrierfilterText;
        }
        return params;
    }
    selectAll(type: string, event: any, tabType: string): void {
        let form: any;
        if (tabType === this.tabType.MY_HIERARCHY) {
            form = this.myhierarchyForm;
        } else if (tabType === this.tabType.ALL_PRODUCERS) {
            form = this.allProducerForm;
        }
        if (form && type === this.filterType.STATE) {
            form.get(this.formField.STATE_FILTER).setValue(event.checked ? this.LicensedStateList.map((x) => x.abbreviation) : []);
        } else if (form && type === this.filterType.CARRIER) {
            form.get(this.formField.CARRIER_FILTER).setValue(event.checked ? this.carrierList.map((x) => x.id) : []);
        }
    }
    getDisplayText(type: string, form: FormGroup): string {
        let returnString = "";
        if (type === this.filterType.STATE) {
            const val = form.get(this.formField.STATE_FILTER).value;
            if (val !== "" && val.length > 0) {
                returnString =
                    val.length === this.LicensedStateList.length
                        ? this.languageStrings["primary.portal.commission.producer.multiple.allText"]
                        : this.LicensedStateList.find((x) => x.abbreviation === val[0]).name;
            }
        } else if (type === this.filterType.CARRIER) {
            const val = form.get(this.formField.CARRIER_FILTER).value;
            if (val !== "" && val.length > 0) {
                returnString =
                    val.length === this.carrierList.length
                        ? this.languageStrings["primary.portal.commission.producer.multiple.allText"]
                        : this.carrierList.find((x) => x.id === val[0]).name;
            }
        }
        return returnString;
    }
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err["error"];
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else if (error.code === ClientErrorResponseType.FORBIDDEN) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}. ${error.code}`);
        }
        this.showErrorMessage = true;
    }
    getConfigurations(): void {
        this.subscriber.push(
            this.staticService.getConfigurations(this.CONFIG_STR, parseFloat(this.mpGroupId.toString())).subscribe((Response) => {
                if (Response.length > 0 && Response[0].name === this.CONFIG_STR) {
                    this.configCount = parseFloat(Response[0].value);
                }
            }),
        );
    }
    /**
     * fetch BO offered states
     */
    getBenefitOfferingStates(): void {
        this.subscriber.push(
            this.benefitOfferingService.getBenefitOfferingSettings(this.mpGroupId).subscribe((Response) => {
                this.benefitOfferingStatesData = Response.states;
            }),
        );
    }

    setDataSources(element: any, list: any, returnFlag: Subject<any>): void {
        if (element.id) {
            this.displayColumns =
                list.length > this.configCount
                    ? [this.columnName.SELECT, this.columnName.NAME, this.columnName.NPN]
                    : [this.columnName.SELECT, this.columnName.NAME, this.columnName.STATES, this.columnName.NPN];
            const licensesArray = this.isDirect
                ? element.licenses
                : element.licenses &&
                  element.licenses.filter((license) =>
                      this.benefitOfferingStatesData.map((state) => state.abbreviation).includes(license.state.abbreviation),
                  );
            element[this.dataSourceFields.LICENSED_STATES_TOOLTIP] = this.getLicensedStateTooltip(licensesArray);
            element[this.dataSourceFields.LICENSED_STATES] = licensesArray;
            returnFlag.next(list);

            element[this.dataSourceFields.CARRIER_TOOLTIP] = element.carrierAppointments.length
                ? this.getCarrierTooltip(element.carrierAppointments)
                : undefined;
            returnFlag.next(list);

            element[this.dataSourceFields.ASSOCIATED_PRODUCER] = element.associatedProducer ? element.associatedProducer : false;

            element[this.dataSourceFields.ID] = element.id;
            element[this.dataSourceFields.NAME] = element.name.lastName + ", " + element.name.firstName;
            element[this.dataSourceFields.NPN] = element.npn;
            returnFlag.next(list);
        }
    }

    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.commission.producer.multiple.tab.recent",
            "primary.portal.commission.producer.multiple.tab.hierarchy",
            "primary.portal.commission.producer.multiple.tab.all",
            "primary.portal.commission.producer.multiple.noResult",
            "primary.portal.commission.producer.multiple.producerMustSelected",
            "primary.portal.commission.producer.multiple.noResultText",
            "primary.portal.commission.producer.multiple.noResultSelectedFilter",
            "primary.portal.commission.producer.multiple.allText",
            "primary.portal.commission.producer.multiple.tab.addBtn",
            "primary.portal.commission.producer.multiple.table.carriers",
            "primary.portal.commission.producer.multiple.table.availableState",
            "primary.portal.commission.producer.multiple.noResultSearchSelectedFilter",
            "primary.portal.commission.producer.multiple.noResultSearchAndFilter",
            "primary.portal.commission.producer.multiple.filter.carrier",
            "primary.portal.commission.producer.multiple.filter.state",
            "primary.portal.commission.producer.multiple.all.states",
            "primary.portal.commission.producer.multiple.all.carriers",
            "primary.portal.addSingleProducer.infoIcon",
            "primary.portal.common.search",
            "primary.portal.commission.producer.multiple.search",
            "primary.portal.common.close",
            "primary.portal.commission.producer.multiple.filter.name",
            "primary.portal.commission.producer.multiple.noState",
            "primary.portal.commission.producer.multiple.addProducer",
            "primary.portal.direct.commission.producer.multiple.addProducer",
            "primary.portal.common.clear",
            "primary.portal.common.apply",
            "primary.portal.common.cancel",
        ]);
    }

    // On Destroy
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
