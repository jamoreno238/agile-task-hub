using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgileTaskHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpectedEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "board_columns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Position = table.Column<long>(type: "bigint", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_board_columns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_board_columns_projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Description = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    ResponsibleUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ColumnId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_task_items_board_columns_ColumnId",
                        column: x => x.ColumnId,
                        principalTable: "board_columns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_items_users_ResponsibleUserId",
                        column: x => x.ResponsibleUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_board_columns_ProjectId_Position",
                table: "board_columns",
                columns: new[] { "ProjectId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_projects_Name",
                table: "projects",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_task_items_ColumnId_Position",
                table: "task_items",
                columns: new[] { "ColumnId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_task_items_ColumnId_Priority",
                table: "task_items",
                columns: new[] { "ColumnId", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_task_items_ResponsibleUserId",
                table: "task_items",
                column: "ResponsibleUserId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_items");

            migrationBuilder.DropTable(
                name: "board_columns");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "projects");
        }
    }
}
