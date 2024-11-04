import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { BusinessState } from "./account-enrollments.state";

@NgModule({
    imports: [NgxsModule.forFeature([BusinessState])],
})
export class AccountEnrollmentsNGXSStoreModule {}
