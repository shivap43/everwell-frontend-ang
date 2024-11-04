import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { NotAuthorizedComponent } from "./not-authorized.component";

@NgModule({
    declarations: [NotAuthorizedComponent],
    imports: [RouterModule.forChild([{ path: "", component: NotAuthorizedComponent }])],
})
export class NotAuthorizedModule {}
