import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { SideNavService } from "./../side-nav/services/side-nav.service";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";
import { PolicyChangeRequestState, SetRequestPolicyChanges } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { PolicyTransactionForms } from "@empowered/api";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { PolicyChangeRequestComponent } from "../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-request-policy-changes",
    templateUrl: "./request-policy-changes.component.html",
    styleUrls: ["./request-policy-changes.component.scss"],
})
export class RequestPolicyChangesComponent implements OnInit, OnDestroy {
    cancelDialogSubscription: Subscription;
    policyTransactionForm: FormGroup;
    policyTransactions = [];
    selectedTransactions: any;
    formArray: any;
    showErrorMessage: boolean;
    requestPolicyChanges: any;
    transactionForms: any;

    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.dashboard.policyChangeRequestFlow.requestPolicyChanges",
        "primary.portal.dashboard.policyChangeRequestFlow.requestPolicyChanges.requestPolicyChanges",
        "primary.portal.dashboard.policyChangeRequestFlow.requestPolicyChanges.selectPolicies",
    ]);
    updatedFormsList: any[];

    constructor(
        private readonly sideNavService: SideNavService,
        private readonly dialog: MatDialog,
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly langService: LanguageService,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
    ) {}

    ngOnInit(): void {
        this.requestPolicyChanges = this.store.selectSnapshot(PolicyChangeRequestState.GetRequestPolicyChanges);
        if (this.requestPolicyChanges) {
            this.transactionForms = this.requestPolicyChanges.requestPolicyChanges;
        }
        const searchPolicyResponse = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
        if (searchPolicyResponse) {
            const allowedForms = searchPolicyResponse.allowedForms;
            allowedForms.forEach((form) => {
                this.policyTransactions.push(PolicyTransactionForms[form]);
            });
        }
        this.createFormControl();
        this.formArray = this.policyTransactionForm.get("transactions") as FormArray;
        if (this.transactionForms) {
            this.policyTransactions.forEach((element) => {
                const setValue = this.transactionForms.indexOf(element) !== -1;
                this.formArray.push(this.formBuilder.control(setValue));
            });
        } else {
            this.policyTransactions.forEach((x) => this.formArray.push(this.formBuilder.control(false)));
        }
    }

    createFormControl(): void {
        this.policyTransactionForm = this.formBuilder.group({
            transactions: this.formBuilder.array([]),
        });
    }
    onBack(): void {
        this.sideNavService.stepClicked$.next(0);
    }

    onCancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.cancelDialogSubscription = this.cancelDialogRef.afterClosed().subscribe((response) => {
            if (response === "cancel") {
                this.sideNavService.removeTransactionScreenFromStore(true);
                this.PCRDialogRef.close("close");
            }
        });
    }

    onNext(): void {
        let results = this.policyTransactions.filter((x, i) => !!this.policyTransactionForm.value.transactions[i]);
        results = [...new Set(results)];
        if (results.length > 0) {
            this.showErrorMessage = false;
            this.store.dispatch(new SetRequestPolicyChanges({ requestPolicyChanges: results }));
            this.updateTransactionFormStore(results);
            this.sideNavService.defaultStepPositionChanged$.next(3);
        } else {
            this.showErrorMessage = true;
        }
    }

    updateTransactionFormStore(results: any): void {
        this.updatedFormsList = this.policyTransactions.filter((form) => {
            if (results.indexOf(form) === -1) {
                return form;
            }
        });
        this.updatedFormsList.forEach((formName) => {
            this.sideNavService.removeTransactionScreenFromStore(false, formName);
        });
    }
    ngOnDestroy(): void {
        if (this.cancelDialogSubscription) {
            this.cancelDialogSubscription.unsubscribe();
        }
    }
}
