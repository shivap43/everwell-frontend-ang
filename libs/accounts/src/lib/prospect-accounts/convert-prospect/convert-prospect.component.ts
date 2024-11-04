import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AflacService, AccountListService } from "@empowered/api";
import { MatStepper } from "@angular/material/stepper";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AddAccountList } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { AccountListComponent } from "../../account-list/account-list.component";
import { Router, ActivatedRoute } from "@angular/router";
import { UserState } from "@empowered/user";
import { switchMap, takeUntil } from "rxjs/operators";
import { FILTER_PARAMS } from "../../ag-import-form/ag-import-form.constant";
import { ClientErrorResponseCode, ClientErrorResponseType, CompanyCode, AppSettings } from "@empowered/constants";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-convert-prospect",
    templateUrl: "./convert-prospect.component.html",
    styleUrls: ["./convert-prospect.component.scss"],
})
export class ConvertProspectComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospects.convertProspectName",
        "primary.portal.prospects.convert",
        "primary.portal.prospects.converttoAccount",
        "primary.portal.prospects.stepOne",
        "primary.portal.prospects.searchbyAccountnumber",
        "primary.portal.prospects.accountName",
        "primary.portal.prospects.account",
        "primary.portal.prospects.aboutLink",
        "primary.portal.prospects.stepTwo",
        "primary.portal.prospects.producetsWritingno",
        "primary.portal.prospects.writingNumber",
        "primary.portal.prospects.sitCode",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.selectionRequired",
        "primary.portal.prospect.accountNumberRequired",
        "primary.portals.accounts.importAccount.errors.getAflacAccount.generic",
        "primary.portal.prospects.selectProducername",
        "primary.portals.accounts.importAccount.about.precallWorksheet.link",
        "primary.portals.accounts.importAccount.about.NASSA.link",
        "primary.portals.accounts.importAccount.about.learnMoreNASSA",
        "primary.portals.accounts.importAccount.about.NASSA.infoPart1",
        "primary.portals.accounts.importAccount.about.NASSA.infoPart2",
        "primary.portals.accounts.importAccount.about.title",
        "primary.portals.accounts.importAccount.about.infoPart1",
        "primary.portals.accounts.importAccount.about.infoPart2",
        "primary.portals.accounts.importAccount.NASSA.email",
        "primary.portals.accounts.importAccount.NASSA.email.subject",
        "primary.portals.accounts.importAccount.about.precallWorksheetView",
        "primary.portals.accounts.importAccount.about.startNASSA",
        "primary.portal.common.select",
        "primary.portal.prospects.warningMessage",
        "primary.portal.prospects.differentProspect",
        "primary.portal.common.close",
        "primary.portals.accounts.importAccount.errors.invalidGroupNumber",
    ]);
    SearchAccountForm: FormGroup;
    convertForm: FormGroup;
    account: any;
    errorMessage: string;
    errorMessageDisplay: string;
    producerId: string;
    MpGroup: number;
    writtingNumber = [];
    sitCode = [];
    producerName;
    fieldError;
    groupNumber: string;
    mpGroup: number;
    requestBody = {};
    loadSpinner = false;
    accountListComponentInstance: AccountListComponent;
    state: CompanyCode;
    accountNumber: string;
    prospectName: string;
    loggedInProducerId: any;
    warningMessage = false;
    address: any;
    errorString = "";
    nameConst = "name";
    cityConst = "city";
    stateConst = "state";
    nextStep = true;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly aflac: AflacService,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly accountListService: AccountListService,
    ) {}

    ngOnInit(): void {
        this.loggedInProducerId = this.store.selectSnapshot(UserState).producerId;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.prospects.*"));
        this.setMatData();
        this.mapFormFields();
        this.getWarningMessage();
    }
    mapFormFields(): void {
        // search form step 1
        this.SearchAccountForm = this.fb.group({
            accountNumber: [""],
        });
        this.convertForm = this.fb.group({
            writingNumber: [""],
            sitCode: [""],
        });
        this.convertForm.controls.sitCode.disable();
    }
    /**
     * This function is for searching aflac account and compare with prospect account
     */
    searchAflacAccount(): void {
        if (this.SearchAccountForm.controls.accountNumber.value.length === AppSettings.MAX_LENGTH_5) {
            this.account = null;
            this.errorMessage = null;
            this.groupNumber = this.SearchAccountForm.controls.accountNumber.value;
            this.loadSpinner = true;
            this.nextStep = true;
            this.aflac
                .getAflacAccount(this.SearchAccountForm.controls.accountNumber.value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.account = response.body;
                        this.loadSpinner = false;
                        if (this.account.name && this.prospectName && this.account.name.toLowerCase() !== this.prospectName.toLowerCase()) {
                            this.errorString = this.errorString.concat(this.nameConst);
                            this.errorMessage = this.languageStrings["primary.portal.prospects.differentProspect"];
                            this.errorMessage = this.errorMessage.replace("##errorString##", this.errorString);
                        }
                        if (
                            this.account.primaryContact.address.state &&
                            this.address.state &&
                            this.account.primaryContact.address.state.toLowerCase() !== this.address.state.toLowerCase()
                        ) {
                            if (this.errorString) {
                                this.stateConst = "/" + this.stateConst;
                            }
                            this.errorString = this.errorString.concat(this.stateConst);
                            this.errorMessage = this.languageStrings["primary.portal.prospects.differentProspect"];
                            this.errorMessage = this.errorMessage.replace("##errorString##", this.errorString);
                        }
                        if (
                            this.account.primaryContact.address.city &&
                            this.address.city &&
                            this.account.primaryContact.address.city.toLowerCase() !== this.address.city.toLowerCase()
                        ) {
                            if (this.errorString) {
                                this.cityConst = "/" + this.cityConst;
                            }
                            this.errorString = this.errorString.concat(this.cityConst);
                            this.errorMessage = this.languageStrings["primary.portal.prospects.differentProspect"];
                            this.errorMessage = this.errorMessage.replace("##errorString##", this.errorString);
                        }
                        if (this.errorString) {
                            this.nextStep = false;
                            this.account = null;
                        }
                        this.errorString = "";
                        this.nameConst = "name";
                        this.cityConst = "city";
                        this.stateConst = "state";
                    },
                    (error) => {
                        switch (error.error.status) {
                            case ClientErrorResponseCode.RESP_400:
                                this.SearchAccountForm.controls.accountNumber.setErrors({ invalid: true });
                                if (error.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                                    this.fieldError = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.badParameter");
                                }
                                if (error.error.code === ClientErrorResponseType.MISSING_PARAMETER) {
                                    this.fieldError = this.language.fetchSecondaryLanguageValue(
                                        "secondary.portal.prospects.missingParameter",
                                    );
                                }
                                if (!this.SearchAccountForm.controls.accountNumber.value) {
                                    this.fieldError = this.languageStrings["primary.portal.prospect.accountNumberRequired"];
                                }
                                break;
                            case ClientErrorResponseCode.RESP_409:
                                if (error.error.code === ClientErrorResponseType.DUPLICATE) {
                                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.duplicate");
                                }
                                if (error.error.code === ClientErrorResponseType.SELF_DUPLICATE) {
                                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.duplicate");
                                }
                                if (error.error.code === ClientErrorResponseType.INVALID_STATE) {
                                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                                        "secondary.portal.prospects.invalidState",
                                    );
                                }
                                break;
                            case ClientErrorResponseCode.RESP_403:
                                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.notPermitted");
                                break;
                            default:
                                this.errorMessage = this.language.fetchPrimaryLanguageValue(
                                    "primary.portals.accounts.importAccount.errors.getAflacAccount.generic",
                                );
                        }
                        this.loadSpinner = false;
                    },
                );
        } else {
            this.errorMessage = null;
            this.SearchAccountForm.controls.accountNumber.setErrors({ invalid: true });
            this.fieldError = this.languageStrings["primary.portals.accounts.importAccount.errors.invalidGroupNumber"];
        }
    }

    setMatData(): void {
        this.mpGroup = this.data.groupNumber;
        this.producerId = this.data.producerId;
        this.state = this.data.state;
        this.accountNumber = this.data.accountNumber;
        this.producerName = this.data.producerName.firstName + " " + this.data.producerName.lastName;
        this.prospectName = this.data.prospectName;
        this.address = this.data.address;
    }

    getWrittingNumberSitCode(): void {
        this.writtingNumber = this.data.writingNumber;
        if (this.writtingNumber.length === 1) {
            this.setWrittingNumber();
        }
    }
    // on selection change setting the sit code
    onchange(): void {
        this.convertForm.controls.sitCode.enable();
        this.writtingNumber.forEach((index) => {
            if (index.number === this.convertForm.controls.writingNumber.value) {
                this.sitCode = index.sitCodes;
            }
        });
        if (this.sitCode.length === 1) {
            this.setSitCode();
        }
    }
    setSitCode(): void {
        this.convertForm.patchValue({
            sitCode: this.sitCode[0].id,
        });
    }
    goForward(step: MatStepper): void {
        this.convertForm.controls.sitCode.updateValueAndValidity();
        this.errorMessage = null;
        this.fieldError = null;
        if (this.SearchAccountForm.controls.accountNumber.valid && this.account && this.nextStep) {
            step.next();
            this.getWrittingNumberSitCode();
            this.SearchAccountForm.reset();
        } else {
            this.SearchAccountForm.controls.accountNumber.reset();
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.search");
        }
    }
    goBack(step: MatStepper): void {
        this.convertForm.controls.writingNumber.clearValidators();
        this.convertForm.controls.sitCode.clearValidators();
        this.convertForm.controls.sitCode.updateValueAndValidity();
        this.account = null;
        this.convertForm.reset();
        step.previous();
    }
    setWrittingNumber(): void {
        this.convertForm.patchValue({
            writingNumber: this.writtingNumber[0].number,
        });
        this.onchange();
    }
    /**
     * to convert prospect to account and to land on dashboard
     */
    convertAccount(): void {
        if (!this.accountNumber) {
            this.convertForm.controls.writingNumber.setValidators(Validators.required);
            this.convertForm.controls.writingNumber.updateValueAndValidity();
            this.convertForm.controls.sitCode.setValidators(Validators.required);
            this.convertForm.controls.sitCode.updateValueAndValidity();
        }
        if (this.convertForm.valid || this.accountNumber) {
            this.requestBody = {
                groupNumber: this.groupNumber,
                sitCodeId: this.convertForm.controls.sitCode.value,
            };
            this.loadSpinner = true;
            this.aflac
                .convertAflacProspectToAccount(this.mpGroup, this.accountNumber ? null : this.requestBody)
                .pipe(
                    switchMap((response) => this.accountListService.listAccounts(FILTER_PARAMS)),
                    switchMap((resp) => this.store.dispatch(new AddAccountList(resp))),
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.loadSpinner = false;
                        this.dialog.closeAll();
                        this.router.navigate([`producer/payroll/${this.mpGroup}/dashboard`], {
                            relativeTo: this.activatedRoute,
                        });
                    },
                    (error) => {
                        this.loadSpinner = false;
                        if (error.error.status === ClientErrorResponseCode.RESP_403) {
                            this.errorMessageDisplay = this.language.fetchSecondaryLanguageValue("secondary.portal.prospects.notPermitted");
                        } else {
                            this.errorMessageDisplay = this.language.fetchSecondaryLanguageValue(
                                "secondary.portal.prospects.conversionFailed",
                            );
                        }
                    },
                );
        }
    }
    close(): void {
        this.dialog.closeAll();
    }
    moveToAbout(step: MatStepper): void {
        step.selectedIndex = step.selectedIndex + 2;
        step.next();
    }
    moveBackToConvert(step: MatStepper): void {
        step.selectedIndex = step.selectedIndex - 2;
        step.previous();
    }
    getWarningMessage(): void {
        if (this.producerId.toString() !== this.loggedInProducerId.toString()) {
            this.warningMessage = true;
        }
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
