using Bicicleteria.API.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace Bicicleteria.API.Services;

public record ResultadoSubidaCloudinary(string ImagenUrl, string PublicId);

public interface ICloudinaryService
{
    Task<ResultadoSubidaCloudinary> SubirImagenAsync(IFormFile archivo, string carpeta = "bicicleteria/productos");
    Task<bool> EliminarImagenAsync(string publicId);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private static readonly string[] ExtensionesPermitidas = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    private const long TamanoMaximoBytes = 5 * 1024 * 1024; // 5 MB máximo por imagen

    public CloudinaryService(IOptions<CloudinarySettings> options)
    {
        var settings = options.Value;

        if (string.IsNullOrWhiteSpace(settings.CloudName) ||
            string.IsNullOrWhiteSpace(settings.ApiKey) ||
            string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            throw new InvalidOperationException("Faltan las credenciales de Cloudinary en appsettings.json.");
        }

        var account = new Account(settings.CloudName, settings.ApiKey, settings.ApiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true; // Siempre devuelve URLs HTTPS (https://res.cloudinary.com/...)
    }

    public async Task<ResultadoSubidaCloudinary> SubirImagenAsync(IFormFile archivo, string carpeta = "bicicleteria/productos")
    {
        if (archivo == null || archivo.Length == 0)
            throw new ArgumentException("No se recibió ningún archivo o el archivo está vacío.");

        if (archivo.Length > TamanoMaximoBytes)
            throw new ArgumentException("La imagen supera el tamaño máximo permitido de 5 MB.");

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension))
            throw new ArgumentException($"Formato de archivo no permitido ({extension}). Solo se aceptan: {string.Join(", ", ExtensionesPermitidas)}.");

        await using var stream = archivo.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(archivo.FileName, stream),
            Folder = carpeta,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false,
            // Optimización automática en la nube (compresión WebP/AVIF y límite 1200x1200px)
            Transformation = new Transformation()
                .Width(1200)
                .Height(1200)
                .Crop("limit")
                .Quality("auto")
                .FetchFormat("auto")
        };

        var resultado = await _cloudinary.UploadAsync(uploadParams);

        if (resultado.Error != null)
            throw new InvalidOperationException($"Error al subir la imagen a Cloudinary: {resultado.Error.Message}");

        return new ResultadoSubidaCloudinary(
            resultado.SecureUrl.ToString(),
            resultado.PublicId);
    }

    public async Task<bool> EliminarImagenAsync(string publicId)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return false;

        var deletionParams = new DeletionParams(publicId);
        var resultado = await _cloudinary.DestroyAsync(deletionParams);

        return resultado.Result == "ok";
    }
}
