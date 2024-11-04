import { Directive, ViewContainerRef, TemplateRef, OnInit, OnDestroy, Input } from "@angular/core";
import { Subscription, Observable } from "rxjs";
import { tap, distinctUntilChanged } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";

/**
 * Similar functionality to wrapping a tag with *ngIf; this prevents the tag
 * from rendering if the user does not have the correct permissions. The directive
 * requires either a variable with a string for the permission, or the permission
 * wrapped in single quotes. DIRECTIVE REQUIRES STAR PREFIX.
 *
 * Example:
 *
 * *hasPermission="nameOfVariable"
 *
 * OR
 *
 * *hasPermission="'aflac.account.create'"
 *
 *
 *
 *
 * *hasAnyPermission is used to check any one of the permissions is true/granted to the user('OR' condition)
 *
 * Example:
 *
 * *hasAnyPermission="['aflac.account.update','aflac.account.delete']"
 *
 *
 *
 * *hasAllPermission is used to check all of the permissions are true/granted to the user.('AND' condition)
 *
 * Example:
 *
 * *hasAllPermission="['aflac.account.update','aflac.account.delete']"
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[hasPermission],[hasAnyPermission],[hasAllPermission]",
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    @Input("hasPermission") permission: string;
    @Input("hasAnyPermission") anyPermission: string[];
    @Input("hasAllPermission") allPermission: string[];

    subscriptions: Subscription[] = [];

    constructor(
        private readonly staticUtil: StaticUtilService,
        private viewContainer: ViewContainerRef,
        private template: TemplateRef<any>,
    ) {}

    ngOnInit(): void {
        let permissionObservabale: Observable<boolean>;
        if (this.anyPermission) {
            permissionObservabale = this.staticUtil.hasOnePermission(this.anyPermission);
        } else if (this.allPermission) {
            permissionObservabale = this.staticUtil.hasAllPermission(this.allPermission);
        } else {
            permissionObservabale = this.staticUtil.hasPermission(this.permission);
        }

        this.subscriptions.push(
            permissionObservabale
                .pipe(
                    distinctUntilChanged(),
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

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
