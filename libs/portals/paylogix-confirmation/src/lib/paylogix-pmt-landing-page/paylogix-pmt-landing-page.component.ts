import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { MemberService, ShoppingService } from "@empowered/api";
import { CsrfService } from "@empowered/util/csrf";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, takeUntil, tap } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";

const IS_SUCCESS = "Success";
const COMPLETED = "COMPLETE";
@Component({
    selector: "empowered-paylogix-pmt-landing-page",
    templateUrl: "./paylogix-pmt-landing-page.component.html",
    styleUrls: ["./paylogix-pmt-landing-page.component.scss"],
})
export class PaylogixPmtLandingPageComponent implements OnInit, OnDestroy {
    titleMsg$: Observable<string>;
    paymentErrorMsg$: Observable<string>;
    closeMsg: string;
    groupId: number;
    memberId: number;
    showSpinner: boolean;
    isTpi = false;
    isPaymentSaved = 1;
    isSuccess$: Observable<number | HttpErrorResponse>;
    unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.ebs.confirmation.paymentComplete",
        "primary.portal.applicationFlow.ebs.confirmation.paymentError",
        "primary.portal.applicationFlow.ebs.confirmation.paymentSaved",
        "primary.portal.applicationFlow.ebs.confirmation.paymentNotSaved",
        "primary.portal.applicationFlow.ebs.confirmation.closeBrowser",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly route: ActivatedRoute,
        private readonly csrfService: CsrfService,
        private readonly memberService: MemberService,
    ) {}

    /**
     * Initializer to call for into the isSuccess observable and display title and error information based
     * off the results of the URL route and params
     * @returns void
     */
    ngOnInit(): void {
        this.showSpinner = true;
        this.isPaymentSaved = 0;
        this.closeMsg = this.languageStrings["primary.portal.applicationFlow.ebs.confirmation.closeBrowser"];
        this.loadSuccessPage();
        this.showSpinner = false;
        this.groupId = Number(this.route.snapshot.url[0].path);
        this.memberId = Number(this.route.snapshot.url[1].path);
        this.memberService
            .updateEbsPaymentCallbackStatus(this.memberId, this.groupId.toString(), COMPLETED)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    private loadSuccessPage(): void {
        this.isSuccess$ = this.isSuccess();
        this.titleMsg$ = this.isSuccess$.pipe(
            map((success) => {
                if (success) {
                    return this.languageStrings["primary.portal.applicationFlow.ebs.confirmation.paymentComplete"];
                }
                return this.languageStrings["primary.portal.applicationFlow.ebs.confirmation.paymentError"];
            }),
        );
        this.paymentErrorMsg$ = this.isSuccess$.pipe(
            filter((success) => success === 0),
            map(() => {
                if (this.isPaymentSaved) {
                    return this.languageStrings["primary.portal.applicationFlow.ebs.confirmation.paymentSaved"];
                }
                return this.languageStrings["primary.portal.applicationFlow.ebs.confirmation.paymentNotSaved"];
            }),
        );
    }

    /**
     * Sets the value of the isSuccess observable based on URL query param isSuccess
     * off the results of the URL route and params
     * @param mpGroup of type number (from route URL)
     * @param memberId of type number (from route URL)
     * @param isPaymentSaved of type number (from route URL)
     * @returns Observable<number | HttpErrorResponse>. Will be 1 if successful and 0 if not
     */
    isSuccess(): Observable<number | HttpErrorResponse> {
        return combineLatest([this.route.queryParams, this.csrfService.load()]).pipe(
            distinctUntilChanged(),
            filter(([params, csrf]) => this.route?.snapshot?.url?.length > 1),
            tap(([params, csrf]) => {
                if (this.route.snapshot.url.length > 2) {
                    this.isPaymentSaved = Number(this.route.snapshot.url[2].path);
                }
            }),
            map(([params, csrf]) => {
                if (IS_SUCCESS in params) {
                    return Number(params.Success);
                }
                return 0;
            }),
            catchError((error: HttpErrorResponse) => of(error)),
        );
    }
    /**
     * Life cycle hook to clean component data
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
