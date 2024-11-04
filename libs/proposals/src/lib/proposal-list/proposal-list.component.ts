import { switchMap, filter, take, tap } from "rxjs/operators";
import { CreateProposalComponent } from "./../create-proposal/create-proposal.component";
import { DeleteProposalComponent } from "./../delete-proposal/delete-proposal.component";
import { LanguageService } from "@empowered/language";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { Proposal, ProposalEmail, AccountDetails, AflacService, BenefitsOfferingService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { PreviewProposalComponent } from "../preview-proposal/preview-proposal.component";
import { SendProposalComponent } from "../send-proposal/send-proposal.component";
import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    PagePrivacy,
    AccountImportTypes,
    ProposalStatus,
    ModalDialogAction,
} from "@empowered/constants";
import { ProductsPlansQuasiService } from "@empowered/benefits";
import { SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";

import {
    ResetProposal,
    SetDeductionFrequencies,
    ProposalsState,
    ProposalsService,
    UtilService,
    GetProductsPanel,
    SetAllEligiblePlans,
    SetAllProducts,
    SetMaintenanceRequiredData,
    SetBenefitsStateMPGroup,
    SetPlanEligibility,
    SetUnapprovedPanel,
    AccountListState,
    AccountInfoState,
    SharedState,
} from "@empowered/ngxs-store";

const ERROR = "error";
const EMPLOYEE_COUNT_MESSAGE = "showEmployeeCountMsg";

@Component({
    selector: "empowered-proposal-list",
    templateUrl: "./proposal-list.component.html",
    styleUrls: ["./proposal-list.component.scss"],
})
export class ProposalListComponent implements OnInit, OnDestroy {
    readonly DANGER = "danger";
    readonly SUCCESS = "success";
    readonly RESUME = "resume";
    displayedColumns = ["name", "coverageStartDate", "createdBy", "status", "manage"];
    datasource = new MatTableDataSource<Proposal>();
    proposalList$: Observable<Proposal[]>;
    zeroStateMessage: string;
    message: string;
    subscriptions: Subscription[] = [];
    showAlertType: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.proposals.list.header",
        "primary.portal.proposals.createProposal.button",
        "primary.portal.proposals.list.resume",
        "primary.portal.proposals.list.preview",
        "primary.portal.proposals.list.send",
        "primary.portal.proposals.list.edit",
        "primary.portal.proposals.list.remove",
        "primary.portal.proposals.invalidZipCode",
    ]);
    hasCreateProposalPermission$ = this.store.select(SharedState.hasPermission("core.proposal.create"));
    @Select(AccountInfoState.getAccountInfo) accountInfo$: Observable<AccountDetails>;
    showSpinner = false;
    isRefreshInProgress: boolean;
    isSuccess: boolean;
    isServerError: boolean;
    isAccountRefreshFailure: boolean;
    mpGroup: number;
    validZip = true;
    accountDetails: AccountDetails;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    readonly PROPOSAL_STATUS = ProposalStatus;
    defaultOfferingStates = [];

    constructor(
        private readonly language: LanguageService,
        private readonly proposal: ProposalsService,
        private readonly store: Store,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly empoweredSheetService: EmpoweredSheetService,
        private readonly aflacService: AflacService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly utilService: UtilService,
        private readonly sharedService: SharedService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
    ) {
        this.proposal.getProposals();
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.BENEFIT_OFFERING_PROPOSAL);
        }
    }

    /**
     * initializing, which includes getting the proposal list and display zero-state if there's no proposal
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.getBenefitOfferingDefaultStates();
        this.subscriptions.push(
            this.proposal.showSpinnerOnCompleteSubject$.subscribe((isLoading) => {
                this.showSpinner = isLoading;
            }),
        );
        this.proposalList$ = this.store
            .dispatch(new ResetProposal())
            .pipe(switchMap((result) => this.store.select(ProposalsState.proposals)));
        this.showSpinner = true;
        this.subscriptions.push(
            this.accountInfo$.subscribe((resp) => {
                this.accountDetails = resp;
                this.mpGroup = resp.id;
                this.showSpinner = false;
            }),
        );
        this.validateZip();
        this.store.dispatch(new SetDeductionFrequencies());
    }

    /**
     * Method to check offering default states
     * @returns void
     */
    getBenefitOfferingDefaultStates(): void {
        this.subscriptions.push(
            this.benefitsOfferingService
                .getBenefitOfferingDefaultStates(this.mpGroup)
                .subscribe((resp) => {
                    this.defaultOfferingStates = resp.map((benefitsOfferingState) => benefitsOfferingState.abbreviation);
                }),
        );
    }

    /**
     * Method to check if the zipcode is valid or not
     */
    validateZip(): void {
        if (this.accountDetails) {
            this.subscriptions.push(
                this.utilService
                    .validateZip(this.accountDetails?.situs.state.abbreviation, this.accountDetails?.situs.zip)
                    .subscribe((resp) => {
                        this.validZip = resp;
                    }),
            );
        }
    }

    /**
     * open create proposal modal to start a new proposal
     */
    createProposal(): void {
        this.message = "";
        const showEmployeeCountMsg = "showEmployeeCountMsg";
        this.subscriptions.push(
            this.storeAllEligiblePlans()
                .pipe(
                    switchMap((response) => {
                        this.showSpinner = false;
                        return this.empoweredSheetService
                            .openSheet(CreateProposalComponent)
                            .afterDismissed()
                            .pipe(
                                filter((result) => result !== undefined && result !== null),
                                tap((result) => {
                                    if (result !== showEmployeeCountMsg) {
                                        this.showAlertType = this.SUCCESS;
                                        this.isRefreshInProgress = false;
                                        if (result.action === ModalDialogAction.SAVED) {
                                            this.message = this.language.fetchPrimaryLanguageValue("primary.portal.proposals.savedMessage");
                                        } else if (result.action === ModalDialogAction.COMPLETED) {
                                            this.message = this.language.fetchPrimaryLanguageValue(
                                                "primary.portal.proposals.completedMessage",
                                            );
                                        }
                                    } else {
                                        this.isRefreshInProgress = true;
                                        this.isSuccess = false;
                                        this.isServerError = false;
                                        this.isAccountRefreshFailure = false;
                                    }
                                }),
                                switchMap((result) =>
                                    result !== showEmployeeCountMsg
                                        ? result.proposalObservable
                                        : this.aflacService.refreshAccount(this.mpGroup.toString()),
                                ),
                            );
                    }),
                )
                .subscribe(
                    () => {
                        if (this.isRefreshInProgress) {
                            this.isRefreshInProgress = false;
                            this.isSuccess = true;
                        }
                    },
                    (error) => {
                        if (this.isRefreshInProgress) {
                            this.isRefreshInProgress = false;
                            if (error) {
                                this.accountRefreshErrorAlertMessage(error);
                            }
                        }
                    },
                ),
        );
    }

    /**
     * function to show error message for account refresh
     * @param err: error from API
     */
    accountRefreshErrorAlertMessage(err: Error): void {
        if (err[ERROR] && err[ERROR].status === ServerErrorResponseCode.RESP_503) {
            this.isServerError = true;
        } else {
            this.isAccountRefreshFailure = true;
        }
    }

    /**
     * open create proposal modal with proposal in progress or existing proposal
     * @param proposal: Proposal,  proposal details
     * @param proposalState optional paramter to find proposal state
     */
    resumeOrEditProposal(proposal: Proposal, proposalState?: string): void {
        this.message = "";
        this.showAlertType = "";
        const isResume = proposalState === this.RESUME;
        this.subscriptions.push(
            this.storeAllEligiblePlans()
                .pipe(
                    switchMap((response) => {
                        this.showSpinner = false;
                        return this.empoweredSheetService
                            .openSheet(CreateProposalComponent, {
                                data: { proposal: proposal, resume: isResume },
                            })
                            .afterDismissed()
                            .pipe(
                                filter((result) => result !== undefined && result !== null),
                                tap((result) => {
                                    if (result !== EMPLOYEE_COUNT_MESSAGE) {
                                        this.setMessageForEditOrResume(result.action, proposal, isResume);
                                    } else {
                                        this.isRefreshInProgress = true;
                                        this.isSuccess = false;
                                        this.isServerError = false;
                                        this.isAccountRefreshFailure = false;
                                    }
                                }),
                                switchMap((result) =>
                                    result !== EMPLOYEE_COUNT_MESSAGE
                                        ? result.proposalObservable
                                        : this.aflacService.refreshAccount(this.mpGroup.toString()),
                                ),
                            );
                    }),
                )
                .subscribe(
                    () => {
                        if (this.isRefreshInProgress) {
                            this.isSuccess = true;
                            this.isRefreshInProgress = false;
                        }
                    },
                    (error) => {
                        if (this.isRefreshInProgress) {
                            this.isRefreshInProgress = false;
                            this.accountRefreshErrorAlertMessage(error);
                        }
                    },
                ),
        );
    }
    /**
     * Function to set message for edit or resume proposal status
     * @param resultAction string
     * @param proposal Proposal
     * @param isResume proposal state
     */
    setMessageForEditOrResume(resultAction: string, proposal: Proposal, isResume: boolean): void {
        this.isRefreshInProgress = false;
        this.showAlertType = this.SUCCESS;
        if (resultAction === ModalDialogAction.SAVED) {
            this.message = this.language.fetchPrimaryLanguageValue(
                `primary.portal.proposals.${proposal.status === ProposalStatus.IN_PROGRESS ? "savedMessage" : "savedMessageForCompleted"}`,
            );
        } else if (resultAction === ModalDialogAction.COMPLETED) {
            this.message = this.language.fetchPrimaryLanguageValue(
                `primary.portal.proposals.${isResume ? "completedMessage" : "updatedMessage"}`,
            );
        } else {
            this.showAlertType = "";
        }
    }
    /**
     * open preview proposal modal and call the API after confirmation in the dialog box
     */
    previewProposal(proposal: Proposal): void {
        this.message = "";
        const dialogRef = this.empoweredModalService.openDialog(PreviewProposalComponent, {
            data: {
                name: proposal.name,
                id: proposal.id,
            },
        });

        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((result) => result !== undefined && result !== null),
                    switchMap((result) => {
                        if (result.zip) {
                            return this.proposal.downloadProposal(proposal.id, result.state, result.proposalType, result.zip).pipe(take(1));
                        }
                        return this.proposal.downloadProposal(proposal.id, result.state, result.proposalType).pipe(take(1));
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * open send proposal modal and call the API after confirmation in the dialog box
     */
    sendProposal(proposal: Proposal): void {
        this.message = "";
        this.showAlertType = "";
        const dialogRef = this.empoweredModalService.openDialog(SendProposalComponent, {
            data: { id: proposal.id, name: proposal.name },
        });
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((result) => result !== undefined && result !== null),
                    switchMap((result) => {
                        const proposalEmail: ProposalEmail = {
                            adminIds: result.adminIds,
                            state: result.state,
                            zip: result.zip,
                            proposalType: result.proposalType,
                            message: result.message,
                        };
                        if (!result.zip) {
                            delete proposalEmail.zip;
                        }
                        if (!result.proposalType) {
                            delete proposalEmail.proposalType;
                        }
                        if (!result.message) {
                            delete proposalEmail.message;
                        }

                        return this.proposal.emailProposal(proposal.id, proposalEmail).pipe(
                            take(1),
                            tap(
                                (next) => {
                                    this.showAlertType = this.SUCCESS;
                                    const noOfAdmins = result.adminIds.length;
                                    if (noOfAdmins) {
                                        if (noOfAdmins === 1) {
                                            this.message = this.language.fetchPrimaryLanguageValue(
                                                "primary.portal.proposals.send.successMessage1",
                                            );
                                        } else if (noOfAdmins > 1) {
                                            this.message = this.language.fetchPrimaryLanguageValue(
                                                "primary.portal.proposals.send.successMessage2",
                                            );
                                        }
                                        this.message = this.message.replace("##noOfAdmins##", noOfAdmins);
                                    }
                                },
                                (error) => {
                                    this.showAlertType = this.DANGER;
                                    if (error.status === ClientErrorResponseCode.RESP_409) {
                                        this.message = `${this.language.fetchPrimaryLanguageValue(
                                            "primary.portal.proposals.send.error.file.too.large",
                                        )}`;
                                    } else if (error.status === ClientErrorResponseCode.RESP_400) {
                                        this.message = `${this.language.fetchPrimaryLanguageValue(
                                            "primary.portal.proposals.send.invalid.zipCode",
                                        )}`;
                                    }
                                },
                            ),
                        );
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * open delete proposal modal and call the API after confirmation in the dialog box
     * @param proposal: Proposal,  proposal details
     */
    removeProposal(proposal: Proposal): void {
        this.message = "";
        const dialogRef = this.empoweredModalService.openDialog(DeleteProposalComponent, {
            data: { name: proposal.name },
        });
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((result) => result !== undefined && result !== null),
                    switchMap((result) => {
                        this.showAlertType = this.SUCCESS;
                        this.message =
                            proposal.name + this.language.fetchPrimaryLanguageValue("primary.portal.proposals.delete.successMessage");
                        return this.proposal.deleteProposal(proposal.id).pipe(take(1));
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Function to recall all service calls and dispatch actions
     * @returns Observable of void
     */
    storeAllEligiblePlans(): Observable<void> {
        this.showSpinner = true;
        this.quasiService.resetQuasiObservableValues();
        this.quasiService.resetQuasiStoreValues();
        const group = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (group.id !== undefined) {
            this.store.dispatch(new SetBenefitsStateMPGroup(group.id));
        }
        return this.store.dispatch(new SetMaintenanceRequiredData()).pipe(
            switchMap(() => this.store.dispatch(new SetAllProducts())),
            switchMap(() => this.store.dispatch(new SetAllEligiblePlans(this.defaultOfferingStates, AccountImportTypes.AFLAC_INDIVIDUAL))),
            switchMap(() => this.store.dispatch(new SetPlanEligibility())),
            switchMap(() => this.store.dispatch(new GetProductsPanel())),
            switchMap(() => this.store.dispatch(new SetUnapprovedPanel())),
        );
    }

    /**
     * unsubscribing subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
