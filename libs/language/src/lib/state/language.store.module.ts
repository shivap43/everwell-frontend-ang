import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { LanguageState } from "./language.state"; // <-- migrated state

@NgModule({
    imports: [NgxsModule.forFeature([LanguageState])], // <-- import feature
})
export class LanguageStoreModule {}
