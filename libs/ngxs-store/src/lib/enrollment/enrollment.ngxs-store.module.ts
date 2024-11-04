import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentState } from "./enrollment.state";

@NgModule({
    imports: [NgxsModule.forFeature([EnrollmentState])],
})
export class EnrollmentNGXSStoreModule {}
