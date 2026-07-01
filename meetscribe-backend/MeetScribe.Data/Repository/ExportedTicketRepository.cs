using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

public interface IExportedTicketRepository
{
    Task<List<ExportedTicketEntity>> GetByMeetingIdAsync(int meetingId, CancellationToken cancellationToken = default);
    Task<ExportedTicketEntity?> FindDuplicateAsync(int meetingId, string title, string provider, CancellationToken cancellationToken = default);
    Task<List<ExportedTicketEntity>> FindDuplicatesBatchAsync(int meetingId, List<string> titles, string provider, CancellationToken cancellationToken = default);
    Task<ExportedTicketEntity> SaveAsync(ExportedTicketEntity entity, CancellationToken cancellationToken = default);
}

public class ExportedTicketRepository : IExportedTicketRepository
{
    private readonly MeetScribeDbContext _context;

    public ExportedTicketRepository(MeetScribeDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExportedTicketEntity>> GetByMeetingIdAsync(int meetingId, CancellationToken cancellationToken = default)
    {
        return await _context.ExportedTickets
            .Where(t => t.MeetingId == meetingId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ExportedTicketEntity?> FindDuplicateAsync(int meetingId, string title, string provider, CancellationToken cancellationToken = default)
    {
        return await _context.ExportedTickets
            .FirstOrDefaultAsync(t =>
                t.MeetingId == meetingId &&
                t.Provider == provider &&
                t.Title == title,
                cancellationToken);
    }

    public async Task<List<ExportedTicketEntity>> FindDuplicatesBatchAsync(int meetingId, List<string> titles, string provider, CancellationToken cancellationToken = default)
    {
        return await _context.ExportedTickets
            .Where(t => t.MeetingId == meetingId && t.Provider == provider && titles.Contains(t.Title))
            .ToListAsync(cancellationToken);
    }

    public async Task<ExportedTicketEntity> SaveAsync(ExportedTicketEntity entity, CancellationToken cancellationToken = default)
    {
        entity.CreatedAt = DateTime.UtcNow;
        _context.ExportedTickets.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }
}
