using System.Security.Claims;
using Bicicleteria.API.Data;
using Bicicleteria.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;

    public UsuariosController(BicicleteriaDbContext context)
    {
        _context = context;
    }

    private int ObtenerUsuarioActualId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Endpoint para que cualquier usuario autenticado consulte su propio perfil
    [HttpGet("mi-perfil")]
    public async Task<ActionResult<UsuarioDto>> ObtenerMiPerfil()
    {
        var id = ObtenerUsuarioActualId();
        var u = await _context.Usuarios
            .AsNoTracking()
            .Include(x => x.Rol)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (u == null)
            return NotFound();

        return Ok(new UsuarioDto(
            u.Id, u.Nombre, u.Apellido, u.Email, u.Rol.Nombre,
            u.Telefono, u.Direccion, u.Ciudad, u.CodigoPostal, u.Activo, u.FechaCreacion));
    }

    // Endpoint para actualizar los datos propios
    [HttpPut("mi-perfil")]
    public async Task<ActionResult> ActualizarMiPerfil([FromBody] ActualizarUsuarioDto dto)
    {
        var id = ObtenerUsuarioActualId();
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound();

        usuario.Nombre = dto.Nombre.Trim();
        usuario.Apellido = dto.Apellido.Trim();
        usuario.Telefono = dto.Telefono;
        usuario.Direccion = dto.Direccion;
        usuario.Ciudad = dto.Ciudad;
        usuario.CodigoPostal = dto.CodigoPostal;
        usuario.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Perfil actualizado correctamente." });
    }

    // CRUD exclusivo para el Rol Administrador
    [Authorize(Roles = "Administrador")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> ObtenerTodos()
    {
        var usuarios = await _context.Usuarios
            .AsNoTracking()
            .Include(u => u.Rol)
            .OrderByDescending(u => u.FechaCreacion)
            .Select(u => new UsuarioDto(
                u.Id, u.Nombre, u.Apellido, u.Email, u.Rol.Nombre,
                u.Telefono, u.Direccion, u.Ciudad, u.CodigoPostal, u.Activo, u.FechaCreacion))
            .ToListAsync();

        return Ok(usuarios);
    }

    [Authorize(Roles = "Administrador")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> ObtenerPorId(int id)
    {
        var u = await _context.Usuarios
            .AsNoTracking()
            .Include(x => x.Rol)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (u == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        return Ok(new UsuarioDto(
            u.Id, u.Nombre, u.Apellido, u.Email, u.Rol.Nombre,
            u.Telefono, u.Direccion, u.Ciudad, u.CodigoPostal, u.Activo, u.FechaCreacion));
    }

    [Authorize(Roles = "Administrador")]
    [HttpPatch("{id:int}/rol-estado")]
    public async Task<ActionResult> CambiarRolYEstado(int id, [FromBody] CambiarRolUsuarioDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        var rolExiste = await _context.Roles.AnyAsync(r => r.Id == dto.RolId);
        if (!rolExiste)
            return BadRequest(new { mensaje = "El Rol especificado no existe." });

        usuario.RolId = dto.RolId;
        usuario.Activo = dto.Activo;
        usuario.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Rol y estado del usuario actualizados." });
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DesactivarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        // Baja lógica para preservar integridad referencial con Órdenes históricas
        usuario.Activo = false;
        usuario.FechaActualizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Usuario dado de baja (inactivo) correctamente." });
    }
}

