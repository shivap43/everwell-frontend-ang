import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { ContactInfoComponent } from "./contact-info/contact-info.component";
import { MemberAddComponent } from "./member-add.component";
import { MEMBER_ADD_ROUTES } from "./member-add.routes";
import { PersonalInfoComponent } from "./personal-info/personal-info.component";
import { WorkInfoComponent } from "./work-info/work-info.component";
import { WorkSalaryPopupComponent } from "./work-info/work-salary-popup/work-salary-popup.component";
import { WorkClassPopupComponent } from "./work-info/work-class-popup/work-class-popup.component";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CommonModule, DatePipe } from "@angular/common";
import { ContactInfoPopupComponent } from "./contact-info/contact-info-popup/contact-info-popup.component";
import { NgxsModule } from "@ngxs/store";
import { LanguageModule } from "@empowered/language";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { NgxMaskModule } from "ngx-mask";
import { DropVasCoverageComponent } from "./drop-vas-coverage/drop-vas-coverage.component";
import { UiModule, PhoneFormatConverterPipe } from "@empowered/ui";
import { MemberInfoState, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        MemberAddComponent,
        WorkInfoComponent,
        PersonalInfoComponent,
        ContactInfoComponent,
        WorkSalaryPopupComponent,
        WorkClassPopupComponent,
        ContactInfoPopupComponent,
        DropVasCoverageComponent,
    ],
    imports: [
        RouterModule.forChild(MEMBER_ADD_ROUTES),
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        CommonModule,
        MatFormFieldModule,
        MatCheckboxModule,
        NgxsModule.forFeature([MemberInfoState]),
        LanguageModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
    ],
    providers: [DatePipe, PhoneFormatConverterPipe],
})
export class MemberAddModule {}
