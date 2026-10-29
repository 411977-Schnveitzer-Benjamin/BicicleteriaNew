using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Bicicleteria.API.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Bicicleteria.API.Services;

public interface IJwtTokenService
{
    string GenerarToken(Usuario usuario);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(Usuario usuario)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Falta configurar 'Jwt:Key' en appsettings.json.");
        var issuer = _configuration["Jwt:Issuer"] ?? "BicicleteriaAPI";
        var audience = _configuration["Jwt:Audience"] ?? "BicicleteriaClient";
        var expireHours = int.TryParse(_configuration["Jwt:ExpireHours"], out var h) ? h : 8;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Name, $"{usuario.Nombre} {usuario.Apellido}"),
            new(ClaimTypes.Role, usuario.Rol.Nombre) // "Administrador" o "Cliente"
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expireHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }
}
