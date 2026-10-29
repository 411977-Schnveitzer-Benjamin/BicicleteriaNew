namespace Bicicleteria.API.DTOs;

public record AgregarItemCarritoDto(int ProductoId, int Cantidad);

public record CrearOrdenRequestDto(
    string MetodoPago,
    string DireccionEnvio,
    string CiudadEnvio,
    string CodigoPostalEnvio,
    string? Notas);

public record DetalleOrdenResponseDto(
    int ProductoId,
    string NombreProducto,
    decimal PrecioUnitario,
    int Cantidad,
    decimal Subtotal);

public record OrdenResponseDto(
    int Id,
    string NumeroOrden,
    string EstadoOrden,
    string MetodoPago,
    decimal Subtotal,
    decimal CostoEnvio,
    decimal MontoTotal,
    DateTime FechaCreacion,
    List<DetalleOrdenResponseDto> Detalles);

