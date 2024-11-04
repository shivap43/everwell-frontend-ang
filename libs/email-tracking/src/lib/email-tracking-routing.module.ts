import { SharedModule } from "@empowered/shared";
import { RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EmailTrackingComponent } from "./email-tracking/email-tracking.component";
import { EmailTrackingModule } from "./email-tracking.module";

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        EmailTrackingModule,
        RouterModule.forChild([{ path: "", component: EmailTrackingComponent }]),
    ],
})
export class EmailTrackingRoutingModule {}
