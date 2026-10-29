namespace Bicicleteria.API.Entities;

public class DetalleOrden
{
    public int Id { get; set; }
    public int OrdenId { get; set; }
    public int ProductoId { get; set; }
    public string NombreProductoHistorico { get; set; } = string.Empty;
    public decimal PrecioUnitario { get; set; }
    public int Cantidad { get; set; }
    public decimal Subtotal { get; private set; } // Columna calculada persistida en SQL Server

    public Orden Orden { get; set; } = null!;
    public Producto Producto { get; set; } = null!;
}

