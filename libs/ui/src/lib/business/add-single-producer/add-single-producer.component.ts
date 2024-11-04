import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Subscription } from "rxjs";
import { Component, OnInit, ViewChild, OnDestroy, Optional, Inject } from "@angular/core";
import { Store } from "@ngxs/store";
import { FormBuilder, FormGroup, FormControl } from "@angular/forms";
import { MatSort } from "@angular/material/sort";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { MatTabGroup } from "@angular/material/tabs";
import {
    AccountService,
    PRODUCER_GRID,
    ProducerService,
    SearchProducer,
    BenefitsOfferingService,
    StaticService,
    AccountInvitation,
} from "@empowered/api";
import { SafeHtml } from "@angular/platform-browser";
import { ClientErrorResponseCode, ROLE, CompanyCode, AppSettings } from "@empowered/constants";
import { UtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-add-single-producer",
    templateUrl: "./add-single-producer.component.html",
    styleUrls: ["./add-single-producer.component.scss"],
})
export class AddSingleProducerComponent implements OnInit, OnDestroy {
    @ViewChild("tabs") tabs: MatTabGroup;
    @ViewChild(MatSort) sort: MatSort;
    subscriber: Subscription[] = [];
    type: string;
    mpGroupId: number;
    configurations: any;
    SEARCH: "SEARCH";
    RECENT = "RECENT";
    STATE: "STATE";
    CARRIER = "CARRIER";
    navLinks: any[];
    SEARCH_PRODUCER = "";
    RECENT_PRODUCER = "";
    searchProducerForm: FormGroup;
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    producersList: SearchProducer[];
    recentProducersList: SearchProducer[];
    selectedProducerData: SearchProducer;
    benefitOfferingStatesData: any[];
    displayColumns: string[];
    displayedColumns: string[];
    dataSource: any;
    disableSearch: boolean;
    data: any[];
    step = 0;
    pageSize: number;
    pageNumber = 1;
    supervisonProducerId: number;
    isSpinnerLoading = false;
    addProducerStep2 = true;
    producerList: any[];
    splitProducerList: any = [];
    languageString: Record<string, string>;
    setInfo = "";
    loggedInProducerId: number;
    configCount: number;
    prodCount: number;
    CONFIG_STR = "group.producers.carrier_and_license_display.max_producers";
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    errorMessage: string;
    showErrorMessage = false;
    roleList: any;
    companyCode: string;
    isDirect: boolean;
    situs: any;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.addSingleProducer.assignProducer",
        "primary.portal.addSingleProducer.title.setWN",
        "primary.portal.commission.producer.single.addProducer",
        "primary.portal.addSingleProducer.closeModal",
        "primary.portal.addSingleProducer.infoIcon",
    ]);
    constructor(
        private readonly dialogRef: MatDialogRef<AddSingleProducerComponent>,
        private readonly store: Store,
        private readonly formBuilder: FormBuilder,
        private readonly accountService: AccountService,
        private readonly producerService: ProducerService,
        private readonly utilService: UtilService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: any,
        private readonly staticService: StaticService,
    ) {
        this.fetchlanguageValues();
    }

    ngOnInit(): void {
        this.pageSize = AppSettings.PAGE_SIZE_1000;
        this.producersList = [];
        this.recentProducersList = [];
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.mpGroupId = this.dialogData.mpGroupId;
        this.loggedInProducerId = this.dialogData.loggedInProducerId;
        this.roleList = this.dialogData.roleList;
        this.isDirect = this.dialogData.isDirect;
        this.situs = this.dialogData.situs;
        this.disableSearch = false;
        this.getCompanyCode();
        this.initializeSearchForm();
        this.getConfigurations();
        this.getBenefitOfferingStates();
        this.setLanguageStrings();
        this.navLinks = [
            { label: this.SEARCH_PRODUCER, id: 1, type: this.SEARCH },
            { label: this.RECENT_PRODUCER, id: 2, type: this.RECENT },
        ];
    }

    reloadData(): void {
        this.producersList = [];
        this.recentProducersList = [];
        this.type = this.SEARCH;
        this.initializeSearchForm();
        this.getBenefitOfferingStates();
        this.navLinks = [
            { label: this.SEARCH_PRODUCER, id: 1, type: this.SEARCH },
            { label: this.RECENT_PRODUCER, id: 2, type: this.RECENT },
        ];
    }
    getCompanyCode(): void {
        if (this.situs) {
            this.companyCode = this.situs
                ? this.situs.state.abbreviation === CompanyCode.NY
                    ? CompanyCode.NY
                    : CompanyCode.US
                : CompanyCode.US;
        }
    }

    onCancelClick(): void {
        this.dialogRef.close();
        this.reloadData();
    }

    showTab(id: any): void {
        this.step = id.index;
        this.isSpinnerLoading = true;
        if (id.index === 0) {
            this.type = this.navLinks[0].type;
            const formvalue = this.searchProducerForm.value;
            if (formvalue && formvalue.producerData && formvalue.producerData.serachProd !== "" && this.producersList.length > 0) {
                this.setMatDataSource(this.producersList);
            } else {
                this.isSpinnerLoading = false;
                this.dataSource = undefined;
            }
        } else {
            this.type = this.navLinks[1].type;
            this.fetchRecentProducers();
        }
    }

    initializeSearchForm(): void {
        this.searchProducerForm = this.formBuilder.group({
            producerData: this.formBuilder.group({
                serachProd: [""],
            }),
        });
    }

    search(form: any, valid: boolean): void {
        this.showErrorMessage = false;
        if (valid) {
            this.isSpinnerLoading = true;
            const queryStr = this.getQueryParamString(form);
            this.subscriber.push(
                this.producerService.producerSearch(queryStr).subscribe(
                    (value) => {
                        this.producersList = value.content;
                        this.prodCount = value.totalElements;
                        if (value.content && value.content.length !== 0) {
                            for (let prod of this.producersList) {
                                prod = this.getProducerExInfo(prod);
                            }
                        } else {
                            this.isSpinnerLoading = false;
                        }
                        this.isSpinnerLoading = false;
                        this.setMatDataSource(this.producersList);
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                        if (error) {
                            this.showErrorAlertMessage(error);
                        } else {
                            this.errorMessage = null;
                        }
                    },
                ),
            );
        }
    }

    getProducerExInfo(prod: any): any {
        prod.fullName = `${prod.name.lastName}, ${prod.name.firstName}`;
        prod.associatedProducer = prod.associatedProducer ? prod.associatedProducer : false;
        const arr =
            (this.isDirect
                ? prod.licenses
                : prod.licenses &&
                  prod.licenses.filter((license) =>
                      this.benefitOfferingStatesData.map((state) => state.abbreviation).includes(license.state.abbreviation),
                  )) || [];
        prod.intersectedState = arr;
        prod.states = this.getNotesTooltip(arr, this.STATE);
        prod.carriers = this.getNotesTooltip(prod.carrierAppointments, this.CARRIER);
        this.isSpinnerLoading = false;
        return prod;
    }

    getQueryParamString(form: any): any {
        const params = {};
        if (!this.isDirect) {
            params["associatedAccountId"] = this.mpGroupId;
        }
        params["size"] = this.pageSize;
        params["page"] = this.pageNumber;
        if (form.producerData.serachProd && form.producerData.serachProd !== "") {
            params["search"] = form.producerData.serachProd.toLowerCase();
        }
        return params;
    }

    /**
     * This function is for setting producers list in mat table datasource format.
     * @param filteredData filtered producers list
     */
    setMatDataSource(filteredData: SearchProducer[]): void {
        this.displayedColumns =
            this.prodCount > this.configCount
                ? [PRODUCER_GRID.NAME, PRODUCER_GRID.NPN, PRODUCER_GRID.MANAGE]
                : [PRODUCER_GRID.NAME, PRODUCER_GRID.STATES, PRODUCER_GRID.NPN, PRODUCER_GRID.MANAGE];
        const producerList = [...filteredData].sort((a, b) => (a.name.lastName.toLowerCase() > b.name.lastName.toLowerCase() ? 1 : -1));
        this.dataSource = new MatTableDataSource(producerList);
        this.data = this.dataSource.data;
        this.dataSource.sort = this.sort;
        this.isSpinnerLoading = false;
        this.subscriber.push(
            this.accountService.getAccountProducers(this.mpGroupId.toString()).subscribe((result) => {
                this.splitProducerList = [];
                result.forEach((element) => {
                    if (result) {
                        this.splitProducerList.push({
                            id: element.producer.id,
                            name: element.producer.name.firstName + " " + element.producer.name.lastName,
                            writingNumbers: element.producer.writingNumbers,
                        });
                    }
                });
            }),
        );
    }
    /**
     * return the tooltip based on the params
     * @param data carrier appointments or the states
     * @param type type of data to generate tooltip value
     * @returns the states/ carriers of the producer as SafeHtml
     */
    getNotesTooltip(data: any[], type: string): SafeHtml {
        let tooltipString: any;
        if (type === this.STATE && data && data.length > 0) {
            const stateArr = [];
            const title = this.languageString["primary.portal.commission.producer.single.table.availableState"];
            for (const stateData of data) {
                stateArr.push(stateData.state.abbreviation + ": " + stateData.number);
            }
            tooltipString = this.utilService.refactorTooltip(stateArr, title);
        } else if (type === this.CARRIER && data && data.length > 0) {
            tooltipString = this.utilService.refactorTooltip(
                Array.from(new Set(data.map((appointment) => appointment.carrier.name))),
                this.languageString["primary.portal.commission.producer.single.table.carriers"],
            );
        }
        return tooltipString;
    }

    fetchRecentProducers(): void {
        this.subscriber.push(
            this.producerService.getRecentlyInvitedProducers(this.loggedInProducerId.toString(), this.mpGroupId).subscribe((Response) => {
                this.recentProducersList = Response;
                if (Response && Response.length !== 0) {
                    for (let prod of this.recentProducersList) {
                        prod = this.getProducerExInfo(prod);
                    }
                } else {
                    this.isSpinnerLoading = false;
                }
                this.setMatDataSource(this.recentProducersList);
            }),
        );
    }
    addDirectProducer(producerData: SearchProducer): void {
        this.isSpinnerLoading = true;
        const inviteProducerObject: AccountInvitation = {
            invitedProducerIds: [producerData.id],
            message: " ",
        };
        this.subscriber.push(
            this.accountService.inviteProducer(inviteProducerObject, this.mpGroupId).subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    this.dialogRef.close(true);
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
    }

    /**
     * Function to navigate to next step and save selected producer details
     * @param producerData selected producer data
     */
    addProducer(producerData: SearchProducer): void {
        this.addProducerStep2 = !this.addProducerStep2;
        this.selectedProducerData = producerData;
        this.selectedProducerData.isUnauthorized = producerData.role === ROLE.NONAUTHORIZED_PRODUCER;
        this.setInfo = this.languageString["primary.portal.commission.producer.single.addSplit"].replace(
            "##PRODUCERNAME##",
            this.selectedProducerData.name.firstName,
        );
        if (this.roleList.length === 1) {
            this.setInfo = this.languageStrings["primary.portal.addSingleProducer.title.setWN"];
        }
        const isProdAlreadyAvailable = Boolean(this.splitProducerList.find((producer) => producer.id === producerData.id));
        if (!isProdAlreadyAvailable) {
            this.splitProducerList.push({
                id: producerData.id,
                name: producerData.name.firstName + " " + producerData.name.lastName,
                writingNumbers: producerData.writingNumbers,
            });
        }
    }

    getNoDataOnFilterErrorMessage(): string {
        if (this.step === 0) {
            return this.languageString["primary.portal.commission.producer.single.noResult"].replace(
                "##selectedFilter##",
                this.searchProducerForm.value.producerData.serachProd,
            );
        }
        return this.languageString["primary.portal.commission.producer.single.noResultText"];
    }

    goBackToStepTow(addProducerStep2: boolean): void {
        this.addProducerStep2 = addProducerStep2;
    }

    setLanguageStrings(): void {
        this.SEARCH_PRODUCER = this.languageString["primary.portal.commission.producer.single.tab.search"];
        this.RECENT_PRODUCER = this.languageString["primary.portal.commission.producer.single.tab.recent"];
    }
    /**
     * fetch BO states
     */
    getBenefitOfferingStates(): void {
        this.subscriber.push(
            this.benefitOfferingService.getBenefitOfferingSettings(this.mpGroupId).subscribe((Response) => {
                this.benefitOfferingStatesData = Response.states;
            }),
        );
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
     * Function is to show error alert massage based on API error status, code and detail field.
     * @param err error response from api
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        this.showErrorMessage = true;
        if (error.status === ClientErrorResponseCode.RESP_400 && error.message) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}`,
            );
        } else if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    fetchlanguageValues(): void {
        this.languageString = this.language.fetchPrimaryLanguageValues([
            "primary.portal.commission.producer.single.addSplit",
            "primary.portal.commission.producer.single.noResult",
            "primary.portal.commission.producer.single.tab.search",
            "primary.portal.commission.producer.single.tab.recent",
            "primary.portal.commission.producer.single.table.availableState",
            "primary.portal.commission.producer.single.table.carriers",
            "primary.portal.commission.producer.single.noResultText",
            "primary.portal.commission.producer.single.producerAlreadyAddedTooltip",
        ]);
    }
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
