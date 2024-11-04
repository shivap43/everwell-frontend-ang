import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { UnsafeHtmlPipe } from "./unsafe-html.pipe";

describe("UnsafeHtmlPipe", () => {
    let pipe: UnsafeHtmlPipe;
    let domSanitizer: DomSanitizer;

    beforeEach(() => {
        domSanitizer = {
            bypassSecurityTrustHtml: (value: string) =>
                ({
                    safeValue: `unsafe__${value}`,
                } as SafeHtml),
        } as DomSanitizer;

        pipe = new UnsafeHtmlPipe(domSanitizer);
    });

    it("create an instance", () => {
        expect(pipe).toBeTruthy();
    });

    describe("transform()", () => {
        it("should use DomSanitizer to bypass security and return SafeHtml", () => {
            const unsafeHtmlString = "<div (click)=\"alert(1)\"></div>";

            expect(pipe.transform(unsafeHtmlString)).toStrictEqual({
                safeValue: "unsafe__<div (click)=\"alert(1)\"></div>",
            });
        });
    });
});
