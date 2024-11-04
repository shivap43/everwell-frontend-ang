import { Component, OnDestroy, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialog } from "@angular/material/dialog";
import { UploadApplicationModalComponent } from "../upload-application-modal/upload-application-modal.component";
import { take, filter, tap } from "rxjs/operators";
import { Observable, Subscription } from "rxjs";
import { Select, Store } from "@ngxs/store";
import { PendedBusinessState, StaticUtilService } from "@empowered/ngxs-store";
import { ConfigName, ProducerDetails, ToastType } from "@empowered/constants";
import { OpenToast, ToastModel } from "@empowered/ui";

const stringConstant = {
    DIRECT: "DIRECT",
};
@Component({
    selector: "empowered-pended-business-header",
    templateUrl: "./pended-business-header.component.html",
    styleUrls: ["./pended-business-header.component.scss"],
})
export class PendedBusinessHeaderComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    nbsFaxCoverSheetLink: string;
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;
    subscriptions: Subscription[] = [];

    constructor(
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly staticUtilService: StaticUtilService,
        private readonly store: Store,
    ) {}

    /**
     * Get initial data
     */
    ngOnInit(): void {
        this.fetchLanguage();
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigValue(ConfigName.NBS_FAX_COVER_SHEET_LINK)
                .pipe(
                    take(1),
                    tap((config) => (this.nbsFaxCoverSheetLink = config)),
                )
                .subscribe(),
        );
    }

    /**
     * Prepares all data for then opens upload modal.
     */
    openUploadModal(): void {
        const dialogRef = this.dialog.open(UploadApplicationModalComponent, {
            width: "700px",
            data: {
                applicationInfo: Object,
                applicationDetails: Object,
                modalFrom: stringConstant.DIRECT,
            },
        });
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((toast) => toast !== undefined),
                    tap((toast) => {
                        const toastModel: ToastModel = {
                            message:
                                toast["type"] === ToastType.SUCCESS
                                    ? this.language.fetchPrimaryLanguageValue("primary.portal.pendedBusiness.applicationSubmitted")
                                    : this.language.fetchPrimaryLanguageValue("primary.portal.pendedBusiness.applicationUploadFailed"),
                            toastType: toast["type"] === ToastType.SUCCESS ? ToastType.SUCCESS : ToastType.DANGER,
                        };
                        this.store.dispatch(new OpenToast(toastModel));
                    }),
                )
                .subscribe(),
        );
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.pbr.overview.pendedBusiness",
            "primary.portal.pendedBusiness.managePendedBusiness",
            "primary.portal.pendedBusiness.downloadMbsSheet",
            "primary.portal.pendedBusiness.uploadApplication",
        ]);
    }

    /**
     * Clean up subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
