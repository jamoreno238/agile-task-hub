FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/NuGet.Config backend/NuGet.Config
COPY backend/AgileTaskHub.sln backend/AgileTaskHub.sln
COPY backend/src backend/src
COPY backend/tests backend/tests
RUN dotnet restore backend/AgileTaskHub.sln --configfile backend/NuGet.Config
RUN dotnet publish backend/src/AgileTaskHub.Api/AgileTaskHub.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AgileTaskHub.Api.dll"]
