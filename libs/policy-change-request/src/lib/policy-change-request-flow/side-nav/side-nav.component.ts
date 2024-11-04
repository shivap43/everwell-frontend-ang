import { UserService } from "@empowered/user";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { SideNavService } from "./services/side-nav.service";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { takeUntil, take, pluck } from "rxjs/operators";
import { PolicyChangeRequestState } from "@empowered/ngxs-store";
import { RouterState, RouterStateModel } from "@ngxs/router-plugin";
import { MemberInfoState, AccountListState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-side-nav",
    templateUrl: "./side-nav.component.html",
    styleUrls: ["./side-nav.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class SideNavComponent implements OnInit, OnDestroy {
    @ViewChild("stepper") stepper;
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("ulTransactionsList", { static: true }) ulTransactionsList;
    defaultStepPosition;
    stepperIndex: number;
    requestPolicyChanges: any;
    transactionForms = [];
    dispalyFormList: boolean;
    memberId: number;
    mpGroup: number;
    MemberInfo: any;
    isLoading: boolean;
    isFirstStepCompleted: boolean;
    isSecondStepCompleted: boolean;
    isThirdStepCompleted: boolean;
    isFourStepCompleted: boolean;
    presentPolicyIndex = 0;
    private unsubscribe$ = new Subject<void>();
    @Select(RouterState) router$: Observable<RouterStateModel>;

    constructor(
        private sideNavService: SideNavService,
        private router: Router,
        private store: Store,
        public user: UserService,
        private activatedRoute: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        const event = { selectedIndex: 0 };
        this.getMpGroup();

        this.sideNavService.stepClicked$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            this.progressIndicator.selectedIndex = step;
        });

        this.sideNavService.defaultStepPositionChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentStep) => {
            this.requestPolicyChanges = this.store.selectSnapshot(PolicyChangeRequestState.GetRequestPolicyChanges);

            if (this.requestPolicyChanges) {
                this.transactionForms = this.requestPolicyChanges.requestPolicyChanges;
            }
            this.defaultStepPosition = currentStep;

            if (this.progressIndicator.selected !== undefined) {
                this.progressIndicator.selected.completed = true;
            }
            this.progressIndicator.linear = false;
            this.progressIndicator.selectedIndex = currentStep - 1;
            this.progressIndicator.linear = true;
        });

        this.onStepChange(event);
    }

    /**
     * function to set the mpGroup and memberId
     * mpGroup value for direct flow is set from route state
     * @returns void
     */
    getMpGroup(): void {
        this.isLoading = true;
        const mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
        if (mpGroupObj) {
            this.mpGroup = mpGroupObj.id;
        }
        if (this.router.url.indexOf("direct") > -1) {
            this.router$.pipe(pluck("state", "params", "mpGroupId"), takeUntil(this.unsubscribe$)).subscribe((groupId) => {
                this.mpGroup = +groupId;
            });
        }
        this.memberId = +this.store.selectSnapshot(MemberInfoState.GetMemberId);
        this.user.credential$.pipe(take(1)).subscribe((credential) => {
            if ("memberId" in credential && !this.memberId && this.router.url.indexOf("member") > -1) {
                this.memberId = credential.memberId;
            }
        });
        this.isLoading = false;
    }

    convertTransactionFormName(transaction: string): string | undefined {
        if (transaction) {
            return transaction.replace(/ |\//g, "-").toLowerCase();
        }
        return undefined;
    }

    onStepChange(event: any): void {
        if (event.selectedIndex === 1 && event.previouslySelectedIndex === 2) {
            event.selectedStep.completed = false;
        } else if (event.selectedIndex === 1) {
            this.sideNavService.setEnableNextScreen();
            this.isFirstStepCompleted = true;
        } else if (event.selectedIndex === 2) {
            if (this.sideNavService.getEnableNextScreen()) {
                event.selectedStep.completed = true;
            } else {
                event.selectedStep.completed = false;
            }
        } else if (event.selectedIndex === 3) {
            this.sideNavService.setEnableNextScreen();
            this.isThirdStepCompleted = true;
        }

        this.sideNavService.policyFlow$.next(event.selectedIndex);
    }

    getSelectedScreen(): string {
        return this.sideNavService.getTransactionScreen();
    }

    ngOnDestroy(): void {
        this.sideNavService.defaultStepPositionChanged$.next(1);
        this.sideNavService.stepClicked$.next(0);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
