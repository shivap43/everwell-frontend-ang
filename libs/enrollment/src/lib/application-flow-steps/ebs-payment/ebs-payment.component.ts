import { HttpResponse } from "@angular/common/http";
import { Component, Inject, Input, OnDestroy, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberService, ShoppingService } from "@empowered/api";
import { EbsPaymentRecord, GetCartItems, Portals, StaticStep } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AppFlowService, EnrollmentState, SharedState } from "@empowered/ngxs-store";
import { EBSInfoModalComponent } from "@empowered/ui";
import { Store } from "@ngxs/store";
import { EMPTY, forkJoin, Observable, Subject } from "rxjs";
import { catchError, takeUntil } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-ebs-payment",
    templateUrl: "./ebs-payment.component.html",
    styleUrls: ["./ebs-payment.component.scss"],
    providers: [],
})
export class EBSPaymentComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.ebs.firstTimeUser",
        "primary.portal.applicationFlow.ebs.successfulPage",
        "primary.portal.applicationFlow.ebs.link",
        "primary.portal.applicationFlow.ebs.successfulMsg",
        "primary.portal.applicationFlow.ebs.mandatoryMsg",
        "primary.portal.applicationFlow.ebs.errorMsg",
        "primary.portal.applicationFlow.ebs.title",
        "primary.portal.applicationFlow.ebs.warningMsg",
        "primary.portal.applicationFlow.ebs.modal.continue",
        "primary.portal.common.next",
        "primary.portal.applicationFlow.payments.billing",
        "primary.portal.applicationFlow.payments.nextFinishApplications",
        "primary.portal.applicationFlow.payments.nextAflacAlways",
    ]);
    @Input() ebsPaymentStatus: boolean;
    @Inject(MAT_DIALOG_DATA)
    readonly data: {
        content: string;
    };
    title: string;
    showSpinner: boolean;
    paymentRequired = false;
    ebsPaymentFailed = false;
    paymentPresent = false;
    successPaylogix = false;
    hasAflacAlways: boolean;
    hasDirectBilling: boolean;
    memberId: number;
    mpGroup: number;
    currentEbsOnfile: EbsPaymentRecord;
    private unsubscribe$ = new Subject<void>();
    cartData: GetCartItems[];
    dialogRef: MatDialogRef<EBSInfoModalComponent>;

    constructor(
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly store: Store,
        private readonly appFlowService: AppFlowService,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
    ) {}
    /**
     * Angular lifecycle hook that initiates component class and renders the component view
     */
    ngOnInit(): void {
        this.showSpinner = true;
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        const ebsPayment = this.store.selectSnapshot(EnrollmentState.GetEBSPayment);
        if (ebsPayment.steps) {
            this.title = ebsPayment.steps[0].title;
        }
        this.memberService
            .getEbsPaymentOnFile(this.memberId, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError(() => {
                    this.paymentPresent = false;
                    this.showSpinner = false;
                    return EMPTY;
                }),
            )
            .subscribe((resp) => {
                this.currentEbsOnfile = resp;
                this.paymentPresent = resp.CREDIT_CARD_PRESENT || resp.DIRECT_DEPOSIT || resp.BANK_INFORMATION_PRESENT;
                this.showSpinner = false;
            });

        this.checkAflacAlways();
        const cartItem: GetCartItems[] = this.store.selectSnapshot(EnrollmentState.GetCartItem);
        if (cartItem.length) {
            this.cartData = cartItem.filter((item) => item.id);
        }
        this.checkCompleteStatus();
    }
    /**
     * Method to invoke AFlac EBS
     */
    gotoAflacEBS(): void {
        // There is no operation on dialog close, if EBS payment is successful, the callback lands on payment step
        this.dialogRef = this.empoweredModalService.openDialog(EBSInfoModalComponent, {
            data: {
                isFromNonEnrollmentFlow: false,
                mpGroup: this.mpGroup?.toString(),
                memberId: this.memberId,
            },
        });
        this.dialogRef.afterClosed().subscribe((dialogParams) => {
            this.memberService
                .getEbsPaymentOnFile(this.memberId, this.mpGroup)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError(() => {
                        this.successPaylogix = dialogParams.fromContEbs ? dialogParams.fromContEbs : false;
                        this.ebsPaymentFailed = true;
                        this.paymentPresent = false;
                        return EMPTY;
                    }),
                )
                .subscribe((res) => {
                    this.successPaylogix = dialogParams.fromContEbs ? dialogParams.fromContEbs : false;
                    this.currentEbsOnfile = res;
                    this.paymentPresent = res.CREDIT_CARD_PRESENT || res.DIRECT_DEPOSIT || res.BANK_INFORMATION_PRESENT;
                    this.paymentRequired = !this.paymentPresent;
                });
        });
    }

    /**
     * Method to get Aflac Always and direct billing
     */
    checkAflacAlways(): void {
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasDirectBilling = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment)?.length;
    }
    /**
     * Method to move to next step
     */
    onNext(): void {
        if (this.paymentPresent) {
            forkJoin(this.updateCart(this.currentEbsOnfile))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.appFlowService.planChanged$.next({
                        nextClicked: true,
                        discard: false,
                    });
                    this.appFlowService.lastCompleteStaticStep.next(2);
                });
        } else {
            this.paymentRequired = true;
        }
    }

    /**
     * Method to update cart items with the Ebs payment on file
     */
    updateCart(ebsPaymentOnFile: EbsPaymentRecord): Observable<HttpResponse<unknown>>[] {
        const portal: string = this.store.selectSnapshot(SharedState.portal);
        return this.cartData?.map((cartItem) =>
            this.shoppingService.updateCartItem(this.memberId, this.mpGroup, cartItem.id, {
                ...cartItem,
                planOfferingId: cartItem.planOffering.id,
                riskClassOverrideId: portal !== Portals.MEMBER ? cartItem.riskClassOverrideId : null,
                ebsPaymentOnFile: (Object.keys(ebsPaymentOnFile) as unknown)[0],
            }),
        );
    }

    /** To manipulate step of signature button based on step position
     * @returns void
     */
    checkCompleteStatus(): void {
        this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: StaticStep.ONE_SIGNATURE });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
