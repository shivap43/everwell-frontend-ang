import { SafeValue } from "@angular/platform-browser";

export const mockDomSanitizer = {
    sanitize: (context: any, value: string | SafeValue | null) => value,
    bypassSecurityTrustHtml: (value: string) => value,
};
