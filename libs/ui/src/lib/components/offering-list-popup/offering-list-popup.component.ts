import { forkJoin, Subject, Observable, Subscription } from "rxjs";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { AccountService, BenefitDollars, MemberService } from "@empowered/api";
import { Name, Product, MemberFlexDollar } from "@empowered/constants";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { takeUntil, first, tap, switchMap, map, shareReplay } from "rxjs/operators";
import { MPGroupAccountService } from "@empowered/common-services";
import { EnrollmentMethodState } from "@empowered/ngxs-store";

interface DialogData {
    mpGroup: number;
    memberId: number;
    filter: boolean;
    product: Product;
    flexDollars: MemberFlexDollar[];
}

@Component({
    selector: "empowered-offering-list-popup",
    templateUrl: "./offering-list-popup.component.html",
    styleUrls: ["./offering-list-popup.component.scss"],
})
export class OfferingListPopupComponent implements OnInit, OnDestroy {
    offeringList = [];
    mpGroup: number;
    memberId: number;
    memberName = "";
    isLoading: boolean;
    response: Name;
    subscriptions: Subscription[] = [];
    private readonly unsubscribe$ = new Subject<void>();
    accountPayrollFrequency$: Observable<string>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.shoppingCart.benefitDollar.headerMessage",
        "primary.portal.shoppingCart.benefitDollar.member.headerMessage",
        "primary.portal.benefitDollars.payment.message",
    ]);
    costAdjustmentMessage = "";
    benefitDollars = BenefitDollars;
    payFrequencyId: number;
    readonly PAY_FREQUENCY_SHORT_LENGTH = 20;

    constructor(
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly dialogRef: MatDialogRef<OfferingListPopupComponent>,
        private readonly language: LanguageService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly memberService: MemberService,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
    ) {}

    /**
     * initialize data to display in popup
     */
    ngOnInit(): void {
        this.mpGroup = this.data.mpGroup;
        this.memberId = this.data.memberId ? this.data.memberId : this.store.selectSnapshot(EnrollmentMethodState.getUniqueMemberId);
        if (!this.data.flexDollars) {
            this.getFlexDollars();
        } else {
            this.setOfferingList(this.data.flexDollars);
        }
        this.accountPayrollFrequency$ = forkJoin(
            this.mpGroupAccountService.mpGroupAccount$.pipe(first()),
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
        ).pipe(
            takeUntil(this.unsubscribe$),
            tap(([account, member]) => {
                this.response = member.body.name;
                this.memberName = `${this.response.firstName} ${this.response.lastName}`;
                this.payFrequencyId = member.body?.workInformation?.payrollFrequencyId;
                if (this.data.memberId) {
                    this.costAdjustmentMessage = this.languageStrings[
                        "primary.portal.shoppingCart.benefitDollar.member.headerMessage"
                    ].replace("{accountName}", account.name);
                } else {
                    this.costAdjustmentMessage = this.languageStrings["primary.portal.shoppingCart.benefitDollar.headerMessage"]
                        .replace("{accountName}", account.name)
                        .replace("{employeeName}", this.memberName);
                }
            }),

            // Get employee payFrequency type & publish
            switchMap(() =>
                this.accountService.getPayFrequencies(this.mpGroup?.toString()).pipe(
                    first(),
                    map((payFrequencies) => payFrequencies?.find((x) => x.id === this.payFrequencyId)?.name),
                ),
            ),
            shareReplay(1),
        );
    }

    /**
     * get flex dollars
     */
    getFlexDollars(): void {
        this.offeringList = [];
        this.accountService
            .getFlexDollarsOfMember(this.memberId, null)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                const flexDollars: MemberFlexDollar[] = response.map((flexDollar) => ({ ...flexDollar, isApproved: true }));
                this.setOfferingList(flexDollars);
            });
    }
    /**
     * Method to set offering list
     * @param flexDollars Offerings of Flex Dollars
     */
    setOfferingList(flexDollars: MemberFlexDollar[]): void {
        if (this.data.filter && this.data.product && flexDollars.length) {
            flexDollars = flexDollars.filter((product) => product.applicableProductId === this.data.product.id);
        }

        if (flexDollars && flexDollars.length) {
            this.offeringList = flexDollars;
            this.offeringList.sort((total, current) => (total.id > current.id ? 1 : current.id > total.id ? -1 : 0));
        }
    }

    /**
     * closing popup
     */
    closePopup(): void {
        this.dialogRef.close();
    }

    /**
     * unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
