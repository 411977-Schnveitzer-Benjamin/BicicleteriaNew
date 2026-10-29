namespace Bicicleteria.API.Entities;

public class ImagenProducto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string ImagenUrl { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty; // ID en Cloudinary para borrado/reemplazo
    public bool EsPrincipal { get; set; }
    public int OrdenVisualizacion { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public Producto Producto { get; set; } = null!;
}

