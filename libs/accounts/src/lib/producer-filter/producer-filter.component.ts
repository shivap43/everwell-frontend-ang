import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { producersData, ProducerService, AdminService, SearchProducer } from "@empowered/api";
import { Store } from "@ngxs/store";
import { UserPermissionList, Admin } from "@empowered/constants";
import { UserService } from "@empowered/user";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Observable, Subscription } from "rxjs";
import { startWith, mapTo } from "rxjs/operators";
import { AccountsService } from "@empowered/common-services";
import { ProdData, ProducerCredential } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { AccountListState, SharedState, UtilService } from "@empowered/ngxs-store";

const MIN_SEARCH_CHAR_COUNT = 3;

@Component({
    selector: "empowered-producer-filter",
    templateUrl: "./producer-filter.component.html",
    styleUrls: ["./producer-filter.component.scss"],
})
export class ProducerFilterComponent implements OnInit, OnDestroy {
    @ViewChild("search") searchField: ElementRef;
    accountsData: any;
    producerData;
    subscriptions: Subscription[] = [];
    filterOptionSelected;
    searchFlag = false;
    searchControl: string;
    MemberInfo: ProducerCredential;
    arr = [];
    oneString = "1";
    twoString = "2";
    threeString = "3";
    fourString = "4";
    fiveString = "5";
    options = [];
    @ViewChild(MatAutocompleteTrigger, { read: MatAutocompleteTrigger }) trigger: MatAutocompleteTrigger;
    searchForm: FormGroup = this.fb.group({
        searchControl: [""],
    });
    filteredOptions: Observable<string[]>;
    listFlag = false;
    producerSearchList: any;
    accountDataSubscription: Subscription;
    producerSearchSubscription: Subscription;
    producerDataSubscription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.producerFilter.show",
        "primary.portal.producerFilter.searchbyProducer",
        "primary.portal.producerFilter.clear",
        "primary.portal.producerFilter.apply",
        "primary.portal.producerFilter.reset",
        "primary.portal.producerFilter.noAccessToAccounts",
        "primary.portal.producerFilter.producernotFound",
        "primary.portal.common.search",
    ]);
    selectedSubproducer = "";
    applyFlag = true;
    wnFlag = false;
    nameEmailString = "";
    producerIds: number[] = [];
    params;
    wnOfProducer: Admin;
    hasPermission = false;
    deniedPermission = false;
    accessPermission = false;
    three = 3;
    two = 2;
    five = 5;
    filteredValue: string[];
    producerList$: Observable<any[]>;
    producerSelected = false;
    searchButton = true;
    showList = false;
    memberName: string;
    showMyTeamsAccountSearch$: Observable<boolean> = this.accountsService.isProducerFilter;

    constructor(
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly fb: FormBuilder,
        private readonly accountsService: AccountsService,
        private readonly producerService: ProducerService,
        private readonly language: LanguageService,
        private readonly adminService: AdminService,
        private readonly utilService: UtilService,
    ) {}

    /**
     * Function to execute logic on component initialization
     * such as few required service calls, filters etc.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.userService.credential$.subscribe((response) => {
                this.MemberInfo = response as ProducerCredential;
                this.memberName = `${this.MemberInfo.name.firstName.trim()} ${this.MemberInfo.name.lastName.trim()}`;
            }),
        );
        this.subscriptions.push(
            this.store.select(SharedState.hasPermission(UserPermissionList.ACCOUNTLIST_ROLE_20)).subscribe((response) => {
                this.hasPermission = response ? true : false;
            }),
        );
        this.params = {
            supervisorProducerId: this.MemberInfo.producerId,
        };
        this.filterOptionSelected = this.oneString;
        this.producerData = producersData.filter((item) => item.value !== this.five);
        this.accountsData = this.store.selectSnapshot(AccountListState.getAccountList);
        this.producerSearchList = this.accountsService.getproducerSearchList();
        if (!this.producerSearchList) {
            this.producerSearchSubscription = this.producerService.producerSearch(this.params).subscribe((resp) => {
                if (resp) {
                    this.producerSearchList = resp;
                    this.accountsService.setProductSearchList(resp);
                    this.filterProducerData();
                }
            });
        }
        this.accountDataSubscription = this.accountsService.currentProducer.subscribe((currentProducer: ProdData) => {
            this.filterOptionSelected = currentProducer.filterByProducer;
            if (currentProducer.filterByProducer === this.twoString || currentProducer.filterByProducer === this.fiveString) {
                this.searchForm.controls.searchControl.setValue(currentProducer.producerName);
                this.searchFlag = true;
            }
        });
        this.wnOfProducer = this.accountsService.getWritingNumberOfProducer();
        if (!this.wnOfProducer) {
            this.producerDataSubscription = this.adminService.getAdmin(this.MemberInfo.producerId, "reportsToId").subscribe((resp) => {
                this.accountsService.setWritingNumberOfProducer(resp);
                this.wnOfProducer = resp;
            });
        }
    }
    filterProducerData(): void {
        if (this.producerSearchList) {
            if (!this.producerSelected) {
                this.options = [];
            }
            this.producerSearchList.content.forEach((ele) => {
                const wn = [];
                ele.writingNumbers.forEach((el) => {
                    wn.push(el.number);
                });
                this.options.push({
                    name: ele.name.firstName + " " + ele.name.lastName,
                    email: ele.email,
                    wn: wn,
                });
            });
        }
    }
    prodSelected(eve: any): void {
        if (eve.value === this.oneString) {
            this.searchFlag = false;
            this.applyFlag = true;
            this.filterOptionSelected = this.oneString;
            this.searchForm.controls.searchControl.setValue("");
        } else if (eve.value === this.threeString) {
            this.searchFlag = false;
            this.applyFlag = true;
            this.filterOptionSelected = this.threeString;
            this.searchForm.controls.searchControl.setValue("");
        } else if (eve.value === this.fourString) {
            this.searchFlag = false;
            this.applyFlag = true;
            this.filterOptionSelected = this.fourString;
            this.searchForm.controls.searchControl.setValue("");
        } else if (eve.value === this.fiveString) {
            this.filterOptionSelected = this.fiveString;
            this.searchFlag = true;
            this.applyFlag = false;
        } else {
            this.filterOptionSelected = this.twoString;
            this.searchFlag = true;
            this.applyFlag = false;
        }
    }
    /**
     * enable or disable to search button based on the length of the string
     * @param event input string to be searched
     */
    disableApply(event: string): void {
        this.producerSelected = false;
        if (event.length >= MIN_SEARCH_CHAR_COUNT) {
            this.searchButton = false;
        } else {
            this.showList = false;
        }
        this.applyFlag = true;
        this.filterProducerData();
        this.filteredValue = this.filter(event);
        if (!this.filteredValue.find((v) => v["name"] === event)) {
            this.applyFlag = false;
        }
        if (event.length === 0) {
            this.applyFlag = false;
        }
    }
    /**
     * filter the subordinates and set errors based on the value
     * @param value input string to be searched
     * @returns string array of filtered subordinates
     */
    private filter(value: string): string[] {
        const filterValue = value.toLowerCase();
        let filteredStates = [];
        const temp = [];
        const uniq = {};
        if (value.length >= MIN_SEARCH_CHAR_COUNT) {
            this.options.forEach((option) => {
                if (option.name.toLowerCase().includes(filterValue)) {
                    temp.push(option);
                } else {
                    option.wn.filter((el) => {
                        if (el.toLowerCase().includes(filterValue)) {
                            this.wnFlag = true;
                            temp.push(option);
                        }
                    });
                }
            });
            if (!this.wnFlag) {
                filteredStates = temp;
            } else {
                filteredStates = temp.filter((obj) => !uniq[obj.email] && (uniq[obj.email] = true));
            }
            if (filteredStates.length <= 0) {
                const params = {
                    search: value,
                };
                this.subscriptions.push(
                    this.producerService.producerSearch(params).subscribe((resp) => {
                        if (this.searchForm.controls.searchControl.value === value) {
                            if (resp.content.length > 0) {
                                this.deniedPermission = true;
                                this.accessPermission = false;
                                this.searchForm.controls.searchControl.setErrors({ incorrect: true });
                            } else {
                                this.accessPermission = true;
                                this.deniedPermission = false;
                                this.searchForm.controls.searchControl.setErrors({ incorrect: true });
                            }
                        }
                    }),
                );
            }
        } else {
            filteredStates = [];
        }
        if (this.showList) {
            this.filteredOptions = this.searchForm.controls.searchControl.valueChanges.pipe(startWith(""), mapTo(filteredStates));
        }
        return filteredStates;
    }
    /**
     * Filter based on the filter option selected
     */
    filterApply(): void {
        let prod = {};
        if (this.searchFlag === false) {
            if (this.filterOptionSelected === this.threeString) {
                prod = {
                    producerName: "Unassigned",
                    filterByProducer: this.filterOptionSelected,
                    producerIdFilter: [],
                };
            } else if (this.filterOptionSelected === this.fourString) {
                prod = {
                    producerName: "",
                    filterByProducer: this.filterOptionSelected,
                    producerIdFilter: [],
                };
            } else if (this.filterOptionSelected === this.oneString) {
                const currentProdWnNumbers: number[] = [];
                let currentProd: SearchProducer | ProducerCredential;
                if (this.store.selectSnapshot(AccountListState.getCurrentProducer)) {
                    currentProd = this.store.selectSnapshot(AccountListState.getCurrentProducer);
                    currentProdWnNumbers.push(currentProd.id);
                } else {
                    currentProd = this.MemberInfo;
                    currentProdWnNumbers.push(currentProd.producerId);
                }
                this.subscriptions.push(
                    this.accountsService.isAnyAccViewed.subscribe((isViewed) => {
                        if (isViewed) {
                            prod = {
                                producerName: `${currentProd.name.firstName.trim()} ${currentProd.name.lastName.trim()}`,
                                filterByProducer: this.filterOptionSelected,
                                producerIdFilter: currentProdWnNumbers,
                            };
                        } else {
                            this.producerIds.push(this.wnOfProducer.id);
                            prod = {
                                producerName: this.memberName,
                                filterByProducer: this.filterOptionSelected,
                                producerIdFilter: this.producerIds,
                            };
                        }
                    }),
                );
            } else {
                this.producerIds.push(this.wnOfProducer.id);
                prod = {
                    producerName: this.memberName,
                    filterByProducer: this.filterOptionSelected,
                    producerIdFilter: this.producerIds,
                };
            }
        } else {
            prod = {
                producerName: this.searchForm.controls.searchControl.value,
                filterByProducer: this.filterOptionSelected,
                producerIdFilter: this.producerIds,
            };
        }
        this.accountsService.changeSelectedProducer(this.utilService.copy(prod));
        const overlayClose = {
            isOpen: true,
        };
        this.accountsService.closeExpandedOverlayProducer(this.utilService.copy(overlayClose));
    }
    /**
     * reset the producer filter based on the writing numbers of the current producer
     */
    resetVal(): void {
        if (!this.wnOfProducer) {
            this.producerDataSubscription = this.adminService.getAdmin(this.MemberInfo.producerId, "reportsToId").subscribe((resp) => {
                this.wnOfProducer = this.utilService.copy(resp);
                this.applyReset();
            });
        } else {
            this.applyReset();
        }
    }
    /**
     * Resets the producer filter to the default option i.e. 'My Accounts'
     */
    applyReset(): void {
        let prod = {};
        const currentProdWnNumbers: number[] = [];
        let currentProd: SearchProducer | ProducerCredential;
        if (this.store.selectSnapshot(AccountListState.getCurrentProducer)) {
            currentProd = this.store.selectSnapshot(AccountListState.getCurrentProducer);
            currentProdWnNumbers.push(currentProd.id);
        } else {
            currentProd = this.MemberInfo;
            currentProdWnNumbers.push(currentProd.producerId);
        }
        this.subscriptions.push(
            this.accountsService.isAnyAccViewed.subscribe((isViewed) => {
                if (isViewed) {
                    prod = {
                        producerName: `${currentProd.name.firstName.trim()} ${currentProd.name.lastName.trim()}`,
                        filterByProducer: this.oneString,
                        producerIdFilter: currentProdWnNumbers,
                    };
                } else {
                    this.producerIds.push(this.wnOfProducer.id);
                    prod = {
                        producerName: this.memberName,
                        filterByProducer: this.oneString,
                        producerIdFilter: this.producerIds,
                    };
                }
            }),
        );
        this.accountsService.changeSelectedProducer(this.utilService.copy(prod));
        const overlayClose = {
            isOpen: true,
        };
        this.accountsService.closeExpandedOverlayProducer(this.utilService.copy(overlayClose));
    }
    searchSpecificProducer(event: Event): void {
        this.showList = true;
        const searchValue = this.searchForm.controls["searchControl"].value;
        this.filter(searchValue);
        event.stopPropagation();
        this.trigger.openPanel();
        this.searchField.nativeElement.focus();
    }
    /**
     * fetch producer id of selected producer
     * @param event selected producer details
     */
    selectedProducerOption(event: { value: string; viewValue: string }): void {
        this.producerSelected = true;
        this.searchButton = true;
        this.showList = false;
        this.selectedSubproducer = event.value;
        this.nameEmailString = event.viewValue;
        const result = this.nameEmailString.split(this.selectedSubproducer).pop();
        if (this.producerSearchList) {
            this.producerSearchList.content.forEach((el) => {
                if (el.email === result) {
                    this.producerIds.push(el.id);
                }
            });
        }
        if (this.selectedSubproducer) {
            this.applyFlag = true;
        }
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
        if (this.accountDataSubscription) {
            this.accountDataSubscription.unsubscribe();
        }
        if (this.producerSearchSubscription) {
            this.producerSearchSubscription.unsubscribe();
        }
        if (this.producerDataSubscription) {
            this.producerDataSubscription.unsubscribe();
        }
    }
}
