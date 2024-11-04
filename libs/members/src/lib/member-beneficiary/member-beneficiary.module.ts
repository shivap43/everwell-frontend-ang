import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "@empowered/shared";
import { BeneficiaryAddModule } from "./beneficiary-add/beneficiary-add.module";
import { BeneficiaryListComponent } from "./beneficiary-list/beneficiary-list.component";
import { MemberBeneficiaryRoutingModule } from "./member-beneficiary-routing.module";
import { LanguageModule } from "@empowered/language";
import { NgxMaskModule } from "ngx-mask";
import { NgxsModule } from "@ngxs/store";
import { UiModule } from "@empowered/ui";
import { MemberBeneficiaryListState, MemberBeneficiaryNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [BeneficiaryListComponent],
    imports: [
        CommonModule,
        MemberBeneficiaryRoutingModule,
        SharedModule,
        BeneficiaryAddModule,
        FormsModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        NgxsModule.forFeature([MemberBeneficiaryListState]),
        UiModule,
        MemberBeneficiaryNgxsStoreModule,
    ],
})
export class MemberBeneficiaryModule {}
