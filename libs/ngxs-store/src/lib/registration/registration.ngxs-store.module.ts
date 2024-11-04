import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { RegistrationState } from "./registration.state";

@NgModule({
    imports: [NgxsModule.forFeature([RegistrationState])],
})
export class RegistrationNGXSStoreModule {}
