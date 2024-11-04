import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AflacFormsRepositoryComponent } from "./aflac-forms-repository.component";
import { AflacFormsFiltersComponent } from "./aflac-forms-filters/aflac-forms-filters.component";
import { AflacFormsListComponent } from "./aflac-forms-list/aflac-forms-list.component";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";
@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        LanguageModule,
        RouterModule.forChild([{ path: "", component: AflacFormsRepositoryComponent }]),
        UiModule,
    ],
    declarations: [AflacFormsRepositoryComponent, AflacFormsFiltersComponent, AflacFormsListComponent],
})
export class AflacFormsRepositoryModule {}
