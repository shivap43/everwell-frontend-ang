import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { QLEEndPlanRequestStatus, MemberService, DocumentApiService, StaticService } from "@empowered/api";

import { Store, Select } from "@ngxs/store";
import { DatePipe } from "@angular/common";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { Subscription, Observable, of } from "rxjs";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import {
    DateFormats,
    FileUploadMessage,
    AppSettings,
    Validity,
    StatusType,
    MemberQualifyingEvent,
    MemberQualifyingEventApprove,
    FileDetails,
    Percentages,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ApiResponseData,
    Document,
} from "@empowered/constants";
import { filter, switchMap, tap, catchError } from "rxjs/operators";
import { AccountListState, SharedState, RegexDataType } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { FileUploadService } from "@empowered/common-services";

export interface DialogData {
    selectedVal: MemberQualifyingEventApprove;
}

const ONE_DAY = 1;
const DAY = "day";
@Component({
    selector: "empowered-approve-deny-end-coverage",
    templateUrl: "./approve-deny-end-coverage.component.html",
    styleUrls: ["./approve-deny-end-coverage.component.scss"],
})
export class ApproveDenyEndCoverageComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    acceptableFormats: string;
    nonAcceptableFormats: string;
    MAX_FILE_NAME_LENGTH = 24;
    FILE_NAME_FIRST_PART = 15;
    FILE_NAME_SECOND_PART = 8;
    DOC_ID_SPLIT_START_INDEX = 5;
    DOC_ID_SPLIT_END_INDEX = 10;
    isFileAvailable: boolean;
    isFileSelected = false;
    isProgressBarEnabled: boolean;
    files: FileDetails[] = [];
    uploadSuccessStatus: string[] = [];
    uploadErrorStatus: string[] = [];
    hasError: boolean[] = [];
    isSuccess: boolean[] = [];
    modeProgress = "determinate";
    isUploadingStarted = false;
    fileUploadPercentage = 0;
    isFileViewable = true;
    TEXT_AREA_LENGTH = 250;
    fileUploadSubscription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.endCoverage.qle.reviewRequest",
        "primary.portal.common.optional",
        "primary.portal.endCoverage.qle.eventDate",
        "primary.portal.endCoverage.qle.requestedCoverageEndDate",
        "primary.portal.qle.notesLabel",
        "primary.portal.qle.addNewQle.fileUploadText",
        "primary.portal.common.dateHint",
        "primary.portal.endCoverage.qle.deny",
        "primary.portal.endCoverage.qle.approve",
        "primary.portal.common.requiredField",
        "primary.portal.common.datePast",
        "primary.portal.endCoverage.maxCharacters",
        "primary.portal.qle.producerComments",
        "primary.portal.qle.employeeComments",
        "primary.portal.members.document.addUpdate.virusDetectedError",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);

    selectedQLE: MemberQualifyingEventApprove;
    mpGroupId: number;
    errorResponse: boolean;
    isLoading: boolean;
    errorMessage: string;
    documentIds: number[] = [];
    form: FormGroup;
    eventDate: string;
    coverageEndDate: string;
    requestedCoverageEndDate: string;
    adminComment: string;
    fileExtension: string;
    invalidFileExtension: boolean;
    modifiedName: string;
    fileError = false;
    isFileUploaded = false;
    subscriptions: Subscription[] = [];
    deleteDocumentIds: number[] = [];
    DETERMINE = "determine";
    INDETERMINATE = "indeterminate";
    secondaryLanguageStrings: Record<string, string>;
    onFormSubmit = false;
    todayDate = new Date();
    NOT_ALLOWED_FILE_TYPE_CONFIG = "general.upload.not_allowed_file_types";
    ALLOWED_FILE_TYPE_CONFIG = "qle.upload.allowed_file_types";
    qualifyingEvent: MemberQualifyingEvent = {} as MemberQualifyingEvent;
    memberId: number;
    PRODUCER = "PRODUCER";
    SUBSCRIBER = "SUBSCRIBER";
    validationRegex: RegexDataType;
    isAdminCommentValid: boolean;
    isMemberCommentValid: boolean;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;

    constructor(
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly dialogRef: MatDialogRef<ApproveDenyEndCoverageComponent>,
        private readonly datePipe: DatePipe,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly documentService: DocumentApiService,
        private readonly staticService: StaticService,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
    ) {
        this.subscriptions.push(
            this.regex$.pipe(filter((regexData) => regexData !== undefined && regexData !== null)).subscribe((regexData) => {
                this.validationRegex = regexData;
            }),
        );
    }

    /**
     * This is the initial function that gets executed in this component
     * @returns void
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
                this.getSecondaryLanguageStrings();
            }),
        );
        this.acceptableFormats = this.data.selectedVal.acceptableFormats;
        this.subscriptions.push(
            this.staticService
                .getConfigurations(this.NOT_ALLOWED_FILE_TYPE_CONFIG, this.mpGroupId)
                .subscribe((data) => (this.nonAcceptableFormats = data[0].value)),
        );
        this.selectedQLE = this.data.selectedVal;
        if (this.selectedQLE.adminComment) {
            this.isAdminCommentValid = !this.selectedQLE.adminComment.match(new RegExp(this.validationRegex.ACCOUNT_NAME));
        }
        if (this.selectedQLE.memberComment) {
            this.isMemberCommentValid = !this.selectedQLE.memberComment.match(new RegExp(this.validationRegex.ACCOUNT_NAME));
        }
        this.memberId = this.data.selectedVal.memberId;
        this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.initializeForm();
        this.variableDeclarations();
        this.subscriptions.push(
            this.fileUploadService.fetchFileUploadConfigs().subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            }),
        );
    }

    /**
     * function to initialize form
     * @returns void
     */
    initializeForm(): void {
        this.eventDate = this.datePipe.transform(this.selectedQLE.eventDate, AppSettings.DATE_FORMAT);
        this.coverageEndDate = this.datePipe.transform(this.selectedQLE.requestedCoverageEndDate, AppSettings.DATE_FORMAT);
        this.adminComment = "";
        this.form = this.fb.group({
            eventDate: [
                {
                    value: this.eventDate,
                    disabled: true,
                },
                [Validators.required],
            ],
            coverageEndDate: [
                {
                    value: this.coverageEndDate,
                    disabled: false,
                },
                [Validators.required],
            ],
            adminComment: [{ value: this.adminComment, disabled: false }],
        });
    }

    /**
     * function to declare variables
     * @returns void
     */
    variableDeclarations(): void {
        this.documentIds = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.isSuccess = [];
        this.deleteDocumentIds = [];
    }

    /**
     * function called when Approve button is clicked
     * @param approvedOrDenied: boolean, true if approved, false if denied
     * @returns void
     */
    approveDenyRequest(approvedOrDenied: boolean): void {
        this.onFormSubmit = true;
        this.eventDate = this.datePipe.transform(this.form.controls.eventDate.value, AppSettings.DATE_FORMAT);
        this.coverageEndDate = this.datePipe.transform(this.form.controls.coverageEndDate.value, AppSettings.DATE_FORMAT);
        this.adminComment = this.form.controls.adminComment.value;
        if (approvedOrDenied) {
            this.updateQleEvent(StatusType.APPROVED, QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED);
        } else {
            this.updateQleEvent(StatusType.DENIED);
        }
    }

    /**
     * This method validates the coverage end date.
     * @param event: string, the date value entered
     * @returns language string on the basis of error response.
     */
    validateDate(event: string): string {
        let errorMessage = "";
        const inputDate = this.dateService.toDate(event);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        const REQUIRED_FIELD = this.languageStrings["primary.portal.common.requiredField"];
        if (this.onFormSubmit && (!this.form.controls.coverageEndDate.value || event === "")) {
            errorMessage = REQUIRED_FIELD;
            return errorMessage;
        }
        if (event === "") {
            errorMessage = REQUIRED_FIELD;
            return errorMessage;
        }
        if ((this.form.controls.coverageEndDate.value === null || this.form.controls.coverageEndDate.value === "") && event !== "") {
            errorMessage = this.secondaryLanguageStrings["secondary.portal.common.invalidDateFormat"];
            return errorMessage;
        }
        this.requestedCoverageEndDate = this.datePipe.transform(inputDate, AppSettings.DATE_FORMAT);
        if (this.requestedCoverageEndDate !== this.coverageEndDate && event !== "" && inputDate < todayDate) {
            this.form.controls.coverageEndDate.setErrors({ maxAgeError: true });
        }
        return errorMessage;
    }

    /**
     * function called to update the member qualifying event
     * @param qleStatus: StatusType, status of qualifying event
     * @param endPlanRequestStatus: QLEEndPlanRequestStatus, End plan request status of qualifying event
     * @returns void
     */
    updateQleEvent(qleStatus: StatusType, endPlanRequestStatus?: QLEEndPlanRequestStatus): void {
        if (this.deleteDocumentIds && this.deleteDocumentIds.length) {
            this.deleteDocumentIds.forEach((docId) => {
                if (this.documentIds[docId] !== 0) {
                    this.subscriptions.push(this.documentService.deleteDocument(this.documentIds[docId], this.mpGroupId).subscribe());
                    this.documentIds.splice(docId, 1, 0);
                }
            });
        }
        for (let index = 0; index < this.documentIds.length; index++) {
            if (this.documentIds[index] === 0) {
                this.documentIds.splice(index, 1);
            }
        }
        if (this.documentIds[this.documentIds.length - 1] === 0) {
            this.documentIds.splice(this.documentIds.length - 1, 1);
        }
        if (this.form.valid || this.requestedCoverageEndDate === this.coverageEndDate) {
            this.qualifyingEvent.eventDate = this.eventDate;
            this.qualifyingEvent.requestedCoverageEndDate = this.requestedCoverageEndDate;
            this.qualifyingEvent.typeId = this.selectedQLE.typeId;
            const validity: Validity = {} as Validity;
            if (qleStatus === StatusType.APPROVED) {
                validity.effectiveStarting = this.datePipe.transform(
                    this.dateService.subtractDays(new Date(), ONE_DAY),
                    DateFormats.YEAR_MONTH_DAY,
                );
                validity.expiresAfter = this.datePipe.transform(
                    this.dateService.subtractDays(new Date(), ONE_DAY),
                    DateFormats.YEAR_MONTH_DAY,
                );
                this.qualifyingEvent.coverageStartDates = [];
            } else {
                validity.effectiveStarting = this.datePipe.transform(
                    this.selectedQLE.enrollmentValidity?.effectiveStarting,
                    DateFormats.YEAR_MONTH_DAY,
                );
                validity.expiresAfter = this.datePipe.transform(
                    this.selectedQLE.enrollmentValidity?.expiresAfter,
                    DateFormats.YEAR_MONTH_DAY,
                );
                this.qualifyingEvent.coverageStartDates = this.selectedQLE.coverageStartDates;
            }
            if (validity.effectiveStarting && validity.expiresAfter) {
                this.qualifyingEvent.enrollmentValidity = validity;
            }
            this.qualifyingEvent.adminComment = this.adminComment;
            this.qualifyingEvent.status = qleStatus;
            this.qualifyingEvent.documentIds = this.documentIds;
            if (qleStatus === StatusType.APPROVED) {
                this.qualifyingEvent.endPlanRequestStatus = endPlanRequestStatus ? endPlanRequestStatus : "";
            }
            this.updateQleEventCall(this.qualifyingEvent);
        }
    }

    /**
     * function called to hit the update member qualifying event api
     * @param qualifyingEvent: Object that contains all the required information to make the API call
     * @returns void
     */
    updateQleEventCall(qualifyingEvent: MemberQualifyingEvent): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.memberService.updateMemberQualifyingEvent(this.memberId, this.selectedQLE.id, qualifyingEvent, this.mpGroupId).subscribe(
                () => {
                    this.errorResponse = false;
                    const url = `admin/accountList/${this.mpGroupId}/member/${this.memberId}/qle/life-events`;
                    this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => this.router.navigate([url]));
                    this.dialogRef.close();
                },
                (error) => {
                    this.errorResponse = true;
                    this.isLoading = false;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMessage = this.secondaryLanguageStrings["secondary.portal.qle.qleExists"];
                    } else if (error.status === AppSettings.API_RESP_409) {
                        this.errorMessage = this.secondaryLanguageStrings["secondary.portal.qle.pendingEnrollment.duplication.error"];
                    } else if (error.status === AppSettings.API_RESP_503) {
                        this.errorMessage = this.secondaryLanguageStrings["secondary.portal.qle.updateQle.serviceUnavailable"];
                    }
                },
            ),
        );
    }

    /**
     * function called to validate the file
     * @param event: File, the event added
     * @returns void
     */
    validateFileAndUpload(event: File): void {
        this.fileExtension = event.name.split(".").pop();
        this.fileInvalidCheck(this.fileExtension);
        const file = this.editFileDetail(event);
        if (file.size > this.maxFileSizeAllowed) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.maxFileSize.error");
        }
        this.files.push(file);
        if (!this.invalidFileExtension && file.size <= this.maxFileSizeAllowed) {
            this.fileValidCheck();
            this.uploadFile(event, file);
        }
    }

    /**
     * @description method to upload file to aws s3 using presigned url
     * @param file file for uploading
     * @param fileDetail contains file details
     * @returns void
     */
    uploadFile(file: File, fileDetail: FileDetails): void {
        if (this.multipartFileUploadConfig) {
            this.subscriptions.push((this.fileUploadSubscription = this.processFile(file, fileDetail).subscribe()));
        } else {
            this.subscriptions.push(
                (this.fileUploadSubscription = this.fileUploadService
                    .upload(file)
                    .pipe(
                        switchMap(() => this.processFile(file, fileDetail)),
                        catchError(() => {
                            this.hasError.push(true);
                            this.isSuccess.push(false);
                            this.fileError = true;
                            this.uploadSuccessStatus.push("");
                            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                            return of(null);
                        }),
                    )
                    .subscribe()),
            );
        }
    }

    /**
     * @description method to process the uploaded file
     * @param file the file uploaded
     * @param fileDetail contains file details
     * @returns Observable<void>
     */
    processFile(file: File, fileDetails: FileDetails): Observable<void | Document> {
        return this.documentService.uploadDocument(file, this.multipartFileUploadConfig, this.mpGroupId).pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total);
                    if (this.fileUploadPercentage === Percentages.FILE_UPLOAD_MAX_PERCENTAGE) {
                        this.modeProgress = this.INDETERMINATE;
                    }
                }
                if (events instanceof HttpResponse) {
                    const documentId = parseInt(
                        events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/")[this.DOC_ID_SPLIT_START_INDEX],
                        this.DOC_ID_SPLIT_END_INDEX,
                    );
                    this.isFileUploaded = true;
                    return this.documentService.getDocument(documentId, this.mpGroupId.toString()).pipe(
                        tap((resp) => {
                            this.fileUploadedSuccess(resp.status.toString(), fileDetails, documentId);
                        }),
                    );
                }
                return of(null);
            }),
            catchError((error) => {
                let fileError = "";
                if (error.status === ClientErrorResponseCode.RESP_413) {
                    fileError = "secondary.portal.shared.monUpload.maxFileSize.error";
                } else if (
                    error.status === ClientErrorResponseCode.RESP_400 &&
                    error.error.details?.length &&
                    error.error.details[0].field ===
                        this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                ) {
                    fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                } else if (error.status === ServerErrorResponseCode.RESP_504) {
                    fileError = "secondary.portal.qle.pendingEnrollment.timeout.error";
                } else {
                    fileError = "secondary.portal.shared.monUpload.unknown.error";
                }
                this.fileUploadError(fileError);
                return of(null);
            }),
        );
    }

    /**
     *
     * called to set the flags when file upload is successful
     * @param fileStatus: string, status of the uploaded document
     * @param file: FileDetails, the uploaded document
     * @param documentId: number, document id
     * @returns void
     */
    fileUploadedSuccess(fileStatus: string, file: FileDetails, documentId?: number): void {
        if (fileStatus === FileUploadMessage.VIRUS_SCAN_FAILED) {
            this.isSuccess.push(false);
            this.hasError.push(true);
            this.uploadErrorStatus.push("primary.portal.members.document.addUpdate.virusDetectedError");
            this.uploadSuccessStatus.push("");
            this.isFileAvailable = true;
        } else {
            this.documentIds.push(documentId);
            this.uploadErrorStatus.push("");
            this.uploadSuccessStatus.push(this.datePipe.transform(new Date(), DateFormats.DATE_TIME));
            this.isSuccess.push(true);
            this.hasError.push(false);
            this.files.forEach((doc) => {
                if (doc === file) {
                    doc.documentId = documentId;
                    return;
                }
            });
        }
        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
    }

    /**
     * to edit file details
     * @param event: File, document file
     * @returns FileDetails
     */
    editFileDetail(event: File): FileDetails {
        const name = event.name;
        this.modifiedName = name;
        if (name.length > this.MAX_FILE_NAME_LENGTH) {
            const fileNameFirstPart = name.substring(0, this.FILE_NAME_FIRST_PART);
            const fileNameSecondPart = name.substring(name.length - this.FILE_NAME_SECOND_PART, name.length);
            this.modifiedName = fileNameFirstPart + "..." + fileNameSecondPart;
        }
        const file: FileDetails = {
            name: name,
            modifiedName: this.modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            documentId: null,
        };
        return file;
    }

    /**
     * flags to be set when file is valid
     * @returns void
     */
    fileValidCheck(): void {
        this.fileError = false;
        this.isFileSelected = true;
        this.isFileUploaded = false;
        this.isFileAvailable = true;
        this.isUploadingStarted = true;
        this.isProgressBarEnabled = true;
        this.modeProgress = this.DETERMINE;
        this.fileUploadPercentage = 0;
    }

    /**
     *Actions to take when file upload fails
     * @param fileError: string, error status
     * @returns void
     */
    fileUploadError(fileError: string): void {
        this.isFileUploaded = false;
        this.isUploadingStarted = false;
        this.hasError.push(true);
        this.isSuccess.push(false);
        this.documentIds.push(0);
        this.isProgressBarEnabled = false;
        this.fileError = true;
        this.uploadSuccessStatus.push("");
        this.uploadErrorStatus.push(fileError);
    }

    /**
     * Check for invalid file extension
     * @param fileExtension: string, extension of the file
     * @returns void
     */
    fileInvalidCheck(fileExtension: string): void {
        const notAllowedFormats = this.nonAcceptableFormats.split(",");
        this.invalidFileExtension = false;
        notAllowedFormats.forEach((extension) => {
            if (extension === fileExtension) {
                this.invalidFileExtension = true;
                this.setDataForError();
                this.uploadErrorStatus.push("secondary.portal.shared.monUpload.fileFormat.error");
            }
        });
    }

    /**
     * @description setDataForError is used to set data when error occurs
     * @returns void
     */
    setDataForError(): void {
        this.hasError.push(true);
        this.isSuccess.push(false);
        this.fileError = true;
        this.uploadSuccessStatus.push("");
        this.isProgressBarEnabled = true;
        this.isFileSelected = true;
        this.isFileAvailable = true;
    }

    /**
     * function called to view the document
     * @param event: FileDetails, document event
     * @returns void
     */
    viewFile(event: FileDetails): void {
        const pdf = "pdf";
        const fileName = event.name;
        const fileType = fileName.split(".").pop();
        this.subscriptions.push(
            this.documentService.downloadDocument(event.documentId, this.mpGroupId).subscribe((response) => {
                if (fileType === pdf) {
                    const pdfBlob = new Blob([response], { type: "application/pdf" });

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(pdfBlob, fileName);
                    } else {
                        const fileUrl = URL.createObjectURL(pdfBlob);
                        window.open(fileUrl, "_blank");
                    }
                } else {
                    const blob = new Blob([response], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(blob);
                    } else {
                        const anchor = document.createElement("a");
                        anchor.download = fileName;
                        const fileURLBlob = URL.createObjectURL(blob);
                        anchor.href = fileURLBlob;
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                }
            }),
        );
    }

    /**
     * function called to cancel the uploaded document
     * @param index: number, index of the file
     * @returns void
     */
    cancelFileUpload(index: number): void {
        this.files.splice(index, 1, null);
        this.uploadSuccessStatus.splice(index, 1, "");
        this.uploadErrorStatus.splice(index, 1, "");
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
            this.fileUploadSubscription.unsubscribe();
        } else if (this.isFileUploaded) {
            this.deleteDocumentIds.push(index);
        }
        const otherThanNull = this.files.some(function (element: FileDetails): boolean {
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

    /**
     * method to initialize secondary language strings
     * @returns void
     */
    getSecondaryLanguageStrings(): void {
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.shared.monUpload.maxFileSize.error",
            "secondary.portal.shared.monUpload.fileFormat.error",
            "secondary.portal.qle.pendingEnrollment.timeout.error",
            "secondary.portal.shared.monUpload.unknown.error",
            "secondary.portal.qle.qleExists",
            "secondary.portal.qle.pendingEnrollment.duplication.error",
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.endCoverage.dateErrorMsg",
            "secondary.portal.qle.updateQle.serviceUnavailable",
        ]);
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
