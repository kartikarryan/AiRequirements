using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MeetScribe.Data.Context.Configuration;

/// <summary>
/// EF Core configuration for MeetingEntity.
/// Defines table name, column constraints, and indexes.
/// Separated from DbContext for maintainability.
/// </summary>
public class MeetingConfiguration : IEntityTypeConfiguration<MeetingEntity>
{
    public void Configure(EntityTypeBuilder<MeetingEntity> builder)
    {
        builder.ToTable("Meetings");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.Description)
            .HasMaxLength(100);

        builder.Property(m => m.TemplateId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.AudioFileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(m => m.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(m => m.ErrorMessage)
            .HasMaxLength(500);

        builder.Property(m => m.Transcript)
            .HasColumnType("text");

        builder.Property(m => m.EditedResultJson)
            .HasColumnType("text");

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.HasOne(m => m.Project)
            .WithMany(p => p.Meetings)
            .HasForeignKey(m => m.ProjectId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Index on status for filtering
        builder.HasIndex(m => m.Status);

        // Index on created date for sorting
        builder.HasIndex(m => m.CreatedAt);
    }
}
