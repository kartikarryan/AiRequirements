using MeetScribe.Data.Context;
using MeetScribe.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetScribe.Data.Repository;

public interface IIntegrationSettingRepository
{
    Task<IntegrationSettingEntity?> GetByProviderAsync(string provider, int userId, CancellationToken cancellationToken = default);
    Task<List<IntegrationSettingEntity>> GetAllActiveAsync(int userId, CancellationToken cancellationToken = default);
    Task<IntegrationSettingEntity> SaveAsync(IntegrationSettingEntity setting, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string provider, int userId, CancellationToken cancellationToken = default);
}

public class IntegrationSettingRepository : IIntegrationSettingRepository
{
    private readonly MeetScribeDbContext _context;

    public IntegrationSettingRepository(MeetScribeDbContext context)
    {
        _context = context;
    }

    public async Task<IntegrationSettingEntity?> GetByProviderAsync(string provider, int userId, CancellationToken cancellationToken = default)
    {
        return await _context.IntegrationSettings
            .FirstOrDefaultAsync(s => s.Provider == provider && s.UserId == userId && s.IsActive, cancellationToken);
    }

    public async Task<List<IntegrationSettingEntity>> GetAllActiveAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.IntegrationSettings
            .Where(s => s.IsActive && s.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IntegrationSettingEntity> SaveAsync(IntegrationSettingEntity setting, CancellationToken cancellationToken = default)
    {
        var existing = await _context.IntegrationSettings
            .FirstOrDefaultAsync(s => s.Provider == setting.Provider && s.UserId == setting.UserId, cancellationToken);

        if (existing is not null)
        {
            existing.SettingsJson = setting.SettingsJson;
            existing.IsActive = setting.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            setting.CreatedAt = DateTime.UtcNow;
            _context.IntegrationSettings.Add(setting);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return existing ?? setting;
    }

    public async Task<bool> DeleteAsync(string provider, int userId, CancellationToken cancellationToken = default)
    {
        var setting = await _context.IntegrationSettings
            .FirstOrDefaultAsync(s => s.Provider == provider && s.UserId == userId, cancellationToken);

        if (setting is null) return false;

        _context.IntegrationSettings.Remove(setting);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
