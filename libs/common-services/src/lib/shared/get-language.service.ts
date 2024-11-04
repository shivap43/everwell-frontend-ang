import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";
import { takeUntil } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class ModuleLanguageLoadingService implements OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly staticUtils: StaticUtilService) {}
    /**
     * A subscription manager for dispatchLanguage
     * @param language tagname for language
     */
    loadLanguage(language: string): void {
        this.staticUtils.dispatchLanguage(language).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * Unsubscribe each selector's observer and the unsubscribe subject.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
