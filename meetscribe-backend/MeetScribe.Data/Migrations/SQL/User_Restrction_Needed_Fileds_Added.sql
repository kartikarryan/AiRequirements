

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "AdminNotes" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "IsActive" boolean NOT NULL DEFAULT TRUE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "IsAdmin" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "QuotaResetAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "UploadLimit" integer NOT NULL DEFAULT 5;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    ALTER TABLE "Users" ADD "UploadsUsed" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260702211439_User_Restrction_Needed_Fileds_Added') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260702211439_User_Restrction_Needed_Fileds_Added', '8.0.0');
    END IF;
END $EF$;
COMMIT;

