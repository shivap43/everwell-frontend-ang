import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentOptionsState } from "./enrollment-options.state";

@NgModule({
    imports: [NgxsModule.forFeature([EnrollmentOptionsState])],
})
export class EnrollmentOptionsNGXSStoreModule {}
