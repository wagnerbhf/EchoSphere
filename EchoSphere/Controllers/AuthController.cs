using EchoSphere.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EchoSphere.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly JwtSettings _jwtSettings;

    public AuthController(JwtSettings jwtSettings)
    {
        _jwtSettings = jwtSettings;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Username))
            return BadRequest("Username é obrigatório");

        // Use the provided username as the NameIdentifier so private messages can target users by their username.
        // Normalize to a stable form (lowercase trimmed) to avoid casing mismatches.
        var normalized = request.Username.Trim();
        var userId = normalized.ToLowerInvariant();

        var claims = new[]
        {
            // NameIdentifier will be the normalized username (used by SignalR as UserIdentifier)
            new Claim(ClaimTypes.NameIdentifier, userId),
            // Keep the display name
            new Claim(ClaimTypes.Name, normalized),
            new Claim("username", normalized)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: creds);

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            userId = userId,
            username = request.Username
        });
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
}