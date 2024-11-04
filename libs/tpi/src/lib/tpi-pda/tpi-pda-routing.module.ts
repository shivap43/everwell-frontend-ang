import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { TpiPdaComponent } from "./tpi-pda.component";
import { TpiPdaFormComponent } from "./tpi-pda-form/tpi-pda-form.component";
import { TpiPdaViewComponent } from "./tpi-pda-view/tpi-pda-view.component";

const routes: Routes = [
    {
        path: "",
        component: TpiPdaComponent,
        children: [
            {
                path: "form",
                component: TpiPdaFormComponent,
            },
            {
                path: "view",
                component: TpiPdaViewComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TpiPdaRoutingModule {}
