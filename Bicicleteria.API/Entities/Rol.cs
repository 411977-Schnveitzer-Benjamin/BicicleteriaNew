namespace Bicicleteria.API.Entities;

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty; // "Administrador", "Cliente"
    public string? Descripcion { get; set; }

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

