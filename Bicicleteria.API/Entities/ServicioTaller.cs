namespace Bicicleteria.API.Entities;

public class ServicioTaller
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal PrecioBase { get; set; }
    public int DuracionEstimadaMinutos { get; set; }
    public string? ImagenUrl { get; set; }
    public string? ImagenPublicId { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<TurnoTaller> Turnos { get; set; } = new List<TurnoTaller>();
}

