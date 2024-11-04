/* eslint-disable @typescript-eslint/no-unused-vars */
import { AddException, ExceptionsService } from "@empowered/api";
import { of } from "rxjs";

export const mockExceptionsService = {
    addException: (mpGroup: number, exceptionPayload: AddException) => of(null),
    updateException: (mpGroup: string, exceptionId: number, exceptionPayload: AddException) => of(null),
    deleteException: (mpGroup: string, exceptionId: number) => of(null),
    getException: (mpGroup: string, exceptionId: number) => of({}),
} as unknown as ExceptionsService;
