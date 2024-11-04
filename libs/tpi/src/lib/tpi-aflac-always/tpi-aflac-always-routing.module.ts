import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { TpiAflacAlwaysContainerComponent } from "./tpi-aflac-always-container/tpi-aflac-always-container.component";

const AA_ROUTES: Routes = [{ path: "", component: TpiAflacAlwaysContainerComponent }];

@NgModule({
    imports: [RouterModule.forChild(AA_ROUTES)],
    exports: [RouterModule],
})
export class TpiAflacAlwaysRoutingModule {}
