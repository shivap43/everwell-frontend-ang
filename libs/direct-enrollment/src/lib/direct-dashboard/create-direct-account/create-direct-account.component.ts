import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SharedState } from "@empowered/ngxs-store";
import { WritingNumber, UserPermissionList } from "@empowered/constants";
import { Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { filter, tap } from "rxjs/operators";

enum ProducerState {
    NY = "NY",
    US = "US",
}
interface CreatePoPUpResponse {
    cancel?: boolean;
    create?: boolean;
    back?: boolean;
    usSitCodeId?: number;
    nySitCodeId?: number;
}
export interface CreateDirectAccountDialogData {
    usSitCodes: WritingNumber[];
    nySitCodes: WritingNumber[];
}

enum CreateFormResponse {
    CREATE = "CREATE",
    CANCEL = "CANCEL",
    BACK = "BACK",
}

@Component({
    selector: "empowered-create-direct-account",
    templateUrl: "./create-direct-account.component.html",
    styleUrls: ["./create-direct-account.component.scss"],
})
export class CreateDirectAccountComponent implements OnInit, OnDestroy {
    createDirectAccountFormGroup: FormGroup;
    sitCodeGroup: FormGroup;
    producerInfo;
    isLoading = false;
    CreateFormResponse = CreateFormResponse;
    usSitCodes;
    nySitCodes;
    ProducerState = ProducerState;
    subscriptions: Subscription[] = [];

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.direct.directSales.welcome",
        "primary.portal.direct.directSales.welcomeDescription",
        "primary.portal.direct.directSales.usWritingNo",
        "primary.portal.direct.directSales.usSitcode",
        "primary.portal.direct.directSales.nyWritingNo",
        "primary.portal.direct.directSales.nySitcode",
        "primary.portal.common.cancel",
        "primary.portal.common.close",
        "primary.portal.common.save",
        "primary.portal.common.select",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.back",
        "primary.portal.direct.directSales.welcomeDescriptionUsSitCodes",
        "primary.portal.direct.directSales.welcomeDescriptionNySitCodes",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly matDialogRef: MatDialogRef<CreateDirectAccountComponent>,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) readonly data: CreateDirectAccountDialogData,
    ) {}

    ngOnInit(): void {
        this.CreateFormFields();
    }
    CreateFormFields(): void {
        this.createDirectAccountFormGroup = this.fb.group({});
        if (this.data.nySitCodes && this.data.nySitCodes.length > 0) {
            this.createDirectAccountFormGroup.addControl(
                ProducerState.NY,
                this.fb.group({
                    writingNumber: [this.data.nySitCodes.length === 1 ? this.data.nySitCodes[0] : null, Validators.required],
                    nySitCodeId: ["", Validators.required],
                }),
            );
            if (this.data.nySitCodes.length > 1) {
                this.createDirectAccountFormGroup.get(ProducerState.NY).get("nySitCodeId").disable();
            } else {
                this.enableNySitCodes();
            }
        }
        if (this.data.usSitCodes && this.data.usSitCodes.length > 0) {
            this.createDirectAccountFormGroup.addControl(
                ProducerState.US,
                this.fb.group({
                    writingNumber: [this.data.usSitCodes.length === 1 ? this.data.usSitCodes[0] : null, Validators.required],
                    usSitCodeId: ["", Validators.required],
                }),
            );
            if (this.data.usSitCodes.length > 1) {
                this.createDirectAccountFormGroup.get(ProducerState.US).get("usSitCodeId").disable();
            } else {
                this.enableUsSitCodes();
            }
        }
    }

    /**
     * Function to assign sitCodes based on selected US writing number
     */
    enableUsSitCodes(): void {
        this.usSitCodes = this.createDirectAccountFormGroup.get(ProducerState.US).get("writingNumber").value.sitCodes;
        const sitCodeControl = this.createDirectAccountFormGroup.get(ProducerState.US).get("usSitCodeId");
        sitCodeControl.enable();
        if (this.usSitCodes.length === 1) {
            sitCodeControl.setValue(this.usSitCodes[0].id);
        }
    }

    /**
     * Function to assign sitCodes based on selected NY writing number
     */
    enableNySitCodes(): void {
        this.nySitCodes = this.createDirectAccountFormGroup.get(ProducerState.NY).get("writingNumber").value.sitCodes;
        const sitCodeControl = this.createDirectAccountFormGroup.get(ProducerState.NY).get("nySitCodeId");
        sitCodeControl.enable();
        if (this.nySitCodes.length === 1) {
            sitCodeControl.setValue(this.nySitCodes[0].id);
        }
    }

    /**
     * Function to check form validation and close popup
     */
    onSubmit(): void {
        if (this.createDirectAccountFormGroup.invalid) {
            return;
        }
        this.isLoading = true;
        this.close(CreateFormResponse.CREATE);
    }
    close(responseType: string): void {
        if (responseType === CreateFormResponse.CANCEL) {
            const createPoPUpResponse: CreatePoPUpResponse = {
                create: false,
                cancel: true,
            };
            this.matDialogRef.close(createPoPUpResponse);
            // if user doesn't have permission for payroll and has not set up for direct account.
            // User will be logout if close the pop up.
            this.subscriptions.push(
                this.store
                    .select(SharedState.hasPermission(UserPermissionList.PAYROLL))
                    .pipe(
                        filter((permission) => !permission),
                        tap((permission) => this.router.navigate(["producer/login"])),
                    )
                    .subscribe(),
            );
        } else if (responseType === CreateFormResponse.CREATE) {
            this.matDialogRef.close(this.getCreateResponseObject());
        }
    }

    getCreateResponseObject(): CreatePoPUpResponse {
        return {
            create: true,
            nySitCodeId:
                this.data.nySitCodes && this.data.nySitCodes.length > 0
                    ? this.createDirectAccountFormGroup.get(ProducerState.NY).get("nySitCodeId").value
                    : null,
            usSitCodeId:
                this.data.usSitCodes && this.data.usSitCodes.length > 0
                    ? this.createDirectAccountFormGroup.get(ProducerState.US).get("usSitCodeId").value
                    : null,
        };
    }
    backToSearchProducer(): void {
        const createPoPUpResponse: CreatePoPUpResponse = {
            back: true,
        };
        this.matDialogRef.close(createPoPUpResponse);
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
