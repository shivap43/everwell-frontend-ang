import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Subject, combineLatest, Observable, Subscription, of } from "rxjs";
// TODO: MatVerticalStepper is deprecated https://material.angular.io/components/stepper/api#MatVerticalStepper
// This Component will be removed in an upcoming Angular release and receives breaking changes in Angular 13, please use MatStepper instead
import { MatStepper } from "@angular/material/stepper";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { EmpoweredModalService, FileUploadService } from "@empowered/common-services";
import { RequestChangesDialogComponent } from "./request-changes-dialog/request-changes-dialog.component";
import { takeUntil, filter, switchMap, tap, map, catchError } from "rxjs/operators";
import {
    BenefitsOfferingService,
    CoreService,
    DocumentApiService,
    AflacGroupPlanChoiceDetail,
    AflacGroupPlanPriceDetail,
    UploadDocumentType,
    MemberMappings,
    MemberTypeEnum,
    PriceOrRates,
    AflacGroupPlanRider,
    MemberTypes,
} from "@empowered/api";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { HttpErrorResponse, HttpResponse, HttpEvent, HttpEventType } from "@angular/common/http";
import { SaveAndClosePopUpComponent } from "./save-and-close-pop-up/save-and-close-pop-up.component";
import { AflacService, AflacGroupInfo, Agents, BillingAccount } from "@empowered/api";
import { MatTableDataSource } from "@angular/material/table";
import {
    SuccessResponseCode,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ConfigName,
    DateInfo,
    PlanChoice,
    PlanYearType,
    Product,
    TobaccoStatus,
    Document,
    PlanYear,
    Percentages,
} from "@empowered/constants";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ProductPricingData } from "./ag-product-price-display-list/ag-product-price-display-list.component";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum HQ_ADMIN_STEPS {
    ACCOUNT_INFO = 0,
    PRODUCT_OFFERINGS = 1,
    PLAN_BROCHURES = 2,
}
export enum ApprovalRequestActions {
    APPROVE = "APPROVE",
    DECLINE = "DECLINE",
}
export type MonUploadFileObject = File | FileContent;

interface FileContent {
    documentId?: number | string;
    modifiedName: string;
}
interface OptionsDisplay<T> {
    value: T;
    viewValue: string;
}

export interface MonUploadFileDetails {
    file: MonUploadFileObject;
    uploadErrorStatus?: string;
    uploadSuccessStatus?: string;
    isSuccess?: boolean;
    hasError?: boolean;
    isFileSelected?: boolean;
    isProgressBarEnabled?: boolean;
    isFileUploaded?: boolean;
    isUploadingStarted?: boolean;
    modeProgress?: string;
    fileUploadPercentage?: number;
    subscription?: Subscription;
    planId?: number | string;
}

const FileNameLength = {
    MAX_ALLOWED_LENGTH: 24,
    INITIAL_SUBSTRING_MIN_LENGTH: 0,
    INITIAL_SUBSTRING_MAX_LENGTH: 15,
    ENDING_SUBSTRING_LENGTH: 8,
};

enum FileUploadProgressType {
    DETERMINE = "determine",
    INDETERMINATE = "indeterminate",
}

interface ProductOfferingDataSource {
    product: Product;
    plans: PlansDisplay[];
    uploadedDocuments: number;
    templateType?: string;
}

interface PlansDisplay {
    planChoice: PlanChoice;
    planDocument: Document;
    fileDetails?: MonUploadFileDetails;
    pricingDetails?: AflacGroupPlanPriceDetail;
    aflacPlanId?: number;
}
interface TobaccoAgeRange {
    statusName: string;
    minAge: number;
    maxAge: number;
    benefitAmount: number;
    empPremium: number;
    spousePremium: number;
}
interface AgeRangeTemplate {
    tobaccoAgeRangePricing?: TobaccoAgeRange[];
    riders: AflacGroupPlanRider[];
}
interface TobaccoIndAge {
    member: string;
    tobaccoStatus: string;
    age: number;
    benefitAmount: number;
    premium: number;
}
interface PricingTemplate {
    key: string;
    value: string[];
}
interface SalaryRangeTemplate {
    minAge: number;
    maxAge: number;
    annualPrice: string;
    benefitAmount: number;
    minEligibleSalary: number;
}
const COVERAGE_LEVEL = {
    ENROLLED: "Enrolled",
    SPOUSE_COVERAGE: "Spouse Coverage",
};
const PLAN_DOCUMENT = "PLAN_DOCUMENT";
const COMPLETE = "COMPLETE";
const UNDEFINED = "UNDEFINED";
const FilterFormControlNames = {
    MEMBER_TYPE: "memberType",
    TOBACCO_STATUS: "tobaccoStatus",
    AGE: "age",
};
const MEMBER_TYPE_CHILD = "CHILD";
const PRICING_TEMPLATE = {
    TOBACCO_AGE_RANGE: 1,
    TOBACCO_INDIVIDUAL_AGE: 2,
    SALARY_RANGE: 3,
};
@Component({
    selector: "empowered-hq-admin-review-bo",
    templateUrl: "./hq-admin-review-bo.component.html",
    styleUrls: ["./hq-admin-review-bo.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class HqAdminReviewBoComponent implements OnInit, OnDestroy {
    @ViewChild("verticalStepper", { static: true }) hqAdminStepper: MatStepper;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    stepperIndex = 0;
    display = true;
    aflacGroupInfo: AflacGroupInfo;
    agentInfoSource: MatTableDataSource<Agents> = new MatTableDataSource<Agents>([]);
    billingInfoSource: MatTableDataSource<BillingAccount> = new MatTableDataSource<BillingAccount>([]);
    agentInfoColumns: string[] = ["writingAgent", "writingNumber", "agentEmail"];
    billingAccountCols: string[] = ["billingAccountNumber", "deductionRegister", "firstDeduction", "createdOn"];
    pricingCols: string[] = ["coverageLevel", "annualPrice"];
    tobaccoAgeRangeCols: string[] = ["tobaccoStatus", "age", "benefitAmount", "annualPriceEmp", "annualPriceSpouse"];
    salaryRangeCols: string[] = ["age", "minimumEligibleSalary", "benefitAmount", "annualPriceEmp"];
    completedStep = 0;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacGroup.reviewSubmit.title",
        "primary.portal.aflacGroup.reviewSubmit.label",
        "primary.portal.profile.accountInfo.title",
        "primary.portal.aflacGroup.offering.productOfferings",
        "primary.portal.aflacGroup.hqAdmin.planBrochures",
        "primary.portal.profile.accountInfo.title",
        "primary.portal.aflacgroup.carrier.generalInfo",
        "primary.portal.aflacGroup.hqAdmin.agNumber",
        "primary.portal.profile.carriers.notAvailable",
        "primary.portal.aflacGroup.hqAdmin.agFileName",
        "primary.portal.aflacgroup.carrier.employeeIDType",
        "primary.portal.aflacgroup.carrier.situsState",
        "primary.portal.aflacGroup.hqAdmin.hoursPerWeek",
        "primary.portal.aflacgroup.carrier.agentInfo",
        "primary.portal.aflacgroup.carrier.writingAgent",
        "primary.portal.aflacgroup.carrier.writingNumber",
        "primary.portal.aflacgroup.carrier.email",
        "primary.portal.aflacgroup.carrier.billingAccountInfo",
        "primary.portal.aflacgroup.carrier.billingAccountNumber",
        "primary.portal.aflacgroup.carrier.deductionRegister",
        "primary.portal.aflacgroup.carrier.firstDeduction",
        "primary.portal.aflacgroup.carrier.createdOn",
        "primary.portal.aflacgroup.carrier.locationInfo",
        "primary.portal.aflacgroup.carrier.city",
        "primary.portal.aflacgroup.carrier.primaryContact",
        "primary.portal.aflacgroup.carrier.locationCode",
        "primary.portal.aflacgroup.carrier.stateProvince",
        "primary.portal.aflacgroup.carrier.address1",
        "primary.portal.aflacgroup.carrier.address2",
        "primary.portal.aflacgroup.carrier.zipPostalCode",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.dashboard.adminApprovalChecklist.requestChanges",
        "primary.portal.aflacgroup.carrier.locationName",
        "primary.portal.common.back",
        "primary.portal.qle.addNewQle.accident",
        "primary.portal.qle.addNewQle.wholeLife",
        "primary.portal.shopQuote.label.age",
        "primary.portal.editCoverage.tobaccoStatus",
        "primary.portal.aflacGroup.offering.productNamePricing",
        "primary.portal.aflacGroup.offering.planDetails",
        "primary.portal.aflacGroup.offering.productName",
        "primary.portal.aflacGroup.offering.lblMember",
        "primary.portal.aflacGroup.offering.uploadPlan",
        "primary.portal.aflacGroup.offering.pdfFormat",
        "primary.portal.dashboard.adminApprovalChecklist.requestChanges",
        "primary.portal.aflacGroup.offering.saveAndClose",
        "primary.portal.common.placeholderSelect",
        "primary.portal.aflacGroup.ridersIncludedInCoverage",
        "primary.portal.common.submitBrochures",
        "primary.portal.common.search",
        "primary.portal.aflacGroup.offering.uploadPlanHint",
        "primary.portal.aflacGroup.offering.productSpecificPlans",
        "primary.portal.aflacGroup.offering.productSpecificPlan",
        "primary.portal.aflacGroup.offering.uploadPendingFileLength",
        "primary.portal.aflacGroup.offering.uploadedFileLength",
        "primary.portal.tpiEnrollment.coverageLevel",
        "primary.portal.aflacGroup.annualPriceAmount",
        "primary.portal.aflacGroup.clearSelections",
        "primary.portal.aflacGroup.dropdownSelectionRequired",
        "primary.portal.editCoverage.tobaccoStatus",
        "primary.portal.quickQuote.age",
        "primary.portal.agProductPrice.benefitDollar",
        "primary.portal.agProductPrice.annualPriceEmp",
        "primary.portal.agProductPrice.annualPremiumAmount",
        "primary.portal.agProductPrice.minEligibleSalary",
        "primary.portal.aflacGroup.employee",
        "primary.portal.aflacGroup.spouse",
        "primary.portal.aflacGroup.child",
        "primary.portal.members.personalLabel.tobaccoText",
        "primary.portal.members.personalLabel.nonTobaccoText",
        "primary.portal.aflacGroup.uniTobacco",
        "primary.portal.agProductPrice.spousePremium",
        "primary.portal.aflacGroup.organization",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);

    STEPPER_DATA = HQ_ADMIN_STEPS;
    mpGroup: number;
    errorMessage: string;
    planChoicesToReview: AflacGroupPlanChoiceDetail[] = [];
    productOfferingSource: ProductOfferingDataSource[] = [];
    showSpinner: boolean;
    acceptableFormats = ".pdf";
    planBrochureError: string;
    latestPlanYearAflacGroup: PlanYear;
    incompleteUploadLength = 0;
    pricingInfoTemplate: PricingTemplate[] = [];
    tobaccoAgeRangeTemplate: AgeRangeTemplate;
    tobaccoIndAgeTemplate: TobaccoIndAge[];
    tobaccoStatusFilterOptions: OptionsDisplay<string>[] = [];
    ageFilterOptions: OptionsDisplay<number>[] = [];
    MemberFilterOptions: OptionsDisplay<string>[] = [];
    tobaccoStatusDisable = true;
    memberMappings: MemberMappings[] = [];
    filtersForm: FormGroup;
    FilterFormControlNames = FilterFormControlNames;
    showFilterSelectionAlert = false;
    productPricingData: ProductPricingData[] = [];
    salaryRangeTemplate: SalaryRangeTemplate[] = [];
    readonly PRICING_TEMPLATE = {
        TOBACCO_AGE_RANGE: "TOBACCO_AGE_RANGE",
        TOBACCO_INDIVIDUAL_AGE: "TOBACCO_INDIVIDUAL_AGE",
        SALARY_RANGE: "SALARY_RANGE",
    };
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;
    // used in template
    readonly NO_OF_MONTHS = DateInfo.NUMBER_OF_MONTHS;
    readonly FRACTION_DIGIT = 2;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is instance of LanguageService
     * @param empoweredModalService is instance of EmpoweredModalService
     * @param benefitsOfferingService is instance of BenefitsOfferingService
     * @param dialogRef is matBottomSheetRef of HqAdminReviewBoComponent
     * @param coreService is instance of CoreService
     * @param mpGroupId is injected data
     * @param utilService is instance of UtilService
     * @param aflacService is instance of AflacService
     * @param documentService is instance of DocumentApiService
     * @param staticUtilService is instance of StaticUtilService
     */
    constructor(
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dialogRef: MatDialogRef<HqAdminReviewBoComponent>,
        private readonly coreService: CoreService,
        @Inject(MAT_DIALOG_DATA) private readonly mpGroupId: string,
        private readonly utilService: UtilService,
        private readonly aflacService: AflacService,
        private readonly documentService: DocumentApiService,
        private readonly staticUtilService: StaticUtilService,
        private readonly fb: FormBuilder,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
    ) {
        this.mpGroup = +this.mpGroupId;
    }
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.getConfigPricingTemplate();
        this.getPlanYearDetails();
        this.fetchRequiredInfo();
        this.loadAGInfo();
        this.getPlanDetailFilters();
        this.filtersForm = this.fb.group({
            memberType: [null],
            tobaccoStatus: [null],
            age: [null],
        });
    }
    /**
     * Method to call Aflac Group Info API
     */
    loadAGInfo(): void {
        this.aflacService
            .getAflacGroupInformation()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.aflacGroupInfo = response;
                this.agentInfoSource = new MatTableDataSource(this.aflacGroupInfo.agents);
                if (this.aflacGroupInfo.billingAccounts) {
                    this.billingInfoSource = new MatTableDataSource(this.aflacGroupInfo.billingAccounts);
                }
            });
    }
    /**
     * This method is used to fetch all the required info
     */
    fetchRequiredInfo(): void {
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
        this.showSpinner = true;
        combineLatest([this.benefitsOfferingService.getAflacGroupPlanChoicesForReview(true, this.mpGroup), this.coreService.getProducts()])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([planChoicesToReview, allProducts]) => {
                    this.planChoicesToReview = this.utilService.copy(planChoicesToReview);
                    allProducts.forEach((product) => {
                        const productSpecificPlanObject: AflacGroupPlanChoiceDetail[] = this.planChoicesToReview.filter(
                            (eachPlan) => eachPlan.planChoice.plan.productId === product.id && eachPlan.planChoice.requiredSetup,
                        );
                        if (productSpecificPlanObject.length) {
                            this.productOfferingSource.push({
                                product: product,
                                plans: productSpecificPlanObject,
                                uploadedDocuments: productSpecificPlanObject.filter((eachPlanObject) => eachPlanObject.planDocument).length,
                            });
                        }
                    });
                    this.tagPlanDocumentsToPlans();
                }),
                map(([planChoicesToReview, allProducts]) =>
                    planChoicesToReview
                        .filter((eachPlanObject) => eachPlanObject.planChoice.requiredSetup)
                        .map((eachPlanObject) => eachPlanObject.planChoice.plan.id),
                ),
                switchMap((planIds: number[]) => {
                    if (!planIds.length) {
                        this.showSpinner = false;
                    }
                    const agPricingObservable$: Observable<AflacGroupPlanPriceDetail>[] = [];
                    planIds.forEach((planId) => {
                        agPricingObservable$.push(this.benefitsOfferingService.getAflacGroupPlanDetail(planId, null, this.mpGroup));
                    });
                    return combineLatest(agPricingObservable$);
                }),
                tap((aflacGroupPricingDetails: AflacGroupPlanPriceDetail[]) => {
                    aflacGroupPricingDetails.forEach((planPricing) => {
                        this.productOfferingSource.forEach((specificProduct) => {
                            specificProduct.plans.forEach((plan) => {
                                if (plan.planChoice.plan.id === planPricing.plan.id) {
                                    plan.aflacPlanId = planPricing.aflacPlanId;
                                    if (
                                        this.pricingInfoTemplate[PRICING_TEMPLATE.TOBACCO_AGE_RANGE].value.indexOf(
                                            planPricing.productName,
                                        ) > -1
                                    ) {
                                        specificProduct.templateType = this.pricingInfoTemplate[PRICING_TEMPLATE.TOBACCO_AGE_RANGE].key;
                                        this.createAgeRangeTemplate(planPricing);
                                    } else if (
                                        this.pricingInfoTemplate[PRICING_TEMPLATE.TOBACCO_INDIVIDUAL_AGE].value.indexOf(
                                            planPricing.productName,
                                        ) > -1
                                    ) {
                                        specificProduct.templateType =
                                            this.pricingInfoTemplate[PRICING_TEMPLATE.TOBACCO_INDIVIDUAL_AGE].key;
                                    } else if (
                                        this.pricingInfoTemplate[PRICING_TEMPLATE.SALARY_RANGE].value.indexOf(planPricing.productName) > -1
                                    ) {
                                        specificProduct.templateType = this.pricingInfoTemplate[PRICING_TEMPLATE.SALARY_RANGE].key;
                                        this.arrangeSalaryRangeTableData(planPricing);
                                    } else {
                                        specificProduct.templateType = undefined;
                                        plan.pricingDetails = planPricing;
                                        if (plan.pricingDetails.riders) {
                                            plan.pricingDetails.riders.sort((rider1, rider2) =>
                                                rider1.planName.localeCompare(rider2.planName),
                                            );
                                        }
                                    }
                                }
                            });
                        });
                    });
                }),
            )
            .subscribe(
                () => {
                    this.showSpinner = false;
                },
                (error) => {
                    this.showSpinner = false;
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * This method is used to tag already uploaded plan documents to respective plans
     */
    tagPlanDocumentsToPlans(): void {
        this.productOfferingSource.forEach((productSpecificPlans) => {
            productSpecificPlans.plans.forEach((plan) => {
                if (plan.planDocument) {
                    const file: MonUploadFileObject = {
                        modifiedName: this.getFileModifiedName(plan.planDocument.fileName),
                        name: plan.planDocument.fileName,
                        documentId: plan.planDocument.id,
                    };
                    plan.fileDetails = {
                        file: file,
                        uploadErrorStatus: "",
                        uploadSuccessStatus: "secondary.portal.shared.monupload.uploadsucess.subtitle",
                        isSuccess: true,
                        hasError: false,
                    };
                }
            });
        });
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
     * This method is used to upload file and to set mon upload file details
     * @param fileToUpload is the file to upload into server
     * @param planId is the planId of the aflac group plan
     * @param planObject is the current planObject in the table
     * @param currentProductObject is the current product object in the table
     */
    validateFileAndUpload(
        fileToUpload: File,
        planId: string | number,
        planObject: PlansDisplay,
        currentProductObject: ProductOfferingDataSource,
    ): void {
        planObject.fileDetails = null;
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
        planObject.fileDetails = {
            hasError: false,
            file: file,
            isSuccess: false,
            isFileSelected: true,
            isProgressBarEnabled: true,
            isFileUploaded: false,
            isUploadingStarted: true,
            modeProgress: FileUploadProgressType.DETERMINE,
            fileUploadPercentage: Percentages.FILE_UPLOAD_MIN_PERCENTAGE,
        };
        if (fileToUpload.size > this.maxFileSizeAllowed) {
            planObject.fileDetails.isUploadingStarted = false;
            planObject.fileDetails.hasError = true;
            planObject.fileDetails.isSuccess = false;
            planObject.fileDetails.isProgressBarEnabled = false;
            planObject.fileDetails.uploadSuccessStatus = "";
            planObject.fileDetails.uploadErrorStatus = "secondary.portal.qle.pendingEnrollment.maxFileSize.error";
        } else {
            this.uploadFile(fileToUpload, planId, planObject, currentProductObject);
        }
    }

    /**
     * @description method to upload document to aws s3 using presigned url
     * @param fileToUpload file for uploading
     * @param planId is the planId of the aflac group plan
     * @param planObject is the current planObject in the table
     * @param currentProductObject is the current product object in the table
     * @returns void
     */
    uploadFile(
        fileToUpload: File,
        planId: string | number,
        planObject: PlansDisplay,
        currentProductObject: ProductOfferingDataSource,
    ): void {
        if (this.multipartFileUploadConfig) {
            planObject.fileDetails.subscription = this.processFile(fileToUpload, planId, planObject, currentProductObject).subscribe();
        } else {
            planObject.fileDetails.subscription = this.fileUploadService
                .upload(fileToUpload)
                .pipe(
                    switchMap(() => this.processFile(fileToUpload, planId, planObject, currentProductObject)),
                    catchError(() => {
                        planObject.fileDetails.isFileUploaded = false;
                        planObject.fileDetails.isUploadingStarted = false;
                        planObject.fileDetails.hasError = true;
                        planObject.fileDetails.isSuccess = false;
                        planObject.fileDetails.isProgressBarEnabled = false;
                        planObject.fileDetails.uploadSuccessStatus = "";
                        planObject.fileDetails.uploadErrorStatus = "secondary.portal.shared.monUpload.genericError";
                        currentProductObject.uploadedDocuments = this.getUploadedFileLength(currentProductObject);
                        return of(null);
                    }),
                )
                .subscribe();
        }
    }

    /**
     * @description method to process the uploaded document
     * @param file the file uploaded
     * @param planId is the planId of the aflac group plan
     * @param planObject is the current planObject in the table
     * @param currentProductObject is the current product object in the table
     * @returns Observable<void>
     */
    processFile(
        file: File,
        planId: string | number,
        planObject: PlansDisplay,
        currentProductObject: ProductOfferingDataSource,
    ): Observable<void> {
        return this.documentService
            .uploadDocument(file, this.multipartFileUploadConfig, this.mpGroup, UploadDocumentType.PLAN_BROCHURE, planId.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((events: HttpEvent<string>) => {
                    this.handleFileSuccessStatus(events, planObject, currentProductObject);
                    return of(null);
                }),
                catchError((error) => {
                    this.handleFileErrorStatus(error, planObject, currentProductObject);
                    return of(null);
                }),
            );
    }
    /**
     * This method is used to handle file upload success status
     * @param events is HttpEvent of string and used to observe http events
     * @param planObject is the current planObject in the table
     * @param currentProductObject is the current product object in the table
     */
    handleFileSuccessStatus(events: HttpEvent<string>, planObject: PlansDisplay, currentProductObject: ProductOfferingDataSource): void {
        if (events.type === HttpEventType.UploadProgress) {
            planObject.fileDetails.fileUploadPercentage = Math.round(
                (Percentages.FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total,
            );
            if (planObject.fileDetails.fileUploadPercentage === Percentages.FILE_UPLOAD_MAX_PERCENTAGE) {
                planObject.fileDetails.modeProgress = FileUploadProgressType.INDETERMINATE;
            }
        } else if (events.type === HttpEventType.Response && events.status === SuccessResponseCode.RESP_202) {
            planObject.fileDetails.isSuccess = true;
            planObject.fileDetails.hasError = false;
            planObject.fileDetails.isUploadingStarted = false;
        }
        if (events instanceof HttpResponse) {
            planObject.fileDetails.uploadErrorStatus = "";
            planObject.fileDetails.uploadSuccessStatus = "secondary.portal.shared.monupload.uploadsucess.subtitle";
            planObject.fileDetails.isFileUploaded = true;
            planObject.fileDetails.isProgressBarEnabled = false;
            currentProductObject.uploadedDocuments = this.getUploadedFileLength(currentProductObject);
        }
    }
    /**
     * This method is used to handle file upload error status
     * @param error is HttpErrorResponse
     * @param planObject is the current planObject in the table
     * @param currentProductObject is the current product object in the table
     */
    handleFileErrorStatus(error: HttpErrorResponse, planObject: PlansDisplay, currentProductObject: ProductOfferingDataSource): void {
        planObject.fileDetails.isFileUploaded = false;
        planObject.fileDetails.isUploadingStarted = false;
        planObject.fileDetails.hasError = true;
        planObject.fileDetails.isSuccess = false;
        planObject.fileDetails.isProgressBarEnabled = false;
        planObject.fileDetails.uploadSuccessStatus = "";
        let fileError = "";
        switch (error.status) {
            case ClientErrorResponseCode.RESP_413:
                fileError = "secondary.portal.qle.pendingEnrollment.maxFileSize.error";
                break;
            case ClientErrorResponseCode.RESP_415:
                fileError = "secondary.portal.qle.pendingEnrollment.fileFormat.error";
                break;
            case ClientErrorResponseCode.RESP_400:
                if (
                    error.error.details?.length &&
                    error.error.details[0].field ===
                        this.languageStrings["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                ) {
                    fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                } else {
                    fileError = "secondary.portal.qle.pendingEnrollment.fileRequired.error";
                }
                break;
            case ServerErrorResponseCode.RESP_504:
                fileError = "secondary.portal.qle.pendingEnrollment.timeout.error";
                break;
            default:
                fileError = "secondary.portal.qle.pendingEnrollment.unknown.error";
                break;
        }
        planObject.fileDetails.uploadErrorStatus = fileError;
        currentProductObject.uploadedDocuments = this.getUploadedFileLength(currentProductObject);
    }
    /**
     * This method is used to cancel file upload
     * @param index is the index of file which is coming from mon-upload component
     * @param planObject is the current planObject in the table
     */
    cancelUpload(index: number, planObject: PlansDisplay): void {
        planObject.fileDetails.subscription.unsubscribe();
        planObject.fileDetails = null;
    }

    /**
     * This method is used to navigate user to next step
     */
    onNext(): void {
        this.hqAdminStepper.linear = false;
        if (this.hqAdminStepper.selectedIndex === this.STEPPER_DATA.ACCOUNT_INFO) {
            this.completedStep = this.STEPPER_DATA.ACCOUNT_INFO;
            this.hqAdminStepper.selectedIndex = this.STEPPER_DATA.PRODUCT_OFFERINGS;
        } else if (this.hqAdminStepper.selectedIndex === this.STEPPER_DATA.PRODUCT_OFFERINGS) {
            this.completedStep = this.STEPPER_DATA.PRODUCT_OFFERINGS;
            this.hqAdminStepper.selectedIndex = this.STEPPER_DATA.PLAN_BROCHURES;
        }
        this.hqAdminStepper.linear = true;
    }
    /**
     * This method is used to navigate user to back step
     */
    onBack(): void {
        this.hqAdminStepper.linear = false;
        if (this.hqAdminStepper.selectedIndex === this.STEPPER_DATA.PRODUCT_OFFERINGS) {
            this.hqAdminStepper.selectedIndex = this.STEPPER_DATA.ACCOUNT_INFO;
        } else if (this.hqAdminStepper.selectedIndex === this.STEPPER_DATA.PLAN_BROCHURES) {
            this.hqAdminStepper.selectedIndex = this.STEPPER_DATA.PRODUCT_OFFERINGS;
        }
        this.hqAdminStepper.linear = true;
    }
    /**
     * This method will get executed on click of request changes
     */
    onRequestChanges(): void {
        this.empoweredModalService
            .openDialog(RequestChangesDialogComponent)
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((response) => response),
                switchMap((res) =>
                    this.benefitsOfferingService.respondToApprovalRequest(this.mpGroup, {
                        action: ApprovalRequestActions.DECLINE,
                        requestedChanges: res,
                    }),
                ),
            )
            .subscribe(
                (res) => {
                    this.dialogRef.close(true);
                },
                (error) => {
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * This method will execute on click of submit brochures
     */
    onSubmitBrochures(): void {
        let planLength = 0;
        let uploadedFileLength = 0;
        let uploadPendingFileLength = 0;
        this.productOfferingSource.forEach((productSpecificPlans) => {
            uploadedFileLength = this.getUploadedFileLength(productSpecificPlans, uploadedFileLength);
            planLength = planLength + productSpecificPlans.plans.length;
            uploadPendingFileLength =
                uploadPendingFileLength +
                productSpecificPlans.plans.filter((plan) => plan.fileDetails && plan.fileDetails.isUploadingStarted).length;
        });
        if (uploadPendingFileLength) {
            this.planBrochureError = this.languageStrings["primary.portal.aflacGroup.offering.uploadPendingFileLength"].replace(
                "##count##",
                String(uploadPendingFileLength),
            );
            return;
        }
        if (planLength !== uploadedFileLength) {
            this.planBrochureError = this.planBrochureError = this.languageStrings[
                "primary.portal.aflacGroup.offering.uploadedFileLength"
            ].replace("##count##", String(planLength - uploadedFileLength));
            return;
        }
        this.benefitsOfferingService
            .getAflacGroupPlanChoicesForReview(false, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((planChoice) => {
                    const planDocuments = planChoice.filter((planChoiceDocument) => planChoiceDocument.planDocument);
                    const planChoiceRequiredSetUp = planChoice.filter((planChoiceDetails) => planChoiceDetails.planChoice.requiredSetup);
                    if (
                        planDocuments.length === planChoiceRequiredSetUp.length &&
                        planDocuments.filter(
                            (eachPlanChoice) =>
                                eachPlanChoice.planDocument.type === PLAN_DOCUMENT && eachPlanChoice.planDocument.status !== COMPLETE,
                        ).length === 0
                    ) {
                        return this.benefitsOfferingService
                            .respondToApprovalRequest(this.mpGroup, {
                                action: ApprovalRequestActions.APPROVE,
                            })
                            .pipe(
                                switchMap((res) => {
                                    this.dialogRef.close(true);
                                    return of(null);
                                }),
                                catchError((error) => {
                                    this.displayDefaultError(error);
                                    return of(null);
                                }),
                            );
                    }
                    return of(null);
                }),
            )
            .subscribe();
    }
    /**
     * This method is used to get uploaded file length
     * @param productSpecificPlans is product offering data source object
     * @param uploadedFileLength is the current uploaded file length
     * @returns updated uploaded file length
     */
    getUploadedFileLength(productSpecificPlans: ProductOfferingDataSource, uploadedFileLength: number = 0): number {
        return (
            uploadedFileLength +
            productSpecificPlans.plans.filter((plan) => plan.fileDetails && plan.fileDetails.file && !plan.fileDetails.hasError).length
        );
    }
    /**
     * This method will execute on click of save and close
     * @param isSaved represents whether user clicked on save&close button or not
     */
    onSaveAndClose(isSaved: boolean = false): void {
        if (isSaved) {
            this.dialogRef.close();
        } else {
            let uploadedFileLength = 0;
            this.productOfferingSource.forEach((productSpecificPlans) => {
                uploadedFileLength = this.getUploadedFileLength(productSpecificPlans, uploadedFileLength);
            });
            if (uploadedFileLength) {
                this.empoweredModalService
                    .openDialog(SaveAndClosePopUpComponent)
                    .afterClosed()
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        filter((isSaveAndCloseClicked) => isSaveAndCloseClicked),
                    )
                    .subscribe((response) => {
                        this.dialogRef.close();
                    });
            } else {
                this.dialogRef.close();
            }
        }
    }
    /**
     * This method is used to open leave confirmation modal pop-up
     */
    leaveConfirmationModal(): void {
        this.empoweredModalService
            .openDialog(SaveAndClosePopUpComponent)
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((response) => response),
            )
            .subscribe((res) => {
                this.dialogRef.close();
            });
    }
    /**
     * Method to get aflac group plan year details
     */
    getPlanYearDetails(): void {
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false)
            .pipe(
                map((approvedPlanYears) => approvedPlanYears.filter((eachPlanYear) => eachPlanYear.type === PlanYearType.AFLAC_GROUP)),
                filter((planYears) => !!planYears),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((res) => {
                res.sort(
                    (a, b) =>
                        this.dateService.toDate(b.coveragePeriod.effectiveStarting).getTime() -
                        this.dateService.toDate(a.coveragePeriod.effectiveStarting).getTime(),
                );
                this.latestPlanYearAflacGroup = res.pop();
            });
    }
    /**
     * get pricing info template from config
     */
    getConfigPricingTemplate(): void {
        const SYMBOLS = {
            EQUAL: "=",
            COMMA: ",",
            OPEN_BRACE: "[",
            CLOSE_BRACE: "]",
            SEMICOLON: ";",
        };
        this.staticUtilService
            .cacheConfigValue(ConfigName.AFLAC_GROUP_PRICING_LAYOUT)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                const pricingInfoTemplateConfig = resp.split(SYMBOLS.SEMICOLON);
                pricingInfoTemplateConfig.forEach((template) => {
                    const templateArray = template.split(SYMBOLS.EQUAL);
                    this.pricingInfoTemplate.push({
                        key: templateArray[0],
                        value: templateArray[1].replace(SYMBOLS.OPEN_BRACE, "").replace(SYMBOLS.CLOSE_BRACE, "").split(SYMBOLS.COMMA),
                    });
                });
            });
    }
    /**
     * This function is to get filter options to be displayed for whole life product details
     */
    getPlanDetailFilters(): void {
        this.benefitsOfferingService
            .getAflacGroupPlanDetailFilters(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (data && data.length > 0) {
                    this.memberMappings = data[0].memberMappings;
                    this.mapPlanDetailFilterOptions();
                }
            });
    }
    /**
     * This function is to map options to the filter drop downs
     * @param memberType used to filter age and tobacco status based on member type selected
     */
    mapPlanDetailFilterOptions(memberType?: MemberTypeEnum): void {
        const MEMBER_MAPPING_MIN_LENGTH = 1;
        const MEMBER_TYPE_CHILD1 = 0;
        const MEMBER_TYPE_CHILD2 = 1;
        if (memberType) {
            const data = this.memberMappings.filter((optionsData) => optionsData.memberType === memberType);
            let ageMinOption = data[MEMBER_TYPE_CHILD1].ageMinOption;
            let ageMaxOption = data[MEMBER_TYPE_CHILD1].ageMaxOption;
            if (data.length > MEMBER_MAPPING_MIN_LENGTH && ageMinOption > data[MEMBER_TYPE_CHILD2].ageMinOption) {
                ageMinOption = data[MEMBER_TYPE_CHILD2].ageMinOption;
            }
            if (data.length > MEMBER_MAPPING_MIN_LENGTH && ageMaxOption < data[MEMBER_TYPE_CHILD2].ageMaxOption) {
                ageMaxOption = data[MEMBER_TYPE_CHILD2].ageMaxOption;
            }
            this.tobaccoStatusFilterOptions = [];
            if (memberType === MEMBER_TYPE_CHILD) {
                this.tobaccoStatusDisable = true;
                this.filtersForm.controls[FilterFormControlNames.TOBACCO_STATUS].patchValue(null);
            } else {
                this.tobaccoStatusDisable = false;
                this.tobaccoStatusFilterOptions = data[MEMBER_TYPE_CHILD1].tobaccoStatusOptions.map((status) => ({
                    value: status,
                    viewValue: this.fetchTobaccoStatusName(status),
                }));
            }
            this.ageFilterOptions = [];
            for (let i = ageMinOption; i <= ageMaxOption; i++) {
                this.ageFilterOptions.push({
                    value: i,
                    viewValue: i.toString(),
                });
            }
        } else {
            this.MemberFilterOptions = [];
            const uniqueMemberType = [...new Set(this.memberMappings.map((item) => item.memberType))];
            this.MemberFilterOptions = uniqueMemberType.map((data) => ({ value: data, viewValue: this.fetchMemberTypeDisplayName(data) }));
        }
    }
    /**
     * This will call the endpoint to get the prices to be displayed based on selected filters
     * @param planId of the prices being fetched
     */
    onSubmit(planId: number): void {
        const selectedMemberType = this.filtersForm.controls[FilterFormControlNames.MEMBER_TYPE].value;
        if (
            this.filtersForm.controls[FilterFormControlNames.AGE].value !== null &&
            selectedMemberType &&
            (this.tobaccoStatusDisable || this.filtersForm.controls[FilterFormControlNames.TOBACCO_STATUS].value)
        ) {
            this.showFilterSelectionAlert = false;
            this.benefitsOfferingService
                .getAflacGroupPlanDetail(planId, this.filtersForm.value, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    this.productPricingData = [];

                    this.productPricingData = (data.pricing as PriceOrRates[]).map((price) => ({
                        member: "",
                        plan: "",
                        age: "",
                        tobaccoStatus: "",
                        benefitDollar: price.benefitAmount,
                        annualPremiumAmount: (price.priceMonthly * DateInfo.NUMBER_OF_MONTHS).toFixed(this.FRACTION_DIGIT),
                    }));
                    this.productPricingData[0].member = this.fetchMemberTypeDisplayName(selectedMemberType);
                    this.productPricingData[0].tobaccoStatus =
                        selectedMemberType !== MEMBER_TYPE_CHILD
                            ? this.fetchTobaccoStatusName(this.filtersForm.controls[FilterFormControlNames.TOBACCO_STATUS].value)
                            : undefined;
                    this.productPricingData[0].age = this.filtersForm.controls[FilterFormControlNames.AGE].value;
                });
        } else {
            this.showFilterSelectionAlert = true;
        }
    }
    /**
     * To reset the selected filters and product pricing data
     */
    resetFilters(): void {
        this.productPricingData = [];
        this.filtersForm.reset();
    }
    /*
     * method to create age range template
     * @param planPricingDetails pricing details for plans
     */
    createAgeRangeTemplate(planPricingDetails: AflacGroupPlanPriceDetail): void {
        planPricingDetails.pricing.sort((pricing1, pricing2) => pricing1.minAge - pricing2.minAge);
        const pricingDetails: PriceOrRates[] = planPricingDetails.pricing;
        pricingDetails.forEach((priceDetail) => {
            if (!priceDetail.benefitAmount) {
                priceDetail.benefitAmount = 0;
            }
        });
        const tobacco = pricingDetails.filter((pricingInfo) => pricingInfo.tobaccoStatus === TobaccoStatus.TOBACCO);
        const nonTobacco = pricingDetails.filter((pricingInfo) => pricingInfo.tobaccoStatus === TobaccoStatus.NONTOBACCO);
        const uniTobacco = pricingDetails.filter((pricingInfo) => pricingInfo.tobaccoStatus === TobaccoStatus.UNDEFINED);
        const pricingDetail: TobaccoAgeRange[] = [];
        pricingDetail.push(...this.filterAgeRangeTobacco(tobacco));
        pricingDetail.push(...this.filterAgeRangeTobacco(nonTobacco));
        pricingDetail.push(...this.filterAgeRangeTobacco(uniTobacco));
        this.tobaccoAgeRangeTemplate = {
            tobaccoAgeRangePricing: pricingDetail,
            riders: planPricingDetails.riders,
        };
    }
    /**
     * create object with all tobacco status filtered data
     * @param tobaccoFilteredData filtered data as per tobacco status
     * @returns TobaccoAgeRange[] list pricing info details as per filtered tobacco status data
     */
    filterAgeRangeTobacco(tobaccoFilteredData: PriceOrRates[]): TobaccoAgeRange[] {
        const newTemplate: TobaccoAgeRange[] = [];
        tobaccoFilteredData.sort((a, b) => Number(a.benefitAmount) - Number(b.benefitAmount));
        tobaccoFilteredData.forEach((data, index) => {
            const alreadyExistedPriceIndex: number = newTemplate.findIndex(
                (ageRange) =>
                    ageRange.minAge === data.minAge && ageRange.maxAge === data.maxAge && ageRange.benefitAmount === data.benefitAmount,
            );
            if (alreadyExistedPriceIndex > -1) {
                if (!newTemplate[alreadyExistedPriceIndex].empPremium) {
                    newTemplate[alreadyExistedPriceIndex].empPremium = data.priceMonthly;
                } else {
                    newTemplate[alreadyExistedPriceIndex].spousePremium = data.priceMonthly;
                }
            } else {
                newTemplate.push(this.getNewTemplateAgeRange(data, index));
            }
        });
        return newTemplate;
    }
    /**
     * method to fetch tobacco status display name
     * @param statusValue tobacco status value
     * @returns tobacco status display name
     */
    fetchTobaccoStatusName(statusValue: string): string {
        let statusName: string;
        if (statusValue === TobaccoStatus.TOBACCO) {
            statusName = this.languageStrings["primary.portal.members.personalLabel.tobaccoText"];
        } else if (statusValue === TobaccoStatus.NONTOBACCO) {
            statusName = this.languageStrings["primary.portal.members.personalLabel.nonTobaccoText"];
        } else {
            statusName = this.languageStrings["primary.portal.aflacGroup.uniTobacco"];
        }
        return statusName;
    }
    /**
     * method to fetch member type display name
     * @param memberType member type value
     * @returns member type display name
     */
    fetchMemberTypeDisplayName(memberType: string): string {
        let memberName: string;
        switch (memberType) {
            case MemberTypes.EMPLOYEE:
                memberName = this.languageStrings["primary.portal.aflacGroup.employee"];
                break;
            case MemberTypes.SPOUSE:
                memberName = this.languageStrings["primary.portal.aflacGroup.spouse"];
                break;
            default:
                memberName = this.languageStrings["primary.portal.aflacGroup.child"];
                break;
        }
        return memberName;
    }
    /**
     * method to get the age range template
     * @param tobaccoPricing pricing details
     * returns pricing object for age range
     */
    getNewTemplateAgeRange(tobaccoPricing: PriceOrRates, index: number): TobaccoAgeRange {
        return {
            statusName: index === 0 ? this.fetchTobaccoStatusName(tobaccoPricing.tobaccoStatus) : "",
            minAge: tobaccoPricing.minAge,
            maxAge: tobaccoPricing.maxAge,
            benefitAmount: tobaccoPricing.benefitAmount,
            empPremium: tobaccoPricing.coverageLevel.name === COVERAGE_LEVEL.ENROLLED ? tobaccoPricing.priceMonthly : undefined,
            spousePremium: tobaccoPricing.coverageLevel.name === COVERAGE_LEVEL.SPOUSE_COVERAGE ? tobaccoPricing.priceMonthly : undefined,
        };
    }
    /**
     * method to arrange salary range pricing data
     * @param agPricingDetails pricing Details for salary range
     */
    arrangeSalaryRangeTableData(agPricingDetails: AflacGroupPlanPriceDetail): void {
        agPricingDetails.pricing.sort((pricing1, pricing2) => pricing1.minAge - pricing2.minAge);
        const uniqueAgeDetails: {
            minAge: number;
            maxAge: number;
        }[] = [
            ...new Set(
                agPricingDetails.pricing.map((res) =>
                    JSON.stringify({
                        minAge: res.minAge,
                        maxAge: res.maxAge,
                    }),
                ),
            ),
        ].map((eachAgeInfo) => JSON.parse(eachAgeInfo));
        uniqueAgeDetails.forEach((eachUniqueAge) => {
            const ageSpecificPriceDetails: PriceOrRates[] = agPricingDetails.pricing.filter(
                (eachPricing) => eachPricing.minAge === eachUniqueAge.minAge && eachPricing.maxAge === eachUniqueAge.maxAge,
            );
            if (ageSpecificPriceDetails && ageSpecificPriceDetails.length) {
                ageSpecificPriceDetails.sort((priceDetail1, priceDetail2) => priceDetail1.benefitAmount - priceDetail2.benefitAmount);
                this.salaryRangeTemplate.push(
                    ...ageSpecificPriceDetails.map((eachPriceDetail, index) => ({
                        minAge: index === 0 ? eachUniqueAge.minAge : undefined,
                        maxAge: index === 0 ? eachUniqueAge.maxAge : undefined,
                        annualPrice: (eachPriceDetail.priceMonthly * DateInfo.NUMBER_OF_MONTHS).toFixed(this.FRACTION_DIGIT),
                        benefitAmount: eachPriceDetail.benefitAmount,
                        minEligibleSalary: eachPriceDetail.minEligibleSalary,
                    })),
                );
            }
        });
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
