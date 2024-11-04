import { TitleCasePipe } from "@angular/common";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import {
    PendedBusinessService,
    PendedBusinessAccount,
    PendedBusinessLevel,
    PendedBusinessByLevel,
    PendedBusinessByType,
} from "@empowered/api";
import { CompanyCode, ProducerDetails } from "@empowered/constants";
import { Observable, of, Subject } from "rxjs";
import { take, finalize, catchError, switchMap, takeUntil, tap } from "rxjs/operators";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";

enum ViewDepth {
    BY_PRODUCERS,
    BY_PRODUCER,
    BY_ACCOUNT,
}

@Component({
    selector: "empowered-producer-tab",
    templateUrl: "./producer-tab.component.html",
    styleUrls: ["./producer-tab.component.scss"],
})
export class ProducerTabComponent implements OnInit, OnDestroy {
    ViewDepthEnum = ViewDepth;
    showGroupDetails: boolean;
    languageStrings: Record<string, string>;
    isSpinnerLoading: boolean;
    accountData: PendedBusinessAccount[];
    producerName: string;
    currentViewDepth: number;
    groupDetailsData: PendedBusinessByType[];
    selectedAccountNumber: string;
    selectedAccountName: string;
    @Input() level: PendedBusinessLevel;
    data: PendedBusinessLevel[];
    companyCodeValue = CompanyCode.US;
    linkText: string;
    headerTitle: string;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly langService: LanguageService,
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly titleCasePipe: TitleCasePipe,
    ) {}

    ngOnInit(): void {
        this.currentViewDepth = ViewDepth.BY_PRODUCERS;
        this.fetchLanguageData();
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessByLevel(this.level, producer && producer.id)
                        .pipe(catchError((error) => of([]))),
                ),
                takeUntil(this.unsub$),
            )
            .subscribe((data) => {
                this.isSpinnerLoading = false;
                this.data = data as PendedBusinessLevel[];
            });
    }
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.backTo",
            "primary.portal.pendedBusiness.producerApps.header",
            "primary.portal.pendedBusiness.producer.dsc",
            "primary.portal.pendedBusiness.producer.rsc",
        ]);
    }
    callApi(endPoint: Observable<any>): Observable<any> {
        this.isSpinnerLoading = true;
        return endPoint.pipe(
            take(1),
            finalize(() => (this.isSpinnerLoading = false)),
            catchError((error) => of([])),
        );
    }
    goBack(): void {
        this.currentViewDepth = this.currentViewDepth - 1;
        this.updateLinkandTitle();
    }
    onWritingNumberClick(obj: PendedBusinessByLevel): void {
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessAccountList(CompanyCode.ALL, obj.writingNumber, producer && producer.id)
                        .pipe(catchError((error) => of([]))),
                ),
                takeUntil(this.unsub$),
            )
            .subscribe((data) => {
                this.isSpinnerLoading = false;
                this.accountData = data;
                this.producerName = obj.associateName;
                this.currentViewDepth = ViewDepth.BY_PRODUCER;
                this.updateLinkandTitle();
            });
    }
    updateLinkandTitle(): void {
        const pendedBussinessByLevel =
            this.languageStrings[
                this.level === PendedBusinessLevel.PRODUCER
                    ? "primary.portal.pendedBusiness.producerApps.header"
                    : `primary.portal.pendedBusiness.producer.${this.level.toLowerCase()}`
            ];
        const titleWithProducerName = `${pendedBussinessByLevel} - ${this.titleCasePipe.transform(this.producerName)}`;
        this.linkText = this.currentViewDepth === ViewDepth.BY_PRODUCER ? pendedBussinessByLevel : titleWithProducerName;
        this.headerTitle = titleWithProducerName;
    }
    onAccountNumberClick(account: PendedBusinessAccount): void {
        if (account.state.toUpperCase() === "NY") {
            this.companyCodeValue = CompanyCode.NY;
        }
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessForAccount(account.accountNumber, this.companyCodeValue, producer && producer.id)
                        .pipe(catchError((error) => of([]))),
                ),
                takeUntil(this.unsub$),
            )
            .subscribe((data) => {
                this.isSpinnerLoading = false;
                this.groupDetailsData = data;
                this.selectedAccountNumber = account.accountNumber;
                this.selectedAccountName = account.accountName;
                this.currentViewDepth = ViewDepth.BY_ACCOUNT;
                this.updateLinkandTitle();
            });
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
