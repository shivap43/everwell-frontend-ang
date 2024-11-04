import { EnrollmentService } from "@empowered/api";
import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { take, takeUntil } from "rxjs/operators";
import { Permission, ConfigName } from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { Subject, combineLatest } from "rxjs";

const WITHDRAWAL_REASON = "voidReasons";
const WITHDRAWAL_COMMENT = "notes";

interface DialogData {
    planName: string;
    mpGroup: number;
    memberId: number;
    enrollId: number;
    isCoverageSummary: boolean;
}

@Component({
    selector: "empowered-void-coverage",
    templateUrl: "./void-coverage.component.html",
    styleUrls: ["./void-coverage.component.scss"],
})
export class VoidCoverageComponent implements OnInit, OnDestroy {
    voidCoverageReasons: any[] = [];
    voidCoverageForm: FormGroup;
    isVoidReasonEnabled = false;
    isVoidCommentEnabled = false;
    voidCoverageRequest = null;
    configEnums = ConfigName;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.editCoverage.void",
        "primary.portal.editCoverage.coverage",
        "primary.portal.editCoverage.voidingPolicy",
        "primary.portal.editCoverage.cancel",
        "primary.portal.editCoverage.voidCoverage",
        "primary.portal.editCoverage.notes",
        "primary.portal.common.close",
        "primary.portal.voidCoverage.applicationNotBeProcessed",
        "primary.portal.editCoverage.reason",
        "primary.portal.common.optional",
        "primary.portal.voidCoverage.withdrawApplication",
        "primary.portal.common.placeholderSelect",
    ]);
    UserPermissions = Permission;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<VoidCoverageComponent>,
        private readonly enrollmentService: EnrollmentService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Life cycle hook to set form and get the void coverage reason
     */
    ngOnInit(): void {
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
    }
    /**
     * Get void reason and comment config and set appropriate flags
     * @returns void
     */
    getVoidConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.POLICY_VOID_REASON_ENABLE),
            this.staticUtilService.cacheConfigEnabled(ConfigName.POLICY_VOID_COMMENT_ENABLE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([reason, comment]) => {
                this.isVoidReasonEnabled = reason;
                this.isVoidCommentEnabled = comment;
            });
    }
    /**
     * method to close the void popup
     * @returns void
     */
    closeVoidPopup(): void {
        this.setVoidRequest();
        this.matDialogRef.close(this.voidCoverageRequest);
    }
    /**
     * Set void coverage request body based on configs
     * If Reason config is true set only reason
     * If comment config is true set only comment
     * If both are true set both
     * @returns void
     */
    setVoidRequest(): void {
        this.voidCoverageRequest = {
            reason: this.isVoidReasonEnabled ? this.voidCoverageForm.get(WITHDRAWAL_REASON).value : undefined,
            comment: this.isVoidCommentEnabled ? this.voidCoverageForm.get(WITHDRAWAL_COMMENT).value : undefined,
        };
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
