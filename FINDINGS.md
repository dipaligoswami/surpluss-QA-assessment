# Findings

One section per bug. Add or remove sections as needed — the headings are only a
starting point, not a form you have to fill in exactly.

---

## 1. <short title>

**What happens**

<One or two plain sentences.>

**Steps to reproduce**

1.
2.
3.

**What should happen instead**

<>

**Impact — how bad is this, and why?**

<Does it cost money, leak pricing or customer data, or is it cosmetic? Say who
is affected and under what conditions.>

**Failing test**

`<path/to/your.test.ts>` — `<test name>`

---

## 2. <short title>

...

## 1. Future validity date is incorrectly marked as expired

**What happens**

A catalogue with a future validity date is incorrectly shown as `Expired` on the catalogue listing page. However, the edit view shows the catalogue as `Live`, and the public catalogue remains accessible even though its validity date has not passed.

**Steps to reproduce**

1. Sign in as a staff user.
2. Open an existing catalogue in **Edit** mode.
3. Set **Valid Until** to a future date, for example **31 December 2026**.
4. Keep the catalogue status as **Live**.
5. Click **Save catalogue**.
6. Return to the catalogue listing page.
7. The catalogue is displayed with an **Expired** status.
8. Open the catalogue in **Edit** mode again.
9. The status is still shown as **Live** and the **Valid Until** date is still in the future.
10. Copy the catalogue URL and open it in a new Incognito tab.
11. The catalogue is publicly accessible and its products and prices are displayed.

**What should happen instead**

A catalogue with a future **Valid Until** date should remain **Live** consistently across the catalogue listing, edit view, and public catalogue. It should become `Expired` only after the validity date has passed.

**Impact — how bad is this, and why?**

**Medium — functional/business impact.** The catalogue has inconsistent status information across the application. Staff may believe a valid catalogue has expired, while buyers can still access it publicly. This can cause confusion in catalogue management and visibility decisions.

**Failing test**

`tests/catalogue-status.test.ts` — `keeps a published catalogue live when its validity date is in the future`

---

## 2. Staff users can publish catalogues

**What happens**

A staff user can change a catalogue from `Draft` to `Live` through the catalogue UI. The update is accepted even though publishing a catalogue should be restricted to admin users.

**Steps to reproduce**

1. Sign in as `staff@catalogue.test` with the staff account.
2. Open a draft catalogue.
3. Change its status from `Draft` to `Live`.
4. Click **Save**.
5. The catalogue becomes Live and is publicly accessible.

**What should happen instead**

Only an admin user should be able to change a catalogue from `Draft` to `Live`. A staff user's attempt to publish should be rejected with `403 Forbidden`.

**Impact — how bad is this, and why?**

**High — security/authorization impact.** A staff user can publish catalogues without the required admin permission. Publishing can expose catalogue pricing and products publicly, so unauthorized publication can have business and pricing visibility consequences.

**Failing test**

`tests/catalogue-access.test.ts` — `does not allow staff to publish a catalogue`

---

## 3. Staff users can delete catalogues through the server action

**What happens**

Although the Delete action is not shown in the staff UI, the server action does not enforce the admin-only restriction. A staff user can invoke the delete action directly and the catalogue deletion is executed.

**Steps to reproduce**

1. Sign in as `staff@catalogue.test` with the staff account.
2. Open the catalogue management area.
3. The staff UI does not show a **Delete** option for catalogues.
4. Invoke the catalogue deletion server action directly for a valid catalogue ID as the staff user.
5. The server action proceeds with the delete operation instead of rejecting the request.

**What should happen instead**

The server action should verify that the current user is an admin before deleting a catalogue. A staff user's deletion attempt should be rejected and the catalogue should remain unchanged.

**Impact — how bad is this, and why?**

**High — security/authorization impact.** Catalogue deletion is a destructive action and can remove catalogue data and associated lead history. Hiding the Delete option in the UI is not sufficient because the server action can still be invoked directly by a staff user.

**Failing test**

`tests/admin-actions-access.test.ts` — `does not allow staff to delete a catalogue`

---

## 4. Catalogue listing can be modified across catalogue boundaries

**What happens**

The listing update endpoint does not verify that the requested listing belongs to the catalogue identified in the URL. By changing the catalogue ID while using a listing ID from another catalogue, the server still accepts the update.

**Steps to reproduce**

1. Sign in as an authenticated staff user.
2. Identify two different catalogues: Catalogue A and Catalogue B.
3. Identify a listing that belongs to Catalogue A.
4. Send a `PATCH` request to the listing update endpoint using Catalogue B's ID in the URL while using the listing ID that belongs to Catalogue A.
5. The server accepts the request and returns `200 OK` with `{"ok":true}`.
6. The update operation is executed even though the listing does not belong to Catalogue B.

**What should happen instead**

The server should verify that the listing belongs to the catalogue specified in the URL. If it does not, the request should be rejected and no update should be performed.

**Impact — how bad is this, and why?**

**High — security/authorization impact.** An authenticated user can potentially modify a listing belonging to another catalogue by tampering with the catalogue ID. This breaks catalogue-level access control and could allow unauthorized changes to product visibility, pricing, quantity, or other listing data.

**Failing test**

`tests/catalogue-listing-access.test.ts` — `should not modify a listing belonging to another catalogue`

---

## 5. Public catalogue search endpoint does not enforce draft or expiry restrictions

**What happens**

The public catalogue search API accepts requests for catalogues that are still in `Draft` status or whose validity period has expired. The endpoint returns `200 OK` instead of rejecting the request, and the listing lookup is still executed.

The normal public catalogue UI correctly blocks these catalogues, but the backend search endpoint does not enforce the same access rules.

**Steps to reproduce**

1. Use a catalogue with `Draft` status.
2. Without signing in, send a request to:
   `GET /api/catalogues/{catalogue-slug}/search`
3. The API returns `200 OK` instead of rejecting access to the draft catalogue.
4. Repeat the request for a catalogue whose validity date has already passed.
5. The API again returns `200 OK` instead of rejecting access to the expired catalogue.
6. The automated test also verifies that the catalogue listing query is executed for both cases.

**What should happen instead**

The public search endpoint should only return results for catalogues that are currently published and within their validity period.

Requests for draft or expired catalogues should be rejected or return no catalogue data without querying their listings.

**Impact — how bad is this, and why?**

**High — security/data exposure impact.** Draft catalogues may contain confidential inventory and pricing that has not been approved for buyers, while expired catalogues may contain outdated inventory or pricing. Relying only on the UI to block access leaves the backend endpoint without the same access-control protection.

**Failing test**

`tests/public-catalogue-access.test.ts` — `should not expose a draft catalogue to a signed-out user` and `should not expose an expired catalogue`