import { NextResponse } from "next/server";
import { getSupabaseAnonServerClient, hasSupabasePublicConfig } from "@/lib/supabase";
import { normalizeMoney, type SupabaseCatalogItem } from "@/lib/supabase-booking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasSupabasePublicConfig()) {
      return NextResponse.json({ success: false, source: "unavailable", message: "The diagnostic catalog is not configured." }, { status: 503 });
    }

    const supabase = getSupabaseAnonServerClient();
    const city = new URL(request.url).searchParams.get("city")?.trim() || null;

    const [prdTestsResult, prdPackagesResult] = await Promise.all([
      supabase
        .from("tests")
        .select("id, slug, name, display_name, description, price, discounted_price, real_price, active, sample_type, preparation_instructions, fasting_required, report_tat_hours, schema_json, category:test_categories(slug,name)")
        .eq("active", true)
        .order("name"),
      supabase
        .from("packages")
        .select("id, slug, name, description, regular_price, selling_price, real_price, active, featured, schema_json, package_tests(test_id)")
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
          mrp: normalizeMoney(test.price),
          referencePrice,
          category: category?.name || null,
          categorySlug: category?.slug || null,
          source: "supabase_prd",
          active: test.active,
          sampleType: test.sample_type,
          preparationInstructions: test.preparation_instructions,
          fastingRequired: test.fasting_required,
          reportTatHours: test.report_tat_hours,
          schema: test.schema_json || {}
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
          mrp: normalizeMoney(item.regular_price),
          referencePrice,
          featured: item.featured,
          testIds: (item.package_tests || []).map((link: { test_id: string }) => link.test_id),
          schema: item.schema_json || {},
          source: "supabase_prd",
          active: item.active
        };
      });

      return NextResponse.json({ success: true, source: "supabase_prd", tests, packages, items: [...packages, ...tests] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    return NextResponse.json({ success: false, source: "unavailable", message: "Unable to load the diagnostic catalog." }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ success: false, source: "unavailable", message: "Unable to load the diagnostic catalog." }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
