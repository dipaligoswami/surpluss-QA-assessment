# Write-up

Bullet points are fine. We are not marking your English.

---

## 1. Strategy

What did you decide to test, and why those things first?

## 2. The riskiest part of this product

If you had one week and could only protect one area, which would it be? What
goes wrong if nobody tests it?

## 3. What I left out, and why

Being explicit here counts in your favour.

## 4. AI tool usage

Which tools did you use, and for what? Be specific. Describe what you changed
about what they produced.

## 5. One thing this codebase gets wrong

From a quality point of view — and what you would change.

---

## Notes

Anything else: setup problems, assumptions you made, things you were unsure
about.

## Task 2 — Unit and Integration Tests

I used Vitest to focus testing on the business-critical areas identified in the
assessment rather than attempting exhaustive test coverage across the entire
codebase.

### Areas covered

#### 1. Price and discount calculation
Added unit tests around pricing and discount-related business rules, including
expected calculations and boundary/edge cases.

**Result:** 3/3 tests passed.

#### 2. Spreadsheet import mapping and validation
Added tests covering:
- Common spreadsheet header mapping
- Seller spreadsheet value parsing
- Duplicate SKU validation
- Invalid available quantity validation
- Messy currency/value formats

**Result:** 3/4 tests passed.

The failing test identified an issue where a value such as
`₹1,20,000 / piece` is not parsed correctly.

#### 3. Catalogue lifecycle
Added tests covering:
- Draft catalogues remaining in draft state
- Published catalogues with future expiry
- Published catalogues after expiry

**Result:** 1/3 tests passed.

The failing tests identified an issue with the current future/past expiry
logic.

These tests verify the expected draft → published → expired lifecycle,
including time-dependent expiry behaviour.

#### 4. Enquiry validation
Added integration-style tests for the `/api/enquiries` POST route covering:
- Missing phone/email contact information
- Quantity below MOQ
- Quantity exceeding available stock
- Products unavailable in the catalogue
- Successful creation of a valid enquiry

**Result:** 5/5 tests passed.

### Test results

The Task 2 suite currently contains **15 tests**:

- **12 passing**
- **3 failing**

The failing tests exposed implementation issues rather than being removed or
weakened to make the suite pass.

The failures identify two concrete business-rule defects:
- Catalogue expiry logic does not currently match the expected
  draft/published/expired lifecycle behaviour.
- Currency parsing does not currently handle a value such as
  `₹1,20,000 / piece`.

These failures are valuable because they identify concrete business-rule
defects that the tests are intended to protect against.

### Deliberately not covered

I did not attempt exhaustive coverage of every UI component, API endpoint,
database query, or framework-level implementation.

I prioritized business logic and validation where defects could directly affect:
- Catalogue pricing
- Imported catalogue data
- Catalogue visibility/lifecycle
- Inventory availability
- Customer enquiries

Lower-risk presentation logic and straightforward framework wiring were left
uncovered to keep the test suite focused and maintainable.

------

## Task 4 — Playwright Buyer Journey

I implemented one end-to-end Playwright test covering the complete buyer journey:

**Published catalogue → browse products → add items to enquiry → submit enquiry → verify the enquiry in the admin leads inbox.**

### Test result

The Playwright test passed successfully:

- **1/1 test passed**
- Execution time: approximately **27 seconds**

### Reliability approach

The test uses Playwright's locator-based interactions and waits for the relevant
UI state rather than relying on fixed time delays.

The test uses the seeded application data and verifies the enquiry through the
admin leads inbox after submission, which provides an end-to-end check across
the buyer and admin flows.

I kept this as one focused journey rather than adding multiple overlapping
E2E tests, as the assessment prioritises a reliable and readable critical-path
test.

----

# Write-up

## 1. Strategy

- I focused first on the highest-risk areas: catalogue access, admin API authorization, catalogue/listing ownership, payload validation, and the buyer enquiry flow.
- For API testing, I went beyond happy paths and checked signed-out access, staff access, tampered payloads, expired/draft catalogues, and cross-catalogue IDs.
- For the end-to-end test, I covered one complete buyer journey: open a published catalogue, select a product, submit an enquiry, then verify the enquiry appears in the admin Leads page.

## 2. Riskiest part of the product

The highest-risk area I identified was catalogue access control and lifecycle management.

If catalogue access is incorrect, unpublished or expired catalogue data could be exposed to buyers.

I also found authorization issues around admin-only catalogue actions and catalogue/listing ownership. These could allow unauthorized users to publish or delete catalogues or modify listings belonging to another catalogue.

If the enquiry flow is broken, buyers may submit enquiries that are not correctly recorded or visible to the internal team. This could result in lost leads and missed business opportunities.

I would therefore protect catalogue access, authorization, and the enquiry-to-lead flow first if I had only one week.

## 3. What I left out

- I did not try to automate every UI page because the task asked for one reliable end-to-end journey rather than many flaky tests.
- I did not add exhaustive tests for every CRUD operation.
- I did not cover every browser/device combination.
- I focused the API tests on authorization, ownership, validation, and access-control risks.

## 4. AI usage

- I used ChatGPT to help understand the assessment requirements and identify security/access-control scenarios that should be tested.
- I provided existing test code, Playwright code, relevant source code, and test outputs to AI for review and debugging.
- I used AI assistance to optimize existing tests, improve assertions and test structure, and identify additional coverage areas.
- I used AI to help analyze failing tests and structure the findings and write-up.
- I reviewed the suggestions against the actual codebase and ran the tests locally before accepting the results. I did not blindly copy generated code or conclusions.
- I also used Cursor as an editor while working on the test files.

## 5. One quality issue in the codebase

One codebase quality issue I identified is that some access-control checks are not consistently enforced at the server boundary.

For example, the catalogue deletion server action checks that the user is signed in but does not enforce the admin-only restriction before performing the destructive operation.

I added a focused regression test for this scenario:

`tests/admin-actions-access.test.ts` — `does not allow staff to delete a catalogue`

This makes the expected authorization rule explicit in the test suite and helps prevent the same regression in the future.

This is important because authorization should be enforced on the server/API, not only by what is shown or hidden in the UI.
