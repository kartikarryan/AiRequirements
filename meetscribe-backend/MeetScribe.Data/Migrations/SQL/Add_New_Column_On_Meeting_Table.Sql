

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625090722_Add_New_Column_On_Meeting_Table') THEN
    ALTER TABLE "Meetings" ADD "EditedResultJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625090722_Add_New_Column_On_Meeting_Table') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260625090722_Add_New_Column_On_Meeting_Table', '8.0.0');
    END IF;
END $EF$;
COMMIT;

