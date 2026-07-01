using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MeetScribe.Data.Context.Configuration;

public class IntegrationSettingConfiguration : IEntityTypeConfiguration<IntegrationSettingEntity>
{
    public void Configure(EntityTypeBuilder<IntegrationSettingEntity> builder)
    {
        builder.ToTable("IntegrationSettings");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Provider)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.SettingsJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        // One config per provider
        builder.HasIndex(e => e.Provider).IsUnique();
    }
}
