/* eslint-disable no-case-declarations */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-useless-escape */
import { Component, OnInit, ViewChild, OnDestroy, AfterContentInit, Input } from "@angular/core";
import { Validators, FormGroup, FormBuilder, FormControl } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ResourceListState, RemoveResource, LoadResources, UtilService } from "@empowered/ngxs-store";
import { Resource, FilterParameters, DocumentApiService } from "@empowered/api";
import { Subscription, Observable, timer, Subject, combineLatest } from "rxjs";

import { DataFilter, FilterOption, FilterModel, ActiveFilter } from "@empowered/ui";
import { AppSettings, SortOrder } from "@empowered/constants";
import { map, tap, shareReplay } from "rxjs/operators";
import { RemoveResourceComponent } from "../remove-resource/remove-resource.component";
import { UserService } from "@empowered/user";
import { AddResourceStepperComponent } from "../add-resource-stepper/add-resource-stepper.component";
import { LanguageService } from "@empowered/language";
import { TitleCasePipe } from "@angular/common";
import { DateService } from "@empowered/date";

const searchRegularExp = /-/g;
const replaceString = "/";

@Component({
    selector: "empowered-company-resource-list",
    templateUrl: "./company-resource-list.component.html",
    styleUrls: ["./company-resource-list.component.scss"],
    providers: [DataFilter],
})
export class CompanyResourceListComponent implements OnInit, OnDestroy, AfterContentInit {
    form: FormGroup;
    filterOpen = false;
    filterParams: FilterParameters = {
        filter: "",
        search: "",
        property: "",
        page: "",
        size: "",
        value: "",
    };
    searchControl = new FormControl("");
    searchField = new FormControl("");
    searchTerm = undefined;
    searchCalled = false;
    dropdownStatus = true;
    minimumSearchLength = 3;
    filter = {
        query: {
            name: "",
            category: [],
        },
        freeText: {
            name: "",
        },
    };
    pageSizeOption: any;
    defaultPageNumber = "1";
    pageEventSubscription: Subscription;
    pageNumberControl: FormControl = new FormControl(1);
    displayedColumns = ["name", "type", "category", "manage"];
    dataSource = new MatTableDataSource<Resource>();
    threshold = false;
    compareZero = 0;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @Select(ResourceListState.getResourceList) resourceList$: Observable<Resource[]>;
    resourceListObs$: Observable<Resource[]>;
    resourceListSubscription: Subscription;
    resourceList: Resource[] = [];
    activeCol: string;
    categoryData = [];
    availabilityOption = [
        this.language.fetchPrimaryLanguageValue("primary.portal.resources.filterOption.visibleToEmployeesOn"),
        this.language.fetchPrimaryLanguageValue("primary.portal.resources.filterOption.hidden"),
    ];
    manageOptions = [
        this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
    ];
    isMember = false;
    dispError: string;
    dataLoaded = false;
    downloadDocumentSubscription: Subscription;
    subscriptions: Subscription[] = [];

    categoriesToFilter: ActiveFilter;
    availabilityToFilter: ActiveFilter;
    @Input() isPrivacyOnForEnroller: boolean;
    private readonly allCategorySubject$: Subject<string[]> = new Subject();
    allCategory$: Observable<FilterModel[]> = this.allCategorySubject$.asObservable().pipe(
        map((categories) => [
            {
                id: "categoryFilter",
                title: this.language.fetchPrimaryLanguageValue("primary.portal.resources.category"),
                multi: {
                    isChip: false,
                    options: categories.map(
                        (category) =>
                            ({
                                label: this.titleCasePipe.transform(category),
                                value: category,
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );
    private readonly availabilitySubject$: Subject<string[]> = new Subject();
    availability$: Observable<FilterModel[]> = this.availabilitySubject$.asObservable().pipe(
        map((availability) => [
            {
                id: "availabilityFilter",
                title: this.language.fetchPrimaryLanguageValue("primary.portal.resources.availability"),
                multi: {
                    isChip: false,
                    options: availability.map(
                        (available) =>
                            ({
                                label: this.titleCasePipe.transform(available),
                                value: available,
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );

    companyLibraryFilterModels$: Observable<FilterModel[]> = combineLatest(this.allCategory$).pipe(map(([category]) => [...category]));

    constructor(
        private readonly fb: FormBuilder,
        private readonly dataFilter: DataFilter,
        private readonly _bottomSheet: MatBottomSheet,
        private readonly dialog: MatDialog,
        private readonly documentService: DocumentApiService,
        private readonly user: UserService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly dateService: DateService,
    ) {
        this.pageSizeOption = AppSettings.pageSizeOptions;
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            searchInput: ["", Validators.pattern(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/)],
        });
        this.subscriptions.push(
            this.user.portal$.pipe(tap((portal) => (portal === "member" ? (this.isMember = true) : (this.isMember = false)))).subscribe(),
        );
        if (!this.isMember) {
            this.companyLibraryFilterModels$ = combineLatest(this.allCategory$, this.availability$).pipe(
                map(([category, availability]) => [...category, ...availability]),
            );
        }
        this.listResourecs();
    }

    ngAfterContentInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            if (typeof data[sortHeaderId] === "string") {
                return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
            }
            return data[sortHeaderId];
        };
        this.dataSource.paginator = this.paginator;
        this.subscriptions.push(
            this.paginator.page.subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            }),
        );
    }

    /**
     * This method is used to check resource is effective or not
     * @param resource represents the resource object
     * @returns boolean to refer as effective
     */
    isCurrentlyEffective(resource: Resource): boolean {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let expired = false;
        if (resource.visibilityValidity) {
            const visibility = Object.keys(resource.visibilityValidity).length > 0;
            const expiryDate = resource.visibilityValidity.expiresAfter
                ? new Date(resource.visibilityValidity.expiresAfter.toString().replace(searchRegularExp, replaceString))
                : undefined;
            if (expiryDate) {
                expiryDate.setHours(0, 0, 0, 0);
            }
            const startDate = resource.visibilityValidity.effectiveStarting
                ? new Date(resource.visibilityValidity.effectiveStarting.toString().replace(searchRegularExp, replaceString))
                : undefined;
            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
            }
            if (currentDate > expiryDate || currentDate < startDate || !visibility) {
                expired = true;
            }
        }
        return expired;
    }

    /* will check if date is from future */
    isFutureEffective(resource: Resource): boolean {
        const currentDate = new Date();
        let future = false;
        if (resource.visibilityValidity) {
            const startDate = this.dateService.toDate(resource.visibilityValidity.effectiveStarting);
            if (currentDate < startDate) {
                future = true;
            }
        }
        return future;
    }

    listResourecs(): void {
        this.resourceListObs$ = this.resourceList$.pipe(map((list) => list.filter((resource) => resource.type === "COMPANY")));
        this.subscriptions.push(
            this.resourceListObs$.subscribe((resources) => {
                this.resourceList = resources;
                this.categoryData = this.distinct(this.resourceList, (item) => item.category);
                this.allCategorySubject$.next(this.categoryData);
                this.availabilitySubject$.next(this.availabilityOption);
                this.dataSource.data = resources;
                if (this.isMember) {
                    this.dataSource.data = this.dataSource.data.filter((r: any) => !this.isCurrentlyEffective(r));
                }
                this.dataLoaded = true;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    // method for searching
    applySearchFilter(searchValue: any): void {
        this.searchTerm = searchValue.target.value;
        this.filter.query.name = "";
        this.dropdownStatus = true;
        if (searchValue.target.value.indexOf(":") > -1) {
            const property = searchValue.target.value.substring(0, searchValue.target.value.indexOf(":"));
            const value = searchValue.target.value
                .substring(searchValue.target.value.indexOf(":") + 1, searchValue.target.value.length)
                .trim();
            value.length >= this.minimumSearchLength && value ? (this.searchTerm = value) : (this.searchTerm = "");
            this.filterByIdName(property);
            this.dropdownStatus = false;
        } else if (searchValue.target.value.length >= this.minimumSearchLength) {
            this.filter.freeText.name = searchValue.target.value.trim();
            if (searchValue.key === "Enter" || searchValue.key === "Escape") {
                this.dropdownStatus = false;
            }
            this.searchCalled = true;
            this.subscriptions.push(
                timer(1000).subscribe((data) => {
                    this.filterDataObject();
                }),
            );
        } else if (this.searchCalled === true) {
            this.searchCalled = false;
            this.filter.freeText.name = "";
            this.filterParams.search = this.filter.freeText.name;
            this.subscriptions.push(
                timer(1000).subscribe((data) => {
                    this.filterDataObject();
                }),
            );
        }
    }

    // search based on resource name
    filterByIdName = (value: any): void => {
        this.dropdownStatus = false;
        if (this.threshold) {
            this.filterParams.search = this.filter.freeText.name;
            if (this.searchTerm && value) {
                this.form.controls["searchInput"].setValue(value.trim() + ":" + this.searchTerm);
            }
        } else if (this.searchTerm.length >= this.minimumSearchLength) {
            if (value === "name") {
                this.filter.query.name = this.searchTerm;
                this.filter.freeText.name = "";
            } else {
                this.filter.freeText.name = "";
            }
            if (this.searchTerm && value) {
                this.form.controls["searchInput"].setValue(value.trim() + ":" + this.searchTerm);
            }
        }
        this.subscriptions.push(
            timer(1000).subscribe((data) => {
                this.filterDataObject();
            }),
        );
    };

    // To pass data to DataFilter pipe
    filterDataObject(): void {
        if (!this.threshold) {
            this.filter = this.utilService.copy(this.filter);
            if (this.categoriesToFilter && this.categoriesToFilter.values && this.categoriesToFilter.values.length) {
                this.dataSource.data = this.resourceList.filter((r: any) => this.categoriesToFilter.values.includes(r.category));
            } else {
                this.dataSource.data = this.resourceList;
            }
            if (
                this.availabilityToFilter &&
                (!this.availabilityToFilter.values.includes(this.availabilityOption[0]) ||
                    !this.availabilityToFilter.values.includes(this.availabilityOption[1]))
            ) {
                if (this.availabilityToFilter.values.includes(this.availabilityOption[0])) {
                    this.dataSource.data = this.dataSource.data.filter((r: any) => !this.isCurrentlyEffective(r));
                } else if (this.availabilityToFilter.values.includes(this.availabilityOption[1])) {
                    this.dataSource.data = this.dataSource.data.filter((r: any) => this.isCurrentlyEffective(r));
                }
            } else if (this.isMember) {
                this.dataSource.data = this.dataSource.data.filter((r: any) => !this.isCurrentlyEffective(r));
            }
            this.dataSource.data = this.dataFilter.transform(this.dataSource.data, this.filter);
            this.pageInputChanged(this.defaultPageNumber);
        } else if (this.threshold) {
            this.filterParams.search = this.filter.freeText.name;
            this.listResourecs();
        }
    }

    // method to jump to a particular page
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > this.compareZero && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    // updates page size options in pagination
    updatePageSizeOptions(globalPageSizeOptions: number[]): number[] {
        const dataLength = this.dataSource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = this.compareZero; i < pageSizeOptionsLength; i++) {
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

    sortData(event: any): void {
        this.activeCol = event.active;
    }
    // Function to find unique data from an Array
    distinct(items: any, mapper: any): any {
        if (!mapper) {
            mapper = (item) => item;
        }
        return items.map(mapper).reduce((acc, item) => {
            if (acc.indexOf(item) === -1) {
                acc.push(item);
            }
            return acc;
        }, []);
    }

    addResource(): void {
        const bottomSheet = this._bottomSheet.open(AddResourceStepperComponent, {
            data: {
                type: "COMPANY",
                action: "ADD",
                hasBackdrop: true,
                minWidth: "100%",
                height: "100%",
                panelClass: "add-resource-stepper",
            },
        });
        this.subscriptions.push(
            bottomSheet.afterDismissed().subscribe((result) => {
                this.store.dispatch(new LoadResources());
            }),
        );
    }
    onEdit(resource: any): void {
        const bottomSheet = this._bottomSheet.open(AddResourceStepperComponent, {
            data: {
                type: "COMPANY",
                action: "EDIT",
                resource: resource,
            },
        });
        this.subscriptions.push(
            bottomSheet.afterDismissed().subscribe((result) => {
                this.store.dispatch(new LoadResources());
            }),
        );
    }

    onRemove(resource: any): void {
        const dialogRef = this.dialog.open(RemoveResourceComponent, {
            width: "667px",
            data: {
                type: "COMPANY",
                action: "REMOVE",
                resource: resource,
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result !== undefined) {
                    this.store.dispatch(new RemoveResource(result.id));
                }
            }),
        );
    }

    viewDocument(resource: any): void {
        if (resource.resourceType === "FILE") {
            const documentId = resource.documentId;
            const fileName = resource.documentName;
            const fileType = fileName.split(".").pop();
            this.subscriptions.push(
                this.documentService.downloadDocument(documentId).subscribe((response) => {
                    switch (fileType) {
                        case "pdf":
                            const pdfBlob = new Blob([response], { type: "application/pdf" });
                            const fileurl = URL.createObjectURL(pdfBlob);
                            window.open(fileurl, "_blank");
                            break;
                        default:
                            const blob = new Blob([response], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });
                            const anchor = document.createElement("a");
                            anchor.download = fileName;
                            const fileURLBlob = URL.createObjectURL(blob);
                            anchor.href = fileURLBlob;
                            document.body.appendChild(anchor);
                            anchor.click();
                    }
                }),
            );
        }
        if (resource.resourceType === "URL" || resource.resourceType === "VIDEO") {
            window.open(resource.link, "_blank");
        }
    }

    applyPillFilters(activeFilters: ActiveFilter[]): void {
        this.categoriesToFilter = activeFilters.find((activeFilter) => activeFilter.filterId === "categoryFilter");
        this.availabilityToFilter = activeFilters.find((activeFilter) => activeFilter.filterId === "availabilityFilter");
        this.filterDataObject();
    }

    pillFilterOpen(filterOpen: boolean): void {
        this.filterOpen = filterOpen;
    }
}
