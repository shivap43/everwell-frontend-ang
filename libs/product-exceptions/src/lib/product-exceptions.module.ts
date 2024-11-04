import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProductExceptionsComponent } from "./product-exceptions.component";
import { RouterModule } from "@angular/router";
import { NewExceptionComponent } from "./new-exception/new-exception.component";
import { SharedModule } from "@empowered/shared";
import { ViewExceptionComponent } from "./view-exception/view-exception.component";
import { EXCEPTIONS_ROUTES } from "./product-expections.route";
import { RemoveExceptionComponent } from "./remove-exception/remove-exception.component";
import { EditExceptionComponent } from "./edit-exception/edit-exception.component";
import { ReplaceTagPipe, LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        LanguageModule,
        RouterModule.forChild(EXCEPTIONS_ROUTES),
        SharedModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        ProductExceptionsComponent,
        NewExceptionComponent,
        ViewExceptionComponent,
        RemoveExceptionComponent,
        EditExceptionComponent,
    ],
    providers: [ReplaceTagPipe],
})
export class ProductExceptionsModule {}
