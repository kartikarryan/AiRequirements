using FluentValidation;
using MeetScribe.Api.Common.Utility;
using MeetScribe.Data.Models;
using MeetScribe.Data.Repository;
using MeetScribe.ViewModels;

namespace MeetScribe.Api.Managers;

public interface IProjectManager
{
    Task<ApiResponse<List<ProjectListItem>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<ProjectListItem>> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

public class ProjectManager : IProjectManager
{
    private readonly IProjectRepository _projectRepository;
    private readonly IMeetingRepository _meetingRepository;
    private readonly IValidator<CreateProjectRequest> _createValidator;
    private readonly IApiResponseBuilder _response;

    public ProjectManager(
        IProjectRepository projectRepository,
        IMeetingRepository meetingRepository,
        IValidator<CreateProjectRequest> createValidator,
        IApiResponseBuilder response)
    {
        _projectRepository = projectRepository;
        _meetingRepository = meetingRepository;
        _createValidator = createValidator;
        _response = response;
    }

    public async Task<ApiResponse<List<ProjectListItem>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var projects = await _projectRepository.GetAllAsync(cancellationToken);
        var meetings = await _meetingRepository.GetAllAsync(cancellationToken);

        var result = projects.Select(p =>
        {
            var projectMeetings = meetings.Where(m => m.ProjectId == p.Id).ToList();
            var lastMeeting = projectMeetings.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

            return new ProjectListItem
            {
                Id = p.Id,
                Name = p.Name,
                LinkedProvider = p.LinkedProvider,
                CreatedAt = p.CreatedAt,
                MeetingCount = projectMeetings.Count,
                LastActivityAt = lastMeeting?.CreatedAt,
            };
        }).ToList();

        return _response.Ok(result);
    }

    public async Task<ApiResponse<ProjectListItem>> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return _response.BadRequest<ProjectListItem>(
                null,
                validation.Errors.First().ErrorMessage,
                validation.Errors.Select(e => e.ErrorMessage).ToList());
        }

        var existing = await _projectRepository.GetByNameAsync(request.Name.Trim(), cancellationToken);
        if (existing is not null)
        {
            var existingItem = new ProjectListItem
            {
                Id = existing.Id,
                Name = existing.Name,
                LinkedProvider = existing.LinkedProvider,
                CreatedAt = existing.CreatedAt,
                MeetingCount = 0,
            };
            return _response.Conflict(existingItem, "Project with this name already exists.");
        }

        var entity = new ProjectEntity
        {
            Name = request.Name.Trim(),
            LinkedProvider = request.LinkedProvider,
            CreatedAt = DateTime.UtcNow,
        };

        await _projectRepository.CreateAsync(entity, cancellationToken);

        var created = new ProjectListItem
        {
            Id = entity.Id,
            Name = entity.Name,
            LinkedProvider = entity.LinkedProvider,
            CreatedAt = entity.CreatedAt,
            MeetingCount = 0,
        };

        return _response.Created(created, "Project created successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(id, cancellationToken);
        if (project is null)
            return _response.NotFound(false, "Project not found.");

        var meetings = await _meetingRepository.GetAllAsync(cancellationToken);
        var meetingCount = meetings.Count(m => m.ProjectId == id);

        if (meetingCount > 0)
            return _response.Conflict(false, $"This project has {meetingCount} meeting(s). Delete all meetings first or move them to another project.");

        await _projectRepository.DeleteAsync(id, cancellationToken);
        return _response.Ok(true, "Project deleted.");
    }
}
