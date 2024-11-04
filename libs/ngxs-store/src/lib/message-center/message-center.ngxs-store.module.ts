import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { MessageCenterState } from "./message-center.state"; // <-- migrated state

@NgModule({
    imports: [NgxsModule.forFeature([MessageCenterState])], // <-- import feature
})
export class MessageCenterNgxsStoreModule {} // <-- named after the feature state
