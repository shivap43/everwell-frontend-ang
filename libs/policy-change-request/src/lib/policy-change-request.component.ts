import { Component, OnInit, AfterViewChecked, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { SideNavService } from "./policy-change-request-flow/side-nav/services/side-nav.service";
import { UserService } from "@empowered/user";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { Subscription } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { MemberInfoState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-policy-change-request",
    templateUrl: "./policy-change-request.component.html",
    styleUrls: ["./policy-change-request.component.scss"],
})
export class PolicyChangeRequestComponent implements OnInit, AfterViewChecked, OnDestroy {
    subscriptions: Subscription[] = [];
    defaultStepPosition = 1;
    memberId: number;
    policyFlowIndex: number;
    MemberInfo: any;
    policyHolderName: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.close"]);

    constructor(
        private readonly sideNavService: SideNavService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly user: UserService,
        private readonly cdRef: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
    ) {
        this.subscriptions.push(
            this.sideNavService.policyFlow$.asObservable().subscribe((value) => {
                this.policyFlowIndex = value;
            }),
        );
    }

    /**
     * Angular life-cycle hook : ngOnInit
     * Set the member Id to determine PCR flow
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.user.credential$
                .pipe(withLatestFrom(this.store.select(MemberInfoState.GetMemberId)))
                .subscribe(([credential, memberId]) => {
                    if ("memberId" in credential && this.router.url.indexOf("member") > -1) {
                        // When in MMP:
                        this.memberId = credential.memberId;
                    } else if ((this.router.url.indexOf("member") > -1 || this.router.url.indexOf("direct") > -1) && memberId) {
                        // When in MPP / MAP and this is the employee-specific PCR page or Direct Customer PCR:
                        this.memberId = memberId;
                    }
                    // If neither of these conditions is true memberId is undefined and account-specific PCR is rendered.
                }),
        );

        this.sideNavService.defaultStepPositionChanged$.next(1);
    }

    // This method will close the modal.
    closeModal(): void {
        this.sideNavService.removeTransactionScreenFromStore(true);
        this.dialog.closeAll();
    }

    isPolicyFlowIndex(id: number): boolean {
        this.policyHolderName = this.sideNavService.getPolicyHolderName();
        return this.policyFlowIndex === id;
    }

    ngAfterViewChecked(): void {
        this.cdRef.detectChanges();
    }
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
