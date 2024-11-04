import { MessageCenterSettingsContainerComponent } from "./message-center-settings-container/message-center-settings-container.component";
import { MessageCenterViewContainerComponent } from "./containers/message-center-view-container/message-center-view-container.component";
import { Routes } from "@angular/router";
import { AdminGuard } from "./guards/admin-guard";
import { ConfigGuard } from "@empowered/ui";
import { ConfigName } from "@empowered/constants";

export const MESSAGE_CENTER_ROUTES: Routes = [
    {
        path: "",
        canActivateChild: [ConfigGuard],
        data: {
            requiredConfig: ConfigName.MESSAGE_CENTER_TOGGLE,
        },
        children: [
            {
                path: "messages",
                component: MessageCenterViewContainerComponent,
            },
            {
                path: "settings",
                component: MessageCenterSettingsContainerComponent,
                canActivate: [AdminGuard],
            },
        ],
    },
];
