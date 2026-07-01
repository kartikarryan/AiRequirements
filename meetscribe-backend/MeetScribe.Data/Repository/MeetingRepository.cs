using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

/// <summary>
/// EF Core implementation of IMeetingRepository.
/// Handles all database operations for the Meetings table.
/// </summary>

public interface IMeetingRepository
{
    /// <summary>Creates a new meeting record.</summary>
    Task<MeetingEntity> CreateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default);

    /// <summary>Gets a meeting by ID. Returns null if not found.</summary>
    Task<MeetingEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Gets all meetings ordered by most recent first.</summary>
    Task<List<MeetingEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Updates an existing meeting record.</summary>
    Task<MeetingEntity> UpdateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default);

    /// <summary>Deletes a meeting by ID.</summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<List<MeetingEntity>> GetAllByIdAsync(int id, CancellationToken cancellationToken = default);
}
public class MeetingRepository : IMeetingRepository
{
    private readonly MeetScribeDbContext _context;

    public MeetingRepository(MeetScribeDbContext context)
    {
        _context = context;
    }

    public async Task<MeetingEntity> CreateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default)
    {
        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync(cancellationToken);
        return meeting;
    }

    public async Task<MeetingEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<List<MeetingEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MeetingEntity>> GetAllByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .Where(w=>w.ProjectId== id)
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<MeetingEntity> UpdateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default)
    {
        _context.Meetings.Update(meeting);
        await _context.SaveChangesAsync(cancellationToken);
        return meeting;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var meeting = await _context.Meetings.FindAsync(new object[] { id }, cancellationToken);
        if (meeting is null) return false;

        _context.Meetings.Remove(meeting);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
