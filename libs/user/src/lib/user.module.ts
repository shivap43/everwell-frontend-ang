import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { UserState } from "./+state/user.state";

@NgModule({
    imports: [NgxsModule.forFeature([UserState])],
})
export class UserModule {}
