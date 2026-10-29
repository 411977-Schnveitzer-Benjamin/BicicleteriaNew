namespace Bicicleteria.API.DTOs;

public record CrearTurnoTallerDto(
    int ServicioTallerId,
    string DetallesBicicleta,
    string? NotasCliente,
    DateTime FechaProgramada);

public record ActualizarEstadoTurnoDto(
    string Estado,
    string? DiagnosticoMecanico,
    decimal? PrecioFinal);

