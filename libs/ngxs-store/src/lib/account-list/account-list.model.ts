import { AccountList, SearchProducer } from "@empowered/api";

export class AccountListItem {
    list: AccountList[];
    selectedGroup: AccountList;
    currentProducer: SearchProducer;
}
