namespace Bicicleteria.API.Entities;

public class Producto
{
    public int Id { get; set; }
    public int CategoriaId { get; set; }
    public int MarcaId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string TipoProducto { get; set; } = "Repuesto"; // "Bicicleta", "Repuesto", "Accesorio"
    public decimal Precio { get; set; }
    public decimal? PrecioDescuento { get; set; }
    public int Stock { get; set; }
    public int StockMinimoAlerta { get; set; } = 3;

    // Atributos específicos de ciclismo (bicicletas y componentes Shimano/SRAM)
    public string? Rodado { get; set; }
    public string? TalleCuadro { get; set; }
    public string? Material { get; set; }
    public int? Velocidades { get; set; }
    public int? PesoGramos { get; set; }
    public string? EspecificacionesJson { get; set; }

    public bool Destacado { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    // Propiedades de navegación
    public Categoria Categoria { get; set; } = null!;
    public Marca Marca { get; set; } = null!;
    public ICollection<ImagenProducto> Imagenes { get; set; } = new List<ImagenProducto>();
}

