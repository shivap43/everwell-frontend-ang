import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { CensusRoutingModule } from "./census-routing.module";
import { CensusComponent } from "./census.component";
import { UploadCensusComponent } from "./upload-census/upload-census.component";
import { CensusEstimateComponent } from "./census-estimate/census-estimate.component";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { UiModule, FilterSpousePipe } from "@empowered/ui";

@NgModule({
    declarations: [CensusComponent, UploadCensusComponent, CensusEstimateComponent],
    imports: [CommonModule, CensusRoutingModule, SharedModule, LanguageModule, UiModule],
    exports: [CensusComponent, UploadCensusComponent, CensusEstimateComponent],
    providers: [DatePipe, FilterSpousePipe],
})
export class CensusModule {}
