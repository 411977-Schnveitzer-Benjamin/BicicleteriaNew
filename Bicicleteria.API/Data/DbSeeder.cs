using Bicicleteria.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(BicicleteriaDbContext context)
    {
        // 1. Roles
        if (!await context.Roles.AnyAsync())
        {
            var rolAdmin = new Rol
            {
                Nombre = "Administrador",
                Descripcion = "Acceso total al backoffice para cargar productos, actualizar stock y ver ganancias"
            };
            var rolCliente = new Rol
            {
                Nombre = "Cliente",
                Descripcion = "Cliente que navega el catálogo, realiza compras y agenda turnos de taller"
            };

            context.Roles.AddRange(rolAdmin, rolCliente);
            await context.SaveChangesAsync();
        }

        // 2. Usuarios por defecto (Administrador y Cliente de prueba)
        if (!await context.Usuarios.AnyAsync())
        {
            var rolAdmin = await context.Roles.FirstAsync(r => r.Nombre == "Administrador");
            var rolCliente = await context.Roles.FirstAsync(r => r.Nombre == "Cliente");

            var usuarioAdmin = new Usuario
            {
                RolId = rolAdmin.Id,
                Nombre = "Administrador",
                Apellido = "Bicicletería",
                Email = "admin@bicicleteria.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Telefono = "+54 11 4444-5555",
                Ciudad = "Buenos Aires",
                Activo = true
            };

            var usuarioCliente = new Usuario
            {
                RolId = rolCliente.Id,
                Nombre = "Juan",
                Apellido = "Pérez",
                Email = "cliente@bicicleteria.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Cliente123!"),
                Telefono = "+54 11 6666-7777",
                Direccion = "Av. del Libertador 1500",
                Ciudad = "Buenos Aires",
                CodigoPostal = "1425",
                Activo = true
            };

            context.Usuarios.AddRange(usuarioAdmin, usuarioCliente);
            await context.SaveChangesAsync();
        }

        // 3. Marcas
        if (!await context.Marcas.AnyAsync())
        {
            var marcas = new[]
            {
                new Marca { Nombre = "Shimano" },
                new Marca { Nombre = "SRAM" },
                new Marca { Nombre = "Trek" },
                new Marca { Nombre = "Specialized" },
                new Marca { Nombre = "Giant" },
                new Marca { Nombre = "Venzo" },
                new Marca { Nombre = "Maxxis" },
                new Marca { Nombre = "Fox" }
            };
            context.Marcas.AddRange(marcas);
            await context.SaveChangesAsync();
        }

        // 4. Categorías Jerárquicas
        if (!await context.Categorias.AnyAsync())
        {
            var catBicicletas = new Categoria { Nombre = "Bicicletas", Slug = "bicicletas", Descripcion = "Bicicletas completas listas para rodar" };
            var catRepuestos = new Categoria { Nombre = "Repuestos", Slug = "repuestos", Descripcion = "Componentes y piezas de recambio" };
            var catAccesorios = new Categoria { Nombre = "Accesorios", Slug = "accesorios", Descripcion = "Equipamiento e indumentaria para el ciclista" };

            context.Categorias.AddRange(catBicicletas, catRepuestos, catAccesorios);
            await context.SaveChangesAsync();

            var subCategorias = new[]
            {
                new Categoria { CategoriaPadreId = catBicicletas.Id, Nombre = "Mountain Bike (MTB)", Slug = "mtb", Descripcion = "Bicicletas todo terreno rodado 29 y 27.5" },
                new Categoria { CategoriaPadreId = catBicicletas.Id, Nombre = "Ruta y Gravel", Slug = "ruta-gravel", Descripcion = "Bicicletas de alta velocidad y largas distancias" },
                new Categoria { CategoriaPadreId = catRepuestos.Id, Nombre = "Transmisión", Slug = "transmision", Descripcion = "Cassettes, cadenas, descarriladores, shifters y palancas" },
                new Categoria { CategoriaPadreId = catRepuestos.Id, Nombre = "Frenos", Slug = "frenos", Descripcion = "Calipers hidráulicos, discos, pastillas y manijas" },
                new Categoria { CategoriaPadreId = catAccesorios.Id, Nombre = "Cascos e Indumentaria", Slug = "cascos-indumentaria", Descripcion = "Protección y vestimenta técnica para ciclismo" }
            };
            context.Categorias.AddRange(subCategorias);
            await context.SaveChangesAsync();
        }

        // 5. Productos de ejemplo (Bicicleta + Transmisión Shimano y SRAM)
        if (!await context.Productos.AnyAsync())
        {
            var catMtb = await context.Categorias.FirstAsync(c => c.Slug == "mtb");
            var catTransmision = await context.Categorias.FirstAsync(c => c.Slug == "transmision");

            var marcaTrek = await context.Marcas.FirstAsync(b => b.Nombre == "Trek");
            var marcaShimano = await context.Marcas.FirstAsync(b => b.Nombre == "Shimano");
            var marcaSram = await context.Marcas.FirstAsync(b => b.Nombre == "SRAM");

            var productosEjemplo = new[]
            {
                new Producto
                {
                    CategoriaId = catMtb.Id,
                    MarcaId = marcaTrek.Id,
                    SKU = "BIKE-TREK-MARLIN7-L",
                    Nombre = "Bicicleta MTB Trek Marlin 7 Gen 3 Rodado 29",
                    Slug = "bicicleta-mtb-trek-marlin-7-gen-3-r29",
                    Descripcion = "Cuadro Alpha Silver Aluminum con cableado interno, horquilla RockShox Judy y transmisión de 12 velocidades.",
                    TipoProducto = "Bicicleta",
                    Precio = 1450000m,
                    Stock = 5,
                    Rodado = "29\"",
                    TalleCuadro = "L",
                    Material = "Aluminio",
                    Velocidades = 12,
                    PesoGramos = 13800,
                    Destacado = true
                },
                new Producto
                {
                    CategoriaId = catTransmision.Id,
                    MarcaId = marcaShimano.Id,
                    SKU = "SHIM-RD-M8100-SGS",
                    Nombre = "Cambio Trasero Shimano Deore XT RD-M8100 12v SGS Shadow+",
                    Slug = "cambio-trasero-shimano-deore-xt-rd-m8100-12v",
                    Descripcion = "Descarrilador trasero Shimano Deore XT serie M8100 para transmisiones monoplato de 12 velocidades (piñón hasta 51T).",
                    TipoProducto = "Repuesto",
                    Precio = 165000m,
                    Stock = 14,
                    Velocidades = 12,
                    PesoGramos = 284,
                    Destacado = true
                },
                new Producto
                {
                    CategoriaId = catTransmision.Id,
                    MarcaId = marcaSram.Id,
                    SKU = "SRAM-CS-XG-1275-A1",
                    Nombre = "Cassette SRAM GX Eagle XG-1275 10-52T 12 Velocidades",
                    Slug = "cassette-sram-gx-eagle-xg-1275-10-52t-12v",
                    Descripcion = "Tecnología FULL PIN con rango expandido del 520% para núcleo XD.",
                    TipoProducto = "Repuesto",
                    Precio = 290000m,
                    Stock = 8,
                    Velocidades = 12,
                    PesoGramos = 452,
                    Destacado = true
                }
            };

            context.Productos.AddRange(productosEjemplo);
            await context.SaveChangesAsync();
        }

        // 6. Servicios de Taller
        if (!await context.ServiciosTaller.AnyAsync())
        {
            var servicios = new[]
            {
                new ServicioTaller
                {
                    Nombre = "Service Completo General",
                    Descripcion = "Desarme íntegro, lavado por ultrasonido de transmisión, centrado de ruedas, lubricación y ajuste de cambios y frenos.",
                    PrecioBase = 45000m,
                    DuracionEstimadaMinutos = 180
                },
                new ServicioTaller
                {
                    Nombre = "Regulación de Cambios (Shimano / SRAM)",
                    Descripcion = "Alineación de fusible, tensión de cable/indexado y ajuste de límites en transmisiones de 8 a 12 velocidades.",
                    PrecioBase = 15000m,
                    DuracionEstimadaMinutos = 45
                },
                new ServicioTaller
                {
                    Nombre = "Purgado de Frenos Hidráulicos",
                    Descripcion = "Recambio de líquido mineral o DOT, limpieza de pistones y descontaminación de pastillas (por freno).",
                    PrecioBase = 18000m,
                    DuracionEstimadaMinutos = 60
                }
            };

            context.ServiciosTaller.AddRange(servicios);
            await context.SaveChangesAsync();
        }
    }
}
