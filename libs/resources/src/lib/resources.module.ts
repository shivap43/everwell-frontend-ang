import { AudienceGroupBuilderModule } from "@empowered/audience-group-builder";
import { PortalModule } from "@angular/cdk/portal";
import { NgModule } from "@angular/core";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTreeModule } from "@angular/material/tree";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { RESOURCES_ROUTES } from "./resources.routes";
import { BenefitResourceListComponent } from "./resources/benefit-resource-list/benefit-resource-list.component";
import { CompanyResourceListComponent } from "./resources/company-resource-list/company-resource-list.component";
import { ResourcesComponent } from "./resources/resources.component";
import { RemoveResourceComponent } from "./resources/remove-resource/remove-resource.component";
import { LanguageModule } from "@empowered/language";
import { AddResourceStepperComponent } from "./resources/add-resource-stepper/add-resource-stepper.component";
import { ResourceListNGXSStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        RouterModule.forChild(RESOURCES_ROUTES),
        MatTabsModule,
        ResourceListNGXSStoreModule,
        SharedModule,
        MatSortModule,
        MatPaginatorModule,
        MatBottomSheetModule,
        PortalModule,
        MatTreeModule,
        LanguageModule,
        AudienceGroupBuilderModule,
        UiModule,
    ],
    exports: [MatSortModule, MatPaginatorModule],
    declarations: [
        ResourcesComponent,
        CompanyResourceListComponent,
        BenefitResourceListComponent,
        RemoveResourceComponent,
        AddResourceStepperComponent,
    ],
})
export class ResourcesModule {}
