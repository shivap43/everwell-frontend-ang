import { Component, Input, OnInit, SimpleChanges, OnChanges, OnDestroy } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatIconRegistry } from "@angular/material/icon";
import { CoreService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SharedState, SetFileServerBasePath } from "@empowered/ngxs-store";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mon-icon",
    templateUrl: "./mon-icon.component.html",
    styleUrls: ["./mon-icon.component.scss"],
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        class: "mon-icon",
    },
})
export class MonIconComponent implements OnInit, OnChanges, OnDestroy {
    iconBasePath = "assets/svgs/";
    @Input() iconName = "";
    @Input() iconSize = 20;
    @Input() alt = "";
    @Input() fetchedIconPath = "";
    iconPath: SafeResourceUrl;
    fileServerIconPath: SafeResourceUrl;
    basePath: string;
    availableIconSizes: number[] = [20, 30, 50, 60];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    constructor(
        private readonly iconRegistry: MatIconRegistry,
        private readonly sanitizer: DomSanitizer,
        private readonly coreService: CoreService,
        private readonly store: Store,
    ) {}
    /**
     * method to set icon paths to get the icons
     */
    ngOnInit(): void {
        this.basePath = this.getFileServerBasePath();
        if (this.fetchedIconPath) {
            this.getModifiedPathFromFileServer();
        } else {
            const size = this.iconSize;
            const targetIconSize = this.availableIconSizes.reduce((prev: number, curr: number) =>
                Math.abs(curr - size) <= Math.abs(prev - size) ? curr : prev,
            );
            this.iconPath = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.iconBasePath}${targetIconSize}/${this.iconName}.svg`);
            this.iconRegistry.addSvgIcon(this.iconName, this.iconPath);
        }
    }
    /**
     * @function ngOnChanges
     * @description To track changes of fetchedIconPath
     * @param changes To check fetchedIconPath value changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes["fetchedIconPath"] && this.fetchedIconPath) {
            this.getModifiedPathFromFileServer();
        }
    }
    /**
     * @function getModifiedPathFromFileServer
     * @description To get changes of file-server and make amendment to icon path
     */
    getModifiedPathFromFileServer(): void {
        if (this.basePath) {
            this.iconPath = this.sanitizer.bypassSecurityTrustResourceUrl(
                this.fetchedIconPath.replace("{fileServer}", this.basePath).replace("{pixelSize}", this.iconSize + "px"),
            );
            this.iconRegistry.addSvgIcon(this.iconName, this.iconPath);
        }
    }
    /**
     * method to get the file server base-path
     * @returns: string - the file server base-path
     */
    getFileServerBasePath(): string {
        let fileServerBasePath: string;
        if (this.store.selectSnapshot(SharedState.basePath)) {
            fileServerBasePath = this.store.selectSnapshot(SharedState.basePath);
        } else {
            this.coreService
                .getFileServer()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    fileServerBasePath = data;
                    this.store.dispatch([new SetFileServerBasePath(fileServerBasePath)]);
                });
        }
        return fileServerBasePath;
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
