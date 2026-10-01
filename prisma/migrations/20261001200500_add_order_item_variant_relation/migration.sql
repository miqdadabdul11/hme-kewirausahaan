ALTER TABLE "OrderItem"
ADD COLUMN "variantId" TEXT;

UPDATE "OrderItem" AS item
SET "variantId" = pv."id"
FROM "ProductVariant" AS pv
WHERE item."productId" = pv."productId"
  AND item."variantName" = pv."name"
  AND (
    SELECT COUNT(*)
    FROM "ProductVariant" AS matching
    WHERE matching."productId" = item."productId"
      AND matching."name" = item."variantName"
  ) = 1;

CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
