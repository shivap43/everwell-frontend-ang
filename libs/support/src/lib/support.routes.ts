import { Routes } from "@angular/router";
import { PermissionGuard } from "@empowered/shared";
import { ConfigGuard } from "@empowered/ui";
import { UserPermissionList } from "@empowered/constants";
import { FrequentlyAskedQuestionsComponent } from "./components/frequently-asked-questions/frequently-asked-questions.component";
import { DownloadUnpluggedComponent } from "./components/download-unplugged/download-unplugged.component";
import { TrainingResourcesComponent } from "./components/training-resources/training-resources.component";
import { SupportPageSideNavComponent } from "./components/support-page-side-nav/support-page-side-nav.component";
/**
 * This defined route in support component
 * Default route is trainingResource component which can be active if config is enable and user has permission to access it
 *
 */
export const SUPPORT_ROUTES: Routes = [
    {
        path: "",
        component: SupportPageSideNavComponent,
        children: [
            {
                path: "",
                component: FrequentlyAskedQuestionsComponent,
            },
            {
                path: "trainingResources",
                component: TrainingResourcesComponent,
                canActivate: [ConfigGuard, PermissionGuard],
                data: {
                    requiredConfig: "general.feature.enabled.user_process_guide",
                    requiredPermission: UserPermissionList.USER_PROCESS_GUIDE_READ,
                },
            },

            {
                path: "downloadUnplugged",
                component: DownloadUnpluggedComponent,
            },
            {
                path: "faq",
                component: FrequentlyAskedQuestionsComponent,
            },
        ],
    },
];
