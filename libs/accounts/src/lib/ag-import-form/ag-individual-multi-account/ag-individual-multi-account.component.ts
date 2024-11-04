import { Component, OnInit, Input, EventEmitter, Output, OnDestroy, OnChanges, SimpleChanges } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AccountService } from "@empowered/api";
import { AccountProducer, Accounts } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-ag-individual-multi-account",
    templateUrl: "./ag-individual-multi-account.component.html",
    styleUrls: ["./ag-individual-multi-account.component.scss"],
})
export class AgIndividualMultiAccountComponent implements OnInit, OnDestroy, OnChanges {
    // All duplicate tax ids
    @Input() duplicateTaxAccountIds: number[];
    // id of producer
    @Input() producerId: number;
    // flag to check AI only scenario
    @Input() isAiOnly?: boolean;
    // output event to pass selected account to parent.
    @Output() navigateToCarrierPage = new EventEmitter<Accounts>();
    // clear subscription.
    private readonly unsubscribe$: Subject<void> = new Subject();
    // list of AIs which has access.
    accessibleAIs: Accounts[] = [];
    // collection of non permitted AIs.
    nonAccessibleAIs = false;
    // true -> show spinner.false -> hide spinner
    showSpinner = false;
    // Flag to show contents
    showContent = false;
    // This property holds all localized value of component.
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacgroup.importaccount.aflacMultiAccount",
        "primary.portal.aflacgroup.importaccount.individual.title",
        "primary.portal.aflacgroup.importaccount.multiAccount.primaryProducer",
        "primary.portal.aflacgroup.importaccount.individual.linkWarning",
        "primary.portal.aflacgroup.importaccount.aflacSingleAccount",
        "primary.portal.aflacgroup.importaccount.aflacGroupTaxId",
        "primary.portal.aflacgroup.importaccount.aflacIndividualAccount",
        "primary.portal.aflacgroup.importaccount.individual.aflacGroupNewAccount",
        "primary.portal.aflacgroup.importaccount.aflacIndividualTaxId",
        "primary.portal.aflacgroup.importaccount.noAccessGroup",
        "primary.portal.aflacgroup.importaccount.noAccess",
        "primary.portal.aflacgroup.importaccount.aflacIndividualAccountsTaxId",
    ]);

    readonly MIN_ACCESSIBLE_AIS_LEN = 1;
    /**
     * Constructor of class
     * @param language injection of language service
     * @param accountService injection of account service
     */
    constructor(private readonly language: LanguageService, private readonly accountService: AccountService) {}
    /**
     * Init life cycle hook of angular
     */
    ngOnInit(): void {
        this.hasAccessOfAIs();
    }

    /**
     * Component LifeCycle hook OnChanges
     * Changes the data of accessible AI/AG on change in input duplicateTaxAccounts
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.duplicateTaxAccountIds) {
            this.hasAccessOfAIs();
        }
    }
    /**
     * get Account data
     * @param mpGroup account id.
     */
    getAccount(mpGroup: number | string, resolve: (value: boolean) => void, primaryProducer?: AccountProducer): void {
        this.accountService
            .getAccount(mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (account: Accounts) => {
                    this.accessibleAIs.push(account);
                    resolve(true);
                },
                (error) => resolve(true),
            );
    }

    /**
     * checks for access of AIs
     * separate accessible and non-accessible AIs
     */
    hasAccessOfAIs(): void {
        this.showSpinner = true;
        this.nonAccessibleAIs = false;
        this.accessibleAIs = [];
        const aiPromises: Promise<boolean>[] = [];
        if (this.duplicateTaxAccountIds.length) {
            this.duplicateTaxAccountIds.forEach((mpGroup) => {
                const aiPromise = new Promise<boolean>((resolve) => {
                    this.getAccount(mpGroup, resolve);
                });
                aiPromises.push(aiPromise);
            });
        } else {
            this.nonAccessibleAIs = true;
        }
        Promise.all(aiPromises).then(() => {
            this.showContent = true;
            this.showSpinner = false;
        });
    }
    /**
     * emit a event to carrier page Navigation.
     * @param ai account info
     */
    gotoCarrierPage(ai: Accounts): void {
        this.navigateToCarrierPage.emit(ai);
    }
    /**
     * destroy life cycle hook of angular.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
