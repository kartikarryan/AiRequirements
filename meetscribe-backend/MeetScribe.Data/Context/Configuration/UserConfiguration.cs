using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MeetScribe.Data.Context.Configuration;

public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.HasKey(u => u.Id);

        builder.HasIndex(u => u.CognitoSub).IsUnique();
        builder.HasIndex(u => u.Email);

        builder.Property(u => u.CognitoSub).IsRequired().HasMaxLength(128);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.Property(u => u.Name).IsRequired().HasMaxLength(256);
        builder.Property(u => u.PictureUrl).HasMaxLength(1024);

        builder.Property(u => u.IsActive).HasDefaultValue(true);
        builder.Property(u => u.UploadLimit).HasDefaultValue(5);
        builder.Property(u => u.UploadsUsed).HasDefaultValue(0);
        builder.Property(u => u.IsAdmin).HasDefaultValue(false);
        builder.Property(u => u.AdminNotes).HasMaxLength(500);

        builder.HasMany(u => u.Projects)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.Meetings)
            .WithOne(m => m.User)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.IntegrationSettings)
            .WithOne(i => i.User)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
