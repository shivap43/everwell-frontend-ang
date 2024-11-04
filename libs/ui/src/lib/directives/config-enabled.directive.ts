import { Directive, Input, OnInit, OnDestroy, ViewContainerRef, TemplateRef } from "@angular/core";
import { Subscription } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";
import { tap } from "rxjs/operators";

/**
 * Removed inner content, similar to a *ngIf, if the provided config is not a boolean and not set to true.
 * The input expects a variable, so if the name of the config is not one, then wrap it in single quotes.
 * DIRECTIVE REQUIRES STAR PREFIX.
 *
 * Example:
 *
 * *configEnabled="NAME_OF_VARIABLE_HERE"
 *
 * OR
 *
 * *configEnabled="'this_is_a_config_name_in_the_DB'"
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[configEnabled]",
})
export class ConfigEnabledDirective implements OnInit, OnDestroy {
    @Input("configEnabled") configName: string;

    subscriptions: Subscription[] = [];

    constructor(private staticUtil: StaticUtilService, private viewContainer: ViewContainerRef, private template: TemplateRef<unknown>) {}

    ngOnInit(): void {
        this.subscriptions.push(
            this.staticUtil
                .cacheConfigEnabled(this.configName)
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

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
