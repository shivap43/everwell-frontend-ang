import { takeUntil, catchError, switchMap, tap } from "rxjs/operators";
import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import {
    AccountService,
    ClassType,
    ClassNames,
    Region,
    BenefitsOfferingService,
    AccountList,
    AppTakerService,
    FlexDollar,
    ApprovalRequest,
    ApprovalRequestStatus,
} from "@empowered/api";
import { PayFrequency, CountryState, Product } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { ProductsPlansQuasiService } from "../../maintenance-benefits-offering/products-plans-quasi";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { AddEditOfferingComponent } from "./add-edit-offering/add-edit-offering.component";

import {
    AccountListState,
    BenefitsOfferingState,
    BenefitsOfferingStateModel,
    AccountInfoState,
    filterNullValues,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Subject, of, Observable, forkJoin } from "rxjs";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { EmpoweredModalService } from "@empowered/common-services";

const AUDIENCE_GROUPING_ID = "audienceGroupingId";
const DEFAULT_FREQUENCY_ID = 2;
const SAVE = "save";

@Component({
    selector: "empowered-benefit-dollars",
    templateUrl: "./benefit-dollars.component.html",
    styleUrls: ["./benefit-dollars.component.scss"],
})
export class BenefitDollarsComponent implements OnInit, OnDestroy {
    isBenefitDollarsZeroState = false;
    isNewOffering = false;
    displayAddEdit: boolean;
    mpGroup: number;
    currentOffering: FlexDollar;
    allClassesTypes: ClassType[] = [];
    allClasses: ClassNames[];
    classNames: ClassNames[] = [];
    allRegions: Region[];
    regionNames: Region[] = [];
    allProducts: Product[];
    offeringList: FlexDollar[] = [];
    isApprovalPending = false;
    isUnplugged = false;
    isLoading: boolean;
    isLoadingFromEvent = false;
    payFrequencyId: number;
    payFrequency: PayFrequency;
    payFrequencyName = "";
    currentAccount: AccountList;
    accountLocked: boolean;
    isRequestPending: boolean;
    approvalRequests: ApprovalRequest[] = [];
    @Output() emitUnApprovedOfferings = new EventEmitter<number>();
    @Output() emitBenefitDollarCount = new EventEmitter<number>();
    categoryIdEvent: EventEmitter<FlexDollar[]> = new EventEmitter<FlexDollar[]>();
    payFrequencies: PayFrequency[];
    selectedProducts: Product[];
    excludedStateList: string[];
    invalidStates: string[] = [];
    validStates: CountryState[] = [];
    stateNYorOH: boolean;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.description",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.createNewOffering",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.displayAddEditZeroState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.zeroState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.benefitDollars",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.noBenefitDollars",
        "primary.portal.common.remove",
        "primary.portal.common.cancel",
        "primary.portal.members.removeDependentList.title",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAvailableForEnrollments",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAvailableForEnrollments",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAllowedInState",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAllowed",
    ]);
    isAdmin: boolean;
    readonly INVALID_STATE_COUNT_ONE = 1;
    readonly INVALID_STATE_COUNT_TWO = 2;

    constructor(
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly appTakerService: AppTakerService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitService: BenefitOfferingHelperService,
    ) {}

    /**
     * @function ngOnInit
     * @description To set-up initial data for the benefit dollar
     * @memberof BenefitDollarsComponent
     */
    ngOnInit(): void {
        this.isBenefitDollarsZeroState = true;
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.isLoading = true;
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        if (this.store.selectSnapshot(AccountInfoState).accountInfo !== null) {
            this.payFrequencyId = this.store.selectSnapshot(AccountInfoState).accountInfo.payFrequencyId;
            if (this.payFrequencyId === undefined) {
                this.payFrequencyId = DEFAULT_FREQUENCY_ID;
            }
            this.getPayFrequencies().subscribe();
        } else {
            this.getPayFrequencyId();
        }
        this.benefitService.currentSelectedProduct$.pipe(filterNullValues(), takeUntil(this.unsubscribe$)).subscribe((product) => {
            this.selectedProducts = product;
        });
        this.getAllProducts();
        this.getFlexDollars().subscribe();
        if (this.currentAccount && this.currentAccount.locked) {
            this.isUnplugged = true;
        }
        this.getApprovalRequests();
    }
    /**
     * @description get all frequency list from api
     */
    getPayFrequencyId(): void {
        this.accountService
            .getAccount(this.mpGroup.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => {
                    this.payFrequencyId = res.payFrequencyId;
                    return this.getPayFrequencies();
                }),
                catchError((err) => {
                    this.isLoading = false;
                    return of(null);
                }),
            )
            .subscribe();
    }
    /**
     * @function getPayFrequency
     * @description method to get all pay frequencies available for an account
     * @returns Observable<void>
     */
    getPayFrequencies(): Observable<void> {
        return this.accountService.getPayFrequencies().pipe(
            takeUntil(this.unsubscribe$),
            switchMap((res) => {
                this.payFrequencies = res;
                this.payFrequency =
                    this.payFrequencyId === undefined
                        ? res.find((frequency) => frequency.id === DEFAULT_FREQUENCY_ID)
                        : res.find((frequency) => frequency.id === this.payFrequencyId);
                this.payFrequencyName = this.payFrequency.name;
                return of(null);
            }),
            catchError((err) => {
                this.isLoading = false;
                return of(null);
            }),
        );
    }
    /**
     * Checks for states which are excluded from benefit dollars
     *
     * @param benefitOfferingState - Snapshot of benefit offering state
     */
    checkForExcludedStates(benefitOfferingState: BenefitsOfferingStateModel): void {
        const states = benefitOfferingState.benefitOferingStates;
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
     * function to get all selected products from that IBO
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
        if (this.selectedProducts && this.selectedProducts.length > 0) {
            this.allProducts = this.selectedProducts;
        } else {
            const products = benefitOfferingState.allProducts;
            const approvedProductChoices = benefitOfferingState.productChoices;
            const unApprovedProductChoices = benefitOfferingState.unApprovedProductChoices;
            this.allProducts = products.filter(
                (prod) =>
                    approvedProductChoices.find((approvedProd) => approvedProd.id === prod.id) ||
                    unApprovedProductChoices.find((unApprovedProd) => unApprovedProd.id === prod.id),
            );
        }
    }
    /**
     * function to open quasi modal for add offering
     */
    addOffering(): void {
        this.displayAddEdit = true;
        const benefitDollarDialogRef = this.empoweredModalService.openDialog(AddEditOfferingComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-edit-flex-dollars",
            backdropClass: "backdrop-blur",
            data: {
                currentOffering: null,
                allProducts: this.allProducts,
                payFrequency: this.payFrequency,
                payFrequencies: this.payFrequencies,
            },
        });
        benefitDollarDialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.getFlexDollars()),
            )
            .subscribe();
    }
    /**
     * function to open quasi modal for editing selected offering
     * @param event selected offering id
     */
    editOffering(event: number): void {
        this.displayAddEdit = true;
        this.currentOffering = this.offeringList.find((offeringDetails) => offeringDetails.id === event);
        const editDollarDialogRef = this.empoweredModalService.openDialog(AddEditOfferingComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-edit-flex-dollars",
            backdropClass: "backdrop-blur",
            data: {
                currentOffering: this.currentOffering,
                allProducts: this.allProducts,
                payFrequency: this.payFrequency,
                payFrequencies: this.payFrequencies,
            },
        });
        editDollarDialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.getFlexDollars()),
            )
            .subscribe();
    }

    /**
     * Function to hide add/edit offering
     * @param event action on the event
     */
    hideAddEditOffering(event: string): void {
        this.isLoadingFromEvent = true;
        this.displayAddEdit = false;
        this.currentOffering = null;
        if (event === SAVE) {
            this.getFlexDollars().subscribe();
        }
    }

    /**
     * function to open remove offering modal
     * @param id selected offering id
     */
    removeOffering(id: number): void {
        const offering = this.offeringList.find((ele) => ele.id === id);
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.members.removeDependentList.title"].replace("#name", offering.name),
            content: "",
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.remove"],
                buttonAction: this.deleteFlexDollar.bind(this, id),
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
            },
        };
        this.empoweredModalService.openDialog(MonDialogComponent, {
            data: dialogData,
        });
    }

    /**
     * function to get flex dollar list from API
     * @returns Observable<void>
     */
    getFlexDollars(): Observable<void> {
        this.isLoading = true;
        this.offeringList = [];
        return forkJoin(
            this.accountService.getFlexDollars(this.mpGroup.toString(), AUDIENCE_GROUPING_ID),
            this.accountService.getFlexDollars(this.mpGroup.toString(), AUDIENCE_GROUPING_ID, true),
        ).pipe(
            takeUntil(this.unsubscribe$),
            switchMap(([approvedList, unapprovedList]) => {
                const unapprovedResult = unapprovedList.map((x) => {
                    const obj = Object.assign({}, x);
                    obj.isApproved = false;
                    return obj;
                });
                this.offeringList.push(...unapprovedResult);
                const approvedResult = approvedList
                    .filter((approved) => !unapprovedList.some((unapproved) => unapproved.id === approved.id))
                    .map((x) => {
                        const obj = Object.assign({}, x);
                        obj.isApproved = true;
                        return obj;
                    });
                this.offeringList.push(...approvedResult);
                this.offeringList.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
                this.emitUnApprovedOfferings.emit(unapprovedList.length);
                this.isApprovalPending = unapprovedList.length > 0;
                this.isLoading = false;
                this.emitBenefitDollarCount.emit(this.offeringList.length);
                this.categoryIdEvent.emit(this.offeringList);
                return of(null);
            }),
            catchError((error) => {
                this.isLoading = false;
                return of(null);
            }),
        );
    }

    /**
     * function to remove selected flex dollar
     * @param flexDollarId selected flex dollar id
     */
    deleteFlexDollar(flexDollarId: number): void {
        this.isLoading = true;
        this.accountService
            .deleteFlexDollar(flexDollarId, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => {
                    this.isLoading = false;
                    return this.getFlexDollars();
                }),
                catchError((errorResp) => {
                    this.isLoading = false;
                    return this.getFlexDollars();
                }),
            )
            .subscribe();
    }

    /**
     * function to get approval details of offerings
     */
    getApprovalRequests(): void {
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => {
                    this.approvalRequests = res;
                    return this.getAccountMaintenanceLockStatus();
                }),
                catchError((errorResp) => {
                    this.isLoading = false;
                    return of(null);
                }),
            )
            .subscribe();
    }

    /**
     * Function to get account status and set pending flag as per that
     * @returns lock status value
     */
    getAccountMaintenanceLockStatus(): Observable<void> {
        this.isLoading = true;
        return this.appTakerService.getMaintananceLock(this.mpGroup.toString()).pipe(
            takeUntil(this.unsubscribe$),
            tap(() => {
                this.isLoading = false;
                this.setIsRequestPendingFlag();
            }),
            switchMap((response) => {
                this.accountLocked = !response;
                this.isLoading = false;
                this.setIsRequestPendingFlag();
                return of(null);
            }),
            catchError((errorResp) => {
                this.isLoading = false;
                return of(null);
            }),
        );
    }

    /**
     * function to set pending flag depending on the request status
     */
    setIsRequestPendingFlag(): void {
        const recentApprovalRequest = this.approvalRequests.pop();
        this.isRequestPending = false;
        if (
            (recentApprovalRequest && recentApprovalRequest.status === ApprovalRequestStatus.SUBMITTED) ||
            (recentApprovalRequest && recentApprovalRequest.status === ApprovalRequestStatus.SUBMITTED_TO_HR) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.locked && this.accountLocked)
        ) {
            this.isRequestPending = true;
        }
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
