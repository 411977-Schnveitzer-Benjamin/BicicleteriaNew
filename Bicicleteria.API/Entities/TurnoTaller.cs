namespace Bicicleteria.API.Entities;

public class TurnoTaller
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int ServicioTallerId { get; set; }
    public string DetallesBicicleta { get; set; } = string.Empty;
    public string? NotasCliente { get; set; }
    public string? DiagnosticoMecanico { get; set; }
    public DateTime FechaProgramada { get; set; }
    public string Estado { get; set; } = "Programado"; // "Programado", "EnProceso", "EsperandoRepuestos", "Listo", "Entregado", "Cancelado"
    public decimal? PrecioFinal { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCompletado { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public ServicioTaller ServicioTaller { get; set; } = null!;
}

