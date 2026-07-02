using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

public interface IProjectRepository
{
    Task<List<ProjectEntity>> GetAllAsync(int userId, CancellationToken cancellationToken = default);
    Task<ProjectEntity?> GetByIdAsync(int id, int userId, CancellationToken cancellationToken = default);
    Task<ProjectEntity?> GetByNameAsync(string name, int userId, CancellationToken cancellationToken = default);
    Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default);
}

public class ProjectRepository : IProjectRepository
{
    private readonly MeetScribeDbContext _context;

    public ProjectRepository(MeetScribeDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectEntity>> GetAllAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectEntity?> GetByIdAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, cancellationToken);
    }

    public async Task<ProjectEntity?> GetByNameAsync(string name, int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Name.ToLower() == name.ToLower() && p.UserId == userId, cancellationToken);
    }

    public async Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken cancellationToken = default)
    {
        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);
        return project;
    }

    public async Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, cancellationToken);
        if (project is null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
