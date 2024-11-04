import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { CompanyStructureComponent } from "./company-structure.component";
import { COMPANY_STRUCTURE_ROUTES } from "./company-structure.routes";
import { ClassesComponent } from "./classes/classes.component";
import { EditClassTypeComponent } from "./classes/class-type/edit-class-type/edit-class-type.component";
import { RemoveClassTypeComponent } from "./classes/class-type/remove-class-type/remove-class-type.component";
import { EditClassComponent } from "./classes/class/edit-class/edit-class.component";
import { RemoveClassComponent } from "./classes/class/remove-class/remove-class.component";
import { ClassTypeComponent } from "./classes/class-type/class-type.component";
import { ClassComponent } from "./classes/class/class.component";
import { RegionsComponent } from "./regions/regions.component";
import { EditRegionTypeComponent } from "./regions/region-type/edit-region-type/edit-region-type.component";
import { RemoveRegionTypeComponent } from "./regions/region-type/remove-region-type/remove-region-type.component";
import { EditRegionComponent } from "./regions/region/edit-region/edit-region.component";
import { RemoveRegionComponent } from "./regions/region/remove-region/remove-region.component";
import { RegionTypeComponent } from "./regions/region-type/region-type.component";
import { RegionComponent } from "./regions/region/region.component";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { PortalsService } from "./portals.service";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        RouterModule.forChild(COMPANY_STRUCTURE_ROUTES),
        CommonModule,
        SharedModule,
        LanguageModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        CompanyStructureComponent,
        ClassesComponent,
        EditClassTypeComponent,
        RemoveClassTypeComponent,
        EditClassComponent,
        RemoveClassComponent,
        ClassTypeComponent,
        ClassComponent,
        RegionsComponent,
        EditRegionTypeComponent,
        RemoveRegionTypeComponent,
        EditRegionComponent,
        RemoveRegionComponent,
        RegionTypeComponent,
        RegionComponent,
    ],
    providers: [ReplaceTagPipe, PortalsService],
})
export class CompanyStructureModule {}
