import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { TpiServices } from "@empowered/common-services";

/**
 * This guard's purpose is to protect the routes intended specifically for TPI Modal Mode from opening in TPI Link and Launch mode
 * Example: tpi/aflac-always route is intended only for TPI Modal Mode
 * {
 *    path: "tpi/aflac-always",
 *    loadChildren: () => import("./tpi-aflac-always/tpi-aflac-always.module").then((m) => m.TpiAflacAlwaysModule),
 *    canActivate: [ModalModeGuard],
 *  }
 */
@Injectable({ providedIn: "root" })
export class ModalModeGuard implements CanActivate {
    constructor(private readonly tpiServices: TpiServices) {}

    /**
     * Checks if it's LnL, therefore should return false to stop traversal to the modal mode route
     * @returns bool - false if it's LnL mode
     */
    canActivate(): boolean {
        return !this.tpiServices.isLinkAndLaunchMode();
    }
}
