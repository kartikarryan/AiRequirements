

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260626131341_Date_Column_Added_In_Meetings_Table') THEN
    ALTER TABLE "Meetings" ADD "MeetingDate" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260626131341_Date_Column_Added_In_Meetings_Table') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260626131341_Date_Column_Added_In_Meetings_Table', '8.0.0');
    END IF;
END $EF$;
COMMIT;

