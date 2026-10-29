namespace Bicicleteria.API.Entities;

public class Marca
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? LogoPublicId { get; set; }
    public bool Activa { get; set; } = true;

    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}

