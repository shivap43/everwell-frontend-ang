import { Component, OnInit, ViewChild, Input, AfterViewInit, OnChanges, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { FormControl, FormBuilder } from "@angular/forms";
import { Subscription, of } from "rxjs";
import { AccountList, ProducerService, ReceivedAccountInvitation, DashboardService, AccountListService } from "@empowered/api";
import { Router, ActivatedRoute } from "@angular/router";
import { DatePipe } from "@angular/common";
import { DateFormats, Permission, ConfigName, AppSettings, SortOrder } from "@empowered/constants";
import { ProspectInvitationComponent } from "../prospect-invitation/prospect-invitation.component";
import { AccountsService, EmpoweredModalService } from "@empowered/common-services";
import { switchMap, filter, tap, finalize } from "rxjs/operators";
import { DeleteProspectComponent } from "../delete-prospect/delete-prospect.component";
@Component({
    selector: "empowered-prospect-list",
    templateUrl: "./prospect-list.component.html",
    styleUrls: ["./prospect-list.component.scss"],
})
export class ProspectListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() prospectData;
    @Input() currentProducerId;
    @Input() searchedProducer;
    dataSource = new MatTableDataSource<AccountList>();
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    activeCol: string;
    displayedColumns: string[] = ["name", "groupNumber", "primaryProducer", "state", "createDate", "manage"];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospects.converttoAccount",
        "primary.portal.prospects.prospects",
        "primary.portal.prospects.addProspects",
        "primary.portal.prospects.noprospectsAdded",
        "primary.portal.prospects.finishSetting",
        "primary.portal.prospects.searchProspects",
        "primary.portal.prospects.prospectNameor",
        "primary.portal.prospects.prospectName",
        "primary.portal.prospects.accountNumber",
        "primary.portal.accounts.accountList.resultNotFound",
        "primary.portal.accounts.prospectList.resultNotFound",
        "primary.portal.prospects.filters",
        "primary.portal.prospects.producer",
        "primary.portal.prospects.state",
        "primary.portal.prospects.addProspect",
        "primary.portal.prospects.createNew",
        "primary.portal.prospects.import",
        "primary.portal.prospects.primaryProducer",
        "primary.portal.prospects.dateCreated",
        "primary.portal.prospects.manage",
        "primary.portal.prospects.completeAAOD",
        "primary.portal.prospects.viewcreateProposals",
        "primary.portal.prospects.noresultFound",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.customerList.paginator.of",
        "primary.portal.common.page",
        "primary.portal.accounts.accountList.viewInvitation",
        "primary.portal.common.remove",
    ]);
    showPaginator = false;
    onInit = true;
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    pageNumberControl: FormControl;
    pageSizeOption: any;
    pageEventSubscription: Subscription;
    dateFormat = DateFormats.DATE_FORMAT_MM_DD_YY;
    ASC = "asc";
    SORT_DESC = 1;
    SORT_ASC = -1;
    EQUAL_STATE = 0;
    isSpinnerLoading = false;
    invitationPopup: MatDialogRef<ProspectInvitationComponent>;
    readonly PROPOSAL_PERMISSION = Permission.PROPOSAL_READ;
    readonly PROPOSAL_CONFIG = ConfigName.PROPOSALS;
    subscriptions: Subscription[] = [];
    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly datepipe: DatePipe,
        private readonly producerService: ProducerService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountsService: AccountsService,
        private readonly dashboardService: DashboardService,
        private readonly accountListService: AccountListService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}
    /**
     * This life cycle hook is called on component initialization to get prospect list
     */
    ngOnInit(): void {
        this.pageSizeOption = AppSettings.pageSizeOptions;
        this.pageNumberControl = this.fb.control(1);
        this.dataSource.data = this.prospectData.sort((a, b) => (a.createDate > b.createDate ? -1 : 1));
        this.sortingData();
    }
    /**
     * Function to open dialog when user clicks on remove prospect
     * @param prospectDetails details of the selectedProspect
     */
    deleteProspect(prospectDetails: AccountList): void {
        this.subscriptions.push(
            this.empoweredModalService
                .openDialog(DeleteProspectComponent, { data: prospectDetails.name })
                .afterClosed()
                .pipe(
                    filter((resp) => resp),
                    switchMap((resp) => this.dashboardService.deactivateAccount(prospectDetails.id.toString())),
                    tap((res) => {
                        this.accountsService.updateResetProspect$(true);
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * Sort list based on create date in descending order.
     * If prospect is created on same date then further sort alphabetically based on prospect name.
     */
    sortingData(): void {
        this.dataSource.data.sort((a, b) => {
            const stateCompare = this.compare(
                this.datepipe.transform(a.createDate, this.dateFormat),
                this.datepipe.transform(b.createDate, this.dateFormat),
                this.sort.direction === this.ASC,
            );
            if (stateCompare === this.EQUAL_STATE) {
                return this.compare(a.name.toString(), b.name.toString(), true);
            }
            return undefined;
        });
    }
    /**
     * Compare two strings
     * @param a string
     * @param b string
     * @param isAsc boolean
     * @returns number
     */
    compare(a: string, b: string, isAsc: boolean): number {
        let sortOrder = this.EQUAL_STATE;
        if (a < b) {
            sortOrder = this.SORT_ASC;
        } else if (a > b) {
            sortOrder = this.SORT_DESC;
        }
        return sortOrder * (isAsc ? this.SORT_DESC : this.SORT_ASC);
    }
    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            if (typeof data[sortHeaderId] === "string") {
                return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
            }
            return data[sortHeaderId];
        };
        this.dataSource.paginator = this.paginator;
        this.pageEventSubscription = this.paginator.page.subscribe((page: PageEvent) => {
            this.pageNumberControl.setValue(page.pageIndex + 1);
        });
        this.showPaginator = true;
        this.onInit = false;
        // The view update requires angular detection to be triggered to avoid ExpressionChangedAfterItHasBeenCheckedError console error
        this.changeDetector.detectChanges();
    }
    sortData(event: any): void {
        this.activeCol = event.active;
    }
    ngOnChanges(): void {
        if (!this.onInit) {
            this.dataSource.data = this.prospectData.sort((a, b) => (a.createDate > b.createDate ? -1 : 1));
        }
    }
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > this.compareZero && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    /**
     * Refresh Prospect account and navigate to dashboard
     * @param id Group Id
     */
    routeToProspectDasboard(id: number): void {
        this.isSpinnerLoading = true;
        this.subscriptions.push(
            this.accountListService
                .refreshProspectAccount(id)
                .pipe(
                    finalize(() => {
                        this.isSpinnerLoading = false;
                        this.router.navigate([`./prospect/${id}`], { relativeTo: this.activatedRoute });
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * route to proposals for the prospect account
     * @param id prospect id
     */
    routeToProposal(id: number): void {
        this.subscriptions.push(
            this.accountListService
                .refreshProspectAccount(id)
                .pipe(
                    finalize(() => {
                        this.isSpinnerLoading = false;
                        this.router.navigate([`./prospect/${id}/proposals`], { relativeTo: this.activatedRoute });
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * open popup for user to accept or reject the prospect invitation
     * @param prospectId id of the selected prospect which needs to be accepted or rejected
     * @param currentProducerId id of current producer
     */
    viewProspectInvitation(prospectId: number, currentProducerId: number): void {
        let invitation: ReceivedAccountInvitation;
        let invitationStatus: string;
        this.subscriptions.push(
            this.producerService
                .getReceivedAccountInvitations(currentProducerId.toString())
                .pipe(
                    switchMap((invitations) => {
                        invitation = invitations.find((_invitation) => _invitation.account.id === prospectId);
                        if (invitation) {
                            this.invitationPopup = this.empoweredModalService.openDialog(ProspectInvitationComponent, {
                                data: { currentProducerId: currentProducerId, invitation: invitation },
                            });
                        }
                        return this.invitationPopup.afterClosed();
                    }),
                    switchMap((acceptanceStatus) => {
                        if (acceptanceStatus && acceptanceStatus.action) {
                            invitationStatus = acceptanceStatus.action;
                            return this.producerService.respondToInvitation(
                                currentProducerId.toString(),
                                invitation.account.id.toString(),
                                `"${acceptanceStatus.action}"`,
                            );
                        }
                        return of(false);
                    }),
                    filter((resp) => invitationStatus !== undefined && invitationStatus !== null),
                )
                .subscribe((resp) => {
                    this.accountsService.setProducerForProspectList(this.searchedProducer);
                }),
        );
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
