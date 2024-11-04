import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { BrandingState } from "./branding-state";

@NgModule({
    imports: [NgxsModule.forFeature([BrandingState])],
})
export class BrandingNgxsStoreModule {}
