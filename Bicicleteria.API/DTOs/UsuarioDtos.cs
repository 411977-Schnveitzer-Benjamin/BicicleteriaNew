namespace Bicicleteria.API.DTOs;

public record UsuarioDto(
    int Id,
    string Nombre,
    string Apellido,
    string Email,
    string Rol,
    string? Telefono,
    string? Direccion,
    string? Ciudad,
    string? CodigoPostal,
    bool Activo,
    DateTime FechaCreacion);

public record ActualizarUsuarioDto(
    string Nombre,
    string Apellido,
    string? Telefono,
    string? Direccion,
    string? Ciudad,
    string? CodigoPostal);

public record CambiarRolUsuarioDto(int RolId, bool Activo);

