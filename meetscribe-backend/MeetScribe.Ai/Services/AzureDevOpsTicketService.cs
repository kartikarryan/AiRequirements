using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MeetScribe.Ai.Services;

/// <summary>
/// Azure DevOps implementation of ITicketService.
/// Reads "organizationUrl" and "accessToken" from settings dictionary.
/// </summary>
public class AzureDevOpsTicketService : ITicketService
{
    private readonly HttpClient _httpClient;
    private const string ApiVersion = "7.1";

    public AzureDevOpsTicketService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> TestConnectionAsync(Dictionary<string, string> settings, CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);
        try
        {
            var request = CreateRequest(HttpMethod.Get, $"{orgUrl}/_apis/projects?api-version={ApiVersion}", pat);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    public async Task<List<string>> GetProjectsAsync(Dictionary<string, string> settings, CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);
        var request = CreateRequest(HttpMethod.Get, $"{orgUrl}/_apis/projects?api-version={ApiVersion}", pat);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);

        return doc.RootElement.GetProperty("value")
            .EnumerateArray()
            .Select(p => p.GetProperty("name").GetString() ?? "")
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
    }

    public async Task<List<string>> GetIterationsAsync(Dictionary<string, string> settings, string project, CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);
        var url = $"{orgUrl}/{project}/_apis/work/teamsettings/iterations?api-version={ApiVersion}";
        var request = CreateRequest(HttpMethod.Get, url, pat);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);

        return doc.RootElement.GetProperty("value")
            .EnumerateArray()
            .Select(i => i.GetProperty("path").GetString() ?? "")
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
    }

    public async Task<List<string>> GetWorkItemTypesAsync(Dictionary<string, string> settings, string project, CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);
        var url = $"{orgUrl}/{project}/_apis/wit/workitemtypes?api-version={ApiVersion}";
        var request = CreateRequest(HttpMethod.Get, url, pat);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);

        return doc.RootElement.GetProperty("value")
            .EnumerateArray()
            .Select(t => t.GetProperty("name").GetString() ?? "")
            .Where(n => !string.IsNullOrEmpty(n))
            .ToList();
    }

    public async Task<CreateWorkItemResult> CreateWorkItemAsync(
        Dictionary<string, string> settings, string project,
        CreateWorkItemRequest workItem, CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);
        var url = $"{orgUrl}/{project}/_apis/wit/workitems/${workItem.WorkItemType}?api-version={ApiVersion}";

        var patchDoc = new List<object>
        {
            new { op = "add", path = "/fields/System.Title", value = workItem.Title },
        };

        if (!string.IsNullOrEmpty(workItem.Description))
            patchDoc.Add(new { op = "add", path = "/fields/System.Description", value = workItem.Description });
        if (workItem.Priority.HasValue)
            patchDoc.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Common.Priority", value = workItem.Priority.Value });
        if (!string.IsNullOrEmpty(workItem.IterationPath))
            patchDoc.Add(new { op = "add", path = "/fields/System.IterationPath", value = workItem.IterationPath });
        if (!string.IsNullOrEmpty(workItem.AreaPath))
            patchDoc.Add(new { op = "add", path = "/fields/System.AreaPath", value = workItem.AreaPath });
        if (!string.IsNullOrEmpty(workItem.Tags))
            patchDoc.Add(new { op = "add", path = "/fields/System.Tags", value = workItem.Tags });
        if (!string.IsNullOrEmpty(workItem.AssignedTo) && workItem.AssignedTo.Contains('@'))
            patchDoc.Add(new { op = "add", path = "/fields/System.AssignedTo", value = workItem.AssignedTo });

        var jsonContent = JsonSerializer.Serialize(patchDoc);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json-patch+json");

        var request = new HttpRequestMessage(HttpMethod.Patch, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
        request.Content = content;

        var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            return new CreateWorkItemResult { Success = false, ErrorMessage = error };
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var responseDoc = JsonDocument.Parse(responseJson);

        var id = responseDoc.RootElement.GetProperty("id").GetInt32();
        var webUrl = responseDoc.RootElement.GetProperty("_links")
            .GetProperty("html").GetProperty("href").GetString();

        return new CreateWorkItemResult
        {
            Success = true,
            WorkItemId = id,
            WorkItemUrl = webUrl ?? ""
        };
    }

    public async Task<List<DuplicateWorkItem>> FindDuplicatesAsync(
        Dictionary<string, string> settings, string project, string title,
        CancellationToken cancellationToken = default)
    {
        var (orgUrl, pat) = GetCredentials(settings);

        // WIQL query: find work items with similar title (contains key words)
        var titleEscaped = title.Replace("'", "''");
        var wiql = $@"
            SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
            FROM WorkItems
            WHERE [System.TeamProject] = '{project}'
              AND [System.Title] CONTAINS '{titleEscaped}'
              AND [System.State] <> 'Removed'
            ORDER BY [System.CreatedDate] DESC";

        var request = new HttpRequestMessage(HttpMethod.Post,
            $"{orgUrl}/{project}/_apis/wit/wiql?api-version={ApiVersion}&$top=5");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { query = wiql }), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new List<DuplicateWorkItem>();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);

        var workItems = doc.RootElement.GetProperty("workItems").EnumerateArray().ToList();
        if (workItems.Count == 0)
            return new List<DuplicateWorkItem>();

        // Fetch details for found work items
        var ids = workItems.Select(w => w.GetProperty("id").GetInt32()).Take(5).ToList();
        var idsParam = string.Join(",", ids);
        var detailRequest = CreateRequest(HttpMethod.Get,
            $"{orgUrl}/_apis/wit/workitems?ids={idsParam}&fields=System.Id,System.Title,System.State,System.WorkItemType&api-version={ApiVersion}", pat);

        var detailResponse = await _httpClient.SendAsync(detailRequest, cancellationToken);
        if (!detailResponse.IsSuccessStatusCode)
            return new List<DuplicateWorkItem>();

        var detailJson = await detailResponse.Content.ReadAsStringAsync(cancellationToken);
        var detailDoc = JsonDocument.Parse(detailJson);

        return detailDoc.RootElement.GetProperty("value").EnumerateArray().Select(item =>
        {
            var fields = item.GetProperty("fields");
            return new DuplicateWorkItem
            {
                Id = fields.GetProperty("System.Id").GetInt32(),
                Title = fields.GetProperty("System.Title").GetString() ?? "",
                State = fields.GetProperty("System.State").GetString() ?? "",
                WorkItemType = fields.GetProperty("System.WorkItemType").GetString() ?? "",
                Url = $"{orgUrl}/{project}/_workitems/edit/{fields.GetProperty("System.Id").GetInt32()}"
            };
        }).ToList();
    }

    public async Task<List<DuplicateWorkItem>> FindDuplicatesBatchAsync(
        Dictionary<string, string> settings, string project, List<string> titles,
        CancellationToken cancellationToken = default)
    {
        if (titles.Count == 0) return new List<DuplicateWorkItem>();

        var (orgUrl, pat) = GetCredentials(settings);

        // Build one WIQL query with OR conditions for all titles
        var conditions = titles.Select(t => $"[System.Title] CONTAINS '{t.Replace("'", "''")}'");
        var wiql = $@"
            SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
            FROM WorkItems
            WHERE [System.TeamProject] = '{project}'
              AND ({string.Join(" OR ", conditions)})
              AND [System.State] <> 'Removed'
            ORDER BY [System.CreatedDate] DESC";

        var request = new HttpRequestMessage(HttpMethod.Post,
            $"{orgUrl}/{project}/_apis/wit/wiql?api-version={ApiVersion}&$top=50");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { query = wiql }), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new List<DuplicateWorkItem>();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);

        var workItems = doc.RootElement.GetProperty("workItems").EnumerateArray().ToList();
        if (workItems.Count == 0)
            return new List<DuplicateWorkItem>();

        var ids = workItems.Select(w => w.GetProperty("id").GetInt32()).Take(50).ToList();
        var idsParam = string.Join(",", ids);
        var detailRequest = CreateRequest(HttpMethod.Get,
            $"{orgUrl}/_apis/wit/workitems?ids={idsParam}&fields=System.Id,System.Title,System.State,System.WorkItemType&api-version={ApiVersion}", pat);

        var detailResponse = await _httpClient.SendAsync(detailRequest, cancellationToken);
        if (!detailResponse.IsSuccessStatusCode)
            return new List<DuplicateWorkItem>();

        var detailJson = await detailResponse.Content.ReadAsStringAsync(cancellationToken);
        var detailDoc = JsonDocument.Parse(detailJson);

        return detailDoc.RootElement.GetProperty("value").EnumerateArray().Select(item =>
        {
            var fields = item.GetProperty("fields");
            return new DuplicateWorkItem
            {
                Id = fields.GetProperty("System.Id").GetInt32(),
                Title = fields.GetProperty("System.Title").GetString() ?? "",
                State = fields.GetProperty("System.State").GetString() ?? "",
                WorkItemType = fields.GetProperty("System.WorkItemType").GetString() ?? "",
                Url = $"{orgUrl}/{project}/_workitems/edit/{fields.GetProperty("System.Id").GetInt32()}"
            };
        }).ToList();
    }

    private static (string orgUrl, string pat) GetCredentials(Dictionary<string, string> settings)
    {
        var orgUrl = settings.GetValueOrDefault("organizationUrl")?.TrimEnd('/') ?? "";
        var pat = settings.GetValueOrDefault("accessToken") ?? "";
        return (orgUrl, pat);
    }

    private static HttpRequestMessage CreateRequest(HttpMethod method, string url, string pat)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
        return request;
    }
}
