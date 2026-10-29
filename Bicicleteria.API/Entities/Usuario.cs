namespace Bicicleteria.API.Entities;

public class Usuario
{
    public int Id { get; set; }
    public int RolId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? CodigoPostal { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    // Propiedades de navegación
    public Rol Rol { get; set; } = null!;
    public Carrito? Carrito { get; set; }
    public ICollection<Orden> Ordenes { get; set; } = new List<Orden>();
    public ICollection<TurnoTaller> TurnosTaller { get; set; } = new List<TurnoTaller>();
}

