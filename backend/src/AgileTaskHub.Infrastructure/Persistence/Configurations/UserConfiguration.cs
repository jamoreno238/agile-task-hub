using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AgileTaskHub.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Name).HasMaxLength(160).IsRequired();
        builder.Property(user => user.Email).HasMaxLength(320).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
        builder.Property(user => user.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();
        builder.HasIndex(user => user.Email).IsUnique();
    }
}
