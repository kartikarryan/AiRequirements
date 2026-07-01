using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Context;

/// <summary>
/// EF Core DbContext for MeetScribe.
/// Model configurations are separated into individual files in the Configuration folder.
/// </summary>
public class MeetScribeDbContext : DbContext
{
    public MeetScribeDbContext(DbContextOptions<MeetScribeDbContext> options)
        : base(options)
    {
    }

    public DbSet<MeetingEntity> Meetings => Set<MeetingEntity>();
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<IntegrationSettingEntity> IntegrationSettings => Set<IntegrationSettingEntity>();
    public DbSet<ExportedTicketEntity> ExportedTickets => Set<ExportedTicketEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from this assembly (scans for IEntityTypeConfiguration)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MeetScribeDbContext).Assembly);
    }
}
