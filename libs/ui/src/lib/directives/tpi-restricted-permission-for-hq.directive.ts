import { Directive, ViewContainerRef, TemplateRef, OnInit, OnDestroy, Input } from "@angular/core";
import { tap } from "rxjs/operators";
import { Subscription } from "rxjs";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";

interface RequiredPermissionConfig {
    requiredPermission?: string;
    requiredConfig?: string;
}

/**
 * Like *ngIf, conditionally includes a template
 * based on if an account is Aflac HQ account and the required config and permission
 * Example:
 * <div
      *TPIRestrictedPermissionForHQ="{ requiredPermission: 'general.not_a_permission', requiredConfig: 'general.not_a_config' }"
    >I am an HQ employee with the required permission and config</div>
 */
@Directive({
    selector: "[empoweredTpiRestrictedPermission]",
})
export class TPIRestrictedPermissionForHQDirective implements OnInit, OnDestroy {
    @Input("empoweredTpiRestrictedPermission") permissionConfig: RequiredPermissionConfig;
    subscriptions: Subscription[] = [];
    constructor(
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly viewContainer: ViewContainerRef,
        private readonly template: TemplateRef<unknown>,
    ) {}
    /**
     * Conditionally includes the template based on if an account is Aflac HQ account,
     * the required permission, the required config, and on whether the feature toggle config for TPI restrictions is enabled
     * @returns nothing
     */
    ngOnInit(): void {
        const { requiredPermission, requiredConfig }: RequiredPermissionConfig = this.permissionConfig || {};
        this.subscriptions.push(
            this.tpiRestrictions
                .canAccessTPIRestrictedModuleInHQAccount(requiredPermission, requiredConfig)
                .pipe(
                    tap((enabled) => {
                        if (enabled) {
                            this.viewContainer.createEmbeddedView(this.template);
                        } else {
                            this.viewContainer.clear();
                        }
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * Cleans up subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
