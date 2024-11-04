import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { ReactiveFormsModule } from "@angular/forms";
import { NotEligibleDialogComponent } from "./not-eligible-dialog/not-eligible-dialog.component";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { KnockoutQuestionsDialogComponent } from "./knockout-questions-dialog/knockout-questions-dialog.component";
import { UiModule, MaterialModule } from "@empowered/ui";

/**
 * @export
 * @class KnockoutQuestionsModule
 */
@NgModule({
    declarations: [NotEligibleDialogComponent, KnockoutQuestionsDialogComponent],
    imports: [CommonModule, MaterialModule, SharedModule, ReactiveFormsModule, LanguageModule, UiModule],
    exports: [NotEligibleDialogComponent, KnockoutQuestionsDialogComponent],
    providers: [ReplaceTagPipe],
})
export class KnockoutQuestionsModule {}
