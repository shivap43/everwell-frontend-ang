import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CompletedFormsComponent } from "./completed-forms.component";

const routes: Routes = [{ path: "", component: CompletedFormsComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CompletedFormsRoutingModule {}
