using System.Security.Cryptography;
using System.Text;
using AgileTaskHub.Application.Security;
using Microsoft.Extensions.Configuration;

namespace AgileTaskHub.Infrastructure.Security;

public sealed class SecurePasswordHasher(IConfiguration configuration) : IPasswordHasher, IPasswordHashingService
{
    private const int SaltSize = 16;
    private const int HashSize = 64;
    private const int Iterations = 120_000;
    private const string Version = "v1";

    private string Pepper => configuration["Security:PasswordPepper"]
        ?? configuration["Security__PasswordPepper"]
        ?? throw new InvalidOperationException("Security__PasswordPepper must be configured outside source control.");

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Derive(password, salt);
        return $"{Version}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string encodedHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(encodedHash))
        {
            return false;
        }

        var parts = encodedHash.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 3 || parts[0] != Version)
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[1]);
            var expectedHash = Convert.FromBase64String(parts[2]);
            var actualHash = Derive(password, salt);
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private byte[] Derive(string password, byte[] salt)
    {
        var passwordBytes = Encoding.UTF8.GetBytes(password + Pepper);
        using var derivation = new Rfc2898DeriveBytes(passwordBytes, salt, Iterations, HashAlgorithmName.SHA512);
        return derivation.GetBytes(HashSize);
    }
}
