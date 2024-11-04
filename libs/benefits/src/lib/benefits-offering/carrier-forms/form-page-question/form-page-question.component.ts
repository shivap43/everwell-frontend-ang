import { CurrencyPipe } from "@angular/common";
import { QuestionControlService } from "./../question-control.service";
import { Component, OnInit, Input, OnDestroy, EventEmitter, Output } from "@angular/core";
import {
    CarrierFormQuestion,
    DocumentApiService,
    CarrierFormQuestionDisplayStyle,
    InputResponseValidationFormat,
    CarrierFormQuestionType,
    QuestionOption,
    Q60_FORM,
    StaticService,
    ChoiceQuestion,
} from "@empowered/api";
import { FormGroup, AbstractControl } from "@angular/forms";
import { Store } from "@ngxs/store";
import { take, skip, takeUntil, tap, finalize } from "rxjs/operators";
import { BenefitsOfferingState, StaticUtilService } from "@empowered/ngxs-store";
import { NgxMaskPipe } from "ngx-mask";
import { Observable, Subject } from "rxjs";
import { HttpEvent } from "@angular/common/http";
import { AccountListState } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { FileUploadService } from "@empowered/common-services";

const TEXAS_SITUS_STATE = "TX";
const INVALID_NUMBER_INPUT = "primary.portal.members.beneficiaryValidationMsg.taxID";
const STATE = "State";

@Component({
    selector: "empowered-form-page-question",
    templateUrl: "./form-page-question.component.html",
    styleUrls: ["./form-page-question.component.scss"],
})
export class FormPageQuestionComponent implements OnInit, OnDestroy {
    @Input() question: CarrierFormQuestion;
    @Input() form: FormGroup;
    @Input() allQuestions: any[];
    @Input() isQ60Form: boolean;
    @Input() formId: number;
    @Input() groupSitusState: string;
    @Output() formCheckEvent = new EventEmitter();
    options: QuestionOption[] = [];
    groupTaxQuestionId: number;
    readonly MAX_LENGTH_TAX_ID = 9;
    today: Date;
    private unsub$: Subject<void> = new Subject<void>();
    uploadApi: Observable<HttpEvent<any>>;
    hidden = false;
    languageStrings: Record<string, string>;
    secondaryLanguageStrings: Record<string, string>;
    requiredBydependentQuestion = false;
    depQuestion: any;
    nonGenericFormats: string[] = [];
    QuestionFormat = InputResponseValidationFormat;
    QuestionType = CarrierFormQuestionType;
    QuestionDisplayStyle = CarrierFormQuestionDisplayStyle;
    totalBftElgbleEmployees: number;
    disableADPCCR = false;
    disableECCPR = false;
    disableRPDPR = false;
    disableADPCCRTL = false;
    eligibleEmployeesMet = false;
    adpccrResponseId: number;
    eccprResponseId: number;
    rpdprResponseId: number;
    wprResponseId: number;
    adbrResponseId: number;
    adpccrTLResponseId: number;
    wprTLResponseId: number;
    adbrTLResponseId: number;
    eligibleEmployeesQuestId: number;
    wlRidersQuestId: number;
    tlRidersQuestId: number;
    selectedBoxes: boolean[] = [];
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;

    errorMap = {
        required: "primary.portal.common.requiredField",
        invalidTaxID: INVALID_NUMBER_INPUT,
        invalidZip: "primary.portal.census.errorMessage.member.error.zip.invalid",
        invalidEmail: "primary.portal.register.invalidEmail",
        invalidPhone: "primary.portal.members.contactValidationMsg.phoneNumber",
        invalidCompanyName: "secondary.portal.accounts.companyInvalid",
        invalidNum: INVALID_NUMBER_INPUT,
        invalidAlphaHypensApostrophesSpace: "secondary.portal.accounts.companyInvalid",
        invalidAlphaHypensApostrophesPeriodSpace:
            "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaHypensApostrophesPeriodSpace",
        invalidAlphanumericHypensApostrophesSpace:
            "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaNumHypensApostrophesPeriodSpace",
        invalidAddress: "primary.portal.members.workValidationMsg.streetAddress2",
        invalidName: "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.validation.name",
        invalidCity: "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.validation.city",
        invalidCurrency: INVALID_NUMBER_INPUT,
    };
    constructor(
        private readonly documentsApiService: DocumentApiService,
        private readonly store: Store,
        private readonly maskPipe: NgxMaskPipe,
        private readonly languageService: LanguageService,
        private readonly questionControlService: QuestionControlService,
        private readonly staticUtilService: StaticUtilService,
        private readonly currencyPipe: CurrencyPipe,
        private readonly staticService: StaticService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    /**
     * Initializes question's data and state, loads language, and handles question's dependencies & riders.
     */
    ngOnInit(): void {
        /* Service call made to fetch the group tax question's ID from config
        in order to apply max length of 9 only on this specific object */
        this.staticUtilService
            .cacheConfigValue("general.carrier_form.group_tax_id.max_length")
            .pipe(takeUntil(this.unsub$))
            .subscribe((response) => {
                this.groupTaxQuestionId = Number(response);
            });
        this.initializeConstants();
        this.nonGenericFormats = [this.QuestionFormat.ALPHA, this.QuestionFormat.ALPHANUMERIC, this.QuestionFormat.NUMERIC];
        this.fetchLanguage();
        if (this.questionControlService.questionHasDependencies(this.question)) {
            this.question.dependencies.forEach(this.dependencyHandler);
        }
        this.performQ60Check();
        if (this.question.type === this.QuestionType.CHECKBOX && this.question.options) {
            this.selectedBoxes = this.setSelectedBoxes(this.question.options);
        }
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsub$))
            .subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    /**
     * Method to check rider checks on Q60 Carrier form
     */
    private initializeConstants(): void {
        if (this.formId === Q60_FORM.FORMID) {
            this.adpccrResponseId = Q60_FORM.ADPCCR_WL_RESPONSE_ID;
            this.eccprResponseId = Q60_FORM.ECCPR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.FL_FORMID) {
            this.adpccrResponseId = Q60_FORM.FL_ADPCCR_WL_RESPONSE_ID;
            this.eccprResponseId = Q60_FORM.FL_ECCPR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.FL_RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.FL_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.FL_ADBR_WL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.FL_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.FL_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.FL_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.FL_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.FL_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.OH_FORMID) {
            this.adpccrResponseId = Q60_FORM.OH_ADPCCR_WL_RESPONSE_ID;
            this.eccprResponseId = Q60_FORM.OH_ECCPR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.OH_RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.OH_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.OH_ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.OH_ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.OH_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.OH_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.OH_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.OH_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.OH_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.MT_FORMID) {
            this.adpccrResponseId = Q60_FORM.MT_ADPCCR_WL_RESPONSE_ID;
            this.eccprResponseId = Q60_FORM.MT_ECCPR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.MT_RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.MT_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.MT_ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.MT_ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.MT_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.MT_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.MT_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.MT_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.MT_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.WA_FORMID) {
            this.adpccrResponseId = Q60_FORM.WA_ADPCCR_WL_RESPONSE_ID;
            this.eccprResponseId = Q60_FORM.WA_ECCPR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.WA_RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.WA_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.WA_ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.WA_ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.WA_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.WA_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.WA_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.WA_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.WA_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.TX_FORMID) {
            this.adpccrResponseId = Q60_FORM.TX_ADPCCR_WL_RESPONSE_ID;
            this.rpdprResponseId = Q60_FORM.TX_RPDPR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.TX_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.TX_ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.TX_ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.TX_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.TX_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.TX_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.TX_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.TX_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        } else if (this.formId === Q60_FORM.PA_FORMID) {
            this.adpccrResponseId = Q60_FORM.PA_ADPCCR_WL_RESPONSE_ID;
            this.wprResponseId = Q60_FORM.PA_WPR_WL_RESPONSE_ID;
            this.adbrResponseId = Q60_FORM.PA_ADBR_WL_RESPONSE_ID;
            this.adpccrTLResponseId = Q60_FORM.PA_ADPCCR_TL_RESPONSE_ID;
            this.wprTLResponseId = Q60_FORM.PA_WPR_TL_RESPONSE_ID;
            this.adbrTLResponseId = Q60_FORM.PA_ADBR_TL_RESPONSE_ID;
            this.wlRidersQuestId = Q60_FORM.PA_WHOLE_LIFE_RIDERS_QUESTION_ID;
            this.tlRidersQuestId = Q60_FORM.PA_TERM_LIFE_RIDERS_QUESTION_ID;
            this.eccprResponseId = Q60_FORM.PA_ECCPR_WL_RESPONSE_ID;
            this.eligibleEmployeesQuestId = Q60_FORM.PA_TOTAL_ELIGIBLE_EMPLOYEES_QUESTION_ID;
        }
    }
    /**
     * Method to check rider checks on Q60 Carrier form
     */
    private performQ60Check(): void {
        if (this.isQ60Form) {
            this.manageRidersSelection();
            this.checkForRiderFormControls();
            if (this.eligibleEmployeesMet) {
                if (this.formId === Q60_FORM.FORMID) {
                    const ctrlWL = this.form.get(Q60_FORM.WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTL = this.form.get(Q60_FORM.TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWL);
                    this.checkForADPCCRTL(ctrlTL);
                } else if (this.formId === Q60_FORM.OH_FORMID) {
                    const ctrlWLOH = this.form.get(Q60_FORM.OH_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTLOH = this.form.get(Q60_FORM.OH_TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWLOH);
                    this.checkForADPCCRTL(ctrlTLOH);
                } else if (this.formId === Q60_FORM.MT_FORMID) {
                    const ctrlWLMT = this.form.get(Q60_FORM.MT_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTLMT = this.form.get(Q60_FORM.MT_TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWLMT);
                    this.checkForADPCCRTL(ctrlTLMT);
                } else if (this.formId === Q60_FORM.WA_FORMID) {
                    const ctrlWLWA = this.form.get(Q60_FORM.WA_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTLWA = this.form.get(Q60_FORM.WA_TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWLWA);
                    this.checkForADPCCRTL(ctrlTLWA);
                } else if (this.formId === Q60_FORM.TX_FORMID) {
                    const ctrlWLTX = this.form.get(Q60_FORM.TX_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTLTX = this.form.get(Q60_FORM.TX_TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWLTX);
                    this.checkForADPCCRTL(ctrlTLTX);
                } else if (this.formId === Q60_FORM.PA_FORMID) {
                    const ctrlWLPA = this.form.get(Q60_FORM.PA_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
                    const ctrlTLPA = this.form.get(Q60_FORM.PA_TERM_LIFE_RIDERS_QUESTION_ID.toString());
                    this.checkForADPCCRWL(ctrlWLPA);
                    this.checkForADPCCRTL(ctrlTLPA);
                }
            }
            this.checkEligibleEmployeesMet();
        }
    }

    /**
     * Method to check rider checks on Q60 Carrier form based on eligible employees
     */
    checkForRiderFormControls(): void {
        if (this.formId === Q60_FORM.FORMID) {
            const ctrlWL = this.form.get(Q60_FORM.WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTL = this.form.get(Q60_FORM.TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWL);
            this.checkForTermLifeFormControls(ctrlTL);
        } else if (this.formId === Q60_FORM.OH_FORMID) {
            const ctrlWLOH = this.form.get(Q60_FORM.OH_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTLOH = this.form.get(Q60_FORM.OH_TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWLOH);
            this.checkForTermLifeFormControls(ctrlTLOH);
        } else if (this.formId === Q60_FORM.MT_FORMID) {
            const ctrlWLMT = this.form.get(Q60_FORM.MT_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTLMT = this.form.get(Q60_FORM.MT_TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWLMT);
            this.checkForTermLifeFormControls(ctrlTLMT);
        } else if (this.formId === Q60_FORM.WA_FORMID) {
            const ctrlWLWA = this.form.get(Q60_FORM.WA_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTLWA = this.form.get(Q60_FORM.WA_TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWLWA);
            this.checkForTermLifeFormControls(ctrlTLWA);
        } else if (this.formId === Q60_FORM.TX_FORMID) {
            const ctrlWLTX = this.form.get(Q60_FORM.TX_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTLTX = this.form.get(Q60_FORM.TX_TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWLTX);
            this.checkForTermLifeFormControls(ctrlTLTX);
        } else if (this.formId === Q60_FORM.PA_FORMID) {
            const ctrlWLPA = this.form.get(Q60_FORM.PA_WHOLE_LIFE_RIDERS_QUESTION_ID.toString());
            const ctrlTLPA = this.form.get(Q60_FORM.PA_TERM_LIFE_RIDERS_QUESTION_ID.toString());
            this.checkForWholeLifeFormControls(ctrlWLPA);
            this.checkForTermLifeFormControls(ctrlTLPA);
        }
    }
    /**
     * Set rider selections for other products based on whole life rider selections
     * @param ctrl rider form control
     */
    checkForWholeLifeFormControls(ctrl: AbstractControl): void {
        ctrl.valueChanges.pipe(takeUntil(this.unsub$)).subscribe((ctrlValue) => {
            if (this.eligibleEmployeesMet) {
                this.disableADPCCRTL =
                    ctrl.value.includes(Q60_FORM.ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.OH_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.MT_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.WA_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.TX_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.PA_ADPCCR_WL_RESPONSE_ID.toString());
            }
        });
    }
    /**
     * Set rider selections for other products based on term life rider selections
     * @param ctrl rider form control
     */
    checkForTermLifeFormControls(ctrl: AbstractControl): void {
        ctrl.valueChanges.pipe(takeUntil(this.unsub$)).subscribe((ctrlValue) => {
            if (this.eligibleEmployeesMet) {
                this.disableADPCCR =
                    ctrl.value.includes(Q60_FORM.ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.OH_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.MT_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.WA_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.TX_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.PA_ADPCCR_TL_RESPONSE_ID.toString());
            }
        });
    }

    /**
     * Method to disable ADPCCR rider for Whole Life if the eligibleEmployees is not met
     */
    private checkForADPCCRWL(ctrl: AbstractControl): void {
        if (ctrl) {
            if (ctrl.value) {
                this.disableADPCCRTL =
                    ctrl.value.includes(Q60_FORM.ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.OH_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.MT_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.WA_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.TX_ADPCCR_WL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.PA_ADPCCR_WL_RESPONSE_ID.toString());
            }
            ctrl.valueChanges.pipe(takeUntil(this.unsub$)).subscribe((ctrlValue) => {
                if (this.eligibleEmployeesMet) {
                    this.disableADPCCRTL =
                        ctrl.value.includes(Q60_FORM.ADPCCR_WL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.OH_ADPCCR_WL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.MT_ADPCCR_WL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.WA_ADPCCR_WL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.TX_ADPCCR_WL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.PA_ADPCCR_WL_RESPONSE_ID.toString());
                }
            });
        }
    }

    /**
     * Method to disable ADPCCR rider for TermLIfe if the eligibleEmployees is not met
     */
    private checkForADPCCRTL(ctrl: AbstractControl): void {
        if (ctrl) {
            if (ctrl.value) {
                this.disableADPCCR =
                    ctrl.value.includes(Q60_FORM.ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.OH_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.MT_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.WA_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.TX_ADPCCR_TL_RESPONSE_ID.toString()) ||
                    ctrl.value.includes(Q60_FORM.PA_ADPCCR_TL_RESPONSE_ID.toString());
            }
            ctrl.valueChanges.pipe(takeUntil(this.unsub$)).subscribe((ctrlValue) => {
                if (this.eligibleEmployeesMet) {
                    this.disableADPCCR =
                        ctrl.value.includes(Q60_FORM.ADPCCR_TL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.OH_ADPCCR_TL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.MT_ADPCCR_TL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.WA_ADPCCR_TL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.TX_ADPCCR_TL_RESPONSE_ID.toString()) ||
                        ctrl.value.includes(Q60_FORM.PA_ADPCCR_TL_RESPONSE_ID.toString());
                }
            });
        }
    }

    private checkEligibleEmployeesMet(): void {
        const dependencyFormCtrl = this.form.get(this.eligibleEmployeesQuestId.toString());
        dependencyFormCtrl.valueChanges.pipe(takeUntil(this.unsub$)).subscribe((dependencyCtrlValue) => {
            this.totalBftElgbleEmployees = dependencyCtrlValue;
            this.checkCondition();
        });
        this.checkRiderCondition();
    }

    /**
     * If totalBenefitEligibleEmployeesQuestionId response < 10 hide ADPCCR, ECCPR and RPDPR rider options in the question id.
     */
    manageRidersSelection(): void {
        if (
            this.question.id === Q60_FORM.TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.FL_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.FL_WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.OH_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.OH_WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.MT_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.MT_WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.WA_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.WA_WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.TX_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.TX_WHOLE_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.PA_TERM_LIFE_RIDERS_QUESTION_ID ||
            this.question.id === Q60_FORM.PA_WHOLE_LIFE_RIDERS_QUESTION_ID
        ) {
            const dependencyFormCtrl = this.form.get(this.eligibleEmployeesQuestId.toString());
            this.totalBftElgbleEmployees = dependencyFormCtrl.value;
            this.checkCondition();
        }
    }

    /**
     * If totalBenefitEligibleEmployeesQuestionId response < 10 hide ADPCCR, ECCPR and RPDPR rider options in the question id.
     */
    checkCondition(): void {
        if (this.totalBftElgbleEmployees < Q60_FORM.TOTAL_ELIGIBLE_EMPLOYEES) {
            const questionCtrl = this.form.get(this.wlRidersQuestId.toString());
            this.retainRiderResp(questionCtrl);
            const questionCtrlTL = this.form.get(this.tlRidersQuestId.toString());
            this.retainRiderResp(questionCtrlTL);
            this.disableADPCCR = this.disableECCPR = this.disableRPDPR = this.disableADPCCRTL = true;
            this.eligibleEmployeesMet = false;
        } else {
            this.eligibleEmployeesMet = true;
            this.clearFlags();
            const questionCtrl = this.form.get(this.wlRidersQuestId.toString());
            if (questionCtrl && (!questionCtrl.value || !questionCtrl.value.includes(this.adpccrResponseId.toString()))) {
                this.disableECCPR = this.disableRPDPR = true;
            }
            if (questionCtrl && questionCtrl.value) {
                this.disableADPCCRTL = questionCtrl.value.includes(this.adpccrResponseId.toString());
                this.disableECCPR = questionCtrl.value.includes(this.rpdprResponseId?.toString());
                this.disableRPDPR = questionCtrl.value.includes(this.eccprResponseId?.toString());
            }
            const questionCtrlTL = this.form.get(this.tlRidersQuestId.toString());
            if (questionCtrlTL && questionCtrlTL.value) {
                this.disableADPCCR = questionCtrl.value.includes(this.adpccrTLResponseId);
            }
        }
    }

    /**
     * Method to retain WPR and ADBR riders
     * @param questionCtrl
     */
    private retainRiderResp(questionCtrl: AbstractControl): void {
        const wlRider: string[] = [];
        const tlRider: string[] = [];
        if (questionCtrl && questionCtrl.value) {
            if (questionCtrl.value.includes(this.wprResponseId.toString())) {
                wlRider.push(this.wprResponseId.toString());
            } else if (questionCtrl.value.includes(this.wprTLResponseId.toString())) {
                tlRider.push(this.wprTLResponseId.toString());
            }
            if (questionCtrl.value.includes(this.adbrResponseId.toString())) {
                wlRider.push(this.adbrResponseId.toString());
            } else if (questionCtrl.value.includes(this.adbrTLResponseId.toString())) {
                tlRider.push(this.adbrTLResponseId.toString());
            }
            if (wlRider.length) {
                questionCtrl.setValue(wlRider);
            } else if (tlRider.length) {
                questionCtrl.setValue(tlRider);
            } else {
                questionCtrl.patchValue("");
            }
        }
    }

    /**
     * Searches for matching value in dependency's question's options and returns the option on a match and null otherwise.
     * @param dependencyQuestionOptions array of question options for dependency
     * @param dependencyValue value provided for dependency
     * @returns question option whose ID matches dependency value or null otherwise
     */
    matchDependencyOptions(dependencyQuestionOptions: QuestionOption[], dependencyValue: string): QuestionOption {
        return dependencyQuestionOptions
            ? dependencyQuestionOptions.find((option) => option.questionResponseId.toString() === dependencyValue)
            : null;
    }

    /**
     * Clears all the flags
     */
    clearFlags(): void {
        if (this.disableADPCCR) {
            this.disableADPCCR = false;
        }
        if (this.disableECCPR) {
            this.disableECCPR = false;
        }
        if (this.disableRPDPR) {
            this.disableRPDPR = false;
        }
        if (this.disableADPCCRTL) {
            this.disableADPCCRTL = false;
        }
    }

    /**
     * If ADPCCR is selected for Whole life, disable for term life and vice versa
     * If ADPCCR is not selected, disable ECCPR and RPDPR
     * If ECCPR is selected, disable RPDPR and vice versa
     */
    checkRiderCondition(): void {
        const questionCtrl = this.form.get(this.wlRidersQuestId.toString());
        if (questionCtrl && questionCtrl.value) {
            this.disableECCPR = questionCtrl.value.includes(this.rpdprResponseId?.toString());
            this.disableRPDPR = questionCtrl.value.includes(this.eccprResponseId?.toString());

            if (!questionCtrl.value.includes(this.adpccrResponseId.toString())) {
                this.retainRiderResp(questionCtrl);
                this.disableECCPR = this.disableRPDPR = true;
            } else if (
                !questionCtrl.value.includes(this.rpdprResponseId?.toString()) &&
                !questionCtrl.value.includes(this.eccprResponseId?.toString())
            ) {
                this.disableECCPR = this.disableRPDPR = false;
            }
        } else {
            this.disableECCPR = this.disableRPDPR = true;
        }
    }

    /**
     * If option is indicated as being allowed to be prepopulated and contained in the
     * potentially multiple prepopulated values, then return true; false otherwise.
     * @param options checkboxes to be selected
     * @returns corresponding array of boolean values to indicate option's selected state
     */
    setSelectedBoxes(options: QuestionOption[]): boolean[] {
        return options.map(
            (option) =>
                option.isPrepopulated &&
                this.question.prepopulatedValue &&
                ((option.questionResponseId && this.question.prepopulatedValue.includes(option.questionResponseId.toString())) ||
                    this.question.prepopulatedValue.includes(option.text)),
        );
    }

    /**
     * Formatting number to USD format
     * @param event
     * @param addPrefixDollar add prefix $ if blurred and remove if focused
     */
    formatMoney(event: KeyboardEvent, addPrefixDollar: boolean): void {
        // eslint-disable-next-line no-useless-escape
        const amountWithoutDollarAndComma = event.target["value"].replace("$", "").replace(/\,/g, "");
        event.target["value"] =
            addPrefixDollar && !isNaN(+amountWithoutDollarAndComma)
                ? this.currencyPipe.transform(amountWithoutDollarAndComma)
                : amountWithoutDollarAndComma;
    }

    /**
     * Updates question's status based on a dependency's value and state.
     * @param dependency one of potentially multiple dependencies for a form question
     */
    dependencyHandler = (dependency) => {
        const dependencyFormCtrl = this.form.get(dependency.questionId.toString());
        const required: boolean = dependency.required;
        this.requiredBydependentQuestion = required;
        const formControl = this.form.get(this.question.id.toString());
        const dependencyQuestion = this.allQuestions.find((question) => question.id === dependency.questionId);
        if (this.questionControlService.isQuestionHiddenOrAbsent(dependencyQuestion)) {
            this.hidden = false;
            this.questionControlService.setOrClearValidators(
                true,
                this.form.get(this.question.id.toString()),
                dependencyQuestion.required,
                this.question,
                false,
            );
        } else if (dependencyFormCtrl) {
            if (dependencyFormCtrl.value instanceof Array) {
                let optionFound = false;
                dependencyFormCtrl.value.forEach((strValue) => {
                    const dependencyQuestionOption: QuestionOption = this.matchDependencyOptions(dependencyQuestion.options, strValue);
                    const optionText = dependencyQuestionOption ? dependencyQuestionOption.text : "";
                    const optionValue = dependencyQuestionOption ? dependencyQuestionOption.value : "";
                    if (strValue && !this.questionControlService.shouldHideQuestion(dependency, optionText, optionValue)) {
                        dependencyFormCtrl.updateValueAndValidity();
                        optionFound = true;
                    }
                });
                if (!optionFound) {
                    this.hidden = true;
                    formControl.clearValidators();
                    formControl.patchValue("");
                }
            } else {
                const dependencyValue = dependencyFormCtrl.value;
                const dependencyQuestionOption: QuestionOption = this.matchDependencyOptions(dependencyQuestion.options, dependencyValue);
                const optionText = dependencyQuestionOption ? dependencyQuestionOption.text : "";
                const optionValue = dependencyQuestionOption ? dependencyQuestionOption.value : "";
                if (!dependencyValue || this.questionControlService.shouldHideQuestion(dependency, optionText, optionValue)) {
                    this.hidden = true;
                    formControl.clearValidators();
                    formControl.patchValue("");
                } else {
                    dependencyFormCtrl.updateValueAndValidity();
                }
            }
            dependencyFormCtrl.valueChanges
                .pipe(
                    tap((dependencyCtrlValue) => {
                        if (!dependencyCtrlValue || !dependencyCtrlValue.length) {
                            this.hidden = true;
                            formControl.clearValidators();
                            formControl.patchValue("");
                        }
                        // ensure that dependencyCtrlValue is an array to simplify code
                        if (!(dependencyCtrlValue instanceof Array)) {
                            dependencyCtrlValue = [dependencyCtrlValue];
                        }
                        for (const strValue of dependencyCtrlValue) {
                            const dependencyQuestionOptionValue: QuestionOption = this.matchDependencyOptions(
                                dependencyQuestion.options,
                                strValue,
                            );
                            this.hidden = this.questionControlService.shouldHideQuestion(
                                dependency,
                                dependencyQuestionOptionValue ? dependencyQuestionOptionValue.text : "",
                                dependencyQuestionOptionValue ? dependencyQuestionOptionValue.value : "",
                            );
                            if (this.hidden || this.question.type === "TEXT") {
                                formControl.clearValidators();
                                if (dependencyCtrlValue.length === 1) {
                                    formControl.patchValue("");
                                }
                            } else {
                                this.questionControlService.setOrClearValidators(
                                    true,
                                    this.form.get(this.question.id.toString()),
                                    required,
                                    this.question,
                                    false,
                                );
                                break;
                            }
                        }
                    }),
                    takeUntil(this.unsub$),
                )
                .subscribe();
        }
    };

    /**
     * @description method to set uploadApi when file uploaded
     * @params the file uploaded
     * @returns void
     */
    onfileUploaded(file: File): void {
        this.uploadApi = this.documentsApiService.uploadDocument(
            file,
            this.multipartFileUploadConfig,
            this.store.selectSnapshot(AccountListState.getGroup)?.id,
        );
    }
    transform(event: KeyboardEvent): void {
        event.target["value"] = this.maskPipe.transform(event.target["value"], AppSettings.DATE_MASK_FORMAT);
    }
    /**
     * This method is used to get the error message
     * @returns string, error message
     */
    getError(): string {
        const errors = this.form.controls[this.question.id].errors;
        let error;
        if (errors) {
            const key = Object.keys(this.errorMap).find((keyObj) => keyObj in errors);
            if (key) {
                error = this.errorMap[key].startsWith("primary")
                    ? this.languageService.fetchPrimaryLanguageValue(this.errorMap[key])
                    : this.languageService.fetchSecondaryLanguageValue(this.errorMap[key]);
            } else if (errors.invalidSSN) {
                if (errors.minlength) {
                    error = this.languageStrings["primary.portal.members.personalValidationMsg.ssnMsg1"];
                } else {
                    error = this.languageStrings["primary.portal.members.personalValidationMsg.ssnMsg2"];
                }
            } else if (errors.invalidCompanyNameLength) {
                error = this.languageStrings["primary.portal.formPageQuestion.genericMinLengthValidation"].replace(
                    "#genericMinVal",
                    errors.invalidCompanyNameLength.requiredLength,
                );
            } else if (errors.maxlength) {
                error = this.getMinOrMaxLengthError("Max", errors);
            } else if (errors.minlength) {
                error = this.getMinOrMaxLengthError("Min", errors);
            } else if (errors.invalidAlpha) {
                if (errors.spacesAllowed) {
                    error = this.secondaryLanguageStrings["secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaSpaces"];
                } else {
                    error = this.languageStrings["primary.portal.formPageQuestion.useOnlyLetters"];
                }
            } else if (errors.invalidAlphanumeric) {
                if (errors.invalidAlphanumeric.spacesAllowed) {
                    error = this.secondaryLanguageStrings["secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaNumSpaces"];
                } else {
                    error = this.secondaryLanguageStrings["secondary.portal.common.pattern"];
                }
            } else if (errors.max) {
                error = this.languageStrings["primary.portal.formPageQuestion.genericMaxValValidation"].replace(
                    "#genericMaxVal",
                    this.question["validation"].maxValue,
                );
            } else if (errors.min) {
                error = this.languageStrings["primary.portal.formPageQuestion.genericMinValValidation"].replace(
                    "#genericMinVal",
                    this.question["validation"].minValue,
                );
            } else if (errors.zeroAtBothPlaceInvalid) {
                error = this.secondaryLanguageStrings["secondary.portal.formPageQuestion.zeroAtBothPlaceValidation"];
            }
        }
        return error;
    }
    getMinOrMaxLengthError(type: "Max" | "Min", errors: any): string {
        let error;
        const typeLower = type.toLowerCase();
        switch (this.question["validation"].format) {
            case InputResponseValidationFormat.ALPHA:
                error = this.languageStrings[`primary.portal.formPageQuestion.alpha${type}LengthValidation`].replace(
                    `#alpha${type}LengthValidation`,
                    this.question["validation"][`${typeLower}Length`],
                );
                break;
            case InputResponseValidationFormat.NUMERIC:
                error = this.languageStrings[`primary.portal.formPageQuestion.num${type}LengthValidation`].replace(
                    "#numMaxLen",
                    this.question["validation"][`${typeLower}Length`],
                );
                break;
            case InputResponseValidationFormat.ALPHANUMERIC:
                error = this.languageStrings[`primary.portal.formPageQuestion.alphaNum${type}LengthValidation`].replace(
                    `#alphaNum${type}Len`,
                    this.question["validation"][`${typeLower}Length`],
                );
                break;
            case InputResponseValidationFormat.TAX_ID:
                if (!errors.invalidTaxID) {
                    error = this.languageStrings["primary.portal.formPageQuestion.exactNumbers"].replace(
                        "#exactValue",
                        (errors.minlength || errors.maxlength).requiredLength,
                    );
                }
                break;
            default:
                error = this.languageStrings[`primary.portal.formPageQuestion.generic${type}LengthValidation`].replace(
                    `#generic${type}Len`,
                    this.question["validation"][`${typeLower}Length`],
                );
        }
        return error;
    }
    fetchLanguage(): void {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.optional",
            "primary.portal.common.requiredField",
            "primary.portal.formPageQuestion.alphaMaxLengthValidation",
            "primary.portal.formPageQuestion.alphaMinLengthValidation",
            "primary.portal.members.contactValidationMsg.phoneNumber",
            "primary.portal.members.personalValidationMsg.ssnMsg1",
            "primary.portal.census.errorMessage.member.error.zip.invalid",
            "primary.portal.formPageQuestion.numMaxLengthValidation",
            "primary.portal.formPageQuestion.numMinLengthValidation",
            "primary.portal.formPageQuestion.alphaNumMinLengthValidation",
            "primary.portal.formPageQuestion.alphaNumMaxLengthValidation",
            "primary.portal.formPageQuestion.genericMaxValValidation",
            "primary.portal.formPageQuestion.genericMinValValidation",
            "primary.portal.formPageQuestion.genericMaxLengthValidation",
            "primary.portal.formPageQuestion.genericMinLengthValidation",
            "primary.portal.members.personalValidationMsg.ssnMsg2",
            "primary.portal.census.errorMessage.general.error.date_format",
            "primary.portal.common.selectionRequired",
            "primary.portal.formPageQuestion.useOnlyLetters",
            "primary.portal.common.placeholderSelect",
            "primary.portal.members.beneficiaryValidationMsg.taxID",
            "primary.portal.formPageQuestion.exactNumbers",
            "primary.portal.register.invalidEmail",
        ]);
        this.secondaryLanguageStrings = this.languageService.fetchSecondaryLanguageValues([
            "secondary.portal.common.pattern",
            "secondary.portal.accounts.companyInvalid",
            "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaNumSpaces",
            "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaHypensApostrophesPeriodSpace",
            "secondary.portal.benefitsOffering.carrierForms.formPageQuestion.alphaNumHypensApostrophesPeriodSpace",
            "secondary.portal.formPageQuestion.zeroAtBothPlaceValidation",
        ]);
    }
    /**
     * Emits an event to disable save button based on zip code value
     * @param event key value entered
     */
    disableSave(event: Event): void {
        this.formCheckEvent.emit(!!event.target["value"]);
    }
    /**
     * ZipCode validation based on state
     * @param question : question info
     * @param value selected state value
     */
    validateZipCodeByState(question: ChoiceQuestion, value?: string): void {
        const zipQuestionIndex = this.allQuestions.findIndex(
            (questionDetails) => questionDetails.validation && questionDetails.validation.format === this.QuestionFormat.ZIP_CODE,
        );
        let stateQuestionId: number;
        let stateQuestionIndex: number;
        if (zipQuestionIndex > 0) {
            stateQuestionIndex = zipQuestionIndex - 1;
            stateQuestionId = this.allQuestions[stateQuestionIndex].id;
        }
        if (
            (question["validation"] && question["validation"].format === this.QuestionFormat.ZIP_CODE) ||
            this.allQuestions[stateQuestionIndex].options.some((option) => option.text === value)
        ) {
            const zipId = this.allQuestions[zipQuestionIndex].id;
            const zipValue = this.form.controls[zipId].value;
            const stateValue = value || this.form.controls[stateQuestionId].value;
            if (zipValue) {
                this.staticService
                    .validateStateZip(stateValue, zipValue)
                    .pipe(
                        takeUntil(this.unsub$),
                        finalize(() => this.formCheckEvent.emit(false)),
                    )
                    .subscribe(
                        (resp) => {
                            this.form.controls[zipId].setErrors(null);
                            this.form.controls[stateQuestionId].setErrors(null);
                        },
                        (error) => {
                            this.form.controls[zipId].setErrors({ invalidZip: true });
                            this.form.controls[zipId].markAsTouched();
                        },
                    );
            }
        }
    }
    /**
     * @description removing error messages on input
     * @param event keyboard event
     * @returns void
     */
    removeError(event: Event): void {
        if (event.target["value"]) {
            this.form.controls[this.question.id].setErrors(null);
        }
    }

    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
