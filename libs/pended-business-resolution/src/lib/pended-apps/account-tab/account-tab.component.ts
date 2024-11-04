import { Component, OnInit, OnDestroy } from "@angular/core";
import { PendedBusinessByType, PendedBusinessService, PendedBusinessAccount } from "@empowered/api";
import { CompanyCode, ProducerDetails } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Observable, of, Subject } from "rxjs";
import { catchError, switchMap, takeUntil, tap } from "rxjs/operators";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-account-tab",
    templateUrl: "./account-tab.component.html",
    styleUrls: ["./account-tab.component.scss"],
})
export class AccountTabComponent implements OnInit, OnDestroy {
    showGroupDetails: boolean;
    groupDetailsData: PendedBusinessByType[];
    selectedAccountNumber: string;
    selectedAccountName: string;
    languageStrings: Record<string, string>;
    isSpinnerLoading: boolean;
    data: PendedBusinessAccount[];
    companyCodeValue = CompanyCode.US;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(private readonly langService: LanguageService, private readonly pendedBusinessService: PendedBusinessService) {}

    ngOnInit(): void {
        this.showGroupDetails = false;
        this.fetchLanguageData();
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessAccountList(CompanyCode.ALL, null, producer && producer.id)
                        .pipe(catchError((error) => of([]))),
                ),

                takeUntil(this.unsub$),
            )
            .subscribe((data) => {
                this.isSpinnerLoading = false;
                this.data = data;
            });
    }
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.backTo",
            "primary.portal.pendedBusiness.accountApps.header",
        ]);
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
                this.showGroupDetails = true;
            });
    }
    onViewAccounts(): void {}
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
