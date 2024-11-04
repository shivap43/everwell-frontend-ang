/* eslint-disable no-case-declarations */
import { AudienceBuilderContainerComponent } from "@empowered/audience-group-builder";
import { Component, OnInit, ViewChild, Inject, OnDestroy, ElementRef } from "@angular/core";
import { Resource, DocumentApiService, AccountService, BenefitsOfferingService } from "@empowered/api";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { Select } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { Observable, Subscription, forkJoin, Subject, BehaviorSubject, of } from "rxjs";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { ResourcesComponent } from "../resources.component";
import { ResourceListState, StaticUtilService } from "@empowered/ngxs-store";
import { mergeMap, tap, map, distinctUntilChanged, switchMap, catchError } from "rxjs/operators";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { AppSettings, DateFormat, FileDetails, SuccessResponseCode, Percentages, ApiResponseData } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { DateService } from "@empowered/date";
import { FileUploadService } from "@empowered/common-services";

const MOMENT_DATE = "date";
const SET_RULES_STEP = 2;

enum AvailabilitySelectedOption {
    VISIBLE_TO_EMPLOYEES_ON = "Visible to employees on",
    HIDDEN = "Hidden",
}

@Component({
    selector: "empowered-add-resource-stepper",
    templateUrl: "./add-resource-stepper.component.html",
    styleUrls: ["./add-resource-stepper.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class AddResourceStepperComponent implements OnInit, OnDestroy {
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("startDate") startDate: ElementRef;
    @ViewChild("endDate") endDate: ElementRef;
    @ViewChild("acceptanceDate") acceptanceDate: ElementRef;
    changeStepper: number;
    private readonly fileUploadPercentageSubject$: BehaviorSubject<number> = new BehaviorSubject(0);
    fileUploadPercentageSubject = this.fileUploadPercentageSubject$.asObservable();
    step1 = 1;
    step2 = 2;
    stepPosition = 0;
    isSaveEnabled: boolean;
    enableBackButton = false;
    resourceObj: any;
    isFormvalid = true;
    /* Upload/Download Document */
    fileUploadPercentage = 0;
    modeProgress = "determinate";
    acceptableFormats = ["xls", "xlsx", "csv", "pdf", "jpeg", "doc", "docx", "txt", "xml", "csv"];
    hintText = this.language.fetchPrimaryLanguageValue("primary.portal.resources.uploadFile.hintText");
    files: any[] = [];
    hasError: boolean[] = [];
    isSucess: boolean[] = [];
    documentsId: number[] = [];
    deleteDocuments: number[] = [];
    uploadErrorStatus: string[] = [];
    uploadSuccessStatus: string[] = [];
    modifiedName: string;
    errorMessage: string;
    fileExtension: string;
    isFileAvailable: boolean;
    invalidFileExtension: boolean;
    isProgressBarEnabled: boolean;
    isFileViewable = true;
    fileError = false;
    isFileSelected = false;
    isFileUploaded = false;
    isUploadingStarted = false;
    subscriptions: Subscription[] = [];
    UploadDocumentSub: Subscription;
    downloadDocumentSub: Subscription;
    tempStartDate: Date | string;
    tempEndDate: Date | string;
    tempEmployeeAcceptanceDate: Date | string;

    /* Add Resource Form */
    addResourceForm: FormGroup;
    documents: any;
    selectedResourceCarrierId: number;
    carrierProductData: any;
    keysArray: any;
    carrierData = [];
    productData = [];
    categoryData = [];
    optionResourceType = [
        { name: "File", value: "FILE" },
        { name: "Video", value: "VIDEO" },
        { name: "Link", value: "URL" },
    ];
    carrierProductDateSub: Subscription;
    regPatten = "(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?";
    @Select(ResourceListState.getAudienceGroupingsList) audienceGroupingsList$: Observable<any[]>;
    @Select(ResourceListState.getResourceList) resourceList$: Observable<Resource[]>;
    @Select(ResourceListState.getCategoriesList) categoriesList$: Observable<any[]>;
    @Select(ResourceListState.getCarriersList) carriersList$: Observable<any[]>;
    @Select(ResourceListState.getProductsList) productsList$: Observable<any[]>;
    @Select(ResourceListState.getDocumentsList) documentsList$: Observable<any[]>;

    /* set rules form */
    setRulesForm: FormGroup;
    viewersOptions = ["All employees", "Subset of employees"];
    employeeStatusOption = ["Active", "Terminated"];
    availabilityOptions = ["Visible to employees on", "Hidden"];
    acceptanceOptions = ["Acceptance not required", "Accept by date"];
    initialAudienceGroup: any;
    newAudienceGroup: any;
    minDate = new Date();
    minStartDate = new Date();
    minEmployeeAcceptanceDate = new Date();
    updatedAudienceGrouping: any;
    audienceId: number;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.resources.addResource",
        "primary.portal.resources.editResource",
        "primary.portal.common.close",
        "primary.portal.resources.resourceTitle",
        "primary.portal.resources.description",
        "primary.portal.resources.enterLink",
        "primary.portal.resources.setRules",
        "primary.portal.resources.startDate",
        "primary.portal.resources.endDate",
        "primary.portal.resources.acceptanceDeadline",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.save",
        "primary.portal.common.add",
        "primary.portal.resources.setRules",
        "primary.portal.common.optional",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);

    private readonly submitEventSubject$: Subject<void> = new Subject();
    submitEvent$: Observable<void> = this.submitEventSubject$.asObservable();
    private readonly submitAudienceGrouping$: Observable<void> = this.submitEventSubject$.asObservable().pipe(
        tap((res) => {
            if (this.setRulesForm.controls["viewer"].value !== "Subset of employees" || this.isFormvalid) {
                if (this.data.action === "EDIT") {
                    this.onClickSave();
                } else {
                    this.onClickAdd();
                }
            }
        }),
    );

    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        @Inject(MAT_BOTTOM_SHEET_DATA) readonly data: any,
        private readonly bottomSheetRef: MatBottomSheetRef<ResourcesComponent>,
        private readonly documentService: DocumentApiService,
        private readonly datePipe: DatePipe,
        private readonly accountService: AccountService,
        private readonly banefitsOffringService: BenefitsOfferingService,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.minDate = this.dateService.toDate(this.minDate.setDate(this.minDate.getDate() + 1));
    }

    ngOnInit(): void {
        this.subscriptions.push(this.submitAudienceGrouping$.subscribe());
        this.subscriptions.push(
            this.banefitsOffringService.getBenefitOfferingCarrierProducts().subscribe((data) => {
                this.carrierProductData = data;
                this.keysArray = Object.keys(this.carrierProductData);
                if (this.data.action === "EDIT") {
                    if (this.data.resource.category) {
                        (this.addResourceForm.get("category") as FormControl).setValue(this.data.resource.category);
                    }
                    this.selectedResourceCarrierId = this.data.resource.carrierId;
                    this.productData = Object(this.carrierProductData)[this.selectedResourceCarrierId.toString()];
                    this.productData.forEach((r) => {
                        if (r.name === this.data.resource.productName) {
                            (this.addResourceForm.get("product") as FormControl).setValue(r);
                        }
                    });
                }
            }),
        );
        this.changeStepper = 1;

        /* Add Resource Form Data */
        this.addResourceForm = this.fb.group({
            category: [
                this.data.resource ? this.data.resource.category : undefined,
                this.data.type === "COMPANY" ? Validators.required : null,
            ],
            carrier: [
                this.data.resource ? this.data.resource.carrierName : undefined,
                this.data.type === "BENEFIT" ? Validators.required : null,
            ],
            product: [
                this.data.resource ? this.data.resource.productName : undefined,
                this.data.type === "BENEFIT" ? Validators.required : null,
            ],
            name: [this.data.resource ? this.data.resource.name : undefined, Validators.required],
            description: [this.data.resource ? this.data.resource.description : undefined, Validators.required],
            resourceType: ["", Validators.required],
            document: [this.data.resource ? this.data.resource.documentId : undefined, Validators.required],
            link: [this.data.resource ? this.data.resource.link : undefined],
        });

        /* This will validate option field base on Resource Type field selection */
        this.subscriptions.push(
            this.resourceType.valueChanges.subscribe((val) => {
                if (val === "FILE") {
                    (this.addResourceForm.get("document") as FormControl).setValidators(Validators.required);
                    (this.addResourceForm.get("link") as FormControl).clearValidators();
                } else if (val === "VIDEO" || val === "URL") {
                    (this.addResourceForm.get("document") as FormControl).clearValidators();
                    (this.addResourceForm.get("link") as FormControl).setValidators(Validators.required);
                }
                (this.addResourceForm.get("document") as FormControl).updateValueAndValidity();
                (this.addResourceForm.get("link") as FormControl).updateValueAndValidity();
            }),
        );
        (this.addResourceForm.get("resourceType") as FormControl).setValue(
            this.data.resource ? this.data.resource.resourceType : this.optionResourceType[0].value,
        );

        /* Ser Rules Form Data */
        this.setRulesForm = this.fb.group({
            viewer: [this.viewersOptions[0], Validators.required],
            availability: [this.getAvailability(), Validators.required],
            effectiveStarting: [
                this.data.resource
                    ? this.datePipe.transform(this.data.resource.visibilityValidity.effectiveStarting, AppSettings.DATE_FORMAT)
                    : this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT),
                Validators.required,
            ],
            expiresAfter: [
                this.data.resource
                    ? this.datePipe.transform(this.data.resource.visibilityValidity.expiresAfter, AppSettings.DATE_FORMAT)
                    : null,
            ],
            employeeAcceptance: [this.acceptanceOptions[0], Validators.required],
            employeeAcceptanceDate: [
                this.data.resource ? this.datePipe.transform(this.data.resource.employeeAcceptanceDate, AppSettings.DATE_FORMAT) : null,
            ],
        });
        if (this.data.action === "EDIT" && this.data.resource.employeeAcceptanceDate) {
            this.setRulesForm.controls["employeeAcceptance"].setValue(this.acceptanceOptions[1]);
            this.minEmployeeAcceptanceDate = this.dateService.toDate(this.data.resource.employeeAcceptanceDate);
            const currentDate = new Date();
            if (currentDate > this.minEmployeeAcceptanceDate) {
                this.setRulesForm.controls["employeeAcceptanceDate"].disable({ onlySelf: true });
                this.setRulesForm.controls["employeeAcceptance"].disable({ onlySelf: true });
            }
        }
        this.subscriptions.push(
            this.viewerOption.valueChanges.subscribe((val) => {
                if (val === this.viewersOptions[0]) {
                    this.newAudienceGroup = [];
                }
            }),
        );

        /* This will validate option field base on Availability Option field selection */
        this.subscriptions.push(
            this.availabilityOption.valueChanges.subscribe((val) => {
                const EFFECTIVE_STARTING = "effectiveStarting";
                if (val === "Visible to employees on") {
                    (this.setRulesForm.get(EFFECTIVE_STARTING) as FormControl).setValue(new Date());
                    (this.setRulesForm.get(EFFECTIVE_STARTING) as FormControl).setValidators(Validators.required);
                } else if (val === "Hidden") {
                    (this.setRulesForm.get(EFFECTIVE_STARTING) as FormControl).clearValidators();
                }
                (this.setRulesForm.get(EFFECTIVE_STARTING) as FormControl).updateValueAndValidity();
            }),
        );

        /* This will validate option field base on Acceptance Option field selection */
        this.subscriptions.push(
            this.acceptanceOption.valueChanges.subscribe((val) => {
                if (val === "Accept by date") {
                    (this.setRulesForm.get("employeeAcceptanceDate") as FormControl).setValidators(Validators.required);
                } else if (val === "Acceptance not required") {
                    (this.setRulesForm.get("employeeAcceptanceDate") as FormControl).clearValidators();
                }
                (this.setRulesForm.get("employeeAcceptanceDate") as FormControl).updateValueAndValidity();
            }),
        );
        this.listResources();
        this.subscribeToStartDateValueChanges();
        this.subscriptions.push(
            this.fileUploadService.fetchFileUploadConfigs().subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            }),
        );
    }
    /**
     * This method will get selected availability option.
     * @returns string
     */
    getAvailability(): string {
        if (this.data.resource && this.data.resource.visibilityValidity && this.data.resource.visibilityValidity.effectiveStarting) {
            return AvailabilitySelectedOption.VISIBLE_TO_EMPLOYEES_ON;
        }
        return AvailabilitySelectedOption.HIDDEN;
    }

    get resourceType(): FormControl {
        return this.addResourceForm.get("resourceType") as FormControl;
    }

    get availabilityOption(): FormControl {
        return this.setRulesForm.get("availability") as FormControl;
    }
    get viewerOption(): FormControl {
        return this.setRulesForm.get("viewer") as FormControl;
    }

    get acceptanceOption(): FormControl {
        return this.setRulesForm.get("employeeAcceptance") as FormControl;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
    /**
     * This method will list resources
     * @returns void
     */
    listResources(): void {
        this.subscriptions.push(
            this.carriersList$.subscribe((res) => {
                this.carrierData = res;
                if (this.data.action === "EDIT") {
                    this.carrierData.forEach((r) => {
                        if (r.name === this.data.resource.carrierName) {
                            (this.addResourceForm.get("carrier") as FormControl).setValue(r);
                        }
                    });
                }
            }),
        );

        this.subscriptions.push(
            this.categoriesList$.subscribe((res) => {
                this.categoryData = res;
                if (this.data.action === "EDIT") {
                    this.categoryData.forEach((r) => {
                        if (r.name === this.data.resource.categoryName) {
                            (this.addResourceForm.get("category") as FormControl).setValue(r);
                        }
                    });
                }
            }),
        );

        this.subscriptions.push(
            this.audienceGroupingsList$.subscribe((res) => {
                if (this.data.action === "EDIT") {
                    res.forEach((r) => {
                        if (r.id === this.data.resource.audienceGroupingId) {
                            this.initialAudienceGroup = [];
                            r.audiences.forEach((element) => {
                                this.initialAudienceGroup.push(element);
                            });
                            if (this.initialAudienceGroup && this.initialAudienceGroup.length) {
                                this.setRulesForm.controls["viewer"].setValue(this.viewersOptions[1]);
                            }
                        }
                    });
                }
            }),
        );
        this.subscriptions.push(
            this.documentsList$.subscribe((res) => {
                this.documents = res;
                if (this.data.action === "EDIT") {
                    this.documents.forEach((doc) => {
                        if (doc.id === this.data.resource.documentId) {
                            this.files.push({
                                name: doc.fileName,
                                modifiedName: doc.fileName,
                            });
                            this.isSucess.push(true);
                            this.uploadSuccessStatus.push(doc.uploadDate);
                            this.isFileAvailable = true;
                        }
                    });
                }
            }),
        );
    }

    getProductData(event: any): void {
        this.selectedResourceCarrierId = event.id;
        if (this.keysArray.includes(this.selectedResourceCarrierId.toString())) {
            this.productData = Object(this.carrierProductData)[this.selectedResourceCarrierId.toString()];
        }
    }
    /**
     * This method is used to validate the selected file
     * @param inputFile: is the file to upload to the server
     * @returns void
     */
    validateFileAndUpload(inputFile: File): void {
        const name = inputFile.name;
        this.fileExtension = inputFile.name.split(".").pop();
        this.invalidFileExtension = true;
        this.acceptableFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = false;
            }
        });

        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(inputFile.name.length - 8, inputFile.name.length);
            this.modifiedName = first16 + "..." + last8;
        } else {
            this.modifiedName = name;
        }
        const file: FileDetails = {
            name: inputFile.name,
            modifiedName: this.modifiedName,
            lastModified: inputFile.lastModified,
            size: inputFile.size,
            type: inputFile.type,
            slice: inputFile.slice,
            documentId: null,
        };
        this.files.push(file);
        if (this.invalidFileExtension) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.qle.pendingEnrollment.fileFormat.error");
        } else if (file.size > this.maxFileSizeAllowed) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.maxFileSize.error");
        } else {
            this.fileError = true;
            this.isFileSelected = true;
            this.isFileUploaded = false;
            this.isFileAvailable = true;
            this.isUploadingStarted = true;
            this.isProgressBarEnabled = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            this.uploadFile(inputFile, file);
        }
    }

    /**
     * @description function to set data for file error
     * @returns void
     */
    setDataForError() {
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
     * @param inputFile file for uploading
     * @param file contains details about the file
     * @returns void
     */
    uploadFile(inputFile: File, file: FileDetails): void {
        if (this.multipartFileUploadConfig) {
            this.subscriptions.push(this.processFile(inputFile, file).subscribe());
        } else {
            this.subscriptions.push(
                this.fileUploadService
                    .upload(inputFile)
                    .pipe(
                        switchMap(() => this.processFile(inputFile, file)),
                        catchError(() => {
                            this.hasError.push(true);
                            this.isSucess.push(false);
                            this.uploadSuccessStatus.push("");
                            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                            return of(null);
                        }),
                    )
                    .subscribe(),
            );
        }
    }

    /**
     * @description method to process the uploaded document
     * @param file the document uploaded
     * @param fileDetails contains details about the file
     * @returns Observable<void>
     */
    processFile(file: File, fileDetails: FileDetails): Observable<void> {
        return this.documentService.uploadDocument(file, this.multipartFileUploadConfig).pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total);
                    if (this.fileUploadPercentage === Percentages.FILE_UPLOAD_MAX_PERCENTAGE) {
                        this.modeProgress = "indeterminate";
                    }
                } else if (events.type === HttpEventType.Response && events.status === SuccessResponseCode.RESP_202) {
                    this.isSucess.push(true);
                    this.hasError.push(false);
                    this.isUploadingStarted = false;
                }
                this.fileUploadPercentageSubject$.next(this.fileUploadPercentage);
                if (events instanceof HttpResponse) {
                    this.uploadErrorStatus.push("");
                    this.uploadSuccessStatus.push(this.datePipe.transform(new Date(), DateFormat.DATE_TIME));
                    this.documentsId.push(parseInt(events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/")[5], 10));
                    const documentId = parseInt(events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/")[5], 10);
                    this.files.forEach((doc) => {
                        if (doc === fileDetails) {
                            doc.documentId = documentId;
                            (this.addResourceForm.get("document") as FormControl).setValue(documentId);
                            return;
                        }
                    });
                    this.isFileUploaded = true;
                    this.isProgressBarEnabled = false;
                    this.addResourceForm.controls.resourceType.setErrors(null);
                }
                return of(null);
            }),
            catchError((error) => {
                this.hasError = [];
                this.isSucess = [];
                this.uploadErrorStatus = [];
                this.uploadSuccessStatus = [];
                this.isFileUploaded = false;
                this.isUploadingStarted = false;
                this.isProgressBarEnabled = false;
                this.hasError.push(true);
                this.isSucess.push(false);
                this.uploadSuccessStatus.push("");
                this.getErrorMessage(error);
                if (this.errorMessage === "") {
                    this.uploadErrorStatus.push("secondary.portal.shared.monUpload.uploadError.label");
                } else {
                    this.uploadErrorStatus.push(this.errorMessage);
                }
                return of(null);
            }),
        );
    }

    getErrorMessage(error: any): void {
        if (error.status === AppSettings.API_RESP_413) {
            this.errorMessage = "secondary.portal.shared.monUpload.maxFileSize.error";
        } else if (error.status === AppSettings.API_RESP_415) {
            this.errorMessage = "secondary.portal.shared.monUpload.fileFormat.error";
        } else if (error.status === AppSettings.API_RESP_409) {
            this.errorMessage = "secondary.portal.shared.monUpload.uploading.error";
        } else if (error.status === AppSettings.API_RESP_400) {
            this.get400ErrorMessage(error);
        } else if (error.status === AppSettings.API_RESP_403) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.forbiddenError";
        } else if (error.status === AppSettings.API_RESP_500) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.InternalServerError";
        } else {
            this.errorMessage = "secondary.portal.shared.monUpload.unknown.error";
        }
    }

    get400ErrorMessage(error: any): void {
        if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.badParameter.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.Censuserror";
        } else if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.parseError.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.FileUnreadableerror";
        } else if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.missingParameter.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.FileRequirederror";
        } else if (error.error.details[0].message === "Empty census file") {
            this.errorMessage = "secondary.portal.shared.monUpload.emptyCensusFile";
        } else if (
            error.error.details?.length &&
            error.error.details[0].field === this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
        ) {
            this.errorMessage = "primary.portal.members.document.addUpdate.virusDetectedError";
        }
    }

    cancelFileUpload(index: number): void {
        this.files.splice(index, 1, null);
        this.uploadSuccessStatus.splice(index, 1, "");
        this.uploadErrorStatus.splice(index, 1, "");
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
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

    /* will open document in new tab */
    viewFile(event: any): void {
        const fileName = event.name;
        const fileType = fileName.split(".").pop();
        this.subscriptions.push(
            this.documentService.downloadDocument(event.documentId).subscribe((response) => {
                switch (fileType) {
                    case "pdf":
                        const pdfBlob = new Blob([response], { type: "application/pdf" });
                        const fileurl = URL.createObjectURL(pdfBlob);
                        window.open(fileurl, "_blank");
                        break;
                    default:
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
            }),
        );
    }

    stepChanged(event: any): void {
        this.isSaveEnabled = false;
        if (event.selectedIndex === 0) {
            this.changeStepper = this.step1;
        } else if (event.selectedIndex === 1) {
            this.changeStepper = this.step2;
        }
    }

    closeForm(): void {
        this.bottomSheetRef.dismiss();
    }

    onClickBack(): void {
        this.isSaveEnabled = false;
        this.enableBackButton = false;
        if (this.changeStepper === this.step2) {
            this.changeStepper = this.step1;
        } else {
            this.changeStepper = this.step2;
            this.enableBackButton = true;
        }
    }

    OnClickNext(): void {
        if (this.changeStepper === 1) {
            this.isAddResourceFormValid();
            this.markFormGroupTouched(this.addResourceForm);
            if (this.addResourceForm.valid) {
                this.changeStepper++;
                if (this.changeStepper === 1) {
                    this.stepPosition = this.step1;
                } else if (this.changeStepper === this.step2) {
                    this.setValueOnViewChange();
                    this.stepPosition = this.step2;
                }
            }
        }
    }

    /**
     * This function is used to set the previous value on view change
     * @returns void.
     */
    setValueOnViewChange(): void {
        const setRulesForm = this.setRulesForm.controls;
        if (this.tempStartDate) {
            setRulesForm.effectiveStarting.setValue(
                this.dateService.toDate(this.datePipe.transform(this.tempStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)),
            );
        }
        if (this.tempEndDate) {
            setRulesForm.expiresAfter.setValue(
                this.dateService.toDate(this.datePipe.transform(this.tempEndDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)),
            );
        }
        if (this.tempEmployeeAcceptanceDate) {
            setRulesForm.employeeAcceptanceDate.setValue(
                this.dateService.toDate(this.datePipe.transform(this.tempEmployeeAcceptanceDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)),
            );
        }
    }

    markFormGroupTouched(formGroup: FormGroup): void {
        (Object as any).values(formGroup.controls).forEach((control) => {
            if (!(control.value && control.value !== "")) {
                control.markAsTouched();
            }

            if (control.controls) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /* This Will create final resource object which will use in create and update resource */
    createResourceObjet(): void {
        const start = this.datePipe.transform(this.setRulesForm.controls.effectiveStarting.value, AppSettings.DATE_FORMAT);
        const end = this.datePipe.transform(this.setRulesForm.controls.expiresAfter.value, AppSettings.DATE_FORMAT);
        const accept = this.datePipe.transform(this.setRulesForm.controls.employeeAcceptanceDate.value, AppSettings.DATE_FORMAT);
        this.resourceObj = {
            name: this.addResourceForm.controls.name.value ? this.addResourceForm.controls.name.value : undefined,
            type: this.data.type,
            resourceType: this.addResourceForm.controls.resourceType.value ? this.addResourceForm.controls.resourceType.value : undefined,
            description: this.addResourceForm.controls.description.value ? this.addResourceForm.controls.description.value : undefined,
            link: this.addResourceForm.controls.link.value ? this.addResourceForm.controls.link.value : undefined,
            documentId: this.addResourceForm.controls.document.value ? this.addResourceForm.controls.document.value : undefined,
            visibilityValidity: {
                effectiveStarting: start ? start : "",
                expiresAfter: end ? end : "",
            },
            employeeAcceptanceDate: accept ? accept : "",
            carrierId: this.addResourceForm.controls.carrier.value ? this.addResourceForm.controls.carrier.value.id : undefined,
            productId: this.addResourceForm.controls.product.value ? this.addResourceForm.controls.product.value.productId : undefined,
            category: this.addResourceForm.controls.category.value ? this.addResourceForm.controls.category.value : undefined,
        };

        if (this.data.type === "BENEFIT") {
            delete this.resourceObj["category"];
        } else if (this.data.type === "COMPANY") {
            delete this.resourceObj["carrierId"];
            delete this.resourceObj["productId"];
        }
        if (this.data.action === "EDIT") {
            this.resourceObj.audienceGroupingId = this.data.resource.audienceGroupingId;
        }

        if (this.availabilityOption && this.availabilityOption.value === "Hidden") {
            this.resourceObj.visibilityValidity = null;
        }

        if (this.acceptanceOption && this.acceptanceOption.value === "Acceptance not required") {
            this.resourceObj.employeeAcceptanceDate = null;
        }

        /* This will remove undefined fields from Resource Object */
        Object.keys(this.resourceObj).forEach((key) => this.resourceObj[key] === undefined && delete this.resourceObj[key]);
    }

    /* will Update Resource/Audience Grouping */
    onClickSave(): void {
        if (this.isRulesFormInValid() || (this.setRulesForm.controls["viewer"].value === "Subset of employees" && !this.isFormvalid)) {
            this.bottomSheetRef.dismiss();
            return;
        }
        this.createResourceObjet();
        /* This will give us new audience as "create" and need to delete audience as "remove" object */
        this.updatedAudienceGrouping = AudienceBuilderContainerComponent.determineCRUDOperations(
            this.initialAudienceGroup,
            this.newAudienceGroup,
        );
        if (this.newAudienceGroup !== undefined && this.newAudienceGroup.length) {
            this.subscriptions.push(
                this.accountService
                    .createAudienceGrouping({ audiences: this.newAudienceGroup })
                    .pipe(
                        mergeMap((response) => {
                            this.resourceObj.audienceGroupingId = response.headers.get("Location").split("/").slice(-1)[0];
                            return this.accountService.updateResource(this.data.resource.id, this.resourceObj);
                        }),
                    )
                    .subscribe(
                        (data) => {
                            this.bottomSheetRef.dismiss();
                        },
                        (error) => {},
                    ),
            );
        } else {
            if (this.updatedAudienceGrouping.create !== undefined && this.updatedAudienceGrouping.create.length) {
                const reqToServer = [];
                this.updatedAudienceGrouping.create.forEach((audienceGroup) => {
                    reqToServer.push(this.accountService.addAudienceToAudienceGrouping(this.resourceObj.audienceGroupingId, audienceGroup));
                });
                forkJoin(reqToServer);
            }
            if (this.updatedAudienceGrouping.remove !== undefined && this.updatedAudienceGrouping.remove.length) {
                /* This will fetch audience Id from remove object */
                this.updatedAudienceGrouping.remove.forEach((r) => {
                    this.audienceId = r.id;
                });
                this.accountService.removeAudienceFromAudienceGrouping(this.resourceObj.audienceGroupingId, this.audienceId);
            }
            if (this.setRulesForm.controls.viewer.value === this.viewersOptions[0]) {
                delete this.resourceObj.audienceGroupingId;
            }
            this.subscriptions.push(
                this.accountService.updateResource(this.data.resource.id, this.resourceObj).subscribe((res) => {
                    this.bottomSheetRef.dismiss();
                }),
            );
        }
    }

    /* Will create New Resource/Audience Grouping */
    onClickAdd(): void {
        if (this.isRulesFormInValid()) {
            return;
        }
        this.createResourceObjet();
        if (this.newAudienceGroup !== undefined && this.newAudienceGroup.length) {
            this.subscriptions.push(
                this.accountService
                    .createAudienceGrouping({ audiences: this.newAudienceGroup })
                    .pipe(
                        mergeMap((response) => {
                            this.resourceObj.audienceGroupingId = response.headers.get("Location").split("/").slice(-1)[0];
                            return this.accountService.createResource(this.resourceObj);
                        }),
                    )
                    .subscribe(
                        (data) => {
                            this.bottomSheetRef.dismiss();
                        },
                        (error) => {},
                    ),
            );
        } else {
            this.subscriptions.push(
                this.accountService.createResource(this.resourceObj).subscribe(
                    (data) => {
                        this.bottomSheetRef.dismiss();
                    },
                    (error) => {},
                ),
            );
        }
    }

    onAudienceGroupingChange($event: any): void {
        this.newAudienceGroup = $event;
    }

    /* Check validation for AddResourceForm on next buttton click */
    isAddResourceFormValid(): boolean {
        let anyError = false;
        if (this.addResourceForm.controls.carrier.invalid) {
            this.addResourceForm.controls.carrier.setErrors({ require: true });
            anyError = true;
        }
        if (this.addResourceForm.controls.product.invalid) {
            this.addResourceForm.controls.product.setErrors({ require: true });
            anyError = true;
        }
        if (this.addResourceForm.controls.category.invalid) {
            this.addResourceForm.controls.category.setErrors({ require: true });
            anyError = true;
        }
        if (this.addResourceForm.controls.name.invalid) {
            this.addResourceForm.controls.name.setErrors({ require: true });
            anyError = true;
        }
        if (this.addResourceForm.controls.description.invalid) {
            this.addResourceForm.controls.description.setErrors({ require: true });
            anyError = true;
        }
        if (this.addResourceForm.controls.link.invalid) {
            if (this.addResourceForm.controls.link.value && !this.addResourceForm.controls.link.value.match(this.regPatten)) {
                this.addResourceForm.controls.link.setErrors({ inValid: true });
            } else {
                this.addResourceForm.controls.link.setErrors({ require: true });
            }
            anyError = true;
        }
        if (this.addResourceForm.controls.resourceType.value === "FILE" && !this.files.length) {
            this.addResourceForm.controls.resourceType.setErrors({ require: true });
            anyError = true;
        }
        return anyError;
    }

    /* Check validation for setRulesForm on Add/Save buttton click */
    isRulesFormInValid(): boolean {
        let anyError = false;
        if (
            this.getAvailability() === AvailabilitySelectedOption.VISIBLE_TO_EMPLOYEES_ON &&
            this.setRulesForm.controls.effectiveStarting.invalid
        ) {
            this.setRulesForm.controls.effectiveStarting.setErrors({ require: true });
            anyError = true;
        }
        if (this.setRulesForm.controls.expiresAfter.invalid) {
            this.setRulesForm.controls.expiresAfter.setErrors({ require: true });
            anyError = true;
        }
        if (this.setRulesForm.controls.employeeAcceptanceDate.invalid) {
            this.setRulesForm.controls.employeeAcceptanceDate.setErrors({ require: true });
            anyError = true;
            this.setRulesForm.controls.employeeAcceptanceDate.markAsTouched();
        }
        return anyError;
    }

    /**
     * This method is used to check for valid date format and valid dates
     * @returns void
     */
    isValidDate(event: any, control: AbstractControl): void {
        if (this.stepPosition === SET_RULES_STEP && this.startDate) {
            this.tempStartDate = this.startDate.nativeElement.value;
            this.tempEndDate = this.endDate.nativeElement.value;
            if (this.acceptanceDate) {
                this.tempEmployeeAcceptanceDate = this.acceptanceDate.nativeElement.value;
            }
        }
        if (event.target.value) {
            const inputDate = this.dateService.toDate(control.value || Date.now());
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ inValid: true });
            }
            if (!control.valid) {
                const startDate = this.dateService.toDate(this.tempStartDate);
                const controlDate = this.dateService.toDate(control.value || Date.now());
                if (this.dateService.isEqual(controlDate, startDate) && this.dateService.isBefore(controlDate)) {
                    control.setErrors({ isLessThanStartDate: true, isPastDate: true });
                } else {
                    control.setErrors({ isLessThanStartDate: true, isLessThanMinDate: true });
                }
            }
        } else {
            control.setErrors({ inValid: true });
        }
    }

    /* will check for valid link format */
    isValidLink(value: any, control: AbstractControl): void {
        if (value && !value.match(this.regPatten)) {
            control.setErrors({ inValid: true });
        }
    }
    onAudienceGroupingValidation($event: boolean): void {
        this.isFormvalid = $event;
    }

    validateConfig(): void {
        this.submitEventSubject$.next();
    }
    /**
     * When the start date exceeds end date
     * If entered end date is defined and valid: "Must be before end date"
     * @returns void
     */
    subscribeToStartDateValueChanges(): void {
        const today = new Date();
        const startDateControl = this.setRulesForm.controls.effectiveStarting;
        const endDateControl = this.setRulesForm.controls.expiresAfter;
        this.subscriptions.push(
            startDateControl.valueChanges
                .pipe(
                    map((startDate) => this.dateService.toDate(startDate)),
                    distinctUntilChanged(),
                )
                .subscribe((startDate) => {
                    if (startDateControl.value) {
                        if (this.dateService.isEqual(startDate, today)) {
                            this.minDate = this.dateService.toDate(this.minDate.setDate(new Date().getDate() + 1));
                        } else {
                            this.minDate = this.dateService.toDate(startDateControl.value);
                            const newDate = this.dateService.toDate(startDateControl.value).getDate();
                            this.minDate.setDate(newDate + 1);
                        }
                        if (
                            endDateControl.value &&
                            endDateControl.value.isValid() &&
                            this.dateService.isBeforeOrIsEqual(this.dateService.toDate(endDateControl.value || Date.now()), startDate)
                        ) {
                            this.setRulesForm.controls.expiresAfter.setValue(null);
                        }
                    }
                }),
        );
    }
}
