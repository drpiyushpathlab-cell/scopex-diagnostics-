import { Router } from "express";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { insforge } from "@/backend/src/lib/insforge";
import { bookingTests } from "@/lib/booking-catalog";

export const testsRouter = Router();

testsRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const { data, error } = await insforge.database
      .from("tests")
      .select("id, slug, name, category, description, price, mrp, discount, fasting_required, fasting_hours")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    response.json({
      tests:
        data && data.length > 0
          ? data
          : bookingTests.map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              category: item.category,
              description: item.description,
              price: item.price,
              mrp: item.mrp,
              discount: item.discount,
              fasting_required: false,
              fasting_hours: null
            }))
    });
  })
);
