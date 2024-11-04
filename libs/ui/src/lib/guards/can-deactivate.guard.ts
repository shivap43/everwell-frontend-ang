import { Injectable } from "@angular/core";
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";

export interface CanComponentDeactivate {
    canDeactivate: (nextState?: RouterStateSnapshot) => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
    providedIn: "root",
})
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
    /** *
     * canDeactivate function to decide whether or not to exit/deactivate the current view.
     * @param component, which is the current component
     * @param currentRoute, which stores the information about current route.
     * @param currentState, which stores the information about current state of the route
     * @param nextState, which stores the information about next/upcoming state of the route
     * @returns {Observable<boolean>} OR {boolean} OR {Promise<boolean>} which decides
     *  whether or not to exit/deactivate the current view/route.
     */
    canDeactivate(
        component: CanComponentDeactivate,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot,
    ): boolean | Observable<boolean> | Promise<boolean> {
        return component.canDeactivate ? component.canDeactivate(nextState) : true;
    }
}
