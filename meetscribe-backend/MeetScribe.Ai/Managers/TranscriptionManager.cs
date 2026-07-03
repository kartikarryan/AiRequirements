using Deepgram;
using Deepgram.Models.Listen.v1.REST;
using MeetScribe.Ai.Setting;
using MeetScribe.ViewModels;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MeetScribe.Ai.Managers;

public interface ITranscriptionManager
{
    Task<TranscriptResult> TranscribeAsync(
        Stream audioStream,
        CancellationToken cancellationToken = default);
}
public class TranscriptionManager : ITranscriptionManager
{
    private readonly DeepgramSettings _settings;
    private readonly ILogger<TranscriptionManager> _logger;

    private static bool _initialized;
    private static readonly object LockObject = new();

    public TranscriptionManager(
        IOptions<DeepgramSettings> settings,
        ILogger<TranscriptionManager> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        InitializeDeepgram();
    }

    private void InitializeDeepgram()
    {
        if (_initialized)
            return;

        lock (LockObject)
        {
            if (_initialized)
                return;

            Environment.SetEnvironmentVariable(
                "DEEPGRAM_API_KEY",
                _settings.ApiKey);

            Library.Initialize();

            _initialized = true;
        }
    }

    public async Task<TranscriptResult> TranscribeAsync(
        Stream audioStream,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var memoryStream = new MemoryStream();

            await audioStream.CopyToAsync(
                memoryStream,
                cancellationToken);

            var audioBytes = memoryStream.ToArray();

            var client =
                ClientFactory.CreateListenRESTClient();

           
            var options = new PreRecordedSchema
            {
                Model = "nova-3",

                SmartFormat = true,
                Punctuate = true,

                Diarize = true,

                Paragraphs = true,

                Utterances = true
            };

            //var response = await client.TranscribeFile(audioBytes, options);

            using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

            var response = await client.TranscribeFile(
                audioBytes,
                options,
                cts);

            var transcript =
                response.Results?
                    .Channels?
                    .FirstOrDefault()?
                    .Alternatives?
                    .FirstOrDefault()?
                    .Transcript;

            return new TranscriptResult
            {
                Success = true,
                Transcript = transcript ?? string.Empty
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Deepgram transcription failed");

            //return new TranscriptResult
            //{
            //    Success = false,
            //    ErrorMessage = ex.Message
            //};

            throw;
        }
    }
}