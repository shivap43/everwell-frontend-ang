import { AccountService, EnrollmentService, ShoppingService } from "@empowered/api";
import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { take, takeUntil } from "rxjs/operators";

import { SharedState, AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";

import { Subject, combineLatest } from "rxjs";
import { Permission, AppSettings, PartnerAccountType } from "@empowered/constants";

interface DialogData {
    isShop: boolean;
    isCoverageSummary: boolean;
    planName: string;
    mpGroup: number;
    memberId: number;
    enrollId: number;
    productId: number;
}

@Component({
    selector: "empowered-void-coverage",
    templateUrl: "./void-coverage.component.html",
    styleUrls: ["./void-coverage.component.scss"],
})
export class VoidCoverageComponent implements OnInit, OnDestroy {
    voidCoverageReasons: any[] = [];
    voidCoverageForm: FormGroup;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.voidCoverage.applicationNotBeProcessed",
        "primary.portal.editCoverage.cancel",
        "primary.portal.editCoverage.voidCoverage",
        "primary.portal.editCoverage.notes",
        "primary.portal.common.close",
        "primary.portal.editCoverage.reason",
        "primary.portal.common.placeholderSelect",
        "primary.portal.voidCoverage.withdrawApplication",
    ]);
    isProducer = false;
    isMember = false;
    isAdmin = false;
    isTPI = false;
    CANCEL = "cancel";
    UserPermissions = Permission;
    isVoidReason = false;
    isVoidComment = false;
    isLoading = false;
    voidCoverageRequest = null;
    VOID_REASON_CONFIG = "general.feature.policy.void.reason.enable";
    VOID_COMMENT_CONFIG = "general.feature.policy.void.comment.enable";
    isDirect = false;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<VoidCoverageComponent>,
        private readonly enrollmentService: EnrollmentService,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly appFlowService: AppFlowService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accService: AccountService,
        private readonly shoppingService: ShoppingService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * get void coverage reasons and also check whether we're in TPI flow
     */
    ngOnInit(): void {
        this.isTPI = this.router.url.indexOf(AppSettings.TPI) > 0;
        this.voidCoverageForm = this.fb.group({
            voidReasons: ["Select", Validators.required],
            notes: [""],
        });
        this.enrollmentService
            .getCoverageVoidReasons(this.data.mpGroup)
            .pipe(take(1))
            .subscribe((reasons) => {
                this.voidCoverageReasons = reasons;
            });
        this.getVoidConfig();
        this.isProducer = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_PRODUCER;
        this.isMember = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_MEMBER;
        this.isAdmin = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_ADMIN;
        this.accService
            .getAccount(this.data.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((account) => {
                this.isDirect = account.partnerAccountType === PartnerAccountType.DIRECT;
            });
    }
    /**
     * Get void reason and comment config and set appropriate flags
     * @returns void
     */
    getVoidConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(this.VOID_REASON_CONFIG),
            this.staticUtilService.cacheConfigEnabled(this.VOID_COMMENT_CONFIG),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([reason, comment]) => {
                this.isVoidReason = reason;
                this.isVoidComment = comment;
            });
    }
    /**
     * method to close the void popup
     * @returns void
     */
    closeVoidPopup(): void {
        this.isLoading = true;
        this.setVoidRequest();
        this.enrollmentService
            .voidCoverage(this.data.memberId, this.data.enrollId, this.data.mpGroup, this.voidCoverageRequest)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (this.data.isShop) {
                    this.directToShopPage();
                }
                this.matDialogRef.close(this.data.enrollId);
            });
    }
    /**
     * Set void coverage request body based on configs
     * If Reason config is true set only reason
     * If comment config is true set only comment
     * If both are true set both
     * @returns void
     */
    setVoidRequest(): void {
        const voidReason = this.voidCoverageForm.get("voidReasons").value;
        const voidComment = this.voidCoverageForm.get("notes").value;
        if (!this.isVoidReason && !this.isVoidComment) {
            this.isVoidReason = voidReason ? true : false;
            this.isVoidComment = voidComment ? true : false;
        }
        if (this.isVoidReason && this.isVoidComment) {
            this.voidCoverageRequest = {
                reason: voidReason,
                comment: voidComment,
            };
        } else if (this.isVoidReason) {
            this.voidCoverageRequest = {
                reason: voidReason,
            };
        } else if (this.isVoidComment) {
            this.voidCoverageRequest = {
                comment: voidComment,
            };
        }
    }

    /**
     * direct to shop page
     * @returns void
     */
    directToShopPage(): void {
        if (this.isProducer && !this.isTPI) {
            return;
        } else {
            const url = this.getURLtoNavigateShop();
            this.router.navigateByUrl("/", { skipLocationChange: true }).then(() =>
                this.router.navigate([url]).finally(() => {
                    if (this.data.isShop && this.data.productId) {
                        this.shoppingService.setProductId(this.data.productId);
                    }
                }),
            );
        }
        this.matDialogRef.close(this.data.enrollId);
    }

    /**
     * URL to navigate shop page for member portal and TPI flow.
     * @returns URL to navigate shop page
     */
    getURLtoNavigateShop(): string {
        if (this.isTPI) {
            return "tpi/shop";
        }
        if (this.isMember) {
            this.appFlowService.exitStatus(false);
            return "member/wizard/enrollment/shop/";
        }
        return "";
    }

    setReasonsValue(event: any): void {
        this.voidCoverageReasons.forEach((reason) => {
            if (reason === event.value) {
                this.voidCoverageForm.get("voidReasons").patchValue(event.value);
            }
        });
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
