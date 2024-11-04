import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { LanguageModule } from "@empowered/language";
import { FooterComponent } from "./footer.component";
import { ExitSiteComponent } from "./exit-site/exit-site.component";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [RouterModule, LanguageModule, SharedModule, UiModule],
    declarations: [FooterComponent, ExitSiteComponent],
    exports: [FooterComponent],
})
export class FooterModule {}
