import { ApiError } from "@empowered/constants";
import { ApiErrorDetailField } from "./standard-plan.constants";

// TODO [Types] details optional property needs to be added to ApiError
// This is an expected optional property of ApiError (straight from api response)
export interface ApiErrorWithDetails extends ApiError {
    details?: {
        field: ApiErrorDetailField;
        message: string;
    }[];
}
