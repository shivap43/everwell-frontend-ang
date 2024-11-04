import { LanguageModule } from "@empowered/language";
import { MatIconModule } from "@angular/material/icon";
import { EmpStepperModule } from "@empowered/emp-stepper";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ACCOUNT_BRANDING_ROUTES } from "./branding.routes";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BrandingColorFormComponent } from "./forms/branding-color-form/branding-color-form.component";
import { BrandingLogoFormComponent } from "./forms/branding-logo-form/branding-logo-form.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { BrandingLogoComponent } from "./branding-logo/branding-logo.component";
import { NgxDropzoneModule } from "ngx-dropzone";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { BrandingModalDeleteComponent } from "./modals/branding-modal-delete/branding-modal-delete.component";
import { BrandingModalExitComponent } from "./modals/branding-modal-exit/branding-modal-exit.component";
import { BrandingModalReplaceComponent } from "./modals/branding-modal-replace/branding-modal-replace.component";
import { Ng2FittextModule } from "ng2-fittext";
import { EditBrandingComponent } from "./edit-branding/edit-branding.component";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";
import { HexColorInputComponent } from "./inputs/hex-color-input/hex-color-input.component";
import { BrandingNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        BrandingColorFormComponent,
        BrandingLogoFormComponent,
        BrandingLogoComponent,
        BrandingModalDeleteComponent,
        BrandingModalExitComponent,
        BrandingModalReplaceComponent,
        EditBrandingComponent,
        HexColorInputComponent,
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(ACCOUNT_BRANDING_ROUTES),
        BrandingNgxsStoreModule,
        FormsModule,
        ReactiveFormsModule,
        Ng2FittextModule,
        MatFormFieldModule,
        MatSelectModule,
        MatGridListModule,
        MatInputModule,
        MatRadioModule,
        NgxDropzoneModule,
        MatDividerModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        EmpStepperModule,
        LanguageModule,
        SharedModule,
        UiModule,
    ],
    exports: [BrandingLogoComponent],
})
export class AccountBrandingModule {
    constructor() {}
}
