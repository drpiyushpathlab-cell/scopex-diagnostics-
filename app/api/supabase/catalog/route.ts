import { NextResponse } from "next/server";
import { getSupabaseAnonServerClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { normalizeMoney, type SupabaseCatalogItem } from "@/lib/supabase-booking";
import { packagesData, testsData } from "@/lib/data";

export const runtime = "nodejs";

function localFallbackCatalog(message: string, status = 200) {
  const tests: SupabaseCatalogItem[] = testsData.map((test) => ({
    id: test.id,
    type: "test",
    slug: test.id,
    name: test.name,
    description: test.components?.slice(0, 4).join(", ") || test.group,
    price: normalizeMoney(test.price),
    mrp: normalizeMoney(test.price),
    referencePrice: null,
    category: test.group,
    categorySlug: test.group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    source: "local_fallback",
    active: true
  }));

  const packages: SupabaseCatalogItem[] = packagesData.map((item) => ({
    id: item.id,
    type: "package",
    slug: item.id,
    name: item.name,
    description: item.tagline,
    price: normalizeMoney(item.price),
    mrp: normalizeMoney(item.price),
    referencePrice: null,
    category: item.section,
    categorySlug: item.section.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    source: "local_fallback",
    active: true
  }));

  return NextResponse.json({ success: true, source: "local_fallback", message, tests, packages, items: [...packages, ...tests] }, { status });
}

export async function GET(request: Request) {
  try {
    if (!hasSupabasePublicConfig()) {
      return localFallbackCatalog("Supabase public configuration is not set. Showing local fallback catalog.");
    }

    const supabase = getSupabaseAnonServerClient();
    const city = new URL(request.url).searchParams.get("city")?.trim() || null;

    const [prdTestsResult, prdPackagesResult] = await Promise.all([
      supabase
        .from("tests")
        .select("id, slug, name, display_name, description, price, discounted_price, real_price, active, category:test_categories(slug,name)")
        .eq("active", true)
        .order("name"),
      supabase
        .from("packages")
        .select("id, slug, name, description, regular_price, selling_price, real_price, active")
        .eq("active", true)
        .order("name")
    ]);

    if (!prdTestsResult.error && !prdPackagesResult.error) {
      const testIds = (prdTestsResult.data || []).map((test) => test.id);
      const packageIds = (prdPackagesResult.data || []).map((item) => item.id);
      const [cityPricesResult, evidenceResult] = await Promise.all([
        testIds.length
          ? supabase
              .from("test_city_prices")
              .select("test_id, city, real_price, active")
              .in("test_id", testIds)
              .eq("active", true)
          : Promise.resolve({ data: [], error: null }),
        testIds.length || packageIds.length
          ? supabase
              .from("reference_price_evidence")
              .select("test_id, package_id, city, reference_price, status, expires_at")
              .eq("status", "ACTIVE")
          : Promise.resolve({ data: [], error: null })
      ]);

      const cityPrices = new Map<string, number>();
      for (const row of cityPricesResult.data || []) {
        const rowCity = String(row.city || "").toLowerCase();
        if (!city || rowCity === city.toLowerCase()) cityPrices.set(String(row.test_id), normalizeMoney(row.real_price));
      }

      const referencePrices = new Map<string, number>();
      for (const row of evidenceResult.data || []) {
        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) continue;
        const rowCity = String(row.city || "").toLowerCase();
        if (city && rowCity && rowCity !== city.toLowerCase()) continue;
        const key = row.test_id ? `test:${row.test_id}` : `package:${row.package_id}`;
        const current = referencePrices.get(key) || 0;
        referencePrices.set(key, Math.max(current, normalizeMoney(row.reference_price)));
      }

      const tests: SupabaseCatalogItem[] = (prdTestsResult.data || []).map((test) => {
        const realPrice = cityPrices.get(test.id) ?? normalizeMoney(test.real_price || test.discounted_price || test.price);
        const referencePrice = referencePrices.get(`test:${test.id}`) ?? null;
        const category = Array.isArray(test.category) ? test.category[0] : test.category;
        return {
          id: test.id,
          type: "test",
          slug: test.slug,
          name: test.display_name || test.name,
          description: test.description,
          price: realPrice,
          mrp: realPrice,
          referencePrice,
          category: category?.name || null,
          categorySlug: category?.slug || null,
          source: "supabase_prd",
          active: test.active
        };
      });

      const packages: SupabaseCatalogItem[] = (prdPackagesResult.data || []).map((item) => {
        const realPrice = normalizeMoney(item.real_price || item.selling_price || item.regular_price);
        const referencePrice = referencePrices.get(`package:${item.id}`) ?? null;
        return {
          id: item.id,
          type: "package",
          slug: item.slug,
          name: item.name,
          description: item.description,
          price: realPrice,
          mrp: realPrice,
          referencePrice,
          source: "supabase_prd",
          active: item.active
        };
      });

      return NextResponse.json({ success: true, source: "supabase_prd", tests, packages, items: [...packages, ...tests] });
    }

    const [testsResult, packagesResult] = await Promise.all([
      supabase.from("tests").select("id, slug, name, description, price, discounted_price, active").eq("active", true).order("name"),
      supabase.from("packages").select("id, slug, name, description, regular_price, selling_price, active").eq("active", true).order("name")
    ]);

    if (testsResult.error) throw testsResult.error;
    if (packagesResult.error) throw packagesResult.error;

    const tests: SupabaseCatalogItem[] = (testsResult.data || []).map((test) => {
      const mrp = normalizeMoney(test.price);
      const price = normalizeMoney(test.discounted_price || test.price);
      return {
        id: test.id,
        type: "test",
        slug: test.slug,
        name: test.name,
        description: test.description,
        price,
        mrp: price,
        referencePrice: mrp > price ? mrp : null,
        source: "supabase_legacy",
        active: test.active
      };
    });

    const packages: SupabaseCatalogItem[] = (packagesResult.data || []).map((item) => ({
      id: item.id,
      type: "package",
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: normalizeMoney(item.selling_price),
      mrp: normalizeMoney(item.selling_price),
      referencePrice: normalizeMoney(item.regular_price) > normalizeMoney(item.selling_price) ? normalizeMoney(item.regular_price) : null,
      source: "supabase_legacy",
      active: item.active
    }));

    return NextResponse.json({ success: true, source: "supabase_legacy", tests, packages, items: [...packages, ...tests] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Supabase catalog.";
    return localFallbackCatalog(`Supabase catalog unavailable. ${message}`);
  }
}
