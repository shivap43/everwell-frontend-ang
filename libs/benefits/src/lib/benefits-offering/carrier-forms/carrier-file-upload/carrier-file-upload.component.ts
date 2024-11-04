import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from "@angular/core";
import { Observable, Subscription, Subject, of } from "rxjs";
import { HttpEvent, HttpResponse, HttpEventType } from "@angular/common/http";
import { DocumentApiService } from "@empowered/api";
import { catchError, switchMap, takeUntil } from "rxjs/operators";
import { AccountListState } from "@empowered/ngxs-store";
import {
    ApiResponseData,
    AppSettings,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    DECIMAL,
    END_INDEX,
    Percentages,
    RedirectResponseCode,
    START_INDEX,
    SuccessResponseCode,
} from "@empowered/constants";
import { Store } from "@ngxs/store";
import { FileUploadService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-carrier-file-upload",
    templateUrl: "./carrier-file-upload.component.html",
    styleUrls: [],
})
export class CarrierFileUploadComponent implements OnChanges {
    @Input() uploadApi: Observable<HttpEvent<any>>;
    @Input() isMultipartFileUploadEnabled: boolean;
    @Input() maxFileSize: number;
    @Output() fileUploaded: EventEmitter<File> = new EventEmitter<File>();
    @Output() documentIdReceived: EventEmitter<number> = new EventEmitter<number>();
    acceptableFormats = ".png,.jpeg,.jpg,.pdf";
    modeProgress = "determinate";
    files: File[] | (File & { modifiedName: string }[]) = [];
    hasError: boolean[] = [];
    isSucess: boolean[] = [];
    uploadSuccessStatus = [];
    lastUploadFileName: string;
    documentId: number;
    documentIds: number[] = [];
    fileUploadPercentage: number;
    isFileUploaded: boolean;
    isProgressBarEnabled: boolean;
    isUploadingStarted: boolean;
    uploadErrorStatus: string[];
    isFileSelected: boolean;
    subscription: Subscription;
    errorMessage: string;
    hasWarning: boolean;
    warningMessage;
    private unsubscribe$ = new Subject<void>();
    constructor(
        private documentsService: DocumentApiService,
        private store: Store,
        private fileUploadService: FileUploadService,
        private languageService: LanguageService,
    ) {}

    /**
     * @description method to validate the file
     * @param event file for uploading
     * @returns void
     */
    validateFileAndUpload(event: File): void {
        this.cancelUpload();
        let modifiedName: string;
        if (event.name.length > AppSettings.DOC_LENGTH) {
            modifiedName = `${event.name.slice(0, AppSettings.DOC_LENGTH_FIRST_N_CHARS)}...${event.name.slice(
                -AppSettings.DOC_LENGTH_LAST_N_CHARS,
            )}`;
        } else {
            modifiedName = event.name;
        }

        const file: File & { modifiedName: string } = {
            ...event,
            name: event.name,
            modifiedName: modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
        };
        this.files = [file];
        this.fileUploadPercentage = 0;
        this.isProgressBarEnabled = false;
        this.isUploadingStarted = true;
        if (file.size > this.maxFileSize) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.maxFileSize.error");
        } else {
            this.uploadFile(event);
        }
    }

    /**
     * @description method to upload file to aws s3 using presigned url
     * @param file file for uploading
     * @returns void
     */
    uploadFile(file: File): void {
        if (this.isMultipartFileUploadEnabled) {
            this.fileUploaded.emit(file);
        } else {
            this.fileUploadService
                .upload(file)
                .pipe(
                    switchMap(() => {
                        this.fileUploaded.emit(file);
                        return of(null);
                    }),
                    catchError(() => {
                        this.setDataForError();
                        this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                        return of(null);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }
    /**
     * @description method to set data when error occurs
     * @returns void
     */
    setDataForError(): void {
        this.hasError = [];
        this.isSucess = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.isFileUploaded = false;
        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
        this.hasError = [true];
        this.isSucess = [false];
        this.uploadSuccessStatus = [""];
    }
    cancelUpload(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.documentId) {
            this.documentsService.deleteDocument(this.documentId, this.store.selectSnapshot(AccountListState.getGroup).id).subscribe();
        }
        this.files = [];
        this.hasError = [];
        this.isSucess = [];
        this.documentIds = [];
        this.uploadSuccessStatus = [];
        this.uploadErrorStatus = [];
        this.isFileSelected = false;
        this.isUploadingStarted = false;
    }
    ngOnChanges(changes: SimpleChanges): void {
        this.uploadApi = changes.uploadApi.currentValue;
        if (this.uploadApi) {
            this.subscription = this.uploadApi.pipe(takeUntil(this.unsubscribe$)).subscribe(
                (events) => {
                    if (events instanceof HttpResponse) {
                        this.documentId = parseInt(
                            events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/").slice(END_INDEX)[START_INDEX],
                            DECIMAL,
                        );
                        this.documentIds = [this.documentId];
                        this.documentIdReceived.emit(this.documentId);
                    }
                    if (events.type === HttpEventType.UploadProgress) {
                        this.fileUploadPercentage = Math.round((events.loaded / events.total) * Percentages.FILE_UPLOAD_MAX_PERCENTAGE);
                    } else if (events.type === HttpEventType.Response && events.status === SuccessResponseCode.RESP_202) {
                        this.isFileUploaded = true;
                        this.isProgressBarEnabled = true;
                        this.fileUploadPercentage = Percentages.FILE_UPLOAD_MAX_PERCENTAGE;
                        this.isSucess = [true];
                        this.hasError = [false];
                        this.unsubscribe$.next();
                    }
                },
                (error) => {
                    this.setDataForError();
                    if (error.status === ClientErrorResponseCode.RESP_413) {
                        this.errorMessage = "secondary.portal.shared.monUpload.maxFileSize.error";
                    } else if (error.status === ClientErrorResponseCode.RESP_415) {
                        this.errorMessage = "secondary.portal.shared.monUpload.fileFormat.error";
                    } else if (error.status === ClientErrorResponseCode.RESP_409) {
                        this.errorMessage = "secondary.portal.shared.monUpload.uploading.error";
                    } else if (error.status === RedirectResponseCode.RESP_300) {
                        this.hasWarning = true;
                        this.warningMessage = "secondary.portal.shared.monUpload.mapping.warning";
                    } else if (error.status === ClientErrorResponseCode.RESP_400) {
                        if (error.error.code === ClientErrorResponseType.MISSING_PARAMETER) {
                            this.errorMessage = "secondary.portal.shared.monUpload.file.FileRequirederror";
                        } else if (
                            error.error.details?.length &&
                            error.error.details[0].field ===
                                this.languageService.fetchPrimaryLanguageValue(
                                    "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
                                )
                        ) {
                            this.errorMessage = "primary.portal.members.document.addUpdate.virusDetectedError";
                        }
                    } else {
                        this.errorMessage = "";
                    }
                    this.uploadErrorStatus = [this.errorMessage];
                    this.unsubscribe$.next();
                },
            );
        }
    }
}
