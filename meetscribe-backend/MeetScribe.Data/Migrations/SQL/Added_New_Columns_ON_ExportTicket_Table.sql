

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630052749_Added_New_Columns_ON_ExportTicket_Table') THEN
    ALTER TABLE "ExportedTickets" ADD "IterationPath" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630052749_Added_New_Columns_ON_ExportTicket_Table') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260630052749_Added_New_Columns_ON_ExportTicket_Table', '8.0.0');
    END IF;
END $EF$;
COMMIT;

