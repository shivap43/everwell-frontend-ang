import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ProducersComponent } from "./producers/producers.component";
import { RouterModule } from "@angular/router";
import { COMMISSIONS_ROUTES } from "./commissions.routes";
import { CommissionComponent } from "./commissions.component";
import { MatTableModule } from "@angular/material/table";
import { SharedModule, UiComponentsModule } from "@empowered/shared";
import { ChangeProducerRoleComponent } from "./producers/change-producer-role/change-producer-role.component";
import { AddMultipleProducersComponent } from "./producers/add-multiple-producers/add-multiple-producers.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { LanguageModule } from "@empowered/language";
import { AddUpdateCustmizedSplitComponent } from "./commission-splits/add-update-custmized-split/add-update-custmized-split.component";
import { CommissionSplitsComponent } from "./commission-splits/commission-splits.component";
import { NgxsModule } from "@ngxs/store";
import { MatTabsModule } from "@angular/material/tabs";
import { NgxMaskModule } from "ngx-mask";
import { DuplicateSplitFoundComponent } from "./duplicate-split-found/duplicate-split-found.component";
import { UiModule, MaterialModule, PhoneFormatConverterPipe } from "@empowered/ui";
import { CommissionsNgxsStoreModule, DashboardNgxsStoreModule, ProducerListNgxsStoreModule } from "@empowered/ngxs-store";
@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(COMMISSIONS_ROUTES),
        CommissionsNgxsStoreModule,
        MatTabsModule,
        MatCardModule,
        MatGridListModule,
        MatTableModule,
        MatExpansionModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        SharedModule,
        UiComponentsModule,
        LanguageModule,
        MaterialModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
        ProducerListNgxsStoreModule,
    ],
    declarations: [
        ProducersComponent,
        CommissionSplitsComponent,
        CommissionComponent,
        ChangeProducerRoleComponent,
        AddMultipleProducersComponent,
        AddUpdateCustmizedSplitComponent,
        DuplicateSplitFoundComponent,
    ],
    providers: [DatePipe, PhoneFormatConverterPipe],
    bootstrap: [CommissionComponent],
})
export class CommissionsModule {}
