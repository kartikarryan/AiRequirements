using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

public interface IProjectRepository
{
    Task<List<ProjectEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ProjectEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProjectEntity?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class ProjectRepository : IProjectRepository
{
    private readonly MeetScribeDbContext _context;

    public ProjectRepository(MeetScribeDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<ProjectEntity?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Name.ToLower() == name.ToLower(), cancellationToken);
    }

    public async Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken cancellationToken = default)
    {
        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);
        return project;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FindAsync(new object[] { id }, cancellationToken);
        if (project is null) return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
