using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AgileTaskHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "Id", "CreatedAt", "Email", "Name", "PasswordHash" },
                values: new object[,]
                {
                    { new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "owner@agile-task-hub.local", "Agile Task Hub Owner", "v1.JOMo7Jkybi9GhW/uPApraQ==.HOVybW9avt0RcZZip2oKOj06GljMTbdFwQ6CPHiSBqTqqvY4Uq4PsaNJvErcMFbMh4V1NHnMSa4RPlkqvMGMHA==" },
                    { new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "member@agile-task-hub.local", "Agile Task Hub Member", "v1.dSopjLk51NVU1F24mVY5BA==.E5MgFcI9SSXmMsCHTtdefya4vrEmVbhlf7VKYBmXqTHx2BTXZGE7o7EEbHfAywxmNPbSCEj6ESCehMgJaEL5ZQ==" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040001"));

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040002"));
        }
    }
}
