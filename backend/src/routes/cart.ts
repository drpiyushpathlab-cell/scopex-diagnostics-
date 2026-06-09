import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "@/backend/src/lib/async-route";
import { requireAuth, type AuthedRequest } from "@/backend/src/middleware/auth";
import { insforge } from "@/backend/src/lib/insforge";
import { HttpError } from "@/backend/src/lib/http-error";

const cartItemSchema = z.object({
  memberId: z.string().uuid().nullable().optional(),
  itemType: z.enum(["package", "test"]),
  itemRef: z.string().min(1),
  itemName: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative(),
  mrp: z.coerce.number().nonnegative().optional().default(0),
  category: z.string().optional().default(""),
  description: z.string().optional().default(""),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1)
});

async function assertMemberBelongsToUser(memberId: string | null | undefined, userId: string) {
  if (!memberId) return;

  const { data, error } = await insforge.database
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new HttpError(400, "Selected family member is invalid.");
  }
}

export const cartRouter = Router();

cartRouter.get(
  "/",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { data, error } = await insforge.database
      .from("cart_items")
      .select("id, member_id, item_type, item_ref, item_name, unit_price, mrp, category, description, quantity, created_at, family_members(id, name, relation)")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw new HttpError(500, error.message || "Unable to fetch cart.");

    const items = (data ?? []) as Array<{ unit_price?: number | string; quantity?: number }>;
    const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price ?? 0) * Number(item.quantity ?? 1), 0);

    response.json({ items: data ?? [], subtotal });
  })
);

cartRouter.post(
  "/items",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    const parsed = cartItemSchema.parse(request.body);
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    await assertMemberBelongsToUser(parsed.memberId, auth.userId);

    const { data, error } = await insforge.database
      .from("cart_items")
      .insert({
        user_id: auth.userId,
        member_id: parsed.memberId || null,
        item_type: parsed.itemType,
        item_ref: parsed.itemRef,
        item_name: parsed.itemName,
        unit_price: parsed.unitPrice,
        mrp: parsed.mrp,
        category: parsed.category || null,
        description: parsed.description || null,
        quantity: parsed.quantity
      })
      .select("*")
      .single();

    if (error || !data) throw new HttpError(500, error?.message || "Unable to add cart item.");

    response.status(201).json({ success: true, item: data });
  })
);

cartRouter.delete(
  "/items/:id",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { error } = await insforge.database
      .from("cart_items")
      .delete()
      .eq("id", request.params.id)
      .eq("user_id", auth.userId);

    if (error) throw new HttpError(500, error.message || "Unable to remove cart item.");

    response.json({ success: true });
  })
);

cartRouter.delete(
  "/clear",
  requireAuth("patient"),
  asyncRoute(async (request: AuthedRequest, response) => {
    const auth = request.auth;
    if (!auth?.userId) throw new HttpError(401, "Patient session is missing.");

    const { error } = await insforge.database.from("cart_items").delete().eq("user_id", auth.userId);
    if (error) throw new HttpError(500, error.message || "Unable to clear cart.");

    response.json({ success: true });
  })
);
