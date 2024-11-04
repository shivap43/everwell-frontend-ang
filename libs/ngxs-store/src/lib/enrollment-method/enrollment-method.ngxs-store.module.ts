import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentMethodState } from "./enrollment-method.state";

@NgModule({
    imports: [NgxsModule.forFeature([EnrollmentMethodState])],
})
export class EnrollmentMethodNGXSStoreModule {}
