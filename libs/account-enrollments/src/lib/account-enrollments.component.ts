import { Component, OnInit, ViewChild, AfterViewInit, HostListener, OnDestroy, QueryList, ViewChildren } from "@angular/core";
import { BUSINESS_ENROLLMENT_TYPE, AccountService, AccountDetails } from "@empowered/api";
import { AccountImportTypes } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { ActivatedRoute } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UnsentEnrollmentsComponent } from "./unsent-enrollments/unsent-enrollments.component";
import { SentEnrollmentsComponent } from "./sent-enrollments/sent-enrollments.component";
import { MatTabGroup } from "@angular/material/tabs";
import { Subject, Observable, of } from "rxjs";
import { takeUntil, switchMap, filter, tap } from "rxjs/operators";
import { AddEnrollments, SetDirect, AccountInfoState } from "@empowered/ngxs-store";
const DIRECT_ACCOUNT = "DIRECT";

@Component({
    selector: "empowered-account-enrollments",
    templateUrl: "./account-enrollments.component.html",
    styleUrls: ["./account-enrollments.component.scss"],
})
export class AccountEnrollmentsComponent implements OnInit, AfterViewInit, OnDestroy {
    portal: string;
    routeAfterLogin: string;
    currentAccount: AccountDetails;
    memberid: number;
    mpGroupId: number;
    isDirectAccount$: Observable<boolean>;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    accountImportType = AccountImportTypes;
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.accountEnrollments.scheduleSentBusiness",
        "primary.portal.accountEnrollments.agBusinessTransmittedToAflac",
        "primary.portal.createReportForm.includeEnrollments.sent",
        "primary.portal.createReportForm.includeEnrollments.unsent",
    ]);
    @ViewChild("tabs") tabs: MatTabGroup;
    @ViewChild(UnsentEnrollmentsComponent) unsentComponent: UnsentEnrollmentsComponent;
    @ViewChild(SentEnrollmentsComponent) sentComponent: SentEnrollmentsComponent;
    @ViewChildren(UnsentEnrollmentsComponent) unsentComponents: QueryList<UnsentEnrollmentsComponent>;
    activeIndex = 0;

    constructor(
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly langService: LanguageService,
    ) {
        this.getAccountInfo();
    }

    /**
     * Life cycle hook to initialize the component,
     * Get language strings
     * Route to unsent enrollment component
     */
    ngOnInit(): void {
        const enrollment: any = {
            configurations: [],
            unsentEnrollments: [],
            sentEnrollments: [],
            commissionList: [],
            sitCodes: [],
            activeMemberId: this.memberid,
            mpGroupId: this.mpGroupId,
        };
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.route.parent.parent.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.mpGroupId = params["mpGroupId"];
            if (!this.mpGroupId) {
                // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow
                this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
                    this.mpGroupId = params["mpGroupId"];
                    enrollment["mpGroupId"] = this.mpGroupId;
                    this.store.dispatch(new AddEnrollments(enrollment, BUSINESS_ENROLLMENT_TYPE.UNSENT));
                    this.store.dispatch(new SetDirect(true));
                });
            } else {
                enrollment["mpGroupId"] = this.mpGroupId;
                this.store.dispatch(new AddEnrollments(enrollment, BUSINESS_ENROLLMENT_TYPE.UNSENT));
                this.store.dispatch(new SetDirect(false));
            }
        });
    }

    /**
     * Start watching for click events and initialize unsent component
     */
    ngAfterViewInit(): void {
        // eslint-disable-next-line no-underscore-dangle
        this.tabs._handleClick = this.interceptTabChange.bind(this);
        this.unsentComponents.changes.pipe(
            filter((components) => components.length),
            tap((components) => (components.first as UnsentEnrollmentsComponent).initialize()),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Initializes or resets the the unsent component based on the passed in tab index
     * @param index tab index
     */
    showTab(index: number): void {
        this.activeIndex = index;
        if (index === 0) {
            this.unsentComponent.initialize();
        } else if (index === 1) {
            this.unsentComponent.resetSelections();
            this.unsentComponent.unsentEnrollmentForm.markAsPristine();
            this.sentComponent.initialize();
        }
    }

    /**
     * Opens alert box when changing tabs with dirty unsent enrollments
     * @returns the handled click
     */
    interceptTabChange(): any {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        if (this.unsentComponent && this.unsentComponent.unsentEnrollmentForm.dirty) {
            this.unsentComponent.allowNavigation = new Subject<boolean>();
            this.unsentComponent.openAlert();
            this.unsentComponent.allowNavigation.pipe(takeUntil(this.unsubscribe$)).subscribe(
                // eslint-disable-next-line no-underscore-dangle
                (res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args),
            );
        } else {
            // eslint-disable-next-line no-underscore-dangle
            return MatTabGroup.prototype._handleClick.apply(this.tabs, args);
        }
    }

    /**
     * Checks whether the navigation can occur
     * @returns whether the navigation can occur or not
     */
    @HostListener("window:beforeunload")
    canDeactivate(): Observable<boolean> | boolean {
        if (this.unsentComponent && this.unsentComponent.checkAlert && this.unsentComponent.unsentEnrollmentForm.dirty) {
            this.unsentComponent.allowNavigation = new Subject<boolean>();
            this.unsentComponent.openAlert();
            return this.unsentComponent.allowNavigation.asObservable();
        }
        return true;
    }

    /**
     * Function is to get account information.
     */
    getAccountInfo(): void {
        this.isDirectAccount$ = this.route.params.pipe(
            switchMap((params) => this.accountService.getAccount(params["mpGroupId"])),
            switchMap((resp) => of(resp.partnerAccountType === DIRECT_ACCOUNT)),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
