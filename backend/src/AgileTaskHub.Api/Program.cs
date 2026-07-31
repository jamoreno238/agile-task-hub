using AgileTaskHub.Api.Configuration;
using AgileTaskHub.Api.Middleware;
using AgileTaskHub.Infrastructure;
using AgileTaskHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(new JwtOptions
{
    Secret = builder.Configuration["JWT_SECRET"] ?? string.Empty,
    Issuer = builder.Configuration["JWT_ISSUER"] ?? string.Empty,
    Audience = builder.Configuration["JWT_AUDIENCE"] ?? string.Empty
});
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRouting();
app.MapControllers();
app.MapHealthChecks("/health");

await ApplyMigrationsAsync(app);
await app.RunAsync();

static async Task ApplyMigrationsAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseMigration");
    logger.LogInformation("Applying pending database migrations.");
    await dbContext.Database.MigrateAsync();
    logger.LogInformation("Database migrations completed.");
}

public partial class Program;
