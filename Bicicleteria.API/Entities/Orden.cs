namespace Bicicleteria.API.Entities;

public class Orden
{
    public int Id { get; set; }
    public string NumeroOrden { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public string EstadoOrden { get; set; } = "Pendiente"; // "Pendiente", "Pagada", "Enviada", "Entregada", "Cancelada"
    public string MetodoPago { get; set; } = string.Empty;
    public string EstadoPago { get; set; } = "Pendiente";
    public decimal Subtotal { get; set; }
    public decimal CostoEnvio { get; set; }
    public decimal MontoTotal { get; set; }
    public string DireccionEnvio { get; set; } = string.Empty;
    public string CiudadEnvio { get; set; } = string.Empty;
    public string CodigoPostalEnvio { get; set; } = string.Empty;
    public string? Notas { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public ICollection<DetalleOrden> DetallesOrden { get; set; } = new List<DetalleOrden>();
}

