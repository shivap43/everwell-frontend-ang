import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ProfileHistoryComponent } from "./profile-history/profile-history.component";

const routes: Routes = [{ path: "", component: ProfileHistoryComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ProfileHistoryRoutingModule {}
