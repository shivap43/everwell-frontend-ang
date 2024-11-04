import { RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MemberHomeComponent } from "./member-home.component";
import { MEMBER_HOME_ROUTES } from "./member-home.routes";
import { SharedModule } from "@empowered/shared";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { NgxsModule } from "@ngxs/store";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { ShopQleCoveragePopupComponent } from "./shop-qle-coverage-popup/shop-qle-coverage-popup.component";
import { UiModule } from "@empowered/ui";
import { DualPlanYearNGXSStoreModule, MemberHomeState, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [MemberHomeComponent, ShopQleCoveragePopupComponent],
    imports: [
        RouterModule.forChild(MEMBER_HOME_ROUTES),
        SharedModule,
        MatDialogModule,
        MatMenuModule,
        MatButtonModule,
        MatNativeDateModule,
        MatIconModule,
        MatSidenavModule,
        MatListModule,
        MatToolbarModule,
        LanguageModule,
        NgxsModule.forFeature([MemberHomeState]),
        CommonModule,
        UiModule,
        DualPlanYearNGXSStoreModule,
        DashboardNgxsStoreModule,
    ],
    providers: [ReplaceTagPipe],
})
export class MemberHomeModule {}
