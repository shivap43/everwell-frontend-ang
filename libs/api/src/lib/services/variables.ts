import { InjectionToken } from "@angular/core";

export const BASE_PATH = new InjectionToken<string>("basePath");
export const COLLECTION_FORMATS = {
    csv: ",",
    tsv: "   ",
    ssv: " ",
    pipes: "|",
};
export const API_RESP_HEADER_LOCATION = "location";
