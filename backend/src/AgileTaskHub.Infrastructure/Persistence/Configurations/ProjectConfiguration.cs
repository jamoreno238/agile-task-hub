using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgileTaskHub.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");
        builder.HasKey(project => project.Id);
        builder.Property(project => project.Name).HasMaxLength(180).IsRequired();
        builder.Property(project => project.Description).HasMaxLength(4000).IsRequired();
        builder.Property(project => project.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(project => project.StartDate).HasColumnType("timestamp with time zone").IsRequired();
        builder.Property(project => project.ExpectedEndDate).HasColumnType("timestamp with time zone").IsRequired();
        builder.Property(project => project.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.Property(project => project.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.HasIndex(project => project.Name);
        builder.HasMany(project => project.Columns)
            .WithOne(column => column.Project)
            .HasForeignKey(column => column.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
