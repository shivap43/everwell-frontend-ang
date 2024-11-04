import { Injectable, Provider, Optional, Inject } from "@angular/core";
import {
    HttpInterceptor,
    HttpEvent,
    HttpHandler,
    HttpRequest,
    HttpHeaders,
    HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { Configuration, BASE_PATH } from "../services";

const SOURCE_HEADER_NAME = "MP-Application";
const SOURCE_HEADER_VALUE = "MARKETPLACE_2";

/**
 * Interceptor for general, non-specific, API needs that are not too specific or complicated enough to warrant their own filter
 *
 * Current functionality includes:
 *  - Source header addition
 */
@Injectable({ providedIn: "root" })
export class ApiGeneralInterceptor implements HttpInterceptor {
    configuration = new Configuration();
    protected basePath = "/api";

    constructor(@Optional() @Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    /**
     * Intercept the Request and make the necessary updates to it
     * @param req The HTTP request being made
     * @param next The next Interceptor to call
     * @returns The next handler's response to the request
     */
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Add the source header to all API requests to future-proof header requirement
        if (req.url.startsWith(this.configuration.basePath ?? "")) {
            const headers: HttpHeaders = req.headers
                ? req.headers.set(SOURCE_HEADER_NAME, SOURCE_HEADER_VALUE)
                : new HttpHeaders().set(SOURCE_HEADER_NAME, SOURCE_HEADER_VALUE);

            return next.handle(req.clone({ headers }));
        }
        return next.handle(req);
    }
}

/**
 * Provider for the interceptor, for specific use in the API module only
 */
export const API_GENERAL_INTERCEPTOR_PROVIDER: Provider = {
    provide: HTTP_INTERCEPTORS,
    useClass: ApiGeneralInterceptor,
    multi: true,
};
