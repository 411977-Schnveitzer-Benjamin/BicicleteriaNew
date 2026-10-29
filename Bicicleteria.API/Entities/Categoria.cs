namespace Bicicleteria.API.Entities;

public class Categoria
{
    public int Id { get; set; }
    public int? CategoriaPadreId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;

    // Relación recursiva para subcategorías multinivel
    public Categoria? CategoriaPadre { get; set; }
    public ICollection<Categoria> SubCategorias { get; set; } = new List<Categoria>();
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}

