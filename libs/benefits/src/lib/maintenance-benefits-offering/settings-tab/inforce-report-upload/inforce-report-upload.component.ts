import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Subscription, Subject, EMPTY, iif, of } from "rxjs";
import { HttpEventType, HttpEvent, HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { SuccessResponseCode, ClientErrorResponseCode, ClientErrorResponseType, ConfigName } from "@empowered/constants";
import { BenefitsOfferingService } from "@empowered/api";
import { catchError, switchMap, takeUntil, tap } from "rxjs/operators";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StaticUtilService } from "@empowered/ngxs-store";
import { FileUploadService } from "@empowered/common-services";

export type MonUploadFileObject = File | FileContent;
interface FileContent {
    documentId?: number | string;
    modifiedName: string;
}
const FileNameLength = {
    MAX_ALLOWED_LENGTH: 24,
    INITIAL_SUBSTRING_MIN_LENGTH: 0,
    INITIAL_SUBSTRING_MAX_LENGTH: 15,
    ENDING_SUBSTRING_LENGTH: 8,
};
interface MonUploadFileDetails {
    file?: MonUploadFileObject;
    uploadErrorStatus?: string;
    uploadSuccessStatus?: string;
    isSuccess?: boolean;
    hasError?: boolean;
    isFileSelected?: boolean;
    isFileError?: boolean;
    isProgressBarEnabled?: boolean;
    isFileUploaded?: boolean;
    isUploadingStarted?: boolean;
    modeProgress?: string;
    fileUploadPercentage?: number;
    subscription?: Subscription;
    planId?: number | string;
}
interface InForceDetails {
    lastUploadedFileDate: string | Date;
    lastUploadFileName: string;
    uploadedAdminName: string;
    planYearId: number;
    mpGroup: string;
}

enum FileUploadProgressType {
    DETERMINE = "determine",
    INDETERMINATE = "indeterminate",
}
const FILE_UPLOAD_MAX_PERCENTAGE = 100;
const FILE_UPLOAD_MIN_PERCENTAGE = 0;

@Component({
    selector: "empowered-inforce-report-upload",
    templateUrl: "./inforce-report-upload.component.html",
    styleUrls: ["./inforce-report-upload.component.scss"],
})
export class InforceReportUploadComponent implements OnInit, OnDestroy {
    acceptableFormats = ".xls,.xlsx";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.uploadReport",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.upload",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    fileDetails: MonUploadFileDetails;
    isExistingDoc = false;
    allowMultipartFileUpload: boolean;
    maxFileSizeAllowed: number;

    constructor(
        private readonly language: LanguageService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        @Inject(MAT_DIALOG_DATA) readonly data: InForceDetails,
        private readonly dialogRef: MatDialogRef<InforceReportUploadComponent>,
        private readonly fileUploadService: FileUploadService,
    ) {}

    /**
     * method to initialize variables during component initialization
     */
    ngOnInit(): void {
        if (this.data.uploadedAdminName) {
            this.isExistingDoc = true;
        }
        this.fileDetails = {
            hasError: false,
            isSuccess: false,
            isFileSelected: true,
            isProgressBarEnabled: true,
            isFileUploaded: false,
            isUploadingStarted: true,
            modeProgress: FileUploadProgressType.DETERMINE,
            fileUploadPercentage: FILE_UPLOAD_MIN_PERCENTAGE,
        };
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.allowMultipartFileUpload = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    /**
     * this method is used to save the uploaded documents
     */
    onSave(): void {
        if (this.fileDetails.isFileUploaded) {
            this.dialogRef.close();
        }
    }
    /**
     * This method is used to upload file and to set mon upload file details
     * @param fileToUpload is the file to upload into server
     */
    uploadFile(fileToUpload: File): void {
        this.fileDetails = null;
        const fileName: string = fileToUpload.name;
        const file: MonUploadFileObject = {
            modifiedName: this.getFileModifiedName(fileName),
            name: fileName,
            lastModified: fileToUpload.lastModified,
            size: fileToUpload.size,
            type: fileToUpload.type,
            slice: fileToUpload.slice,
            documentId: null,
        };
        this.fileDetails = {
            hasError: false,
            file: file,
            isSuccess: false,
            isFileSelected: true,
            isProgressBarEnabled: true,
            isFileUploaded: false,
            isUploadingStarted: true,
            modeProgress: FileUploadProgressType.DETERMINE,
            fileUploadPercentage: FILE_UPLOAD_MIN_PERCENTAGE,
        };
        if (fileToUpload.size > this.maxFileSizeAllowed) {
            this.resetValuesForError();
            this.fileDetails.uploadErrorStatus = "secondary.portal.shared.monUpload.maxFileSize.error";
        } else {
            this.fileDetails.subscription = iif(
                () => this.allowMultipartFileUpload,
                of(null),
                this.fileUploadService.upload(fileToUpload).pipe(
                    catchError(() => {
                        this.resetValuesForError();
                        this.fileDetails.uploadErrorStatus = "secondary.portal.shared.monUpload.genericError";
                        return EMPTY;
                    }),
                ),
            )
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(() =>
                        this.benefitsOfferingService.uploadInForceReport(
                            this.data.planYearId,
                            fileToUpload,
                            this.data.mpGroup,
                            this.allowMultipartFileUpload,
                        ),
                    ),
                    tap(
                        (events: HttpEvent<string>) => {
                            this.handleFileSuccessStatus(events);
                        },
                        (error) => {
                            this.handleFileErrorStatus(error);
                        },
                    ),
                )
                .subscribe();
        }
    }
    /**
     * This method is used to handle file upload success status
     * @param events is HttpEvent of string and used to observe http events
     */
    handleFileSuccessStatus(events: HttpEvent<string>): void {
        if (events.type === HttpEventType.UploadProgress) {
            this.fileDetails.fileUploadPercentage = Math.round((FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total);
            if (this.fileDetails.fileUploadPercentage === FILE_UPLOAD_MAX_PERCENTAGE) {
                this.fileDetails.modeProgress = FileUploadProgressType.INDETERMINATE;
            }
        } else if (
            events.type === HttpEventType.Response &&
            (events.status === SuccessResponseCode.RESP_204 || events.status === SuccessResponseCode.RESP_202)
        ) {
            this.fileDetails.isSuccess = true;
            this.fileDetails.hasError = false;
            this.fileDetails.isUploadingStarted = false;
        }
        if (events instanceof HttpResponse) {
            this.fileDetails.uploadErrorStatus = "";
            this.fileDetails.uploadSuccessStatus = "secondary.portal.shared.monupload.uploadsucess.subtitle";
            this.fileDetails.isFileUploaded = true;
            this.fileDetails.isProgressBarEnabled = false;
        }
    }
    /**
     * This method is used to handle file upload error status
     * @param error is HttpErrorResponse
     */
    handleFileErrorStatus(error: HttpErrorResponse): void {
        this.resetValuesForError();
        let fileError = "";
        switch (error.status) {
            case ClientErrorResponseCode.RESP_413:
                fileError = "secondary.portal.qle.pendingEnrollment.maxFileSize.error";
                break;
            case ClientErrorResponseCode.RESP_415:
                fileError = "secondary.portal.qle.pendingEnrollment.fileFormat.error";
                break;
            case ClientErrorResponseCode.RESP_400:
                if (error.error.code !== ClientErrorResponseType.MISSING_PARAMETER) {
                    this.fileDetails.isFileError = true;
                    fileError = error.error.message;
                } else if (
                    error.error.details?.length &&
                    error.error.details[0].field ===
                        this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                ) {
                    fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                } else {
                    fileError = "secondary.portal.qle.pendingEnrollment.fileRequired.error";
                }
                break;
            default:
                fileError = "secondary.portal.qle.pendingEnrollment.unknown.error";
                break;
        }
        this.fileDetails.uploadErrorStatus = fileError;
    }
    /**
     * This method is used to concat file name and adds ellipsis if file name greater than max allowed length
     * @param fileName is the file name to modify
     * @returns modified file name if fileName greater than max allowed length else fileName itself
     */
    getFileModifiedName(fileName: string): string {
        return fileName.length > FileNameLength.MAX_ALLOWED_LENGTH
            ? fileName
                .substring(FileNameLength.INITIAL_SUBSTRING_MIN_LENGTH, FileNameLength.INITIAL_SUBSTRING_MAX_LENGTH)
                .concat("...", fileName.substring(fileName.length - FileNameLength.ENDING_SUBSTRING_LENGTH, fileName.length))
            : fileName;
    }
    /**
     * This method is used to cancel file upload
     */
    cancelUpload(): void {
        this.fileDetails.subscription.unsubscribe();
        this.fileDetails = null;
    }

    /**
     * Resets error variables in case of error
     */
    resetValuesForError(): void {
        this.fileDetails.isFileUploaded = false;
        this.fileDetails.isUploadingStarted = false;
        this.fileDetails.hasError = true;
        this.fileDetails.isSuccess = false;
        this.fileDetails.isProgressBarEnabled = false;
        this.fileDetails.uploadSuccessStatus = "";
    }

    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
