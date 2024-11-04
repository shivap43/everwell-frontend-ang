import { Subject, Subscription } from "rxjs";
import { StaticService, AccountListService, FilterParameters, CallCenter, AccountService } from "@empowered/api";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { Router } from "@angular/router";
import { MatDialogRef } from "@angular/material/dialog";
import { AddGroup } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { ProducerCredential } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-call-center-form",
    templateUrl: "./call-center-form.component.html",
    styleUrls: ["./call-center-form.component.scss"],
})
export class CallCenterFormComponent implements OnInit, OnDestroy {
    isAccountSearchEmptyError: boolean;
    isProducerSearchEmptyError: boolean;
    title: string;
    currentCallCenterId: number;
    showAccountError = false;
    showProducerError = false;
    accountSearchResults: any[];
    producerSearchResults: any[];
    producerDisplayedColumns: string[] = ["name", "email", "accounts"];
    accountDisplayedColumns: string[] = ["Account name", "Account number", "Primary Producer"];
    userCallCenter: CallCenter;
    currentProducerId: number;
    searchValue = "";
    searchType = "account";
    invalidAccountNumber = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.title",
        "primary.portal.callCenter.subtitle",
        "primary.portal.callCenter.searchbyaccount",
        "primary.portal.callCenter.searchbyproducer",
        "primary.portal.callCenter.name",
        "primary.portal.callCenter.email",
        "primary.portal.callCenter.accounts",
        "primary.portal.common.add",
        "primary.portal.common.save",
        "primary.portal.callCenter.accountnamenumber",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.callCenter.searchValue",
        "primary.portal.common.search",
        "primary.portal.callCenter.showAccountError",
        "primary.portal.callCenter.invalidAccountNumber",
        "primary.portal.callCenter.showProducerError",
        "primary.portal.callCenter.isAccountSearchEmptyError",
        "primary.portal.callCenter.isProducerSearchEmptyError",
        "primary.portal.callCenter.accountName",
        "primary.portal.callCenter.accountNumber",
        "primary.portal.callCenter.primaryProducer",
    ]);
    getCallCenterSubscription: Subscription;
    listAccountSubscription: Subscription;
    getCallCenterWithAccInfoSubscription: Subscription;
    addCallCenterAgentToCallCenterAccountSubscription: Subscription;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly accountListService: AccountListService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly callCenterFormDialogRef: MatDialogRef<CallCenterFormComponent>,
    ) {}

    ngOnInit(): void {
        this.isAccountSearchEmptyError = false;
        this.isProducerSearchEmptyError = false;
        this.title = "Account name or number";
        this.accountSearchResults = [];
        this.producerSearchResults = [];
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            if (credential.producerId) {
                this.currentProducerId = credential.producerId;
            }
            if (credential.producerId && credential.callCenterId) {
                this.currentCallCenterId = credential.callCenterId;
                this.getCallCenterSubscription = this.staticService
                    .getCallCenter(credential.callCenterId)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((callCenter) => {
                        this.userCallCenter = callCenter;
                    });
            }
        });
    }

    submitSuccess(): void {
        this.accountSearchResults = [];
        this.producerSearchResults = [];
        this.isAccountSearchEmptyError = false;
        this.isProducerSearchEmptyError = false;
        this.showAccountError = false;
        this.showProducerError = false;
        this.invalidAccountNumber = false;
        if (this.searchType === "account") {
            const filterParams: FilterParameters = {
                filter: "",
                search: this.searchValue.trim(),
                property: "currentCallCenterId",
                page: "1",
                size: "1000",
                value: this.currentCallCenterId.toString(),
            };
            this.listAccountSubscription = this.accountListService
                .listAccounts(filterParams)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (results: any) => {
                        if (results.content.length) {
                            this.accountSearchResults = results.content;
                        } else {
                            this.isAccountSearchEmptyError = true;
                        }
                    },
                    (error) => (this.isAccountSearchEmptyError = true),
                );
        }
        if (this.searchType === "producer") {
            this.getCallCenterWithAccInfoSubscription = this.staticService
                .getCallCenterProducersWithAccountInfo(this.currentCallCenterId, this.searchValue.trim())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (results: any) => {
                        if (results.length) {
                            this.producerSearchResults = results;
                        } else {
                            this.isProducerSearchEmptyError = true;
                        }
                    },
                    (error) => (this.isProducerSearchEmptyError = true),
                );
        }
    }
    searchSubmit(): void {
        if (!this.searchValue.trim()) {
            this.accountSearchResults = [];
            this.producerSearchResults = [];
            this.isAccountSearchEmptyError = false;
            this.isProducerSearchEmptyError = false;
            this.invalidAccountNumber = false;
            if (this.searchType === "account") {
                this.showAccountError = true;
            } else if (this.searchType === "producer") {
                this.showProducerError = true;
            }
        } else if (this.searchType === "producer") {
            this.invalidAccountNumber = false;
            this.submitSuccess();
        } else if (this.searchType === "account" && (isNaN(+this.searchValue.trim()) || this.searchValue.trim().length === 5)) {
            this.invalidAccountNumber = false;
            this.submitSuccess();
        } else {
            this.isAccountSearchEmptyError = false;
            this.isProducerSearchEmptyError = false;
            this.invalidAccountNumber = true;
        }
    }
    /**
     * Function to add Account to call center agent and navigate to dashboard
     * @param element Account details
     * @param account producer details
     * @param type type of search  account or producer
     */
    addAccount(element: any, account: any, type: string): void {
        if (type === "account") {
            this.addCallCenterAgentToCallCenterAccountSubscription = this.accountService
                .addCallCenterAgentToCallCenterAccount(this.currentCallCenterId, this.currentProducerId, element.id)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.store.dispatch(new AddGroup(element));
                    this.callCenterFormDialogRef.close();
                    this.router.navigate(["/producer/payroll/" + element.id + "/dashboard"]);
                });
        }
        if (type === "producer") {
            this.addCallCenterAgentToCallCenterAccountSubscription = this.accountService
                .addCallCenterAgentToCallCenterAccount(this.currentCallCenterId, this.currentProducerId, account.id.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    const selectedAccount = element.accounts.find((response) => response.id === account.id);
                    this.store.dispatch(new AddGroup(selectedAccount));
                    this.callCenterFormDialogRef.close();
                    this.router.navigate(["/producer/payroll/" + account.id + "/dashboard"]);
                });
        }
    }
    reset(): void {
        this.showAccountError = false;
        this.showProducerError = false;
        this.isAccountSearchEmptyError = false;
        this.isProducerSearchEmptyError = false;
        this.invalidAccountNumber = false;
        this.accountSearchResults = [];
        this.producerSearchResults = [];
        if (this.searchType === "account") {
            this.title = "Account name or number";
        }
        if (this.searchType === "producer") {
            this.title = "Producer name or email";
        }
        this.searchValue = "";
    }
    onCancel(): void {
        this.callCenterFormDialogRef.close();
    }
    ngOnDestroy(): void {
        if (this.getCallCenterSubscription) {
            this.getCallCenterSubscription.unsubscribe();
        }
        if (this.listAccountSubscription) {
            this.listAccountSubscription.unsubscribe();
        }
        if (this.getCallCenterWithAccInfoSubscription) {
            this.getCallCenterWithAccInfoSubscription.unsubscribe();
        }
        if (this.addCallCenterAgentToCallCenterAccountSubscription) {
            this.addCallCenterAgentToCallCenterAccountSubscription.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
