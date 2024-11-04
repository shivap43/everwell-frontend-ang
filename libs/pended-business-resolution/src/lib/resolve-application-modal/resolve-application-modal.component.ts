import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { UploadApplicationModalComponent } from "../upload-application-modal/upload-application-modal.component";
import { PendedBusinessByType, PendedBusinessService } from "@empowered/api";
import { PbrCommonService } from "../pbr-common.service";
import { PendedBusinessState, SharedState } from "@empowered/ngxs-store";
import { switchMap, takeUntil, filter } from "rxjs/operators";
import { PhoneNumber, CompanyCode, ProducerDetails, ToastType } from "@empowered/constants";
import { OpenToast, ToastModel } from "@empowered/ui";

export interface ResolveDialogData {
    applicationInfo: PendedBusinessByType;
    applicationDetails: any;
}
const stringConstant = {
    RESOLVED: "RESOLVED",
};

@Component({
    selector: "empowered-resolve-application-modal",
    templateUrl: "./resolve-application-modal.component.html",
    styleUrls: ["./resolve-application-modal.component.scss"],
})
export class ResolveApplicationModalComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<any>;
    resolvedApplicationForm: FormGroup;
    validationRegex: any;
    selectedMethod: string;
    isLoading = false;
    isResolvedApplication = false;
    languageStrings: Record<string, string>;
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly dialogRef: MatDialogRef<ResolveApplicationModalComponent>,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) readonly data: ResolveDialogData,
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly language: LanguageService,
        private readonly pbrCommonService: PbrCommonService,
        private readonly store: Store,
    ) {
        this.regex$.pipe(takeUntil(this.unsub$)).subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
        this.selectedMethod = "byEmail";
    }

    ngOnInit(): void {
        this.fetchLanguage();
        this.createFormControls();
        this.pbrCommonService.isUploadModalBack$.pipe(takeUntil(this.unsub$)).subscribe((value) => {
            if (!value) {
                this.dialogRef.close();
            }
        });
    }
    createFormControls(): void {
        this.resolvedApplicationForm = this.fb.group(
            {
                phoneNumber: [
                    this.data.applicationDetails.associateInfo[0].phoneNumber,
                    Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]),
                ],
                faxNumber: [""],
                comments: ["", Validators.required],
                emailSendToMe: [false],
            },
            { updateOn: "blur" },
        );
    }
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /**
     * Opens upload modal with application data and displays a toast based on submission result.
     */
    openUploadModal(): void {
        const dialogRef = this.dialog.open(UploadApplicationModalComponent, {
            width: "700px",
            data: {
                applicationDetails: this.data.applicationDetails,
                applicationInfo: this.data.applicationInfo,
                modalFrom: stringConstant.RESOLVED,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(
                filter((res) => res !== undefined),
                takeUntil(this.unsub$),
            )
            .subscribe((res) => {
                const toastModel: ToastModel = {
                    message:
                        res.type === ToastType.SUCCESS
                            ? this.language.fetchPrimaryLanguageValue("primary.portal.pendedBusiness.applicationSubmitted")
                            : this.language.fetchPrimaryLanguageValue("primary.portal.pendedBusiness.applicationUploadFailed"),
                    toastType: res.type === ToastType.SUCCESS ? ToastType.SUCCESS : ToastType.DANGER,
                };
                this.store.dispatch(new OpenToast(toastModel));
            });
    }

    onSubmit(): void {
        if (this.resolvedApplicationForm.valid) {
            this.isLoading = true;
            const resolveFormValues = this.resolvedApplicationForm.value;
            const requestParams = {
                applicationNumber: this.data.applicationDetails.applicationNumber,
                associateName: this.data.applicationDetails.associateInfo[0].associateName,
                phoneNumber: resolveFormValues.phoneNumber,
                faxNumber: resolveFormValues.faxNumber,
                comments: resolveFormValues.comments,
                emailResolution: true,
                uploadCompanyCode: this.data.applicationInfo.state === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US,
                appTypeIndicator: this.data.applicationInfo.appTypeIndicator,
                emailToMe: resolveFormValues.emailSendToMe,
            };
            this.producer$
                .pipe(
                    switchMap((producer) =>
                        this.pendedBusinessService.sendResolvedApplicationEmail(requestParams, producer && producer.id),
                    ),
                    takeUntil(this.unsub$),
                )
                .subscribe(
                    (response) => {
                        this.isResolvedApplication = true;
                        this.isLoading = false;
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                );
        } else {
            // eslint-disable-next-line guard-for-in
            for (const key in this.resolvedApplicationForm.controls) {
                this.resolvedApplicationForm.controls[key].markAsTouched();
            }
        }
    }

    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.gotIt",
            "primary.portal.common.submit",
            "primary.portal.common.back",
            "primary.portal.common.next",
            "primary.portal.common.of",
            "primary.portal.pendedBusiness.resolveApplicationModal.step",
            "primary.portal.pendedBusiness.resolveApplicationModal.resolveApplication",
            "primary.portal.pendedBusiness.resolveApplicationModal.emailNew",
            "primary.portal.pendedBusiness.resolveApplicationModal.uploadApplication",
            "primary.portal.pendedBusiness.resolveApplicationModal.applicationRequest1",
            "primary.portal.pendedBusiness.resolveApplicationModal.applicationRequest2",
            "primary.portal.pendedBusiness.resolveApplicationModal.from",
            "primary.portal.pendedBusiness.resolveApplicationModal.policy",
            "primary.portal.pendedBusiness.resolveApplicationModal.applicant",
            "primary.portal.pendedBusiness.resolveApplicationModal.phoneNumber",
            "primary.portal.pendedBusiness.resolveApplicationModal.faxNumber",
            "primary.portal.pendedBusiness.resolveApplicationModal.comments",
            "primary.portal.pendedBusiness.resolveApplicationModal.emailMe",
            "primary.portal.pendedBusiness.resolveApplicationModal.sentEmail1",
            "primary.portal.pendedBusiness.resolveApplicationModal.sentEmail2",
            "primary.portal.pendedBusiness.resolveApplicationModal.chooseMethod",
            "primary.portal.common.requiredField",
            "primary.portal.members.dependent.contact.invalidPhone",
            "primary.portal.common.cancel",
            "primary.portal.common.optional",
        ]);
    }

    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
