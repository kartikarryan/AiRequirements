

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629113255_Add_New_Column_ExpiredDate') THEN
    ALTER TABLE "IntegrationSettings" ADD "PatExpiryDate" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629113255_Add_New_Column_ExpiredDate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260629113255_Add_New_Column_ExpiredDate', '8.0.0');
    END IF;
END $EF$;
COMMIT;

