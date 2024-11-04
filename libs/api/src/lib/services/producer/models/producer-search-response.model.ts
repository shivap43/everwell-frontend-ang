import { ProducerSearch } from "./producer-search.model";
import { Sort } from "../../shared";

export interface ProducerSearchResponse {
    content: ProducerSearch[];
    pageable: string;
    totalElements: number;
    last: boolean;
    totalPages: number;
    first: boolean;
    sort: Sort;
    numberOfElements: number;
    size: number;
    number: number;
    empty: boolean;
}
