namespace Bicicleteria.API.DTOs;

public record ImagenProductoDto(
    int Id,
    string ImagenUrl,
    string PublicId,
    bool EsPrincipal,
    int OrdenVisualizacion);

public record ProductoDto(
    int Id,
    string SKU,
    string Nombre,
    string Slug,
    string? Descripcion,
    string TipoProducto,
    int CategoriaId,
    string CategoriaNombre,
    int MarcaId,
    string MarcaNombre,
    decimal Precio,
    decimal? PrecioDescuento,
    int Stock,
    int StockMinimoAlerta,
    string? Rodado,
    string? TalleCuadro,
    string? Material,
    int? Velocidades,
    int? PesoGramos,
    bool Destacado,
    List<ImagenProductoDto> Imagenes);

public record CrearActualizarProductoDto(
    int CategoriaId,
    int MarcaId,
    string SKU,
    string Nombre,
    string Slug,
    string? Descripcion,
    string TipoProducto,
    decimal Precio,
    decimal? PrecioDescuento,
    int Stock,
    int StockMinimoAlerta,
    string? Rodado,
    string? TalleCuadro,
    string? Material,
    int? Velocidades,
    int? PesoGramos,
    bool Destacado);

public record ActualizarStockDto(int CantidadStock);

