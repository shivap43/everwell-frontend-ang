/* eslint-disable max-len */
import { Component, OnInit, Input, EventEmitter, Output, ElementRef, ViewChild, OnDestroy } from "@angular/core";
import {
    CommissionSplit,
    AccountService,
    ShoppingService,
    AflacService,
    RULE_CONSTANT,
    BenefitsOfferingService,
    DefaultFor,
    SitCode,
    Carrier,
    ProducerSearch,
    Assignment,
} from "@empowered/api";
import { FormBuilder, Validators, FormGroup, FormArray, FormControl } from "@angular/forms";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { DatePipe } from "@angular/common";
import { ZeroPercentCommissionComponent, AddSingleProducerComponent, State } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { ChipData } from "@empowered/constants";
import { forkJoin, Subscription, Observable, combineLatest, of, BehaviorSubject, EMPTY } from "rxjs";
import { Store, Select } from "@ngxs/store";
import { CommissionsState, SharedState, RegexDataType, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { NgxMaskPipe } from "ngx-mask";
import { UserService } from "@empowered/user";
import { MatChipList } from "@angular/material/chips";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { tap, catchError, switchMap, filter } from "rxjs/operators";
import { AflacBusinessService } from "@empowered/api-service";
import { DuplicateSplitFoundComponent } from "../../duplicate-split-found/duplicate-split-found.component";
import { HttpErrorResponse } from "@angular/common/http";
import { CommissionSplitsService } from "../commission-splits.service";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    Permission,
    ROLE,
    CompanyCode,
    SITCode,
    WritingNumber,
    UserPermissionList,
    AppSettings,
    EnrollmentMethod,
    Product,
    ProductOffering,
    ProducerCredential,
    CarrierId,
} from "@empowered/constants";
import { ProducerDetail } from "./add-update-customized-split.model";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

interface RuleListType {
    id: number;
    name: string;
}

interface ProducerIdName {
    id: number;
    name: string;
}

const NUMBER_OF_ENTRIES_TO_REMOVE = 1;
const DIRECT_PRIMARY_PRODUCER_INDEX = 0;
const INITIAL_PERCENTAGE = "100";
const DEFAULT_PERCENTAGE = "0";

@Component({
    selector: "empowered-add-update-custmized-split",
    templateUrl: "./add-update-custmized-split.component.html",
    styleUrls: ["./add-update-custmized-split.component.scss"],
})
export class AddUpdateCustmizedSplitComponent implements OnInit, OnDestroy {
    @Input() commissionSplit: CommissionSplit;
    @Input() operation: string;
    @Input() totalProducerList: ProducerSearch[];
    @Input() stateList: State[];
    @Input() index: number;
    @Input() companyCode: string;
    @Input() sitCodes: SITCode[];
    @Input() userCompanycode: string;
    @Input() nonEligibleCarriersForSplit: number[];
    @Output() cancelEditCustmizedSplit: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild("auto") matAutocomplete: MatAutocomplete;
    @ViewChild("enrollmentMethodInput") enrollmentMethodInput: ElementRef<HTMLInputElement>;
    @ViewChild("carrierInput") carrierInput: ElementRef<HTMLInputElement>;
    @ViewChild("statesInput") statesInput: ElementRef<HTMLInputElement>;
    @ViewChild("productInput") productInput: ElementRef<HTMLInputElement>;
    @ViewChild("producerInput") producerInput: ElementRef<HTMLInputElement>;
    @ViewChild("chipListProducer") chipListProducer: MatChipList;
    @ViewChild("chipListProduct") chipListProduct: MatChipList;
    @ViewChild("chipListStates") chipListStates: MatChipList;
    @ViewChild("chipListCarrier") chipListCarrier: MatChipList;
    @ViewChild("chipListEnrollmentMethod") chipListEnrollmentMethod: MatChipList;
    // Rules
    hideInfoIcon = true;
    producerRulesDDData: RuleListType[] = [];
    producerRulesSelectedData: any[] = [];
    productRulesDDData: RuleListType[] = [];
    productRulesSelectedData: any[] = [];
    statesRulesDDData: any[];
    statesRulesSelectedData: any[] = [];
    carrierRulesDDData: any[];
    carrierRulesSelectedData: any[] = [];
    enrollMethodRulesDDData: any = [];
    enrollMethodRulesSelectedData: any[] = [];
    dateWrittenSelectedData: any;

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    rulesList: any[];
    mpGroup: any;
    percentageDropdown: any = [];
    list: string[] = [];
    addUpdateCustomizedSplitForm: FormGroup;
    enrollmentMethodList: { [key: string]: string };
    producersList: ProducerDetail[] = [];
    ruleTypeSelectedlist: any[] = [];
    isDefault: boolean;
    isConversionSplit: boolean;
    isPartnerCarrierSplit: boolean;
    errorMessage: string;
    hasError = false;
    showDuplicateAssigmentError = false;
    duplicateWritingNumber = false;
    splitCompanyCode: string;
    customCompanyCode: string;
    ERROR = "error";
    DETAILS = "details";
    errorMessageArray = [];
    languageStrings: Record<string, string>;
    secondaryLanguageStrings: Record<string, string>;
    CONTROLS = "controls";
    INVALID = "INVALID";
    SELECT = "SELECT";
    REMOVE = "REMOVE";
    opertionType = {
        ADD: "ADD",
        EDIT: "EDIT",
    };
    ruleControlList = {
        RULES: "rules",
        PRODUCER_ID: "producerId",
        PRODUCT_ID: "productId",
        STATES: "states",
        DATE_WRITTEN: "dateWritten",
        CARRIER_ID: "carrierId",
        ENROLLMENT_METHOD: "enrollmentMethod",
        WRITTEN: "written",
        EFFECTIVE_STARTING: "effectiveStarting",
    };
    assignmentControlList = {
        ASSIGNMENTS: "assignments",
        PRODUCER_ID: "producerId",
        WRITING_NUMBER: "writingNumber",
        PERCENTAGE: "percentage",
        SITE_CODE: "sitCode",
        SITCodeHierarchyList: "SITCodeHierarchyList",
    };
    companyCodes = {
        NY: CompanyCode.NY,
        US: CompanyCode.US,
    };
    SITCodeHierarchyList = "";
    isSpinnerLoading = false;
    roleTypes: any[];
    isDirect: boolean;
    loggedInProducerId: number;
    subscriber: Subscription[] = [];
    totalProducts: Product[] = [];
    enableSitCodeHierarchy: boolean;
    selfEnrollmentFlag = false;
    carriersList: Carrier[];
    DUPLICATE_CHECK_ENABLE_CONFIG = "broker.commission_split.duplicate_check_enable";
    duplicateCheckEnabledConfig = false;
    isCommissionSplitReplaced = false;
    isEfinancialAgent = false; // Same variable used for Stride Life Quote and Clearlink Call Centres

    RADIX_TEN = 10;
    todayDate = new Date();
    defaultFor: DefaultFor;
    writingNumberOptions: WritingNumber[][] = [];
    sitCodeOptions: SitCode[][] = [];
    hasDirectAccountPermission: boolean;
    MAX_PRODUCERS = 4;
    MAX_RULES = 6;
    private readonly allStatesSubject$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    allStates$: Observable<ChipData[]> = this.allStatesSubject$.asObservable();
    initialStateValues: string[] = [];
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    constructor(
        private readonly fb: FormBuilder,
        private readonly accountService: AccountService,
        private readonly datePipe: DatePipe,
        private readonly shoppingService: ShoppingService,
        private readonly aflac: AflacService,
        private readonly langService: LanguageService,
        private readonly store: Store,
        private readonly maskPipe: NgxMaskPipe,
        private readonly dialog: MatDialog,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
        private readonly benefitsOffereingService: BenefitsOfferingService,
        private readonly aflacBusinessService: AflacBusinessService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly commissionSplitsService: CommissionSplitsService,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
    ) {}
    /**
     * fetch config,permissions,language and value from store
     * Set form data
     */
    ngOnInit(): void {
        this.subscriber.push(
            this.regex$
                .pipe(
                    filter((regex) => regex !== null),
                    tap((regex) => (this.validationRegex = regex)),
                )
                .subscribe(),
        );
        this.initializeForm();

        this.subscriber.push(
            this.staticUtilService.cacheConfigEnabled(this.DUPLICATE_CHECK_ENABLE_CONFIG).subscribe((response) => {
                this.duplicateCheckEnabledConfig = response;
            }),
        );
        this.ruleTypeSelectedlist = [];
        this.subscriber.push(
            this.sharedService
                .checkAgentSelfEnrolled()
                .pipe(
                    tap((response) => {
                        this.selfEnrollmentFlag = response;
                    }),
                )
                .subscribe(),
        );
        this.getLanguageStrings();
        this.loadEnrollmentMethods();
        this.subscriber.push(
            combineLatest([
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_E_FINANCE),
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_CLEAR_LINK),
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_STRIDE_LIFE_QUOTE),
                this.staticUtilService.hasPermission(Permission.READ_ACCOUNT_DIRECT_ALWAYS),
            ]).subscribe(
                ([aflacEFinance, aflacClearLink, aflacStrideLifeQuote, directAccountPermission]: [boolean, boolean, boolean, boolean]) => {
                    if (aflacEFinance || aflacClearLink || aflacStrideLifeQuote) {
                        this.isEfinancialAgent = true;
                    }
                    this.hasDirectAccountPermission = directAccountPermission;
                },
            ),
        );
        this.subscriber.push(
            this.staticUtilService
                .cacheConfigEnabled("general.enable.sit_code.hierarchy")
                .pipe(
                    tap((enableSitCodeHierarchy) => {
                        this.enableSitCodeHierarchy = enableSitCodeHierarchy;
                    }),
                )
                .subscribe(),
        );
        this.mpGroup = this.store.selectSnapshot(CommissionsState.groupId);
        this.isDirect = this.store.selectSnapshot(CommissionsState.isDirect);
        this.isDefault = this.commissionSplit.isDefault;
        this.isConversionSplit = this.commissionSplit.conversion;
        this.defaultFor = this.commissionSplit.defaultFor;
        this.isPartnerCarrierSplit = this.commissionSplit.isPartnerCarrierSplit;

        this.splitCompanyCode = this.commissionSplit["splitCompanyCode"];
        if (this.operation === this.opertionType.EDIT) {
            this.customCompanyCode = this.splitCompanyCode;
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else if (this.operation === this.opertionType.ADD) {
            if (this.isDirect) {
                this.customCompanyCode = this.companyCodes.US;
            } else {
                this.customCompanyCode = this.companyCode;
            }
        }

        this.statesRulesDDData =
            this.customCompanyCode === CompanyCode.US ? this.stateList.filter((x) => x.abbreviation !== CompanyCode.NY) : this.stateList;
        this.loadDropdownData();
        this.retrieveProducerList(this.totalProducerList);

        this.getPercentage();
        this.loadRulesList();
        this.subscriber.push(
            this.userService.credential$
                .pipe(filter((credential) => credential["producerId"]))
                .subscribe((credential: ProducerCredential) => {
                    this.loggedInProducerId = credential.producerId;
                    if (this.operation === this.opertionType.EDIT) {
                        this.patchForm();
                    } else if (this.operation === this.opertionType.ADD) {
                        if (
                            this.isDirect &&
                            (!this.hasDirectAccountPermission || this.isPrimaryProducer(this.loggedInProducerId.toString()))
                        ) {
                            this.addDefaultPrimaryProducerDirect();
                        } else {
                            this.addMultipleProducers();
                        }
                        this.addRules();
                        this.setInitialPercentage();
                    }
                }),
        );
        if (this.selfEnrollmentFlag) {
            this.addUpdateCustomizedSplitForm
                .get(this.ruleControlList.RULES)
                [this.CONTROLS][0].get(this.ruleControlList.PRODUCER_ID)
                .patchValue(this.loggedInProducerId);
        }
        this.roleTypes = [
            {
                name: this.languageStrings["primary.portal.commission.producer.role.primaryProducer"],
                id: ROLE.PRIMARY_PRODUCER,
            },
            {
                name: this.languageStrings["primary.portal.commission.producer.role.writingProducer"],
                id: ROLE.WRITING_PRODUCER,
            },
            {
                name: this.languageStrings["primary.portal.commission.producer.role.enroller"],
                id: ROLE.ENROLLER,
            },
        ];

        this.subscriber.push(
            this.commissionSplitsService.action$.subscribe((actionObject) => {
                this.isCommissionSplitReplaced = actionObject;
            }),
        );
    }

    /**
     * Initialize the form group
     */
    initializeForm(): void {
        this.addUpdateCustomizedSplitForm = this.fb.group({
            name: [
                "",
                Validators.compose([
                    Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC_SPECIAL_CHARACTERS)),
                    Validators.maxLength(AppSettings.MAX_LENGTH_200),
                    Validators.required,
                ]),
            ],
            assignments: this.fb.array([], Validators.maxLength(this.MAX_PRODUCERS)),
            rules: this.fb.array([], Validators.maxLength(this.MAX_RULES)),
        });
        this.subscriber.push(
            this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS).valueChanges.subscribe((result) => {
                this.errorMessage = null;
                this.showDuplicateAssigmentError = false;
                this.checkTotalPercentage();
            }),
        );
        this.subscriber.push(
            this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES).statusChanges.subscribe((status) => {
                this.checkErrorState();
            }),
        );
    }

    checkErrorState(): void {
        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        for (const control of rules.controls) {
            const type = control.value.type;
            if (type) {
                if (type === RULE_CONSTANT.WRITING_PRODUCER && this.chipListProducer) {
                    this.chipListProducer.errorState = control.status === this.INVALID;
                    control[this.CONTROLS].producerId.touched = true;
                } else if (type === RULE_CONSTANT.PRODUCT && this.chipListProduct) {
                    this.chipListProduct.errorState = control.status === this.INVALID;
                    control[this.CONTROLS].productId.touched = true;
                } else if (type === RULE_CONSTANT.CARRIER && this.chipListCarrier) {
                    this.chipListCarrier.errorState = control.status === this.INVALID;
                    control[this.CONTROLS].carrierId.touched = true;
                } else if (type === RULE_CONSTANT.STATES && this.chipListStates) {
                    this.chipListStates.errorState = control.status === this.INVALID;
                    control[this.CONTROLS].states.touched = true;
                } else if (type === RULE_CONSTANT.ENROLLMENT_METHOD && this.chipListEnrollmentMethod) {
                    this.chipListEnrollmentMethod.errorState = control.status === this.INVALID;
                    control[this.CONTROLS].enrollmentMethod.touched = true;
                }
            }
        }
    }
    isPrimaryProducer(producerId: string): boolean {
        return (
            this.totalProducerList.filter(
                (producer) => producer.role === ROLE.PRIMARY_PRODUCER && producer.producer.id.toString() === producerId,
            ).length > 0
        );
    }
    /**
     * Set default split producer to first row.
     * @param assignmentsList assignments for split
     * @param producerId default producer id
     * @returns sorted assignments
     */
    setDefaultSplitToFirst(assignmentsList: Assignment[], producerId: number): Assignment[] {
        const list: Assignment[] = [];
        assignmentsList.forEach((element) => {
            if (element.producer.producerId === producerId) {
                list.unshift(element);
            } else {
                list.push(element);
            }
        });
        return list;
    }
    /**
     * Patch commission splits list to form controls to display splits.
     * @returns void
     */
    patchForm(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias, no-underscore-dangle
        const _this = this;
        const assignments = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        if (this.commissionSplit.isDefault) {
            this.commissionSplit.assignments = this.setDefaultSplitToFirst(
                this.commissionSplit.assignments,
                this.commissionSplit.defaultFor.producerId,
            );
        }
        this.commissionSplit.assignments.forEach((element, index) => {
            const producerId = element.producer.producerId.toString();
            element[this.assignmentControlList.PRODUCER_ID] = producerId;
            const writingNumber = _this.getWritingNumberBySitCode(element.producer.producerId.toString(), element.sitCodeId);
            element[this.assignmentControlList.WRITING_NUMBER] = writingNumber;
            element[this.assignmentControlList.PERCENTAGE] = element.percent.toString();
            element[this.assignmentControlList.SITE_CODE] = writingNumber ? element.sitCodeId.toString() : undefined;
            if (this.commissionSplit.repairRequired && this.commissionSplit.orphaned) {
                element[this.assignmentControlList.WRITING_NUMBER] = undefined;
                element[this.assignmentControlList.SITE_CODE] = undefined;
            }
            this.loadSitCodeHierarchy(index, element.sitCodeId);
            this.writingNumberOptions[index] = this.getWritingNumbersByProducerId(producerId);
            this.sitCodeOptions[index] = this.getSitCodesByWritingNumberProducerId(producerId, writingNumber);
            assignments.push(
                _this.fb.group({
                    percentage: [],
                    producerId: [
                        { value: "", disabled: index === 0 ? this.checkForDisableProducerFlag(producerId) : false },
                        Validators.required,
                    ],
                    writingNumber: ["", Validators.required],
                    sitCode: ["", Validators.required],
                    SITCodeHierarchyList: [""],
                }),
            );
        });

        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        let indexCount = 0;
        this.commissionSplit.rules.forEach((element) => {
            if (!(_this.isDirect && element.type === RULE_CONSTANT.WRITING_PRODUCER)) {
                _this.updateRuleSelectionList();
                if (element.type === RULE_CONSTANT.CARRIER) {
                    _this.carrierRulesSelectedData.push({
                        id: element[this.ruleControlList.CARRIER_ID],
                        name: element["name"],
                    });
                }
                if (element.type === RULE_CONSTANT.ENROLLMENT_METHOD) {
                    _this.enrollMethodRulesSelectedData.push(element["enrollmentMethod"]);
                }

                if (element.type === RULE_CONSTANT.WRITING_PRODUCER) {
                    _this.producerRulesSelectedData.push({
                        id: element[this.ruleControlList.PRODUCER_ID],
                        name: element["name"],
                    });
                }
                if (element.type === RULE_CONSTANT.DATE_WRITTEN) {
                    element[this.ruleControlList.DATE_WRITTEN] =
                        element[this.ruleControlList.WRITTEN][this.ruleControlList.EFFECTIVE_STARTING];
                    this.dateWrittenSelectedData = element[this.ruleControlList.DATE_WRITTEN];
                }
                if (element.type === RULE_CONSTANT.STATES) {
                    element[this.ruleControlList.STATES].forEach((item) => {
                        const state = _this.statesRulesDDData.find((x) => x.abbreviation === item);
                        if (state) {
                            _this.statesRulesSelectedData.push(state);
                        }
                    });
                    this.initStateRuleChipSelect(
                        this.statesRulesDDData
                            .filter((state) => element.states && element.states.includes(state.abbreviation))
                            .map((state) => ({ name: state.name, value: state.abbreviation })),
                    );
                }
                if (element.type === RULE_CONSTANT.PRODUCT) {
                    _this.productRulesSelectedData.push({
                        id: element[this.ruleControlList.PRODUCT_ID],
                        name: element["name"],
                    });
                }
                if (!rules.value.find((x) => x.type === element.type)) {
                    const ruleList = [...this.rulesList];
                    if (this.isDirect) {
                        ruleList.shift();
                    }
                    if (this.customCompanyCode === CompanyCode.NY) {
                        const stateType = ruleList.find((x) => x.type === RULE_CONSTANT.STATES);
                        const index = ruleList.indexOf(stateType);
                        ruleList.splice(index, 1);
                    }
                    rules.push(
                        _this.fb.group(
                            {
                                name: [""],
                                producerId: [""],
                                type: [element.type],
                                enrollmentMethod: [""],
                                carrierId: [""],
                                dateWritten: [this.dateWrittenSelectedData],
                                states: [""],
                                productId: [""],
                                ruleList: [ruleList],
                            },
                            { updateOn: "blur" },
                        ),
                    );
                    this.requiredFields(indexCount, element.type);
                    this.onRuleSelectionChange(indexCount, element.type);
                    indexCount++;
                    if (!this.ruleTypeSelectedlist.find((x) => x === element.type)) {
                        this.ruleTypeSelectedlist.push(element.type);
                    }
                }
            }
        });
        this.addUpdateCustomizedSplitForm.get("name").patchValue(this.commissionSplit.name);
        this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS).patchValue(this.commissionSplit.assignments);
        this.setProducerRulesData();
        this.checkErrorState();
        this.validateAllFormFields(this.addUpdateCustomizedSplitForm);
        this.checkTotalPercentage();
    }
    /**
     * Function is for checking flag to disable the producer field
     * @param producerId producer id of split
     * @returns flag to disabling the producer field
     */
    checkForDisableProducerFlag(producerId: string): boolean {
        return this.isPartnerCarrierSplit
            ? false
            : (this.isDefault && producerId === this.defaultFor.producerId.toString()) || this.isConversionSplit;
    }
    /**
     * Function is for fetching primary and secondary language values
     * @returns void
     */
    getLanguageStrings(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.commissionSplit.addUpdate.ruleWritingProducer",
            "primary.portal.commissionSplit.addUpdate.ruleProduct",
            "primary.portal.commissionSplit.addUpdate.ruleState",
            "primary.portal.commissionSplit.addUpdate.ruleDate",
            "primary.portal.commissionSplit.addUpdate.ruleCarrier",
            "primary.portal.commissionSplit.addUpdate.ruleEnrollMethod",
            "primary.portal.commissionSplit.commission.RemoveTitle",
            "primary.portal.commissionSplit.addUpdate.noHierarchyError",
            "primary.portal.commissionSplit.addUpdate.splitName",
            "primary.portal.commissionSplit.addUpdate.column.producer",
            "primary.portal.commissionSplit.addUpdate.column.percentage",
            "primary.portal.commissionSplit.addUpdate.column.writingNumber",
            "primary.portal.commissionSplit.addUpdate.column.sitCode",
            "primary.portal.commissionSplit.addUpdate.splitSection",
            "primary.portal.commissionSplit.addUpdate.selectOption",
            "primary.portal.commissionSplit.addUpdate.inviteCoProducer",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
            "primary.portal.common.save",
            "primary.portal.common.close",
            "primary.portal.common.and",
            "primary.portal.commissionSplit.addUpdate.addCoProducer",
            "primary.portal.commissionSplit.addUpdate.appliedWhenSection",
            "primary.portal.commissionSplit.addUpdate.appliedWhenDescription",
            "primary.portal.commissionSplit.addUpdate.andLabel",
            "primary.portal.commissionSplit.addUpdate.isLabel",
            "primary.portal.commissionSplit.addUpdate.addRule",
            "primary.portal.commissionSplit.addUpdate.defaultSplitRuleMessage",
            "primary.portal.commissionSplit.addUpdate.duplicateError",
            "primary.portal.commissionSplit.addUpdate.duplicateWritingNumber",
            "primary.portal.commission.producer.role.primaryProducer",
            "primary.portal.commission.producer.role.writingProducer",
            "primary.portal.commission.producer.role.enroller",
            "primary.portal.commissionSplit.commission.anyExcept",
            "primary.portal.commissionSplit.addUpdate.partnerCarrier.defaultSplitRuleMessage",
            "primary.portal.enrollmentMethod.faceToFaceText",
            "primary.portal.enrollmentMethod.callCenterText",
            "primary.portal.enrollmentMethod.headsetText",
            "primary.portal.enrollmentMethod.selfServiceText",
            "primary.portal.enrollmentMethod.virtualFaceToFaceText",
            "primary.portal.commissionSplit.addUpdate.maxProducerInSplitError",
            "primary.portal.members.document.note.reqAlphaNumeric",
        ]);
        this.secondaryLanguageStrings = this.langService.fetchSecondaryLanguageValues([
            "secondary.portal.commissionSplit.addUpdate.percentMustBe100",
        ]);
    }

    getPercentage(): void {
        for (let i = 0; i <= 100; i = i + 10) {
            this.percentageDropdown.push(i);
        }
    }

    onCompanyCodeChange(value: string): void {
        this.customCompanyCode = value;
        this.afterCompanyCodeChange();
    }

    /**
     * function called when new Company Code is changed in UI
     * @returns void
     */
    afterCompanyCodeChange(): void {
        this.statesRulesDDData =
            this.customCompanyCode === CompanyCode.US ? this.stateList.filter((x) => x.abbreviation !== CompanyCode.NY) : this.stateList;

        this.retrieveProducerList(this.totalProducerList);

        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        for (const control of rules.controls) {
            const ruleListControl = control["controls"]["ruleList"] as FormControl;
            const ruleList = [...this.rulesList];
            if (this.isDirect) {
                ruleList.shift();
            }
            if (this.customCompanyCode === CompanyCode.NY) {
                const stateType = ruleList.find((x) => x.type === RULE_CONSTANT.STATES);
                const index = ruleList.indexOf(stateType);
                ruleList.splice(index, 1);
            }
            ruleListControl.setValue(ruleList);
        }
        if (this.isDirect) {
            const assignments = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
            assignments.controls.forEach((assignment, assignmentIndex) => {
                const producerId = assignment[this.CONTROLS][this.assignmentControlList.PRODUCER_ID].value;
                assignment[this.CONTROLS][this.assignmentControlList.WRITING_NUMBER].reset();
                if (producerId && producerId !== "") {
                    this.loadWritingNumber(assignmentIndex, producerId);
                }
            });
        }
    }
    getDisplayTextOfStates(abbreviation: string): string | undefined {
        const state = this.stateList.find((x) => x.abbreviation === abbreviation);
        if (state && state.name) {
            return state.name;
        }
        return undefined;
    }
    /**
     * Function is for adding default primary producer in commission split assignments for direct
     * After adding check for writing number.
     * @returns void
     */
    addDefaultPrimaryProducerDirect(): void {
        const loggedInProducerId = this.loggedInProducerId.toString();
        const assignments = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        assignments.push(
            this.fb.group({
                percentage: ["", Validators.required],
                producerId: [{ value: loggedInProducerId, disabled: true }, Validators.required],
                writingNumber: ["", Validators.required],
                sitCode: ["", Validators.required],
                SITCodeHierarchyList: [""],
            }),
        );
        this.loadWritingNumber(DIRECT_PRIMARY_PRODUCER_INDEX, loggedInProducerId);
    }
    addMultipleProducers(): void {
        const assignments = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        assignments.push(
            this.fb.group({
                percentage: ["", Validators.required],
                producerId: ["", Validators.required],
                writingNumber: ["", Validators.required],
                sitCode: ["", Validators.required],
                SITCodeHierarchyList: [""],
            }),
        );
    }
    /**
     * Set initial percentage as 100
     */
    setInitialPercentage(): void {
        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][0].get(this.assignmentControlList.PERCENTAGE)
            .setValue(INITIAL_PERCENTAGE);
    }

    /**
     * function to remove producer added for the split, corresponding writing numbers and sit codes
     * @param index: number, index of the producer to be removed
     * @returns void
     */
    removeMultipleProducer(index: number): void {
        const producers = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        producers.removeAt(index);
        this.writingNumberOptions.splice(index, NUMBER_OF_ENTRIES_TO_REMOVE);
        this.sitCodeOptions.splice(index, NUMBER_OF_ENTRIES_TO_REMOVE);
        this.producerRulesSelectedData = [];
        this.setProducerRulesData();
        this.checkTotalPercentage();
        this.checkForDuplicateWritingNumber();
    }
    addRules(): void {
        this.updateRuleSelectionList();
        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        const ruleList = [...this.rulesList];
        if (this.isDirect) {
            ruleList.shift();
        }
        if (this.customCompanyCode === CompanyCode.NY) {
            const stateType = ruleList.find((x) => x.type === RULE_CONSTANT.STATES);
            const index = ruleList.indexOf(stateType);
            ruleList.splice(index, 1);
        }
        rules.push(
            this.fb.group(
                {
                    name: [""],
                    producerId: [""],
                    type: [""],
                    enrollmentMethod: [""],
                    carrierId: [""],
                    dateWritten: [""],
                    states: [""],
                    productId: [""],
                    ruleList: [ruleList],
                },
                { updateOn: "blur" },
            ),
        );
        this.initStateRuleChipSelect();
    }

    resetAddForm(): void {
        this.ruleTypeSelectedlist = [];
        this.addUpdateCustomizedSplitForm.reset();
        this.addUpdateCustomizedSplitForm.markAsPristine();
        this.addUpdateCustomizedSplitForm.markAsUntouched();
        this.addUpdateCustomizedSplitForm.updateValueAndValidity();
    }

    /**
     * Operations needs to perform on Cancel button click
     */
    onCancel(): void {
        if (this.operation === this.opertionType.ADD) {
            this.resetAddForm();
            this.initializeForm();
            this.addMultipleProducers();
            this.addRules();
            this.setInitialPercentage();
        }
        this.ruleTypeSelectedlist = [];
        this.cancelEditCustmizedSplit.emit({ index: this.index, operation: this.operation });
    }
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field) as FormControl;
            this.validateControl(control);
        });
        this.markFormGroupTouched(this.addUpdateCustomizedSplitForm);
        this.addUpdateCustomizedSplitForm.updateValueAndValidity();
    }
    markFormGroupTouched(formGroup: FormGroup): void {
        (Object as any).values(formGroup.controls).forEach((control) => {
            control.markAsTouched();
            if (control.controls) {
                this.markFormGroupTouched(control);
            }
        });
    }
    validateControl(formControl: FormControl): void {
        if (formControl[this.CONTROLS]) {
            for (const subField in formControl[this.CONTROLS]) {
                if (subField) {
                    const control = formControl[this.CONTROLS][subField] as FormControl;
                    control.markAsTouched({ onlySelf: true });
                    this.validateControl(control);
                }
            }
        } else {
            formControl.markAsTouched({ onlySelf: true });
        }
    }
    /**
     * This function will open a pop to Display a warning message for 0/100 commission
     */
    openZeroPercentCommissionForm(): void {
        this.subscriber.push(
            this.empoweredModalService
                .openDialog(ZeroPercentCommissionComponent)
                .afterClosed()
                .pipe(filter((result) => result))
                .subscribe(() => {
                    this.onSubmit();
                }),
        );
    }

    /**
     * This function will calls  openZeroPercentCommissionForm method
     * if writing producer gets 0% commission otherwise onsubmit method will called
     */
    checkValidity(): void {
        this.chipTouched();
        this.checkTotalPercentage();
        if (this.addUpdateCustomizedSplitForm.valid && !this.duplicateWritingNumber) {
            const editCustomizedSplitValues = this.addUpdateCustomizedSplitForm.getRawValue();
            if (
                editCustomizedSplitValues.assignments.some(
                    (split) =>
                        split.percentage === "0" &&
                        (!this.producerRulesSelectedData.length ||
                            this.producerRulesSelectedData?.some((producer) => producer.id === +split.producerId)),
                )
            ) {
                this.openZeroPercentCommissionForm();
            } else {
                this.onSubmit();
            }
        } else {
            this.validateAllFormFields(this.addUpdateCustomizedSplitForm);
            this.checkErrorState();
        }
    }
    /**
     * function called when new customized commission split added.
     * add new commission split
     * or updated an existing one
     * new popup added if duplicate entry is made
     * @returns void
     */
    onSubmit(): void {
        let duplicateAssignementFlag = false;
        this.isSpinnerLoading = true;
        const editCustomizedSplitValues = this.addUpdateCustomizedSplitForm.getRawValue();
        const assignments = [];
        const assignmentsList = [];
        editCustomizedSplitValues.assignments.forEach((element) => {
            let producer: DefaultFor;
            if (element.producerId) {
                const assignmentDetails = {
                    producerId: parseInt(element.producerId, 10),
                    sitCodeId: parseInt(element.sitCode, 10),
                };
                const isDuplicate = assignmentsList.find(
                    (x) => x.sitCodeId === assignmentDetails.sitCodeId && x.producerId === assignmentDetails.producerId,
                );
                producer = {
                    producerId: element.producerId,
                    name: this.getProducerName(element.producerId),
                };
                if (!isDuplicate) {
                    assignments.push({
                        producer: producer,
                        sitCodeId: parseInt(element.sitCode, 10),
                        percent: parseFloat(element.percentage),
                    });
                    assignmentsList.push(assignmentDetails);
                } else {
                    duplicateAssignementFlag = true;
                }
            }
        });
        const rules = [];
        editCustomizedSplitValues.rules.forEach((element) => {
            if (element.type) {
                switch (element.type) {
                    case RULE_CONSTANT.ENROLLMENT_METHOD:
                        this.enrollMethodRulesSelectedData.forEach((item) => {
                            rules.push({
                                type: element.type,
                                enrollmentMethod: item,
                            });
                        });
                        break;
                    case RULE_CONSTANT.CARRIER:
                        this.carrierRulesSelectedData.forEach((item) => {
                            rules.push({
                                type: element.type,
                                carrierId: parseInt(item.id, 10),
                            });
                        });
                        break;
                    case RULE_CONSTANT.STATES:
                        rules.push({
                            type: element.type,
                            states: this.statesRulesSelectedData.map((x) => x.abbreviation),
                        });
                        break;
                    case RULE_CONSTANT.PRODUCT:
                        this.productRulesSelectedData.forEach((item) => {
                            rules.push({
                                type: element.type,
                                productId: parseInt(item.id, 10),
                            });
                        });
                        break;
                    case RULE_CONSTANT.WRITING_PRODUCER:
                        this.producerRulesSelectedData.forEach((item) => {
                            rules.push({
                                type: element.type,
                                producerId: parseInt(item.id, 10),
                            });
                        });
                        break;
                    case RULE_CONSTANT.DATE_WRITTEN:
                        rules.push({
                            type: element.type,
                            written: {
                                effectiveStarting: this.datePipe.transform(this.dateWrittenSelectedData, AppSettings.DATE_FORMAT),
                            },
                        });
                        break;
                }
            }
        });
        if (!this.isDefault && !this.producerRulesSelectedData.length) {
            assignments.forEach((item) => {
                rules.push({
                    type: RULE_CONSTANT.WRITING_PRODUCER,
                    producerId: parseInt(item.producer.producerId, this.RADIX_TEN),
                });
            });
        }
        const customizedSplitObject: CommissionSplit = {
            name: editCustomizedSplitValues.name,
            assignments: assignments,
            rules: rules,
            conversion: editCustomizedSplitValues.conversion,
        };
        if (duplicateAssignementFlag) {
            this.showDuplicateAssigmentError = true;
            this.isSpinnerLoading = false;
            return;
        }
        if (this.operation === this.opertionType.ADD) {
            this.subscriber.push(
                this.aflac
                    .createCommissionSplit(this.mpGroup, customizedSplitObject)
                    .pipe(
                        tap((response) => {
                            this.cancelEditCustmizedSplit.emit({ operation: this.operation });
                            this.resetAddForm();
                            this.isSpinnerLoading = false;
                            return response;
                        }),
                        catchError(
                            (error: HttpErrorResponse): Observable<CommissionSplit> =>
                                this.catchCommissionSplitError(error, customizedSplitObject),
                        ),
                    )
                    .subscribe(),
            );
        } else {
            // this logic added only for ADV split
            // filtering the rules array so that one writing producer rule and all other rules will be passed in payload of updateCommissionSplit API in case of ADV split
            if (rules?.some((rule) => rule?.type === RULE_CONSTANT.CARRIER && rule?.carrierId === CarrierId.AFLAC_DENTAL_AND_VISION)) {
                const advRules = rules.filter(
                    (rule) =>
                        rule?.type === RULE_CONSTANT.CARRIER ||
                        rule?.type === RULE_CONSTANT.ENROLLMENT_METHOD ||
                        rule?.type === RULE_CONSTANT.STATES ||
                        rule?.type === RULE_CONSTANT.DATE_WRITTEN ||
                        rule?.type === RULE_CONSTANT.PRODUCT ||
                        (rule?.type === RULE_CONSTANT.WRITING_PRODUCER &&
                            this.commissionSplit?.rules.some(
                                (split) => split?.type === RULE_CONSTANT.WRITING_PRODUCER && split?.producerId === rule?.producerId,
                            )),
                );
                customizedSplitObject.rules = advRules;
            }
            customizedSplitObject.id = this.commissionSplit.id;
            this.subscriber.push(
                this.aflac
                    .updateCommissionSplit(this.mpGroup, this.commissionSplit.id, customizedSplitObject)
                    .pipe(
                        tap((response) => {
                            this.cancelEditCustmizedSplit.emit({
                                index: this.index,
                                operation: this.operation,
                            });
                            this.resetAddForm();
                            this.isSpinnerLoading = false;
                            return response;
                        }),
                        catchError(
                            (error: HttpErrorResponse): Observable<CommissionSplit> =>
                                this.catchCommissionSplitError(error, customizedSplitObject),
                        ),
                    )
                    .subscribe(),
            );
        }
    }
    /**
     * function to catch commission split create/update errors
     * @param errorResponse: HttpErrorResponse, error response from API that creates or updates commission split
     * @param customizedSplitObject: CommissionSplit, the new commission split object to be replaced or added
     * @returns Observable<CommissionSplit>
     */
    catchCommissionSplitError(error: HttpErrorResponse, customizedSplitObject: CommissionSplit): Observable<CommissionSplit> {
        this.isSpinnerLoading = false;
        const errorRes = error[this.ERROR];
        if (errorRes.status === ClientErrorResponseCode.RESP_400 && errorRes[this.DETAILS].length > 0) {
            errorRes[this.DETAILS].forEach((item) => {
                if (item.code === "ValidPattern" && item.field === "name") {
                    this.addUpdateCustomizedSplitForm.controls.name.setErrors({ pattern: true });
                }
            });
        } else if (errorRes.code !== ClientErrorResponseType.DUPLICATE) {
            this.showErrorAlertMessage(error);
        }
        if (this.duplicateCheckEnabledConfig && errorRes.status === AppSettings.API_RESP_409) {
            if (errorRes.code === ClientErrorResponseType.SELF_DUPLICATE) {
                this.subscriber.push(this.openDuplicateSplit(error, customizedSplitObject).subscribe());
            } else {
                this.addUpdateCustomizedSplitForm.controls.name.setErrors({
                    duplicate: true,
                });
            }
        }
        return EMPTY;
    }

    /**
     * function to open duplicate split record popup
     * when a duplicate commission split is added
     * @param errorResponse: HttpErrorResponse, error response that create or update commission split APIs give
     * @param customizedSplitObject: CommissionSplit, the new commission split object to be replaced or added
     * @returns Observable<CommissionSplit>
     */
    openDuplicateSplit(errorResponse: HttpErrorResponse, customizedSplitObject: CommissionSplit): Observable<CommissionSplit> {
        const duplicateCommissionSplitId = parseFloat(errorResponse.headers.get("location").split("/").slice(-1)[0]);
        return this.aflac.getCommissionSplit(this.mpGroup, duplicateCommissionSplitId).pipe(
            switchMap((response) => {
                const isSameProducer: boolean = response.createdById === this.loggedInProducerId;
                const dialogRef = this.empoweredModalService.openDialog(DuplicateSplitFoundComponent, {
                    data: {
                        isSameProducer: isSameProducer,
                        existingCommissionSplit: response,
                        newCommissionSplit: customizedSplitObject,
                    },
                });
                return this.refreshCommissionsPage(dialogRef);
            }),
        );
    }

    /**
     * function called to refresh Commission Splits tab when the duplicate commission split is replaced.
     * @param dialogRef: MatDialogRef<DuplicateSplitFoundComponent>
     * @returns Observable<null>
     */
    refreshCommissionsPage(dialogRef: MatDialogRef<DuplicateSplitFoundComponent>): Observable<null> {
        return dialogRef.afterClosed().pipe(
            tap(() => {
                if (this.isCommissionSplitReplaced) {
                    if (this.operation === this.opertionType.ADD) {
                        this.cancelEditCustmizedSplit.emit({
                            operation: this.operation,
                        });
                    } else {
                        this.cancelEditCustmizedSplit.emit({
                            index: this.index,
                            operation: this.operation,
                        });
                    }
                    this.resetAddForm();
                }
            }),
        );
    }

    openCoProducerPopup(): void {
        const dialogRef = this.dialog.open(AddSingleProducerComponent, {
            disableClose: false,
            autoFocus: true,
            panelClass: "add-single-peoducer",
            data: {
                roleList: this.roleTypes,
                loggedInProducerId: this.loggedInProducerId,
                isDirect: this.isDirect,
                mpGroupId: this.mpGroup,
                situs: this.store.selectSnapshot(CommissionsState.situs),
            },
            width: "700px",
            height: "auto",
        });
        this.subscriber.push(
            dialogRef.afterClosed().subscribe(() => {
                this.loadProducers();
            }),
        );
    }

    /**
     * function called when a new producer is added the default or new co-producer for the split
     * @returns void
     */
    loadProducers(): void {
        this.subscriber.push(
            this.accountService.getAccountProducers(this.mpGroup).subscribe(
                (Response) => {
                    this.totalProducerList = Response;
                    this.retrieveProducerList(Response);
                },
                (Error) => {
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
        this.producerRulesSelectedData = [];
        this.setProducerRulesData();
    }

    /**
     * This method is used to mark the state chip input field as touched.
     */
    chipTouched(): void {
        (this.addUpdateCustomizedSplitForm.controls.rules as FormArray)?.controls.forEach((control) =>
            (control as FormGroup).controls.states.updateValueAndValidity(),
        );
        this.markFormGroupTouched(this.addUpdateCustomizedSplitForm);
    }

    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.commission.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else if (error.code !== ClientErrorResponseType.DUPLICATE) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * function to update rules values of the current commission split
     * @param index: number, the index of the selected commission split
     * @param type: string, the type of rule
     * @param values: any[], values of the rule
     * @returns void
     */
    updateRulesControlValue(index: number, type: string, values: any[]): void {
        let ids: any[] = [];
        if (values && values.length) {
            if (type === this.ruleControlList.ENROLLMENT_METHOD) {
                ids = values;
            } else if (type === this.ruleControlList.STATES) {
                values.forEach((item) => {
                    ids.push(item.abbreviation);
                });
            } else {
                values.forEach((item) => {
                    ids.push(item.id);
                });
            }
        }
        if (ids.length) {
            this.addUpdateCustomizedSplitForm.controls.rules[this.CONTROLS][index].get(type).setValue(ids);
        }
        if (this.ruleControlList.CARRIER_ID === type) {
            this.updateProductDropDownList();
        }
    }

    /**
     * Function called when rules drop down operation is done
     * @param index: number, index of the selected rule
     * @param type: string, type of the selected rule
     * @param dataValue: any, data value of the selected rule
     * @param action: string, action performed (add/edit)
     * @param id: string, id of the element
     * @returns void
     */
    ruleDropDownOperations(index: number, type: string, dataValue?: any, action?: string, id?: string): void {
        let selectedData: any;
        let control: string;
        switch (type) {
            case RULE_CONSTANT.WRITING_PRODUCER:
                selectedData = this.producerRulesSelectedData;
                control = this.ruleControlList.PRODUCER_ID;
                break;
            case RULE_CONSTANT.PRODUCT:
                selectedData = this.productRulesSelectedData;
                control = this.ruleControlList.PRODUCT_ID;
                break;
            case RULE_CONSTANT.CARRIER:
                selectedData = this.carrierRulesSelectedData;
                control = this.ruleControlList.CARRIER_ID;
                break;
            case RULE_CONSTANT.STATES:
                selectedData = this.statesRulesSelectedData;
                control = this.ruleControlList.STATES;
                break;
            case RULE_CONSTANT.ENROLLMENT_METHOD:
                selectedData = this.enrollMethodRulesSelectedData;
                control = this.ruleControlList.ENROLLMENT_METHOD;
                break;
        }
        if (action === this.SELECT) {
            const dataIndex = selectedData.indexOf(dataValue.option.value);
            if (type !== RULE_CONSTANT.ENROLLMENT_METHOD && type !== RULE_CONSTANT.STATES) {
                const hasDataValue = selectedData.some((data) => data.id === dataValue.option.value.id);
                if (dataIndex < 0 && !hasDataValue) {
                    selectedData.push(dataValue.option.value);
                }
            } else if (dataIndex < 0) {
                selectedData.push(dataValue.option.value);
            }
            document.getElementById(id).blur();
        } else if (action === this.REMOVE) {
            const dataIndex = selectedData.indexOf(dataValue);
            if (dataIndex >= 0) {
                selectedData.splice(dataIndex, 1);
                if (!selectedData.length) {
                    (this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray).at(index).get(id).setValue(null);
                }
            }
        }
        this.updateRulesControlValue(index, control, selectedData);
    }
    removeRules(index: number, type: string): void {
        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        rules.removeAt(index);
        if (type) {
            switch (type) {
                case RULE_CONSTANT.ENROLLMENT_METHOD:
                    this.enrollMethodRulesSelectedData = [];
                    break;
                case RULE_CONSTANT.CARRIER:
                    this.carrierRulesSelectedData = [];
                    this.updateProductDropDownList();
                    break;
                case RULE_CONSTANT.STATES:
                    this.statesRulesSelectedData = [];
                    break;
                case RULE_CONSTANT.PRODUCT:
                    this.productRulesSelectedData = [];
                    break;
                case RULE_CONSTANT.WRITING_PRODUCER:
                    this.producerRulesSelectedData = [];
                    break;
                case RULE_CONSTANT.DATE_WRITTEN:
                    this.dateWrittenSelectedData = "";
            }
            const indexNum = this.ruleTypeSelectedlist.indexOf(type);
            if (indexNum >= 0) {
                this.ruleTypeSelectedlist.splice(indexNum, 1);
            }
        }
    }

    loadRulesList(): void {
        this.rulesList = [
            {
                type: RULE_CONSTANT.WRITING_PRODUCER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleWritingProducer"],
            },
            {
                type: RULE_CONSTANT.PRODUCT,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleProduct"],
            },
            {
                type: RULE_CONSTANT.STATES,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleState"],
            },
            {
                type: RULE_CONSTANT.DATE_WRITTEN,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleDate"],
            },
            {
                type: RULE_CONSTANT.CARRIER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleCarrier"],
            },
            {
                type: RULE_CONSTANT.ENROLLMENT_METHOD,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleEnrollMethod"],
            },
        ];
    }

    /**
     * Function is to load enrollment method list with display text from language
     */
    loadEnrollmentMethods(): void {
        this.enrollmentMethodList = {};
        this.enrollmentMethodList[EnrollmentMethod.FACE_TO_FACE] = this.languageStrings["primary.portal.enrollmentMethod.faceToFaceText"];
        this.enrollmentMethodList[EnrollmentMethod.CALL_CENTER] = this.languageStrings["primary.portal.enrollmentMethod.callCenterText"];
        this.enrollmentMethodList[EnrollmentMethod.HEADSET] = this.languageStrings["primary.portal.enrollmentMethod.headsetText"];
        this.enrollmentMethodList[EnrollmentMethod.SELF_SERVICE] = this.languageStrings["primary.portal.enrollmentMethod.selfServiceText"];
        this.enrollmentMethodList[EnrollmentMethod.VIRTUAL_FACE_TO_FACE] =
            this.languageStrings["primary.portal.enrollmentMethod.virtualFaceToFaceText"];
    }

    /**
     *This function will make api calls to get carriers, product offerings and enrollment methods
     */
    loadDropdownData(): void {
        this.subscriber.push(
            forkJoin([
                this.isDirect
                    ? this.benefitsOffereingService.getBenefitOfferingCarriers(false, this.mpGroup)
                    : this.accountService.getAccountCarriers(this.mpGroup),
                this.shoppingService.getProductOfferings(this.mpGroup),
                this.shoppingService.getEnrollmentMethods(this.mpGroup),
            ]).subscribe(
                ([carriersData, productsData, enrollmentMethodData]) => {
                    this.carriersList = this.isDirect ? carriersData : carriersData.carriers.map((carrier) => carrier.carrier);
                    if (productsData && carriersData && this.carriersList) {
                        this.retriveCarrierProductList(productsData, this.carriersList);
                    }
                    this.enrollMethodRulesDDData = enrollmentMethodData.map((method) => method.name);
                    if (this.isDirect) {
                        this.enrollMethodRulesDDData = this.enrollMethodRulesDDData.filter(
                            (method) => method !== EnrollmentMethod.SELF_SERVICE,
                        );
                    }
                },
                (Error) => {
                    // TODO Handle Error
                },
            ),
        );
    }

    /**
     *This function will make api call to get all producers(both US and NY) and also set the producer list
     * @param list Used to fetch Array of all Producers Data
     * @returns void
     */
    retrieveProducerList(list: ProducerSearch[]): void {
        const producersList: ProducerDetail[] = [];
        const producerRulesDDData: RuleListType[] = [];
        if (list) {
            list.forEach((element) => {
                const finalWritingNumbers: WritingNumber[] = [];
                if (element.producer && element.producer.writingNumbers.length > 0 && !element.declinedInvite) {
                    const writingNumbers = element.producer.writingNumbers;
                    writingNumbers.forEach((item) => {
                        if (this.customCompanyCode) {
                            const sitcodeWithCompanyCode = item.sitCodes.filter((x) => x.companyCode === this.customCompanyCode);
                            if (sitcodeWithCompanyCode && sitcodeWithCompanyCode.length) {
                                finalWritingNumbers.push(item);
                            }
                        } else {
                            finalWritingNumbers.push(item);
                        }
                    });
                    if (finalWritingNumbers && finalWritingNumbers.length) {
                        producersList.push({
                            id: element.producer.id,
                            name: element.producer.name.firstName + " " + element.producer.name.lastName,
                            writingNumbers: element.producer.writingNumbers,
                        });
                    }
                }
                producerRulesDDData.push({
                    id: element.producer.id,
                    name: element.producer.name.firstName + " " + element.producer.name.lastName,
                });
            });
        }
        this.producersList = this.utilService.copy(producersList);
        this.producerRulesDDData = this.utilService.copy(producerRulesDDData);
    }

    /**
     * Function to set writing producer rules list wrt to split producers
     * @returns void
     */
    setProducerRulesData(): void {
        const values = this.addUpdateCustomizedSplitForm.getRawValue();
        const producer: ProducerIdName[] = [];
        this.producerRulesDDData = [];
        const ZERO = 0;

        if (values.assignments.length === 1 && values.assignments[ZERO].producerId === "") {
            this.totalProducerList.forEach((element) => {
                producer.push({
                    id: element.producer.id,
                    name: `${element.producer.name.firstName} ${element.producer.name.lastName}`,
                });
            });
        } else {
            values.assignments.forEach((assignment) => {
                const producerId = assignment.producerId;
                const name = this.getProducerName(producerId);
                producer.push({
                    id: parseFloat(producerId),
                    name: name,
                });
            });
        }

        this.producerRulesDDData = this.utilService.copy(producer);
    }

    /**
     * Function is for updating the Product rule dropdown list and updating selected product list
     */
    updateProductDropDownList(): void {
        const filteredData =
            this.carrierRulesSelectedData && this.carrierRulesSelectedData.length ? this.carrierRulesSelectedData : this.carrierRulesDDData;
        if (this.totalProducts.length > 0) {
            this.productRulesDDData = this.totalProducts
                .filter((product) => filteredData.some((carrier) => product.carrierIds.indexOf(carrier.id) !== -1))
                .map((product) => ({ id: product.id, name: product.name }));
            this.productRulesSelectedData = this.productRulesDDData.filter((data) =>
                this.productRulesSelectedData.some((product) => product.id === data.id),
            );
        }
    }
    /**
     * Function is for retriving the list of products from Product offering data and Carrier from Account carrier data
     * @param productList total list of product offering
     * @param carriersList total list of carrier offering
     */
    retriveCarrierProductList(productList: ProductOffering[], carriersList: Carrier[]): void {
        this.carrierRulesDDData = carriersList
            .filter((carrier) => this.nonEligibleCarriersForSplit.indexOf(carrier.id) === -1 && carrier.commissionSplitEligible)
            .map((element) => ({ id: element.id, name: element.name }))
            .filter((carrierObj, index, carrierList) => carrierList.findIndex((carrier) => carrier.id === carrierObj.id) === index);
        this.totalProducts = productList.map((element) => element.product);
        this.productRulesDDData = this.totalProducts
            .filter((product) => this.carrierRulesDDData.some((carrier) => product.carrierIds.indexOf(carrier.id) !== -1))
            .map((product) => ({ id: product.id, name: product.name }));
    }

    updateRuleSelectionList(): void {
        const values = this.addUpdateCustomizedSplitForm.getRawValue();
        if (values && values.rules) {
            values.rules.forEach((element) => {
                if (!this.ruleTypeSelectedlist.find((x) => x === element.type)) {
                    this.ruleTypeSelectedlist.push(element.type);
                }
            });
        }
    }
    fetchWritingNumber(index: number, producerId: string): void {
        if (!producerId || producerId === "") {
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][index].get(this.assignmentControlList.WRITING_NUMBER)
                .setValue(null);
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][index].get(this.assignmentControlList.SITE_CODE)
                .setValue(null);
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][index].get(this.assignmentControlList.SITCodeHierarchyList)
                .setValue(`<div> ${this.languageStrings["primary.portal.commissionSplit.addUpdate.noHierarchyError"]}</div>`);
            if (index !== 0) {
                this.addUpdateCustomizedSplitForm
                    .get(this.assignmentControlList.ASSIGNMENTS)
                    [this.CONTROLS][index].get(this.assignmentControlList.PERCENTAGE)
                    .setValue(null);
            }
        }
    }
    /**
     * Event triggers on Rule selection change
     * @param index index of selection
     * @param selectedType selected rule type
     */
    onRuleSelectionChange(index: number, selectedType: string): void {
        const isAlreadySelected = this.ruleTypeSelectedlist.find((x) => x === selectedType);
        const rules = this.addUpdateCustomizedSplitForm.get(this.ruleControlList.RULES) as FormArray;
        const previousType = rules.value[index].type;
        const control = this.getRuleControlByRuleValue(previousType);
        if (isAlreadySelected) {
            this.clearAll(control, index);
            const indexNum = this.ruleTypeSelectedlist.indexOf(selectedType);
            this.removeRules(indexNum, selectedType);
            this.ruleTypeSelectedlist[index] = selectedType;
        } else if (this.ruleTypeSelectedlist[index]) {
            this.clearAll(control, index);
            this.ruleTypeSelectedlist[index] = selectedType;
        } else {
            this.ruleTypeSelectedlist[index] = selectedType;
            if (selectedType !== this.ruleControlList.DATE_WRITTEN) {
                this.ruleDropDownOperations(index, selectedType);
            }
        }
    }
    /**
     * Check for required fields after the rule selection
     * @param index index of selection
     * @param type selected rule type
     */
    requiredFields(index: number, type: string): void {
        const controlList = [
            this.ruleControlList.PRODUCER_ID,
            this.ruleControlList.PRODUCT_ID,
            this.ruleControlList.STATES,
            this.ruleControlList.DATE_WRITTEN,
            this.ruleControlList.CARRIER_ID,
            this.ruleControlList.ENROLLMENT_METHOD,
        ];
        const indexNum = controlList.indexOf(type);
        if (indexNum > 0) {
            controlList.splice(indexNum, 1);
        }
        const control = this.getRuleControlByRuleValue(type);
        if (control) {
            const controlElement = this.addUpdateCustomizedSplitForm.controls.rules[this.CONTROLS][index];
            controlList.forEach((element) => {
                controlElement.get(element).setValidators(null);
                controlElement.get(element).setErrors(null);
            });
            controlElement.setErrors({ required: true });
            controlElement.get(control).setValidators([Validators.required]);
            controlElement.get(control).setErrors({ required: true });
            controlElement.get(control).markAsPristine();

            this.addUpdateCustomizedSplitForm.updateValueAndValidity();
        }
    }
    /**
     * Function is for getting rule control text based on Rule type
     * @param type Rule type
     * @returns Rule control text
     */
    getRuleControlByRuleValue(type: string): string {
        let control: string;
        switch (type) {
            case RULE_CONSTANT.WRITING_PRODUCER:
                this.setProducerRulesData();
                control = this.ruleControlList.PRODUCER_ID;
                break;
            case RULE_CONSTANT.PRODUCT:
                control = this.ruleControlList.PRODUCT_ID;
                break;
            case RULE_CONSTANT.STATES:
                control = this.ruleControlList.STATES;
                break;
            case RULE_CONSTANT.DATE_WRITTEN:
                control = this.ruleControlList.DATE_WRITTEN;
                break;
            case RULE_CONSTANT.CARRIER:
                control = this.ruleControlList.CARRIER_ID;
                break;
            case RULE_CONSTANT.ENROLLMENT_METHOD:
                control = this.ruleControlList.ENROLLMENT_METHOD;
                break;
        }
        return control;
    }

    /**
     * Check the total percentage of split and based on that set error in form control
     */
    checkTotalPercentage(): void {
        let sum = 0;
        this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS)[this.CONTROLS].forEach((element) => {
            const percentage = parseInt(element.get(this.assignmentControlList.PERCENTAGE).value, 10);
            if (!isNaN(percentage)) {
                sum = sum + percentage;
            } else {
                element.get(this.assignmentControlList.PERCENTAGE).setValue(DEFAULT_PERCENTAGE);
            }
        });
        const assignmentsControl = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS)[this.CONTROLS];
        assignmentsControl.forEach((control) => {
            control.get(this.assignmentControlList.PERCENTAGE).setErrors(null);
        });
        if (sum !== 100) {
            assignmentsControl[assignmentsControl.length - 1].get(this.assignmentControlList.PERCENTAGE).setErrors({ invalid: true });
            assignmentsControl[assignmentsControl.length - 1].get(this.assignmentControlList.PERCENTAGE).markAsTouched();
        }
    }

    getRuleDisplayText(type: string): string | undefined {
        const rule = this.rulesList.find((x) => x.type === type);
        if (rule) {
            return rule.name;
        }
        return undefined;
    }

    /**
     * function called to get writing numbers wrt to producer id
     * @param id: string, producer id
     * @returns WritingNumber[], writing number objects with only active sit codes
     */
    getWritingNumbersByProducerId(id: string): WritingNumber[] | undefined {
        this.todayDate.setHours(0, 0, 0, 0);
        if (id && id !== "" && this.totalProducerList) {
            const matchingProducerObj = this.totalProducerList.find((producerObj) => producerObj.producer.id === parseInt(id, 10));
            if (matchingProducerObj) {
                const finalWritingNumbers = [];
                if (matchingProducerObj && matchingProducerObj.producer && matchingProducerObj.producer.writingNumbers) {
                    const writingNumbers = matchingProducerObj.producer.writingNumbers;
                    writingNumbers.forEach((item) => {
                        if (this.customCompanyCode) {
                            const sitcodeWithCompanyCode = item.sitCodes.filter(
                                (x) => x.companyCode === this.customCompanyCode && this.isSITCodeActive(x),
                            );
                            if (sitcodeWithCompanyCode && sitcodeWithCompanyCode.length) {
                                finalWritingNumbers.push(item);
                            }
                        } else {
                            finalWritingNumbers.push(item);
                        }
                    });
                }
                return finalWritingNumbers;
            }
        }
        return undefined;
    }

    /**
     * method to check if sitcode is active or expired
     * @param sitCode: SITCode, sit code
     * @returns boolean, true if active, false if not
     */
    isSITCodeActive(sitCode: SITCode): boolean {
        if (sitCode.expirationDate) {
            const expirationDate = this.dateService.toDate(sitCode.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);
            return expirationDate >= this.todayDate;
        }
        return true;
    }

    /**
     * function called to get sitCode wrt to writing number and producer id
     * @param id: string, producer id
     * @param writingNum: string, writing number
     * @returns SitCode[], only active sit code objects
     */
    getSitCodesByWritingNumberProducerId(id: string, writingNum: string): SitCode[] {
        this.todayDate.setHours(0, 0, 0, 0);
        let sitCodes: SitCode[] = [];
        if (id && id !== "" && writingNum && writingNum !== "" && this.totalProducerList) {
            const matchingProducerObj = this.totalProducerList.find((producerObj) => producerObj.producer.id === +id);
            if (matchingProducerObj && matchingProducerObj.producer && matchingProducerObj.producer.writingNumbers) {
                const writingNumber = matchingProducerObj.producer.writingNumbers.find((x) => x.number === writingNum);
                if (writingNumber && writingNumber.sitCodes.length > 0) {
                    sitCodes = this.customCompanyCode
                        ? writingNumber.sitCodes.filter((x) => x.companyCode === this.customCompanyCode && this.isSITCodeActive(x))
                        : writingNumber.sitCodes;
                }
            }
        }
        return sitCodes || null;
    }

    /**
     * Updates sit code options for the edited row when writing numbers selection is changed.
     *
     * @param id id of producer in row that has been edited
     * @param writingNum writing number selected
     * @param index index of row in edit form
     */
    onWritingNumbersSelectionChange(id: string, writingNum: string, index: number): void {
        this.sitCodeOptions[index] = this.getSitCodesByWritingNumberProducerId(id, writingNum);
        this.checkForDuplicateWritingNumber();

        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][index].get(this.assignmentControlList.SITE_CODE)
            .setValue("");

        this.hideInfoIcon = false;
    }

    /**
     * Check for duplicate writing number
     */
    checkForDuplicateWritingNumber(): void {
        let duplicateWritingNumber: unknown[] = [];
        const editCustomizedSplitValues = this.addUpdateCustomizedSplitForm.getRawValue();
        if (editCustomizedSplitValues && editCustomizedSplitValues.assignments && editCustomizedSplitValues.assignments.length) {
            duplicateWritingNumber = [...new Set(editCustomizedSplitValues.assignments.map((assignments) => assignments.writingNumber))];
        }
        this.duplicateWritingNumber =
            editCustomizedSplitValues.assignments &&
            editCustomizedSplitValues.assignments.length > 1 &&
            editCustomizedSplitValues.assignments.length > duplicateWritingNumber.length;
    }

    /**
     * Gets the writing number that corresponds to the producer and sit code.
     *
     * @param id id of producer
     * @param sitCodeId currently applied sit code of commission split
     */
    getWritingNumberBySitCode(id: string, sitCodeId: number): string | undefined {
        if (id && id !== "" && sitCodeId && this.producersList) {
            let num: string;
            const producer = this.producersList.find((x) => x.id === parseInt(id, 10));
            if (producer && producer.writingNumbers.length > 0) {
                producer.writingNumbers.forEach((item) => {
                    if (item.sitCodes.find((x) => x.id === sitCodeId)) {
                        num = item.number;
                    }
                });
                return num;
            }
        }
        return undefined;
    }

    /**
     * function called to load writing number of the producer
     * @param index: number, index of the producer
     * @param id: string, id of the producer
     * @returns void
     */
    loadWritingNumber(index: number, id: string): void {
        if (index === 0 && this.operation === this.opertionType.ADD && !this.isDirect) {
            this.afterCompanyCodeChange();
        }
        this.writingNumberOptions[index] = this.getWritingNumbersByProducerId(id);
        if (!this.isDefault) {
            this.producerRulesSelectedData = [];
        }
        this.setProducerRulesData();

        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][index].get(this.assignmentControlList.WRITING_NUMBER)
            .setValue("");
    }
    /**
     * Set SIT code hierarchy value for the tooltip
     * @param index position in the form
     * @param sitCodeId SIT code number
     */
    loadSitCodeHierarchy(index: number, sitCodeId: number): void {
        this.hideInfoIcon = true;
        if (sitCodeId && this.enableSitCodeHierarchy) {
            if (index === 0 && this.operation === this.opertionType.ADD && !this.isDirect) {
                const sitObj = this.sitCodes.find((x) => x.id === sitCodeId);
                if (sitObj && sitObj.companyCode) {
                    this.customCompanyCode = sitObj.companyCode;
                    this.afterCompanyCodeChange();
                }
            }
            this.isSpinnerLoading = true;
            this.subscriber.push(
                this.aflacBusinessService
                    .getSitCodeHierarchy(sitCodeId)
                    .pipe(
                        tap((SITCodeHierarchyList) => {
                            this.addUpdateCustomizedSplitForm
                                .get(this.assignmentControlList.ASSIGNMENTS)
                                [this.CONTROLS][index].get(this.assignmentControlList.SITCodeHierarchyList)
                                .setValue(SITCodeHierarchyList);
                            this.isSpinnerLoading = false;
                            return SITCodeHierarchyList;
                        }),
                        catchError((error) => {
                            this.isSpinnerLoading = false;
                            this.showErrorAlertMessage(error);
                            return of();
                        }),
                    )
                    .subscribe(),
            );
        }
    }
    removeText(text: string): void {
        if (text && this[text].nativeElement) {
            this[text].nativeElement.value = "";
        }
    }

    /**
     * Function is for Clearing/reseting all data of selected form control
     * @param type Rule type of selected form control
     * @param index Index of selected from control
     */
    clearAll(type: string, index: number): void {
        const control = this.addUpdateCustomizedSplitForm.get("rules")[this.CONTROLS][index];
        switch (type) {
            case this.ruleControlList.PRODUCER_ID:
                this.producerRulesSelectedData = [];
                control.get(type).setValue(null);
                break;
            case this.ruleControlList.ENROLLMENT_METHOD:
                this.enrollMethodRulesSelectedData = [];
                control.get(type).setValue(null);
                break;
            case this.ruleControlList.CARRIER_ID:
                this.carrierRulesSelectedData = [];
                control.get(type).setValue(null);
                break;
            case this.ruleControlList.STATES:
                this.statesRulesSelectedData = [];
                control.get(type).setValue(null);
                break;
            case this.ruleControlList.PRODUCT_ID:
                this.productRulesSelectedData = [];
                control.get(type).setValue(null);
                break;
            default:
                return null;
        }
        document.getElementById(type).blur();
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    checkDate(event: any): void {
        const date = this.datePipe.transform(event.value, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        this.dateWrittenSelectedData = this.maskPipe.transform(date, AppSettings.DATE_MASK_FORMAT);
    }
    getPartnerCarrierSplitDefaultMessage(carrierName: string): string {
        return this.languageStrings["primary.portal.commissionSplit.addUpdate.partnerCarrier.defaultSplitRuleMessage"].replace(
            "##CARRIER##",
            carrierName,
        );
    }

    /**
     * function to get name of the producer
     * @param producerId: string, producer id of the producer
     * @returns string, name of the producer
     */
    getProducerName(producerId: string): string {
        const matchingProducerObj = this.totalProducerList.find((producerObj) => producerObj.producer.id === parseFloat(producerId));
        return matchingProducerObj && matchingProducerObj.producer
            ? `${matchingProducerObj.producer.name.firstName} ${matchingProducerObj.producer.name.lastName}`
            : "";
    }

    /**
     * Initializes variables necessary for the 'state' chip select component
     *
     * @param initiallySelectedStates (optional) initially selected values
     */
    initStateRuleChipSelect(initiallySelectedStates?: ChipData[]): void {
        if (
            this.addUpdateCustomizedSplitForm &&
            this.addUpdateCustomizedSplitForm.controls &&
            this.addUpdateCustomizedSplitForm.controls.rules &&
            this.addUpdateCustomizedSplitForm.controls.rules["controls"]
        ) {
            this.allStatesSubject$.next(this.statesRulesDDData.map((state) => ({ name: state.name, value: state.abbreviation })));
        }
        if (initiallySelectedStates) {
            this.initialStateValues = initiallySelectedStates.map((state) => state.value);
        }
    }

    /**
     * Sets the state form control to selected value
     *
     * @param states selected states
     */
    changeStateControlValue(states: ChipData[]): void {
        this.statesRulesSelectedData = states.map((state) => ({ name: state.name, abbreviation: state.value }));
        this.chipTouched();
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
