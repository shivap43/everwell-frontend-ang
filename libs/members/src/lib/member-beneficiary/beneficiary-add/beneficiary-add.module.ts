import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "@empowered/shared";
import { BeneficiaryEditComponent } from "./beneficiary-edit/beneficiary-edit.component";
import { LanguageModule } from "@empowered/language";
import { NgxMaskModule } from "ngx-mask";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [BeneficiaryEditComponent],
    imports: [CommonModule, SharedModule, FormsModule, LanguageModule, NgxMaskModule.forRoot(), UiModule],
    exports: [BeneficiaryEditComponent],
})
export class BeneficiaryAddModule {}
