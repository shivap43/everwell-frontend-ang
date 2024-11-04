import { Directive, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonService, ConfigModel } from "@empowered/api";

@Directive({
    selector: "[empoweredConfig]",
})
export class ConfigDirective implements OnInit {
    @Input() configName: string;
    @Output() configEmit = new EventEmitter();
    data: Array<ConfigModel> = [];

    constructor(private commonService: CommonService) {}

    ngOnInit(): void {
        this.commonService.getConfigurations(this.configName).subscribe(
            (value) => {
                this.data = value;
                this.configEmit.emit(value);
            },
            (error) => error,
        );
    }
}
