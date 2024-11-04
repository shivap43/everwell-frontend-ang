import { SharedModule } from "@empowered/shared";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { CommonModule } from "@angular/common";
import { REVIEW_ENROLLMENTS_ROUTES } from "./review-enrollments.route";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [SharedModule, RouterModule.forChild(REVIEW_ENROLLMENTS_ROUTES), LanguageModule, CommonModule, UiModule],
    declarations: [],
})
export class ReviewEnrollmentsModule {}
