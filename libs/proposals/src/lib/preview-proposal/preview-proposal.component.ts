import { FormGroup, Validators } from "@angular/forms";
import { FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProposalType, StaticService, MissingEmployerFlyer, ProposalService } from "@empowered/api";
import { ConfigName, CountryState } from "@empowered/constants";
import { MPGroupAccountService } from "@empowered/common-services";
import { Observable, Subscription } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";
import { switchMap, tap } from "rxjs/operators";

@Component({
    selector: "empowered-preview-proposal",
    templateUrl: "./preview-proposal.component.html",
    styleUrls: ["./preview-proposal.component.scss"],
})
export class PreviewProposalComponent implements OnInit, OnDestroy {
    previewProposalForm: FormGroup;
    allStates: CountryState[];
    subscriptions: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.proposals.preview.header",
        "primary.portal.proposals.preview.confirm",
        "primary.portal.proposals.preview.headerMessage",
        "primary.portal.proposals.preview.proposalName",
        "primary.portal.proposals.preview.zip",
        "primary.portal.previewProposal.employerFlyerUnavailable",
        "primary.portal.previewProposal.ratesIncluded",
    ]);
    missingFlyerFeatureEnable$: Observable<boolean>;
    missingFlyerInfo: MissingEmployerFlyer[];
    missingEmployerFlyer: boolean;
    isRatesSelected: boolean;
    situsState: CountryState;
    mpGroup: number;

    constructor(
        private readonly dialogRef: MatDialogRef<PreviewProposalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly proposalService: ProposalService,
        private readonly fb: FormBuilder,
    ) {}

    // set up form
    ngOnInit(): void {
        this.missingFlyerFeatureEnable$ = this.staticUtilService.cacheConfigEnabled(ConfigName.MISSING_FLYER_FEATURE_ENABLE);
        this.isRatesSelected = false;
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$
                .pipe(
                    switchMap((account) => {
                        this.previewProposalForm = this.fb.group({
                            state: this.fb.control(account.situs.state.abbreviation, Validators.required),
                            zip: this.fb.control(""),
                            proposalType: this.fb.control("FULL", Validators.required),
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
    }

    // prepare data to submit via API call
    onSubmit(submittedForm: any): void {
        this.data = {
            name: this.data.name,
            state: submittedForm.value.state,
            zip: submittedForm.value.zip,
            proposalType: submittedForm.value.proposalType,
        };
        if (submittedForm.value.zip === "") {
            delete this.data.zip;
        }
        this.dialogRef.close(this.data);
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

    // unsubscribe
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}

export interface DialogData {
    name: string;
    state: string;
    id?: number;
    proposalType: ProposalType;
    zip?: string;
}
