import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { MemberHomeState } from "./member-home.state"; // <-- migrated state

@NgModule({
    imports: [NgxsModule.forFeature([MemberHomeState])], // <-- import feature
})
export class MemberHomeNGXSStoreModule {} // <-- named after the feature state
