using FluentValidation;
using MeetScribe.ViewModels;

namespace MeetScribe.Validators;

public class BatchExportValidator : AbstractValidator<BatchExportRequest>
{
    public BatchExportValidator()
    {
        RuleFor(x => x.Project)
            .NotEmpty().WithMessage("Project is required.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required for export.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Title)
                .NotEmpty().WithMessage("Ticket title is required.");
        });
    }
}
