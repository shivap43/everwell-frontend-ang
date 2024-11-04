import { MemberListItem } from "@empowered/constants";

// TODO - [MON-11039 Update searchMembers to use filter] QA testing is in progress.
// Fix model and properties once the API contract is updated.
export interface SearchMembers {
    content: MemberListItem[];
    // eslint-disable-next-line @typescript-eslint/ban-types
    pageable: object;
    last: boolean;
    totalPages: number;
    totalElements: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    numberOfElements: number;
    first: boolean;
    size: number;
    // eslint-disable-next-line id-denylist
    number: number;
    empty: boolean;
}
