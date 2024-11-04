import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
    name: "unsafeHtml",
})
/**
 * Used to formant language string data into the HTML
 * with stylesheet and bypassing Angular's built in security
 *
 * Example Use:
 * <div>{{ htmlString | unsafeHtml }}<div>
 */
export class UnsafeHtmlPipe implements PipeTransform {
    constructor(private readonly domSanitizer: DomSanitizer) {}

    transform(value: string): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustHtml(value);
    }
}
