import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AuthenticationService, PermissionsModel } from "@empowered/api";

@Directive({
    selector: "[empoweredPermissions]",
})
export class PermissionsDirective implements OnInit {
    @Input() permissions: string[];
    @Output() perdirEmit = new EventEmitter();
    private permissonsdata = [];

    constructor(private authService: AuthenticationService, private el: ElementRef) {}

    ngOnInit(): void {
        this.authService.permissions$.subscribe((response: PermissionsModel[]) => {
            if (response.length > 0) {
                response.forEach((element) => {
                    if (this.permissions.indexOf(String(element)) !== -1) {
                        this.permissonsdata.push(String(element));
                    }
                });
            }
            this.perdirEmit.emit(this.permissonsdata);
        });
    }
}
