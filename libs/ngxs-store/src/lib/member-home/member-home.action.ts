import { HeaderObject } from "@empowered/constants";
// eslint-disable-next-line max-classes-per-file
export class SetHeaderObject {
    static readonly type = "[MemberHome] SetHeaderObject";

    constructor(public headerObject: HeaderObject) {}
}
