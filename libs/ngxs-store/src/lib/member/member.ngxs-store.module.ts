import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { MemberBeneficiary } from "./member.state";

@NgModule({
    imports: [NgxsModule.forFeature([MemberBeneficiary])],
})
export class MemberBeneficiaryNgxsStoreModule {}
