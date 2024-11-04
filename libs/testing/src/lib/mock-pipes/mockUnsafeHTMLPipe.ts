import { Pipe, PipeTransform } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";

@Pipe({
    name: "unsafeHtml",
})
export class MockUnsafeHTMLPipe implements PipeTransform {
    transform(value: string): SafeHtml {
        return `unsafe__${value}`;
    }
}
