import { TestBed } from "@angular/core/testing";
import { MemberService } from "./member.service";
import { HttpHeaders, HttpParams } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { MemberQualifier, MemberQualifierValidity } from "./models";

describe("MemberService", () => {
    let memberService: MemberService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [MemberService] });
        memberService = TestBed.inject(MemberService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it("should be created", () => {
        expect(memberService).toBeTruthy();
    });

    it("should update QLE list", () => {
        const value = true;
        memberService.updateQLEList(value);
        memberService.isUpdated.subscribe((val) => {
            expect(val).toBe(value);
        });
    });

    it("should update member list", () => {
        const value = true;
        memberService.updateMemberList(value);
        memberService.isUpdateMemberList.subscribe((val) => {
            expect(val).toBe(value);
        });
    });

    describe("searchMembersWithActiveCount", () => {
        it("should send count of active members of the group", () => {
            const mpGroup = "102156";
            const mockResponse = {
                content: [{ id: 1, employeeId: "000000001", firstName: "Steve", lastName: "Smith", phoneNumber: "" }],
                empty: false,
                first: true,
                last: true,
                numberOfElements: 11,
                pageable: { sort: { empty: true, sorted: false, unsorted: true }, offset: 0, pageSize: 1000, pageNumber: 0 },
                size: 1000,
                sort: { empty: true, sorted: false, unsorted: true },
                totalElements: 11,
                totalPages: 1,
            };

            memberService.searchMembersWithActiveCount(mpGroup).subscribe((data) => {
                expect(data).toBeDefined();
                expect(data).toEqual(mockResponse);
            });

            const request = httpMock.expectOne(`${memberService.configuration.basePath}/members/search`);

            expect(request.request.method).toBe("GET");
            request.flush(mockResponse);
        });
    });

    describe("setSearchMemberParams", () => {
        it("should set params required for search member call", () => {
            const mockHttpParam = {
                cloneFrom: { cloneFrom: null, encoder: {}, map: null, updates: null },
                encoder: {},
                map: null,
                updates: [
                    { op: "s", param: "property", value: "emailaddresses" },
                    { op: "s", param: "value", value: "adarsh.s+role20@gmail.com" },
                ],
            } as unknown as HttpParams;
            const data = {
                payload: { mpGroup: "12023" },
                searchHeaderObj: {
                    property: "emailaddresses",
                    value: "adarsh.s+role20@gmail.com",
                },
            };
            expect(memberService.setSearchMemberParams(data)).toEqual(mockHttpParam);
        });
    });

    describe("searchMembers", () => {
        it("Search for the members on the accounts", () => {
            const mpGroup = "106634";
            const mockResponse = {
                content: [],
                pageable: "INSTANCE",
                last: false,
                totalPages: 2,
                totalElements: 20,
                sort: {
                    sorted: false,
                    unsorted: true,
                    empty: false,
                },
                numberOfElements: 20,
                first: true,
                size: 3,
                empty: false,
            };
            memberService.searchMembers(mpGroup).subscribe((data) => {
                expect(data).toBeDefined();
                expect(data).toEqual(mockResponse);
            });

            const request = httpMock.expectOne(`${memberService.configuration.basePath}/members/search`);

            expect(request.request.method).toBe("GET");
            request.flush(mockResponse);
        });
    });

    it("setReinstatementPopupStatus", () => {
        const status = true;
        memberService.setReinstatementPopupStatus(status);
        (memberService as any).openTpiReinstatement$.subscribe((val: any) => {
            expect(val).toBe(status);
        });
    });

    it("getReinstatementPopupStatus", () => {
        const status = memberService.getReinstatementPopupStatus();
        expect(status).toBe(memberService.isDependentAdded);
    });

    describe("ebs", () => {
        it("Testing getEbsPaymentOnFile method returns", () => {
            const memberId = 1;
            const mpGroup = 2;
            const mockResponse = true;
            memberService.getEbsPaymentOnFile(memberId, mpGroup).subscribe((data) => {
                expect(data).toBeDefined();
                expect(data).toEqual(mockResponse);
            });

            const request = httpMock.expectOne(`${memberService.configuration.basePath}/members/${memberId}/ebsPaymentOnFile`);

            expect(request.request.method).toBe("GET");
            request.flush(mockResponse);
        });
    });

    describe("MemberQualifier", () => {
        it("getMemberQualifierTypes()", () => {
            const mockResponse = true;
            memberService.getMemberQualifierTypes().subscribe((qualifierTypes) => {
                expect(qualifierTypes).toBeDefined();
            });

            const req = httpMock.expectOne(`${memberService.configuration.basePath}/members/qualifierTypes`);
            expect(req.request.method).toBe("GET");
            req.flush(mockResponse);
        });

        it("getMemberQualifiers()", () => {
            const memberId = 1;
            const mpGroupId = "220577";
            const mockResponse = true;
            const headers = new HttpHeaders().set("MP-Group", mpGroupId);
            memberService.getMemberQualifiers(memberId, mpGroupId).subscribe((qualifierTypes) => {
                expect(qualifierTypes).toBeDefined();
            });

            const req = httpMock.expectOne(`${memberService.configuration.basePath}/members/${memberId}/qualifiers?memberId=${memberId}`);
            expect(req.request.method).toBe("GET");
            req.flush(mockResponse, { headers: headers });
        });

        it("getMemberQualifier()", () => {
            const memberId = 1;
            const mpGroupId = "220577";
            const qualifierTypeId = 1;
            const mockResponse = true;
            const headers = new HttpHeaders().set("MP-Group", mpGroupId);
            memberService.getMemberQualifier(memberId, mpGroupId, qualifierTypeId).subscribe((qualifierTypes) => {
                expect(qualifierTypes).toBeDefined();
            });

            const req = httpMock.expectOne(
                `${memberService.configuration.basePath}/members/${memberId}/` +
                    `qualifiers/${qualifierTypeId}?memberId=${memberId}&qualifierTypeId=${qualifierTypeId}`,
            );
            expect(req.request.method).toBe("GET");
            req.flush(mockResponse, { headers: headers });
        });

        it("saveMemberQualifier()", () => {
            const memberId = 1;
            const mpGroupId = "220577";
            const qualifierTypeId = 1;
            const mockResponse = true;
            const headers = new HttpHeaders().set("MP-Group", mpGroupId);
            const reqObject: MemberQualifier = {
                value: "true",
                validity: { effectiveStarting: new Date().toJSON().slice(0, 10) } as MemberQualifierValidity,
            };
            memberService.saveMemberQualifier(memberId, mpGroupId, qualifierTypeId, reqObject).subscribe((qualifierTypes) => {
                expect(qualifierTypes).toBeDefined();
            });

            const req = httpMock.expectOne(
                `${memberService.configuration.basePath}/members/${memberId}/` +
                    `qualifiers/${qualifierTypeId}?memberId=${memberId}&qualifierTypeId=${qualifierTypeId}`,
            );
            expect(req.request.method).toBe("POST");
            req.flush(mockResponse, { headers: headers });
        });
    });

    describe("Salary and Member related test case", () => {
        it("getSalary()", () => {
            memberService.getSalary(1, true, 1, "12345").subscribe((data) => {
                expect(data).toBeDefined();
            });
        });
        it("getMemberClassTypes()", () => {
            memberService.getMemberClassTypes(1).subscribe((data) => {
                expect(data).toBeDefined();
            });
        });
        it("getMemberCarrierRiskClasses()", () => {
            memberService.getMemberCarrierRiskClasses(1, 2, "12345").subscribe((data) => {
                expect(data).toBeDefined();
            });
        });
        it("getMemberCarrierRiskClasses() without carrierId", () => {
            let carrierId: number | undefined;
            memberService.getMemberCarrierRiskClasses(1, carrierId, "12345").subscribe((data) => {
                expect(data).toBeDefined();
            });
        });
    });

    it("getPaymentMethodsForAflacAlways() when group id is present", () => {
        const memberId = 1;
        const mpGroupId = 220577;
        const mockResponse = [{}];
        const headers = new HttpHeaders().set("MP-Group", mpGroupId.toString());
        memberService.getPaymentMethodsForAflacAlways(memberId, mpGroupId).subscribe((data) => {
            expect(data).toBeDefined();
        });
        const req = httpMock.expectOne(
            `${memberService.configuration.basePath}/aflac/members/${memberId}/` + `enrollments/aflacAlways/pending`,
        );
        expect(req.request.method).toBe("GET");
        req.flush(mockResponse, { headers: headers });
    });

    it("getPaymentMethodsForAflacAlways() when group is not present", () => {
        const memberId = 1;
        const mockResponse = [{}];
        const headers = new HttpHeaders().set("MP-Group", "");
        memberService.getPaymentMethodsForAflacAlways(memberId, NaN).subscribe((data) => {
            expect(data).toBeDefined();
        });
        const req = httpMock.expectOne(
            `${memberService.configuration.basePath}/aflac/members/${memberId}/` + `enrollments/aflacAlways/pending`,
        );
        expect(req.request.method).toBe("GET");
        req.flush(mockResponse, { headers: headers });
    });
});
