import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTreeModule } from "@angular/material/tree";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { BrandingComponent } from "./branding/branding.component";
import { FooterModule } from "./footer/footer.module";
import { HeaderNavComponent } from "./header-nav/header-nav.component";
import { SideNavComponent } from "./side-nav/side-nav.component";
import { SharedModule } from "@empowered/shared";
import { HeaderComponent } from "./header/header.component";
import { AccountBrandingModule } from "@empowered/branding";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatBadgeModule,
        MatButtonModule,
        MatListModule,
        MatMenuModule,
        LanguageModule,
        MatTreeModule,
        SharedModule,
        AccountBrandingModule,
        UiModule,
    ],
    declarations: [HeaderNavComponent, BrandingComponent, SideNavComponent, HeaderComponent],
    exports: [
        FooterModule,
        BrandingComponent,
        HeaderNavComponent,
        MatIconModule,
        MatSidenavModule,
        CommonModule,
        MatButtonModule,
        SideNavComponent,
        HeaderComponent,
    ],
})
export class LayoutModule {}
