import { LanguageService } from "@empowered/language";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitsOfferingService, CarrierFormWithCarrierInfo } from "@empowered/api";
import { ServerErrorResponseCode } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-view-form-manage",
    templateUrl: "./view-form-manage.component.html",
    styleUrls: ["./view-form-manage.component.scss"],
})
export class ViewFormManageComponent implements OnInit, OnDestroy {
    documentTitle: string;
    isLoading: boolean;
    url: SafeUrl;
    languageStrings: Record<string, string>;
    errorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly sanitizer: DomSanitizer,
        private readonly dialogRef: MatDialogRef<ViewFormManageComponent>,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly langService: LanguageService,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            form: CarrierFormWithCarrierInfo;
            mpGroup: number;
        },
    ) {
        this.documentTitle = this.data.form.formName;
        this.isLoading = true;
        this.benefitOfferingService
            .downloadCarrierForms(this.data.mpGroup, this.data.form.carrierId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (docData) => {
                    this.isLoading = false;
                    const unSignedBlob = new Blob([docData], { type: "text/html" });
                    /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(unSignedBlob);
                    } else {
                        const url = window.URL.createObjectURL(unSignedBlob);
                        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                    }
                },
                (error) => {
                    if (error?.status === ServerErrorResponseCode.RESP_503) {
                        this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.portal.api.503.genericError");
                    }
                    this.isLoading = false;
                },
            );
    }

    /**
     * ng lifecycle hook that loads the language needed for the component
     */
    ngOnInit(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues(["primary.portal.common.close"]);
    }

    /**
     * Method to close the modal
     */
    close(): void {
        this.dialogRef.close();
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
