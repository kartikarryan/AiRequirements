

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

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" DROP COLUMN "AccessToken";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" DROP COLUMN "DefaultProject";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" DROP COLUMN "DefaultWorkItemType";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" DROP COLUMN "OrganizationUrl";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" DROP COLUMN "PatExpiryDate";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    ALTER TABLE "IntegrationSettings" ADD "SettingsJson" jsonb NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629122949_Add_New_Column_SettingJson_On_Integration_Table') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260629122949_Add_New_Column_SettingJson_On_Integration_Table', '8.0.0');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629123940_Add_New_Column_LinkedProject_On_Projects_Table') THEN
    ALTER TABLE "Projects" ADD "LinkedProvider" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260629123940_Add_New_Column_LinkedProject_On_Projects_Table') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260629123940_Add_New_Column_LinkedProject_On_Projects_Table', '8.0.0');
    END IF;
END $EF$;
COMMIT;

