import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DependentPersonalInfoComponent } from "./dependent-personal-info/dependent-personal-info.component";

const routes: Routes = [{ path: "", component: DependentPersonalInfoComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DependentAddRoutingModule {}
