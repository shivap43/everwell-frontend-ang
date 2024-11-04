import { Store } from "@ngxs/store";
import { Component, OnInit, HostListener, ViewChild, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MonSideNavList, AccountService, MenuItem } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { BehaviorSubject, Subject, Observable } from "rxjs";
import { switchMap, takeUntil, tap } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";
import { ConvertProspectComponent } from "../../convert-prospect/convert-prospect.component";
import { MatDialog } from "@angular/material/dialog";
import { SidenavIcon, CompanyCode, Accounts } from "@empowered/constants";
import { AddAccountInfo, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { GenericSidenavComponent } from "@empowered/ui";
import { AccountNameUpdateService } from "@empowered/common-services";

enum ProspectSideNavContent {
    PROSPECTS = "Prospects",
}

@Component({
    selector: "empowered-prospect-dashboard",
    templateUrl: "./prospect-dashboard.component.html",
    styleUrls: ["./prospect-dashboard.component.scss"],
})
export class ProspectDashboardComponent implements OnInit, OnDestroy {
    @ViewChild("genSideNav", { static: true }) genSideNav: GenericSidenavComponent;
    navOptions: MonSideNavList[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject();
    private readonly screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    mobileQuery: MediaQueryList;
    groupNumber: string;
    accountProducerDetails: any;
    accountDetails: Accounts;
    employeeDiscoverAssistLink$ = this.staticUtil.cacheConfigValue("account.dashboard.external.link.myAflac_employeeAssist");
    myAflacLink$ = this.staticUtil.cacheConfigValue("account.dashboard.external.link.myAflac_default");
    rpmLink$ = this.staticUtil.cacheConfigValue("account.dashboard.external.link.myAflac_myRpm");
    welthieLink$ = this.staticUtil.cacheConfigValue("account.dashboard.external.link.welthie");
    showDashboard = true;
    address: any;
    showWellthieLink$: Observable<boolean> = this.utilService.showWellthieLink();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospectdashboard.dashboard",
        "primary.portal.prospectdashboard.dashboard.proposals.header",
        "primary.portal.prospectdashboard.dashboard.proposals.header.viewOnly",
        "primary.portal.prospectdashboard.dashboard.proposals.content",
        "primary.portal.prospectdashboard.dashboard.proposals.content.viewOnly",
        "primary.portal.prospectdashboard.aaod",
        "primary.portal.prospectdashboard.profile",
        "primary.portal.prospectdashboard.proposals",
        "primary.portal.prospectdashboard.employees",
        "primary.portal.prospectdashboard.commissions",
        "primary.portal.prospectdashboard.completeAaod",
        "primary.portal.prospectdashboard.getNewaccount",
        "primary.portal.prospectdashboard.updateProfile",
        "primary.portal.prospectdashboard.addupdateProfile",
        "primary.portal.prospectdashboard.createviewProposals",
        "primary.portal.prospectdashboard.startProposal",
        "primary.portal.prospectdashboard.addEmployees",
        "primary.portal.prospectdashboard.employeeInfo",
        "primary.portal.prospectdashboard.inviteCoenrollers",
        "primary.portal.prospectdashboard.addingCoenrollers",
        "primary.portal.prospectdashboard.helpfulLinks",
        "primary.portal.prospectdashboard.myAflac",
        "primary.portal.prospectdashboard.welthie",
        "primary.portal.prospectdashboard.aflacEmployee",
        "primary.portal.prospectdashboard.rpm",
        "primary.portal.prospects.converttoAccount",
        "primary.portal.common.openNavigation",
        "primary.portal.prospectdashboard.accountInfo",
        "primary.portal.prospectdashboard.contacts",
        "primary.portal.prospectdashboard.carriers",
        "primary.portal.prospectdashboard.invalidZipCode",
    ]);
    loadSpinner = false;
    accountName: string;
    validZip = true;
    hasCreateProposalPermission$ = this.store.select(SharedState.hasPermission("core.proposal.create"));

    constructor(
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly media: MediaMatcher,
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly staticUtil: StaticUtilService,
        private readonly store: Store,
        private readonly accountNameUpdate: AccountNameUpdateService,
        private readonly utilService: UtilService,
    ) {
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
    }

    ngOnInit(): void {
        this.groupNumber = this.activatedRoute.snapshot.params.prospectId;
        this.getAccountDetails();
        this.getAccountProducers();
        this.addNavigationOptions();
        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((width) => {
                if (this.mobileQuery.matches) {
                    this.genSideNav.dashboardSideNav.opened = false;
                } else {
                    this.genSideNav.dashboardSideNav.opened = true;
                }
            });
        this.accountNameUpdate.accountName$.subscribe((value: string) => {
            this.accountName = value;
        });
    }
    /**
     * This function will configure sidenav with all required options
     * @returns void
     */
    addNavigationOptions(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.prospectdashboard.dashboard"],
                    iconName: SidenavIcon.DASHBOARD,
                    path: "",
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.prospectdashboard.profile"],
                    iconName: SidenavIcon.PROFILE,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.prospectdashboard.accountInfo"],
                        iconName: "account-info",
                        path: "account-info",
                    },
                    {
                        name: this.languageStrings["primary.portal.prospectdashboard.contacts"],
                        iconName: "contacts",
                        path: "contacts",
                    },
                    {
                        name: this.languageStrings["primary.portal.prospectdashboard.carriers"],
                        iconName: "carriers",
                        path: "carriers",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.prospectdashboard.proposals"],
                    iconName: SidenavIcon.PROPOSALS,
                    path: "proposals",
                    isConfigEnabled$: this.staticUtil.cacheConfigEnabled("portal.producer.payroll_tab.prospects.proposals.enabled"),
                    hasPermission$: this.store.select(SharedState.hasPermission("core.proposal.read")),
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.prospectdashboard.employees"],
                    iconName: SidenavIcon.EMPLOYEES,
                    path: "employees",
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.prospectdashboard.commissions"],
                    iconName: SidenavIcon.COMMISSIONS,
                    path: "commissions",
                },
                subMenuItem: [],
            },
        ];
    }
    @HostListener("window:resize", ["$event"])
    onResize(event: Event & { target: { innerWidth: number } }) {
        this.screenWidth$.next(event.target.innerWidth);
        if (!this.mobileQuery.matches) {
            this.genSideNav.dashboardSideNav.opened = true;
        } else {
            this.genSideNav.dashboardSideNav.opened = false;
        }
    }
    goToCommissions(): void {
        this.router.navigate(["commissions"], { relativeTo: this.activatedRoute });
    }
    goToEmployees(): void {
        this.router.navigate(["employees"], { relativeTo: this.activatedRoute });
    }
    goToProposals(): void {
        this.router.navigate(["proposals"], { relativeTo: this.activatedRoute });
    }
    goToProfileAccountInfo(): void {
        this.router.navigate(["profile/account-info"], { relativeTo: this.activatedRoute });
    }
    goToProfileContacts(): void {
        this.router.navigate(["profile/contacts"], { relativeTo: this.activatedRoute });
    }
    goToProfileCarriers(): void {
        this.router.navigate(["profile/carriers"], { relativeTo: this.activatedRoute });
    }

    navitageToSelectedOption(event: string): void {
        switch (event) {
            case this.languageStrings["primary.portal.prospectdashboard.dashboard"]:
                this.goToDashboard();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.proposals"]:
                this.goToProposals();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.commissions"]:
                this.goToCommissions();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.employees"]:
                this.goToEmployees();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.accountInfo"]:
                this.goToProfileAccountInfo();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.contacts"]:
                this.goToProfileContacts();
                break;
            case this.languageStrings["primary.portal.prospectdashboard.carriers"]:
                this.goToProfileCarriers();
                break;
            case ProspectSideNavContent.PROSPECTS:
                this.navigateToProspects();
                break;
        }
    }
    getScreenWidth(): Observable<number> {
        return this.screenWidth$.asObservable();
    }
    openConvertProspectPopUp(): void {
        this.dialog.open(ConvertProspectComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "convert-account",
            data: {
                groupNumber: this.groupNumber,
                producerId: this.getProducerIdFromAccountDetails().toString(),
                state: this.getState(),
                accountNumber: this.getAccountNumber(),
                producerName: this.getProducerNameFromAccountDetails(),
                prospectName: this.getAccountName(),
                address: this.address,
                writingNumber: this.getProducerWrittingNumber(),
            },
        });
    }
    getAccountProducers(): void {
        this.accountService
            .getAccountProducers(this.groupNumber)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.accountProducerDetails = response;
                    this.loadSpinner = false;
                },
                (error) => {
                    this.loadSpinner = false;
                },
            );
    }
    // TODO : Add navigations
    getProducerIdFromAccountDetails(): number {
        return this.accountProducerDetails.filter((producer) => producer.role === "PRIMARY_PRODUCER").pop().producer.id;
    }
    getProducerNameFromAccountDetails(): string {
        return this.accountProducerDetails.filter((producer) => producer.role === "PRIMARY_PRODUCER").pop().producer.name;
    }
    getProducerWrittingNumber(): any {
        return this.accountProducerDetails.filter((producer) => producer.role === "PRIMARY_PRODUCER").pop().producer.writingNumbers;
    }
    /**
     * Method to get account details and update the account info store
     */
    getAccountDetails(): void {
        this.accountService
            .getAccount(this.groupNumber)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((response) => {
                    this.accountDetails = response;
                    this.address = response.primaryContact.address;
                    this.accountName = this.accountDetails.name;
                    this.store.dispatch(
                        new AddAccountInfo({
                            accountInfo: response,
                            mpGroupId: this.groupNumber.toString(),
                        }),
                    );
                }),
                switchMap(() => this.utilService.validateZip(this.accountDetails.situs.state.abbreviation, this.accountDetails.situs.zip)),
                tap((resp) => {
                    this.validZip = resp;
                }),
            )
            .subscribe();
    }
    navigateToProspects(): void {
        this.router.navigate(["producer/payroll"], { queryParams: { page: "prosp" } });
    }
    getState(): string {
        if (this.accountDetails.situs.state.abbreviation === CompanyCode.NY) {
            return CompanyCode.NY;
        }
        return CompanyCode.US;
    }
    getAccountNumber(): string {
        return this.accountDetails.groupNumber ? this.accountDetails.groupNumber : null;
    }
    getAccountName(): string {
        return this.accountDetails.name;
    }
    goToDashboard(): void {
        if (!this.showDashboard) {
            this.router.navigate(["./"], { relativeTo: this.activatedRoute });
        }
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
