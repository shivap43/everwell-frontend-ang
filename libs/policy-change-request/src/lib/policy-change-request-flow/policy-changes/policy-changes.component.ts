import { Subscription } from "rxjs";
import { PolicyChangeRequestState } from "@empowered/ngxs-store";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { SideNavService } from "../side-nav/services/side-nav.service";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-policy-changes",
    templateUrl: "./policy-changes.component.html",
    styleUrls: ["./policy-changes.component.scss"],
})
export class PolicyChangesComponent implements OnInit, OnDestroy {
    transactionFlowSubscription: Subscription;
    requestPolicyChanges: any;
    transactionForms: string[];
    transactioneScreenDisplay: any;
    transactionFlowIndex: string;
    transactionIndex = 0;
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeName.header",
        "primary.portal.policyChangeRequest.transactions.changeGender.header",
        "primary.portal.policyChangeRequest.transactions.transferToDirect.header",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.header",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.headerData",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.header",
        "primary.portal.policyChangeRequest.transactions.changeAddress.header",
        "primary.portal.policyChangeRequest.transactions.downgradeAccident.header",
        "primary.portal.policyChangeRequest.transactions.downgradeCancer.header",
        "primary.portal.policyChangeRequest.transactions.downgradeDisability.header",
        "primary.portal.policyChangeRequest.transactions.removeDependant.header",
        "primary.portal.policyChangeRequest.transactions.removeRider.header",
        "primary.portal.policyChangeRequest.transactions.transferPayroll.header",
        "primary.portal.policyChangeRequest.transactions.changeOccupation.header",
    ]);

    constructor(
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly langService: LanguageService,
    ) {}

    ngOnInit(): void {
        this.requestPolicyChanges = this.store.selectSnapshot(PolicyChangeRequestState.GetRequestPolicyChanges);
        if (this.requestPolicyChanges) {
            this.transactionForms = this.requestPolicyChanges.requestPolicyChanges;
        }
        if (!this.sideNavService.getEditFlag()) {
            this.sideNavService.onNextClick(this.transactionIndex);
        }
        this.transactionFlowSubscription = this.sideNavService.transactionFlow$.subscribe((data) => {
            this.transactioneScreenDisplay = data;
        });
    }

    convertTransactionFormName(transaction: string): string | undefined {
        if (transaction) {
            return transaction.replace(/ |\//g, "-").toLowerCase();
        }
        return undefined;
    }
    ngOnDestroy(): void {
        if (this.transactionFlowSubscription) {
            this.transactionFlowSubscription.unsubscribe();
        }
    }
}
