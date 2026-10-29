namespace Bicicleteria.API.Entities;

public class Carrito
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    public Usuario Usuario { get; set; } = null!;
    public ICollection<ItemCarrito> Items { get; set; } = new List<ItemCarrito>();
}

