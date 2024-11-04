import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { MonDialogData, MonDialogComponent } from "@empowered/ui";
import { MatDialog } from "@angular/material/dialog";
import {
    AccountService,
    ClassType,
    RegionType,
    ClassNames,
    RegionNames,
    AccountProfileService,
    Region,
    BenefitsOfferingService,
    AccountList,
    AppTakerService,
    AccountDetails,
} from "@empowered/api";
import { ActivatedRoute } from "@angular/router";

import {
    BenefitsOfferingState,
    BenefitsOfferingStateModel,
    AccountListState,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { take, takeUntil } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { ProductsPlansQuasiService } from "../products-plans-quasi";
import { Subject, forkJoin, of, combineLatest } from "rxjs";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { PagePrivacy, Permission, PayFrequency, CountryState, Product, StatusType } from "@empowered/constants";
import { SharedService } from "@empowered/common-services";

const NY_ABBR = "NY";

@Component({
    selector: "empowered-benefit-dollars",
    templateUrl: "./benefit-dollars.component.html",
    styleUrls: ["./benefit-dollars.component.scss"],
})
export class BenefitDollarsComponent implements OnInit, OnDestroy {
    displayAddEdit: boolean;
    mpGroup: number;
    currentOffering: any;
    allClassesTypes: ClassType[] = [];
    allClasses: ClassNames[];
    classNames = [];
    allRegions: RegionNames[];
    regionNames = [];
    allProducts: Product[];
    productNames = [];
    offeringList = [];
    isApprovalPending = false;
    isUnPlugged = false;
    isLoading: boolean;
    isRequestCompleted = false;
    isLoadingFromEvent = false;
    payFrequencyId: number;
    payFrequency: PayFrequency;
    payFrequencyName = "";
    AUDIENCEGROUPINGID = "audienceGroupingId";
    currentAccount: AccountList;
    accountLocked: boolean;
    isRequestPending: boolean;
    approvalRequests = [];
    stateNYorOH: boolean;
    @Output() emitUnApprovedOfferings = new EventEmitter<number>();
    payFrequencies: PayFrequency[];
    excludedStateList: string[];
    invalidStates: string[] = [];
    validStates: CountryState[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isNY = false;
    validZip = true;
    currentAccountDetails: AccountDetails;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.description",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.createNewOffering",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.displayAddEditZeroState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.zeroState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAvailableForEnrollments",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAvailableForEnrollments",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAllowedInState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAllowed",
    ]);
    erisaMessage = this.language.fetchPrimaryLanguageValue("primary.portal.benefitDollars.erisaMessage");
    erisaMessageHtml: SafeHtml;
    isAdmin: boolean;
    DEFAULT_FREQUENCY_ID = 2;
    DEFAULT_FREQUENCY: "Monthly";
    readonly LENGTH_ONE = 1;
    readonly LENGTH_TWO = 2;
    isVestedAgent: boolean;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;

    constructor(
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly route: ActivatedRoute,
        private readonly accountProfileService: AccountProfileService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly appTakerService: AppTakerService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly staticUtilService: StaticUtilService,
        private readonly domSanitizer: DomSanitizer,
        private readonly utilService: UtilService,
        private readonly sharedService: SharedService,
    ) {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(
                PagePrivacy.BENEFIT_OFFERING_EMPLOYER_CONTRIBUTIONS,
            );
        }
    }

    /**
     * @function ngOnInit
     * @description To set-up initial data for the component
     * @returns {void}
     * @memberof BenefitDollarsComponent
     */
    ngOnInit(): void {
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.isLoading = true;
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        this.currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        if (this.store.selectSnapshot(AccountInfoState).accountInfo !== null) {
            this.payFrequencyId = this.store.selectSnapshot(AccountInfoState).accountInfo.payFrequencyId;
            if (this.payFrequencyId === undefined) {
                this.payFrequencyId = this.DEFAULT_FREQUENCY_ID;
            }
            this.getPayFrequency();
        } else {
            this.getPayFrequencyId();
        }

        this.getAllRegions();
        this.getAllClasses();
        this.getAllProducts();
        this.getFlexDollars();

        if (this.currentAccount && this.currentAccount.status && this.currentAccount.locked) {
            this.isUnPlugged = true;
        }
        this.getApprovalRequests();
        if (this.isAdmin) {
            this.staticUtilService
                .cacheConfigValue("general.download.erisa.url")
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((erisaCertFormLink) => {
                    this.erisaMessage = this.erisaMessage
                        .replace("##anchorstart##", `<a target="_blank" href="${erisaCertFormLink}">`)
                        .replace("##anchorend##", "</a>");
                    this.erisaMessage = this.erisaMessage.replace(/(##boldstart##)/g, "<b>").replace(/(##boldend##)/g, "</b>");
                    this.erisaMessage = this.erisaMessage.replace(/(##underlinestart##)/g, "<u>").replace(/(##underlineend##)/g, "</u>");
                    this.erisaMessageHtml = this.domSanitizer.bypassSecurityTrustHtml(this.erisaMessage);
                });
        }
        this.checkForVestedAgents();
        this.currentAccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.utilService
            .validateZip(this.currentAccountDetails.situs.state.abbreviation, this.currentAccountDetails.situs.zip)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.validZip = resp;
            });
    }
    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        combineLatest([
            this.staticUtilService.hasPermission(Permission.BENEFIT_BANK_CREATE),
            this.staticUtilService.hasPermission(Permission.BENEFIT_BANK_UPDATE),
            this.staticUtilService.hasPermission(Permission.BENEFIT_BANK_DELETE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([benefitCreate, benefitUpdate, benefitDelete]) => {
                this.isVestedAgent = !benefitCreate && !benefitUpdate && !benefitDelete;
            });
    }
    getPayFrequencyId(): void {
        this.accountService
            .getAccount(this.mpGroup.toString())
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.payFrequencyId = res.payFrequencyId;
                    this.getPayFrequency();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * @function getPayFrequency
     * @description method to get all pay frequencies available for an account
     * @returns {void}
     * @memberof BenefitDollarsComponent
     */
    getPayFrequency(): void {
        this.accountService
            .getPayFrequencies()
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.payFrequencies = res;
                    this.payFrequency =
                        this.payFrequencyId === undefined
                            ? res.find((x) => x.id === this.DEFAULT_FREQUENCY_ID)
                            : res.find((x) => x.id === this.payFrequencyId);
                    this.payFrequencyName = this.payFrequency.name;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * Checks for states which are excluded from benefit dollars
     *
     * @param benefitOfferingState - Snapshot of benefit offering state
     */
    checkForExcludedStates(benefitOfferingState: BenefitsOfferingStateModel): void {
        const states = benefitOfferingState.benefitOferingStates;
        if (states.length === 1) {
            this.isNY = states[0].abbreviation === NY_ABBR;
        }
        this.excludedStateList.forEach((excludedState) => {
            const matchedState = states.find((state) => state.abbreviation === excludedState);
            if (matchedState) {
                this.invalidStates.push(matchedState.name);
                this.stateNYorOH = true;
            }
        });
        this.validStates = states.filter((state) => !this.excludedStateList.find((excludedState) => excludedState === state.abbreviation));
    }

    /**
     * Fetches all product offerings
     */
    getAllProducts(): void {
        const benefitOfferingState = this.store.selectSnapshot(BenefitsOfferingState);

        this.staticUtilService
            .cacheConfigValue("general.enrollment.benefitDollar.excluded.state.list")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((stateList) => {
                this.excludedStateList = stateList.split(",");
                this.checkForExcludedStates(benefitOfferingState);
            });

        const productsTabView = benefitOfferingState.productsTabView;
        if (productsTabView && productsTabView.length > 0) {
            const products = productsTabView.map((x) => {
                const obj = Object.assign({}, x);
                obj.name = x.productName;
                obj.id = benefitOfferingState.allProducts.find((y) => y.name === x.productName).id;
                return obj;
            });
            this.allProducts = products;
        } else {
            const products = benefitOfferingState.allProducts;
            const approvedProductChoices = benefitOfferingState.productChoices;
            const unApprovedProductChoices = benefitOfferingState.unApprovedProductChoices;
            this.allProducts = products.filter(
                (x) => approvedProductChoices.map((y) => y.id).includes(x.id) || unApprovedProductChoices.map((y) => y.id).includes(x.id),
            );
        }

        const dups = [];
        this.allProducts = this.allProducts.filter((el) => {
            if (dups.indexOf(el.id) === -1) {
                dups.push(el.id);
                return true;
            }
            return false;
        });
    }

    getAllClasses(): void {
        this.accountProfileService
            .getClassTypes(this.mpGroup.toString())
            .pipe(take(1))
            .subscribe(
                (classTypesResponse: ClassType[]) => {
                    this.classNames = [];
                    this.allClassesTypes = classTypesResponse;
                    for (const [i, classType] of classTypesResponse.entries()) {
                        this.accountProfileService
                            .getClasses(classType.id, this.mpGroup.toString())
                            .pipe(take(1))
                            .subscribe(
                                (Response) => {
                                    this.classNames.push(...Response.filter((x) => x.name !== ""));
                                    this.classNames.forEach((element) => {
                                        element["classTypeId"] = classType.id;
                                        if (i === classTypesResponse.length - 1) {
                                            this.isLoading = false;
                                        }
                                    });
                                    this.allClasses = this.classNames;
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getAllRegions(): void {
        this.accountProfileService
            .getRegionTypes(this.mpGroup)
            .pipe(take(1))
            .subscribe(
                (regionTypesResponse: RegionType[]) => {
                    this.regionNames = [];
                    regionTypesResponse.forEach((regionType) => {
                        this.accountProfileService
                            .getRegions(regionType.id, this.mpGroup)
                            .pipe(take(1))
                            .subscribe(
                                (regions: Region[]) => {
                                    this.regionNames.push(...regions.filter((x) => x.name !== ""));
                                    this.allRegions = this.regionNames;
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    });
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * add benefit dollar offering
     */
    addOffering(): void {
        if (!this.isRequestPending) {
            this.displayAddEdit = true;
        }
    }

    editOffering(event: any): void {
        this.displayAddEdit = true;
        this.currentOffering = this.offeringList.find((x) => x.id === event);
    }

    hideAddEditOffering(event: any): void {
        this.isLoadingFromEvent = true;
        this.displayAddEdit = false;
        this.currentOffering = null;
        if (event === "save") {
            this.getFlexDollars();
        }
    }

    /**
     * open remove modal
     * @param id id for benefit dollar
     */
    removeOffering(id: number): void {
        const offering = this.offeringList.find((ele) => ele.id === id);
        const REMOVE_TEXT = this.language.fetchPrimaryLanguageValue("primary.portal.common.remove");
        const CANCEL_TEXT = this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel");
        const CONTENT_TEXT = this.isAdmin
            ? ""
            : this.language.fetchPrimaryLanguageValue("primary.portal.maintenanceBenefitsOffering.benefitDollar.removeDialog.content");
        const dialogData: MonDialogData = {
            title: `${REMOVE_TEXT} ${offering.name} ?`,
            content: CONTENT_TEXT,
            primaryButton: {
                buttonTitle: REMOVE_TEXT,
                buttonAction: this.deleteFlexDollar.bind(this, id),
            },
            secondaryButton: {
                buttonTitle: CANCEL_TEXT,
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }

    /**
     * get flex dollars
     */
    getFlexDollars(): void {
        this.isLoading = true;
        this.offeringList = [];
        forkJoin(
            this.accountService.getFlexDollars(this.mpGroup.toString(), this.AUDIENCEGROUPINGID),
            this.isAdmin ? of([]) : this.accountService.getFlexDollars(this.mpGroup.toString(), this.AUDIENCEGROUPINGID, true),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([approvedList, unapprovedList]) => {
                    if (!this.isAdmin) {
                        const unapprovedResult = unapprovedList.map((x) => {
                            const obj = Object.assign({}, x);
                            obj.isApproved = false;
                            return obj;
                        });
                        this.offeringList.push(...unapprovedResult);
                        approvedList = approvedList.filter(
                            (approved) => !unapprovedList.some((unapproved) => unapproved.id === approved.id),
                        );
                    }
                    const approvedResult = approvedList.map((x) => {
                        const obj = Object.assign({}, x);
                        obj.isApproved = true;
                        return obj;
                    });
                    this.offeringList.push(...approvedResult);
                    this.offeringList.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
                    this.emitUnApprovedOfferings.emit(unapprovedList.length);
                    if (unapprovedList.length > 0) {
                        this.isApprovalPending = true;
                    } else {
                        this.isApprovalPending = false;
                    }
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * delete flex dollar
     * @param flexDollarId flex dollar id
     */
    deleteFlexDollar(flexDollarId: number): void {
        this.isLoading = true;
        this.accountService
            .deleteFlexDollar(flexDollarId, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.getFlexDollars();
                },
                (err) => {
                    this.getFlexDollars();
                    this.isLoading = false;
                },
            );
    }

    getApprovalRequests(): void {
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroup)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.approvalRequests = res;
                    this.getAccountMainntanaceLockstatus();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getAccountMainntanaceLockstatus(): void {
        this.isLoading = true;
        this.appTakerService
            .getMaintananceLock(this.mpGroup.toString())
            .pipe(take(1))
            .subscribe(
                (response) => {
                    this.accountLocked = !response;
                    this.isLoading = false;
                    this.setIsRequestPendingFlag();
                },
                () => {
                    this.isLoading = false;
                    this.setIsRequestPendingFlag();
                },
            );
    }

    /**
     * This method is used to set approval request pending alert
     */
    setIsRequestPendingFlag(): void {
        const recentApprovalRequest = this.approvalRequests.pop();
        this.isRequestPending = false;
        if (
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HQ) ||
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HR) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.locked && this.accountLocked)
        ) {
            this.isRequestPending = true;
        }
        this.isRequestCompleted = true;
    }

    /**
     * clean up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
