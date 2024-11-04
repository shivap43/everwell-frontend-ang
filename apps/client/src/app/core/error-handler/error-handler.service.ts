import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Injectable, Injector, Provider } from "@angular/core";
import { Router } from "@angular/router";

import { CustomErrorResponse } from "./custom-error-response.model";

@Injectable()
export class CustomErrorHandler implements ErrorHandler {
    // Because the ErrorHandler is created before the providers, we’ll have to use the Injector to get them.
    constructor(private injector: Injector) {}

    // TODO - Ask Kevin for more information about custom error
    /**
     * HTTP Error Handler
     *
     * This method
     * @param {HttpErrorResponse} error
     */
    handleHttpError(error: CustomErrorResponse): void {
        // Handle offline error
        // if (!navigator.onLine) {
        // }
        // TODO - Create more robust logic
        // if (error.status === 504) {
        // }
        // Handle Http Error (error.status === 403, 404...)
        // TODO - Design global notification service / logging
        // const notificationService = this.injector.get(NotificationService);
        // return notificationService.notify(`${error.status} - ${error.message}`);
    }

    /**
     * Primary Error Handler
     *
     * This method serves as the entry point for all errors thrown within the application.
     * @param {Error} error
     */
    handleError(error: Error): void {
        const router = this.injector.get(Router);

        // TODO - Which error cases should redirect user?
        // Inject Router for any errors that require redirects
        // const router = this.injector.get(Router);

        //
        if (error instanceof HttpErrorResponse) {
            this.handleHttpError(error.error as CustomErrorResponse);
        }
        // Handle Client Error (Angular Error, ReferenceError...)
        // router.navigate(["/error"], { queryParams: { error: error } });
        // Log the error anyway
    }
}

export const CUSTOM_ERROR_HANDLER: Provider = {
    provide: ErrorHandler,
    useClass: CustomErrorHandler,
};
