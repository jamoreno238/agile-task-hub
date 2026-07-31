using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgileTaskHub.Infrastructure.Persistence.Configurations;

public sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("task_items");
        builder.HasKey(task => task.Id);
        builder.Property(task => task.Title).HasMaxLength(240).IsRequired();
        builder.Property(task => task.Description).HasMaxLength(8000).IsRequired();
        builder.Property(task => task.Priority).IsRequired();
        builder.Property(task => task.Position).IsRequired();
        builder.Property(task => task.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.Property(task => task.UpdatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.HasIndex(task => new { task.ColumnId, task.Position });
        builder.HasIndex(task => new { task.ColumnId, task.Priority });
        builder.HasOne(task => task.ResponsibleUser)
            .WithMany(user => user.AssignedTasks)
            .HasForeignKey(task => task.ResponsibleUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
