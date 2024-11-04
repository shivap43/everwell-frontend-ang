import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProducerShopComponent } from "./producer-shop.component";

const routes: Routes = [{ path: "specific/:memberId", component: ProducerShopComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ProducerShopRoutingModule {}
