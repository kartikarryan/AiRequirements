using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetScribe.Data.Migrations
{
    /// <inheritdoc />
    public partial class Date_Column_Added_In_Meetings_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "MeetingDate",
                table: "Meetings",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingDate",
                table: "Meetings");
        }
    }
}
