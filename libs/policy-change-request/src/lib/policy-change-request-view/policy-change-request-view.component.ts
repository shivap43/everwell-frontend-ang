import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import {
    PolicyChangeRequestService,
    PolicyChangeRequestListModel,
    PolicyTransactionForms,
    PolicyChangeRequestStatus,
    AffectedPolicies,
} from "@empowered/api";
import { HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { UtilService } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { Observable, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { finalize } from "rxjs/operators";

export interface DialogData {
    formId: number;
}

@Component({
    selector: "empowered-policy-change-request-view",
    templateUrl: "./policy-change-request-view.component.html",
    styleUrls: ["./policy-change-request-view.component.scss"],
    providers: [DatePipe],
})
export class PolicyChangeRequestViewComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    supportingDocuments: any;
    files: any = [];
    formId: number;
    policyFormDetails: PolicyChangeRequestListModel;
    displayedColumnsArray: string[];
    displayedDocumentColumnsArray: string[];
    dataSource: AffectedPolicies[];
    isLoading: boolean;
    transactionType: string;
    mpGroup: number;
    memberId: number;
    showUploadOption: boolean;
    cifNumber: any;
    uploadApi: Observable<HttpEvent<any>>;
    formDetailsResponse: PolicyChangeRequestListModel;
    changeDescription: string;
    policyChangeViewColumnsMap = [
        {
            propertyName: "policyName",
        },
        {
            propertyName: "policyNumber",
        },
    ];
    supportingDocumentsColumnsMap = [
        {
            propertyName: "documentName",
        },
        {
            propertyName: "documentUploadDate",
        },
    ];

    pcrLanguagePath = "primary.portal.dashboard.policyChangeRequestView";
    documentId: number[];
    addDocuments: Observable<any>;
    documentIdArray = [];
    isSupportiveDocumentsRequired: boolean;
    documnetFlag: boolean;
    showDocumentList: boolean;
    requestTypeEnumKey: string;
    statusTypeEnumKey: string;
    supportingDocumentList = [];
    docList = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.close"]);

    constructor(
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<PolicyChangeRequestViewComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly utilService: UtilService,
    ) {}

    ngOnInit(): void {
        this.formId = this.data.formId;
        this.isLoading = true;
        this.subscriptions.push(
            this.policyChangeRequestService.getPolicyChangeForm(this.formId).subscribe(
                (policyForm: PolicyChangeRequestListModel) => {
                    this.formDetailsResponse = this.utilService.copy(policyForm);
                    policyForm.dateSubmitted = this.datePipe.transform(policyForm.dateSubmitted, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                    this.requestTypeEnumKey = policyForm.requestType;
                    this.statusTypeEnumKey = policyForm.status;
                    policyForm.requestType = PolicyTransactionForms[policyForm.requestType];
                    if (policyForm.account) {
                        this.mpGroup = policyForm.account.groupId;
                    }
                    policyForm.status = PolicyChangeRequestStatus[policyForm.status];
                    this.policyFormDetails = policyForm;
                    if (
                        this.requestTypeEnumKey.match(
                            // eslint-disable-next-line max-len
                            /^(ADDRESS|BENEFICIARY_INFORMATION|OCCUPATION_CLASS_CHANGE|ACCIDENTAL_DOWNGRADE|DISABILITY_DOWNGRADE|CANCER_RIDER_DOWNGRADE|REMOVE_RIDER)$/,
                        ) &&
                        this.statusTypeEnumKey === "SUBMITTED"
                    ) {
                        this.showUploadOption = false;
                    } else if (
                        this.statusTypeEnumKey.match(/^(SUBMITTED|IN_PROGRESS)$/) &&
                        !this.requestTypeEnumKey.match(
                            // eslint-disable-next-line max-len
                            /^(ADDRESS|BENEFICIARY_INFORMATION|OCCUPATION_CLASS_CHANGE|ACCIDENTAL_DOWNGRADE|DISABILITY_DOWNGRADE|CANCER_RIDER_DOWNGRADE|REMOVE_RIDER)$/,
                        )
                    ) {
                        this.showUploadOption = true;
                    }

                    if (
                        this.statusTypeEnumKey.match(/^(COMPLETED|WITHDRAWN|ADDITIONAL_INFO_REQUIRED)$/) &&
                        !this.requestTypeEnumKey.match(
                            // eslint-disable-next-line max-len
                            /^(ADDRESS|BENEFICIARY_INFORMATION|OCCUPATION_CLASS_CHANGE|ACCIDENTAL_DOWNGRADE|DISABILITY_DOWNGRADE|CANCER_RIDER_DOWNGRADE|REMOVE_RIDER)$/,
                        )
                    ) {
                        this.showUploadOption = false;
                        this.showDocumentList = true;
                    }
                    this.isLoading = false;
                },
                (error: HttpErrorResponse) => {
                    this.isLoading = false;
                },
            ),
        );
        this.isLoading = true;
        this.subscriptions.push(
            this.policyChangeRequestService.getPolicyChangeFormDetails(this.formId).subscribe(
                (details) => {
                    this.dataSource = details.affectedPolicies;
                    this.memberId = details.memberId;
                    this.cifNumber = details.cifNumber;
                    this.changeDescription = details.description;
                    this.supportingDocuments = details.supportingDocuments;
                    if (this.supportingDocuments.length > 0) {
                        this.showDocumentList = true;
                        this.supportingDocuments.forEach((data) => {
                            let modifiedFileName: string;
                            if (data.fileName.length > AppSettings.DOC_LENGTH) {
                                modifiedFileName = `${data.fileName.slice(0, 16)}...${data.fileName.slice(-8)}`;
                            } else {
                                modifiedFileName = data.fileName;
                            }
                            const uploadFileDate: string | Date = this.datePipe.transform(data.uploadDate, AppSettings.DATE_TIME_FORMAT);
                            this.docList.push({
                                id: data.id,
                                fileName: modifiedFileName,
                                uploadDate: uploadFileDate,
                            });
                        });
                    } else {
                        this.showDocumentList = false;
                    }
                    this.supportingDocumentList = this.docList;
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            ),
        );

        this.displayedColumnsArray = this.policyChangeViewColumnsMap.map((col) => col.propertyName);
        this.displayedDocumentColumnsArray = this.supportingDocumentsColumnsMap.map((col) => col.propertyName);
    }
    deleteAttachment(index: number): void {
        this.files.splice(index, 1);
    }
    getDocumentId(documentID: number): void {
        if (documentID) {
            this.documentIdArray.push(documentID);
        } else {
            this.documentIdArray = [];
        }
    }

    removeDocument(documentId: number): void {
        this.documentIdArray = this.documentIdArray.filter((x) => x !== documentId);
    }

    /**
     * Save changes to PCR
     */
    saveChanges(): void {
        if (this.documentIdArray.length > 0) {
            this.isLoading = true;
            this.subscriptions.push(
                this.policyChangeRequestService
                    .addTransactionDocumentsToForm(this.formId, this.documentIdArray)
                    .pipe(
                        finalize(() => {
                            this.isLoading = false;
                            this.dialogRef.close();
                        }),
                    )
                    .subscribe(),
            );
        } else {
            this.closeDialog();
        }
    }
    cancelChanges(): void {
        this.dialogRef.close();
    }
    closeModal(): void {
        this.dialogRef.close();
    }
    closeDialog(): void {
        this.dialogRef.close();
    }
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
