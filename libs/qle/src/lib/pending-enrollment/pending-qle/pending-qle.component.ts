import { UserService } from "@empowered/user";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DocumentApiService, MemberService, Enrollment, EnrollmentService, AccountService, MemberQLETypes } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Observable, of, Subscription } from "rxjs";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MemberInfoState, QleState, AccountListState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { PendingEnrollService } from "../services/pending-enroll.service";
import { PendingEnrollmentComponent } from "../pending-enrollment.component";
import {
    DateFormats,
    FileUploadMessage,
    ConfigName,
    AppSettings,
    Validity,
    MemberCredential,
    StatusType,
    QualifyingEventType,
    MemberQualifyingEvent,
    FileDetails,
    Percentages,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ApiResponseData,
    DateFormat,
    Document,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import { catchError, switchMap, takeUntil, tap } from "rxjs/operators";
import { FileUploadService } from "@empowered/common-services";

const ONE_DAY = 1;
const DAY = "day";
const NEW_HIRE = "NEW_HIRE";
const BIRTH_ADOPTION_ID_TWO = 2;
const BIRTH_ADOPTION_ID = 59;
const AUTO_GENERATED_QLE = "AUTO_GENERATED";
@Component({
    selector: "empowered-pending-qle",
    templateUrl: "./pending-qle.component.html",
    styleUrls: ["./pending-qle.component.scss"],
})
export class PendingQleComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    pendingEnrollment: any;
    acceptableFormats: string;
    form: FormGroup;
    eventTypes: QualifyingEventType[];
    eventType: any;
    files: any[] = [];
    isFileAvailable: boolean;
    isFileSelected = false;
    type: any;
    mpGroupId: number;
    qualifyingEventId: number;
    isFileUploaded = false;
    fileUploadPercentage = 0;
    isUploadingStarted = false;
    hasError: boolean[];
    isSucess: boolean[];
    modeProgress = "determinate";
    documentsId: number[] = [];
    eventTypeChanged = false;
    uploadSuccessStatus: string[];
    uploadErrorStatus: string[];
    minDate: string;
    maxDate: string;
    memberInfo: any;
    dateFormat = "yyyy-MM-dd";
    isProgressBarEnabled: boolean;
    fileError: boolean;
    formTitle: string;
    isFileViewable = true;
    isLoading: boolean;
    errorMessage = "";
    errorResponse: boolean;
    reqDocument: string;
    ariaLabel: string;
    modifiedName: string;
    portal = "";
    isMember = false;
    enrollmentId: Enrollment[];
    reqDocumentText: string;
    fileExtension: string;
    deleteDocuments: number[] = [];
    invalidFileExtension: boolean;
    subscription: Subscription;
    enrollmentSubscription: Subscription;
    updateQLESubscription: Subscription;
    deleteDocumentSubscription: Subscription;
    downloadDocumentSubscription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.qle.pendingEnrollment.eventTypeLabel",
        "primary.portal.qle.pendingEnrollment.eventDateLabel",
        "primary.portal.qle.pendingEnrollment.QLEaddedLabel",
        "primary.portal.qle.pendingEnrollment.notesLabel",
        "primary.portal.qle.pendingEnrollment.employeeCommentsLabel",
        "primary.portal.common.close",
        "primary.portal.qle.pendingEnrollment.denyButtonLabel",
        "primary.portal.qle.pendingEnrollment.approveButtonLabel",
        "primary.portal.qle.addNewQle.fileUploadText",
        "primary.portal.common.save",
        "primary.portal.common.next",
        "primary.portal.qle.edit.lifeEventDetails",
        "primary.portal.qle.pendingEnrollment.subTitle",
        "primary.portal.members.document.addUpdate.uploadGenericError",
        "primary.portal.members.document.addUpdate.virusDetectedError",
        "primary.portal.qle.addNewQle.downloadDocument.error",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);
    enableNext = false;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;
    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly dialogRef: MatDialogRef<PendingEnrollmentComponent>,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly documentService: DocumentApiService,
        private readonly datePipe: DatePipe,
        private readonly memberService: MemberService,
        private readonly enrollmentService: EnrollmentService,
        private readonly accountService: AccountService,
        private readonly pendingEnrollService: PendingEnrollService,
        private readonly user: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    /**
     * Initially loads the data required to Edit Life Event
     * @returns void
     */
    ngOnInit(): void {
        this.acceptableFormats = this.data.selectedVal.acceptableFormats;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
            this.user.credential$.subscribe((credential: MemberCredential) => {
                this.mpGroupId = credential.groupId;
                this.memberInfo = {};
                this.memberInfo.id = credential.memberId;
            });
        } else if (this.portal === AppSettings.PORTAL_ADMIN || this.portal === AppSettings.PORTAL_PRODUCER) {
            this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
            this.memberInfo = this.store.selectSnapshot(MemberInfoState.getMemberInfo);
        }
        this.formTitle = this.data.editLifeEvent
            ? this.languageStrings["primary.portal.qle.edit.lifeEventDetails"]
            : this.languageStrings["primary.portal.qle.pendingEnrollment.subTitle"];
        this.type = this.data.selecteEvent;
        this.eventType = this.data.selectedVal;
        this.enrollmentId = this.data.enrollmentId;
        if (this.data.enrollmentId) {
            this.enableNext = true;
        }
        if (this.data.enrollmentData) {
            this.enableNext = true;
        }
        this.form = this.fb.group({
            eventsType: [this.type.id, Validators.required],
            eventDate: [
                this.datePipe.transform(this.eventType.eventDate, this.dateFormat),
                [Validators.required, this.validateMinDate.bind(this), this.validateMaxDate.bind(this)],
            ],
            adminComment: [{ value: this.eventType.adminComment, disabled: false }],
            createDate: [{ value: this.datePipe.transform(this.eventType.createDate, this.dateFormat), disabled: true }],
            memberComment: [{ value: this.eventType.memberComment, disabled: false }],
            event: [{ value: this.type.id, disabled: true }],
        });
        if (this.memberInfo.length === 0 && this.data.memberDetails) {
            this.memberInfo = this.data.memberDetails;
        }
        if (this.data.editLifeEvent) {
            this.requiredDocument(this.type.id);
            this.form.controls.createDate.disable();
            this.form.controls.eventsType.disable();
            if (this.isMember) {
                this.form.controls.eventDate.disable();
                this.form.controls.adminComment.disable();
            }
            if (!this.isMember) {
                this.form.controls.event.enable();
                this.form.controls.memberComment.disable();
            }
            if (this.eventType.createMethod === AUTO_GENERATED_QLE) {
                this.form.controls.eventDate.disable();
            }
        }
        if (this.eventType.status === StatusType.APPROVED && !this.data.editLifeEvent) {
            this.form.controls.createDate.disable();
            this.form.controls.memberComment.disable();
            this.form.controls.eventsType.disable();
            this.form.controls.eventDate.disable();
            this.form.controls.adminComment.disable();
            this.form.controls.event.disable();
        }
        if (this.eventType.status === StatusType.PENDING && !this.data.editLifeEvent) {
            this.form.controls.createDate.disable();
            this.form.controls.memberComment.disable();
        }
        if (this.data.memberEnrollment) {
            this.isLoading = true;
            this.accountService.qualifyingEventTypes(this.mpGroupId).subscribe(
                (response) => {
                    this.eventTypes = response.filter((event) => event.description !== MemberQLETypes.BY_REQUEST);
                },
                () => {},
                () => {
                    this.isLoading = false;
                    this.arrangeData();
                },
            );
        } else {
            this.eventTypes = this.store
                .selectSnapshot(QleState.eventTypes)
                .filter((event) => event.description !== MemberQLETypes.BY_REQUEST);
            this.arrangeData();
        }
        this.subscriptions.push(
            this.fileUploadService.fetchFileUploadConfigs().subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            }),
        );
    }
    /**
     * function is used to set data based on file upload
     */
    arrangeData(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.qle.*"));
        this.documentsId = [];
        this.deleteDocuments = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.isSucess = [];
        this.files = [];
        if (this.eventType.typeCode === NEW_HIRE) {
            this.subscriptions.push(
                this.staticUtilService.cacheConfigValue(ConfigName.FUTURE_DAYS_ALLOWED_FOR_NEW_HIRE_DATE).subscribe((maxNewHireDays) => {
                    const maxNewHireDate = new Date();
                    maxNewHireDate.setDate(maxNewHireDate.getDate() + +maxNewHireDays);
                    this.maxDate = this.datePipe.transform(maxNewHireDate, this.dateFormat);
                }),
            );
        } else {
            this.maxDate = this.datePipe.transform(new Date(), this.dateFormat);
        }
        const date = new Date();
        date.setDate(date.getDate() - +this.type.daysToReport);
        this.minDate = this.datePipe.transform(date, this.dateFormat);
        if (this.eventType.documents.length !== 0) {
            this.eventType.documents.forEach((document) => {
                const name = document.fileName;
                if (name.length > 24) {
                    const first16 = name.substring(0, 15);
                    const last8 = name.substring(document.fileName.length - 8, document.fileName.length);
                    this.modifiedName = first16 + "..." + last8;
                } else {
                    this.modifiedName = name;
                }
                const file = {
                    name: document.fileName,
                    modifiedName: this.modifiedName,
                    lastModified: this.dateService.toDate(document.uploadDate).getMilliseconds(),
                    documentId: document.id,
                    status: document.status,
                };
                this.files.push(file);
                if (file.status === FileUploadMessage.COMPLETE) {
                    this.isSucess.push(true);
                    this.hasError.push(false);
                    this.documentsId.push(document.id);
                    this.uploadErrorStatus.push("");
                    this.uploadSuccessStatus.push(this.datePipe.transform(document.uploadDate, "MM/dd/yyyy hh:mm:ss"));
                    this.isFileAvailable = true;
                    this.isFileUploaded = true;
                } else if (file.status === FileUploadMessage.VIRUS_SCAN_FAILED) {
                    this.isSucess.push(false);
                    this.hasError.push(true);
                    this.documentsId.push(document.id);
                    this.uploadErrorStatus.push("primary.portal.members.document.addUpdate.virusDetectedError");
                    this.uploadSuccessStatus.push("");
                    this.isFileAvailable = true;
                    this.isFileUploaded = true;
                } else {
                    this.isSucess.push(false);
                    this.hasError.push(true);
                    this.uploadErrorStatus.push("primary.portal.members.document.addUpdate.uploadGenericError");
                    this.uploadSuccessStatus.push("");
                }
            });
        } else {
            this.isLoading = false;
        }
    }

    closeForm(): void {
        this.dialogRef.close();
        this.memberService.updateQLEList(false);
    }
    validateMinDate(control: FormControl): any {
        const date = this.datePipe.transform(control.value, this.dateFormat);
        return this.dateService.toDate(date) < this.dateService.toDate(this.minDate) ? { requirements: true } : null;
    }
    /**
     * This function is used to validate max date
     * @param control represents date control
     * @returns when the selected date is greater than max date, it returns the appropriate validation error; otherwise, it returns null
     */
    validateMaxDate(control: FormControl): any {
        const date = this.datePipe.transform(control.value, this.dateFormat);
        if (this.dateService.toDate(date) > this.dateService.toDate(this.maxDate)) {
            return this.eventType.typeCode === NEW_HIRE ? { requirements: true } : { requirementDate: true };
        }
        return null;
    }
    /**
     * This function is used to download and view the document
     * @param event selected document
     */
    viewFile(event: any): void {
        let fileName: string;
        let documentId;
        if (this.eventType.status === StatusType.APPROVED || this.eventType.status === StatusType.DENIED) {
            fileName = event.fileName;
            documentId = event.id;
        } else {
            fileName = event.name;
            documentId = event.documentId;
        }
        const fileType = fileName.split(".").pop();
        this.downloadDocumentSubscription = this.documentService.downloadDocument(documentId, this.mpGroupId).subscribe(
            (response) => {
                switch (fileType) {
                    case "pdf": {
                        const pdfBlob = new Blob([response], { type: "application/pdf" });

                        /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                        if ((window.navigator as any).msSaveOrOpenBlob) {
                            (window.navigator as any).msSaveOrOpenBlob(pdfBlob);
                        } else {
                            const fileurl = URL.createObjectURL(pdfBlob);
                            window.open(fileurl, "_blank");
                        }
                        break;
                    }
                    default: {
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
                }
            },
            (error) => {
                if (error && error.status) {
                    this.errorResponse = true;
                    this.errorMessage = "primary.portal.qle.addNewQle.downloadDocument.error";
                }
            },
        );
    }

    getDateError(): string {
        return this.form.get("eventDate").hasError("requirementDate")
            ? "secondary.portal.qle.pendingEnrollment.dateValidationMsg.dateFuture"
            : "";
    }

    changeInEvent(event: any): void {
        this.eventTypes.forEach((element) => {
            if (event.value === element.id) {
                this.maxDate = this.datePipe.transform(new Date(), this.dateFormat);
                const date = this.dateService.toDate(this.maxDate);
                date.setDate(date.getDate() - element.daysToReport);
                this.minDate = this.datePipe.transform(date, this.dateFormat);
            }
        });
    }

    /**
     * @description method to validate the document
     * @param event has the document uploaded by user
     * @returns void
     */
    validateFileAndUpload(event: any): void {
        const name = event.name;
        this.fileExtension = event.name.split(".").pop();
        const notAllowedFormats = ["bat", "exe", "dll", "sh", "bmp", "avi", "mov", "gif", "ini", "jpg", "sys", "wav", "mp3"];
        this.invalidFileExtension = false;
        notAllowedFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = true;
            }
        });
        this.invalidFileExtension = !this.acceptableFormats.includes(this.fileExtension);
        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(event.name.length - 8, event.name.length);
            this.modifiedName = first16 + "..." + last8;
        } else {
            this.modifiedName = name;
        }
        const file: FileDetails = {
            name: event.name,
            modifiedName: this.modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
            documentId: null,
        };
        if (this.invalidFileExtension) {
            this.files.push(file);
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.qle.pendingEnrollment.fileFormat.error");
        } else if (file.size > this.maxFileSizeAllowed) {
            this.files.push(file);
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.qle.pendingEnrollment.maxFileSize.error");
        } else {
            this.files.push(file);
            this.fileError = true;
            this.isFileSelected = true;
            this.isFileUploaded = false;
            this.isFileAvailable = true;
            this.isUploadingStarted = true;
            this.isProgressBarEnabled = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            this.uploadFile(event, file);
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

    /**
     * @description method to upload document to aws s3 using presigned url
     * @param event document for uploading
     * @param file contains details about the file
     * @returns void
     */
    uploadFile(event: File, file: FileDetails): void {
        if (this.multipartFileUploadConfig) {
            this.subscriptions.push(this.processFile(event, file).subscribe());
        } else {
            this.subscriptions.push(
                (this.subscription = this.fileUploadService
                    .upload(event)
                    .pipe(
                        switchMap(() => this.processFile(event, file)),
                        catchError(() => {
                            this.isSucess.push(false);
                            this.hasError.push(true);
                            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                            this.uploadSuccessStatus.push("");
                            return of(null);
                        }),
                    )
                    .subscribe()),
            );
        }
    }

    /**
     * @description method to process the uploaded document
     * @param file the file uploaded
     * @param fileDetails contains details about the file
     * @returns Observable<void>
     */
    processFile(file: File, fileDetails: FileDetails): Observable<void | Document> {
        return this.documentService.uploadDocument(file, this.multipartFileUploadConfig, this.mpGroupId).pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total);
                    if (this.fileUploadPercentage === Percentages.FILE_UPLOAD_MAX_PERCENTAGE) {
                        this.modeProgress = "indeterminate";
                    }
                }
                if (events instanceof HttpResponse) {
                    const documentId = parseInt(events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/")[5], 10);
                    this.isFileUploaded = true;
                    return this.documentService.getDocument(documentId, this.mpGroupId.toString()).pipe(
                        tap((resp) => {
                            fileDetails.status = resp.status;
                            this.fileUploadSuccess(fileDetails, documentId);
                        }),
                    );
                }
                return of(null);
            }),
            catchError((error) => {
                this.isFileUploaded = false;
                this.isUploadingStarted = false;
                this.hasError.push(true);
                this.isSucess.push(false);
                this.documentsId.push(0);
                this.isProgressBarEnabled = false;
                this.fileError = true;
                this.uploadSuccessStatus.push("");
                let fileError = "";
                if (error.status === ClientErrorResponseCode.RESP_413) {
                    fileError = "secondary.portal.qle.pendingEnrollment.maxFileSize.error";
                } else if (error.status === ClientErrorResponseCode.RESP_415) {
                    fileError = "secondary.portal.qle.pendingEnrollment.fileFormat.error";
                } else if (error.status === ClientErrorResponseCode.RESP_400) {
                    if (
                        error.error.details?.length &&
                        error.error.details[0].field ===
                            this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                    ) {
                        fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                    } else {
                        fileError = "secondary.portal.qle.pendingEnrollment.fileRequired.error";
                    }
                } else if (error.status === ServerErrorResponseCode.RESP_504) {
                    fileError = "secondary.portal.qle.pendingEnrollment.timeout.error";
                } else {
                    fileError = "secondary.portal.qle.pendingEnrollment.unknown.error";
                }
                this.uploadErrorStatus.push(fileError);
                return of(null);
            }),
        );
    }

    /**
     * called to set the flags when file upload is successful
     * @param file: FileDetails, the uploaded document details
     * @param documentId: number, document id
     * @returns void
     */
    fileUploadSuccess(file: FileDetails, documentId?: number): void {
        if (file.status === FileUploadMessage.VIRUS_SCAN_FAILED) {
            this.isSucess.push(false);
            this.hasError.push(true);
            this.uploadErrorStatus.push("primary.portal.members.document.addUpdate.virusDetectedError");
            this.uploadSuccessStatus.push("");
            this.isFileAvailable = true;
            this.isFileUploaded = true;
        } else {
            this.documentsId.push(documentId);
            this.uploadErrorStatus.push("");
            this.uploadSuccessStatus.push(this.datePipe.transform(new Date(), DateFormat.DATE_TIME));
            this.isSucess.push(true);
            this.hasError.push(false);
        }

        this.files.forEach((doc) => {
            if (doc === file) {
                doc.documentId = documentId;
            }
        });

        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
    }

    cancelFileUpload(index: number): void {
        this.files.splice(index, 1, null);
        this.uploadSuccessStatus.splice(index, 1, "");
        this.uploadErrorStatus.splice(index, 1, "");
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
            this.subscription.unsubscribe();
        } else if (this.isFileUploaded) {
            this.deleteDocuments.push(index);
        }
        const otherThanNull = this.files.some(function (element: any): boolean {
            return element !== null;
        });
        if (!otherThanNull) {
            this.files = [];
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.hasError = [];
            this.isSucess = [];
        }
    }

    qleDeclined(): void {
        if (this.form.valid) {
            this.updateQleEvent(StatusType.DENIED);
        }
    }
    saveQLE(): void {
        if (this.form.valid) {
            this.updateQleEvent(StatusType.PENDING);
        }
    }
    qleApproved(): void {
        if (this.form.valid) {
            this.updateQleEvent(StatusType.APPROVED);
        }
    }

    /**
     * Function to construct info message based on document text
     * @param id type
     */
    requiredDocument(id: number): void {
        this.reqDocumentText = "";
        switch (id) {
            case BIRTH_ADOPTION_ID_TWO:
            case BIRTH_ADOPTION_ID:
                this.reqDocumentText = "BirthAdoption";
                break;
            case 4:
                this.reqDocumentText = "dependentEligibility";
                break;
            case 7:
                this.reqDocumentText = "deathOfDependent";
                break;
            case 5:
                this.reqDocumentText = "dependentMedicare";
                break;
            case 8:
                this.reqDocumentText = "divorce";
                break;
            case 12:
                this.reqDocumentText = "employeeEligibleMedicare";
                break;
            case 60:
                this.reqDocumentText = "gainEligibility";
                break;
            case 63:
                this.reqDocumentText = "lossOfEligibility";
                break;
            default:
                this.reqDocumentText = "none";
        }
        this.reqDocument = this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle." + this.reqDocumentText);
        this.ariaLabel = this.language.fetchPrimaryLanguageValue("primary.portal.uploadDocument.ariaLabel");
    }

    onNext(): void {
        this.pendingEnrollService.staticStepDone$.next(true);
    }

    /**
     * Method to update QLE event
     * @param qleStatus QLE status
     */
    updateQleEvent(qleStatus: any): void {
        if (this.deleteDocuments !== undefined || this.deleteDocuments.length > 0 || this.deleteDocuments !== []) {
            this.deleteDocuments.forEach((docId) => {
                if (this.documentsId[docId] !== 0) {
                    this.deleteDocumentSubscription = this.documentService
                        .deleteDocument(this.documentsId[docId], this.mpGroupId)
                        .subscribe();
                    this.documentsId.splice(docId, 1, 0);
                }
            });
        }
        this.qualifyingEventId = this.eventType.id;
        const qleEventType: MemberQualifyingEvent = {} as any;
        qleEventType.typeId = this.data.editLifeEvent ? this.form.controls.event.value : this.form.controls.eventsType.value;
        qleEventType.eventDate = this.datePipe.transform(this.form.controls.eventDate.value, this.dateFormat);
        const validity: Validity = {} as any;

        if (qleStatus === StatusType.APPROVED) {
            validity.effectiveStarting = this.datePipe.transform(
                this.dateService.subtractDays(new Date(), ONE_DAY),
                DateFormats.YEAR_MONTH_DAY,
            );
            validity.expiresAfter = this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY);
            qleEventType.coverageStartDates = [];
        } else {
            validity.effectiveStarting = this.datePipe.transform(this.eventType.enrollmentValidity?.effectiveStarting, this.dateFormat);
            validity.expiresAfter = this.datePipe.transform(this.eventType.enrollmentValidity?.expiresAfter, this.dateFormat);
            qleEventType.coverageStartDates = this.eventType.coverageStartDates;
        }
        if (!this.data.editLifeEvent) {
            qleEventType.enrollmentValidity = validity;
        }
        if (this.isMember) {
            qleEventType.memberComment = this.form.controls.memberComment.value;
            this.eventType.memberComment = qleEventType.memberComment;
        } else {
            qleEventType.adminComment = this.form.controls.adminComment.value;
        }
        qleEventType.coverageStartDates = this.eventType.coverageStartDates;
        qleEventType.status = qleStatus;
        for (let index = 0; index < this.documentsId.length; index++) {
            if (this.documentsId[index] === 0) {
                this.documentsId.splice(index, 1);
            }
        }
        if (this.documentsId[this.documentsId.length - 1] === 0) {
            this.documentsId.splice(this.documentsId.length - 1, 1);
        }
        qleEventType.documentIds = this.documentsId;
        this.isLoading = true;
        this.updateQLESubscription = this.memberService
            .updateMemberQualifyingEvent(this.memberInfo.id, this.qualifyingEventId, qleEventType, this.mpGroupId)
            .subscribe(
                () => {
                    this.errorResponse = false;
                    this.updateEnrollmentStatus(qleStatus);
                    if (this.data.editLifeEvent) {
                        this.dialogRef.close();
                    } else {
                        this.pendingEnrollService.staticStepDone$.next(true);
                    }
                },
                (error) => {
                    this.errorResponse = true;
                    this.isLoading = false;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMessage = "secondary.portal.qle.qleExists";
                    } else if (error.status === AppSettings.API_RESP_409) {
                        this.errorMessage = "secondary.portal.qle.pendingEnrollment.duplication.error";
                    }
                },
            );
    }

    updateEnrollmentStatus(qleStatus: any): void {
        if (this.enrollmentId !== undefined && this.enrollmentId.length > 0 && qleStatus === StatusType.DENIED) {
            const isEnrollmentPending = this.enrollmentId.find((ele) => ele.status === StatusType.PENDING);
            if (isEnrollmentPending !== undefined) {
                this.enrollmentId.forEach((enrollment) => {
                    if (enrollment.status === StatusType.PENDING) {
                        const today = new Date();
                        const enroll = {
                            status: StatusType.DENIED,
                            effectiveDate: this.datePipe.transform(
                                this.dateService.toDate(today.setDate(today.getDate())),
                                this.dateFormat,
                            ),
                            comment: "QLE DENIED",
                        };
                        this.enrollmentSubscription = this.enrollmentService
                            .updateEnrollmentStatus(this.memberInfo.id, enrollment.id, enroll, this.mpGroupId)
                            .subscribe(
                                () => {
                                    this.errorResponse = false;
                                    this.isLoading = false;
                                    this.memberService.updateQLEList(true);
                                    this.dialogRef.close();
                                },
                                (error) => {
                                    this.errorResponse = true;
                                    this.isLoading = false;
                                    if (error.status === AppSettings.API_RESP_400) {
                                        this.errorMessage = "secondary.portal.qle.pendingEnrollment.validation.error";
                                    } else if (error.status === AppSettings.API_RESP_403) {
                                        this.errorMessage = "secondary.portal.qle.pendingEnrollment.qleNotApproved.error";
                                    } else if (error.status === AppSettings.API_RESP_500) {
                                        this.errorMessage = "secondary.portal.qle.pendindEnrollment.InternalServer.error";
                                    } else if (error.status === AppSettings.API_RESP_404) {
                                        this.errorMessage = "secondary.portal.qle.pendindEnrollment.NotFound.error";
                                    } else {
                                        this.errorMessage = "secondary.portal.qle.pendindEnrollment.unknown.error";
                                    }
                                },
                            );
                    }
                });
            } else {
                this.isLoading = false;
                this.memberService.updateQLEList(true);
                this.dialogRef.close();
            }
        } else {
            this.isLoading = false;
            this.memberService.updateQLEList(true);
            this.dialogRef.close();
        }
    }
    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.subscription !== undefined) {
            this.subscription.unsubscribe();
        }
        if (this.enrollmentSubscription !== undefined) {
            this.enrollmentSubscription.unsubscribe();
        }
        if (this.updateQLESubscription !== undefined) {
            this.updateQLESubscription.unsubscribe();
        }
        if (this.deleteDocumentSubscription !== undefined) {
            this.deleteDocumentSubscription.unsubscribe();
        }
        if (this.downloadDocumentSubscription !== undefined) {
            this.downloadDocumentSubscription.unsubscribe();
        }
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
