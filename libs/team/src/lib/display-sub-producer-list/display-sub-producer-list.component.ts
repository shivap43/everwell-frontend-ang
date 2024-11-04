import { Component, OnInit, ViewChild, AfterContentInit, ElementRef, OnDestroy } from "@angular/core";
import { UserService } from "@empowered/user";
import { ProducerService } from "@empowered/api";
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

import { SetIsSubOrdinates, UtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { AppSettings, ProducerCredential } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { SubProducerInfoComponent } from "../sub-producer-info/sub-producer-info.component";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-display-sub-producer-list",
    templateUrl: "./display-sub-producer-list.component.html",
    styleUrls: ["./display-sub-producer-list.component.scss"],
})
export class DisplaySubProducerListComponent implements OnInit, AfterContentInit, OnDestroy {
    @ViewChild("input") matInput;
    displayedColumns: string[] = ["name", "email", "title", "reportsToName", "wNO", "manage"];
    dataSource;

    searchFlag = false;
    noResultFoundFlag = false;
    cred: any;
    filterClassNames = {
        status: ["list-grid-filter", "filter-producer-status"],
        renewal: ["list-grid-filter", "filter-renewal"],
        state: ["list-grid-filter", "filter-state"],
        employeeCount: ["list-grid-filter", "filter-employeeCount"],
    };
    producerSearchData: any[];
    subordinateList: any;
    prodList: any[];
    reportsToArr: any;
    dataL: boolean;
    dataProd: any[];
    subordinateRoles = [
        { value: "directReports", option: "My direct reports" },
        { value: "allReports", option: "All" },
    ];
    @ViewChild("subordinatesFilterDropdown", { static: true }) subordinatesFilterDropdown: MatSelect;
    pageSizeOption: any;
    optionOnClick: any;
    subordinateListLength: number;
    zeroConstant = 0;
    resultantData: any[];
    resultantDataLength: number;
    params: any;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    filterFlag = true;
    pageNumberControl: FormControl;
    pageEventSubscription: Subscription;
    showTable = false;
    filterForm: FormGroup;
    searchDropdownFlag = false;
    activeCol: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.subproducerList.searchProducers",
        "primary.portal.subproducerList.producernameWriting",
        "primary.portal.subproducerList.name",
        "primary.portal.subproducerList.writing",
        "primary.portal.subproducerList.filters",
        "primary.portal.subproducerList.subordinants",
        "primary.portal.subproducerList.apply",
        "primary.portal.subproducerList.mydirectReports",
        "primary.portal.subproducerList.all",
        "primary.portal.subproducerList.email",
        "primary.portal.subproducerList.title",
        "primary.portal.subproducerList.reportsTo",
        "primary.portal.subproducerList.writingNumbers",
        "primary.portal.subproducerList.manage",
        "primary.portal.subproducerList.viewproducerInfo",
        "primary.portal.subproducerList.editProfile",
        "primary.portal.subproducerList.page",
        "primary.portal.subproducerList.noResultFound",
        "primary.portal.subproducerList.team",
        "primary.portal.subproducerList.of",
        "primary.portal.subproducerList.showing",
        "primary.portal.subproducerList.results",
        "primary.portal.subproducerList.thresholdWarning",
        "primary.portal.common.moreFilter",
        "primary.portal.common.info.icon",
    ]);
    noOfPages: number;
    searchInputEventTargetObj: any;
    searchInput: string;
    searchForm: FormGroup;
    minimumSearchLength = 3;
    searchTerm: string;
    searchTermOnEnter: string;
    isSpinnerLoading = false;
    threshold = false;
    thresholdSize = 1000;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly producerService: ProducerService,
        private readonly fb: FormBuilder,
        private readonly elementRef: ElementRef,
        private readonly utilService: UtilService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {}

    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.pageNumberControl = this.fb.control(1);
        this.params = {
            filter: "",
            search: "",
            property: "",
            page: "1",
            size: "1000",
            value: "",
            supervisorProducerId: "",
        };
        this.pageSizeOption = AppSettings.pageSizeOptions;
        this.producerService.updateSubProducerList(true);
        this.searchForm = this.fb.group({
            searchInput: "",
        });
        this.filterForm = this.fb.group({
            subordinatesFilter: ["allReports"],
        });
        this.producerService.isUpdated.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (data) => {
                if (data) {
                    this.getSubProducerList();
                }
            },
            () => {},
            () => {},
        );
    }

    getSubProducerList(searchedInput?: string, filterInput?: any): void {
        this.cred = this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.params["supervisorProducerId"] = credential.producerId;
            if (this.threshold && searchedInput) {
                this.params["search"] = searchedInput;
            }
            if (this.threshold && filterInput) {
                this.params["filter"] = filterInput;
            }
        });

        this.producerService
            .producerSearch(this.params)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.threshold = response.totalElements >= this.thresholdSize ? true : false;
                this.dataProd = response.content;
                this.isSpinnerLoading = false;
                if (response.content.length === 0) {
                    this.dataL = false;
                } else {
                    this.dataL = true;
                }
                this.store.dispatch(new SetIsSubOrdinates(this.dataL));

                this.dataProd.forEach((producer) => {
                    this.reportsToArr = producer.reportsTo.name.split(" ");
                    producer.name = producer.name.lastName + "," + producer.name.firstName;
                    producer.reportsTo.name = this.reportsToArr.pop() + " " + this.reportsToArr.pop();
                    producer.reportsToName = producer.reportsTo.name;
                    producer.wNO = producer.writingNumbers.map((writingNumber) => writingNumber.number).join(", ");
                });
                this.prodList = this.dataProd;
                this.prodList.forEach((prod) => {
                    const prodName = prod.name;
                    prod.name = prodName.toLowerCase();
                });
                this.prodList.sort((a, b) => (a.name > b.name ? 1 : -1));
                this.dataProd = this.prodList;
                this.subordinateList = this.utilService.copy(this.dataProd);
                this.dataSource = new MatTableDataSource(this.dataProd);
                this.showTable = true;
                this.loadPaginator();
            });
    }
    /**
     * loads Paginator
     */
    loadPaginator(): void {
        if (this.showTable) {
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            if (this.paginator && this.dataSource.paginator) {
                this.noOfPages = this.paginator.getNumberOfPages();
            }
        }
        if (this.paginator) {
            this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
        }
    }
    /**
     * ng life cycle hook - will execute after content is loaded
     */
    ngAfterContentInit(): void {
        this.loadPaginator();
    }

    closeSubProducerDropdown(): void {
        this.searchDropdownFlag = false;
    }

    searchSubProducer(searchValue: string): void {
        this.searchTerm = searchValue;
        this.searchTermOnEnter = searchValue;
        if (!this.filterFlag && !this.threshold) {
            this.dataSource.data = this.resultantData;
        } else if (this.threshold && searchValue.length > 2) {
            this.getSubProducerList(searchValue, null);
        } else {
            this.dataSource.data = this.subordinateList;
        }
        this.producerSearchData = [];
        if (searchValue.indexOf(":") > -1) {
            const property = searchValue.substring(0, searchValue.indexOf(":"));
            const value = searchValue.substring(searchValue.indexOf(":") + 2, searchValue.length);
            if (value.length >= this.minimumSearchLength && value) {
                this.searchTerm = value;
            } else {
                this.searchTerm = "";
            }
            this.searchTermOnEnter = value;
            this.filterByIdName(value, property);
            this.searchDropdownFlag = false;
        } else {
            this.dataSource.data.forEach((producer) => {
                if (producer.name.toLowerCase().includes(searchValue.toLowerCase())) {
                    this.producerSearchData.push(producer);
                } else {
                    producer.writingNumbers.filter((wn) => {
                        if (wn.number.toLowerCase().includes(searchValue.toLowerCase())) {
                            this.producerSearchData.push(producer);
                        }
                    });
                }
            });
            this.dataSource.data = this.producerSearchData;
        }
        this.noResultFoundFlag = this.producerSearchData.length < 1 ? true : false;
    }

    filterApply(): void {
        this.resultantData = [];
        this.optionOnClick = this.filterForm.controls.subordinatesFilter.value;
        if (!(this.optionOnClick === this.subordinateRoles[this.zeroConstant].value) && this.searchFlag) {
            this.resultantData = this.subordinateList;
            this.searchSubProducer(this.searchTerm);
        }
        if (this.searchFlag && this.producerSearchData.length > 0 && !this.threshold) {
            this.dataSource.data = this.producerSearchData;
        } else if (this.threshold && !this.searchFlag && this.optionOnClick === this.subordinateRoles[this.zeroConstant].value) {
            this.getSubProducerList("", this.subordinateRoles[this.zeroConstant]);
        } else if (this.threshold && this.optionOnClick === this.subordinateRoles[this.zeroConstant].value) {
            this.getSubProducerList(this.searchTerm, this.subordinateRoles[this.zeroConstant]);
        } else if (this.searchFlag && this.producerSearchData.length === 0) {
            this.dataSource.data = [];
        } else {
            this.dataSource.data = this.subordinateList;
        }
        if (this.optionOnClick === this.subordinateRoles[this.zeroConstant].value) {
            this.filterFlag = false;
            this.subordinateListLength = this.zeroConstant;
            this.resultantDataLength = this.zeroConstant;

            this.dataSource.data.forEach((resp) => {
                if (resp.reportsTo.producerId === this.params["supervisorProducerId"]) {
                    this.resultantData[this.resultantDataLength] = resp;
                    this.resultantDataLength++;
                }
                this.subordinateListLength++;
            });
        } else {
            this.filterFlag = true;
            this.resultantData = this.dataSource.data;
        }
        this.dataSource.data = this.resultantData;
        this.noResultFoundFlag = this.dataSource.data.length < 1 ? true : false;
        this.subordinatesFilterDropdown.close();
    }
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > this.zeroConstant && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.noOfPages = this.paginator.getNumberOfPages();
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }
    sortData(event: any): void {
        this.activeCol = this.threshold ? event.active : event.inactive;
    }
    filterByIdName(toSearch: any, value: string): void {
        this.producerSearchData = [];
        this.searchFlag = true;
        if (!this.filterFlag) {
            this.dataSource.data = this.resultantData;
        } else {
            this.dataSource.data = this.subordinateList;
        }
        if (value === "name") {
            this.dataSource.data.forEach((producer) => {
                if (producer.name.toLowerCase().includes(toSearch.toLowerCase())) {
                    this.producerSearchData.push(producer);
                }
            });
        } else if (value === "wno") {
            this.dataSource.data.forEach((producer) => {
                producer.writingNumbers.filter((wn) => {
                    if (wn.number.toLowerCase().includes(toSearch.toLowerCase())) {
                        this.producerSearchData.push(producer);
                    }
                });
            });
        }
        this.noResultFoundFlag = this.producerSearchData.length < 1 ? true : false;
        this.dataSource.data = this.producerSearchData;
        this.searchDropdownFlag = false;
        if (toSearch && value) {
            this.searchForm.controls["searchInput"].setValue(value.trim() + ": " + toSearch);
        }
    }
    checkInput(event: any): void {
        const temp = event.value;
        if (temp.length <= 2) {
            if (this.resultantData && this.resultantData.length === 0) {
                if (!this.filterFlag) {
                    this.searchFlag = false;
                } else {
                    this.searchFlag = true;
                }
            } else {
                this.searchFlag = false;
            }
            this.filterApply();

            this.searchDropdownFlag = false;
        } else if (temp.length > 2) {
            this.searchFlag = true;
            this.searchDropdownFlag = true;
            this.searchSubProducer(temp);
        }
    }
    clickOutsideElement(event: any): void {
        event.stopPropagation();
        if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj) {
            this.searchDropdownFlag = false;
        }
    }
    searchInputEvent(event: any): void {
        this.searchInputEventTargetObj = event.target;
    }

    openProducerInfo(element: any): void {
        this.empoweredModalService.openDialog(SubProducerInfoComponent, {
            data: {
                producerInfo: element,
            },
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
export interface PeriodicElement {
    name: string;
    email: string;
    title: string;
    reportsToName: string;
    wNO: number;
    manage: string;
}
