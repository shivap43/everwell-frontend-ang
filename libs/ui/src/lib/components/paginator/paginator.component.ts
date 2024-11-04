import { Component, OnInit, Input, ViewChild, OnDestroy, ChangeDetectorRef, AfterViewInit } from "@angular/core";

import { FormControl } from "@angular/forms";
import { MatPaginator, PageEvent, MatPaginatorIntl } from "@angular/material/paginator";
import { Observable, combineLatest, BehaviorSubject, Subject } from "rxjs";

import { filter, map, shareReplay, tap, withLatestFrom, debounceTime, takeUntil } from "rxjs/operators";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

const DEBOUNCE_TIME_VALUE = 300;

@Component({
    selector: "empowered-paginator",
    templateUrl: "./paginator.component.html",
    styleUrls: ["./paginator.component.scss"],
})

/**
 * empowered-paginator is used to provide material paginator which can easily bind with table data
 *
 * Detail usage of this component with an example is mentioned in README.md file
 *
 * @param data$ Input Data from source component
 * @param totalItems$ observable of type number used to calculate total number of item in the data.
 * @param pageNumberControl reference of form controller.
 * @param totalPages$ observable of type number used to calculate the number of pages
 * @param pageSizeOption mat-paginator page size option e.g 15,25,50
 * @param eventSubject$ BehaviorSubject is used to set initial Subject value
 * @param pageIndexSubject$ BehaviorSubject is used to set PageIndex
 * @param dataSubject$ BehaviorSubject is used to set staticData/data
 * @param pageIndex$ Observable used to provide to MatPaginator
 * @param unsubscribe$ unsubscribe the subscriber, it is a subject of type boolean
 * @param itemPerPageLabel used to set custom item per page label
 * @param item used to set custom page range item label
 */
export class EmpoweredPaginatorComponent extends MatPaginator implements OnInit, OnDestroy, AfterViewInit {
    /**
     * Input data (static data) setting to dataSubject$ of type BehaviorSubject
     * @param data input data from source component
     *
     */
    @Input()
    set data(data: unknown[]) {
        this.dataSubject$.next(data);
    }

    /**
     * pageIndex getter method
     * @returns pageIndex of type number from pageIndexSub$
     */
    get pageIndex(): number {
        return this.pageIndexSub$.value;
    }

    /**
     * pageIndex setter method
     * @param value pageIndex of type number
     */
    set pageIndex(value: number) {
        this.pageIndexSub$.next(value);
    }

    /**
     * pageSize getter method
     * @returns pageSize of type number from pageSizeSub$
     */
    get pageSize(): number {
        return this.pageSizeSub$.value;
    }

    /**
     * pageSize setter method
     * @param value pageSize of type number
     */
    set pageSize(value: number) {
        this.pageSizeSub$.next(value);
    }

    /**
     * length getter method
     * @returns length of type number from lengthSub$
     */

    get length(): number {
        return this.lengthSub$.value;
    }

    /**
     * length setter method
     * @param value length of type number
     */
    set length(value: number) {
        this.lengthSub$.next(value);
    }
    @Input() data$: Observable<unknown[]>;
    @Input() itemPerPageLabel?: string;
    @Input() item?: string;
    @ViewChild(MatPaginator, { static: true }) matPaginator: MatPaginator;
    totalItems$: Observable<number>;
    pageNumberControl: FormControl = new FormControl(1);
    pageSizeOption = AppSettings.pageSizeOptions;
    totalPages$: Observable<number>;
    private readonly dataSubject$: BehaviorSubject<unknown[]> = new BehaviorSubject<unknown[]>([]);
    private readonly eventSubject$: BehaviorSubject<PageEvent> = new BehaviorSubject({
        pageIndex: 0,
        pageSize: 15,
        length: 0,
    });
    private readonly pageIndexSubject$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    pageIndex$: Observable<number> = this.pageIndexSubject$.asObservable();
    private readonly pageIndexSub$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private readonly pageSizeSub$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private readonly lengthSub$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.customerList.paginator.of"]);

    constructor(
        protected readonly intl: MatPaginatorIntl,
        protected readonly changeDetectorRef: ChangeDetectorRef,
        private readonly language: LanguageService,
    ) {
        super(intl, changeDetectorRef);
    }

    /**
     * To get the custom range label for paginator
     * @param page page number
     * @param pageSize rows per page
     * @param length total number of rows
     * @return paginator custom range label of type string
     */
    getRangeLabel = (page: number, pageSize: number, length: number) => {
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
        const of = this.languageStrings["primary.portal.customerList.paginator.of"];
        const item = this.item;
        return `${startIndex + 1} - ${endIndex} ${of} ${length} ${item}`;
    };
    /**
     * In ngOnInit
     * Used to calculate totalItems$ in the data list which helps to calculate the totalPages$ considering the pageSizeOption
     * Also Initially set the pageSizeOption.
     * valueChanges used to handle Input field pageEvent.
     * Handling pageEvent as well as emitting the pageEvent in this function.
     */
    ngOnInit(): void {
        super.ngOnInit();
        // calling getTotalItem function with paramter of type observable and checking whether observable empty or not
        this.getTotalItems(this.data$ ? this.data$ : this.dataSubject$.asObservable());

        // By default items per page is set to the first available option.
        // eslint-disable-next-line no-underscore-dangle
        this.matPaginator._changePageSize(AppSettings.pageSizeOptions[0]);
        // If itemPerPageLabel is available then replace the default item per page label
        if (this.itemPerPageLabel) {
            // eslint-disable-next-line no-underscore-dangle
            this.matPaginator._intl.itemsPerPageLabel = this.itemPerPageLabel;
        }
        // If item for range Label is available then replace the default range label
        if (this.item) {
            // eslint-disable-next-line no-underscore-dangle
            this.matPaginator._intl.getRangeLabel = this.getRangeLabel;
        }

        // Whenever the matPaginator event happened, event is emitted
        this.matPaginator.page
            .pipe(
                tap((event) => {
                    this.pageNumberControl.setValue(event.pageIndex + 1); // Used to set the input field value
                    this.eventSubject$.next(event);
                }),
                takeUntil(this.unsubscribe$), // Take the value until it need otherwise unsubscribe the observable
            )
            .subscribe();

        this.initPageNumberValueChange(this.pageNumberControl).subscribe();

        // Used to calculate the total number of pages
        this.totalPages$ = combineLatest(this.eventSubject$.asObservable(), this.totalItems$).pipe(
            map(([subjectEvent, totalItems]) =>
                totalItems % subjectEvent.pageSize === 0
                    ? Math.floor(totalItems / subjectEvent.pageSize)
                    : Math.floor(totalItems / subjectEvent.pageSize) + 1,
            ),

            shareReplay(1),
        );
    }

    /**
     * This function is used when pageNumberControl value changes.
     * It update the pageEvent and emit it on input value change
     * @param formControl  of type FormControl passed to function in order to detect and calculate input value change
     * @returns observable of type number or [number,pageEvent]
     */
    initPageNumberValueChange(formControl: FormControl): Observable<number | [number, PageEvent]> {
        return formControl.valueChanges.pipe(
            debounceTime(DEBOUNCE_TIME_VALUE),
            // Check wither pageIndex is not null and grater than 0
            filter((pageIndex) => pageIndex && Number(pageIndex) > 0 && Number(pageIndex) < this.matPaginator.getNumberOfPages() + 1),
            map((pageIndex) => Number(pageIndex)), // Map it to the pageIndex
            withLatestFrom(this.eventSubject$.asObservable()), // Take last updated pageIndex from eventSubject$ observable
            tap(([pageIndexValue, lastPageEvent]) => {
                lastPageEvent.previousPageIndex = lastPageEvent.pageIndex; // setting the previous index
                lastPageEvent.pageIndex = pageIndexValue - 1; // Update the lastPageEvent with the latest PageIndex
                this.pageIndexSubject$.next(Number(pageIndexValue) - 1); // Assigned updated pageIndex in order to display it
                this.page.emit(lastPageEvent); // Emit the page Event to the source component
                this.eventSubject$.next(lastPageEvent);
            }),
            takeUntil(this.unsubscribe$), // Take the value until it needed otherwise destroy/make as complete  observable
        );
    }

    /**
     * Used to calculate the totalItems$ using provided observable
     * @param resultData$ static data observable of unknown type.
     */
    getTotalItems(resultData$: Observable<unknown[]>): void {
        this.totalItems$ = resultData$.pipe(
            filter((list) => Boolean(list)), // Used to check whether list empty of not
            map((list) => list.length), // Calculating the number of item in the list
            tap((length) => {
                this.matPaginator.length = length;
            }),
            shareReplay(1),
        );
    }

    /**
     * Used to initialize the updated paginator after view is initialized
     */
    ngAfterViewInit(): void {
        // Setting the pageSize,PageIndex,length
        this.page.subscribe((event) => {
            this.pageSize = event.pageSize;
            this.pageIndex = event.pageIndex;
            this.length = event.length;
            takeUntil(this.unsubscribe$);
        });

        // Used to emit the page event
        this.eventSubject$.asObservable().subscribe((event) => {
            this.page.emit(event);
            takeUntil(this.unsubscribe$);
        });
    }

    /**
     *  Destroy used to mark as complete (unsubscribe) the observable when no longer needed.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        super.ngOnDestroy();
    }
}
