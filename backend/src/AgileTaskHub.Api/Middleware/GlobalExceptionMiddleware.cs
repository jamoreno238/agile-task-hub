using System.Net;
using System.Text.Json;

namespace AgileTaskHub.Api.Middleware;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for {Path}", context.Request.Path);
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "https://httpstatuses.com/500",
                title = "An unexpected error occurred.",
                status = context.Response.StatusCode,
                traceId = context.TraceIdentifier
            }));
        }
    }
}
