import { Directive, ViewContainerRef, TemplateRef, OnInit, OnDestroy, Input } from "@angular/core";
import { Subscription } from "rxjs";
import { tap, distinctUntilChanged } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";

/**
 * Similar functionality to wrapping a tag with *ngIf; this prevents the tag
 * from rendering if the user has the restricted permissions. It has exact opposite logic
 * of hasPermission directive and does not render the element if set to true.
 * The directive requires either a variable with a string for the permission,
 * or the permission wrapped in single quotes.
 * DIRECTIVE REQUIRES STAR PREFIX.
 *
 * Example:
 *
 * *isRestricted="nameOfVariable"
 *
 * OR
 *
 * *isRestricted="'core.account.restrict.read.prospects'"
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[isRestricted]",
})
export class IsRestrictedDirective implements OnInit, OnDestroy {
    @Input("isRestricted") permission: string;

    subscription: Subscription;

    constructor(
        private readonly staticUtil: StaticUtilService,
        private viewContainer: ViewContainerRef,
        private template: TemplateRef<any>,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * This method clears the view if restrict permission is enabled
     */
    ngOnInit(): void {
        this.subscription = this.staticUtil
            .hasPermission(this.permission)
            .pipe(
                distinctUntilChanged(),
                tap((enabled) => {
                    if (enabled) {
                        this.viewContainer.clear();
                    } else {
                        this.viewContainer.createEmbeddedView(this.template);
                    }
                }),
            )
            .subscribe();
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
