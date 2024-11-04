import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { TpiPdaRoutingModule } from "./tpi-pda-routing.module";
import { TpiPdaComponent } from "./tpi-pda.component";
import { SharedModule } from "@empowered/shared";
import { TpiPdaFormComponent } from "./tpi-pda-form/tpi-pda-form.component";
import { TpiPdaViewComponent } from "./tpi-pda-view/tpi-pda-view.component";
import { ReplaceTagPipe, LanguageModule } from "@empowered/language";
import { NgxMaskModule } from "ngx-mask";
import { TpiSecondaryHeaderComponent } from "../tpi-main/tpi-secondary-header/tpi-secondary-header.component";
import { UiModule } from "@empowered/ui";
import { EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [TpiPdaComponent, TpiPdaFormComponent, TpiPdaViewComponent, TpiSecondaryHeaderComponent],
    imports: [
        CommonModule,
        TpiPdaRoutingModule,
        SharedModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        UiModule,
        EnrollmentMethodNGXSStoreModule,
    ],
    exports: [TpiSecondaryHeaderComponent],
    providers: [LanguageModule, ReplaceTagPipe],
})
export class TpiPdaModule {}
