import { AssignAdminModalComponent } from "./../../components/modals/assign-admin-modal/assign-admin-modal.component";
import { UserState } from "@empowered/user";
import { MessageDetailComponent } from "./../../components/message-detail/message-detail.component";
import { MPGroupAccountService, SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import { FilterOption, FilterModel, ActiveFilter } from "@empowered/ui";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { MessageCenterFacadeService } from "./../../services/message-center-facade.service";
import { BoxType, Thread, MessagingService, MessageCategory, TargetUnitType, TargetUnit, AdminStatus } from "@empowered/api";
import {
    tap,
    map,
    filter,
    startWith,
    withLatestFrom,
    debounceTime,
    distinctUntilChanged,
    shareReplay,
    takeUntil,
    switchMap,
} from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, QueryList } from "@angular/core";
import { Observable, Subject, BehaviorSubject, merge, combineLatest, forkJoin } from "rxjs";
import { FormControl } from "@angular/forms";
import { StatusModalComponent } from "../../components/modals/status-modal/status-modal.component";
import { TitleCasePipe } from "@angular/common";
import { Store } from "@ngxs/store";
import { LoadResources, GetBoxTypeThreads, FetchConfigs } from "@empowered/ngxs-store";
import { ConfigName, MessageCenterLanguage, Admin } from "@empowered/constants";
import { CategoryModalComponent } from "../../components/modals/category-modal/category-modal.component";
import { LanguageService } from "@empowered/language";
import { EmpoweredPaginatorComponent } from "@empowered/ui";
import { DeleteMessageModalComponent } from "../../components/modals/delete-message-modal/delete-message-modal.component";
import { DateService } from "@empowered/date";

const QUERY_PARAM_BOX = "box";
const SEARCH_BAR_DEBOUNCE_TIME = 300;
const TAB_INDEX_INBOX = 0;
const TAB_INDEX_SENT = 1;
const TAB_INDEX_DELETE = 2;

@Component({
    selector: "empowered-message-center-view-container",
    templateUrl: "./message-center-view-container.component.html",
    styleUrls: ["./message-center-view-container.component.scss"],
})
export class MessageCenterViewContainerComponent implements OnInit, AfterViewInit, OnDestroy {
    private static readonly ADMIN_PORTAL = "admin";

    MessageCenterLanguage = MessageCenterLanguage;

    private readonly BOX_TYPE_TAB_POSITIONS: BoxType[] = ["INBOX", "SENT", "DELETE"];
    readonly BOX_COLUMNS: string[] = ["status", "from", "subject", "category", "assignedAdmin", "sentOn", "manage"];

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @ViewChildren(EmpoweredPaginatorComponent) matPaginator$: QueryList<EmpoweredPaginatorComponent>;
    dataSource: MatTableDataSource<Thread> = new MatTableDataSource<Thread>();

    // Language
    tabInbox: string = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_TAB_INBOX);
    tabSent: string = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_TAB_SENT);
    tabTrash: string = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_TAB_TRASH);

    bottomSheetRef: MatBottomSheetRef;
    composeSheetRef: MatBottomSheetRef;

    messageCategories$: Observable<MessageCategory[]> = this.messageCenterFacade
        .getCategories()
        .pipe(tap((categories) => (this.messageCategories = categories)));
    messageCategories: MessageCategory[];

    portal$: Observable<string> = this.sharedService.userPortal$.pipe(
        map((portalState) => portalState.type),
        tap((portalType) => (this.isAdmin = portalType === MessageCenterViewContainerComponent.ADMIN_PORTAL)),
        takeUntil(this.unsubscribe$),
        shareReplay(1),
    );
    isAdmin = false;

    private readonly activeFiltersSubject$: BehaviorSubject<ActiveFilter[]> = new BehaviorSubject([]);

    private readonly boxTypeSubject$: Subject<BoxType> = new Subject();
    selectedBox$: Observable<BoxType> = merge(
        // Updated box type
        this.boxTypeSubject$.asObservable(),
        // Initial box type
        this.route.queryParamMap.pipe(
            map((queryParams) => {
                if (queryParams.has(QUERY_PARAM_BOX)) {
                    const boxParam: string = queryParams.get(QUERY_PARAM_BOX).toUpperCase();

                    if (boxParam === "INBOX" || boxParam === "SENT" || boxParam === "DELETE") {
                        return boxParam;
                    }
                }
                return "INBOX" as BoxType;
            }),
        ),
    ).pipe(
        // Fire off request for data of the new box
        switchMap((boxType) => {
            this.selectedBox = boxType;
            return this.messageCenterFacade.requestThreads(boxType, false).pipe(map((state) => boxType));
        }),
        shareReplay(1),
    );
    selectedBox: BoxType;

    // Current box tab index
    selectedBoxIndex$: Observable<number> = this.selectedBox$.pipe(map((boxType) => this.BOX_TYPE_TAB_POSITIONS.indexOf(boxType)));

    // Threads for the current box
    boxThreads$: Observable<Thread[]> = this.selectedBox$.pipe(
        switchMap((boxType) => this.messageCenterFacade.getThreads(boxType)),
        filter((boxTypeThread) => boxTypeThread != null),
        tap((threads) => {
            this.boxSize = threads.length;
        }),
    );
    boxSize = 0;

    // Filter only data
    allAccountAdmins$: Observable<Admin[]> = this.messageCenterFacade
        .getAdmins()
        .pipe(tap((accountAdmins) => (this.allAccountAdmins = accountAdmins)));
    allAccountAdmins: Admin[] = [];
    // Combine all admins for the account along with the admins for the messages
    assignedAdmins$: Observable<Admin[]> = combineLatest([
        this.boxThreads$.pipe(
            map((threads) => threads.filter((thread) => Boolean(thread.assignedAdminId)).map((thread) => thread.assignedAdminId)),
        ),
        this.allAccountAdmins$,
    ]).pipe(
        // Get only the admins that have assignments
        map(([assignedAdminIds, accountAdmins]) => accountAdmins.filter((admin) => assignedAdminIds.indexOf(admin.id) !== -1)),
        // Reduce duplicates that may have been returned
        map((admins) =>
            admins.reduce(
                (accumulator, currentAdmin) =>
                    accumulator.find((admin) => admin.id === currentAdmin.id) == null ? [...accumulator, currentAdmin] : accumulator,
                [],
            ),
        ),
    );
    // Filters - Only for admins
    statusFilterModel$: Observable<FilterModel> = this.portal$.pipe(
        filter(MessageCenterViewContainerComponent.isAdminPortal),
        switchMap((portal) =>
            this.boxThreads$.pipe(
                map((threadMessages) => {
                    const currentStatus: AdminStatus[] = threadMessages
                        .map((threadMessage) => threadMessage.status)
                        .filter((status) => Boolean(status));

                    return {
                        id: "status",
                        title: this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_FILTER_STATUS),
                        multi: {
                            isChip: false,
                            options: (["NEW", "CLOSED", "IN_RESEARCH"] as AdminStatus[])
                                .filter((status) => currentStatus.indexOf(status) >= 0)
                                .map(
                                    (status) =>
                                        ({
                                            label: status,
                                            value: status,
                                        } as FilterOption),
                                ),
                        },
                    } as FilterModel;
                }),
            ),
        ),
    );
    // Build the category filter
    categoryFilterModel$: Observable<FilterModel> = this.portal$.pipe(
        filter(MessageCenterViewContainerComponent.isAdminPortal),
        switchMap((portal) =>
            combineLatest([
                this.boxThreads$,
                this.messageCenterFacade.getCategories().pipe(tap((categories) => (this.messageCategories = categories))),
                this.selectedBox$,
            ]).pipe(
                map(([threadMessages, categories, boxType]) => {
                    const currentCategoryIds: number[] = threadMessages
                        // If user is in the sent box then collect the categories from the 'from' field
                        .map((thread) => thread[boxType === "SENT" ? "from" : "sentTo"])
                        .filter((targetUnit) => targetUnit.type === TargetUnitType.CATEGORY)
                        .reduce((accumulator, currentUnit) => [...accumulator, ...currentUnit.ids], []);

                    return {
                        id: "category",
                        title: this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_FILTER_CATEGORY),
                        multi: {
                            isChip: false,
                            options: categories
                                .filter((category) => currentCategoryIds.indexOf(category.id) >= 0)
                                .map(
                                    (category) =>
                                        ({
                                            label: category.name,
                                            value: category.id.toString(),
                                        } as FilterOption),
                                ),
                        },
                    } as FilterModel;
                }),
            ),
        ),
    );
    // Build the admin filter model
    adminFilterModel$: Observable<FilterModel> = this.portal$.pipe(
        filter(MessageCenterViewContainerComponent.isAdminPortal),
        switchMap((portal) =>
            this.boxThreads$.pipe(
                withLatestFrom(this.store.select(UserState), this.assignedAdmins$),
                map(([boxThreadMessages, credential, assignedAdmins]) => {
                    // Convert the admins to the filter options
                    const adminFilters: FilterOption[] = assignedAdmins.map(
                        (admin) =>
                            ({
                                label:
                                    `${this.titlePipe.transform(admin.name.firstName)} ` +
                                    `${this.titlePipe.transform(admin.name.lastName)}`,
                                value: admin.id.toString(),
                            } as FilterOption),
                    );
                    // Add unassigned option
                    let filterOptions = [
                        {
                            label: this.languageService.fetchPrimaryLanguageValue(
                                MessageCenterLanguage.INBOX_CONTAINER_FILTER_ASSIGNED_TO_UNASSIGNED,
                            ),
                            value: "UNASSIGNED",
                        },
                    ];
                    // if you are an admin, add self as an option
                    if (credential && "adminId" in credential) {
                        filterOptions = [
                            ...filterOptions,
                            {
                                label: this.languageService.fetchPrimaryLanguageValue(
                                    MessageCenterLanguage.INBOX_CONTAINER_FILTER_ASSIGNED_TO_ME,
                                ),
                                value: credential.adminId.toString(),
                            },
                            ...adminFilters.filter((option) => option.value !== credential.adminId.toString()),
                        ];
                    } else {
                        filterOptions = [...filterOptions, ...adminFilters];
                    }

                    return {
                        id: "admin",
                        title: this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.INBOX_CONTAINER_FILTER_ASSIGNED_TO),
                        multi: {
                            isChip: false,
                            options: filterOptions,
                        },
                    } as FilterModel;
                }),
            ),
        ),
    );
    // Combine all the models
    filterModels$: Observable<FilterModel[]> = combineLatest([this.statusFilterModel$, this.categoryFilterModel$, this.adminFilterModel$]);

    // Search Filter
    searchBar: FormControl = new FormControl("");
    searchBarFilter$: Observable<unknown> = this.searchBar.valueChanges.pipe(
        debounceTime(SEARCH_BAR_DEBOUNCE_TIME),
        distinctUntilChanged(),
        withLatestFrom(this.selectedBox$, this.mpGroup.mpGroupAccount$),
        tap(([searchTerm, boxType, account]) => this.store.dispatch(new GetBoxTypeThreads(account.id, boxType, true, searchTerm))),
        tap((search) => (this.searchFilterApplied = true)),
        takeUntil(this.unsubscribe$),
    );
    searchFilterApplied = false;

    // Apply the filters to the threads
    filteredBoxThreadMessages$: Observable<Thread[]> = combineLatest([
        this.boxThreads$,
        this.activeFiltersSubject$,
        this.selectedBox$,
    ]).pipe(
        map(([threadMessages, activeFilters, boxType]) =>
            threadMessages.filter((threadMessage) =>
                activeFilters.reduce((accumulator, activeFilter) => {
                    let filterMatch = false;
                    // Apply status filter
                    if (activeFilter.filterId === "status") {
                        filterMatch = Boolean(threadMessage.status) && activeFilter.values.indexOf(threadMessage.status) !== -1;
                        // Apply category filter
                    } else if (activeFilter.filterId === "category") {
                        const threadTarget: TargetUnit = threadMessage[boxType === "SENT" ? "from" : "sentTo"];
                        filterMatch =
                            threadTarget &&
                            threadTarget.type === TargetUnitType.CATEGORY &&
                            threadTarget.ids.reduce(
                                (threadCategoryAccumulator, currentId) =>
                                    threadCategoryAccumulator || activeFilter.values.indexOf(currentId.toString()) !== -1,
                                false,
                            );
                        // Apply admin filter
                    } else if (activeFilter.filterId === "admin") {
                        filterMatch =
                            (threadMessage.assignedAdminId &&
                                activeFilter.values.indexOf(threadMessage.assignedAdminId.toString()) !== -1) ||
                            (!threadMessage.assignedAdminId && activeFilter.values.indexOf("UNASSIGNED") !== -1);
                    }

                    return filterMatch && accumulator;
                }, true),
            ),
        ),
        tap((boxThreadMessages) => (this.filteredBoxSize = boxThreadMessages.length)),
    );
    filteredBoxSize = 0;

    // Sort
    private readonly sortSubject$: Subject<Sort> = new Subject<Sort>();
    sortedResults$: Observable<Thread[]> = combineLatest([
        this.filteredBoxThreadMessages$,
        this.sortSubject$.pipe(startWith({ active: "", direction: "" })),
        this.allAccountAdmins$,
    ]).pipe(
        map(([filteredResults, sortEvent, accountAdmins]) => {
            if (sortEvent.active === "" || sortEvent.direction === "") {
                return filteredResults;
            }

            const modifier: number = sortEvent.direction === "desc" ? -1 : 1;
            switch (sortEvent.active) {
                // Sort on sentOn Field
                case "sentOn":
                    return filteredResults.sort((first, second) => {
                        if (!first) {
                            return -1 * modifier;
                        }
                        if (!second) {
                            return 1 * modifier;
                        }

                        return (
                            (this.dateService.toDate(first[sortEvent.active]) < this.dateService.toDate(second[sortEvent.active])
                                ? -1
                                : 1) * modifier
                        );
                    });
                // Sort on assignedAdmin field
                case "assignedAdmin":
                    return filteredResults.sort((first, second) => {
                        const firstAdmin: Admin =
                            first && first.assignedAdminId ? accountAdmins.find((admin) => admin.id === first.assignedAdminId) : undefined;
                        const secondAdmin: Admin =
                            second && second.assignedAdminId
                                ? accountAdmins.find((admin) => admin.id === second.assignedAdminId)
                                : undefined;
                        return (this.convertAdminLowerCase(firstAdmin) < this.convertAdminLowerCase(secondAdmin) ? -1 : 1) * modifier;
                    });
                // Default sort
                default:
                    return filteredResults.sort(
                        (first, second) =>
                            (this.convertLowerCase(first[sortEvent.active]) < this.convertLowerCase(second[sortEvent.active]) ? -1 : 1) *
                            modifier,
                    );
            }
        }),
        // Update the DataSource
        tap((sortedResults) => (this.dataSource.data = sortedResults)),
    );

    /**
     * Subscribe to all the prerequisite actions for the page
     *
     * @param route
     * @param messageCenterFacade
     * @param empoweredSheet
     * @param empoweredModal
     * @param messagingService
     * @param titlePipe
     * @param store
     * @param sharedService
     * @param mpGroup
     * @param languageService
     */
    constructor(
        private readonly route: ActivatedRoute,
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly empoweredSheet: EmpoweredSheetService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly messagingService: MessagingService,
        private readonly titlePipe: TitleCasePipe,
        private readonly store: Store,
        private readonly sharedService: SharedService,
        private readonly mpGroup: MPGroupAccountService,
        private readonly languageService: LanguageService,
        private readonly dateService: DateService,
    ) {
        forkJoin([
            this.messageCenterFacade.requestAdmins(),
            this.messageCenterFacade.requestCategories(),
            this.messageCenterFacade.requestMembers(),
            this.messageCenterFacade.requestProducers(),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.store.dispatch(new LoadResources());
        this.store.dispatch(new FetchConfigs(ConfigName.MESSAGE_CENTER_SUBJECT_LENGTH));
    }

    /**
     * Validates if the user is in the admin portal
     *
     * @param portal the string version of the portal
     * @returns if the portal is in the admin section
     */
    private static readonly isAdminPortal: (portal: string) => boolean = (portal: string) =>
        portal === MessageCenterViewContainerComponent.ADMIN_PORTAL;

    /**
     * Subscribe to the non-display observables
     */
    ngOnInit(): void {
        this.portal$.subscribe();
        this.searchBarFilter$.subscribe();
    }

    /**
     * After the view initializes, subscribe to the paginator and add it to the DataSource
     */
    ngAfterViewInit(): void {
        this.matPaginator$.changes
            .pipe(
                distinctUntilChanged((listOne, listTwo) => listOne && listTwo && listOne.length === listTwo.length),
                filter((paginators) => paginators.length > 0),
                tap((paginators) => (this.dataSource.paginator = paginators.first)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * On destroy, unsubscribe
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Handle the tab change event and navigate to it
     *
     * @param tabChangeEvent the new tab
     */
    onBoxTabChange(tabChangeEvent: MatTabChangeEvent): void {
        let nextBoxType: BoxType = "INBOX";
        if (tabChangeEvent.index >= TAB_INDEX_INBOX && tabChangeEvent.index <= TAB_INDEX_DELETE) {
            nextBoxType = this.BOX_TYPE_TAB_POSITIONS[tabChangeEvent.index];
        }

        this.boxTypeSubject$.next(nextBoxType);
    }

    /**
     * Open up the thread detail if the row is clicked
     *
     * @param thread the thread being clicked
     */
    onRowClick(thread: Thread): void {
        if (this.bottomSheetRef != null) {
            this.bottomSheetRef.dismiss();
        }

        this.bottomSheetRef = this.empoweredSheet.openSheet(MessageDetailComponent, {
            backdropClass: "empowered-overlay",
            panelClass: "empowered-sheet",
            data: { thread: thread, boxType: this.selectedBox },
        });
        this.bottomSheetRef
            .afterDismissed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this.selectedBox$),
                switchMap(([, boxType]) => this.messageCenterFacade.requestThreads(boxType)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * catch the sort event and put it into the pipeline
     * @param sort The sort event
     */
    onSortEvent(sort: Sort): void {
        this.sortSubject$.next(sort);
    }

    /**
     * Menu function to delete the thread
     *
     * @param threadId thread to delete
     */
    onDeleteClick(threadId: number): void {
        this.empoweredModal
            .openDialog(DeleteMessageModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                switchMap((resp) => this.messagingService.deleteThread(threadId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Menu function to update the status
     *
     * @param thread the thread to update
     */
    onChangeStatusClick(thread: Thread): void {
        this.empoweredModal
            .openDialog(StatusModalComponent, { data: ["NEW", "CLOSED", "IN_RESEARCH"] })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                switchMap((resp) => {
                    thread.status = resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                switchMap((response) => this.messageCenterFacade.getThreads(this.selectedBox)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Menu function to update the category
     *
     * @param thread the thread to update
     */
    onChangeCategoryClick(thread: Thread): void {
        this.empoweredModal
            .openDialog(CategoryModalComponent, { data: { categories: this.messageCenterFacade.getCategories() } })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                switchMap((resp) => {
                    thread.categoryId = resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                withLatestFrom(this.boxTypeSubject$.asObservable()),
                switchMap((response) => this.messageCenterFacade.getThreads(this.selectedBox)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Menu function to update the admin
     *
     * @param thread the thread to update
     */
    onChangeAdminClick(thread: Thread): void {
        this.empoweredModal
            .openDialog(AssignAdminModalComponent, {
                data: { isUpdate: true, admins: this.messageCenterFacade.getAdmins() },
            })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                switchMap((resp) => {
                    thread.assignedAdminId = +resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                switchMap((response) => this.messageCenterFacade.getThreads(this.selectedBox)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * The handler for the pill filter group
     *
     * @param activeFilters The filters being applied
     */
    onChange(activeFilters: ActiveFilter[]): void {
        this.activeFiltersSubject$.next(activeFilters);
    }

    /**
     * Convert input value to lower case if it exists
     *
     * @param input input string
     * @returns lower case string
     */
    convertLowerCase(input: string): string {
        return input ? input.toLowerCase() : "";
    }

    /**
     * Convert the Admin to a string representation of the name
     *
     * @param admin admin to convert
     * @returns string the string conversion of the admin
     */
    convertAdminLowerCase(admin: Admin): string {
        const firstName: string = admin && admin.name && admin.name.firstName ? admin.name.firstName.toLowerCase() : "";
        const lastName: string = admin && admin.name && admin.name.lastName ? admin.name.lastName.toLowerCase() : "";
        return `${firstName} ${lastName}`;
    }
}
