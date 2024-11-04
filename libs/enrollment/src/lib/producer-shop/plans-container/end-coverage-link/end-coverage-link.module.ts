import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EndCoverageLinkComponent } from "./end-coverage-link.component";
import { LanguageModule } from "@empowered/language";

@NgModule({
    declarations: [EndCoverageLinkComponent],
    imports: [CommonModule, LanguageModule],
    exports: [EndCoverageLinkComponent],
})
export class EndCoverageLinkModule {}
