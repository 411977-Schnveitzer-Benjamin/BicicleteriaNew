using System.Security.Claims;
using Bicicleteria.API.Data;
using Bicicleteria.API.DTOs;
using Bicicleteria.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdenesController : ControllerBase
{
    private readonly BicicleteriaDbContext _context;

    public OrdenesController(BicicleteriaDbContext context)
    {
        _context = context;
    }

    private int ObtenerUsuarioActualId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Cliente / Usuario Autenticado: Consultar su carrito
    [HttpGet("carrito")]
    public async Task<ActionResult> ObtenerCarrito()
    {
        var usuarioId = ObtenerUsuarioActualId();
        var carrito = await _context.Carritos
            .AsNoTracking()
            .Include(c => c.Items)
                .ThenInclude(i => i.Producto)
                    .ThenInclude(p => p.Imagenes)
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);

        if (carrito == null)
            return Ok(new { items = Array.Empty<object>(), total = 0m });

        var items = carrito.Items.Select(i => new
        {
            i.Id,
            i.ProductoId,
            NombreProducto = i.Producto.Nombre,
            PrecioUnitario = i.Producto.PrecioDescuento ?? i.Producto.Precio,
            i.Cantidad,
            Subtotal = (i.Producto.PrecioDescuento ?? i.Producto.Precio) * i.Cantidad,
            ImagenPrincipal = i.Producto.Imagenes.FirstOrDefault(img => img.EsPrincipal)?.ImagenUrl
        }).ToList();

        return Ok(new
        {
            carrito.Id,
            Items = items,
            Total = items.Sum(x => x.Subtotal)
        });
    }

    // Cliente / Usuario Autenticado: Agregar producto al carrito
    [HttpPost("carrito/items")]
    public async Task<ActionResult> AgregarAlCarrito([FromBody] AgregarItemCarritoDto dto)
    {
        if (dto.Cantidad <= 0)
            return BadRequest(new { mensaje = "La cantidad debe ser mayor a 0." });

        var usuarioId = ObtenerUsuarioActualId();
        var producto = await _context.Productos.FindAsync(dto.ProductoId);
        if (producto == null || !producto.Activo)
            return NotFound(new { mensaje = "Producto no disponible." });

        if (producto.Stock < dto.Cantidad)
            return BadRequest(new { mensaje = $"Stock insuficiente. Disponible: {producto.Stock}." });

        var carrito = await _context.Carritos
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);

        if (carrito == null)
        {
            carrito = new Carrito { UsuarioId = usuarioId };
            _context.Carritos.Add(carrito);
            await _context.SaveChangesAsync();
        }

        var itemExistente = carrito.Items.FirstOrDefault(i => i.ProductoId == dto.ProductoId);
        if (itemExistente != null)
        {
            itemExistente.Cantidad += dto.Cantidad;
        }
        else
        {
            carrito.Items.Add(new ItemCarrito
            {
                ProductoId = dto.ProductoId,
                Cantidad = dto.Cantidad
            });
        }

        carrito.FechaActualizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Producto agregado al carrito." });
    }

    // Cliente / Usuario Autenticado: Confirmar compra y descontar stock
    [HttpPost("comprar")]
    public async Task<ActionResult<OrdenResponseDto>> Comprar([FromBody] CrearOrdenRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioActualId();
        var carrito = await _context.Carritos
            .Include(c => c.Items)
                .ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId);

        if (carrito == null || !carrito.Items.Any())
            return BadRequest(new { mensaje = "El carrito está vacío." });

        await using var transaction = await _context.Database.BeginTransactionAsync();

        decimal subtotal = 0m;
        var detallesOrden = new List<DetalleOrden>();

        foreach (var item in carrito.Items)
        {
            if (item.Producto.Stock < item.Cantidad)
                return BadRequest(new { mensaje = $"Stock insuficiente para '{item.Producto.Nombre}'." });

            // Descontar stock del inventario
            item.Producto.Stock -= item.Cantidad;
            item.Producto.FechaActualizacion = DateTime.UtcNow;

            var precioUnitario = item.Producto.PrecioDescuento ?? item.Producto.Precio;
            subtotal += precioUnitario * item.Cantidad;

            detallesOrden.Add(new DetalleOrden
            {
                ProductoId = item.ProductoId,
                NombreProductoHistorico = item.Producto.Nombre,
                PrecioUnitario = precioUnitario,
                Cantidad = item.Cantidad
            });
        }

        var orden = new Orden
        {
            NumeroOrden = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            UsuarioId = usuarioId,
            EstadoOrden = "Pagada",
            MetodoPago = dto.MetodoPago,
            EstadoPago = "Aprobado",
            Subtotal = subtotal,
            CostoEnvio = 0m,
            MontoTotal = subtotal,
            DireccionEnvio = dto.DireccionEnvio,
            CiudadEnvio = dto.CiudadEnvio,
            CodigoPostalEnvio = dto.CodigoPostalEnvio,
            Notas = dto.Notas,
            DetallesOrden = detallesOrden
        };

        _context.Ordenes.Add(orden);
        _context.ItemsCarrito.RemoveRange(carrito.Items);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new OrdenResponseDto(
            orden.Id,
            orden.NumeroOrden,
            orden.EstadoOrden,
            orden.MetodoPago,
            orden.Subtotal,
            orden.CostoEnvio,
            orden.MontoTotal,
            orden.FechaCreacion,
            orden.DetallesOrden.Select(d => new DetalleOrdenResponseDto(
                d.ProductoId,
                d.NombreProductoHistorico,
                d.PrecioUnitario,
                d.Cantidad,
                d.PrecioUnitario * d.Cantidad)).ToList()));
    }

    // Exclusivo para Rol Administrador: Reporte de Ganancias, Ventas y Alertas de Stock
    [Authorize(Roles = "Administrador")]
    [HttpGet("ganancias")]
    public async Task<ActionResult> ObtenerGananciasYMetricas()
    {
        var gananciasVentas = await _context.Ordenes
            .Where(o => o.EstadoOrden != "Cancelada")
            .SumAsync(o => (decimal?)o.MontoTotal) ?? 0m;

        var gananciasTaller = await _context.TurnosTaller
            .Where(t => t.Estado == "Entregado" || t.Estado == "Listo")
            .SumAsync(t => t.PrecioFinal) ?? 0m;

        var totalOrdenes = await _context.Ordenes.CountAsync(o => o.EstadoOrden != "Cancelada");

        var productosBajoStock = await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo && p.Stock <= p.StockMinimoAlerta)
            .Select(p => new { p.Id, p.SKU, p.Nombre, p.Stock, p.StockMinimoAlerta })
            .ToListAsync();

        var turnosPendientes = await _context.TurnosTaller
            .CountAsync(t => t.Estado == "Programado" || t.Estado == "EnProceso");

        return Ok(new
        {
            GananciasVentasProductos = gananciasVentas,
            GananciasServiciosTaller = gananciasTaller,
            GananciaTotalAcumulada = gananciasVentas + gananciasTaller,
            CantidadOrdenesValidas = totalOrdenes,
            TurnosTallerPendientes = turnosPendientes,
            AlertasStockCritico = productosBajoStock
        });
    }
}

