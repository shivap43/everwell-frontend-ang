import { map, switchMap, tap } from "rxjs/operators";
import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { Subscription, combineLatest, Observable } from "rxjs";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { StaticService, ProposalType, AdminService, AccountService, MissingEmployerFlyer, ProposalService } from "@empowered/api";
import { Name, CountryState, ConfigName } from "@empowered/constants";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { MPGroupAccountService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-send-proposal",
    templateUrl: "./send-proposal.component.html",
    styleUrls: ["./send-proposal.component.scss"],
})
export class SendProposalComponent implements OnInit, OnDestroy {
    sendProposalForm: FormGroup;
    isFormValid = true;
    allStates: CountryState[];

    displayedColumns = ["select", "name", "emailAddress", "role"];
    selection = new SelectionModel<AdminItem>(true, []);
    recipientList$: Observable<AdminItem[]>;
    datasource = new MatTableDataSource<AdminItem>();
    subscriptions: Subscription[] = [];
    missingFlyerFeatureEnable$: Observable<boolean>;
    missingFlyerInfo: MissingEmployerFlyer[];
    missingEmployerFlyer: boolean;
    isRatesSelected: boolean;
    situsState: CountryState;
    mpGroup: number;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.proposals.send.confirm",
        "primary.portal.previewProposal.employerFlyerUnavailable",
        "primary.portal.previewProposal.ratesIncluded",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<SendProposalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly adminService: AdminService,
        private readonly accountService: AccountService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly proposalService: ProposalService,
    ) {}

    // setting up form, getting data, and combining recipient list from both account admins and producers
    ngOnInit(): void {
        this.missingFlyerFeatureEnable$ = this.staticUtilService.cacheConfigEnabled(ConfigName.MISSING_FLYER_FEATURE_ENABLE);
        this.isRatesSelected = false;
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$
                .pipe(
                    switchMap((account) => {
                        this.sendProposalForm = this.fb.group({
                            state: this.fb.control(account.situs.state.abbreviation, Validators.required),
                            zip: this.fb.control(""),
                            proposalType: this.fb.control("FULL"),
                            message: this.fb.control(""),
                        });
                        this.situsState = account.situs.state;
                        this.mpGroup = account.id;
                        return this.proposalService.getMissingEmployerFlyer(
                            this.data.id,
                            account.id.toString(),
                            this.situsState.abbreviation,
                        );
                    }),
                    tap((res) => {
                        this.missingFlyerInfo = res;
                    }),
                )
                .subscribe(),
        );

        this.subscriptions.push(
            this.staticService.getStates().subscribe((states) => {
                this.allStates = states;
            }),
        );

        this.recipientList$ = combineLatest(
            this.adminService.getAccountAdmins(0, "roleId").pipe(
                map((accountAdmins) =>
                    accountAdmins.map(
                        (accountAdmin) =>
                            ({
                                id: accountAdmin.id,
                                name: accountAdmin.name,
                                emailAddress: accountAdmin.emailAddress,
                                role: accountAdmin.role.name,
                            } as AdminItem),
                    ),
                ),
            ),
            this.accountService.getAccountProducers().pipe(
                map((accountProducers) =>
                    accountProducers.map(
                        (accountProducer) =>
                            ({
                                id: accountProducer.producer.id as number,
                                name: accountProducer.producer.name as Name,
                                emailAddress: accountProducer.producer.emailAddress as string,
                                role: accountProducer.role as string,
                            } as AdminItem),
                    ),
                ),
            ),
        ).pipe(map(([admins, producers]) => admins.concat(producers)));

        this.subscriptions.push(
            this.recipientList$.subscribe((recipientList) => {
                this.datasource.data = recipientList;
            }),
        );
    }

    // checking to see if all are selected
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.datasource.data.length;
        return numSelected === numRows;
    }

    /**
     * filters missing flyers only for the states selected
     * @param stateValue
     */
    checkFlyerForStates(stateValue: string): void {
        this.proposalService.getMissingEmployerFlyer(this.data.id, this.mpGroup.toString(), stateValue).subscribe((resp) => {
            this.missingFlyerInfo = resp;
        });
    }

    /**
     * Method to set isRatesSelected
     * @param value
     */
    chooseOption(value: string): void {
        this.isRatesSelected = value === "RATES_ONLY";
    }

    // (un)checking all rows
    masterToggle(): void {
        this.isFormValid = true;
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.datasource.data.forEach((row) => this.selection.select(row));
        }
    }

    // determining aria labels
    checkboxLabel(row?: AdminItem): string {
        if (!row) {
            return `${this.isAllSelected() ? "select" : "deselect"} all`;
        }
        return `${this.selection.isSelected(row) ? "deselect" : "select"} row $ {row.position + 1}`;
    }

    // construct data on submitting via the API call
    onSubmit(submittedForm: any): void {
        if (this.selection.isEmpty()) {
            this.isFormValid = false;
            return;
        }
        this.isFormValid = true;
        this.data = {
            name: this.data.name,
            state: submittedForm.value.state,
            adminIds: this.selection.selected.map((adminItem) => adminItem.id),
            zip: submittedForm.value.zip,
            proposalType: submittedForm.value.proposalType,
            message: submittedForm.value.message,
        };
        if (submittedForm.value.zip === "") {
            delete this.data.zip;
        }
        if (submittedForm.value.proposalType === "") {
            delete this.data.proposalType;
        }
        if (submittedForm.value.message === "") {
            delete this.data.message;
        }
        this.dialogRef.close(this.data);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}

export interface DialogData {
    id?: number;
    name: string;
    state: string;
    adminIds: number[];
    zip?: string;
    proposalType?: ProposalType;
    message?: string;
}

// model that shows up on the table of admins (including account admins and account producers)
export interface AdminItem {
    id: number;
    name: Name;
    emailAddress: string;
    role: string;
}
