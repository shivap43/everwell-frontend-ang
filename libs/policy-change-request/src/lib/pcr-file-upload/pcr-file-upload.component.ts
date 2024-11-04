import { DatePipe } from "@angular/common";
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from "@angular/core";
import { PolicyChangeRequestService } from "@empowered/api";
import { HttpResponse, HttpEventType, HttpEvent } from "@angular/common/http";
import { ApiResponseData, AppSettings, DECIMAL, END_INDEX, START_INDEX } from "@empowered/constants";
import { Subscription, Observable, Subject, EMPTY, iif, of } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { catchError, switchMap, takeUntil } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";
import { FileUploadService } from "@empowered/common-services";

@Component({
    selector: "empowered-pcr-file-upload",
    templateUrl: "./pcr-file-upload.component.html",
    styleUrls: ["./pcr-file-upload.component.scss"],
    providers: [DatePipe],
})
export class PcrFileUploadComponent implements OnInit, OnDestroy {
    policyChangeDocumentSubscription: Subscription;
    @Input() uploadApi: Observable<HttpEvent<any>>;
    invalidFileExtension: boolean;
    fileExtension: string;
    fileError: boolean;
    isFileSelected: boolean;
    isFileAvailable: boolean;
    isFileViewable = false;
    showSpinner: boolean;
    @Input() set supDoc(supDoc: File[]) {
        if (supDoc) {
            this.supportingDocuments = supDoc;
            this.setSupportingDocument();
        }
    }
    @Input() formId: number;
    @Input() mpGroup: number;
    @Input() memberId: number;
    @Input() cifNumber: string;
    @Output() fileUploaded: EventEmitter<File> = new EventEmitter();
    @Output() getDocumentId: EventEmitter<number> = new EventEmitter();
    @Output() removeDocument: EventEmitter<number> = new EventEmitter();
    @Input() isFileUploadFromTransaction: boolean;
    @Input() documentIds = [];
    @Input() newDocumentIds: Array<number>;

    acceptableFormats = ".png,.jpeg,.jpg,.pdf";
    modeProgress = "determinate";
    files: any[] = [];
    hasError: boolean[] = [];
    isSucess: boolean[] = [];
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
    lastUploadedFileDate: string | Date;
    supportingDocuments: any;
    allowMultipartFileUpload: boolean;
    maxFileSizeAllowed: number;

    constructor(
        private readonly store: Store,
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly langService: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly fileUploadService: FileUploadService,
    ) {}

    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.policyChangeRequest.*"));
        this.getDocuments();
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.allowMultipartFileUpload = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    setSupportingDocument(): void {
        if (this.supportingDocuments.length > 0) {
            this.showSpinner = true;
            this.supportingDocuments.forEach((doc) => {
                let modifiedName: string;
                if (doc.fileName.length > AppSettings.DOC_LENGTH) {
                    modifiedName = `${doc.fileName.slice(0, 16)}...${doc.fileName.slice(-8)}`;
                } else {
                    modifiedName = doc.fileName;
                }
                doc["modifiedName"] = modifiedName;
                const file: any = {
                    id: doc.id,
                    name: doc.fileName,
                    modifiedName: modifiedName,
                    isExisting: true,
                };
                this.files.push(file);
                this.isSucess.push(true);
                this.hasError.push(false);
                this.uploadErrorStatus.push("");
                this.uploadSuccessStatus.push(this.datePipe.transform(doc.uploadDate, AppSettings.DATE_TIME_FORMAT));
                this.isFileAvailable = true;
                this.isFileUploaded = true;
            });
        }
        this.showSpinner = false;
    }

    getDocuments(): void {
        if (this.documentIds) {
            this.documentIds.forEach((element) => {
                this.policyChangeDocumentSubscription = this.policyChangeRequestService
                    .getPolicyChangeTransactionDocument(element)
                    .subscribe((data) => {
                        let modifiedName: string;
                        if (data.fileName.length > AppSettings.DOC_LENGTH) {
                            modifiedName = `${data.fileName.slice(0, 16)}...${data.fileName.slice(-8)}`;
                        } else {
                            modifiedName = data.fileName;
                        }
                        data["modifiedName"] = modifiedName;
                        const file: any = {
                            name: data.fileName,
                            modifiedName: modifiedName,
                        };
                        this.files.push(file);
                        this.isSucess.push(true);
                        this.hasError.push(false);
                        this.isFileAvailable = true;
                        this.isFileUploaded = true;
                    });
            });
        }
    }

    uploadFile(event: File): void {
        this.fileUploaded.emit(event);
        this.fileExtension = event.name.split(".").pop();
        const notAllowedFormats = AppSettings.INVALID_FILE_EXETENSIONS_FOR_PCR_DOCUMENT;
        this.invalidFileExtension = false;
        notAllowedFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = true;
            }
        });
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
        this.files.push(file);
        if (this.invalidFileExtension) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.policyChangeRequest.policyChangeRequestView.fileFormat.error");
        } else if (file.size > this.maxFileSizeAllowed) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.policyChangeRequest.policyChangeRequestView.maxFileSize.error");
        } else {
            this.fileError = true;
            this.isFileSelected = true;
            this.isFileUploaded = false;
            this.isFileAvailable = true;
            this.isUploadingStarted = true;
            this.isProgressBarEnabled = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            this.onfileUploaded(event);
        }
    }

    /**
     * @description function to set data for file error
     * @returns void
     */
    setDataForError(): void {
        this.hasError.push(true);
        this.isSucess.push(false);
        this.fileError = true;
        this.uploadSuccessStatus.push("");
        this.isProgressBarEnabled = true;
        this.isFileSelected = true;
        this.isFileAvailable = true;
    }
    cancelUpload(index: number): void {
        const file = this.files.splice(index, 1).pop();
        this.uploadSuccessStatus.splice(index, 1);
        this.uploadErrorStatus.splice(index, 1);
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
            this.subscription.unsubscribe();
        }
        if (this.isFileUploaded) {
            this.documentId = undefined;
        }
        if (this.newDocumentIds && this.newDocumentIds.length && file && file.id) {
            this.removeDocument.emit(file.id);
        } else {
            this.getDocumentId.emit(this.documentId);
        }
        if (this.files.length === 0) {
            this.files = [];
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.hasError = [];
            this.isSucess = [];
        }
    }
    /**
     Uploads the File to S3 bucket and makes call to the backend to reference the uploaded file.
     * @param file - File to be uploaded
     */
    onfileUploaded(file: File): void {
        if (file) {
            this.subscription = iif(
                () => this.allowMultipartFileUpload,
                of(null),
                this.fileUploadService.upload(file).pipe(
                    catchError(() => {
                        this.resetValuesForError();
                        this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                        return EMPTY;
                    }),
                ),
            )
                .pipe(
                    switchMap(() =>
                        this.policyChangeRequestService.uploadSupportiveTransactionDocuments(
                            file,
                            this.mpGroup,
                            this.memberId,
                            this.cifNumber,
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
                            this.isSucess.push(true);
                            this.hasError.push(false);
                            this.isUploadingStarted = false;
                        }
                        if (events instanceof HttpResponse) {
                            this.uploadErrorStatus.push("");
                            this.uploadSuccessStatus.push(
                                this.langService.fetchPrimaryLanguageValue(
                                    "primary.portal.policyChangeRequest.policyChangeRequestView.successfullyUploaded",
                                ),
                            );
                            this.documentId = parseInt(
                                events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/").slice(END_INDEX)[START_INDEX],
                                DECIMAL,
                            );
                            this.getDocumentId.emit(this.documentId);
                            this.files[this.files.length - 1].id = this.documentId;
                        }
                        if (events.type === HttpEventType.UploadProgress) {
                            this.fileUploadPercentage = Math.round((events.loaded / events.total) * 100);
                        } else if (events.type === HttpEventType.Response && events.status === AppSettings.API_RESP_202) {
                            this.isFileUploaded = true;
                            this.isProgressBarEnabled = true;
                        }
                    },
                    (error) => {
                        this.resetValuesForError();
                        let fileError = "";
                        if (error.status === AppSettings.API_RESP_413) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.maxFileSize.error";
                        } else if (error.status === AppSettings.API_RESP_415) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.fileFormat.error";
                        } else if (error.status === AppSettings.API_RESP_409) {
                            fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.uploading.error";
                        } else if (error.status === AppSettings.API_RESP_300) {
                            this.hasWarning = true;
                            this.warningMessage = "secondary.portal.policyChangeRequest.policyChangeRequestView.mapping.warning";
                        } else if (error.status === AppSettings.API_RESP_400) {
                            if (error.error.code === AppSettings.MISSINGPARAMETER) {
                                fileError = "secondary.portal.policyChangeRequest.policyChangeRequestView.file.FileRequirederror";
                            } else if (
                                error.error.details?.length &&
                                error.error.details[0].field ===
                                    this.langService.fetchPrimaryLanguageValue(
                                        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
                                    )
                            ) {
                                fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                            }
                        }
                        this.uploadErrorStatus.push(fileError);
                        this.unsubscribe$.next();
                    },
                );
        }
    }

    /**
     * Resets the error variables in case of an error
     */
    resetValuesForError(): void {
        this.isFileUploaded = false;
        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
        this.hasError.push(true);
        this.isSucess.push(false);
        this.uploadSuccessStatus.push("");
    }

    ngOnDestroy(): void {
        if (this.policyChangeDocumentSubscription) {
            this.policyChangeDocumentSubscription.unsubscribe();
        }
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
