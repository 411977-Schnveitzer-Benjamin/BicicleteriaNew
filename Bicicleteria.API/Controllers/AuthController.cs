using Bicicleteria.API.Data;
using Bicicleteria.API.DTOs;
using Bicicleteria.API.Entities;
using Bicicleteria.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;
    private readonly IJwtTokenService _jwtService;

    public AuthController(BicicleteriaDbContext context, IJwtTokenService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("registro")]
    public async Task<ActionResult<AuthResponseDto>> Registro([FromBody] RegistroRequestDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado))
            return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });

        var rolCliente = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Cliente")
            ?? throw new InvalidOperationException("El rol 'Cliente' no existe en la base de datos.");

        var usuario = new Usuario
        {
            RolId = rolCliente.Id,
            Nombre = dto.Nombre.Trim(),
            Apellido = dto.Apellido.Trim(),
            Email = emailNormalizado,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            Ciudad = dto.Ciudad,
            CodigoPostal = dto.CodigoPostal,
            Activo = true,
            Rol = rolCliente
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        // Crear carrito vacío automáticamente para el nuevo cliente
        _context.Carritos.Add(new Carrito { UsuarioId = usuario.Id });
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerarToken(usuario);
        return Ok(new AuthResponseDto(
            usuario.Id,
            $"{usuario.Nombre} {usuario.Apellido}",
            usuario.Email,
            rolCliente.Nombre,
            token));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado && u.Activo);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        var token = _jwtService.GenerarToken(usuario);
        return Ok(new AuthResponseDto(
            usuario.Id,
            $"{usuario.Nombre} {usuario.Apellido}",
            usuario.Email,
            usuario.Rol.Nombre,
            token));
    }
}

