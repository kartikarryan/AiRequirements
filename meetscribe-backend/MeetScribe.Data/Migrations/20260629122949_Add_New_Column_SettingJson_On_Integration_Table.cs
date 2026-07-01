using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetScribe.Data.Migrations
{
    /// <inheritdoc />
    public partial class Add_New_Column_SettingJson_On_Integration_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccessToken",
                table: "IntegrationSettings");

            migrationBuilder.DropColumn(
                name: "DefaultProject",
                table: "IntegrationSettings");

            migrationBuilder.DropColumn(
                name: "DefaultWorkItemType",
                table: "IntegrationSettings");

            migrationBuilder.DropColumn(
                name: "OrganizationUrl",
                table: "IntegrationSettings");

            migrationBuilder.DropColumn(
                name: "PatExpiryDate",
                table: "IntegrationSettings");

            migrationBuilder.AddColumn<string>(
                name: "SettingsJson",
                table: "IntegrationSettings",
                type: "jsonb",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SettingsJson",
                table: "IntegrationSettings");

            migrationBuilder.AddColumn<string>(
                name: "AccessToken",
                table: "IntegrationSettings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultProject",
                table: "IntegrationSettings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultWorkItemType",
                table: "IntegrationSettings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganizationUrl",
                table: "IntegrationSettings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "PatExpiryDate",
                table: "IntegrationSettings",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
