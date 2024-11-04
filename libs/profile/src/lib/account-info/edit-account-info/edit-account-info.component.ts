import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { StaticService, State, AccountService } from "@empowered/api";
import { AccountNameUpdateService } from "@empowered/common-services";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { ClientErrorResponseCode, AppSettings, Accounts, AccountInformation, AdminRoles } from "@empowered/constants";
import { AddAccountInfo, SharedState, RegexDataType } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-edit-account-info",
    templateUrl: "./edit-account-info.component.html",
    styleUrls: ["./edit-account-info.component.scss"],
})
export class EditAccountInfoComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    accountInfoForm: FormGroup;
    states: State[];
    accountDetails: Accounts;
    isAdmin: boolean;
    isProducer: boolean;
    langStrings: Record<string, string>;
    showErrorMessage = false;
    errorMessage = null;
    validationRegex: RegexDataType;
    subscriber: Subscription[] = [];
    role: AdminRoles;
    isRole12 = false;
    allowNameEdit = false;
    allowSitusEdit = false;
    isSameName = false;
    nameWithHypenApostrophesValidation: any;

    constructor(
        private readonly dialogRef: MatDialogRef<EditAccountInfoComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly accountNameUpdate: AccountNameUpdateService,
    ) {
        this.getStates();
        this.fetchLanguageStrings();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * This function is used to initialize all the values and functions at the time of component loading.
     * @returns void
     */
    ngOnInit(): void {
        this.isAdmin = this.data.isAdmin;
        this.isProducer = this.data.isProducer;
        this.allowNameEdit = this.data.allowNameEdit;
        this.allowSitusEdit = this.data.allowSitusEdit;
        this.accountDetails = this.data.accountDetails;
        this.role = this.data.role;
        this.isSameName = false;
        this.isRole12 = this.role && this.role.id ? this.role.id === AppSettings.ROLE_ID_12 : false;
        this.subscriber.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                    this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
                }
            }),
        );
        this.accountInfoForm = this.fb.group(
            {
                accountName: [
                    { value: "", disabled: this.isProducer && !this.allowNameEdit },
                    Validators.compose([
                        Validators.pattern(new RegExp(this.validationRegex.ACCOUNT_NAME)),
                        Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        Validators.required,
                    ]),
                ],
                accountNumber: [{ value: "", disabled: true }, Validators.required],
                situsState: [{ value: "", disabled: this.isAdmin || this.isRole12 || !this.allowSitusEdit }, Validators.required],
                situsZip: [
                    { value: "", disabled: this.isAdmin || this.isRole12 || !this.allowSitusEdit },
                    [Validators.required, Validators.pattern(new RegExp(this.validationRegex.ZIP_LENGTH))],
                ],
            },
            { updateOn: "blur" },
        );
        const details = {
            accountName: this.accountDetails.name,
            accountNumber: this.accountDetails.accountNumber,
            situsState: this.accountDetails.situs.state.abbreviation,
            situsZip: this.accountDetails.situs.zip,
        };
        this.accountInfoForm.patchValue(details);
    }
    getStates(): void {
        this.subscriber.push(
            this.staticService.getStates().subscribe((states) => {
                this.states = states;
            }),
        );
    }

    closePopup(): void {
        this.dialogRef.close();
    }
    /**
     * @description for saving account details
     * @returns void
     */
    save(): void {
        this.hideErrorAlertMessage();
        if (this.accountInfoForm.valid) {
            const values = this.accountInfoForm.getRawValue();
            const details: AccountInformation = {
                id: this.accountDetails.id,
                name: values.accountName,
                accountNumber: this.accountDetails.accountNumber,
                primaryContact: this.accountDetails.primaryContact,
                situs: {
                    state: {
                        abbreviation: values.situsState,
                        name: this.states.find((x) => x.abbreviation === values.situsState).name,
                    },
                    zip: values.situsZip,
                },
                type: this.accountDetails.type,
                importType: this.accountDetails.importType,
            };
            this.accountNameUpdate.accountName$.next(details.name);
            this.store.dispatch(
                new AddAccountInfo({
                    accountInfo: details,
                    mpGroupId: this.data.mpGroupId.toString(),
                }),
            );
            this.subscriber.push(
                this.accountService.updateAccount(this.data.mpGroupId, details).subscribe(
                    (Response) => {
                        this.dialogRef.close(true);
                    },
                    (Error) => {
                        this.showErrorAlertMessage(Error);
                    },
                ),
            );
        }
    }
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err["error"];
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            if (error["details"][0].code === "zip.stateMismatch") {
                this.showMismMtchStateError();
                return;
            }
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.profile.editAccountInfo.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }
    showMismMtchStateError(): void {
        this.accountInfoForm.get("situsZip").setErrors({ mismatch: true });
    }
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.profile.editAccountInfo.title",
            "primary.portal.profile.editAccountInfo.accountName",
            "primary.portal.profile.editAccountInfo.accountNumber",
            "primary.portal.profile.editAccountInfo.situs",
            "primary.portal.profile.editAccountInfo.zip",
            "primary.portal.profile.editAccountInfo.info.sameName",
            "primary.portal.common.close",
            "primary.portal.common.save",
            "primary.portal.common.cancel",
        ]);
    }
    checkForSameName(): void {
        this.isSameName = false;
        if (this.data.isAccountNameAndContactSame) {
            this.isSameName = true;
        }
    }
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
