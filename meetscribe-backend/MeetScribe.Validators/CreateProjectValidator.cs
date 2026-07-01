using FluentValidation;
using MeetScribe.ViewModels;

namespace MeetScribe.Validators;

public class CreateProjectValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(100).WithMessage("Project name must be 100 characters or less.")
            .Must(name => !string.IsNullOrWhiteSpace(name)).WithMessage("Project name cannot be only whitespace.");

        RuleFor(x => x.LinkedProvider)
            .Must(p => p is null or "AzureDevOps" or "Jira" or "Linear")
            .When(x => x.LinkedProvider is not null)
            .WithMessage("Invalid provider. Supported: AzureDevOps, Jira, Linear.");
    }
}
