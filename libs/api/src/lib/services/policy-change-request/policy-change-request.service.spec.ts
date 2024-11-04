import { TestBed } from "@angular/core/testing";
import { PolicyChangeRequestService } from "./policy-change-request.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { FindPolicyholderModel, PolicyChangeFormDetailsModel, PolicyChangeRequestListModel } from "./models";

const MEMBER_DATA = {
    firstName: "Sample",
    lastName: "Name",
};

const AFFECTED_POLICIES = [
    {
        accountNumber: "124",
        billingName: MEMBER_DATA,
        policyName: "ACCIDENT",
        policyNumber: "2322",
        productId: 234,
    },
];

const MOCK_REFRESH_LIST_DATA: PolicyChangeRequestListModel = {
    account: { groupId: 123, groupNumber: "SSDF", name: "Sample Account Name" },
    cifNumber: "1234456",
    dateSubmitted: "01-01-2023",
    id: 1,
    memberId: 323,
    policyHolderName: `${MEMBER_DATA.firstName} ${MEMBER_DATA.lastName}`,
    requestNumber: "1",
    requestType: "ADDRESS",
    status: "SUBMITTED",
};

describe("PolicyChangeRequestService", () => {
    let service: PolicyChangeRequestService;
    let httpTestingController: HttpTestingController;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(PolicyChangeRequestService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    describe("PolicyChangeRequestService", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

        afterEach(() => {
            httpTestingController.verify();
        });

        describe("refreshListChangeForms()", () => {
            it("should return policy change request list", (done) => {
                expect.assertions(2);
                service.refreshListChangeForms().subscribe((data) => {
                    expect(data).toBe(MOCK_REFRESH_LIST_DATA);
                    done();
                });

                const req = httpTestingController.expectOne("/api/policyChangeRequests/refresh");
                expect(req.request.method).toBe("PUT");
                req.flush(MOCK_REFRESH_LIST_DATA);
            });
        });

        describe("getPolicyChangeForm()", () => {
            it("should return policy change form", (done) => {
                expect.assertions(2);
                const formId = 3;
                const MOCK_POLICY_CHANGE_FORM_DATA = { ...MOCK_REFRESH_LIST_DATA, id: formId };
                service.getPolicyChangeForm(3).subscribe((data) => {
                    expect(data).toBe(MOCK_POLICY_CHANGE_FORM_DATA);
                    done();
                });
                const req = httpTestingController.expectOne(`/api/policyChangeRequests/forms/${formId}`);
                expect(req.request.method).toBe("GET");
                req.flush(MOCK_POLICY_CHANGE_FORM_DATA);
            });
        });

        describe("getPolicyChangeFormDetails()", () => {
            it("should return policy change form details", (done) => {
                expect.assertions(2);
                const formId = 3;
                const MOCK_POLICY_CHANGE_FORM_DETAILS_DATA: PolicyChangeFormDetailsModel = {
                    affectedPolicies: AFFECTED_POLICIES,
                    cifNumber: "12345",
                    description: "Sample Description",
                    memberId: 1234,
                    supportingDocuments: [{ fileName: "demo", id: 1, uploadDate: "01-01-2023" }],
                };

                service.getPolicyChangeFormDetails(formId).subscribe((data) => {
                    expect(data).toBe(MOCK_POLICY_CHANGE_FORM_DETAILS_DATA);
                    done();
                });
                const req = httpTestingController.expectOne(`/api/policyChangeRequests/forms/${formId}/details`);
                expect(req.request.method).toBe("GET");
                req.flush(MOCK_POLICY_CHANGE_FORM_DETAILS_DATA);
            });
        });

        describe("searchPolicies()", () => {
            it("should return policies and allowed forms found in search", (done) => {
                expect.assertions(5);
                const searchPolicyMemberData = { ...MEMBER_DATA, birthDate: "01-01-2000" };
                const findPolicyData: FindPolicyholderModel = {
                    allowedForms: ["ACCIDENTAL_DOWNGRADE"],
                    cifNumber: "1234",
                    memberAddress: { state: "GA", zip: "30001" },
                    memberFirstName: MEMBER_DATA.firstName,
                    memberLastName: MEMBER_DATA.lastName,
                    policies: AFFECTED_POLICIES,
                };
                service.searchPolicies(searchPolicyMemberData).subscribe((data) => {
                    expect(data).toBe(findPolicyData);
                    done();
                });
                const req = httpTestingController.expectOne((request) => request.url === "/api/policyChangeRequests/policySearch");
                expect(req.request.params.get("firstName")).toBe(searchPolicyMemberData.firstName);
                expect(req.request.params.get("lastName")).toBe(searchPolicyMemberData.lastName);
                expect(req.request.params.get("birthDate")).toBe(searchPolicyMemberData.birthDate);

                expect(req.request.method).toBe("GET");
                req.flush(findPolicyData);
            });
        });
    });
});
