import { Component, OnInit, Inject, Input, Output, EventEmitter, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PendedBusinessByType, PendedBusinessService } from "@empowered/api";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    CompanyCode,
    ConfigName,
    ProducerDetails,
    RedirectResponseCode,
    ServerErrorResponseCode,
} from "@empowered/constants";
import { Subscription, Subject, Observable, EMPTY, iif, of } from "rxjs";
import { HttpEventType, HttpEvent, HttpResponse } from "@angular/common/http";
import { AppSettings, ToastType } from "@empowered/constants";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { PbrCommonService } from "../pbr-common.service";
import { Store, Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";
import { catchError, switchMap, takeUntil } from "rxjs/operators";
import { FileUploadService } from "@empowered/common-services";

export interface UploadDialogData {
    applicationInfo: PendedBusinessByType;
    applicationDetails: any;
    modalFrom: string;
}

const stringConstant = {
    RESOLVED: "RESOLVED",
    DIRECT: "DIRECT",
};
@Component({
    selector: "empowered-upload-application-modal",
    templateUrl: "./upload-application-modal.component.html",
    styleUrls: ["./upload-application-modal.component.scss"],
})
export class UploadApplicationModalComponent implements OnInit, OnDestroy {
    companyCodeConstat = CompanyCode;
    selectedCompanyCode: string = this.companyCodeConstat.US;
    modalFrom = stringConstant;
    uplaodCompanyCode: string;
    @Input() uploadApi: Observable<HttpEvent<any>>;
    fileExtension: string;
    fileError: boolean;
    isFileSelected: boolean;
    isFileAvailable: boolean;
    isFileViewable = false;
    showSpinner: boolean;
    datePipe: any;
    uploadFileEvent: any;
    uploadFileArray: any[] = [];
    languageStrings: Record<string, string>;
    @Output() fileUploaded: EventEmitter<File> = new EventEmitter();
    @Output() getDocumentId: EventEmitter<number> = new EventEmitter();
    acceptableFormats = ".pdf,.jpeg,.tif,.tiff";
    hintText: string;
    modeProgress = "determinate";
    files: any[] = [];
    hasError: boolean[] = [];
    isSuccess: boolean[] = [];
    uploadSuccessStatus: string[] = [];
    uploadErrorStatus: string[] = [];
    lastUploadFileName: string;
    documentId: number;
    fileUploadPercentage: number;
    isFileUploaded: boolean;
    isProgressBarEnabled: boolean;
    isUploadingStarted: boolean;
    subscription: Subscription;
    errorMessage: string;
    hasWarning: boolean;
    warningMessage;
    private unsubscribe$ = new Subject<void>();
    isSpinnerLoading: boolean;
    lastUploadedFileDate: string | Date;
    supportingDocuments: any;
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;
    allowMultipartFileUpload: boolean;
    maxFileSizeAllowed: number;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: UploadDialogData,
        private readonly dialogRef: MatDialogRef<UploadApplicationModalComponent>,
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly langService: LanguageService,
        private readonly pbrCommonService: PbrCommonService,
        private readonly store: Store,
        private readonly fileUploadService: FileUploadService,
    ) {}

    ngOnInit(): void {
        this.fetchLanguageData();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.policyChangeRequest.*"));
        this.initFileVariables();
        this.fileUploadService
            .fetchFileUploadConfigs(ConfigName.MAX_UPLOAD_FILE_SIZE_PENDED_BUSINESS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.allowMultipartFileUpload = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    uploadFile(event: File): void {
        this.initFileVariables();
        this.fileUploaded.emit(event);
        const notAllowedFormats = AppSettings.INVALID_FILE_EXETENSIONS_FOR_PCR_DOCUMENT;
        let modifiedName: string;
        if (event.name.length > AppSettings.DOC_LENGTH) {
            modifiedName = `${event.name.slice(0, 16)}...${event.name.slice(-8)}`;
        } else {
            modifiedName = event.name;
        }

        const file: File | any | (File & { modifiedName: string }) = {
            name: event.name,
            modifiedName: modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
        };
        const uploadError = notAllowedFormats.includes(event.name.split(".").pop())
            ? "secondary.portal.policyChangeRequest.policyChangeRequestView.fileFormat.error"
            : file.size > this.maxFileSizeAllowed
            ? "secondary.portal.policyChangeRequest.policyChangeRequestView.maxFileSize.error"
            : "";
        this.files = [file];
        this.isFileSelected = true;
        this.isFileAvailable = true;
        if (uploadError) {
            this.isSuccess = [false];
            this.hasError = [true];
            this.fileError = true;
            this.uploadSuccessStatus = [""];
            this.uploadErrorStatus.push(uploadError);
            this.isProgressBarEnabled = true;
        } else {
            this.fileError = true;
            this.isFileUploaded = false;
            this.isUploadingStarted = true;
            this.isProgressBarEnabled = true;
            this.fileUploadPercentage = 0;
            this.isSuccess = [true];
            this.hasError = [false];
            this.uploadFileArray = [event];
        }
    }
    cancelUpload(index: number): void {
        this.files.length = 0;
        this.uploadSuccessStatus.length = 0;
        this.uploadErrorStatus.length = 0;
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
            this.subscription.unsubscribe();
        }
        if (this.isFileUploaded) {
            this.documentId = undefined;
        }
        this.getDocumentId.emit(this.documentId);
        const otherThanNull = this.files.some(function (element: File): boolean {
            return element !== null;
        });
        if (!otherThanNull) {
            this.files.length = 0;
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.hasError = [];
            this.isSuccess = [];
        }
    }
    onfileUploaded(): void {
        if (this.uploadFileArray) {
            if (this.data.modalFrom === this.modalFrom.RESOLVED) {
                this.uplaodCompanyCode =
                    this.data.applicationInfo.state === this.companyCodeConstat.NY
                        ? this.companyCodeConstat.NY
                        : this.companyCodeConstat.US;
            } else {
                this.uplaodCompanyCode = this.selectedCompanyCode;
            }
            const file: File = this.uploadFileArray.slice().pop();

            iif(
                () => this.allowMultipartFileUpload,
                of(null),
                this.fileUploadService.upload(file).pipe(
                    catchError(() => {
                        this.resetValuesForError();
                        this.uploadErrorStatus = ["secondary.portal.shared.monUpload.genericError"];
                        return EMPTY;
                    }),
                ),
            )
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(() => this.producer$),
                    switchMap((producer) =>
                        this.pendedBusinessService.sendCorrectedApplication(
                            this.uplaodCompanyCode,
                            file,
                            producer && producer.id,
                            this.allowMultipartFileUpload,
                        ),
                    ),
                )
                .subscribe(
                    (events) => {
                        if (events.type === HttpEventType.UploadProgress) {
                            this.fileUploadPercentage = Math.round((100 * events.loaded) / events.total);
                            if (this.fileUploadPercentage === 100) {
                                this.modeProgress = "indeterminate";
                            }
                        } else if (events.type === HttpEventType.Response && events.status === AppSettings.API_RESP_202) {
                            this.isSuccess = [true];
                            this.hasError = [false];
                            this.isUploadingStarted = false;
                        }
                        if (events instanceof HttpResponse) {
                            this.uploadErrorStatus = [""];
                            this.uploadSuccessStatus.push(
                                this.languageStrings["primary.portal.policyChangeRequest.policyChangeRequestView.successfullyUploaded"],
                            );
                        }
                        if (events.type === HttpEventType.UploadProgress) {
                            this.fileUploadPercentage = Math.round((events.loaded / events.total) * 100);
                        } else if (events.type === HttpEventType.Response && events.status === AppSettings.API_RESP_202) {
                            this.isFileUploaded = true;
                            this.isProgressBarEnabled = true;
                            this.dialogRef.close({ type: ToastType.SUCCESS });
                            this.pbrCommonService.setStatusUploadApplicationModal(false);
                        }
                    },
                    (error) => {
                        this.resetValuesForError();
                        let fileError = "";
                        if (error.status === ClientErrorResponseCode.RESP_413) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.maxFileSize.error";
                        } else if (error.status === ClientErrorResponseCode.RESP_415) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.fileFormat.error";
                        } else if (error.status === ClientErrorResponseCode.RESP_409) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.uploading.error";
                        } else if (error.status === RedirectResponseCode.RESP_300) {
                            this.hasWarning = true;
                            this.warningMessage = "secondary.portal.policyChangeRequest.policyChangeRequestView.mapping.warning";
                        } else if (error.status === ClientErrorResponseCode.RESP_400) {
                            if (error.error.code === ClientErrorResponseType.MISSING_PARAMETER) {
                                fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.file.FileRequirederror";
                            } else if (
                                error.error.details?.length &&
                                error.error.details[0].field ===
                                    this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                            ) {
                                fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                            }
                        }
                        this.uploadErrorStatus = [fileError];
                        if (error.status === ServerErrorResponseCode.RESP_500 || error.status === ServerErrorResponseCode.RESP_503) {
                            this.dialogRef.close({ type: ToastType.DANGER });
                        }
                        this.unsubscribe$.next();
                    },
                );
        }
    }

    initFileVariables(): void {
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.uploadFileArray = [];
        this.hasError = [];
        this.isSuccess = [];
        this.files = [];
        this.hintText = this.languageStrings["primary.portal.pendedBusiness.uploadApplicationModal.uploadHint"];
    }

    /**
     * Resets error variables in case of error
     */
    resetValuesForError(): void {
        this.isFileUploaded = false;
        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
        this.hasError = [true];
        this.isSuccess = [false];
        this.uploadSuccessStatus.push("");
    }

    openResolvedAppDetailModal(): void {
        this.dialogRef.close();
        this.pbrCommonService.setStatusUploadApplicationModal(true);
    }

    onCancelClick(): void {
        this.dialogRef.close();
        this.pbrCommonService.setStatusUploadApplicationModal(false);
    }

    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.resolvedApps.header",
            "primary.portal.pendedBusiness.resolveApplicationModal.step",
            "primary.portal.common.of",
            "primary.portal.pendedBusiness.uploadApplicationModal.title",
            "primary.portal.pendedBusiness.uploadApplicationModal.uploadNote1",
            "primary.portal.pendedBusiness.uploadApplicationModal.uploadNote2",
            "primary.portal.pendedBusiness.uploadApplicationModal.uploadNote3",
            "primary.portal.pendedBusiness.uploadApplicationModal.companyCode",
            "primary.portal.pendedBusiness.uploadApplicationModal.us",
            "primary.portal.pendedBusiness.uploadApplicationModal.ny",
            "primary.portal.pendedBusiness.uploadApplicationModal.uploadImage",
            "primary.portal.common.submit",
            "primary.portal.common.back",
            "primary.portal.common.cancel",
            "primary.portal.policyChangeRequest.policyChangeRequestView.successfullyUploaded",
            "primary.portal.pendedBusiness.uploadApplicationModal.uploadHint",
            "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
        ]);
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
