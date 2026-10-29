using System.Security.Claims;
using Bicicleteria.API.Data;
using Bicicleteria.API.DTOs;
using Bicicleteria.API.Entities;
using Bicicleteria.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TallerController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;
    private readonly ICloudinaryService _cloudinaryService;

    public TallerController(BicicleteriaDbContext context, ICloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    [HttpGet("servicios")]
    public async Task<ActionResult> ObtenerServicios()
    {
        var servicios = await _context.ServiciosTaller
            .AsNoTracking()
            .Where(s => s.Activo)
            .OrderBy(s => s.PrecioBase)
            .ToListAsync();

        return Ok(servicios);
    }

    [Authorize(Roles = "Administrador")]
    [HttpPost("servicios/{servicioId:int}/imagen")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> SubirImagenServicioTaller(int servicioId, IFormFile archivo)
    {
        var servicio = await _context.ServiciosTaller.FindAsync(servicioId);
        if (servicio == null)
            return NotFound(new { mensaje = "Servicio de taller no encontrado." });

        try
        {
            if (!string.IsNullOrWhiteSpace(servicio.ImagenPublicId))
                await _cloudinaryService.EliminarImagenAsync(servicio.ImagenPublicId);

            var resultado = await _cloudinaryService.SubirImagenAsync(archivo, "bicicleteria/taller");

            servicio.ImagenUrl = resultado.ImagenUrl;
            servicio.ImagenPublicId = resultado.PublicId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Imagen del servicio subida a Cloudinary y guardada en SQL Server.",
                servicio.Id,
                servicio.Nombre,
                servicio.ImagenUrl
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("turnos")]
    public async Task<ActionResult> AgendarTurno([FromBody] CrearTurnoTallerDto dto)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var servicio = await _context.ServiciosTaller.FindAsync(dto.ServicioTallerId);
        if (servicio == null || !servicio.Activo)
            return NotFound(new { mensaje = "El servicio de taller solicitado no existe." });

        var turno = new TurnoTaller
        {
            UsuarioId = usuarioId,
            ServicioTallerId = dto.ServicioTallerId,
            DetallesBicicleta = dto.DetallesBicicleta.Trim(),
            NotasCliente = dto.NotasCliente,
            FechaProgramada = dto.FechaProgramada,
            Estado = "Programado",
            PrecioFinal = servicio.PrecioBase
        };

        _context.TurnosTaller.Add(turno);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            turno.Id,
            Servicio = servicio.Nombre,
            turno.DetallesBicicleta,
            turno.FechaProgramada,
            turno.Estado,
            PrecioEstimado = turno.PrecioFinal
        });
    }

    [Authorize(Roles = "Administrador")]
    [HttpPatch("turnos/{id:int}")]
    public async Task<ActionResult> ActualizarEstadoTurno(int id, [FromBody] ActualizarEstadoTurnoDto dto)
    {
        var turno = await _context.TurnosTaller.FindAsync(id);
        if (turno == null)
            return NotFound(new { mensaje = "Turno no encontrado." });

        turno.Estado = dto.Estado;
        turno.DiagnosticoMecanico = dto.DiagnosticoMecanico ?? turno.DiagnosticoMecanico;
        turno.PrecioFinal = dto.PrecioFinal ?? turno.PrecioFinal;

        if (dto.Estado == "Entregado" || dto.Estado == "Listo")
            turno.FechaCompletado = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(turno);
    }
}
