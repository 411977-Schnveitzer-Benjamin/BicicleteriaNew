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
public class ProductosController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;
    private readonly ICloudinaryService _cloudinaryService;

    public ProductosController(BicicleteriaDbContext context, ICloudinaryService cloudinaryService)
    {
        _context = context;
        _cloudinaryService = cloudinaryService;
    }

    // Público: cualquier visitante o cliente puede navegar el catálogo
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> ObtenerCatalogo(
        [FromQuery] int? categoriaId,
        [FromQuery] int? marcaId,
        [FromQuery] string? tipoProducto,
        [FromQuery] string? buscar,
        [FromQuery] bool? soloDestacados)
    {
        var query = _context.Productos
            .AsNoTracking()
            .Include(p => p.Categoria)
            .Include(p => p.Marca)
            .Include(p => p.Imagenes)
            .Where(p => p.Activo);

        if (categoriaId.HasValue)
            query = query.Where(p => p.CategoriaId == categoriaId.Value || p.Categoria.CategoriaPadreId == categoriaId.Value);

        if (marcaId.HasValue)
            query = query.Where(p => p.MarcaId == marcaId.Value);

        if (!string.IsNullOrWhiteSpace(tipoProducto))
            query = query.Where(p => p.TipoProducto == tipoProducto);

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(p => p.Nombre.Contains(buscar) || p.SKU.Contains(buscar));

        if (soloDestacados == true)
            query = query.Where(p => p.Destacado);

        var productos = await query
            .OrderByDescending(p => p.Destacado)
            .ThenByDescending(p => p.FechaCreacion)
            .Select(p => new ProductoDto(
                p.Id,
                p.SKU,
                p.Nombre,
                p.Slug,
                p.Descripcion,
                p.TipoProducto,
                p.CategoriaId,
                p.Categoria.Nombre,
                p.MarcaId,
                p.Marca.Nombre,
                p.Precio,
                p.PrecioDescuento,
                p.Stock,
                p.StockMinimoAlerta,
                p.Rodado,
                p.TalleCuadro,
                p.Material,
                p.Velocidades,
                p.PesoGramos,
                p.Destacado,
                p.Imagenes
                    .OrderByDescending(i => i.EsPrincipal)
                    .ThenBy(i => i.OrdenVisualizacion)
                    .Select(i => new ImagenProductoDto(i.Id, i.ImagenUrl, i.PublicId, i.EsPrincipal, i.OrdenVisualizacion))
                    .ToList()))
            .ToListAsync();

        return Ok(productos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductoDto>> ObtenerPorId(int id)
    {
        var p = await _context.Productos
            .AsNoTracking()
            .Include(x => x.Categoria)
            .Include(x => x.Marca)
            .Include(x => x.Imagenes)
            .FirstOrDefaultAsync(x => x.Id == id && x.Activo);

        if (p == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return Ok(new ProductoDto(
            p.Id,
            p.SKU,
            p.Nombre,
            p.Slug,
            p.Descripcion,
            p.TipoProducto,
            p.CategoriaId,
            p.Categoria.Nombre,
            p.MarcaId,
            p.Marca.Nombre,
            p.Precio,
            p.PrecioDescuento,
            p.Stock,
            p.StockMinimoAlerta,
            p.Rodado,
            p.TalleCuadro,
            p.Material,
            p.Velocidades,
            p.PesoGramos,
            p.Destacado,
            p.Imagenes
                .OrderByDescending(i => i.EsPrincipal)
                .ThenBy(i => i.OrdenVisualizacion)
                .Select(i => new ImagenProductoDto(i.Id, i.ImagenUrl, i.PublicId, i.EsPrincipal, i.OrdenVisualizacion))
                .ToList()));
    }

    // Bloqueado exclusivamente para el rol Administrador
    [Authorize(Roles = "Administrador")]
    [HttpPost]
    public async Task<ActionResult> CrearProducto([FromBody] CrearActualizarProductoDto dto)
    {
        var producto = new Producto
        {
            CategoriaId = dto.CategoriaId,
            MarcaId = dto.MarcaId,
            SKU = dto.SKU.Trim(),
            Nombre = dto.Nombre.Trim(),
            Slug = dto.Slug.Trim().ToLowerInvariant(),
            Descripcion = dto.Descripcion,
            TipoProducto = dto.TipoProducto,
            Precio = dto.Precio,
            PrecioDescuento = dto.PrecioDescuento,
            Stock = dto.Stock,
            StockMinimoAlerta = dto.StockMinimoAlerta,
            Rodado = dto.Rodado,
            TalleCuadro = dto.TalleCuadro,
            Material = dto.Material,
            Velocidades = dto.Velocidades,
            PesoGramos = dto.PesoGramos,
            Destacado = dto.Destacado
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = producto.Id }, new { producto.Id, producto.SKU, producto.Nombre });
    }

    [Authorize(Roles = "Administrador")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult> ActualizarProducto(int id, [FromBody] CrearActualizarProductoDto dto)
    {
        var producto = await _context.Productos.FindAsync(id);
        if (producto == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        producto.CategoriaId = dto.CategoriaId;
        producto.MarcaId = dto.MarcaId;
        producto.SKU = dto.SKU.Trim();
        producto.Nombre = dto.Nombre.Trim();
        producto.Slug = dto.Slug.Trim().ToLowerInvariant();
        producto.Descripcion = dto.Descripcion;
        producto.TipoProducto = dto.TipoProducto;
        producto.Precio = dto.Precio;
        producto.PrecioDescuento = dto.PrecioDescuento;
        producto.Stock = dto.Stock;
        producto.StockMinimoAlerta = dto.StockMinimoAlerta;
        producto.Rodado = dto.Rodado;
        producto.TalleCuadro = dto.TalleCuadro;
        producto.Material = dto.Material;
        producto.Velocidades = dto.Velocidades;
        producto.PesoGramos = dto.PesoGramos;
        producto.Destacado = dto.Destacado;
        producto.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Producto actualizado correctamente.", producto.Id, producto.Nombre });
    }

    // Endpoint exclusivo de Administrador para actualizar o agregar stock
    [Authorize(Roles = "Administrador")]
    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult> ActualizarStock(int id, [FromBody] ActualizarStockDto dto)
    {
        if (dto.CantidadStock < 0)
            return BadRequest(new { mensaje = "El stock no puede ser negativo." });

        var producto = await _context.Productos.FindAsync(id);
        if (producto == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        producto.Stock = dto.CantidadStock;
        producto.FechaActualizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Stock actualizado correctamente.",
            producto.Id,
            producto.Nombre,
            StockActual = producto.Stock
        });
    }

    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> EliminarProducto(int id)
    {
        var producto = await _context.Productos.FindAsync(id);
        if (producto == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        producto.Activo = false;
        producto.FechaActualizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Producto desactivado del catálogo." });
    }

    // Subida de imagen a Cloudinary + guardado de URL en SQL Server (tabla ImagenesProducto)
    [Authorize(Roles = "Administrador")]
    [HttpPost("{id:int}/imagenes")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ImagenProductoDto>> SubirImagenProducto(
        int id,
        IFormFile archivo,
        [FromQuery] bool esPrincipal = false)
    {
        var producto = await _context.Productos
            .Include(p => p.Imagenes)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        try
        {
            var resultado = await _cloudinaryService.SubirImagenAsync(archivo, "bicicleteria/productos");

            if (esPrincipal)
            {
                foreach (var img in producto.Imagenes)
                    img.EsPrincipal = false;
            }

            var imagenProducto = new ImagenProducto
            {
                ProductoId = id,
                ImagenUrl = resultado.ImagenUrl,
                PublicId = resultado.PublicId,
                EsPrincipal = esPrincipal || !producto.Imagenes.Any(),
                OrdenVisualizacion = producto.Imagenes.Count
            };

            _context.ImagenesProducto.Add(imagenProducto);
            await _context.SaveChangesAsync();

            return Ok(new ImagenProductoDto(
                imagenProducto.Id,
                imagenProducto.ImagenUrl,
                imagenProducto.PublicId,
                imagenProducto.EsPrincipal,
                imagenProducto.OrdenVisualizacion));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // Eliminar imagen tanto en Cloudinary como en SQL Server
    [Authorize(Roles = "Administrador")]
    [HttpDelete("imagenes/{imagenId:int}")]
    public async Task<ActionResult> EliminarImagenProducto(int imagenId)
    {
        var imagen = await _context.ImagenesProducto.FindAsync(imagenId);
        if (imagen == null)
            return NotFound(new { mensaje = "Imagen no encontrada." });

        await _cloudinaryService.EliminarImagenAsync(imagen.PublicId);
        _context.ImagenesProducto.Remove(imagen);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Imagen eliminada de Cloudinary y de la base de datos." });
    }
}
