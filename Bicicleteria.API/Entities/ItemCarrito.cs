namespace Bicicleteria.API.Entities;

public class ItemCarrito
{
    public int Id { get; set; }
    public int CarritoId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public DateTime FechaAgregado { get; set; } = DateTime.UtcNow;

    public Carrito Carrito { get; set; } = null!;
    public Producto Producto { get; set; } = null!;
}

