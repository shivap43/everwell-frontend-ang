import { Component, OnInit, OnDestroy, ViewChild, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CensusComponent } from "../census.component";
import {
    CensusService,
    MappingFieldGroup,
    MemberService,
    DocumentApiService,
    SearchMembers,
    DocumentQuery,
    BenefitsOfferingService,
    AccountProfileService,
    CensusUploadError,
    CensusMappingNeeded,
    CensusMappingField,
    CensusMapping,
} from "@empowered/api";
import { Subscription, Observable, interval, of, Subject, combineLatest } from "rxjs";
import { HttpEventType, HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { FormGroup, FormBuilder } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { FileUploadMessage, AppSettings, Documents, DocumentContent, DocumentStatus, ConfigName } from "@empowered/constants";
import { catchError, finalize, switchMap, takeUntil, tap } from "rxjs/operators";
import { MemberListState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { FileUploadService } from "@empowered/common-services";

const CUSTOM_CLASS_TYPE = "customClassType";
const EXPAND_ADMIN_DETAILS_PARAMETER = "uploadAdminId";
const FILE_EXTENSION = "xlsm";

@Component({
    selector: "empowered-upload-census",
    templateUrl: "./upload-census.component.html",
    styleUrls: ["./upload-census.component.scss"],
})
export class UploadCensusComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator, { static: true }) matPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) matSort: MatSort;
    @Select(MemberListState.fullMemberListResponse) fullMemberListResponse$: Observable<SearchMembers>;
    cenususUploadFile: File = null;
    pageEventSubscription: Subscription;
    isFileUploaded = false;
    isFileSelected = true;
    fileUploadPercentage = 0;
    isUploadingStarted = false;
    hasError: boolean[] = [];
    isSucess: boolean[] = [];
    warningMessage: string;
    errorMessage = "";
    fileUploadFailedMsg = "";
    modeProgress = "determinate";
    documentId: number;
    files: File[] = [];
    langStrings = {};
    subscriptions: Subscription[] = [];
    subscription: Subscription;
    censusSubscription: Subscription;
    acceptableFormats = ".xls,.xlsm,.xlsx";
    uploadErrorStatus: string[] = [];
    uploadSuccessStatus: string[] = [];
    mpGroupId: number;
    isProgressBarEnabled: boolean;
    selectForUpload: boolean;
    sucessStatus: string;
    mappingRequired: any;
    errorLogDataSource = new MatTableDataSource<CensusUploadError>();
    errorLog: CensusUploadError[] = [];
    isSavedMapNameChanged = true;
    isFileViewable = false;
    invalidFileExtension: boolean;
    fileExtension: string;
    modifiedName: string;
    censusFile: File;
    censusForm: FormGroup;
    notAllowedFormats = ["bat", "exe", "dll", "sh", "bmp", "avi", "mov", "gif", "ini", "jpg", "sys", "wav", "mp3"];
    hasWarning = false;
    displayedColumnsErrorlog: string[] = ["errorRow", "errorColumn", "errorMessage"];
    displayedColumns: string[] = ["icon", "defaultCategories", "fileRow1", "fileRow2", "fileRow3"];
    dataSource: MatTableDataSource<CensusMappingNeeded[]>;
    mappingData: any;
    isLoading = true;
    isErrorLog = false;
    templateURL: string;
    data: any[] = [];
    mappingNeeded: CensusMapping;
    isMappingRequired = false;
    censusMappingFields: CensusMappingField[] = [];
    select: string[] = [];
    pageSizeOptions: number[] = AppSettings.errorLogPageSizeOptions;
    preSelectedData: CensusMappingField[] = [];
    isMappingDataAdded = false;
    savedCensusMappings: CensusMapping[] = [];
    censusMap: CensusMapping;
    saveCensusMapping: CensusMapping;
    isSavedMappings = false;
    classTypes: ClassType[];
    isContainsHeader = false;
    mappingId: number;
    errorLogLength = 0;
    isSave = false;
    activeCol: string;

    selectedSavedMapping = "select";
    isSavedMappingSelected = false;
    lastUploadFileName: string;
    count = 0;
    errorRequiredFieldMissing = false;
    errorRequiredFields: string[] = [];
    mappingFieldsGroup: MappingFieldGroup[] = [];
    existingDocument: any;
    validationError: string;
    isMappingNameError = false;
    changeFile = true;
    pageSizeOption: number[];
    mappingLanguage = "primary.portal.census.mappingColumns.";
    languageStrings = {
        downloadCensusTemplateMsg: this.language.fetchPrimaryLanguageValue("primary.portal.census.downloadCensusTemplateMsg"),
        downloadErrorLog: this.language.fetchPrimaryLanguageValue("primary.portal.census.downloadErrorLog"),
        censusTemplateMsg: this.language.fetchPrimaryLanguageValue("primary.portal.census.censusTemplateMsg"),
        filemapName: this.language.fetchPrimaryLanguageValue("primary.portal.census.uploadcensus.filemapName"),
        ariaEdit: this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        ariaClose: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
        ariaSave: this.language.fetchPrimaryLanguageValue("primary.portal.common.save"),
    };
    errorLanguageText: string;
    uploadMethod = "update";
    aflacDocumentInfo: string;
    uploadedAdminName: string;
    lastUploadedFileDate: string | Date;
    isExistingDoc = false;
    memberListSubscription: any;
    membersList: any;
    lastUploadedFileID: any;
    uploadStatus: DocumentStatus;
    enrollmentStartDate: Date | string;
    onlyUpdate = false;
    queryString = ["input.ng-invalid"].join(",");
    alertErrorMessageKey: string;
    isDisable = false;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;
    readonly MEMBER_TYPE = "Member Type";
    readonly DEPENDENT_TYPE = "Dependent Type";
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly dialogRef: MatDialogRef<CensusComponent>,
        private readonly censusService: CensusService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly documentService: DocumentApiService,
        private readonly benefitService: BenefitsOfferingService,
        private readonly accountProfileService: AccountProfileService,
        private readonly utilService: UtilService,
        @Inject(MAT_DIALOG_DATA) private readonly dialogData: any,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.census.uploadcensus.addEmployeetitle",
            "primary.portal.census.downloadCensusTemplateMsg",
            "primary.portal.census.uploadcensus.currentEmployeeList",
            "primary.portal.census.censusTemplateMsg",
            "primary.portal.census.uploadcensus.pageNumberControl",
            "primary.portal.census.uploadcensus.mappingTool",
            "primary.portal.census.errorMessage.errorInvalidPEOClassName.link",
            "primary.portal.census.errorMessage.errorInvalidPEOClassName1",
            "primary.portal.census.errorMessage.errorInvalidPEOClassName2",
        ]);
    }

    /**
     * Sets up upload census form and associated data
     */
    ngOnInit(): void {
        this.isErrorLog = false;
        this.censusForm = this.fb.group({
            censusMapping: [""],
            isContainsHeader: [false],
            pageNumberControl: [1],
        });
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.isSucess = [];
        this.isDisable = this.dialogData.isDisable;
        this.mpGroupId = this.dialogData.mpGroupId;
        this.aflacDocumentInfo = this.language.fetchPrimaryLanguageValue("primary.portal.census.uploadcensus.tootipMsg");
        this.selectForUpload = false;
        this.isFileSelected = true;
        this.files = [];
        this.errorLog = [];
        this.getExistingDocument();
        this.getCensusTemplate();
        this.getClassTypes();
        this.getLanguageStrings();
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    /**
     * Function to get enrollment start date
     */
    getEnrollmentStartDate(): void {
        this.benefitService
            .getPlanYears(this.mpGroupId, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYears) => {
                if (planYears.length !== 0) {
                    this.enrollmentStartDate = this.dateService.toDate(planYears[planYears.length - 1].enrollmentPeriod.effectiveStarting);
                    if (this.enrollmentStartDate !== undefined) {
                        const currentDate = new Date();
                        if (currentDate < this.enrollmentStartDate) {
                            this.onlyUpdate = false;
                        } else {
                            this.onlyUpdate = true;
                            this.changeFile = true;
                        }
                    }
                } else {
                    this.onlyUpdate = false;
                }
            });
    }

    replaceOrUpdate(val: any): void {
        switch (val) {
            case "update":
                this.changeFile = true;
                break;
            case "replace":
                this.changeFile = false;
                break;
            default:
                return;
        }
    }
    /**
     * Method to download employee list
     */
    getCurrentEmployeeList(): void {
        if (this.lastUploadedFileID !== undefined) {
            const fileNameArray = this.lastUploadFileName.split(".");
            fileNameArray[fileNameArray.length - 1] = FILE_EXTENSION;
            this.memberService
                .downloadActiveMemberCensus()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    const blob = new Blob([response], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    const anchor = document.createElement("a");
                    anchor.download = fileNameArray.join(".");
                    const fileURLBlob = URL.createObjectURL(blob);
                    anchor.href = fileURLBlob;
                    document.body.appendChild(anchor);
                    anchor.click();
                });
        }
    }
    sortData(event: any): void {
        // TODO : Need to fix this function
        this.activeCol = event.active;
    }

    /**
     * Method used to get the existing census documents
     */
    getExistingDocument(): void {
        const query: DocumentQuery = {
            property: "type",
            value: "CENSUS",
        };
        this.isExistingDoc = false;
        this.documentService
            .searchDocuments(this.mpGroupId, query, EXPAND_ADMIN_DETAILS_PARAMETER)
            .pipe(
                finalize(() => (this.isLoading = false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((data: Documents) => {
                if (data.content.length) {
                    data.content.sort(
                        (doc1: DocumentContent, doc2: DocumentContent) =>
                            this.dateService.toDate(doc2.uploadDate).getTime() - this.dateService.toDate(doc1.uploadDate).getTime(),
                    );
                    this.existingDocument = data.content.find((ele) => ele.status === FileUploadMessage.COMPLETE);
                    if (this.existingDocument) {
                        this.getEnrollmentStartDate();
                        this.lastUploadFileName = this.existingDocument.fileName;
                        this.lastUploadedFileID = this.existingDocument.id;
                        this.lastUploadedFileDate = this.existingDocument.uploadDate;
                        // eslint-disable-next-line max-len
                        this.uploadedAdminName = `${this.existingDocument.uploadAdmin.name.firstName} ${this.existingDocument.uploadAdmin.name.lastName}`;
                        this.isExistingDoc = true;
                    }
                }
            });
    }

    /**
     * Method used to upload census file
     * @param event file to upload
     * @param mappingId mapping id of the file
     */
    uploadFile(event: File, mappingId?: number): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.shared.*"));
        this.hasWarning = false;
        this.isErrorLog = false;
        this.censusFile = event;
        const name = event.name;
        this.fileExtension = event.name.split(".").pop();
        this.invalidFileExtension = false;
        this.errorLog = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.matPaginator.pageIndex = 0;
        this.isSucess = [];
        this.files = [];
        this.selectForUpload = false;
        this.isFileSelected = true;
        this.warningMessage = "";
        this.errorMessage = "";
        this.fileUploadFailedMsg = "";
        this.errorLog.length = 0;
        this.fileUploadPercentage = 0;
        this.isProgressBarEnabled = false;
        this.isUploadingStarted = false;
        this.notAllowedFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = true;
            }
        });
        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(event.name.length - 8, event.name.length);
            this.modifiedName = first16 + "..." + last8;
        } else {
            this.modifiedName = name;
        }
        const file: any = {
            name: event.name,
            modifiedName: this.modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
            documentId: null,
        };
        this.files.push(file);
        if (this.invalidFileExtension) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.fileFormat.error");
        } else if (event.size > this.maxFileSizeAllowed) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.maxFileSize.error");
        } else {
            this.isFileSelected = true;
            this.isProgressBarEnabled = true;
            this.isFileUploaded = false;
            this.isUploadingStarted = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            if (this.censusForm.controls["censusMapping"].value !== "") {
                this.saveCensusMapping = {
                    containsHeaderRow: this.censusForm.controls["isContainsHeader"].value,
                    name: this.censusForm.controls["censusMapping"].value.trim(),
                    fields: this.preSelectedData,
                };
                this.censusMap = this.utilService.copy(this.saveCensusMapping);
                this.saveCustomClassTypes();
                this.censusService
                    .saveCensusMapping(this.censusMap, this.mpGroupId)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (response: any) => {
                            this.mappingId = parseInt(response.headers.get("location").split("/")[6], 10);
                            this.isMappingRequired = false;
                            this.censusForm.controls["censusMapping"].setValue("");
                            this.isSavedMapNameChanged = false;
                            this.uploadCensusFile(event, this.mappingId);
                        },
                        (error: HttpErrorResponse) => {
                            this.store
                                .dispatch(new LoadSecondaryLandingLanguage("secondary.portal.census.*"))
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe((data) => {
                                    switch (error.status) {
                                        case AppSettings.API_RESP_400:
                                            if (error.error.code === AppSettings.MISSINGPARAMETER) {
                                                this.isProgressBarEnabled = false;
                                                this.isUploadingStarted = false;
                                                this.hasWarning = true;
                                                this.warningMessage = "secondary.portal.shared.monUpload.mapping.warning";
                                                this.errorRequiredFieldMissing = true;
                                                this.isFileSelected = true;
                                                this.errorRequiredFields = [];
                                                error.error.details.forEach((ele) => {
                                                    this.errorRequiredFields.push(ele.field);
                                                });
                                            } else if (error.error.code === AppSettings.BADPARAMETER) {
                                                this.censusForm.controls["censusMapping"].setErrors({
                                                    isMappingNameError: true,
                                                });
                                                this.validationError = this.language.fetchSecondaryLanguageValue(
                                                    "secondary.portal.census.fileMapName.validationMsg",
                                                );
                                            } else if (error.error.code === "badRequest") {
                                                this.censusForm.controls["censusMapping"].setErrors({
                                                    isMappingNameError: true,
                                                });

                                                this.validationError = this.language.fetchSecondaryLanguageValue(
                                                    "secondary.portal.census.fileMapName.duplicateErrorMsg",
                                                );
                                            }
                                            break;
                                        default:
                                            return;
                                    }
                                });
                        },
                    );
            } else {
                this.isMappingRequired = false;
                this.uploadCensusFile(event, mappingId);
            }
        }
    }
    saveCustomClassTypes(): void {
        this.censusMap.fields = this.censusMap.fields.map((el) => {
            const data = this.classTypes.filter((item) => item.name.toLowerCase() === el.value.toLowerCase());
            if (data.length) {
                el.name = CUSTOM_CLASS_TYPE + "-" + data[0].id;
            }
            return el;
        });
    }

    getCensusTemplate(): void {
        this.censusService
            .getCensusTemplate(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.templateURL = response.templateURL;
                this.censusMappingFields = response.censusMappingResource.fields;
                this.censusMappingFields.splice(-1, 1);
                this.censusMappingFields.forEach(
                    (ele) => (ele.value = this.language.fetchPrimaryLanguageValue(this.mappingLanguage + ele.name)),
                );
            });
    }

    getClassTypes(): void {
        this.accountProfileService
            .getClassTypes(this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.classTypes = res;
            });
    }

    /**
     * uploadCensus is used to process uploaded employee details
     * @param file is uploaded file
     * @param mappingId is of type number and it is an optional and used when mapping id is present in the url
     */
    uploadCensus(file: File, mappingId?: number): Observable<void> {
        this.alertErrorMessageKey = "";
        return this.censusService.uploadCensus(file, this.mpGroupId, this.changeFile, this.multipartFileUploadConfig, mappingId).pipe(
            switchMap((events) => {
                if (events instanceof HttpResponse) {
                    this.documentId = parseInt(events.headers.get(AppSettings.API_RESP_HEADER_LOCATION).split("/")[6], 10);
                }
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((33 * events.loaded) / events.total);
                } else if (events.type === HttpEventType.Response && events.status === AppSettings.API_RESP_202) {
                    this.isFileUploaded = true;
                    this.isProgressBarEnabled = true;
                }
                return of(null);
            }),
            catchError((error) => {
                this.setDataForError(true);
                if (error.status === AppSettings.API_RESP_413) {
                    this.errorMessage = "secondary.portal.shared.monUpload.maxFileSize.error";
                } else if (error.status === AppSettings.API_RESP_415) {
                    this.errorMessage = "secondary.portal.shared.monUpload.fileFormat.error";
                } else if (error.status === AppSettings.API_RESP_409) {
                    if (error.error.code === AppSettings.CONFLICT) {
                        this.alertErrorMessageKey = "primary.portal.census.errorMessage.errorNonPEOClass";
                    } else {
                        this.errorMessage = "secondary.portal.shared.monUpload.uploading.error";
                    }
                } else if (error.status === AppSettings.API_RESP_300) {
                    this.hasWarning = true;
                    this.mappingRequired = error;
                    this.warningMessage = "secondary.portal.shared.monUpload.mapping.warning";
                    this.mappingTool(this.mappingRequired);
                } else if (error.status === AppSettings.API_RESP_400) {
                    if (
                        error.error.details[0].field ===
                        this.language.fetchPrimaryLanguageValue("primary.portal.census.400.badParameter.maxRows.label")
                    ) {
                        this.errorMessage = "secondary.portal.shared.monUpload.file.exceedMaximumRows";
                    } else if (
                        error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.badParameter.label")
                    ) {
                        this.errorMessage = "secondary.portal.shared.monUpload.file.Censuserror";
                    } else if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.parseError.label")) {
                        this.errorMessage = "secondary.portal.shared.monUpload.file.FileUnreadableerror";
                    } else if (
                        error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.missingParameter.label")
                    ) {
                        this.errorMessage = "secondary.portal.shared.monUpload.file.FileRequirederror";
                    } else if (error.error.details[0].message === "Empty census file") {
                        this.errorMessage = "secondary.portal.shared.monUpload.emptyCensusFile";
                    } else if (
                        error.error.details?.length &&
                        error.error.details[0].field ===
                            this.language.fetchPrimaryLanguageValue("primary.portal.members.document.addUpdate.virusDetected.fieldMessage")
                    ) {
                        this.errorMessage = "primary.portal.members.document.addUpdate.virusDetectedError";
                    }
                } else if (error.status === AppSettings.API_RESP_403) {
                    this.errorMessage = "secondary.portal.shared.monUpload.file.forbiddenError";
                } else if (error.status === AppSettings.API_RESP_500) {
                    this.errorMessage = "secondary.portal.shared.monUpload.file.InternalServerError";
                } else {
                    this.errorMessage = "secondary.portal.shared.monUpload.unknown.error";
                }
                if (this.errorMessage === "") {
                    this.uploadErrorStatus.push("secondary.portal.shared.monUpload.uploadError.label");
                } else {
                    this.uploadErrorStatus.push(this.errorMessage);
                }
                return of(null);
            }),
            finalize(() => {
                if (this.documentId) {
                    this.checkUploadStatus(this.documentId);
                }
            }),
        );
    }

    /**
     * uploadCensusFile is used to upload employee details to aws s3 using presigned url based on config
     * @param event is of type File contains file information
     * @param mappingId is of type number and it is an optional and used when mapping id is present in the url
     */
    uploadCensusFile(file: File, mappingId: number) {
        if (this.multipartFileUploadConfig) {
            this.uploadCensus(file, mappingId).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.fileUploadService
                .upload(file)
                .pipe(
                    switchMap(() => this.uploadCensus(file, mappingId)),
                    catchError(() => {
                        this.setDataForError(true);
                        this.uploadErrorStatus.push("secondary.portal.shared.monUpload.uploadError.label");
                        this.fileUploadFailedMsg = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.shared.monUpload.genericError",
                        );
                        return of(null);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description setDataForError is used to set data when error occurs
     * @param isApiError indicates if error is from api
     * @returns void
     */
    setDataForError(isApiError?: boolean): void {
        if (isApiError) {
            this.hasError = [];
            this.isSucess = [];
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.isFileUploaded = false;
            this.isUploadingStarted = false;
            this.isProgressBarEnabled = false;
        } else {
            this.isProgressBarEnabled = true;
            this.isFileSelected = true;
        }
        this.hasError.push(true);
        this.isSucess.push(false);
        this.uploadSuccessStatus.push("");
    }

    changeDefaultMapping(): void {
        this.mappingOptions();
        this.isInputBoxEnabled();
    }

    isInputBoxEnabled(): void {
        if (this.saveCensusMapping === undefined) {
            this.censusForm.controls["censusMapping"].enable();
        } else if (
            (this.isSavedMappingSelected && JSON.stringify(this.saveCensusMapping.fields) !== JSON.stringify(this.preSelectedData)) ||
            this.censusForm.controls["isContainsHeader"].value !== this.saveCensusMapping.containsHeaderRow
        ) {
            this.censusForm.controls["censusMapping"].enable();
            this.isSavedMapNameChanged = true;
        } else {
            this.censusForm.controls["censusMapping"].disable();
        }
    }

    downloadError(): void {
        const csvData = this.ConvertToCSV(this.errorLog);
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        /*
        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
        Typescript won't know this is a thing, so we have to use Type Assertion
        */
        if ((navigator as any).msSaveBlob) {
            (navigator as any).msSaveBlob(blob, "filename");
        } else {
            const a = document.createElement("a");
            a.href = url;
            a.download = "ErrorLog.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
    }

    ConvertToCSV(objArray: any): string {
        const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
        let str = "Row number,Column name,Error message" + "\r\n";
        array.forEach((elem) => {
            str += elem.errorRow + "," + elem.errorColumn + "," + elem.errorMessage + "\r\n";
        });
        return str;
    }

    isColSelected(value: any): boolean | undefined {
        if (value !== "skipColumn") {
            const isExisting = this.preSelectedData.find((ele) => value === ele.name);
            if (isExisting && isExisting.name !== "skipColumn") {
                return true;
            }
            return false;
        }
        return undefined;
    }
    isIcon(index: number, value: any): boolean {
        if (this.preSelectedData[index].name !== "skipColumn" && value !== null) {
            return true;
        }
        return false;
    }
    mappingTool(error: any): void {
        this.selectedSavedMapping = "select";
        this.preSelectedData = [];
        this.savedCensusMappings = [];
        this.data = [];
        this.censusForm.controls["isContainsHeader"].setValue(false);
        this.isSavedMappings = false;
        this.mappingData = error.error;
        this.censusService
            .getSavedCensusMappings(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (res.length !== 0) {
                    this.isSavedMappings = true;
                    this.savedCensusMappings = res;
                } else {
                    this.isSavedMappings = false;
                }
            });
        let position = 0;
        this.customTypeMapping();
        this.mappingData[0].forEach((data, index) => {
            this.censusMappingFields.forEach((field) => {
                // eslint-disable-next-line sonarjs/no-collapsible-if
                if (data !== null) {
                    if (data.indexOf("(") > 0) {
                        data = data.substr(0, data.indexOf("("));
                    }
                    if (data.replace(/\s/g, "").toLowerCase() === field.value.replace(/\s/g, "").toLowerCase()) {
                        this.preSelectedData.push({
                            name: field.name,
                            value: field.value,
                            required: field.required,
                            position: position++,
                        });
                        this.isMappingDataAdded = true;
                        return;
                    }
                }
            });
            if (!this.isMappingDataAdded) {
                this.preSelectedData.push({
                    name: "skipColumn",
                    value: this.language.fetchPrimaryLanguageValue("primary.portal.common.select"),
                    required: false,
                    position: position++,
                });
            }
            this.isMappingDataAdded = false;
        });
        for (let i = 0; i < this.mappingData[0].length; i++) {
            if (this.mappingData.length === 1) {
                this.mappingData[1] = [];
                this.mappingData[1][i] = null;
            }
            if (this.mappingData.length === 2) {
                this.mappingData[2] = [];
                this.mappingData[2][i] = null;
            }
            this.data.push({
                fileRow1: this.mappingData[0][i],
                fileRow2: this.mappingData[1][i],
                fileRow3: this.mappingData[2][i],
            });
        }
        this.mappingOptions();
        this.isMappingRequired = true;
    }

    setSaveCensusMapping(census: CensusMapping): void {
        this.saveCensusMapping.fields = census.fields.map((ele) => {
            if (ele.name.includes(CUSTOM_CLASS_TYPE)) {
                const id = +ele.name.substr(ele.name.indexOf("-") + 1);
                const name = this.classTypes.find((x) => x.id === id).name;
                ele.name = name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
            }
            return ele;
        });
    }

    customTypeMapping(): void {
        const classTypes = this.censusMappingFields.map((x) => x.value.replace(/\s/g, "").toLowerCase());
        const customClassTypes = this.mappingData[0].filter((item) => {
            // eslint-disable-next-line sonarjs/no-collapsible-if
            if (item) {
                let data = item.replace(/\s/g, "").toLowerCase();
                if (data.indexOf("(") > 0) {
                    data = data.substr(0, data.indexOf("("));
                    item = item.substr(0, item.indexOf("("));
                }
                if (classTypes.indexOf(data) < 0) {
                    return item;
                }
            }
        });
        customClassTypes.forEach((elem) => {
            const censusType = {} as CensusMappingField;
            const classType = this.classTypes.find((el) => el.name.toLowerCase() === elem.toLowerCase());
            if (classType) {
                censusType.name = elem.charAt(0).toLowerCase() + elem.slice(1).replace(/\s/g, "");
                censusType.value = classType.name;
                censusType.validation = "";
                censusType.required = false;
                this.censusMappingFields.push(censusType);
            }
        });
    }

    mappingOptions(): any {
        this.mappingData[0].forEach((item, index) => {
            const dropdownFields = [...this.censusMappingFields];
            const selectedValues = this.preSelectedData.filter((selected) => selected.name !== "skipColumn");
            if (this.preSelectedData[index].name !== "skipColumn") {
                selectedValues.forEach((val) => {
                    if (val !== this.preSelectedData[index]) {
                        const value = dropdownFields.find((ele) => val.name === ele.name);
                        if (value !== undefined) {
                            dropdownFields.splice(dropdownFields.indexOf(value), 1);
                        }
                        return;
                    }
                });
            } else {
                selectedValues.forEach((val) => {
                    const value = dropdownFields.find((ele) => val.name === ele.name);
                    dropdownFields.splice(dropdownFields.indexOf(value), 1);
                    return;
                });
            }
            this.data[index].mappingFieldsGroup = [
                {
                    name: "Required",
                    mappingFields: dropdownFields.filter((el) => el.required),
                },
                {
                    name: "Optional",
                    mappingFields: dropdownFields.filter((el) => !el.required),
                },
            ];
        });
    }
    savedMapping(event: any): void {
        if (event.value === "select") {
            this.censusForm.controls["censusMapping"].enable();
            this.mappingTool(this.mappingRequired);
            return;
        }
        this.saveCensusMapping = this.savedCensusMappings.find((ele) => ele.name === this.selectedSavedMapping);
        this.setSaveCensusMapping(this.saveCensusMapping);
        if (this.saveCensusMapping !== undefined) {
            this.mappingNeeded = this.utilService.copy(this.saveCensusMapping);
            this.mappingId = this.mappingNeeded.id;
            this.preSelectedData = [...this.mappingNeeded.fields];
            if (this.mappingData[0].length > this.preSelectedData.length) {
                this.mappingData[0].forEach((ele, index) => {
                    if (index >= this.preSelectedData.length) {
                        this.preSelectedData[index] = {
                            name: "skipColumn",
                            value: this.language.fetchPrimaryLanguageValue("primary.portal.common.select"),
                            required: false,
                            position: index,
                        };
                    }
                });
            }
            this.mappingOptions();
            this.isSavedMappingSelected = true;
            this.censusForm.controls["censusMapping"].disable();
            this.isSavedMapNameChanged = false;
            this.censusForm.controls["isContainsHeader"].setValue(this.mappingNeeded.containsHeaderRow);
        }
    }

    onSave(): void {
        if (this.files.length === 0) {
            this.files = [];
            this.selectForUpload = true;
            this.isFileSelected = false;
        } else if (this.isFileUploaded) {
            this.dialogRef.close();
        } else if (this.isMappingRequired) {
            if (
                this.saveCensusMapping !== undefined &&
                this.censusForm.controls["censusMapping"].value === "" &&
                this.censusForm.controls["isContainsHeader"].value !== this.saveCensusMapping.containsHeaderRow
            ) {
                this.censusForm.controls["censusMapping"].setErrors({
                    required: true,
                });
                this.validationError = this.language.fetchSecondaryLanguageValue("secondary.portal.shared.mapping.mapNameRequired");
            } else if (this.censusForm.controls["censusMapping"].value === "" && this.isSavedMapNameChanged) {
                this.censusForm.controls["censusMapping"].setErrors({
                    required: true,
                });
                this.validationError = this.language.fetchSecondaryLanguageValue("secondary.portal.shared.mapping.mapNameRequired");
            } else {
                this.isSave = true;
                this.errorRequiredFieldMissing = false;
                this.uploadFile(this.censusFile, this.mappingId);
            }
        }
    }

    /**
     * check status of the uploaded census file
     * @param documentId represents the uploaded census file
     */
    checkUploadStatus(documentId: number): void {
        this.errorLog = [];
        this.hasError = [];
        this.isSucess = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.alertErrorMessageKey = "";
        // FIXME - THERE SHOULD NOT BE THIS MUCH LOGIC INSIDE OF A *MANUAL* SUBSCRIPTION
        this.censusSubscription = this.censusService.checkUploadStatus(documentId, this.mpGroupId).subscribe(
            (response) => {
                if (response.document.status === "FAILED") {
                    this.uploadStatus = "FAILED";
                    const intervalSubscription = interval(15).subscribe(() => {
                        this.fileUploadPercentage = this.fileUploadPercentage + 1;
                        if (this.fileUploadPercentage >= 60) {
                            intervalSubscription.unsubscribe();
                            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.uploadError.label");
                            this.uploadSuccessStatus.push("");
                            this.isSucess.push(false);
                            this.hasError.push(true);
                            if (response.errors) {
                                if (response.errors.find((errorObj) => errorObj.errorColumn.startsWith(CUSTOM_CLASS_TYPE))) {
                                    this.alertErrorMessageKey = "primary.portal.census.errorMessage.errorInvalidPEOClassName1";
                                }
                                response.errors.forEach((errorMsg) => {
                                    this.errorLanguageText = this.language.fetchPrimaryLanguageValue(
                                        "primary.portal.census.errorMessage." + errorMsg.errorMessage,
                                    );
                                    if (this.errorLanguageText !== "") {
                                        errorMsg.errorMessage = this.errorLanguageText;
                                    }
                                });
                            }
                            this.errorLog = response.errors;
                            if (this.errorLog !== undefined) {
                                this.errorLog = this.errorLog.filter(
                                    (el) => !el.errorColumn.includes(this.MEMBER_TYPE) && !el.errorColumn.includes(this.DEPENDENT_TYPE),
                                );
                                this.errorLogDataSource.data = this.errorLog;
                                this.errorLogDataSource.sort = this.matSort;
                                if (this.matPaginator) {
                                    this.errorLogDataSource.paginator = this.matPaginator;
                                    // eslint-disable-next-line no-underscore-dangle
                                    this.matPaginator._changePageSize(AppSettings.errorLogPageSizeOptions[0]);
                                    this.pageEventSubscription = this.matPaginator.page.subscribe((page: PageEvent) => {
                                        this.censusForm.controls["pageNumberControl"].setValue(page.pageIndex + 1);
                                    });
                                    this.isMappingRequired = false;
                                    this.isFileUploaded = false;
                                    this.errorLogLength = this.errorLog.length;
                                    if (this.errorLogLength > 0) {
                                        this.isErrorLog = true;
                                    }
                                }
                            }
                        }
                    });
                } else if (response.document.status === "COMPLETE") {
                    this.uploadStatus = "COMPLETE";
                    const intervalSubscription = interval(15).subscribe(() => {
                        this.fileUploadPercentage = this.fileUploadPercentage + 1;
                        if (this.fileUploadPercentage >= 99) {
                            intervalSubscription.unsubscribe();
                            this.uploadSuccessStatus.push("secondary.portal.shared.monupload.uploadsucess.subtitle");
                            this.uploadErrorStatus.push("");
                            this.isSucess.push(true);
                            this.hasError.push(false);
                            this.memberService.updateMemberList(true);
                        }
                    });
                } else if (response.document.status === "PROCESSING") {
                    this.uploadStatus = "PROCESSING";
                    if (this.censusFile.size >= AppSettings.FILE_SIZE_4MB) {
                        this.fileUploadPercentage = this.fileUploadPercentage + 3;
                    } else if (this.censusFile.size >= AppSettings.FILE_SIZE_8MB) {
                        this.fileUploadPercentage = this.fileUploadPercentage + 1;
                    } else {
                        this.fileUploadPercentage = this.fileUploadPercentage + 5;
                    }
                    if (this.fileUploadPercentage >= 100) {
                        this.fileUploadPercentage = 100;
                        this.modeProgress = "indeterminate";
                    }
                    /*
                    checkUploadStatus() API is sending three response
                     (i) Complete, (ii) Failed, (iii) Processing.
                     If we get API response as PROCESSING, we need to hit API until
                     it gives either COMPLETE or FAILED.

                     To decrease the continuous multiple hits to same API, we are hitting
                     the same API but with timeout with which we can get required response
                     with minimal API calls.
                    */
                    setTimeout(() => this.checkUploadStatus(this.documentId), 12000);
                }
            },
            (error) => {
                if (error.status === AppSettings.API_RESP_404) {
                    this.uploadErrorStatus.push("secondary.portal.shared.monUpload.file.FileNotFounderror");
                    this.isSucess.push(false);
                    this.hasError.push(true);
                }
            },
        );
    }
    // Adding this input listener because using valueChanges.subscribe throws RangeError: Maximum call stack size exceeded.
    pageInputChanged(pageNumber: string): void {
        if (this.isErrorLog && pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.matPaginator.getNumberOfPages()) {
            this.matPaginator.pageIndex = +pageNumber - 1;
            this.matPaginator.page.next({
                pageIndex: this.matPaginator.pageIndex,
                pageSize: this.matPaginator.pageSize,
                length: this.matPaginator.length,
            });
        }
    }
    cancelUpload(index: number): void {
        this.subscription.unsubscribe();
        if (this.documentId !== undefined) {
            this.censusSubscription.unsubscribe();
        } else if (this.uploadStatus === "PROCESSING") {
            this.documentService.deleteDocument(this.documentId, this.mpGroupId).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.files.splice(index, 1);
        this.uploadSuccessStatus = [];
        this.uploadErrorStatus = [];
        this.isFileSelected = false;
        this.hasError = [];
        this.isSucess = [];
        this.files = [];
        this.isUploadingStarted = false;
    }

    onNoClick(): void {
        this.dialogRef.close();
        if (this.documentId) {
            this.censusSubscription.unsubscribe();
        }
        if (this.uploadStatus === "PROCESSING") {
            this.documentService.deleteDocument(this.documentId, this.mpGroupId).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    closeForm(): void {
        this.dialogRef.close();
        if (this.documentId) {
            this.censusSubscription.unsubscribe();
        }
        if (this.uploadStatus === "PROCESSING") {
            this.documentService.deleteDocument(this.documentId, this.mpGroupId).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    ngOnDestroy(): void {
        if (this.subscription !== undefined) {
            this.subscription.unsubscribe();
        }
        if (this.censusSubscription !== undefined) {
            this.censusSubscription.unsubscribe();
        }
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}

interface ClassType {
    id?: number;
    name?: string;
    description?: string;
    determinesPayFrequency?: boolean;
    determinesPlanAvailabilityOrPricing?: boolean;
    tiedToPlan?: boolean;
    visible?: boolean;
}
