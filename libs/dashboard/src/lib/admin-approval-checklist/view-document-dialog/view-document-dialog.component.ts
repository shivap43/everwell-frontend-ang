import { EMPTY, Subject } from "rxjs";
import { tap, catchError, takeUntil } from "rxjs/operators";
import { Component, Inject, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { LanguageService } from "@empowered/language";
import {
    BenefitsOfferingService,
    CommonService,
    StaticService,
    AflacService,
    PROCESS_MASTERAPP_ENUM,
    CarrierFormSetupStatus,
    SaveCarrierSetupStatus,
} from "@empowered/api";
import { MatStepper } from "@angular/material/stepper";
import { DatePipe } from "@angular/common";
import { DateFormat, DateFormats } from "@empowered/constants";
import { ViewDocumentDialogData } from "../model/view-document-dialog-data.model";
import { DateService } from "@empowered/date";
const EN_US = "en-US";
const EST_TIME_ZONE = "America/New_York";
const SINGLE_FORM = 1;

@Component({
    selector: "empowered-view-document-dialog",
    templateUrl: "./view-document-dialog.component.html",
    styleUrls: ["./view-document-dialog.component.scss"],
})
export class ViewDocumentDialogComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    private readonly unsubscribe$ = new Subject<void>();
    signatureForm: FormGroup;
    htmlContentViewer: SafeHtml;
    languageStrings: Record<string, string>;
    isLoading: boolean;
    htmlContent: string;
    defaultPlanTagName = "product.vas.default.acknowledgement_tag";
    fundingType = "An employer-funded";
    documentTitle: string;
    aflacApproval = false;
    pdfContentHTML: string;
    defaultPlan = false;
    vasViewedContent: string;

    constructor(
        private readonly sanitizer: DomSanitizer,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<ViewDocumentDialogComponent>,
        private readonly langService: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly commonService: CommonService,
        private readonly staticService: StaticService,
        private readonly aflacService: AflacService,
        @Inject(MAT_DIALOG_DATA)
        readonly data: ViewDocumentDialogData,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {
        this.signatureForm = this.fb.group({}, { updateOn: "blur" });
        if (data.signatureRequired) {
            const formControl = this.fb.control("", [Validators.required]);
            this.signatureForm.addControl("signature", formControl);
        }
        if (data.dateSigned) {
            data.dateSigned = this.dateService.format(this.dateService.toDate(data.dateSigned), DateFormat.MONTH_DAY_YEAR);
        }
        this.documentTitle = data.carrier ? data.carrier.name : "";
        if (data.formId && data.carrierFormNames.length === SINGLE_FORM) {
            this.documentTitle = data.carrierFormNames[0];
        }
        if (this.data.isVAS) {
            if (this.data.vasContentTag) {
                this.getPlanContent(this.data.vasContentTag.trim(), false);
            } else {
                if (this.data.planName) {
                    this.htmlContent = this.data.planName;
                } else {
                    this.getDefaultPlanContent();
                }
            }
        } else {
            this.downloadPDF();
        }
    }

    ngOnInit(): void {
        this.fetchLanguageData();
    }

    getPlanContent(tagName: string, isDefault: boolean): void {
        this.isLoading = true;
        this.commonService.getLanguages(tagName).subscribe(
            (response) => {
                this.isLoading = false;
                const languageContent = response.find((lang) => lang.tagName === tagName);
                if (languageContent && languageContent.value) {
                    this.htmlContent = languageContent.value.replace("{fundingType}", this.fundingType);
                }
            },
            () => {
                this.isLoading = false;
                if (!isDefault) {
                    this.getDefaultPlanContent();
                }
            },
        );
    }
    /**
     * Gets the default plan content
     * @returns void
     */
    getDefaultPlanContent(): void {
        this.isLoading = true;
        this.staticService.getConfigurations(this.defaultPlanTagName, this.data.mpGroup).subscribe(
            (response) => {
                this.isLoading = false;
                if (response && response.length) {
                    const configuration = response.find((config) => config.name === this.defaultPlanTagName);
                    if (configuration) {
                        this.defaultPlan = true;
                        this.vasViewedContent = "group.plan.acknowledgement1.viewDetailsContent";
                        if (this.data.documentViewed) {
                            this.getPlanContent(this.vasViewedContent, true);
                        } else {
                            this.getPlanContent(configuration.value, true);
                        }
                    } else {
                        this.defaultPlan = false;
                    }
                }
            },
            () => {
                this.isLoading = false;
            },
        );
    }
    /**
     * If form is Q60, submit the form, else invoke processMasterApp
     * @param step
     */
    goToStep(step: number): void {
        if (this.data.isQ60) {
            const sign = this.signatureForm.get("signature").value;
            if (this.data.signatureRequired && sign) {
                this.matStepper.selectedIndex = step;
                this.matStepper.selected.interacted = false;
                this.aflacApproval = true;
                const setupPayload: SaveCarrierSetupStatus = {
                    accountApprovalDate: this.datePipe.transform(
                        new Date().toLocaleString(EN_US, { timeZone: EST_TIME_ZONE }),
                        DateFormats.DATE_FORMAT_Y_M_D_TH_M_S,
                    ),
                    approvedByAdminId: this.data.approvedByAdminId,
                    carrierFormId: this.data.formId,
                    status: CarrierFormSetupStatus.PENDING,
                    signature: sign,
                };
                this.benefitOfferingService
                    .saveCarrierSetupStatus(this.data.mpGroup, this.data.carrier.id, setupPayload)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe();
            }
        } else {
            this.submit("save");
        }
    }
    /**
     * This function will preview the pdf
     */
    downloadPDF(): void {
        this.isLoading = true;
        this.benefitOfferingService.downloadCarrierForms(this.data.mpGroup, this.data.carrier.id).subscribe(
            (docData) => {
                this.isLoading = false;
                const html = document.createElement("html");
                html.innerHTML = docData;
                this.pdfContentHTML = html.querySelector("body").innerHTML;
                this.htmlContentViewer = this.sanitizer.bypassSecurityTrustHtml(this.pdfContentHTML);
            },
            (error) => {
                this.isLoading = false;
            },
        );
    }

    close(): void {
        this.dialogRef.close();
    }

    submit(action: string): void {
        let signature;
        if (this.data.signatureRequired) {
            signature = this.signatureForm.get("signature").value;
        }
        if (!this.data.viewOnly && this.data.signingAdmin) {
            signature = this.data.signingAdmin;
        }
        if (this.data.isQ60 && action !== "close") {
            this.aflacService
                .processMasterAppApprovals(this.data.mpGroup.toString())
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap((resp) => {
                        if (resp === PROCESS_MASTERAPP_ENUM.APPROVED) {
                            this.dialogRef.close({
                                action: action,
                                signature: signature,
                                status: PROCESS_MASTERAPP_ENUM.APPROVED,
                            });
                        } else if (resp === PROCESS_MASTERAPP_ENUM.DENIED) {
                            this.dialogRef.close({
                                action: action,
                                signature: signature,
                                status: PROCESS_MASTERAPP_ENUM.DENIED,
                            });
                        }
                    }),
                    catchError((error) => {
                        this.dialogRef.close({
                            action: action,
                            signature: signature,
                            status: PROCESS_MASTERAPP_ENUM.DENIED,
                        });
                        return EMPTY;
                    }),
                )
                .subscribe();
        } else {
            this.dialogRef.close({ action: action, signature: signature });
        }
    }

    /**
     * This method fetches the language strings
     * @returns void
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.documentTitle",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.eSignature",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.fullname",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.signingAdmin",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.dateSigned",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.signRequired",
            "primary.portal.common.cancel",
            "primary.portal.common.close",
            "primary.portal.common.save",
            "primary.portal.common.next",
            "primary.portal.admin.send",
            "primary.portal.admin.checklist.stepTwo",
            "primary.portal.admin.checklist.stepTwo.content",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.confirmPlanChoices",
            "primary.portal.dashboard.adminApprovalChecklist.viewDocumentDialog.planChoicesConfirmedOn",
        ]);
    }

    /**
     * Unsubscribing the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
