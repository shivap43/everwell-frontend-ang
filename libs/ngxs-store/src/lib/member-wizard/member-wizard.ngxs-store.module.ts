import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { MemberWizardState } from "./member-wizard.state";

@NgModule({
    imports: [NgxsModule.forFeature([MemberWizardState])],
})
export class MemberWizardNgxsStoreModule {}
