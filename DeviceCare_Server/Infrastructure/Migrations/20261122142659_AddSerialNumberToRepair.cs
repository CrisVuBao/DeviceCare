using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeviceCare.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSerialNumberToRepair : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SerialNumber",
                table: "Repairs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SerialNumber",
                table: "Repairs");
        }
    }
}
