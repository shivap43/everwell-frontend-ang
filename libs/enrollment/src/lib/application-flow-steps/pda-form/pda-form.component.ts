import { Component, OnInit, OnDestroy, ViewChild, AfterContentChecked } from "@angular/core";
import { MatTableDataSource, MatTable } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Subscription, Observable, combineLatest, Subject } from "rxjs";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { MemberService, AccountService, AflacService, PdaForm, FormType } from "@empowered/api";

import {
    EnrollmentState,
    EnrollmentMethodState,
    EnrollmentMethodModel,
    SharedState,
    RegexDataType,
    AppFlowService,
    StaticUtilService,
    UtilService,
    TPIState,
} from "@empowered/ngxs-store";

import { Router, ActivatedRoute } from "@angular/router";
import { UserService } from "@empowered/user";
import { Store, Select } from "@ngxs/store";
import { HttpErrorResponse } from "@angular/common/http";
import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    EnrollmentMethod,
    StaticStep,
    ProducerDetails,
    AccountProducer,
    AppSettings,
    ProducerCredential,
} from "@empowered/constants";
import { switchMap, filter, takeUntil } from "rxjs/operators";

const CONFIRMATION_STEP = 4;
const MIN_SIGNATURE_LENGTH = 2;
const MAX_SIGNATURE_LENGTH = 50;
const DECIMAL_PLACES = 2;
const DEPT_NUM_OBJECT_ID = "departmentNum";
const MIN_LOCATION_LENGTH = "general.data.group_name.length.minimum";
const MAX_LOCATION_LENGTH = "general.data.group_name.length.maximum";
const MAX_DEPARTMENT_NUM_LENGTH = 4;

interface PdaPolicy {
    policyName: string;
    subPolicyName?: string;
    oldPreTax?: number;
    oldPostTax?: number;
    newPreTax?: number;
    newPostTax?: number;
    oneFieldReqError?: boolean;
}

let ELEMENT_DATA: PdaPolicy[];

@Component({
    selector: "empowered-pda-form",
    templateUrl: "./pda-form.component.html",
    styleUrls: ["./pda-form.component.scss"],
})
export class PdaFormComponent implements OnInit, AfterContentChecked, OnDestroy {
    pdaFormData: PdaForm;
    producerId: number;
    pdaFormValues: PdaForm = {} as PdaForm;
    pdaForm: FormGroup;
    isMember = false;
    portal = "";
    loadSpinner: boolean;
    enrollmentObj: EnrollmentMethodModel;
    memberId: any;
    totalOldPreCost = 0.0;
    totalOldPostCost = 0.0;
    totalNewPreCost = 0.0;
    totalNewPostCost = 0.0;
    hasOldPreTax = false;
    hasOldPostTax = false;
    hasNewPreTax = false;
    hasNewPostTax = false;
    isAflac = false;
    isNotAflac = false;
    isHeadset: boolean;
    mpGroup: number;
    memberAddress: any;
    eSign: string;
    sectionToScroll: string;
    enrollmentMethod: string;
    enrollmentState: string;
    producerSearchList: any;
    options = [];
    allowedPdaPolicyNames: string[] = [];
    minDate = new Date();
    producerName: string;
    writingNumber: string;
    telephoneNumber: string;
    payrollMode: string;
    pdaPolicy: string;
    isSubmitted = false;
    dataCopy;
    errorFieldFlag = false;
    primaryProducer: AccountProducer[];
    // min characters allowed for location
    locationMinLength: number;
    // Max character allowed for location
    locationMaxLength: number;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.pda.form.paymentInfo",
        "primary.portal.pda.form.employeeInfo",
        "primary.portal.pda.form.waiverPart",
        "primary.portal.pda.form.customerSignLater",
        "primary.portal.pda.form.producerInfo",
        "primary.portal.pda.form.departmentNum",
        "primary.portal.pda.form.location",
        "primary.portal.pda.form.deductionDate",
        "primary.portal.pda.form.payrollMode",
        "primary.portal.pda.form.deductionFrequencyPara",
        "primary.portal.pda.form.firstName",
        "primary.portal.pda.form.mi",
        "primary.portal.pda.form.lastName",
        "primary.portal.pda.form.employeeSSN",
        "primary.portal.pda.form.employerName",
        "primary.portal.pda.form.employerAccount",
        "primary.portal.pda.form.employeeSign",
        "primary.portal.pda.form.producerName",
        "primary.portal.pda.form.date",
        "primary.portal.pda.form.writingNumber",
        "primary.portal.pda.form.telephoneNumber",
        "primary.portal.pda.form.herebyAuthorizeText",
        "primary.portal.pda.form.additionUnderstandText",
        "primary.portal.pda.form.certifyFeaturesText",
        "primary.portal.pda.form.understandPoliciesText",
        "primary.portal.pda.form.notAflacRadioText",
        "primary.portal.pda.form.aflacRadioText",
        "primary.portal.pda.form.policyName",
        "primary.portal.pda.form.policyOld",
        "primary.portal.pda.form.policyNew",
        "primary.portal.pda.form.pretax",
        "primary.portal.pda.form.afterTax",
        "primary.portal.pda.form.atleastOneField",
        "primary.portal.pda.form.signRequired",
        "primary.portal.pda.form.signWaiverRequired",
        "primary.portal.setPrices.dollar",
        "primary.portal.common.select",
        "primary.portal.common.next",
        "primary.portal.common.save",
        "primary.portal.common.monthly",
        "primary.portal.common.yearly",
        "primary.portal.common.dateHint",
        "primary.portal.common.optional",
        "primary.portal.common.total",
        "primary.portal.common.remove",
        "primary.portal.common.requiredField",
        "primary.portal.applicationFlow.oneCharacter",
        "primary.portal.applicationFlow.invalidFormat",
        "primary.portal.pda.form.webexDisclaimer",
        "primary.portal.pda.location.validationMsg",
        "primary.portal.pda.form.invalidDepartmentNumber",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.pattern.signature",
        "secondary.portal.common.maxLength50",
    ]);
    displayedColumns: string[] = ["policyName", "oldPreTax", "oldPostTax", "newPreTax", "newPostTax", "removeRow"];
    dataSource: MatTableDataSource<PdaPolicy>;
    dataSource2: MatTableDataSource<PdaPolicy>;
    manualAddData: PdaPolicy[] = [];
    @ViewChild(MatTable) policyTable: MatTable<any>;
    validationRegex: RegexDataType;
    isTPIProducer = false;
    SSN_FORMAT = "000-00-0000";
    errorMessage: string;
    errorFlag = false;
    enrollmentMethodEnum = EnrollmentMethod;
    // Flag to check config is available or not
    isConfigAvailable = false;

    private readonly unsubscribe$ = new Subject<void>();

    /**
     * constructor of class
     * @param language Ref of language service
     * @param datePipe Ref of date pipe
     * @param fb Ref of angular form builder service
     * @param store Ref of ngx store
     * @param router Ref of angular router service
     * @param route Ref of angular activated router service
     * @param memberService Ref of angular member service
     * @param utilService Ref of util service
     * @param appFlowService Ref of app flow service
     * @param accountService Ref of account service
     * @param aflacService Ref of aflac service
     * @param userService Ref of user service
     * @param staticUtilService Ref of static util service
     */
    constructor(
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly memberService: MemberService,
        private readonly utilService: UtilService,
        private readonly appFlowService: AppFlowService,
        private readonly accountService: AccountService,
        private readonly aflacService: AflacService,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.isHeadset = false;
    }

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });
        this.scrollToSection(DEPT_NUM_OBJECT_ID);
        this.appFlowService.updateReturnToShop$.next(true);
        this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: StaticStep.PDA });
        const mpGroupId = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        if (mpGroupId && this.router.url.indexOf("payroll") >= 0) {
            this.mpGroup = mpGroupId;
        } else {
            this.mpGroup = this.route.snapshot.params.mpGroupId;
        }
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        if (this.appFlowService.checkTpi()) {
            this.producerId = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId;
            if (this.producerId) {
                this.getProducerDetails();
            }
            this.isTPIProducer = Boolean(this.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId));
        } else {
            this.userService.credential$
                .pipe(
                    filter((producer) => producer !== undefined),
                    switchMap((producer: ProducerCredential) =>
                        this.accountService.getAccountProducer(producer.producerId.toString(), this.mpGroup),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((producerDetail) => {
                    this.populateProducerDetail(producerDetail.producer);
                });
        }
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.dataSource2 = new MatTableDataSource<PdaPolicy>(this.manualAddData);
        this.dataSource = new MatTableDataSource<PdaPolicy>(this.manualAddData);
        this.dataSource2.data = [];
        this.dataSource.data = [];
        this.getLocationConfig();
    }

    /**
     * Get location validation rule from config [minLength, maxLength]
     * @returns void
     */
    getLocationConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(MIN_LOCATION_LENGTH),
            this.staticUtilService.cacheConfigValue(MAX_LOCATION_LENGTH),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([locationMinLength, locationMaxLength]) => {
                this.locationMinLength = +locationMinLength;
                this.locationMaxLength = +locationMaxLength;
                this.definePdaForm();
                this.getMemberFormData();
                this.getAllowedPdaPolicyNames();
                this.disablePdaForm();
                this.isConfigAvailable = true;
            });
    }

    /**
     * @description: Function to display error message when Service returns an error
     * @param error: the error response from the service
     */
    errorBody(error: HttpErrorResponse): void {
        this.errorMessage = "";
        if (error.status === ServerErrorResponseCode.RESP_500) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.qle.pendindEnrollment.InternalServer.error");
        }
        if (error.error.status === ClientErrorResponseCode.RESP_400 && error.error.details) {
            error.error.details.forEach((msg, i) => {
                if (i > 0) {
                    this.errorMessage += ", ";
                }
                this.errorMessage += error.error.details[i].message;
            });
        }
        this.errorFlag = true;
    }

    /**
     * Fetch logged in producer details
     */
    getProducerDetails(): void {
        this.accountService
            .getAccountProducer(this.producerId.toString(), this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producerDetail) => {
                const selectedProducer = producerDetail.producer;
                if (selectedProducer.writingNumbers) {
                    this.writingNumber = selectedProducer.writingNumbers[0].number;
                }
                if (selectedProducer.name) {
                    this.producerName = `${selectedProducer.name.firstName} ${selectedProducer.name.lastName}`;
                }
                if (selectedProducer.phoneNumber) {
                    this.telephoneNumber = selectedProducer.phoneNumber;
                }
            });
    }
    /**
     * populate producer information in pda form
     * @param producerInfo logged in producer detail
     */
    populateProducerDetail(producerInfo: ProducerDetails): void {
        if (producerInfo.writingNumbers) {
            this.writingNumber = producerInfo.writingNumbers[0].number;
        }
        if (producerInfo.name) {
            this.producerName = `${producerInfo.name.firstName} ${producerInfo.name.lastName}`;
        }
        if (producerInfo.phoneNumber) {
            this.telephoneNumber = producerInfo.phoneNumber;
        }
    }
    /**
     * Fetch member form data
     */
    getMemberFormData(): void {
        this.loadSpinner = true;
        this.memberService
            .getMemberFormsByType(this.memberId, FormType.PDA, this.mpGroup.toString(), "NEW")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    if (res.length) {
                        this.pdaFormData = res[0];
                        this.eSign = this.pdaFormData.signature;
                        this.setFormValues(this.pdaFormData);
                        this.getPayFrequency();
                        this.loadSpinner = false;
                    }
                },
                (err) => {
                    this.loadSpinner = false;
                },
            );
    }

    getPayFrequency(): void {
        this.accountService
            .getPayFrequencies(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((payFrequency) => {
                if (this.pdaFormData) {
                    const payFreq = payFrequency.find((x) => x.id === this.pdaFormData.payFrequencyId);
                    if (payFreq) {
                        this.payrollMode = payFreq.name;
                    }
                }
            });
    }

    /**
     * Function to initially disable the controls of pda form
     */
    disablePdaForm(): void {
        this.pdaForm.get("ssn").disable();
        this.pdaForm.get("employerName").disable();
        this.pdaForm.get("employerPayrollAccountNumber").disable();
        this.pdaForm.get("firstName").disable();
        this.pdaForm.get("lastName").disable();
        this.pdaForm.get("mi").disable();
        this.pdaForm.get("isAflac").disable();
        if (this.isTPIProducer) {
            this.checkHeadSetTPI();
        } else {
            this.checkForHeadSetEnrollment();
        }
    }

    /**
     * To check the headset enrollment in TPI flow for PR state
     */
    checkHeadSetTPI(): void {
        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        if (this.enrollmentMethod === AppSettings.HEADSET && this.enrollmentState === AppSettings.PR) {
            this.disablePDAFormHeadset();
        }
    }

    /**
     *@description will check for headset enrollment and enrollment state based on that disable eSignature and eSignature2.
     */
    checkForHeadSetEnrollment(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            if (credential.producerId) {
                this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                if (this.enrollmentObj) {
                    this.enrollmentMethod = !(
                        this.enrollmentObj.enrollmentMethod === null || this.enrollmentObj.enrollmentMethod === undefined
                    )
                        ? this.enrollmentObj.enrollmentMethod
                        : "";
                    this.enrollmentState = !(
                        this.enrollmentObj.enrollmentState === null || this.enrollmentObj.enrollmentState === undefined
                    )
                        ? this.enrollmentObj.enrollmentState
                        : "";
                    if (this.enrollmentMethod === AppSettings.HEADSET && this.enrollmentState === AppSettings.PUERTO_RICO) {
                        this.disablePDAFormHeadset();
                    }
                }
            }
        });
    }

    /**
     * To disable signature fields for PDA headset enrollment
     */
    disablePDAFormHeadset(): void {
        this.isHeadset = true;
        this.pdaForm.get("eSignature").disable();
        this.pdaForm.get("eSignature2").disable();
    }

    /**
     * Creating form controls for PDA form
     */
    definePdaForm(): void {
        this.pdaForm = this.fb.group({
            ssn: [],
            employerName: [],
            employerPayrollAccountNumber: [],
            firstName: [],
            lastName: [],
            mi: [],
            eSignature: [
                "",
                [
                    Validators.required,
                    Validators.pattern(this.validationRegex.E_SIGNATURE),
                    Validators.minLength(MIN_SIGNATURE_LENGTH),
                    Validators.maxLength(MAX_SIGNATURE_LENGTH),
                ],
            ],
            departmentNumber: [
                "",
                [Validators.pattern(this.validationRegex.ALPHANUMERIC), Validators.maxLength(MAX_DEPARTMENT_NUM_LENGTH)],
            ],
            location: [
                "",
                [Validators.pattern(this.validationRegex.ALPHANUMERIC_SPECIAL_CHARACTERS), Validators.minLength(this.locationMinLength)],
            ],
            firstDeductionDate: ["", Validators.required],
            payrollAccountNumber: [],
            policyPremiums: [],
            telephoneNumber: [],
            pdaPolicy: [],
            eSignature2: [
                "",
                [
                    Validators.required,
                    Validators.pattern(this.validationRegex.E_SIGNATURE),
                    Validators.minLength(MIN_SIGNATURE_LENGTH),
                    Validators.maxLength(MAX_SIGNATURE_LENGTH),
                ],
            ],
            isAflac: [],
        });
    }

    /**
     * function to set values into the pda form
     * @param pdaFormData - data from service to be filled in the form
     */
    // eslint-disable-next-line complexity
    setFormValues(pdaFormData: PdaForm): void {
        const policyData = [] as PdaPolicy[];
        if (this.pdaFormData) {
            this.pdaForm.patchValue({
                firstName: this.pdaFormData.memberName.firstName,
                mi: this.pdaFormData.memberName.middleName,
                lastName: this.pdaFormData.memberName.lastName,
                employerName: this.pdaFormData.employerName,
                ssn: this.pdaFormData.socialSecurityNumber,
                employerPayrollAccountNumber: this.pdaFormData.payrollAccountNumber,
            });
            if (this.pdaFormData.policyPremiums.length > 0) {
                ELEMENT_DATA = this.pdaFormData.policyPremiums.slice();
                if (this.pdaFormData) {
                    ELEMENT_DATA.forEach((element) => {
                        if (element.policyName !== "Life") {
                            if (element.newPreTax) {
                                this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                this.hasNewPreTax = true;
                            }
                            if (element.newPostTax) {
                                this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                this.hasNewPostTax = true;
                            }
                            if (element.oldPostTax) {
                                this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                this.hasOldPostTax = true;
                            }
                            if (element.oldPreTax) {
                                this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                this.hasOldPreTax = true;
                            }
                            policyData.push(element);
                        }
                    });
                    let employeeLife = [];
                    employeeLife = ELEMENT_DATA.filter((x) => x.policyName === "Life" && x.subPolicyName === "Employee");
                    let dependentLife = [];
                    dependentLife = ELEMENT_DATA.filter((x) => x.policyName === "Life" && x.subPolicyName === "Dependent");
                    if (employeeLife.length || dependentLife.length) {
                        const policy = {} as PdaPolicy;
                        policy.policyName = "Life";
                        policyData.push(policy);
                        if (employeeLife.length) {
                            const employeeLifePolicy = {} as PdaPolicy;
                            employeeLifePolicy.policyName = "Life";
                            employeeLifePolicy.subPolicyName = "Employee";
                            employeeLife.forEach((element) => {
                                if (element.newPreTax) {
                                    if (employeeLifePolicy.newPreTax === null || employeeLifePolicy.newPreTax === undefined) {
                                        employeeLifePolicy.newPreTax = 0;
                                    }
                                    employeeLifePolicy.newPreTax = employeeLifePolicy.newPreTax + element.newPreTax;
                                    this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                    this.hasNewPreTax = true;
                                }
                                if (element.newPostTax) {
                                    if (employeeLifePolicy.newPostTax === null || employeeLifePolicy.newPostTax === undefined) {
                                        employeeLifePolicy.newPostTax = 0;
                                    }
                                    employeeLifePolicy.newPostTax = employeeLifePolicy.newPostTax + element.newPostTax;
                                    this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                    this.hasNewPostTax = true;
                                }
                                if (element.oldPostTax) {
                                    if (employeeLifePolicy.oldPostTax === null || employeeLifePolicy.oldPostTax === undefined) {
                                        employeeLifePolicy.oldPostTax = 0;
                                    }
                                    employeeLifePolicy.oldPostTax = employeeLifePolicy.oldPostTax + element.oldPostTax;
                                    this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                    this.hasOldPostTax = true;
                                }
                                if (element.oldPreTax) {
                                    if (employeeLifePolicy.oldPreTax === null || employeeLifePolicy.oldPreTax === undefined) {
                                        employeeLifePolicy.oldPreTax = 0;
                                    }
                                    employeeLifePolicy.oldPreTax = employeeLifePolicy.oldPreTax + element.oldPreTax;
                                    this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                    this.hasOldPreTax = true;
                                }
                            });
                            if (employeeLifePolicy.newPreTax !== null && employeeLifePolicy.newPreTax !== undefined) {
                                employeeLifePolicy.newPreTax = parseFloat(employeeLifePolicy.newPreTax.toFixed(DECIMAL_PLACES));
                            }
                            if (employeeLifePolicy.newPostTax !== null && employeeLifePolicy.newPostTax !== undefined) {
                                employeeLifePolicy.newPostTax = parseFloat(employeeLifePolicy.newPostTax.toFixed(DECIMAL_PLACES));
                            }
                            if (employeeLifePolicy.oldPreTax !== null && employeeLifePolicy.oldPreTax !== undefined) {
                                employeeLifePolicy.oldPreTax = parseFloat(employeeLifePolicy.oldPreTax.toFixed(DECIMAL_PLACES));
                            }
                            if (employeeLifePolicy.oldPostTax !== null && employeeLifePolicy.oldPostTax !== undefined) {
                                employeeLifePolicy.oldPostTax = parseFloat(employeeLifePolicy.oldPostTax.toFixed(DECIMAL_PLACES));
                            }
                            policyData.push(employeeLifePolicy);
                        }
                        if (dependentLife.length) {
                            const dependentLifePolicy = {} as PdaPolicy;
                            dependentLifePolicy.policyName = "Life";
                            dependentLifePolicy.subPolicyName = "Dependent";
                            dependentLife.forEach((element) => {
                                if (element.newPreTax) {
                                    if (dependentLifePolicy.newPreTax === null || dependentLifePolicy.newPreTax === undefined) {
                                        dependentLifePolicy.newPreTax = 0;
                                    }
                                    dependentLifePolicy.newPreTax = dependentLifePolicy.newPreTax + element.newPreTax;
                                    this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                    this.hasNewPreTax = true;
                                }
                                if (element.newPostTax) {
                                    if (dependentLifePolicy.newPostTax === null || dependentLifePolicy.newPostTax === undefined) {
                                        dependentLifePolicy.newPostTax = 0;
                                    }
                                    dependentLifePolicy.newPostTax = dependentLifePolicy.newPostTax + element.newPostTax;
                                    this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                    this.hasNewPostTax = true;
                                }
                                if (element.oldPostTax) {
                                    if (dependentLifePolicy.oldPostTax === null || dependentLifePolicy.oldPostTax === undefined) {
                                        dependentLifePolicy.oldPostTax = 0;
                                    }
                                    dependentLifePolicy.oldPostTax = dependentLifePolicy.oldPostTax + element.oldPostTax;
                                    this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                    this.hasOldPostTax = true;
                                }
                                if (element.oldPreTax) {
                                    if (dependentLifePolicy.oldPreTax === null || dependentLifePolicy.oldPreTax === undefined) {
                                        dependentLifePolicy.oldPreTax = 0;
                                    }
                                    dependentLifePolicy.oldPreTax = dependentLifePolicy.oldPreTax + element.oldPreTax;
                                    this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                    this.hasOldPreTax = true;
                                }
                            });
                            if (dependentLifePolicy.newPreTax !== null && dependentLifePolicy.newPreTax !== undefined) {
                                dependentLifePolicy.newPreTax = parseFloat(dependentLifePolicy.newPreTax.toFixed(DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.newPostTax !== null && dependentLifePolicy.newPostTax !== undefined) {
                                dependentLifePolicy.newPostTax = parseFloat(dependentLifePolicy.newPostTax.toFixed(DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.oldPreTax !== null && dependentLifePolicy.oldPreTax !== undefined) {
                                dependentLifePolicy.oldPreTax = parseFloat(dependentLifePolicy.oldPreTax.toFixed(DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.oldPostTax !== null && dependentLifePolicy.oldPostTax !== undefined) {
                                dependentLifePolicy.oldPostTax = parseFloat(dependentLifePolicy.oldPostTax.toFixed(DECIMAL_PLACES));
                            }
                            policyData.push(dependentLifePolicy);
                        }
                    }
                }
            }
            this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(DECIMAL_PLACES));
            this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(DECIMAL_PLACES));
            this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(DECIMAL_PLACES));
            this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(DECIMAL_PLACES));
            this.dataSource.data = policyData;
            this.checkAflacCondition();
        }
    }
    /**
     *@description when user clicks on submit button payload for api call is prepared then service call invoked with appropriate payload.
     */
    onSubmit(): void {
        this.isSubmitted = true;
        if (!this.pdaForm.invalid && !this.checkForErrorField()) {
            this.loadSpinner = true;
            this.setDataValue();
            if (this.enrollmentObj) {
                this.pdaFormValues.enrollmentState = this.enrollmentObj?.enrollmentStateAbbreviation;
                this.pdaFormValues.submissionMethod = this.enrollmentObj.enrollmentMethod || EnrollmentMethod.FACE_TO_FACE;
            } else {
                this.pdaFormValues.submissionMethod = EnrollmentMethod.FACE_TO_FACE;
            }
            if (this.pdaFormValues.policyPremiums.length) {
                this.memberService
                    .createMemberFormByType(this.memberId, this.pdaFormValues, FormType.PDA, this.mpGroup.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res) => {
                            const respHeaderLocation = res.headers.get("location");
                            const eleArray = respHeaderLocation.split("/");
                            // eslint-disable-next-line radix
                            const pdaId = parseInt(eleArray[eleArray.length - 1]);
                            this.createMemberNote(pdaId);
                            this.loadSpinner = false;
                            this.utilService.updateFormSubmission(FormType.PDA, true);
                            const isEBSAccount = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
                            let preliminaryStepIndex: number;
                            // logic to increase lastCompleteStaticStep count by one if preliminary statement step is included in app flow
                            this.appFlowService.showPreliminaryStatementStep$
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe((showPreliminaryStatement) => {
                                    preliminaryStepIndex = showPreliminaryStatement ? 1 : 0;
                                });
                            if (isEBSAccount) {
                                this.appFlowService.lastCompleteStaticStep.next(CONFIRMATION_STEP + preliminaryStepIndex + 1);
                            } else {
                                this.appFlowService.lastCompleteStaticStep.next(CONFIRMATION_STEP + preliminaryStepIndex);
                            }
                            this.appFlowService.planChanged$.next({
                                nextClicked: true,
                                discard: false,
                            });
                        },
                        (error: HttpErrorResponse) => {
                            this.loadSpinner = false;
                            this.errorBody(error);
                        },
                    );
            }
        }
    }

    createMemberNote(pdaId: any): void {
        const payload = {
            formInfo: {
                id: pdaId,
                type: FormType.PDA,
            },
        };
        this.memberService.createMemberNote(this.memberId, this.mpGroup.toString(), payload).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * @description: Function to set payload for PDA form
     */
    setDataValue(): void {
        this.pdaFormValues.isAflacPolicyHolder = null;
        this.pdaFormValues.departmentNumber = !(
            this.pdaForm.get("departmentNumber").value === null || this.pdaForm.get("departmentNumber").value === undefined
        )
            ? this.pdaForm.get("departmentNumber").value
            : null;
        this.pdaFormValues.location = !(this.pdaForm.get("location").value === null || this.pdaForm.get("location").value === undefined)
            ? this.pdaForm.get("location").value
            : null;
        this.pdaFormValues.firstDeductionDate = !(
            this.pdaForm.get("firstDeductionDate").value === null || this.pdaForm.get("firstDeductionDate").value === undefined
        )
            ? this.datePipe.transform(this.pdaForm.get("firstDeductionDate").value, AppSettings.DATE_FORMAT_YYYY_MM_DD)
            : null;
        this.pdaFormValues.payrollAccountNumber = !(
            this.pdaForm.get("employerPayrollAccountNumber").value === null ||
            this.pdaForm.get("employerPayrollAccountNumber").value === undefined
        )
            ? this.pdaForm.get("employerPayrollAccountNumber").value
            : null;

        const policyData = this.pdaFormData.policyPremiums;
        this.pdaFormValues.policyPremiums = [] as PdaPolicy[];
        this.pdaFormValues.policyPremiums = this.dataSource.data.filter((x) => x.policyName !== "Life");
        let lifePolicyData = [];
        lifePolicyData = policyData.filter((x) => x.policyName === "Life");
        if (lifePolicyData.length) {
            this.pdaFormValues.policyPremiums = this.pdaFormValues.policyPremiums.concat(lifePolicyData);
        }

        this.dataSource2.data.forEach((res) => {
            const policy = {} as any;
            policy.policyName = res.policyName;
            policy.newPostTax = !(res.newPostTax === null || res.newPostTax === undefined) ? res.newPostTax : null;
            policy.newPreTax = !(res.newPreTax === null || res.newPreTax === undefined) ? res.newPreTax : null;
            policy.oldPreTax = !(res.oldPreTax === null || res.oldPreTax === undefined) ? res.oldPreTax : null;
            policy.oldPostTax = !(res.oldPostTax === null || res.oldPostTax === undefined) ? res.oldPostTax : null;
            this.pdaFormValues.policyPremiums.push(policy);
        });
        this.setDefaultSignatureForHeadSet();
        const policyHolder = this.pdaForm.get("isAflac").value;
        if (policyHolder.length) {
            this.pdaFormValues.isAflacPolicyHolder = policyHolder === "true";
        }
    }

    setDefaultSignatureForHeadSet(): void {
        if (!this.isHeadset) {
            this.pdaFormValues.signature = !(
                this.pdaForm.get("eSignature").value === null || this.pdaForm.get("eSignature").value === undefined
            )
                ? this.pdaForm.get("eSignature").value
                : null;
        }
    }
    getAllowedPdaPolicyNames(): void {
        this.aflacService
            .getAllowedPdaPolicyNames()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.allowedPdaPolicyNames.push("Select");
                let count = 1;
                resp.forEach((element) => {
                    this.allowedPdaPolicyNames[count] = element;
                    count++;
                });
            });
    }

    // eslint-disable-next-line complexity
    onPolicySelection(policy: any): void {
        const planLength = this.dataSource2.data.length;
        this.checkForErrorField();
        if (planLength > 0 && this.dataSource2.data[planLength - 1].oneFieldReqError !== true) {
            if (policy !== "Select" && !(policy === null || policy === undefined)) {
                this.setPolicyDataSource(policy);
            }
        } else if (planLength === 0 && policy !== "Select" && !(policy === null || policy === undefined)) {
            this.setPolicyDataSource(policy);
        }
    }

    setPolicyDataSource(policy: any): void {
        if (policy === "Life") {
            this.dataSource2.data.push({
                policyName: policy,
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: "Employee",
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: "Dependent",
            });
        } else {
            this.dataSource2.data.push({
                policyName: policy,
            });
        }
        this.dataSource2 = new MatTableDataSource(this.dataSource2.data);
        this.pdaForm.controls["pdaPolicy"].setValue("Select");
    }

    onNewPreTaxChange(): void {
        this.totalNewPreCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.newPreTax === null || ele.newPreTax === undefined ? 0 : ele.newPreTax;
                this.totalNewPreCost = this.totalNewPreCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.newPreTax === null || ele.newPreTax === undefined ? 0 : ele.newPreTax;
            this.totalNewPreCost = this.totalNewPreCost + value;
        });
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(DECIMAL_PLACES));
    }
    onNewPostTaxChange(): void {
        this.totalNewPostCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.newPostTax === null || ele.newPostTax === undefined ? 0 : ele.newPostTax;
                this.totalNewPostCost = this.totalNewPostCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.newPostTax === null || ele.newPostTax === undefined ? 0 : ele.newPostTax;
            this.totalNewPostCost = this.totalNewPostCost + value;
        });
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(DECIMAL_PLACES));
    }
    onOldPreTaxChange(): void {
        this.totalOldPreCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.oldPreTax === null || ele.oldPreTax === undefined ? 0 : ele.oldPreTax;
                this.totalOldPreCost = this.totalOldPreCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.oldPreTax === null || ele.oldPreTax === undefined ? 0 : ele.oldPreTax;
            this.totalOldPreCost = this.totalOldPreCost + value;
        });
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(DECIMAL_PLACES));
    }

    onOldPostTaxChange(): void {
        this.totalOldPostCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.oldPostTax === null || ele.oldPostTax === undefined ? 0 : ele.oldPostTax;
                this.totalOldPostCost = this.totalOldPostCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.oldPostTax === null || ele.oldPostTax === undefined ? 0 : ele.oldPostTax;
            this.totalOldPostCost = this.totalOldPostCost + value;
        });
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(DECIMAL_PLACES));
    }
    checkForErrorField(): boolean {
        const planLength = this.dataSource2.data.length;
        if (planLength > 0) {
            const plan = this.dataSource2.data[planLength - 1];
            if (plan.policyName === "Life") {
                const lifePlan = this.dataSource2.data[planLength - AppSettings.TWO];
                if (
                    (lifePlan.newPostTax === null || lifePlan.newPostTax === undefined) &&
                    (lifePlan.oldPostTax === null || lifePlan.oldPostTax === undefined) &&
                    (lifePlan.newPreTax === null || lifePlan.newPreTax === undefined) &&
                    (lifePlan.oldPreTax === null || lifePlan.oldPreTax === undefined)
                ) {
                    this.dataSource2.data[planLength - AppSettings.TWO].oneFieldReqError = true;
                    this.errorFieldFlag = true;
                    this.pdaForm.controls["pdaPolicy"].setValue("Select");
                }
            }
            if (
                (plan.newPostTax === null || plan.newPostTax === undefined) &&
                (plan.oldPostTax === null || plan.oldPostTax === undefined) &&
                (plan.newPreTax === null || plan.newPreTax === undefined) &&
                (plan.oldPreTax === null || plan.oldPreTax === undefined)
            ) {
                this.dataSource2.data[planLength - 1].oneFieldReqError = true;
                this.errorFieldFlag = true;
                this.pdaForm.controls["pdaPolicy"].setValue("Select");
            }
        }
        return this.errorFieldFlag;
    }
    checkForAflac(): void {
        this.hasNewPreTax = false;
        this.hasNewPostTax = false;
        this.hasOldPostTax = false;
        this.hasOldPreTax = false;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((element) => {
                this.checkTaxValues(element);
            });
        }
        this.dataSource2.data.forEach((element) => {
            this.checkTaxValues(element);
        });
        this.checkAflacCondition();
    }

    checkTaxValues(element: any): void {
        if (!(element.newPreTax === null || element.newPreTax === undefined)) {
            this.hasNewPreTax = true;
        }
        if (!(element.newPostTax === null || element.newPostTax === undefined)) {
            this.hasNewPostTax = true;
        }
        if (!(element.oldPostTax === null || element.oldPostTax === undefined)) {
            this.hasOldPostTax = true;
        }
        if (!(element.oldPreTax === null || element.oldPreTax === undefined)) {
            this.hasOldPreTax = true;
        }
    }

    checkAflacCondition(): void {
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (this.hasOldPostTax || this.hasOldPreTax) {
            if (!this.hasNewPreTax && !this.hasNewPostTax && !this.isHeadset) {
                this.pdaForm.controls["isAflac"].setValue("true");
                this.pdaForm.get("eSignature2").enable();
            } else {
                this.pdaForm.controls["isAflac"].setValue("");
                this.pdaForm.controls["eSignature2"].setValue("");
                this.pdaForm.get("eSignature2").disable();
            }
        } else {
            // eslint-disable-next-line sonarjs/no-collapsible-if
            if (!this.hasNewPreTax && !this.hasNewPostTax && !this.isHeadset) {
                this.pdaForm.controls["isAflac"].setValue("false");
                this.pdaForm.get("eSignature2").enable();
            } else {
                this.pdaForm.controls["isAflac"].setValue("");
                this.pdaForm.controls["eSignature2"].setValue("");
                this.pdaForm.get("eSignature2").disable();
            }
        }
    }

    removePolicy(index: any, data: any): void {
        this.dataCopy = Object.assign(this.dataSource2.data);
        if (data.policyName === "Life") {
            const lifeArray = [];
            const lifePolicyArray = this.dataCopy.filter((x) => x.policyName === "Life");
            this.dataCopy.forEach((element) => {
                if (element.policyName === "Life") {
                    const indexData = this.dataCopy.indexOf(element);
                    lifeArray.push(indexData);
                }
            });

            for (let i = lifeArray.length - 1; i >= 0; i--) {
                this.dataCopy.splice(lifeArray[i], 1);
            }

            this.dataSource2 = new MatTableDataSource(this.dataCopy);
            for (const policy of lifePolicyArray) {
                this.calculateTotalTax(policy);
            }
        } else {
            this.dataCopy.splice(index, 1);
            this.dataSource2 = new MatTableDataSource(this.dataCopy);
            this.calculateTotalTax(data);
        }
    }

    /**
     * Calculation of total new pre cost and old post cost
     * @param data Contains tax data
     */
    calculateTotalTax(data: any): void {
        this.totalNewPreCost = !(data.newPreTax === null || data.newPreTax === undefined)
            ? this.totalNewPreCost - data.newPreTax
            : this.totalNewPreCost;
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(DECIMAL_PLACES));
        this.totalNewPostCost = !(data.newPostTax === null || data.newPostTax === undefined)
            ? this.totalNewPostCost - data.newPostTax
            : this.totalNewPostCost;
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(DECIMAL_PLACES));
        this.totalOldPreCost = !(data.oldPreTax === null || data.oldPreTax === undefined)
            ? this.totalOldPreCost - data.oldPreTax
            : this.totalOldPreCost;
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(DECIMAL_PLACES));
        this.totalOldPostCost = !(data.oldPostTax === null || data.oldPostTax === undefined)
            ? this.totalOldPostCost - data.oldPostTax
            : this.totalOldPostCost;
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(DECIMAL_PLACES));
    }

    /**
     * @description: Function to bring the scroll focus to the first object of the PDA form
     * @param id: id of the first document object
     */
    scrollToSection(id: string): void {
        this.sectionToScroll = id;
    }

    /**
     * @description: Life cycle hook to bring the focus to the first object based on the document Object ID
     */
    ngAfterContentChecked(): void {
        if (document.getElementById(this.sectionToScroll)) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            this.sectionToScroll = "";
        }
    }

    /**
     * Update the fields giving error in the form
     */
    updateErrorField(): void {
        this.checkForAflac();
        const planLength = this.dataSource2.data.length;
        if (planLength > 0) {
            const plan = this.dataSource2.data[planLength - 1];
            if (plan.policyName === "Life") {
                const lifePlan = this.dataSource2.data[planLength - AppSettings.TWO];
                if (
                    !(lifePlan.newPostTax === null || lifePlan.newPostTax === undefined) ||
                    !(lifePlan.oldPostTax === null || lifePlan.oldPostTax === undefined) ||
                    !(lifePlan.newPreTax === null || lifePlan.newPreTax === undefined) ||
                    !(lifePlan.oldPreTax === null || lifePlan.oldPreTax === undefined)
                ) {
                    this.dataSource2.data[planLength - AppSettings.TWO].oneFieldReqError = false;
                }
            }

            if (
                !(plan.newPostTax === null || plan.newPostTax === undefined) ||
                !(plan.oldPostTax === null || plan.oldPostTax === undefined) ||
                !(plan.newPreTax === null || plan.newPreTax === undefined) ||
                !(plan.oldPreTax === null || plan.oldPreTax === undefined)
            ) {
                this.dataSource2.data[planLength - 1].oneFieldReqError = false;
            }
        }
    }

    /**
     * Destroy Life cycle hook of component.
     * It is used to clear the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
