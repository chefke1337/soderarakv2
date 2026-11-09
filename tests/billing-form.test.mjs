/**
 * SZÁMLÁZÁSI ADATOK — kliensoldali űrlaplogika (src/lib/billing-form.ts).
 * Vevőtípus-váltás, nem releváns mezők kizárása, üres/részleges blokk,
 * címmásolás felülírás-védelme. Futtatás: npm run test:billing
 */
import {
  applyDeliveryAddress,
  billingErrors,
  billingPayload,
  copyWouldOverwrite,
  EMPTY_BILLING,
  isBillingStarted,
} from "../src/lib/billing-form.ts";
import { validateOrderRequest } from "../src/lib/order.ts";
import { PRICING_VERSION } from "../src/content/catalog.ts";
import { check, eq, section, finish } from "./_harness.mjs";

const full = {
  ...EMPTY_BILLING,
  customerType: "business",
  businessName: "Példa Építő Kft.",
  privateName: "Teszt Elek",
  taxNumber: "12345678-2-42",
  postalCode: "2030",
  city: "Érd",
  streetAddress: "Fő utca 1.",
};

section("Üres és opcionális blokk");
eq("alapállapot: nincs beküldendő adat", billingPayload(EMPTY_BILLING), null);
eq("csak vevőtípus választva: nincs beküldendő adat", billingPayload({ ...EMPTY_BILLING, customerType: "private" }), null);
check("az alapértelmezett ország nem számít kitöltésnek", !isBillingStarted({ ...EMPTY_BILLING, customerType: "business" }));
check("üres blokk: nincs hiba", Object.keys(billingErrors({ ...EMPTY_BILLING, customerType: "business" })).length === 0);

section("Vevőtípus-váltás");
{
  const biz = billingPayload(full);
  eq("cég: cégnév kerül a névbe", biz.name, "Példa Építő Kft.");
  eq("cég: adószám a beküldésben", biz.taxNumber, "12345678-2-42");
  const priv = billingPayload({ ...full, customerType: "private" });
  eq("magánszemélyre váltva: a magánszemély neve", priv.name, "Teszt Elek");
  check("magánszemélyre váltva: a korábbi adószám NEM kerül a beküldésbe", !("taxNumber" in priv));
  const back = billingPayload({ ...full, customerType: "private" });
  check("visszaváltás után a cégadatok az állapotban megmaradnak (nem vesznek el)", back !== null && full.businessName === "Példa Építő Kft.");
  const req = validateOrderRequest({
    name: "Teszt Elek", email: "teszt@example.com", phone: "+36 30 123 4567",
    materialSlug: "soder-0-24", m3: 8, municipalityId: "budapest", districtId: 22, postalCode: "1221",
    address: "Teszt utca 1.", pricingVersion: PRICING_VERSION, idempotencyKey: "billing-form-0001",
    privacyAccepted: true, billing: priv,
  });
  check("a magánszemélyes beküldés átmegy a közös sémán", req.ok && req.value.billing.taxNumber === "");
}

section("Részleges blokk");
{
  const partial = { ...EMPTY_BILLING, customerType: "private", privateName: "Kovács Anna" };
  const e = billingErrors(partial);
  check("hiányzó irányítószám jelezve", Boolean(e.postalCode));
  check("hiányzó település jelezve", Boolean(e.city));
  check("hiányzó utca jelezve", Boolean(e.streetAddress));
  check("a kitöltött névre nincs hiba", !e.name);
  check("magánszemélynél nincs adószám-hiba", !e.taxNumber);
  const bizPartial = { ...EMPTY_BILLING, customerType: "business", businessName: "X Kft." };
  check("cég: hiányzó adószám jelezve", Boolean(billingErrors(bizPartial).taxNumber));
  check("hosszú cím elfér (160 karakter)", Object.keys(billingErrors({ ...full, streetAddress: "Á".repeat(160) })).length === 0);
  check("túl hosszú cím hibát ad", Boolean(billingErrors({ ...full, streetAddress: "Á".repeat(161) }).streetAddress));
}

section("Címmásolás");
{
  const d = { postalCode: "1221", city: "Budapest", streetAddress: "Teszt utca 1." };
  check("üres címmezőknél nincs felülírás-kérdés", !copyWouldOverwrite({ ...EMPTY_BILLING, customerType: "private" }, d));
  check("eltérő kitöltött mezőnél megerősítés kell", copyWouldOverwrite({ ...EMPTY_BILLING, customerType: "private", city: "Érd" }, d));
  check("azonos értéknél nem kell megerősítés", !copyWouldOverwrite({ ...EMPTY_BILLING, postalCode: "1221" }, d));
  const after = applyDeliveryAddress({ ...full }, d);
  eq("másolás: irányítószám", after.postalCode, "1221");
  eq("másolás: település", after.city, "Budapest");
  eq("másolás: cégnév nem változik", after.businessName, "Példa Építő Kft.");
  eq("másolás: adószám nem változik", after.taxNumber, "12345678-2-42");
  eq("másolás: további címadat nem változik", applyDeliveryAddress({ ...full, additionalAddress: "2. em." }, d).additionalAddress, "2. em.");
}

finish("billing-form.test.mjs");
