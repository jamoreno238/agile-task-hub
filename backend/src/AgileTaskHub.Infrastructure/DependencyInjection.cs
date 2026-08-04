using AgileTaskHub.Application.Board;
using AgileTaskHub.Application.Persistence;
using AgileTaskHub.Application.Reports;
using AgileTaskHub.Application.Security;
using AgileTaskHub.Infrastructure.Persistence;
using AgileTaskHub.Infrastructure.Realtime;
using AgileTaskHub.Infrastructure.Reports;
using AgileTaskHub.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AgileTaskHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));
        services.AddScoped<IPasswordHasher, SecurePasswordHasher>();
        services.AddScoped<IPasswordHashingService, SecurePasswordHasher>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IBoardEventPublisher, SignalRBoardEventPublisher>();
        services.AddScoped<IProjectReportQuery, ProjectReportQuery>();
        services.AddScoped<IProjectReportExportService, ProjectReportExportService>();
        services.AddTransient<IProjectReportExporter, QuestPdfProjectReportExporter>();
        services.AddTransient<IProjectReportExporter, ClosedXmlProjectReportExporter>();
        return services;
    }
}
