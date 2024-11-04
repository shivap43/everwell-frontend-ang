import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ActivityHistoryComponent } from "./activity-history/activity-history.component";

const routes: Routes = [{ path: "", component: ActivityHistoryComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ActivitiesHistoryRoutingModule {}
