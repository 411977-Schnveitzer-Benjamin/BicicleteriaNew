namespace Bicicleteria.API.DTOs;

public record LoginRequestDto(string Email, string Password);

public record RegistroRequestDto(
    string Nombre,
    string Apellido,
    string Email,
    string Password,
    string? Telefono,
    string? Direccion,
    string? Ciudad,
    string? CodigoPostal);

public record AuthResponseDto(
    int UsuarioId,
    string NombreCompleto,
    string Email,
    string Rol,
    string Token);

