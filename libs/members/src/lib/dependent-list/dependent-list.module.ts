import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DependentListRoutingModule } from "./dependent-list-routing.module";
import { DependentListComponent } from "./dependent-list.component";
import { SharedModule } from "@empowered/shared";
import { DependentAddModule } from "../dependent-add";
import { FormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { NgxMaskModule } from "ngx-mask";
import { NgxsModule } from "@ngxs/store";
import { RemoveDependentComponent } from "./remove-dependent/remove-dependent.component";
import { UiModule } from "@empowered/ui";
import { DependentListState, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [DependentListComponent, RemoveDependentComponent],
    imports: [
        CommonModule,
        DependentListRoutingModule,
        SharedModule,
        DependentAddModule,
        FormsModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        NgxsModule.forFeature([DependentListState]),
        UiModule,
        DashboardNgxsStoreModule,
    ],
    exports: [RemoveDependentComponent],
})
export class DependentListModule {}
