ALTER TABLE "UserSettings"
ADD COLUMN "useSettleUpLinkOverride" BOOLEAN NOT NULL DEFAULT false;

UPDATE "UserSettings"
SET "useSettleUpLinkOverride" = true
WHERE "settleUpLink" IS NOT NULL;
