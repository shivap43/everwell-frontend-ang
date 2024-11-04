import { AppSettings } from "@empowered/constants";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { PendedBusinessByType, PendedBusinessService, PendedBusinessType } from "@empowered/api";
import { ProducerDetails } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { ResolveApplicationModalComponent } from "../resolve-application-modal/resolve-application-modal.component";
import { Subscription, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { PendedBusinessState, SharedState } from "@empowered/ngxs-store";

export interface DialogData {
    applicationType: string;
    applicationInfo: PendedBusinessByType;
    companyCode: string;
    businessType: PendedBusinessType;
}

const ApplicationFrom = {
    PENDED: "PENDED",
    RESOLVED: "RESOLVED",
    EXISTING: "E",
};

@Component({
    selector: "empowered-pended-applications-modal",
    templateUrl: "./pended-applications-modal.component.html",
    styleUrls: ["./pended-applications-modal.component.scss"],
})
export class PendedApplicationsModalComponent implements OnInit, OnDestroy {
    applicationFrom = ApplicationFrom;
    applicationInfoDetails: any;
    isLoading = true;
    languageStrings: Record<string, string>;
    applicationDetailSubscription: Subscription;
    downlaodApplicationSubs: Subscription;
    isAnnualizedPremium = true;
    country = AppSettings.COUNTRY_US;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    PDF = ".pdf";
    ssnSplitFormat: RegExp;
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly dialogRef: MatDialogRef<PendedApplicationsModalComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
    ) {}

    ngOnInit(): void {
        this.fetchLanguage();
        this.getApplicationDetails();
        this.ssnSplitFormat = new RegExp(this.store.selectSnapshot(SharedState.regex)?.SSN_SPLIT_FORMAT);
    }

    /**
     * API call to get pended business application details
     */
    getApplicationDetails(): void {
        const queryParams = {
            appTypeIndicator: this.data.applicationInfo.appTypeIndicator,
            applicationNumber: this.data.applicationInfo.applicationNumber,
            pended: true,
            businessType: this.data.businessType,
        };
        if (queryParams.appTypeIndicator.toUpperCase() === "C") {
            this.isAnnualizedPremium = false;
        }
        this.applicationDetailSubscription = this.producer$
            .pipe(
                switchMap((producer) =>
                    this.pendedBusinessService.getApplicationDetail(this.data.companyCode, queryParams, producer && producer.id).pipe(
                        map((applicationDetail) =>
                            Object.assign({}, applicationDetail, {
                                applicantSSN:
                                    applicationDetail.applicantSSN && applicationDetail.applicantSSN !== "0"
                                        ? applicationDetail.applicantSSN
                                        : "",
                            }),
                        ),
                    ),
                ),
            )
            .subscribe(
                (applicationDetail) => {
                    this.applicationInfoDetails = applicationDetail;
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Open resolved business application modal
     */
    openResolveApplicationModal(): void {
        this.dialogRef.close();
        this.dialog.open(ResolveApplicationModalComponent, {
            width: "700px",
            data: {
                applicationDetails: this.applicationInfoDetails,
                applicationInfo: this.data.applicationInfo,
            },
        });
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }

    downloadApplication(): void {
        this.isLoading = true;
        const applicationNumber = this.data.applicationInfo.applicationNumber;
        this.downlaodApplicationSubs = this.producer$
            .pipe(
                switchMap((producer) =>
                    this.pendedBusinessService.downloadApplication(applicationNumber, this.data.businessType, producer && producer.id),
                ),
            )
            .subscribe(
                (response) => {
                    const fileName = applicationNumber + this.PDF;
                    const blob = new Blob([response], {
                        type: "application/octet-stream,application/vnd.ms-excel,  application/pdf,*/*",
                    });

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(blob, fileName);
                    } else {
                        const anchor = document.createElement("a");
                        anchor.download = `${applicationNumber}`;
                        const fileURLBlob = URL.createObjectURL(blob);
                        anchor.href = fileURLBlob;
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.pendedApplicationModal.title1",
            "primary.portal.pendedBusiness.pendedApplicationModal.title2",
            "primary.portal.pendedBusiness.pendedApplicationModal.accountName",
            "primary.portal.pendedBusiness.pendedApplicationModal.account",
            "primary.portal.pendedBusiness.pendedApplicationModal.producerName",
            "primary.portal.pendedBusiness.pendedApplicationModal.writing",
            "primary.portal.pendedBusiness.pendedApplicationModal.sitCode",
            "primary.portal.pendedBusiness.pendedApplicationModal.phone",
            "primary.portal.pendedBusiness.pendedApplicationModal.transmittal",
            "primary.portal.pendedBusiness.pendedApplicationModal.situsState",
            "primary.portal.pendedBusiness.pendedApplicationModal.commission",
            "primary.portal.pendedBusiness.pendedApplicationModal.planYearStart",
            "primary.portal.pendedBusiness.pendedApplicationModal.planYearEnd",
            "primary.portal.pendedBusiness.pendedApplicationModal.application",
            "primary.portal.pendedBusiness.pendedApplicationModal.lob",
            "primary.portal.pendedBusiness.pendedApplicationModal.processedDate",
            "primary.portal.pendedBusiness.pendedApplicationModal.pendDate",
            "primary.portal.pendedBusiness.pendedApplicationModal.billForm",
            "primary.portal.pendedBusiness.pendedApplicationModal.annualPremium",
            "primary.portal.pendedBusiness.pendedApplicationModal.conversionPremium",
            "primary.portal.pendedBusiness.pendedApplicationModal.baseStatus",
            "primary.portal.pendedBusiness.pendedApplicationModal.riderStatus",
            "primary.portal.pendedBusiness.pendedApplicationModal.applicantName",
            "primary.portal.pendedBusiness.pendedApplicationModal.birthDate",
            "primary.portal.pendedBusiness.pendedApplicationModal.ssn",
            "primary.portal.pendedBusiness.pendedApplicationModal.address",
            "primary.portal.pendedBusiness.pendedApplicationModal.email",
            "primary.portal.pendedBusiness.pendedApplicationModal.spouseName",
            "primary.portal.pendedBusiness.pendedApplicationModal.spouseBdate",
            "primary.portal.pendedBusiness.pendedApplicationModal.policyOwner",
            "primary.portal.pendedBusiness.pendedApplicationModal.applicationStatus",
            "primary.portal.pendedBusiness.pendedApplicationModal.newExistingEmployee",
            "primary.portal.pendedBusiness.pendedApplicationModal.destination",
            "primary.portal.pendedBusiness.pendedApplicationModal.dateDestination",
            "primary.portal.pendedBusiness.pendedApplicationModal.remarks",
            "primary.portal.pendedBusiness.pendedApplicationModal.reason",
            "primary.portal.pendedBusiness.pendedApplicationModal.downloadApplication",
            "primary.portal.common.close",
            "primary.portal.pendedBusiness.pendedApplicationModal.resolve",
            "primary.portal.common.cancel",
            "primary.portal.pendedBusiness.pendedApplicationModal.deskCode",
            "primary.portal.pendedBusiness.pendedApplicationModal.new",
            "primary.portal.pendedBusiness.pendedApplicationModal.existing",
            "primary.portal.pendedBusiness.pendedApplicationModal.coverageEffDate",
        ]);
    }

    ngOnDestroy(): void {
        if (this.applicationDetailSubscription) {
            this.applicationDetailSubscription.unsubscribe();
        }
        if (this.downlaodApplicationSubs) {
            this.downlaodApplicationSubs.unsubscribe();
        }
    }
}
