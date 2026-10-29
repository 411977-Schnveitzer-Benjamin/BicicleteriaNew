using Bicicleteria.API.Data;
using Bicicleteria.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;
    private readonly ICloudinaryService _cloudinaryService;

    public CategoriasController(BicicleteriaDbContext context, ICloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    [HttpGet("arbol")]
    public async Task<ActionResult> ObtenerArbolCategorias()
    {
        var categorias = await _context.Categorias
            .AsNoTracking()
            .Where(c => c.Activa && c.CategoriaPadreId == null)
            .Include(c => c.SubCategorias.Where(sc => sc.Activa))
            .Select(c => new
            {
                c.Id,
                c.Nombre,
                c.Slug,
                c.Descripcion,
                SubCategorias = c.SubCategorias.Select(sc => new
                {
                    sc.Id,
                    sc.Nombre,
                    sc.Slug,
                    sc.Descripcion
                })
            })
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpGet("marcas")]
    public async Task<ActionResult> ObtenerMarcas()
    {
        var marcas = await _context.Marcas
            .AsNoTracking()
            .Where(m => m.Activa)
            .OrderBy(m => m.Nombre)
            .Select(m => new { m.Id, m.Nombre, m.LogoUrl })
            .ToListAsync();

        return Ok(marcas);
    }

    // Subir el logo de una marca (ej. Shimano, SRAM, Trek) a Cloudinary y guardar su URL en SQL Server
    [Authorize(Roles = "Administrador")]
    [HttpPost("marcas/{marcaId:int}/logo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> SubirLogoMarca(int marcaId, IFormFile archivo)
    {
        var marca = await _context.Marcas.FindAsync(marcaId);
        if (marca == null)
            return NotFound(new { mensaje = "Marca no encontrada." });

        try
        {
            if (!string.IsNullOrWhiteSpace(marca.LogoPublicId))
                await _cloudinaryService.EliminarImagenAsync(marca.LogoPublicId);

            var resultado = await _cloudinaryService.SubirImagenAsync(archivo, "bicicleteria/marcas");

            marca.LogoUrl = resultado.ImagenUrl;
            marca.LogoPublicId = resultado.PublicId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Logo de marca subido correctamente a Cloudinary.",
                marca.Id,
                marca.Nombre,
                marca.LogoUrl
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
