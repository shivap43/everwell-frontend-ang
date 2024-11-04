import { NgModule } from "@angular/core";
import { SharedModule } from "@empowered/shared";
import { ProducerPortalRoutingModule } from "./producer-portal-routing.module";

import { ProducerPortalComponent } from "./producer-portal.component";

@NgModule({
    imports: [ProducerPortalRoutingModule, SharedModule],
    declarations: [ProducerPortalComponent],
})
export class ProducerPortalModule {}
