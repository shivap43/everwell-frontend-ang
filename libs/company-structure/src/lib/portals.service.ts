import { MatExpansionPanel } from "@angular/material/expansion";
import { ClassTypeDisplay, AccountService, ClassNames, RegionTypeDisplay, RegionNames, StaticService } from "@empowered/api";
import { PayFrequency } from "@empowered/constants";
import { Injectable, Injector, ComponentFactoryResolver, ApplicationRef } from "@angular/core";

import {
    ComponentPortal,
    // TODO: PortalInjector is deprecated
    // Switch to Injector.create or use the following resources to refactor:
    // https://github.com/angular/material.angular.io/issues/701
    // https://github.com/angular/angular/issues/35548#issuecomment-588551120
    PortalInjector,
    // TODO: DomPortalHost is deprecated https://material.angular.io/cdk/portal/api#DomPortalHost
    // Switch to DomPortalOutlet instead
    DomPortalHost,
} from "@angular/cdk/portal";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";
import { CONTAINER_DATA } from "./container-data";
import { ContainerDataModel } from "./shared/models/container-data-model";
import { ErrRegionZip } from "./shared/models/error-region-zip.model";

interface ActionModel {
    action: string;
    data: unknown;
}
@Injectable()
export class PortalsService {
    selectedPortal: ComponentPortal<any>;
    panel: MatExpansionPanel;
    selectedClassType: ClassTypeDisplay;
    selectedRegionType: RegionTypeDisplay;
    selectedClass: ClassNames;
    selectedRegion: RegionNames;
    defaultClassType: ClassTypeDisplay;
    payFrequencies: PayFrequency[];
    private actionSource$: Subject<ActionModel> = new Subject<ActionModel>();
    action$ = this.actionSource$.asObservable();
    zeroState = false;
    zeroStateForRegions = false;
    allStates = [];
    portalHostId: string;
    private zipInvald$: Subject<ErrRegionZip> = new Subject<ErrRegionZip>();
    isInvalidZip$ = this.zipInvald$.asObservable();
    // FIXME - Temp fix for [MON-20803]:
    // Need to figure out why the close event is not fired on expansion panel from here. Till then triggering it through subject here.
    private panelClosedSource$: Subject<void> = new Subject<void>();
    panelClosed$ = this.panelClosedSource$.asObservable();
    bodyPortalHost: DomPortalHost;
    private removeInvalidClassTypeSource$: Subject<void> = new Subject<void>();
    removeInvalidClassType$ = this.removeInvalidClassTypeSource$.asObservable();
    constructor(
        private injector: Injector,
        private accountService: AccountService,
        private staticService: StaticService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private appRef: ApplicationRef,
    ) {
        this.accountService
            .getPayFrequencies()
            .pipe(take(1))
            .subscribe((payFrequencies) => (this.payFrequencies = payFrequencies));

        this.getStates();
    }
    private createInjector(dataToPass: ContainerDataModel): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }
    setAction(action: ActionModel): void {
        this.actionSource$.next(action);
    }
    attachPortal(component: any, data: ContainerDataModel, parent?: string): void {
        // FIXME - This piece of code won't be needed once HTML/CSS changes are in place and the background is blurred out.
        if (this.portalHostId === "#portal-host-0" && parent !== "0") {
            this.removeInvalidClassTypeSource$.next();
        }
        if (this.selectedPortal && this.selectedPortal.isAttached) {
            this.selectedPortal.detach();
        }
        if (this.panel && this.panel.id !== data.panel.id) {
            this.panel.close();
        }
        if (data.panel) {
            this.panel = data.panel;
        }
        if (this.bodyPortalHost && this.bodyPortalHost.hasAttached) {
            this.bodyPortalHost.detach();
        }
        if (parent) {
            this.portalHostId = `#portal-host-${parent.trim()}`;
            this.bodyPortalHost = new DomPortalHost(
                document.querySelector(this.portalHostId),
                this.componentFactoryResolver,
                this.appRef,
                this.injector,
            );
            this.bodyPortalHost.attachComponentPortal(new ComponentPortal(component, null, this.createInjector(data)));
        } else {
            // FIXME - Fix the type of component. 'component: ComponentType<any>' does not work.
            this.selectedPortal = new ComponentPortal(component, null, this.createInjector(data));
        }
    }
    detachPortal(): void {
        if (this.panel) {
            this.panel.close();
            // FIXME - Temp fix for [MON-20803]: this.panel.closed.emit() also didn't work.
            this.panelClosedSource$.next();
        }
        if (this.selectedPortal && this.selectedPortal.isAttached) {
            this.selectedPortal.detach();
        }
        if (this.bodyPortalHost && this.bodyPortalHost.hasAttached) {
            this.bodyPortalHost.detach();
        }
    }
    getStates(): void {
        this.staticService
            .getStates()
            .pipe(take(1))
            .subscribe((states) => {
                this.allStates = states;
            });
    }
    setInvalidZipStatus(errorObject?: ErrRegionZip): void {
        this.zipInvald$.next(errorObject);
    }
}
