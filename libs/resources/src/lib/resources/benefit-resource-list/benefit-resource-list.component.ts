import { Component, OnInit, ViewChild, OnDestroy, AfterContentInit, Input } from "@angular/core";
import { Validators, FormGroup, FormBuilder, FormControl } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort, Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ResourceListState, RemoveResource, LoadResources, UtilService } from "@empowered/ngxs-store";
import {
    Resource,
    FilterParameters,
    DocumentApiService,
    BenefitsOfferingService,
    CoreService,
    ResourceType,
    FileType,
    MemberService,
    ShoppingService,
} from "@empowered/api";
import { Subscription, Observable, timer, combineLatest, iif, of, BehaviorSubject, forkJoin } from "rxjs";
import { DataFilter, FilterOption, FilterModel, ActiveFilter } from "@empowered/ui";
import { map, tap, shareReplay, switchMap, startWith } from "rxjs/operators";
import { RemoveResourceComponent } from "../remove-resource/remove-resource.component";
import { UserService } from "@empowered/user";
import { AddResourceStepperComponent } from "../add-resource-stepper/add-resource-stepper.component";
import { LanguageService } from "@empowered/language";
import { TitleCasePipe } from "@angular/common";
import { CarrierId, AppSettings, EnrollmentMethod, SortOrder, PlanChoice, PlanOffering } from "@empowered/constants";
import { MPGroupAccountService } from "@empowered/common-services";

const BENEFIT = "BENEFIT";
const APPROVED = "APPROVED";
const SUBMITTED_TO_HR = "SUBMITTED_TO_HR";
const EMPTY = "";
const searchRegularExp = /-/g;
const replaceString = "/";
const STR_HOME = "HOME";
const STRING = "string";

@Component({
    selector: "empowered-benefit-resource-list",
    templateUrl: "./benefit-resource-list.component.html",
    styleUrls: ["./benefit-resource-list.component.scss"],
    providers: [DataFilter],
})
export class BenefitResourceListComponent implements OnInit, OnDestroy, AfterContentInit {
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
    aflacGroupCarrierId = CarrierId.AFLAC_GROUP;
    dropdownStatus = true;
    minimumSearchLength = 3;
    filter = {
        query: {
            name: "",
        },
        freeText: {
            name: "",
        },
    };
    pageSizeOption: any;
    defaultPageNumber = "1";
    pageEventSubscription: Subscription;
    pageNumberControl: FormControl = new FormControl(1);
    dataLoaded = false;
    displayedColumns = ["name", "type", "carrierName", "productName", "manage"];
    dataSource = new MatTableDataSource<Resource>();
    threshold = false;
    compareZero = 0;
    activeCol: string;
    carrierData = [];
    productData = [];
    carriersToFilter: ActiveFilter;
    productsToFilter: ActiveFilter;
    availabilityToFilter: ActiveFilter;
    isBenefitOfferingsSubmitted: boolean;
    private readonly allCarriersSubject$: BehaviorSubject<string[]> = new BehaviorSubject([]);
    allCarriers$: Observable<FilterModel[]> = this.allCarriersSubject$.asObservable().pipe(
        map((carriers) => [
            {
                id: "carrierFilter",
                title: this.language.fetchPrimaryLanguageValue("primary.portal.resources.carrier"),
                multi: {
                    isChip: false,
                    options: carriers.map(
                        (carrier) =>
                            ({
                                label: this.titleCasePipe.transform(carrier),
                                value: carrier,
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );
    private readonly allProductsSubject$: BehaviorSubject<string[]> = new BehaviorSubject([]);
    allProducts$: Observable<FilterModel[]> = this.allProductsSubject$.asObservable().pipe(
        map((products) => [
            {
                id: "productsFilter",
                title: this.language.fetchPrimaryLanguageValue("primary.portal.resources.product"),
                multi: {
                    isChip: false,
                    options: products.map(
                        (product) =>
                            ({
                                label: this.titleCasePipe.transform(product),
                                value: product,
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );
    private readonly availabilitySubject$: BehaviorSubject<string[]> = new BehaviorSubject([]);
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
                                label: available,
                                value: available,
                            } as FilterOption),
                    ),
                },
            },
        ]),
        shareReplay(1),
    );

    benefitsLibraryfilterModels$: Observable<FilterModel[]> = combineLatest(this.allCarriers$, this.allProducts$).pipe(
        map(([allCarriers, allProducts]) => [...allCarriers, ...allProducts]),
    );

    userInformation$ = this.userService.credential$.pipe(
        switchMap((credential) => {
            // we cannot make it constant due to the design of Credential Type and needs refactoring
            if ("memberId" in credential) {
                this.memberId = credential.memberId;
                return this.memberService.getMemberContact(credential.memberId, STR_HOME, credential.groupId.toString());
            }
            return undefined;
        }),
    );

    availabilityOption = [
        this.language.fetchPrimaryLanguageValue("primary.portal.resources.filterOption.visibleToEmployeesOn"),
        this.language.fetchPrimaryLanguageValue("primary.portal.resources.filterOption.hidden"),
    ];
    manageOptions = [
        this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
        this.language.fetchPrimaryLanguageValue("primary.portal.common.view"),
    ];
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @Select(ResourceListState.getResourceList) resourceList$: Observable<Resource[]>;
    @Select(ResourceListState.getProductsList) productList$: Observable<any[]>;
    @Select(ResourceListState.getCarriersList) carrierList$: Observable<any[]>;
    resourceListObs$: Observable<Resource[]>;
    resourceList: Resource[] = [];
    isApply = false;
    isMember = false;
    dispError: string;
    subscriptions: Subscription[] = [];
    options = {
        useCheckbox: true,
        useVirtualScroll: true,
        dropSlotHeight: 3,
    };
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.resources.benefitLibrary",
        "primary.portal.resources.messageCenter",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.resources.addResource",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.common.enterPageNumber",
        "primary.portal.resources.benefitLibrary",
        "primary.portal.resources.benefitLibrary.getInformation",
    ]);
    mpGroup: number;
    situsState: string;
    planChoices: PlanChoice[];
    userState: string;
    memberId: number;
    planOfferings: PlanOffering[];
    @Input() isPrivacyOnForEnroller: boolean;
    constructor(
        private readonly fb: FormBuilder,
        private readonly dataFilter: DataFilter,
        private readonly bottomSheet: MatBottomSheet,
        private readonly dialog: MatDialog,
        private readonly documentService: DocumentApiService,
        private readonly userService: UserService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly coreService: CoreService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
    ) {
        this.pageSizeOption = AppSettings.pageSizeOptions;
    }
    /**
     * This method is used to initialize and list resources and plan documents
     * @returns {void} returns no value
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$.subscribe((account) => {
                if (account.id) {
                    this.mpGroup = account.id;
                    this.situsState = account.situs.state.abbreviation;
                }
            }),
        );
        this.form = this.fb.group({
            // eslint-disable-next-line no-useless-escape
            searchInput: ["", Validators.pattern(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/)],
        });
        this.subscriptions.push(
            this.userService.portal$
                .pipe(tap((portal) => (portal === "member" ? (this.isMember = true) : (this.isMember = false))))
                .subscribe(),
        );
        if (!this.isMember) {
            this.benefitsLibraryfilterModels$ = combineLatest(this.allCarriers$, this.allProducts$, this.availability$).pipe(
                map(([allCarriers, allProducts, availability]) => [...allCarriers, ...allProducts, ...availability]),
            );
        }
        this.listResources();
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

    /* will check if effective date is from future */
    isFutureEffective(resource: Resource): boolean {
        const currentDate = new Date();
        let future = false;
        if (resource.visibilityValidity) {
            const startDate = new Date(resource.visibilityValidity.effectiveStarting);
            if (currentDate < startDate) {
                future = true;
            }
        }
        return future;
    }
    /**
     * This method is used to list resources and plan documents
     * @returns {void} returns void
     */
    listResources(): void {
        this.resourceListObs$ = this.resourceList$.pipe(map((list) => list.filter((resource) => resource.type === BENEFIT)));
        const planIds: number[] = [];
        const planChoices$ = this.benefitOfferingService.getApprovalRequests(this.mpGroup).pipe(
            switchMap((approvalRequests) =>
                iif(
                    () => {
                        const appReq = approvalRequests.filter((resp) => resp.status === APPROVED || resp.status === SUBMITTED_TO_HR);
                        this.isBenefitOfferingsSubmitted = appReq.length > 0;
                        return this.isBenefitOfferingsSubmitted;
                    },
                    iif(
                        () => this.isMember,
                        this.userInformation$.pipe(
                            tap((user) => (this.userState = user.body.address.state)),
                            switchMap((userInfo) =>
                                this.shoppingService.getAllPlanOfferings(
                                    EnrollmentMethod.SELF_SERVICE,
                                    this.mpGroup,
                                    userInfo.body.address.state,
                                    this.memberId,
                                    {},
                                    "plan.carrierId",
                                ),
                            ),
                            tap((data) => (this.planOfferings = data)),
                            switchMap((planOffering: PlanOffering[]) => {
                                const observableList$: Observable<PlanOffering[]>[] = [];
                                planOffering.forEach((planOffer) => {
                                    planIds.push(planOffer.plan.id);
                                    observableList$.push(
                                        this.shoppingService.getPlanOfferingRiders(
                                            planOffer.id.toString(),
                                            this.mpGroup,
                                            EnrollmentMethod.SELF_SERVICE,
                                            this.userState,
                                            this.memberId,
                                        ),
                                    );
                                });
                                return forkJoin(observableList$);
                            }),
                            tap((planOfferingCollectionList) => {
                                planOfferingCollectionList.forEach((planOfferingCollection) =>
                                    planOfferingCollection.forEach((planOffering) => {
                                        this.planOfferings.push(planOffering);
                                        planIds.push(planOffering.plan.id);
                                        return planOffering.plan.id;
                                    }),
                                );
                            }),
                            switchMap((pls) => this.coreService.getPlanDocuments(planIds, this.userState, this.mpGroup.toString())),
                        ),
                        this.benefitOfferingService.getPlanChoices(false, false, this.mpGroup).pipe(
                            tap((data) => (this.planChoices = data)),
                            map((resp) => resp.map((data) => data.plan.id)),
                            switchMap((data) => this.coreService.getPlanDocuments(data, this.situsState, this.mpGroup.toString())),
                        ),
                    ),
                    of([]),
                ),
            ),
        );
        this.subscriptions.push(
            combineLatest([this.resourceListObs$, this.productList$, this.carrierList$, planChoices$.pipe(startWith([]))])
                .pipe(
                    tap(([resources, products, carriers, planDocuments]) => {
                        this.resourceList = resources;
                        this.dataSource.data = this.resourceList;
                        planDocuments.forEach((data) => {
                            const resourceType = data.type === ResourceType.VIDEO ? ResourceType.VIDEO : ResourceType.URL;
                            const fileType = data.location.toLocaleUpperCase().includes(FileType.PDF) ? FileType.PDF : FileType.OTHER;
                            const planChoiceOrOfferings = this.isMember
                                ? this.planOfferings.find((val) => data.planId === val.plan.id)
                                : this.planChoices.find((val) => data.planId === val.plan.id);
                            const product = products.find((prod) => prod.product.id === planChoiceOrOfferings.plan.productId);
                            const carrier = this.isMember
                                ? carriers.find((val) => val.id === planChoiceOrOfferings.plan.carrier.id)
                                : carriers.find((val) => val.id === planChoiceOrOfferings.plan.carrierId);
                            this.resourceList.push({
                                documentId: data.id,
                                name: data.name,
                                link: data.location,
                                description: data.description,
                                type: BENEFIT,
                                resourceType: resourceType,
                                fileType: fileType,
                                productId: planChoiceOrOfferings.plan.productId,
                                carrierId: this.isMember ? planChoiceOrOfferings.plan.carrier.id : planChoiceOrOfferings.plan.carrierId,
                                productName: product.product.name ? product.product.name : EMPTY,
                                carrierName: carrier.name ? carrier.name : EMPTY,
                                isPlanDoc: true,
                            } as Resource);
                        });
                    }),
                )
                .subscribe(
                    () => {
                        this.updateDataSourceAndFilters();
                        this.dataLoaded = true;
                    },
                    (err) => (this.dataLoaded = true),
                ),
        );
    }
    /**
     * This method is used to update datasource and filters
     * @returns void
     */
    updateDataSourceAndFilters(): void {
        this.dataSource.data = this.resourceList;
        if (this.isMember) {
            this.dataSource.data = this.dataSource.data.filter((r: Resource) => !this.isCurrentlyEffective(r));
        }
        this.carrierData = this.distinct(this.resourceList, (item) => item.carrierName);
        this.productData = this.distinct(this.resourceList, (item) => item.productName);
        this.allCarriersSubject$.next(this.carrierData);
        this.allProductsSubject$.next(this.productData);
        this.availabilitySubject$.next(this.availabilityOption);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }

    // method for searching
    applySearchFilter(searchValue: any): void {
        this.searchTerm = searchValue.target.value;
        this.filter.query.name = "";
        this.dropdownStatus = true;
        if (searchValue.target.value.length >= this.minimumSearchLength) {
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

    /**
     * This method is used to view Resource
     * @param resource is a resource object
     * @returns void
     */
    viewDocument(resource: Resource): void {
        if (resource.resourceType === "FILE" && resource.documentId) {
            const documentId = resource.documentId;
            const fileName = resource.documentName ? resource.documentName : "";
            const fileType = fileName.split(".").pop();
            this.subscriptions.push(
                this.documentService.downloadDocument(documentId).subscribe((response) => {
                    switch (fileType) {
                        case "pdf": {
                            const pdfBlob = new Blob([response], { type: "application/pdf" });
                            const fileurl = URL.createObjectURL(pdfBlob);
                            window.open(fileurl, "_blank");
                            break;
                        }
                        default: {
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
                    }
                }),
            );
        }
        if (resource.resourceType === "URL" || resource.resourceType === "VIDEO") {
            window.open(resource.link, "_blank");
        }
    }
    /**
     * Method to sort the Data of resource table
     * @param sort used to capture active column and direction for sorting
     */
    sortData(sort: Sort): void {
        this.activeCol = sort.active;
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            if (typeof data[sortHeaderId] === STRING) {
                return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
            }
            return data[sortHeaderId];
        };
    }

    // To pass data to DataFilter pipe
    // eslint-disable-next-line complexity
    filterDataObject(): void {
        if (!this.threshold) {
            this.filter = this.utilService.copy(this.filter);
            if (
                this.carriersToFilter &&
                this.carriersToFilter.values &&
                this.carriersToFilter.values.length &&
                !(this.productsToFilter && this.productsToFilter.values && this.productsToFilter.values.length)
            ) {
                this.dataSource.data = this.resourceList.filter((r: any) => this.carriersToFilter.values.includes(r.carrierName));
            } else if (
                this.productsToFilter &&
                this.productsToFilter.values &&
                this.productsToFilter.values.length &&
                !(this.carriersToFilter && this.carriersToFilter.values && this.carriersToFilter.values.length)
            ) {
                this.dataSource.data = this.resourceList.filter((r: any) => this.productsToFilter.values.includes(r.productName));
            } else if (
                this.carriersToFilter &&
                this.carriersToFilter.values &&
                this.carriersToFilter.values.length &&
                this.productsToFilter &&
                this.productsToFilter.values &&
                this.productsToFilter.values.length
            ) {
                this.dataSource.data = this.resourceList.filter(
                    (r: any) =>
                        this.productsToFilter.values.includes(r.productName) && this.carriersToFilter.values.includes(r.carrierName),
                );
            } else {
                this.dataSource.data = this.resourceList;
            }
            if (
                this.availabilityToFilter &&
                this.availabilityToFilter.values &&
                (!this.availabilityToFilter.values.includes(this.availabilityOption[0]) ||
                    !this.availabilityToFilter.values.includes(this.availabilityOption[1]))
            ) {
                if (this.availabilityToFilter.values.includes(this.availabilityOption[0])) {
                    this.dataSource.data = this.dataSource.data.filter((r: Resource) => !this.isCurrentlyEffective(r));
                } else if (this.availabilityToFilter.values.includes(this.availabilityOption[1])) {
                    this.dataSource.data = this.dataSource.data.filter((r: Resource) => this.isCurrentlyEffective(r));
                }
            } else if (this.isMember) {
                this.dataSource.data = this.dataSource.data.filter((r: Resource) => !this.isCurrentlyEffective(r));
            }
            this.dataSource.data = this.dataFilter.transform(this.dataSource.data, this.filter);
            this.pageInputChanged(this.defaultPageNumber);
        } else if (this.threshold) {
            this.filterParams.search = this.filter.freeText.name;
            this.listResources();
        }
    }

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
    /**
     * function to add new resource file
     */
    addResource(): void {
        const bottomSheet = this.bottomSheet.open(AddResourceStepperComponent, {
            data: {
                type: "BENEFIT",
                action: "ADD",
                hasBackdrop: true,
                minWidth: "100%",
                height: "100%",
                panelClass: "add-resource-stepper",
            },
        });
        this.subscriptions.push(
            bottomSheet
                .afterDismissed()
                .pipe(
                    switchMap((result) => this.store.dispatch(new LoadResources())),
                    tap((resp) => (this.dataSource.data = this.store.selectSnapshot(ResourceListState).allResources)),
                )
                .subscribe(() => this.listResources()),
        );
    }
    /**
     * function to edit an existing resource file
     * @param resource : the file to be edited
     */
    onEdit(resource: Resource): void {
        const bottomSheet = this.bottomSheet.open(AddResourceStepperComponent, {
            data: {
                type: "BENEFIT",
                action: "EDIT",
                resource: resource,
            },
        });
        this.subscriptions.push(
            bottomSheet
                .afterDismissed()
                .pipe(
                    switchMap((result) => this.store.dispatch(new LoadResources())),
                    tap((resp) => (this.dataSource.data = this.store.selectSnapshot(ResourceListState).allResources)),
                )
                .subscribe(),
        );
    }
    /**
     * function to remove an existing resource file
     * @param resource : the file to be removed
     */
    onRemove(resource: Resource): void {
        const dialogRef = this.dialog.open(RemoveResourceComponent, {
            width: "667px",
            data: {
                type: "BENEFIT",
                action: "REMOVE",
                resource: resource,
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result !== undefined) {
                    this.store.dispatch(new RemoveResource(result.id));
                    this.listResources();
                }
            }),
        );
    }

    applyPillFilters(activeFilters: ActiveFilter[]): void {
        this.carriersToFilter = activeFilters.find((activeFilter) => activeFilter.filterId === "carrierFilter");
        this.productsToFilter = activeFilters.find((activeFilter) => activeFilter.filterId === "productsFilter");
        this.availabilityToFilter = activeFilters.find((activeFilter) => activeFilter.filterId === "availabilityFilter");
        this.filterDataObject();
    }

    pillFilterOpen(filterOpen: boolean): void {
        this.filterOpen = filterOpen;
    }
}
