using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

public interface IMeetingRepository
{
    Task<MeetingEntity> CreateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default);
    Task<MeetingEntity?> GetByIdAsync(int id, int userId, CancellationToken cancellationToken = default);
    Task<List<MeetingEntity>> GetAllAsync(int userId, CancellationToken cancellationToken = default);
    Task<List<MeetingEntity>> GetByProjectIdAsync(int projectId, int userId, CancellationToken cancellationToken = default);
    Task<MeetingEntity> UpdateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default);
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

    public async Task<MeetingEntity?> GetByIdAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, cancellationToken);
    }

    public async Task<List<MeetingEntity>> GetAllAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MeetingEntity>> GetByProjectIdAsync(int projectId, int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Meetings
            .AsNoTracking()
            .Where(m => m.ProjectId == projectId && m.UserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<MeetingEntity> UpdateAsync(MeetingEntity meeting, CancellationToken cancellationToken = default)
    {
        _context.Meetings.Update(meeting);
        await _context.SaveChangesAsync(cancellationToken);
        return meeting;
    }

    public async Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var meeting = await _context.Meetings.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, cancellationToken);
        if (meeting is null) return false;

        _context.Meetings.Remove(meeting);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
