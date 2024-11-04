import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { UnsafeHtmlPipe } from "./pipes/unsafe-html/unsafe-html.pipe";

@NgModule({
    imports: [CommonModule],
    declarations: [UnsafeHtmlPipe],
    exports: [UnsafeHtmlPipe],
})
export class CoreModule {}
