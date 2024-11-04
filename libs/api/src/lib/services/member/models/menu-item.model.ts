import { Observable } from "rxjs";

export interface MenuItem {
    name: string;
    iconName?: any;
    path?: any;
    routerLinkActive?: boolean;
    isConfigEnabled$?: Observable<boolean>;
    hasPermission$?: Observable<boolean>;
    isVisible$?: Observable<boolean>;
}
