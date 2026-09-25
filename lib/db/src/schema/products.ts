import { integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("5.0"),
  reviewCount: integer("review_count").notNull().default(0),
  badge: text("badge"),
});

export const productVariantsTable = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  nameAr: text("name_ar").notNull(),
  hex: text("hex").notNull(),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(0),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
});
export const insertProductVariantSchema = createInsertSchema(
  productVariantsTable,
).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type ProductVariant = typeof productVariantsTable.$inferSelect;