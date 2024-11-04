import { takeUntil } from "rxjs/operators";
import { CommissionSplit, AflacService, AccountService, SitCode, Rule, ACTION } from "@empowered/api";
import { Component, OnInit, OnDestroy, HostBinding } from "@angular/core";

import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { Subject, forkJoin } from "rxjs";
import { MatSelectChange } from "@angular/material/select";
import { Store } from "@ngxs/store";
import { TPIState } from "@empowered/ngxs-store";
import { TpiSSOModel, CompanyCode, WritingNumber, AppSettings } from "@empowered/constants";
import { Router } from "@angular/router";
import { TpiServices } from "@empowered/common-services";

// Component Level Constants
const ERROR = "error";
const DETAILS = "details";
const PARSE_INT = 10;

const TWO = 2;
const COMMISION_SPLIT_STEP = 1;

@Component({
    selector: "empowered-commision-split",
    templateUrl: "./commision-split.component.html",
    styleUrls: ["./commision-split.component.scss"],
})
export class CommisionSplitComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    commisionSplitForm: FormGroup;
    commissionName: string;
    conversion: boolean;
    producerName: string;
    splitPercentage: number;
    defaultCommision: CommissionSplit[];
    mpGoupId: string;
    rules: Rule[];
    commissionId: number;
    headerInfo: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.commissionPercentage",
        "primary.portal.tpiEnrollment.defaultSplit",
        "primary.portal.tpiEnrollment.producer",
        "primary.portal.tpiEnrollment.percentage",
        "primary.portal.tpiEnrollment.writingNumber",
        "primary.portal.tpiEnrollment.sitCode",
        "primary.portal.tpiEnrollment.split",
        "primary.portal.common.placeholderSelect",
        "primary.portal.tpiEnrollment.selectionRequired",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.continue",
        "primary.portal.tpiEnrollment.commissionSplit",
    ]);
    genericError = this.language.fetchSecondaryLanguageValue("secondary.portal.createProspect.genericError");

    writingNumbers: WritingNumber[] = [];
    sitCodes: SitCode[] = [];
    errorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    commissionSplits: CommissionSplit[];
    sitCodeControl: AbstractControl;
    loadSpinner = false;
    producerId: number;
    ssoDetails: TpiSSOModel;
    mpGroup: number;
    companyCode: string;
    tpiLnlMode = false;

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly aflac: AflacService,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly tpiService: TpiServices,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.ssoDetails = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        this.mpGoupId = this.store.selectSnapshot(TPIState.tpiSsoDetail)
            ? this.store.selectSnapshot(TPIState.tpiSsoDetail).user.groupId.toString()
            : "";
        this.producerId = this.ssoDetails.user.producerId;
        this.mpGroup = this.ssoDetails.user.groupId;
        this.tpiService.setStep(COMMISION_SPLIT_STEP);
        this.headerInfo = this.languageStrings["primary.portal.tpiEnrollment.commissionSplit"];
        this.initialiseForm();
        this.getCommissionSplits();
        this.sitCodeControl = this.commisionSplitForm.get("sitCode");
    }

    /**
     * This function will initialise the form and its control
     */
    initialiseForm(): void {
        this.commisionSplitForm = this.fb.group({
            producerName: [{ disabled: true, value: "" }, Validators.required],
            percentage: [{ disabled: true, value: "" }, Validators.required],
            writingNumber: ["", Validators.required],
            sitCode: ["", Validators.required],
        });
    }

    /**
     * This function will be responsible for populating writing code, sit code
     * in the form from getCommissionSplits API
     * @returns void
     */
    getCommissionSplits(): void {
        this.loadSpinner = true;
        forkJoin([
            this.aflac.getCommissionSplits(this.mpGoupId),
            this.accountService.getAccountProducers(this.mpGoupId),
            this.accountService.getAccount(this.mpGoupId),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.commissionSplits = response[0];
                    this.defaultCommision = this.commissionSplits.filter((commision) => commision.defaultFor);
                    this.rules = this.defaultCommision[0].rules;
                    this.commissionId = this.defaultCommision[0].id;
                    const situs = response[TWO].situs;
                    this.companyCode = situs.state.abbreviation === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
                    const defaultProducer = response[1].find(
                        (accountProducers) => accountProducers.producer.id === this.defaultCommision[0].assignments[0].producer.producerId,
                    );
                    this.commissionName = this.defaultCommision[0].name;
                    this.conversion = this.defaultCommision[0].conversion;
                    this.splitPercentage = this.defaultCommision[0].assignments[0].percent;
                    this.producerName = this.defaultCommision[0].defaultFor.name;
                    this.commisionSplitForm.get("producerName").patchValue(this.producerName);
                    this.commisionSplitForm.get("percentage").patchValue(`${this.splitPercentage}%`);
                    if (defaultProducer) {
                        if (defaultProducer.producer && defaultProducer.producer.writingNumbers.length > 0) {
                            const writingNumbers = defaultProducer.producer.writingNumbers;
                            this.writingNumbers = writingNumbers
                                .filter((element) => element.sitCodes.some((subElement) => subElement.companyCode === this.companyCode))
                                .map((element) =>
                                    Object.assign({}, element, {
                                        sitCodes: element.sitCodes.filter((subElement) => subElement.companyCode === this.companyCode),
                                    }),
                                );
                        }
                        if (this.writingNumbers.length === 1) {
                            this.commisionSplitForm.get("writingNumber").patchValue(this.writingNumbers[0].number);
                            this.sitCodes = this.writingNumbers[0].sitCodes;
                        } else {
                            this.sitCodeControl.disable();
                        }
                        if (this.sitCodes.length === 1) {
                            this.sitCodeControl.patchValue(this.sitCodes[0].id);
                        }
                    }
                    this.loadSpinner = false;
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                    this.loadSpinner = false;
                },
            );
    }
    /**
     * Function will populate the respective sit code based on the selected writing number
     * @param event Matselect change event comes after changing the writing number dropdown
     */
    mapSitCodeInDropdown(event: MatSelectChange): void {
        this.sitCodes = this.writingNumbers.filter((value) => value.number === event.value)[0].sitCodes;
        this.sitCodeControl.enable();
    }

    /**
     * Function will invoke after submitting the commision split form
     * and invoke API to update the commision split
     * @returns void
     */
    onSumbit(): void {
        if (this.commisionSplitForm.valid) {
            const assignment = [];
            assignment.push({
                sitCodeId: parseInt(this.sitCodeControl.value, PARSE_INT),
                percent: this.splitPercentage,
            });
            const custmizedSplitObject: CommissionSplit = {
                name: this.commissionName,
                assignments: assignment,
                rules: this.rules,
                conversion: this.conversion,
            };
            forkJoin([
                this.aflac.updateCommissionSplit(parseInt(this.mpGoupId, PARSE_INT), this.commissionId, custmizedSplitObject),
                this.aflac.respondToInvitation(parseInt(this.mpGoupId, PARSE_INT), this.rules[0]["producerId"], `"${ACTION.ACCEPT}"`),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.errorMessage = null;
                        this.tpiService.setStep(null);
                        if (this.producerId) {
                            this.router.navigate(["tpi/consent-statement"]);
                        } else {
                            this.router.navigate(["tpi/enrollment-method"]);
                        }
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                );
        }
    }

    /**
     * Function will map the error dynamically from DB based on the API error code and status
     * @param err error object return in case of failure of API
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        if (error.status === AppSettings.API_RESP_400 && error[DETAILS].length > 0) {
            for (const detail of error[DETAILS]) {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.commission.api.${error.status}.${error.code}.${detail.field}`,
                );
            }
        } else if (error.code === AppSettings.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.commission.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Function called on click of 'Exit' button
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
