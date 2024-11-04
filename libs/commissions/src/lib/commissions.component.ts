import { Component, OnInit, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { ActivatedRoute, Router } from "@angular/router";
import {
    SetCommissionsStateGroupId,
    SetRole,
    SetSitus,
    SetCompanyCode,
    SetDirectData,
    ProducerListState,
    SharedState,
} from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { AccountService, ProducerService, SearchProducer } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subject, combineLatest, Observable } from "rxjs";
import { SharedService } from "@empowered/common-services";
import { takeUntil, filter, switchMap, tap } from "rxjs/operators";
import { ProducerUtilService } from "./services/producer.util.service";
import { Permission, ROLE, CompanyCode, UserPermissionList, AccountProducer, ProducerCredential, AdminRoles, Account } from "@empowered/constants";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
import { getSelectedAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

const COMMISSION_SPLIT = "commission-split";
const PAGE = "page";
const COMPANY_CODE_ATTRIBUTE = "company_code";

@Component({
    selector: "empowered-commissions",
    templateUrl: "./commissions.component.html",
    styleUrls: ["./commissions.component.scss"],
})
export class CommissionComponent implements OnInit, OnDestroy {
    portal: string;
    routeAfterLogin: string;
    mpGroupId: number;
    languageStrings: Record<string, string>;
    isDirect = false;
    unsubscribe$: Subject<void> = new Subject();
    hasRole20DirectPermission: boolean;
    hasRole20Permission: boolean;
    producerId: number;
    caseBuilderId: number;
    selfEnrollmentFlag = false;
    selectedIndex = 0;
    permissionEnum = Permission;
    account$: Observable<Account>;
    companyCode: string;

    constructor(
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly user: UserService,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly producerService: ProducerService,
        private readonly producerUtilService: ProducerUtilService,
        private readonly sharedService: SharedService,
        private readonly ngrxStore: NGRXStore
    ) {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params && params[PAGE] && params[PAGE] === COMMISSION_SPLIT) {
                this.selectedIndex = 1;
            }
        });
        this.fetchLanguageStrings();
        this.getPermissions();
        this.getLoggedInProducerDetails();
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.selfEnrollmentFlag = response;
                if (this.router.url.indexOf("direct") !== -1) {
                    // Checking for Direct Path
                    this.mpGroupId = this.route.snapshot.params ? this.route.snapshot.params.mpGroupId : null;
                    this.isDirect = true;
                } else if (this.router.url.indexOf("prospect") !== -1) {
                    // Checking for payroll Prospect Path
                    this.mpGroupId = this.route.parent.parent.snapshot.params ? this.route.parent.parent.snapshot.params.prospectId : null;
                } else if (!this.selfEnrollmentFlag) {
                    // Checking for payroll Account Path
                    this.mpGroupId = this.route.parent.parent.snapshot.params ? this.route.parent.parent.snapshot.params.mpGroupId : null;
                }
                this.setStoreValues(this.mpGroupId, this.isDirect);
            });
    }
    /**
     * Function is to dispatch mpgroup id and isDirect flag in store
     * @param mpGroupId Mpgroup Id which needs dispatch in store
     * @param isDirect isDirect flag which needs dispatch in store
     */
    setStoreValues(mpGroupId: number, isDirect: boolean): void {
        this.store.dispatch(new SetCommissionsStateGroupId(mpGroupId));
        this.store.dispatch(new SetDirectData(isDirect));
    }
    /**
     * Life cycle hook to initialize the component
     * Get account information details
     */
    ngOnInit(): void {
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: this.mpGroupId }));
        this.account$ = this.ngrxStore.onAsyncValue(select(getSelectedAccount));
        this.account$.pipe(takeUntil(this.unsubscribe$))
        .subscribe((resp) => {
            this.companyCode = resp.companyCode;
        });
        this.getAccountInfo(this.mpGroupId.toString());
        if (this.producerId) {
            if (this.hasRole20DirectPermission) {
                const producerList = this.store.selectSnapshot(ProducerListState).producerList;
                if (producerList && producerList.length) {
                    this.producerId = producerList.slice(-1)[0].id;
                }
            }
            if (this.hasRole20Permission) {
                this.setRole20UserRole(this.producerId);
            } else if (this.caseBuilderId) {
                this.setCaseBuilderUserRole(this.producerId);
            } else {
                this.setAccountProducerRole(this.producerId);
            }
        }
        this.producerUtilService.fetchRMDetails$
            .pipe(
                filter((isRefresh) => isRefresh),
                switchMap(() => {
                    const params = {
                        supervisorProducerId: this.producerId,
                    };
                    return combineLatest([
                        this.accountService.getAccountProducers(this.mpGroupId.toString()),
                        this.producerService.producerSearch(params),
                    ]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([accountProducers, hierarchyProducerList]) => {
                this.checkForReportingManagersProducers(this.producerId, accountProducers, hierarchyProducerList.content);
            });
    }
    /**
     * Function is to get loggedIn producer details
     */
    getLoggedInProducerDetails(): void {
        this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            if ((credential as ProducerCredential).producerId) {
                this.producerId = (credential as ProducerCredential).producerId;
                this.caseBuilderId = (credential as ProducerCredential).caseBuilderId;
                this.mpGroupId = (credential as ProducerCredential).groupId;
            }
        });
    }

    /**
     * Function is to get permission details
     */
    getPermissions(): void {
        combineLatest([
            this.store.select(SharedState.hasPermission(UserPermissionList.READ_ACCOUNT_DIRECT_ALWAYS)),
            this.store.select(SharedState.hasPermission(UserPermissionList.ACCOUNTLIST_ROLE_20)),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([hasRole20DirectPermission, hasRole20Permission]) => {
                this.hasRole20DirectPermission = hasRole20DirectPermission;
                this.hasRole20Permission = hasRole20Permission;
            });
    }
    /**
     * Function is to dispatch role 20 details into store.
     * @param producerId loggedIn producer id
     */
    setRole20UserRole(producerId: number): void {
        this.store.dispatch(
            new SetRole({
                id: producerId,
                name: ROLE.HQ_EXCHANGE_TEAM_SUPPORT,
            }),
        );
    }

    /**
     * Function is to dispatch role 119 details into store.
     * @param producerId loggedIn producer id
     */
    setCaseBuilderUserRole(producerId: number): void {
        this.store.dispatch(
            new SetRole({
                id: producerId,
                name: ROLE.CASE_BUILDER,
            }),
        );
    }

    /**
     * Function is to set role details of logged in producer into store.
     * @param loggedInProducerId loggedIn producer id
     */
    setAccountProducerRole(loggedInProducerId: number): void {
        const producerSearchObservable$: Observable<AccountProducer | AccountProducer[]> = this.selfEnrollmentFlag
            ? this.accountService.getAccountProducer(this.producerId.toString(), this.mpGroupId)
            : this.accountService.getAccountProducers(this.mpGroupId.toString());
        const params = {
            supervisorProducerId: loggedInProducerId,
        };
        combineLatest([producerSearchObservable$, this.producerService.producerSearch(params)])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountProducers, hierarchyProducerList]) => {
                const producerList: AccountProducer[] = Array.isArray(accountProducers) ? accountProducers : Array.of(accountProducers);
                this.checkForReportingManagersProducers(loggedInProducerId, producerList, hierarchyProducerList.content);
            });
    }

    /**
     * Function to checking loggedIn producer is reporting manager of account producers, if then add role details in store
     * @param loggedInProducerId logged in producer id
     * @param accountProducers account producers
     * @param hierarchyProducerList producer hierarchy list
     */
    checkForReportingManagersProducers(
        loggedInProducerId: number,
        accountProducers: AccountProducer[],
        hierarchyProducerList: SearchProducer[],
    ): void {
        const teamProducers: AccountProducer[] = accountProducers.filter((accProducer) =>
            hierarchyProducerList.some((producer) => accProducer.producer.id === producer.id),
        );
        // If producer details is found, then logged in producer is participating in this account
        // If producer details is not found, then logged in producer may be RM
        const producerDetails: AccountProducer = accountProducers.find((producer) => producer.producer.id === loggedInProducerId);
        if (teamProducers.length) {
            const primaryProducers = teamProducers.filter((producer) => producer.role === ROLE.PRIMARY_PRODUCER);
            const assistingProducers = teamProducers.filter((producer) => producer.role === ROLE.WRITING_PRODUCER);
            const enrollerProducers = teamProducers.filter((producer) => producer.role === ROLE.ENROLLER);
            let roleDetails: AdminRoles;
            if (primaryProducers.length && producerDetails) {
                roleDetails = this.getParticipatingProducerRole(producerDetails, true);
            } else if (producerDetails) {
                roleDetails = this.getParticipatingProducerRole(producerDetails, false);
            } else if (primaryProducers.length) {
                roleDetails = this.getRMRole(loggedInProducerId, ROLE.PRIMARY_PRODUCER, primaryProducers);
            } else if (assistingProducers.length) {
                roleDetails = this.getRMRole(loggedInProducerId, ROLE.WRITING_PRODUCER, assistingProducers);
            } else if (enrollerProducers.length) {
                roleDetails = this.getRMRole(loggedInProducerId, ROLE.ENROLLER, enrollerProducers);
            }
            if (roleDetails) {
                this.store.dispatch(new SetRole(roleDetails));
            }
        } else if (producerDetails) {
            this.store.dispatch(new SetRole(this.getParticipatingProducerRole(producerDetails, false)));
        }
    }
    /**
     * gets role data for participating producer
     * @param producerDetails participating producer details
     * @param isRMOfPrimaryProducer indicates if RM of primary producer or not
     * @returns Admin role base in input values
     */
    getParticipatingProducerRole(producerDetails: AccountProducer, isRMOfPrimaryProducer: boolean): AdminRoles {
        return {
            id: producerDetails.producer.id,
            name: producerDetails.role,
            isRMOfPrimaryProducer: isRMOfPrimaryProducer,
        };
    }
    /**
     * gets role data for non participating producer/ RM
     * @param loggedInProducerId logged in producer id
     * @param role role
     * @param producers producers list
     * @returns Admin role base in input values
     */
    getRMRole(loggedInProducerId: number, role: ROLE, producers: AccountProducer[]): AdminRoles {
        return {
            id: loggedInProducerId,
            name: role,
            isReportingManager: true,
            reportingManagerOf: producers,
        };
    }

    /**
     * Function is for get account information.
     * @param mpGroupId Mp group id
     */
    getAccountInfo(mpGroupId: string): void {
        this.accountService
            .getAccount(mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    if (Response) {
                        this.store.dispatch(new SetSitus(Response.situs));
                    }
                },
                () => {},
            );
        const companyCode = this.companyCode === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
        this.store.dispatch(new SetCompanyCode(companyCode));
    }
    fetchLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.commission.title",
            "primary.portal.commission.tab.producer",
            "primary.portal.commission.tab.commissionSplit",
        ]);
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
