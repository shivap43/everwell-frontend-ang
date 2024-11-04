import { SharedModule } from "@empowered/shared";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { RIVIEW_HEADSET_ENROLLMENT_ROUTES } from "./review-headset-enrollment.route";
import { LanguageModule } from "@empowered/language";
import { CommonModule } from "@angular/common";
import { NgxsModule } from "@ngxs/store";
import { MemberInfoState } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(RIVIEW_HEADSET_ENROLLMENT_ROUTES),
        LanguageModule,
        CommonModule,
        NgxsModule.forFeature([MemberInfoState]),
    ],
    declarations: [],
})
export class ReviewHeadsetEnrollmentModule {}
