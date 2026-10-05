import { expect, test } from "@playwright/test";

function randomName() {
    const first = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ananya"];
    const last = ["Sharma", "Patel", "Iyer", "Khan", "Nair", "Gupta"];
    const pick = (values: string[]) => values[Math.floor(Math.random() * values.length)];   
    return `${pick(first)} ${pick(last)}`;
}

function randomMobileNumber() {
    const firstDigit = 6 + Math.floor(Math.random() * 4);
    const rest = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)).join("");
    return `${firstDigit}${rest}`;
}

test("buyer submits a product enquiry and verifies it in admin leads", async ({page}) => {
    const name = randomName();

    await page.goto(
        "http://localhost:3001/catalogue/premium-corporate-essentials",
    );
    const product = page
        .locator("article")
        .filter({ hasText: "Atlas cabin trolley" });
    await expect(product).toBeVisible();
    await product.click();
    await expect(page.getByText("Atlas cabin trolley").last()).toBeVisible();
    await page.getByRole("button", { name: "Contact Us" }).click();
    await expect(page.getByText("Atlas cabin trolley").last()).toBeVisible();
    await expect(page.locator("#contact-name")).toBeVisible();
    await page.locator("#contact-name").fill(name);
    await page.locator("#contact-phone").fill(randomMobileNumber());
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(
        page.getByRole("heading", { name: "Enquiry sent" }),
    ).toBeVisible({ timeout: 10000 });
    await page.goto("http://localhost:3001/login");
    await expect(page).toHaveURL("http://localhost:3001/login");
    await page.getByLabel("Email").fill("staff@catalogue.test");
    await page.getByLabel("Password").fill("Staff#2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    const leadsLink = page.getByRole("link", { name: "Leads" });
    await expect(leadsLink).toBeVisible({ timeout: 10000 });
    await leadsLink.click();
    const firstLeadName = page
    .locator('[data-slot="table-body"] tr')
    .first()
    .getByRole("link")
    .first();

    await expect(firstLeadName).toHaveText(name);
});