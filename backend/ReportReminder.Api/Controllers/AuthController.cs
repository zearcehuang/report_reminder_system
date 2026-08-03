using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace ReportReminder.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto request)
    {
        // Simple mock login for now, similar to Node.js /me default
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Unauthorized(new { success = false, message = "帳號或密碼錯誤 (Invalid email or password)" });
        }

        return Ok(new
        {
            success = true,
            token = $"mock-token-{Guid.NewGuid():N}",
            user = new
            {
                id = "usr-admin-1",
                email = request.Email,
                name = "系統最高管理員",
                role = "Admin",
                department = "資訊管理處",
                title = "資深系統管理員",
                status = "active"
            }
        });
    }

    [HttpGet("me")]
    public IActionResult GetMe()
    {
        return Ok(new
        {
            success = true,
            user = new
            {
                id = "usr-admin-1",
                email = "admin@company.com",
                name = "系統最高管理員",
                role = "Admin",
                department = "資訊管理處",
                title = "資深系統管理員",
                status = "active"
            }
        });
    }

    [HttpPost("sender-login")]
    public IActionResult SenderLogin([FromBody] SenderLoginRequestDto request)
    {
        string senderName = !string.IsNullOrWhiteSpace(request.Name) 
            ? request.Name.Trim() 
            : request.Email.Split('@').FirstOrDefault() ?? "Unknown";

        string token = $"token-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N").Substring(0, 7)}";

        return Ok(new
        {
            success = true,
            message = $"✅ 發布寄件者身份驗證成功！已成功登入: {senderName} ({request.Email})",
            sender = new
            {
                email = request.Email,
                name = senderName,
                token = token,
                loggedInAt = DateTime.UtcNow.ToString("O")
            }
        });
    }
}

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SenderLoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
