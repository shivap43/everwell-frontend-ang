import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { Component, OnInit, AfterContentInit, OnDestroy, ViewChild } from "@angular/core";
import { AddMultipleProducersComponent } from "./add-multiple-producers/add-multiple-producers.component";
import { ChangeProducerRoleComponent } from "./change-producer-role/change-producer-role.component";
import { Subscription, combineLatest, of, iif } from "rxjs";
import { Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AccountService, ProducerService, BenefitsOfferingService, License } from "@empowered/api";
import { UserService } from "@empowered/user";
import { MatDialog } from "@angular/material/dialog";
import { filter, switchMap, map, catchError, tap, finalize } from "rxjs/operators";
import {
    Permission,
    ClientErrorResponseCode,
    BooleanConst,
    ROLE,
    ProducerDetails,
    AppSettings,
    AccountProducer,
    SortOrder,
    ProducerCredential,
} from "@empowered/constants";
import { ProducerUtilService } from "../services/producer.util.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SafeHtml } from "@angular/platform-browser";
import { CommissionsState, SetRole, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MonDialogComponent, MonDialogData, DataFilter, AddSingleProducerComponent } from "@empowered/ui";

const EMPTY_SPACE = "";
const PROSPECT = "prospect";
interface RoleType {
    id: ROLE;
    name: string;
}
@Component({
    selector: "empowered-producers",
    templateUrl: "./producers.component.html",
    styleUrls: ["./producers.component.scss"],
    providers: [DataFilter],
})
export class ProducersComponent implements OnInit, AfterContentInit, OnDestroy {
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    producerList: any;
    loggedInProducerId: number;
    dataSource: MatTableDataSource<any>;
    pageSizeOptions: any;
    data: AccountProducer[];
    minimumSearchLength = 3;
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    displayedColumns: any;
    searchInput: string;
    defaultPageNumber = "1";
    mpGroupId: number;
    languageString: Record<string, string>;
    previousPrimaryFirstName: any;
    options: any;
    pageSize: number;
    pageNumber = 1;
    searchTerm = undefined;
    searchTermOnEnter: string;
    isSpinnerLoading = false;
    benefitOfferingStatesData: any[];
    totalElements: number;
    isEfinancialAgent = false; // Same variable used for Stride Life Quote and Clearlink Call Centres
    STATE: "STATE";
    CARRIER = "CARRIER";
    displayColumns = {
        NAME: "name",
        ROLE: "role",
        STATES: "states",
        NPN: "npn",
        MANAGE: "manage",
    };
    ERROR = "error";
    DETAILS = "details";
    errorMessage: string;
    showErrorMessage = false;
    filter = {
        freeText: {
            name: "",
            writingNumbers: "",
        },
    };
    roleTypes: RoleType[];
    subscriber: Subscription[] = [];
    activeCol: string;
    loggedInProducer: any;
    isDirect: boolean;
    noProducersFlag = false;
    producerHeirarchyFlag: boolean;
    uniqueCarrierArr: string[];
    isEnrollerRole: boolean;
    isPrimaryProducerRole: boolean;
    loggedInProducerRole: string;
    isPrimaryProducerAdded: boolean;
    permissionEnum = Permission;
    producersHierarchy: ProducerDetails[];
    isReportingManager: boolean;
    isRMOfPrimaryProducer: boolean;
    primaryProducerId: number;
    isManagingProducerForEnroller = false;
    isProspect: boolean;
    enrollerReadOnlyConfig: boolean;
    HQSupportRolePermission: boolean;

    constructor(
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly producerService: ProducerService,
        private readonly producerUtilService: ProducerUtilService,
        private readonly dataFilter: DataFilter,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly userService: UserService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.pageSizeOptions = [10];
        this.fetchlanguageValues();
        this.setLanguageStrings();
        this.getRoleTypes();
    }
    /**
     * Life cycle hook to initialize the component
     * Get user credentials details and config values
     * Get values from commission store
     * Get benefit offering states
     */
    ngOnInit(): void {
        this.isProspect = this.router.url.indexOf(PROSPECT) !== -1;
        this.subscriber.push(
            this.staticUtilService
                .cacheConfigValue("general.account.enroller.account_producers.read_only.enable")
                .pipe(
                    tap((configValue) => {
                        this.enrollerReadOnlyConfig = configValue && configValue.toLowerCase() === BooleanConst.TRUE;
                    }),
                )
                .subscribe(),
        );
        this.subscriber.push(
            this.store
                .select(CommissionsState.role)
                .pipe(filter((resp) => resp != null))
                .subscribe((roleDetails) => {
                    this.isEnrollerRole = roleDetails.name === ROLE.ENROLLER;
                    this.isReportingManager = roleDetails.isReportingManager;
                    this.isRMOfPrimaryProducer = roleDetails.isRMOfPrimaryProducer;
                    this.loggedInProducerRole = roleDetails.name;
                }),
        );
        this.pageSize = AppSettings.PAGE_SIZE_1000;
        this.isSpinnerLoading = true;
        this.producerHeirarchyFlag = false;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        const loggedInProducerRole$ = this.userService.credential$.pipe(
            filter((credential: ProducerCredential) => "producerId" in credential),
            switchMap((credential) => {
                this.loggedInProducerId = credential.producerId;
                this.checkProducersHeirarchy();
                return this.accountService.getAccountProducer(this.loggedInProducerId.toString());
            }),
            map((accountProducer: AccountProducer) => accountProducer.role),
            catchError((err) => of(EMPTY_SPACE)),
        );
        this.mpGroupId = this.store.selectSnapshot(CommissionsState.groupId);
        this.isDirect = this.store.selectSnapshot(CommissionsState.isDirect);
        this.getBenefitOfferingStates();
        this.subscriber.push(
            combineLatest([
                loggedInProducerRole$,
                this.staticUtilService.hasPermission(Permission.UPDATE_PRIMARY_PRODUCER_ROLE_PERMISSION),
                this.staticUtilService.hasPermission(Permission.AFLAC_E_FINANCE),
                this.staticUtilService.hasPermission(Permission.AFLAC_CLEAR_LINK),
                this.staticUtilService.hasPermission(Permission.AFLAC_STRIDE_LIFE_QUOTE),
                this.staticUtilService.hasPermission(Permission.PRODUCER_INVITE_DELETE_ANY),
                this.staticUtilService.hasPermission(Permission.ACCOUNTLIST_ROLE_20),
            ]).subscribe(
                ([
                    loggedInProducerRole,
                    producerRolePermission,
                    aflacEFinance,
                    aflacClearLink,
                    aflacStrideLifeQuote,
                    producerInviteDelete,
                    HQSupportRolePermission,
                ]: [string, boolean, boolean, boolean, boolean, boolean, boolean]) => {
                    this.HQSupportRolePermission = HQSupportRolePermission;
                    this.loggedInProducerRole = loggedInProducerRole || this.loggedInProducerRole;
                    if (producerRolePermission && producerInviteDelete) {
                        this.isPrimaryProducerRole = true; // Role 20 user
                    }

                    if (this.isDirect && (aflacEFinance || aflacClearLink || aflacStrideLifeQuote)) {
                        this.isEfinancialAgent = true;
                    }
                    if (this.loggedInProducerRole) {
                        this.isEnrollerRole = this.loggedInProducerRole === ROLE.ENROLLER;
                    }
                },
            ),
        );
    }
    /**
     * @description function will load producer list
     * @param isFilter search filter apply or not on producer list
     */
    loadProducerList(isFilter?: boolean): void {
        const params = {
            filter: "accountId:" + this.mpGroupId,
        };
        if (isFilter) {
            params["search"] = this.searchTerm;
        }
        params["size"] = this.pageSize;
        params["page"] = this.pageNumber;
        this.noProducersFlag = false;
        this.subscriber.push(
            this.producerService.producerSearch(params).subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    if (!Response.content.length) {
                        this.noProducersFlag = true;
                        this.isPrimaryProducerAdded = false;
                        this.setDataSource([]);
                    } else if (isFilter) {
                        this.setDataSource(Response.content);
                    } else {
                        this.producerList = Response.content;
                        this.totalElements = Response.totalElements;
                        this.setDataSource(this.producerList);
                    }
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    if (Error) {
                        this.showErrorAlertMessage(Error);
                    }
                },
            ),
        );
    }
    /**
     * @description based on isPrimaryProducerAdded flag value filter primary producer role type option from array
     * @returns array of role types
     */
    getRoleListByConfig(): RoleType[] {
        return !this.isPrimaryProducerAdded &&
            (this.isPrimaryProducerRole || this.isRMOfPrimaryProducer || this.loggedInProducerRole !== ROLE.WRITING_PRODUCER) &&
            !this.isEnrollerRole
            ? this.roleTypes
            : this.roleTypes.filter((role) => role.id !== ROLE.PRIMARY_PRODUCER);
    }
    /**
     *@description will create data object for change role dialog and open modal
     *@param producerId selected producer id
     *@param firstName selected producer's first name
     *@param role selected producer's role
     */
    changeRole(producerId: string, firstName: string, role: ROLE): void {
        if (this.producerList && this.producerList.length > 0) {
            const previousPrimary = this.producerList.find(
                (x) => x.role === ROLE.PRIMARY_PRODUCER && !x.declinedInvite && !x.pendingInvite,
            );
            this.previousPrimaryFirstName = previousPrimary ? previousPrimary.name.firstName : EMPTY_SPACE;
        }
        if (!this.loggedInProducerRole) {
            this.loggedInProducerRole = this.store.selectSnapshot(CommissionsState.role).name;
        }
        const dialogRef = this.dialog.open(ChangeProducerRoleComponent, {
            data: {
                producerId: producerId,
                name: firstName,
                roleList:
                    this.isPrimaryProducerRole || this.loggedInProducerRole === ROLE.PRIMARY_PRODUCER || this.isRMOfPrimaryProducer
                        ? this.roleTypes
                        : this.getRoleListByConfig(),
                role: role,
                primaryButton: {
                    buttonTitle: this.languageString["primary.portal.dashboard.policyChangeRequestView.change"],
                },
                previousPrimaryFirstName: this.previousPrimaryFirstName,
                secondaryButton: {
                    buttonTitle: this.languageString["primary.portal.common.cancel"],
                },
            },
            width: "600px",
        });
        this.subscriber.push(
            dialogRef.afterClosed().subscribe((data) => {
                if (data && data.selectedRole) {
                    this.onChangeConfirm(producerId, data.selectedRole);
                }
            }),
        );
    }

    /**
     * Generates HTML content for the tooltip with info about the producer's applicable state licenses
     * @param licenses list of applicable licenses
     * @param title heading on the tooltip
     *
     * @returns content to be shown inside the tooltip
     */
    getLicensedStateTooltip(licenses: License[], title: string): SafeHtml {
        return this.utilService.refactorTooltip(
            licenses.map((license) => `${license.state.abbreviation}: ${license.number}`),
            title,
        );
    }
    getCarrierTooltip(data: any[]): any {
        if (data && data.length > 0) {
            const carrierArr = [];
            this.uniqueCarrierArr = [];
            const title = this.languageString["primary.portal.commission.producer.table.carriers"];
            for (const carrierData of data) {
                carrierArr.push(carrierData.carrier.name);
            }
            // filtering out the repeating carrier names of carrierArr array
            // and storing all unique carrier names in uniqueCarrierArr array
            this.uniqueCarrierArr = Array.from(new Set(carrierArr));
            return this.utilService.refactorTooltip(this.uniqueCarrierArr, title);
        }
    }
    removeProducer(producerId: string, firstName: string, declinedInvite: boolean): void {
        if (declinedInvite) {
            this.onRemoveConfirm(producerId);
        } else {
            const title = this.isDirect
                ? this.languageString["primary.portal.direct.commission.producer.removeTitle"]
                : this.languageString["primary.portal.commission.producer.removeInfo"];
            const content = this.isDirect
                ? this.languageString["primary.portal.direct.commission.producer.removeExtraInfo"].replace(
                    /##PRODUCERFIRSTNAME##/g,
                    firstName,
                )
                : this.languageString["primary.portal.commission.producer.removeExtraInfo"].replace("##PRODUCERFIRSTNAME##", firstName);
            const dialogData: MonDialogData = {
                title: title,
                content: content,
                primaryButton: {
                    buttonTitle: this.languageString["primary.portal.commission.producer.table.remove"],
                    buttonAction: this.onRemoveConfirm.bind(this, producerId),
                },
                secondaryButton: {
                    buttonTitle: this.languageString["primary.portal.common.cancel"],
                },
            };
            this.dialog.open(MonDialogComponent, {
                data: dialogData,
                width: "600px",
            });
        }
    }
    /**
     *@description Upon confirming on the remove producer dialog, this function will remove account producer and,
     * based on the role of the currently logged in producer, navigate to account list page or load producer list.
     *@param producerId selected producer id
     */
    onRemoveConfirm(producerId: string): void {
        this.isSpinnerLoading = true;
        this.subscriber.push(
            this.accountService.removeAccountProducer(producerId, this.mpGroupId).subscribe(
                () => {
                    this.isSpinnerLoading = false;
                    if (
                        !this.HQSupportRolePermission &&
                        this.loggedInProducerId.toString() === producerId.toString() &&
                        !this.producerList.some((producer) =>
                            this.producersHierarchy.some((producersHierarchy) => producersHierarchy.id === producer.id),
                        )
                    ) {
                        this.router.navigate(["../../../../payroll"], { relativeTo: this.route });
                    } else {
                        this.loadProducerList();
                    }
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    }
                },
            ),
        );
    }
    cancelInvite(producerId: string): void {
        this.onRemoveConfirm(producerId);
    }
    hideErrorAlertMessage(): void {
        this.showErrorMessage = true;
        this.errorMessage = null;
    }
    /**
     * Function is to show error alert massage based on API error status, code and detail field.
     * @param err error response from api
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err[this.ERROR];
        if (
            (error.status === ClientErrorResponseCode.RESP_400 || error.status === ClientErrorResponseCode.RESP_403) &&
            error[this.DETAILS].length
        ) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Function is to update new role after confirmation.
     * @param producerId producerId for which role has been changed
     * @param role new selected role
     */
    onChangeConfirm(producerId: string, role: ROLE): void {
        this.subscriber.push(
            this.accountService.changeAccountProducerRole(producerId, this.mpGroupId, `"${role}"`).subscribe(
                () => {
                    if (role === ROLE.PRIMARY_PRODUCER || this.isRMOfPrimaryProducer) {
                        this.producerUtilService.updateRMDetails(true);
                    }
                    if (ROLE.HQ_EXCHANGE_TEAM_SUPPORT !== role && this.loggedInProducerId.toString() === producerId) {
                        this.store.dispatch(
                            new SetRole({
                                id: this.loggedInProducerId,
                                name: role,
                                isReportingManager: this.isReportingManager,
                            }),
                        );
                    }
                    this.ngOnInit();
                },
                (error) => {
                    if (error) {
                        this.showErrorAlertMessage(error);
                    }
                },
            ),
        );
    }
    openMultiplePopup(): void {
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            width: "800px",
            height: "auto",
            panelClass: "add-multiple-producer",
            data: {
                loggedInProducerId: this.loggedInProducerId,
                isDirect: this.isDirect,
                showHeirarchyTab: this.producerHeirarchyFlag,
            },
        };
        const dialogRef = this.dialog.open(AddMultipleProducersComponent, dialogConfig);
        this.subscriber.push(
            dialogRef.afterClosed().subscribe((flag) => {
                if (flag) {
                    this.loadProducerList();
                }
            }),
        );
    }
    selectedOption(selectedOption: any): void {
        switch (selectedOption.value) {
            case "ADD_SINGLE":
                this.openSinglePopup();
                break;
            case "ADD_MULTIPLE":
                this.openMultiplePopup();
                break;
            default:
                return;
        }
    }
    openSinglePopup(): void {
        const dialogRef = this.dialog.open(AddSingleProducerComponent, {
            disableClose: false,
            autoFocus: true,
            panelClass: "add-single-peoducer",
            data: {
                roleList: this.getRoleListByConfig(),
                loggedInProducerId: this.loggedInProducerId,
                isDirect: this.isDirect,
                mpGroupId: this.mpGroupId,
                situs: this.store.selectSnapshot(CommissionsState.situs),
            },
            width: "700px",
            height: "auto",
        });
        this.subscriber.push(
            dialogRef.afterClosed().subscribe(() => {
                this.loadProducerList();
            }),
        );
    }
    /**
     * fetch BO offered states
     */
    getBenefitOfferingStates(): void {
        const statesSubscription = iif(
            () => this.isProspect,
            this.producerService.getAllProducersLicensedStates(this.mpGroupId).pipe(
                tap((producerLicensedStateDetails) => {
                    this.benefitOfferingStatesData = producerLicensedStateDetails;
                }),
            ),
            this.benefitOfferingService.getBenefitOfferingSettings(this.mpGroupId).pipe(
                tap((Response) => {
                    this.benefitOfferingStatesData = Response.states;
                }),
            ),
        )
            .pipe(
                catchError(() => {
                    this.benefitOfferingStatesData = [];
                    return of(null);
                }),
                finalize(() => {
                    this.loadProducerList();
                }),
            )
            .subscribe();
        this.subscriber.push(statesSubscription);
    }
    /**
     * Gets the role name of the agent
     * @param role of type string
     * @returns role name of type string
     */
    getRoleDisplayText(role: string): string | undefined {
        if (role !== ROLE.PRIMARY_PRODUCER && this.isDirect) {
            return this.languageString["primary.portal.direct.commission.producer.nonAuthRole"];
        }
        if (role === ROLE.NONAUTHORIZED_PRODUCER) {
            return this.languageString["primary.portal.direct.commission.producer.nonAuthorizedProducer"];
        }
        const roleObj = this.roleTypes.find((x) => x.id === role);
        if (roleObj) {
            return roleObj.name;
        }
        return undefined;
    }
    /**
     * @description set data source for producer list table, sort producer list and set page number
     * @param data list of producer(s)
     */
    setDataSource(data: any): void {
        this.dataSource = new MatTableDataSource(
            data.map((row) => {
                const licenses = this.isDirect
                    ? row.licenses
                    : (row.licenses &&
                          row.licenses.filter((license) =>
                              this.benefitOfferingStatesData.some((state) => state.abbreviation === license.state.abbreviation),
                          )) ||
                      [];
                return {
                    id: row.id,
                    name: `${row.name.lastName}, ${row.name.firstName}`,
                    firstName: row.name.firstName,
                    role: row.role,
                    roleText: this.getRoleDisplayText(row.role),
                    states: licenses.length,
                    npn: row.npn,
                    pendingInvite: row.pendingInvite,
                    showPendingInvite: this.checkSelfAndSubordinatesInvite(row.invitingProducerId),
                    declinedInvite: row.declinedInvite,
                    matCarrierTooltipContent: this.getCarrierTooltip(row.carrierAppointments),
                    licenseTooltipContent: this.getLicensedStateTooltip(
                        licenses.sort((a, b) => (a.state.abbreviation < b.state.abbreviation ? -1 : 1)),
                        this.languageString["primary.portal.commission.producer.table.license"],
                    ),
                    writingNumbers: row.writingNumbers.map((writingNumber) => writingNumber.number).join(),
                    isUnauthorized: row.role === ROLE.NONAUTHORIZED_PRODUCER,
                    enrollerInvitesOnly: row?.enrollerInvitesOnly,
                };
            }),
        );
        this.data = this.dataSource.data;
        this.dataSource.sort = this.sort;

        this.displayedColumns = [
            this.displayColumns.NAME,
            this.displayColumns.ROLE,
            this.displayColumns.STATES,
            this.displayColumns.NPN,
            this.displayColumns.MANAGE,
        ];
        this.dataSource.sortingDataAccessor = (dataObject, sortHeaderId) => {
            if (typeof dataObject[sortHeaderId] === "string") {
                return SortOrder.TWO + dataObject[sortHeaderId].toLocaleLowerCase();
            }
            return dataObject[sortHeaderId];
        };
        this.dataSource.paginator = this.paginator;
        this.subscriber.push(
            this.paginator.page.subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            }),
        );
        this.dataSource.data = this.dataFilter.transform(this.data, this.filter);
        this.pageInputChanged(this.defaultPageNumber);
        this.isPrimaryProducerAdded = this.dataSource.data.some((producer) => {
            if (producer.role === ROLE.PRIMARY_PRODUCER) {
                this.primaryProducerId = producer.id;
                return true;
            }
            return undefined;
        });
        this.isManagingProducer();
    }
    /**
     * @description function to check if logged in producer is managing producer of enroller in Prospect
     */
    isManagingProducer(): void {
        if (this.producerHeirarchyFlag && this.isProspect) {
            this.isManagingProducerForEnroller = this.producersHierarchy.every((producer) => producer.id !== this.primaryProducerId);
        }
    }
    /**
     * @description function will check if logged in producer/subordinates id matches inviting producer ids
     * @param invitingProducerId invited producer id
     * @returns whether the logged in producer id or any of their subordinate ids matches with the inviting producer id
     */
    checkSelfAndSubordinatesInvite(invitingProducerId: number): boolean {
        if (
            this.producersHierarchy &&
            invitingProducerId &&
            this.producersHierarchy.length &&
            this.loggedInProducerId !== invitingProducerId
        ) {
            return this.producersHierarchy.some((item) => item.id === invitingProducerId);
        }
        return this.loggedInProducerId === invitingProducerId;
    }
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }
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

    /**
     * @description function gets the values of search box and filters the results based on searches.
     * @param searchValue the value entered in the search box.
     */
    applySearchFilter(searchValue: string): void {
        const searchValueTrimmed = searchValue.trim();
        this.searchTerm = searchValueTrimmed;
        this.searchTermOnEnter = searchValueTrimmed;
        this.filter.freeText = {
            name: "",
            writingNumbers: "",
        };
        if (searchValue.length >= this.minimumSearchLength) {
            this.filter.freeText = {
                name: searchValueTrimmed,
                writingNumbers: searchValueTrimmed,
            };
            this.filterDataObject(true);
        } else {
            this.filterDataObject(false);
        }
    }
    filterDataObject(isFilter: boolean): any {
        if (this.totalElements > this.producerList.length) {
            this.loadProducerList(isFilter);
        } else {
            this.filter = this.utilService.copy(this.filter);
            this.dataSource.data = this.dataFilter.transform(this.data, this.filter);
            this.pageInputChanged(this.defaultPageNumber);
        }
    }
    ngAfterContentInit(): void {
        if (this.sort && this.paginator && this.dataSource) {
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
                if (typeof data[sortHeaderId] === "string") {
                    return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
                }
                return data[sortHeaderId];
            };
            this.dataSource.paginator = this.paginator;
            this.subscriber.push(
                this.paginator.page.subscribe((page: PageEvent) => {
                    this.pageNumberControl.setValue(page.pageIndex + 1);
                }),
            );
        }
    }

    fetchlanguageValues(): void {
        this.languageString = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.commission.producer.table.license",
            "primary.portal.commission.producer.table.carriers",
            "primary.portal.commission.producer.multiple.addProducer",
            "primary.portal.commission.producer.removeInfo",
            "primary.portal.commission.producer.removeExtraInfo",
            "primary.portal.commission.producer.states",
            "primary.portal.commission.producer.changeRole",
            "primary.portal.commission.producer.table.remove",
            "primary.portal.common.cancel",
            "primary.portal.dashboard.policyChangeRequestView.change",
            "primary.portal.commission.producer.single.addSingleProducer",
            "primary.portal.commission.producer.role.primaryProducer",
            "primary.portal.commission.producer.role.writingProducer",
            "primary.portal.commission.producer.role.enroller",
            "primary.portal.direct.commission.producer.removeTitle",
            "primary.portal.direct.commission.producer.nonAuthRole",
            "primary.portal.direct.commission.producer.nonAuthorizedProducer",
            "primary.portal.direct.commission.producer.removeExtraInfo",
            "primary.portal.commission.producer.header",
            "primary.portal.commission.producer.noProducers",
            "primary.portal.commission.producer.addProducer",
            "primary.portal.common.producerInfo",
            "primary.portal.commission.producer.noApplicableStates",
            "primary.portal.commission.producer.assignProducer",
            "primary.portal.commission.producer.search",
            "primary.portal.commission.producer.changeRole",
            "primary.portal.commission.producer.table.remove",
            "primary.portal.commission.producer.table.cancel",
            "primary.portal.dashboard.policyChangeRequestList.page",
        ]);
    }
    setLanguageStrings(): void {
        this.options = [
            {
                name: this.languageString["primary.portal.commission.producer.single.addSingleProducer"],
                value: "ADD_SINGLE",
            },
            {
                name: this.languageString["primary.portal.commission.producer.multiple.addProducer"],
                value: "ADD_MULTIPLE",
            },
        ];
    }

    getRoleTypes(): void {
        this.roleTypes = [
            {
                name: this.languageString["primary.portal.commission.producer.role.primaryProducer"],
                id: ROLE.PRIMARY_PRODUCER,
            },
            {
                name: this.languageString["primary.portal.commission.producer.role.writingProducer"],
                id: ROLE.WRITING_PRODUCER,
            },
            {
                name: this.languageString["primary.portal.commission.producer.role.enroller"],
                id: ROLE.ENROLLER,
            },
        ];
    }

    sortData(event: any): void {
        this.activeCol = event.active;
    }
    /**
     * @description function will load producer hierarchy list
     */
    checkProducersHeirarchy(): void {
        const params = {
            supervisorProducerId: this.loggedInProducerId,
            includeInactiveProducers: true,
        };
        this.subscriber.push(
            this.producerService.producerSearch(params).subscribe((response) => {
                this.producersHierarchy = response.content;
                this.producerHeirarchyFlag = response.content.length > 0;
                this.isManagingProducer();
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
