import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LanguageModule } from "@empowered/language";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxsModule } from "@ngxs/store";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { A11yModule } from "@angular/cdk/a11y";
import { UiModule, MaterialModule } from "@empowered/ui";

@NgModule({
    imports: [CommonModule, MaterialModule, LanguageModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, A11yModule, UiModule],
    declarations: [],
    exports: [],
})
export class UiComponentsModule {}
