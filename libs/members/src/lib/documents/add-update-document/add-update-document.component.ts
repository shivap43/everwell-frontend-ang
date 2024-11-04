import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { FormGroup, FormBuilder } from "@angular/forms";
import { MonDialogData, MonDialogComponent } from "@empowered/ui";
import { DocumentApiService, MemberService } from "@empowered/api";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Subscription, Observable, Subject, forkJoin, of } from "rxjs";
import { DatePipe } from "@angular/common";
import { takeUntil, switchMap, filter, tap, catchError } from "rxjs/operators";
import {
    ClientErrorResponseCode,
    AppSettings,
    FileDetails,
    Percentages,
    SuccessResponseCode,
    ClientErrorResponseType,
    ApiResponseData,
    ConfigName,
} from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { FileUploadService } from "@empowered/common-services";

const DECIMALS = 0;
@Component({
    selector: "empowered-add-update-document",
    templateUrl: "./add-update-document.component.html",
    styleUrls: ["./add-update-document.component.scss"],
})
export class AddUpdateDocumentComponent implements OnInit, OnDestroy {
    memberId: string;
    mpGroupId: number;
    fileBrowsed: boolean;
    accept = "";
    isSpinnerLoading: boolean;
    showNoDocumentError: boolean;
    uploadedDocument = [];
    maxCharText: string;
    lastUpdatedNoteText: string;
    files: any[] = [];
    fileError: boolean;
    modeProgress = "determinate";
    isFileUploaded = false;
    isFileSelected = true;
    fileUploadPercentage = 0;
    formInfo: any;
    maxFileUploadSize: number;
    maxNoteLength: number;
    showErrorMessage = false;
    errorMessage = "";
    hintText: string;
    isUploadingStarted = false;
    hasError: boolean[] = [];
    isSuccess: boolean[] = [];
    uploadErrorStatus: string[] = [];
    uploadSuccessStatus: string[] = [];
    isProgressBarEnabled: boolean;
    selectForUpload: boolean;
    isExistingDoc = false;
    isFileAvailable = false;
    hasWarning = false;
    lastUploadedFileDate: string | Date;
    lastUploadFileName: string;
    AddDocumentForm: FormGroup;
    deletedDocumentList: number[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject();
    langStrings = {};
    modeType = {
        ADD: "ADD",
        EDIT: "EDIT",
    };
    leaveWithoutSavingPopup: any;
    mode: string;
    noteId: string;
    title: string;
    addButtonClicked = false;

    // UPLOAD
    isFileDragged: boolean;
    isAddUpdateMemberNoteSuccessful = false;
    multipartFileUploadConfig = false;

    constructor(
        private readonly dialogRef: MatDialogRef<AddUpdateDocumentComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly fb: FormBuilder,
        private readonly documentService: DocumentApiService,
        private readonly store: Store,
        private readonly datepipe: DatePipe,
        private readonly memberService: MemberService,
        private readonly languageService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly fileUploadService: FileUploadService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /** *
     * angular life cycle hooks for initializing all document and note variables data
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.isSpinnerLoading = false;
        this.mode = this.data.mode;
        this.formInfo = this.data.formInfo ? this.data.formInfo : null;
        this.mpGroupId = this.data.mpGroupId;
        this.memberId = this.data.memberId;
        this.showNoDocumentError = false;
        this.maxFileUploadSize = this.data.maxFileSize;
        this.maxNoteLength = this.data.maxNoteLength;
        this.fetchLanguageStrings();
        this.hintText = this.langStrings["primary.portal.members.document.addUpdate.hint"].replace(
            "#size#",
            (this.data.maxFileSize / (1024 * 1024)).toFixed(DECIMALS),
        );
        this.AddDocumentForm = this.fb.group({
            note: [""],
        });
        if (this.mode === this.modeType.EDIT) {
            this.title = this.langStrings["primary.portal.members.document.addUpdate.updateTitle"];
            this.noteId = this.data.id;
            this.getMemberNote();
        } else {
            this.title = this.langStrings["primary.portal.members.document.addUpdate.addTitle"];
        }
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.ALLOW_MULTIPART_FILE_UPLOAD)
            .pipe(
                tap((isConfigEnabled) => (this.multipartFileUploadConfig = isConfigEnabled)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    getMemberNote(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.memberService
            .getMemberNote(this.memberId, this.mpGroupId.toString(), this.noteId, "documentIds,updateAdminId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    this.patchValues(Response);
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(Error);
                },
            );
    }

    /** *
     * this function used for patching note data and updating last updated document notes
     * @param data: document notes response data
     */
    patchValues(data: any): void {
        if (data.text) {
            this.AddDocumentForm.get("note").patchValue(data.text);
        }
        const formattedDate = this.datepipe.transform(data.updateDate ? data.updateDate : data.createDate, AppSettings.DATE_TIME_FORMAT);
        this.lastUpdatedNoteText = this.langStrings["primary.portal.members.document.addUpdate.lastUpdatedDate"].replace(
            "##date##",
            formattedDate,
        );

        if (data.documents.length) {
            data.documents.forEach((doc) => {
                let modifiedName = doc.fileName;
                if (doc.fileName.length > 24) {
                    const first16 = doc.fileName.substring(0, 15);
                    const last8 = doc.fileName.substring(doc.fileName.length - 8, doc.fileName.length);
                    modifiedName = first16 + "..." + last8;
                }

                const uploadDate = this.datepipe.transform(doc.uploadDate, AppSettings.DATE_TIME_FORMAT);
                const successStatus = this.langStrings["primary.portal.members.document.addUpdate.uploadedOn"]
                    .toString()
                    .replace("##date##", " " + uploadDate);
                const file: any = {
                    name: doc.fileName,
                    modifiedName: modifiedName,
                    lastModified: doc.uploadDate,
                    alreadyUploaded: true,
                    isError: false,
                    isSuccess: true,
                    canDownload: true,
                    errorStatus: "",
                    successStatus: successStatus,
                    isProgressBarEnabled: false,
                    isUploadingStarted: false,
                    documentId: doc.id,
                };
                this.files.unshift(file);
                this.uploadedDocument.push(doc.id);
            });
        }
    }

    closePopup(flag?: boolean): void {
        if (this.uploadedDocument.length || this.AddDocumentForm.get("note").value) {
            this.openLeaveWithoutSavingPopup();
        } else {
            this.deletedDocumentList = [];
            this.dialogRef.close(flag);
        }
    }

    addupdateDocumentNotes(isAdd: boolean): void {
        this.addButtonClicked = true;
        this.showNoDocumentError = false;
        this.hideErrorAlertMessage();
        const text = this.AddDocumentForm.get("note").value;
        if ((text && text !== "") || this.uploadedDocument.length) {
            if (this.AddDocumentForm.valid) {
                const payload = {
                    text: text,
                    documentIds: this.uploadedDocument,
                    formInfo: !(this.data.formInfo === null || this.data.formInfo === undefined) ? this.data.formInfo : null,
                };
                const addUpdateMemberNoteSubscriber = isAdd
                    ? this.memberService.createMemberNote(this.memberId, this.mpGroupId.toString(), payload)
                    : this.memberService.updateMemberNote(this.memberId, this.mpGroupId.toString(), this.noteId, payload);
                addUpdateMemberNoteSubscriber
                    .pipe(
                        tap(
                            () => {
                                this.isAddUpdateMemberNoteSuccessful = true;
                                this.uploadedDocument = [];
                                this.AddDocumentForm.get("note").setValue("");
                            },
                            (error) => {
                                this.showErrorAlertMessage(error);
                            },
                        ),
                        filter(() => this.isAddUpdateMemberNoteSuccessful),
                        switchMap(() => this.removeDocumentsFromDatabase()),
                        tap(() => this.closePopup(true)),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe();
            }
        } else {
            this.showNoDocumentError = true;
            this.addButtonClicked = false;
        }
    }

    /**
     * Function to delete the file selected and to call the API to update it at the backend too
     * @param index : Index of the document in the array stored in order to be removed
     * @param documentId : the ID of the document that has to be removed
     */
    removeDocumentFromFiles(index: number, documentId?: number): void {
        if (documentId) {
            this.uploadedDocument = this.uploadedDocument.filter((x) => x !== documentId);
        }
        this.files.splice(index, 1, null);
        const text = this.AddDocumentForm.get("note").value;
        this.uploadSuccessStatus.splice(index, 1, "");
        this.uploadErrorStatus.splice(index, 1, "");
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
        }
        const otherThanNull = this.files.some(function (element: any): boolean {
            return element !== null;
        });
        if (!otherThanNull) {
            this.files = [];
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.hasError = [];
            this.isSuccess = [];
        }
    }

    /** *
     * @description method for validating the uploaded file
     * @param document: document file for uploading
     * @returns void
     */
    validateFileAndUpload(document: File): void {
        this.showNoDocumentError = false;
        const size = document.size;
        const name = document.name;
        let modifiedName = name;
        this.fileError = false;
        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(document.name.length - 8, document.name.length);
            modifiedName = first16 + "..." + last8;
        }
        const file: FileDetails = {
            name: document.name,
            modifiedName: modifiedName,
            lastModified: document.lastModified,
            size: document.size,
            type: document.type,
            slice: document.slice,
            alreadyUploaded: false,
            isError: false,
            isSuccess: false,
            canDownload: false,
            errorStatus: "",
            successStatus: "",
            isProgressBarEnabled: false,
            isUploadingStarted: false,
            documentId: undefined,
        };

        if (this.maxFileUploadSize <= size) {
            file.isError = true;
            file.isSuccess = false;
            file.errorStatus = this.langStrings["primary.portal.members.document.addUpdate.fileMaxSizeError"];
            this.files.unshift(file);
        } else {
            file.isFileSelected = true;
            file.isProgressBarEnabled = true;
            file.isFileUploaded = false;
            file.isUploadingStarted = true;
            file.modeProgress = "determine";
            file.fileUploadPercentage = 0;
            this.uploadFile(document, file);
        }
    }

    /**
     * @description method to upload document to aws s3 using presigned url
     * @param document document for uploading
     * @param file contains details about the file
     * @returns void
     */
    uploadFile(document: File, file: FileDetails): void {
        if (this.multipartFileUploadConfig) {
            this.processFile(document, file).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.fileUploadService
                .upload(document)
                .pipe(
                    switchMap(() => this.processFile(document, file)),
                    catchError(() => {
                        file.isError = true;
                        file.isSuccess = false;
                        file.errorStatus = this.languageService.fetchSecondaryLanguageValue(
                            "secondary.portal.shared.monUpload.genericError",
                        );
                        this.files.unshift(file);
                        return of(null);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description method to process the uploaded document
     * @param document the document uploaded
     * @param file contains details about the file
     * @returns Observable<void>
     */
    processFile(document: File, file: FileDetails): Observable<void> {
        return this.documentService.uploadDocument(document, this.multipartFileUploadConfig, this.mpGroupId).pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.Sent) {
                    this.files.unshift(file);
                } else if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_PERCENTAGE_33 * events.loaded) / events.total);
                } else if (events.type === HttpEventType.Response && events.status === SuccessResponseCode.RESP_202) {
                    this.files[0].isFileUploaded = true;
                    this.files[0].fileUploadPercentage = Percentages.FILE_UPLOAD_MAX_PERCENTAGE;
                }
                if (events instanceof HttpResponse) {
                    const docId = parseInt(
                        events.headers
                            .get(ApiResponseData.RESP_HEADER_LOCATION)
                            .substring(events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).lastIndexOf("/") + 1),
                        10,
                    );
                    this.getUploadedDocument(docId);
                }
                return of(null);
            }),
            catchError((error: Error) => {
                this.files[0].isError = true;
                this.files[0].isSuccess = false;
                const errorDetail = error["error"];
                if (
                    errorDetail.status === ClientErrorResponseCode.RESP_415 &&
                    error["code"] === ClientErrorResponseType.UNSUPPORTED_MEDIA_TYPE
                ) {
                    this.files[0].errorStatus = this.langStrings["primary.portal.members.document.addUpdate.invalidFileFormat"];
                } else if (
                    errorDetail.status === ClientErrorResponseCode.RESP_400 &&
                    errorDetail.details?.length &&
                    errorDetail.details[0].field ===
                        this.langStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                ) {
                    this.files[0].errorStatus = this.langStrings["primary.portal.members.document.addUpdate.virusDetectedError"];
                } else {
                    this.files[0].errorStatus = this.langStrings["primary.portal.members.document.addUpdate.uploadGenericError"];
                }
                this.files[0].successStatus = "";
                return of(null);
            }),
        );
    }

    getUploadedDocument(docId: number): void {
        this.documentService
            .getDocument(docId, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                if (Response && (!Response.status || Response.status === AppSettings.PROCESSING)) {
                    this.getUploadedDocument(docId);
                } else {
                    const docStatus = Response.status;
                    if (docStatus === AppSettings.COMPLETE) {
                        this.uploadedDocument.push(docId);
                        this.files[0].isError = false;
                        this.files[0].isSuccess = true;
                        this.files[0].successStatus = this.langStrings["primary.portal.members.document.addUpdate.uploadSuccessfuly"];
                        this.files[0].documentId = docId;
                    } else if (docStatus === AppSettings.VIRUS_SCAN_FAILED) {
                        this.files[0].isError = true;
                        this.files[0].isSuccess = false;
                        this.files[0].errorStatus = this.langStrings["primary.portal.members.document.addUpdate.virusDetectedError"];
                    } else {
                        this.files[0].isError = true;
                        this.files[0].isSuccess = false;
                        this.files[0].errorStatus = this.langStrings["primary.portal.members.document.addUpdate.uploadGenericError"];
                    }
                }
            });
    }

    /** *
     * Function used for opening the leave without saving popup
     */
    openLeaveWithoutSavingPopup(): void {
        const dialogData: MonDialogData = {
            title: this.langStrings["primary.portal.members.document.leaveWithoutSave.title"],
            content: this.langStrings["primary.portal.members.document.leaveWithoutSave.desc"],
            primaryButton: {
                buttonTitle: this.langStrings["primary.portal.members.document.leaveWithoutSave.button"],
                buttonAction: this.onLeaveWithoutSavingAction.bind(this, true),
                buttonClass: "mon-btn-primary",
            },
            secondaryButton: {
                buttonTitle: this.langStrings["primary.portal.common.cancel"],
                buttonAction: this.onLeaveWithoutSavingAction.bind(this, false),
            },
        };
        this.leaveWithoutSavingPopup = this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
        this.leaveWithoutSavingPopup
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (res === this.langStrings["primary.portal.members.document.leaveWithoutSave.button"]) {
                    this.dialogRef.close(true);
                }
            });
    }

    /**
     * Function called to remove the selected document on the click on delete icon
     * @param index : Index of the document in the array stored in order to be removed
     */
    removeDocument(index: number): void {
        const file: any = this.files[index];
        if (file.documentId && file.alreadyUploaded) {
            this.deletedDocumentList.push(file.documentId);
        }
        this.removeDocumentFromFiles(index, file.documentId);
    }

    /**
     * Function called to remove the deleted document permanently on the click on update documents
     */
    removeDocumentsFromDatabase(): Observable<void[]> {
        // If there are no documents to delete return Observable of null
        if (this.deletedDocumentList.length <= 0) {
            return of(null);
        }
        const array = this.deletedDocumentList.map((documentId) => this.documentService.deleteDocument(documentId, this.mpGroupId));
        return forkJoin(array);
    }

    onLeaveWithoutSavingAction(flag: boolean): void {
        if (flag) {
            this.leaveWithoutSavingPopup.close(true);
        }
    }

    downloadFile(event: any): void {
        const fileName = event.name;
        const fileType = fileName.split(".").pop();
        this.documentService
            .downloadDocument(event.documentId, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                switch (fileType) {
                    case "pdf": {
                        const pdfBlob = new Blob([response], { type: "application/pdf" });
                        const fileurl = URL.createObjectURL(pdfBlob);
                        window.open(fileurl, "_blank");
                        break;
                    }
                    default: {
                        const blob = new Blob([response], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        });
                        const anchor = document.createElement("a");
                        anchor.download = fileName;
                        const fileURLBlob = URL.createObjectURL(blob);
                        anchor.href = fileURLBlob;
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                }
            });
    }

    downloadForm(formType: string, formId: number): void {
        this.isSpinnerLoading = true;
        this.memberService
            .downloadMemberForm(+this.memberId, formType, formId, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: any) => {
                    this.isSpinnerLoading = false;
                    const formBlob = new Blob([response], { type: "text/html" });
                    const anchor = document.createElement("a");
                    anchor.download = formType;
                    const fileURLBlob = URL.createObjectURL(formBlob);
                    anchor.href = fileURLBlob;
                    document.body.appendChild(anchor);
                    anchor.click();
                },
                (error: any) => {
                    this.isSpinnerLoading = false;
                },
            );
    }

    /**
     * This function used for fetching language data for content display
     * @returns nothing
     */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.cancel",
            "primary.portal.common.remove",
            "primary.portal.common.close",
            "primary.portal.common.update",
            "primary.portal.common.add",
            "primary.portal.common.optional",
            "primary.portal.members.document.addUpdate.documents",
            "primary.portal.members.document.addUpdate.notes",
            "primary.portal.members.document.addUpdate.MaxChar",
            "primary.portal.members.document.addUpdate.lastUpdatedDate",
            "primary.portal.members.document.addUpdate.noDocumentError",
            "primary.portal.members.document.addUpdate.addTitle",
            "primary.portal.members.document.addUpdate.updateTitle",
            "primary.portal.members.document.leaveWithoutSave.title",
            "primary.portal.members.document.leaveWithoutSave.desc",
            "primary.portal.members.document.leaveWithoutSave.button",
            "primary.portal.members.document.addUpdate.uploadedOn",
            "primary.portal.members.document.addUpdate.hint",
            "primary.portal.members.document.addUpdate.invalidFileFormat",
            "primary.portal.members.document.addUpdate.fileMaxSizeError",
            "primary.portal.members.document.addUpdate.virusDetectedError",
            "primary.portal.members.document.addUpdate.uploadSuccessfuly",
            "primary.portal.members.document.addUpdate.uploadGenericError",
            "primary.portal.shared.ui.monUpload.uploadLabel",
            "primary.portal.shared.ui.monUpload.filesForUpload",
            "primary.portal.shared.ui.monUpload.uploadLabel.browse",
            "secondary.portal.shared.monUpload.genericError",
            "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
        ]);
        this.maxCharText = this.langStrings["primary.portal.members.document.addUpdate.MaxChar"].replace("##no##", this.maxNoteLength);
    }

    allowDrop(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = true;
    }

    drag(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = false;
    }

    drop(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = false;
        const file = ev.dataTransfer.files;
        this.validateFileAndUpload(file[0]);
    }

    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }

    /**
     * Error handling configuration
     * @param err - error response data
     * @returns nothing
     */
    showErrorAlertMessage(err: Error): void {
        const error = err["error"];
        this.showErrorMessage = true;
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.documents.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
