import { Router } from "express";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { insforge } from "@/backend/src/lib/insforge";
import { bookingPackages } from "@/lib/booking-catalog";

export const packagesRouter = Router();

packagesRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const { data, error } = await insforge.database
      .from("packages")
      .select("id, slug, name, price, mrp, discount, category, description, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    response.json({
      packages:
        data && data.length > 0
          ? data
          : bookingPackages.map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              price: item.price,
              mrp: item.mrp,
              discount: item.discount,
              category: item.category,
              description: item.description,
              is_active: true
            }))
    });
  })
);
