using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgileTaskHub.Infrastructure.Persistence.Configurations;

public sealed class BoardColumnConfiguration : IEntityTypeConfiguration<BoardColumn>
{
    public void Configure(EntityTypeBuilder<BoardColumn> builder)
    {
        builder.ToTable("board_columns");
        builder.HasKey(column => column.Id);
        builder.Property(column => column.Name).HasMaxLength(120).IsRequired();
        builder.Property(column => column.Position).IsRequired();
        builder.Property(column => column.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.HasIndex(column => new { column.ProjectId, column.Position });
        builder.HasMany(column => column.Tasks)
            .WithOne(task => task.Column)
            .HasForeignKey(task => task.ColumnId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
