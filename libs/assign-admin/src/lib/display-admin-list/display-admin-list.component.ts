import { Component, OnInit, ViewChild, OnDestroy, ElementRef, Input, ChangeDetectorRef } from "@angular/core";
import { AdminService, MemberService, AccountService, SearchMembers } from "@empowered/api";
import { Subscription, Observable, Subject } from "rxjs";
import { Store } from "@ngxs/store";
import {
    AsyncMenuItem,
    DataFilter,
    AddAdminManuallyComponent,
    FilterOption,
    FilterModel,
    ActiveFilter,
    AddAdminByImportingComponent,
    AddAdminViaCensusComponent,
} from "@empowered/ui";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { RemoveAdminComponent } from "../remove-admin/remove-admin.component";
import { FormControl } from "@angular/forms";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatSelect } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { switchMap, map, tap, shareReplay, filter, takeUntil } from "rxjs/operators";
import { OverlayRef } from "@angular/cdk/overlay";
import { UserService } from "@empowered/user";
import { CannotRemoveModalComponent } from "../cannot-remove-modal/cannot-remove-modal.component";
import { TitleCasePipe } from "@angular/common";
import { DeactivateReactivatePopupComponent } from "../deactivate-reactivate-popup/deactivate-reactivate-popup.component";
import { PagePrivacy, Permission, SortActiveDirectionModel, MemberListItem, Admin } from "@empowered/constants";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import {
    AccountListState,
    BreakpointData,
    BreakPointUtilService,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
enum AdminTableColumns {
    "NAME" = "name",
    "ROLE" = "role",
    "EMAIL" = "emailAddress",
    "PHONE" = "phoneNumber",
    "REPORTS_TO" = "reportsTo",
    "MANAGE" = "manage",
}
const ADMIN_ROLES_COUNT = 10;
const ADMIN_STATUS_COUNT = 10;
@Component({
    selector: "empowered-display-admin-list",
    templateUrl: "./display-admin-list.component.html",
    styleUrls: ["./display-admin-list.component.scss"],
    providers: [DataFilter],
})
export class DisplayAdminListComponent implements OnInit, OnDestroy {
    forMobileDevices = false;
    forMediumDevices = false;
    adminSubscription: Subscription;
    roleSubscription: Subscription;
    mpGroup: number;
    adminList: Admin[];
    dataSource = new MatTableDataSource<Admin>();
    adminRoles: any = [];
    allAdmins: Admin[] = [];
    searchFlag = false;
    adminData: Admin[];
    AddAdminCensusDialogRef: MatDialogRef<AddAdminViaCensusComponent>;
    AddAdminManualDialogRef: MatDialogRef<AddAdminManuallyComponent>;
    AddAdminImportDialogRef: MatDialogRef<AddAdminByImportingComponent>;
    RemoveAdminDialogRef: MatDialogRef<RemoveAdminComponent>;
    deactivateReactivatePopupDialogRef: MatDialogRef<DeactivateReactivatePopupComponent>;
    displayedColumns: string[];
    roleFilter = new FormControl([]);
    statusFilter = new FormControl([]);
    roleOnClick: any;
    statusOnClick: any;
    noResultFoundFlag = false;
    overlayRef: OverlayRef;
    dispError: string;
    compareZero = 0;
    errorCheckLength = 2;
    moreFilterResponse;
    moreFormControls;
    showAddFromEmployee: boolean;
    STATUS_INACTIVE = "Inactive";
    AdminTableColumns = AdminTableColumns;
    readonly userPermissions = Permission;
    @ViewChild("moreFilterOrigin") moreFilterOrigin: ElementRef;
    @ViewChild(MatSort) sort: MatSort;

    @Input() errorFlag: boolean;
    @Input() errorMessage: string;
    @Input() tabView: boolean;
    private allAdminSubject$: Subject<Admin[]> = new Subject();
    allAdmins$: Observable<FilterModel[]> = this.allAdminSubject$.asObservable().pipe(
        map((admins) => [
            {
                id: "adminFilter",
                title: this.language.fetchPrimaryLanguageValue("primary.portal.administrators.filterLabel.reportsTo"),
                multi: {
                    isChip: false,
                    options: admins.map(
                        (admin) =>
                            ({
                                label: this.titleCasePipe.transform(admin.name.firstName + " " + admin.name.lastName),
                                value: admin.id.toString(),
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );
    private reportsToFilterSubject$: Subject<ActiveFilter[]> = new Subject();
    reportsToFilter$: Observable<ActiveFilter> = this.reportsToFilterSubject$.asObservable().pipe(
        map((activeFilters) => activeFilters.find((activeFilter) => activeFilter.filterId === "adminFilter")),
        tap((activeFilter) => {
            this.reportsToFilter = activeFilter;
            this.filterDataObject();
        }),
    );
    reportsToFilter: ActiveFilter;

    @ViewChild("roleFilterDropdown") roleFilterDropdown: MatSelect;
    @ViewChild("statusFilterDropdown") statusFilterDropdown: MatSelect;
    filter = {
        query: {
            roleName: [],
            active: [],
        },
    };
    adminRolesMoreThanTenFlag = false;
    isSpinnerLoading = false;
    adminStatusMoreThanTenFlag = false;
    roleListLength: number;
    dataToFilter: any;
    dataSourceLength: number;
    zeroConstant = 0;
    memberSearchData: any[] = [];
    statusData = [];
    roleData = [];
    roleFilterVal: any[];
    statusFilterVal: any[];
    filterOpen = false;
    isDisplayRole: string;
    isDisplayStatus: string;
    filterChoiceRole: any;
    filterChoiceStatus: any;
    selectedStatusCount: number;
    selectedRoleCount: number;
    searchState = true;
    @ViewChild(RemoveAdminComponent) removeComponent;
    private readonly unsubscribe$: Subject<void> = new Subject();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.administrators.search",
        "primary.portal.administrators.searchAdmin",
        "primary.portal.administrators.adminName",
        "primary.portal.administrators.filterName",
        "primary.portal.administrators.filterRole",
        "primary.portal.administrators.filterStatus",
        "primary.portal.administrators.addAdmin",
        "primary.portal.administrators.addManually",
        "primary.portal.administrators.addFromEmployeeList",
        "primary.portal.administrators.importAdmin",
        "primary.portal.administrators.name",
        "primary.portal.administrators.email",
        "primary.portal.subproducerList.noResultFound",
        "primary.portal.administrators.phoneNumber",
        "primary.portal.administrators.manage",
        "primary.portal.administrators.header",
        "primary.portal.administrators.all",
        "primary.portal.administrators.status.active",
        "primary.portal.administrators.status.inactive",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.common.edit",
        "primary.portal.common.remove",
        "primary.portal.subproducerList.showing",
        "primary.portal.subproducerList.results",
        "primary.portal.administrators.remove.lastAdmin",
        "primary.portal.administrators.remove.self",
        "primary.portal.administrators.remove.subordinatesPresent",
        "primary.portal.common.moreFilter",
        "primary.portal.administrators.tableHeader.reportsTo",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.admin.noadminsAdded",
        "primary.portal.common.deactivate",
        "primary.portal.common.reactivate",
        "primary.portal.accounts.accountList.inactiveAlongWithAccountName",
    ]);
    statusList = [
        { value: "true", status: this.languageStrings["primary.portal.administrators.status.active"] },
        { value: "false", status: this.languageStrings["primary.portal.administrators.status.inactive"] },
    ];

    loggedInId: number;
    zerostate = true;

    private subscriptions: Subscription[] = [];
    roleSelectedData: any[] = [];
    statusSelectedData: any[] = [];
    appliedFilter: any[] = [];
    showComponent: boolean;
    activeCol: string;
    isAdmin: boolean;
    showReportsTo: boolean;
    employeeList: MemberListItem[];
    isPrivacyOnForEnroller: boolean;
    isEnroller: boolean;

    private readonly addAdminOptionsSubject$: Subject<AsyncMenuItem[]> = new Subject<AsyncMenuItem[]>();
    readonly addAdminOptions$: Observable<AsyncMenuItem[]> = this.addAdminOptionsSubject$.asObservable();

    /**
     * Inject dependencies and set up breakpoint utilities.
     *
     * @param adminService
     * @param dataFilter
     * @param store
     * @param dialog
     * @param language
     * @param userService
     * @param empoweredModal
     * @param titleCasePipe
     * @param breakPointUtilService
     * @param utilService
     * @param memberService
     * @param accountService
     * @param staticUtilService
     * @param changeDetectorRef
     */
    constructor(
        private readonly adminService: AdminService,
        private readonly dataFilter: DataFilter,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly sharedService: SharedService,
    ) {
        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === "MD" || resp.size === "SM") {
                this.forMediumDevices = true;
                this.forMobileDevices = true;
            } else {
                this.forMediumDevices = false;
                this.forMobileDevices = false;
            }
        });

        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === "SM") {
                this.forMobileDevices = true;
            } else {
                this.forMobileDevices = false;
            }
        });
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_ADMINISTRATOR);
        }
    }

    /**
     * Set up permissions, configuration, and admin services. Get MP group, admin list,
     * customers, and addAdmin menu options.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential) => {
                this.isSpinnerLoading = true;
                if ("producerId" in credential) {
                    this.loggedInId = credential.producerId;
                }
                if ("adminId" in credential) {
                    this.loggedInId = credential.adminId;
                }
            }),
        );
        this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.subscriptions.push(
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.admin.reportsTo").subscribe(
                (resp) => {
                    this.isSpinnerLoading = true;
                    this.displayedColumns = [
                        AdminTableColumns.NAME,
                        AdminTableColumns.ROLE,
                        AdminTableColumns.EMAIL,
                        AdminTableColumns.PHONE,
                    ];
                    if (resp) {
                        this.showReportsTo = resp;
                        this.displayedColumns.push(AdminTableColumns.REPORTS_TO);
                    } else {
                        this.showReportsTo = false;
                    }
                    this.displayedColumns.push("manage");
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
        this.adminService.updateAdminList(true);
        this.subscriptions.push(
            this.adminService.isUpdated.subscribe((data) => {
                this.isSpinnerLoading = true;
                if (data) {
                    this.subscriptions.push(this.reportsToFilter$.subscribe());
                    this.getAdminList();
                }
            }),
        );
        this.subscriptions.push(this.getCustomers().subscribe());
        this.getAddAdminOptions(this.showAddFromEmployee);
    }

    /**
     * This function is used to get the admin list.
     * After adding admin manually, it also checks to see if there are any employees added.
     */
    getAdminList(): void {
        this.subscriptions.push(
            (this.adminSubscription = this.adminService
                .getAccountAdmins(this.mpGroup, "roleId,reportsToId")
                .pipe(
                    // Save out all admins
                    tap((admins) => (this.allAdmins = admins)),
                    // Get the unique admins to list in the filter
                    tap((admins) =>
                        this.allAdminSubject$.next(
                            admins
                                .filter((admin) => admin.reportsTo)
                                .map((admin) => admin.reportsTo)
                                .reduce(
                                    (uniqueAdmins, admin) =>
                                        uniqueAdmins.find((a) => a.id === admin.id) ? uniqueAdmins : [...uniqueAdmins, admin],
                                    [],
                                ),
                        ),
                    ),
                    tap(
                        (response: Admin[]) => {
                            this.showComponent = true;
                            this.reportsToFilter$.subscribe();
                            this.dataSource.data = response;
                            this.dataSourceLength = this.zeroConstant;
                            this.adminRoles = [];
                            this.dataSource.data.forEach((data) => {
                                if (!this.adminRoles.includes(data.role)) {
                                    this.adminRoles[this.dataSourceLength] = data.role;
                                }
                                this.dataSourceLength++;
                            });
                            this.adminRoles = [...new Set(this.adminRoles.map((s) => JSON.stringify(s)))].map((s) =>
                                JSON.parse(s.toString()),
                            );
                            this.roleData = this.adminRoles;
                            if (Object.keys(this.adminRoles).length > ADMIN_ROLES_COUNT) {
                                this.adminRolesMoreThanTenFlag = true;
                            }
                            this.statusData = this.statusList;
                            if (Object.keys(this.statusList).length > ADMIN_STATUS_COUNT) {
                                this.adminStatusMoreThanTenFlag = true;
                            }
                            this.dataSource.data.forEach((data: Admin & { roleName: string }) => {
                                data["roleName"] = data.role.name;
                                // TODO: Admin.active is a boolean, we shouldn't override it with a string
                                // Instead, use a pipe in the template to show the translated string
                                if (data.active) {
                                    data.active = this.languageStrings["primary.portal.administrators.status.active"] as any;
                                } else if (!data.active) {
                                    data.active = this.languageStrings["primary.portal.administrators.status.inactive"] as any;
                                }
                            });
                            this.adminList = this.dataSource.data;
                            this.adminList.forEach((admin) => {
                                const adminName = admin.name;
                                admin.name.firstName = adminName.firstName.toLowerCase();
                                admin.name.lastName = adminName.lastName.toLowerCase();
                            });

                            this.adminList.sort((a, b) => (a.name.firstName > b.name.firstName ? 1 : -1));
                            this.dataSource.data = this.adminList;
                            this.adminData = this.utilService.copy(this.dataSource.data);
                            this.dataToFilter = this.utilService.copy(this.dataSource.data);
                            if (this.dataSource && this.dataSource.data.length > 0) {
                                this.zerostate = false;
                                this.noResultFoundFlag = false;
                            } else if (!this.dataSourceLength) {
                                this.zerostate = true;
                            }
                            this.isSpinnerLoading = false;
                            this.changeDetectorRef.detectChanges();
                            this.initializeSorting();
                        },
                        (error) => {
                            this.isSpinnerLoading = false;
                        },
                    ),
                    switchMap(() => this.getCustomers()),
                )
                .subscribe()),
        );
    }
    removeAdmin(element: any): void {
        if (this.hasRemoveErrors(element)) {
            return;
        }

        this.RemoveAdminDialogRef = this.dialog.open(RemoveAdminComponent, {
            backdropClass: "backdrop-blur",
            minWidth: "600px",
            panelClass: "manual-list",
            data: {
                dataSourceLength: this.dataSource.data.length,
                selectedAdmin: element,
                mpgroup: this.mpGroup,
            },
        });

        this.subscriptions.push(
            this.RemoveAdminDialogRef.afterClosed()
                .pipe(
                    filter((removeResponse: Observable<Admin> | undefined) => removeResponse !== undefined),
                    switchMap((removeResponse) => removeResponse),
                    tap(
                        (next) => {},
                        (error) => {
                            this.hasRemoveErrors(element);
                        },
                        () => {
                            this.adminService.updateAdminList(true);
                        },
                    ),
                )
                .subscribe(),
        );
    }

    /**
     * Function to check if the admin can be removed based on last admin or self admin removal or subordinate
     * @param element The admin being removed
     * @returns true if the admin cannot be removed else set error
     */
    hasRemoveErrors(element: Admin): boolean {
        if (this.dataSource.data.length === 1) {
            this.empoweredModal.openDialog(CannotRemoveModalComponent, {
                data: { admin: element, errorLanguage: "primary.portal.administrators.remove.lastAdmin" },
            });
            return true;
        }
        if (element.id === this.loggedInId) {
            this.empoweredModal.openDialog(CannotRemoveModalComponent, {
                data: { admin: element, errorLanguage: "primary.portal.administrators.remove.self" },
            });
            return true;
        }
        if (
            this.dataSource.data.reduce(
                (accumulator, admin) => accumulator || (admin.reportsTo && admin.reportsTo.id === element.id),
                false,
            ) ||
            element.subordinates
        ) {
            this.empoweredModal.openDialog(CannotRemoveModalComponent, {
                data: {
                    admin: element,
                    errorLanguage: "primary.portal.administrators.remove.subordinatesPresent",
                },
            });
            return true;
        }

        return false;
    }

    addManually(): void {
        this.AddAdminManualDialogRef = this.dialog.open(AddAdminManuallyComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "manual-list",
            data: {
                editAdministrator: false,
                allAdmins: this.allAdmins,
                employeeList: this.employeeList,
            },
        });
    }
    /**
     * open edit admin dialog on click of edit
     * @param element selected admin details
     */
    editAdministrator(element: Admin): void {
        this.AddAdminManualDialogRef = this.dialog.open(AddAdminManuallyComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "manual-list",
            data: {
                editAdministrator: true,
                selectedAdmin: element,
                allAdmins: this.allAdmins,
                employeeList: this.employeeList,
            },
        });
    }
    /**
     * This function deactivates an admin for a particular account
     * @param element of type Admin
     * @returns nothing>
     */
    deactivate(element: Admin): void {
        this.accountService.deactivateAdmin(element.id).pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.deactivateReactivatePopup(element, true);
    }
    /**
     * This function reactivates an admin for a particular account
     * @param element of type Admin
     * @returns nothing>
     */
    reactivate(element: Admin): void {
        this.accountService.reactivateAdmin(element.id).pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.deactivateReactivatePopup(element, false);
    }
    /**
     * This function shows a popup on deactivate/reactivate status
     * @param element of type Admin
     * @param value of type boolean
     * @returns nothing>
     */
    deactivateReactivatePopup(element: Admin, value: boolean): void {
        this.deactivateReactivatePopupDialogRef = this.empoweredModal.openDialog(DeactivateReactivatePopupComponent, {
            data: {
                dataSourceLength: this.dataSource.data.length,
                selectedAdmin: element,
                value: value,
            },
        });

        this.subscriptions.push(
            this.deactivateReactivatePopupDialogRef
                .afterClosed()
                .pipe(
                    tap(() => {
                        this.adminService.updateAdminList(true);
                    }),
                )
                .subscribe(),
        );
    }
    addEmployeeList(): void {
        this.AddAdminCensusDialogRef = this.dialog.open(AddAdminViaCensusComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "employee-list",
            data: {
                allAdmins: this.allAdmins,
            },
        });
    }
    addImportAdmin(): void {
        this.AddAdminImportDialogRef = this.dialog.open(AddAdminByImportingComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "import-admin",
            data: {
                allAdmins: this.allAdmins,
            },
        });
    }
    searchAdmin(name: string): void {
        if (name.length > 2) {
            this.searchOnEnter(name);
        } else {
            this.searchFlag = false;
            this.searchState = true;
            this.filterDataObject();
        }
    }
    searchDropdownClose(): void {
        this.searchState = true;
    }
    searchOnEnter(name: string): void {
        this.searchFlag = true;
        this.searchState = true;
        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        const allSpaces: RegExp = /\s/g;
        this.memberSearchData = this.adminData.filter((admin) =>
            `${admin.name.firstName}${admin.name.lastName}`
                .toLowerCase()
                .replace(allSpaces, "") // remove all spaces
                .includes(name.toLowerCase().replace(allSpaces, "")),
        );
        this.filterDataObject();
    }
    clickOutside(filterName: string): void {
        switch (filterName) {
            case "roleFilter":
                this.roleFilter.setValue(this.roleOnClick);
                this.roleFilterDropdown.close();
                break;
            case "statusFilter":
                this.statusFilter.setValue(this.statusOnClick);
                this.statusFilterDropdown.close();
                break;
        }
        this.filterApply(filterName);
    }
    filterApply(filterName: string): void {
        switch (filterName) {
            case "roleFilter":
                if (this.roleFilter.value) {
                    this.roleOnClick = this.roleFilter.value;
                    this.filter.query.roleName = this.roleFilter.value;
                    this.roleFilterDropdown.close();
                    this.filterChoiceRole = this.roleFilter.value;
                    this.isDisplayRole = ": " + this.filterDisplayContent(this.roleData, this.roleFilter.value, "roleFilter");
                } else {
                    this.roleFilter.setValue([]);
                }
                break;
            case "statusFilter":
                if (this.statusFilter.value) {
                    this.statusOnClick = this.statusFilter.value;
                    this.filter.query.active = this.statusFilter.value;
                    this.statusFilterDropdown.close();
                    this.filterChoiceStatus = this.statusFilter.value;
                    this.isDisplayStatus = ": " + this.filterDisplayContent(this.statusData, this.statusFilter.value, "statusFilter");
                } else {
                    this.statusFilter.setValue([]);
                }
                break;
        }

        this.filterDataObject();
    }
    filterDataObject(): void {
        let memberInfo = [];
        if (this.searchFlag) {
            memberInfo = this.utilService.copy(this.memberSearchData);
        } else {
            memberInfo = this.dataToFilter;
        }
        this.dataSource.data = [];
        this.filter = this.utilService.copy(this.filter);
        this.dataSource.data = this.dataFilter.transform(memberInfo, this.filter);

        if (this.dataSource.data.length === 0) {
            this.checkForError();
        }
        if (this.reportsToFilter && this.reportsToFilter.values.length > 0) {
            this.dataSource.data = this.dataSource.data.filter(
                (admin) => admin.reportsTo && this.reportsToFilter.values.indexOf(admin.reportsTo.id.toString()) !== -1,
            );
        }

        this.noResultFoundFlag = this.dataSource.data.length < 1 ? true : false;
    }
    resetVal(filterName: string): void {
        switch (filterName) {
            case "roleFilter":
                this.roleOnClick = "";
                this.roleFilter.setValue([]);
                this.roleSelectedData = [];
                // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
                this.roleFilterDropdown && this.roleFilterDropdown.close();
                this.isDisplayRole = "";
                break;
            case "statusFilter":
                this.statusOnClick = "";
                this.statusFilter.setValue([]);
                this.statusSelectedData = [];
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                this.statusFilterDropdown && this.statusFilterDropdown.close();
                this.isDisplayStatus = "";
                break;
        }
        this.filterApply(filterName);
    }
    isIndeterminate(val: string): boolean | undefined {
        switch (val) {
            case "roleFilter":
                return (
                    this.roleFilter.value &&
                    this.roleData.length &&
                    this.roleFilter.value.length &&
                    this.roleFilter.value.length < this.roleData.length
                );
            case "statusFilter":
                return (
                    this.statusFilter.value &&
                    this.statusData.length &&
                    this.statusFilter.value.length &&
                    this.statusFilter.value.length < this.statusData.length
                );
        }
        return undefined;
    }
    isChecked(val: string): boolean | undefined {
        switch (val) {
            case "roleFilter":
                return this.roleFilter.value && this.roleData.length && this.roleFilter.value.length === this.roleData.length;
            case "statusFilter":
                return this.statusFilter.value && this.statusData.length && this.statusFilter.value.length === this.statusData.length;
        }
        return undefined;
    }
    toggleSelection(change: MatCheckboxChange): any {
        if (change.checked) {
            this.roleFilterVal = this.roleData.map((element) => element.name);
            this.roleFilter.setValue(this.roleFilterVal);
            this.statusFilterVal = this.statusData.map((element) => element.status);
            this.statusFilter.setValue(this.statusFilterVal);
        } else {
            this.roleFilter.setValue([]);
            this.statusFilter.setValue([]);
        }
    }
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    filterDisplayContent(optionsList: any, selectedOptions: any, filterName: string): any {
        switch (filterName) {
            case "roleFilter":
                if (selectedOptions) {
                    this.selectedRoleCount = this.zeroConstant;
                    selectedOptions.forEach((element) => {
                        if (element) {
                            this.selectedRoleCount++;
                        }
                    });
                }
                if (this.selectedRoleCount === optionsList.length) {
                    return this.languageStrings["primary.portal.administrators.all"];
                }
                if (this.selectedRoleCount === 1) {
                    return selectedOptions;
                }
                if (this.selectedRoleCount > this.zeroConstant && this.selectedRoleCount < optionsList.length) {
                    return this.selectedRoleCount;
                }
                break;
            case "statusFilter":
                if (selectedOptions) {
                    this.selectedStatusCount = this.zeroConstant;
                    selectedOptions.forEach((opt) => {
                        if (opt) {
                            this.selectedStatusCount++;
                        }
                    });
                }
                if (this.selectedStatusCount === optionsList.length) {
                    return this.languageStrings["primary.portal.administrators.all"];
                }
                if (this.selectedStatusCount === 1) {
                    return selectedOptions;
                }
                if (this.selectedStatusCount > this.zeroConstant && this.selectedStatusCount < optionsList.length) {
                    return this.selectedStatusCount;
                }
                break;
        }
    }

    applyPillFilters(activeFilters: ActiveFilter[]): void {
        this.reportsToFilterSubject$.next(activeFilters);
    }

    pillFilterOpen(filterOpen: boolean): void {
        this.filterOpen = filterOpen;
    }
    checkForError(): void {
        const val = this.statusFilter.value.length + this.roleFilter.value.length;
        if (val < this.errorCheckLength) {
            const statusError = this.statusFilter.value.length > this.compareZero ? this.isDisplayStatus : "";
            if (statusError !== "") {
                this.dispError = this.languageStrings["primary.portal.administrators.filterStatus"] + this.isDisplayStatus;
            }
            const roleError = this.roleFilter.value.length > this.compareZero ? this.isDisplayRole : "";
            if (roleError !== "") {
                this.dispError = this.languageStrings["primary.portal.administrators.filterRole"] + this.isDisplayRole;
            }
        }
    }

    /**
     * If showAddFromEmployee value is false, returns an array of "Add manually" and "Import admin" options.
     * Otherwise, array will also include "Add from employee list" as the second option.
     *
     * @param showAddFromEmployee condition upon which final status of addAdmin menu relies
     * @returns AsyncMenuItem[] an array of menu items populated asynchronously
     */
    getAddAdminOptions(showAddFromEmployee: boolean): AsyncMenuItem[] {
        return [
            {
                label: "primary.portal.administrators.addManually",
                condition: true,
                callback: () => this.addManually(),
            },
            {
                label: "primary.portal.administrators.addFromEmployeeList",
                condition: this.showAddFromEmployee,
                callback: () => this.addEmployeeList(),
            },
            {
                label: "primary.portal.administrators.importAdmin",
                condition: true,
                callback: () => this.addImportAdmin(),
            },
        ];
    }

    /**
     * Receives an addAdmin menu callback function and calls it.
     *
     * @param callback the function to be called based on addAdmin menu selection
     */
    dispatchAddAdminCallback(callback: AsyncMenuItem["callback"]): void {
        callback();
    }

    /**
     * API call to check if there are any employees added.
     * @returns Observable of type SearchMembers
     */
    getCustomers(): Observable<SearchMembers> {
        return this.memberService.searchMembers({ payload: this.mpGroup }).pipe(
            tap(
                (customers) => {
                    this.employeeList = customers.content;
                    if (customers.content.length > 0) {
                        this.showAddFromEmployee = true;
                    } else {
                        this.showAddFromEmployee = false;
                    }
                    // populate options for "Add Admin" menu, needs to occur after showAddFromEmployee is set
                    this.addAdminOptionsSubject$.next(this.getAddAdminOptions(this.showAddFromEmployee));
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Sets `activeCol` to the active column which can be accordingly styled
     * @param event used to capture active column and direction for sorting
     * @returns no value
     */
    sortData(event: SortActiveDirectionModel): void {
        this.activeCol = event.active;
    }
    /**
     * Initializes matSort and customizes the default sort function
     * @returns no value
     */
    initializeSorting(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            switch (sortHeaderId) {
                case AdminTableColumns.NAME:
                    return data.name.firstName + data.name.lastName;
                case AdminTableColumns.PHONE:
                    return data.phoneNumber ? data.phoneNumber.toString() : "";
                case AdminTableColumns.ROLE:
                    return data.role.name;
                case AdminTableColumns.REPORTS_TO:
                    return data.reportsTo.name.firstName + data.reportsTo.name.lastName;
                default:
                    return data[sortHeaderId];
            }
        };
    }
}
