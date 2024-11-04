import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { EnrollmentHistoryComponent } from "./enrollment-history/enrollment-history.component";

const routes: Routes = [{ path: "", component: EnrollmentHistoryComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class EnrollmentHistoryRoutingModule {}
