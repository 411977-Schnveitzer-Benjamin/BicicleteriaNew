using System.Text.Json;
using System.Text.RegularExpressions;
using Bicicleteria.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Data;

public class ProductoCatalogoSeedDto
{
    public string SKU { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string CategoriaPadre { get; set; } = string.Empty;
    public string SubCategoria { get; set; } = string.Empty;
    public string SubCategoriaSlug { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string TipoProducto { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public string? Rodado { get; set; }
    public string? TalleCuadro { get; set; }
    public string? Material { get; set; }
    public int? Velocidades { get; set; }
    public bool Destacado { get; set; }
    public string ImagenUrl { get; set; } = string.Empty;
}

public static class DbSeeder
{
    private static readonly string[] SkusPruebaAntiguos =
    {
        "BIKE-TREK-MARLIN7-L",
        "SHIM-RD-M8100-SGS",
        "SRAM-CS-XG-1275-A1",
        "BIKE-SPEC-CHISEL-M",
        "BIKE-GIANT-REVOLT-S",
        "SHIM-CS-M5100-11V"
    };

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
                Apellido = "El Cairo",
                Email = "admin@bicicleteria.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Telefono = "+54 11 4444-5555",
                Ciudad = "Río Tercero",
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
                Direccion = "Rodríguez Peña 280",
                Ciudad = "Río Tercero",
                CodigoPostal = "X5850",
                Activo = true
            };

            context.Usuarios.AddRange(usuarioAdmin, usuarioCliente);
            await context.SaveChangesAsync();
        }

        // 3. Limpiar artículos de prueba iniciales si existen
        var productosPrueba = await context.Productos
            .Include(p => p.Imagenes)
            .Where(p => SkusPruebaAntiguos.Contains(p.SKU))
            .ToListAsync();

        if (productosPrueba.Count > 0)
        {
            foreach (var prodPrueba in productosPrueba)
            {
                var itemsCarrito = await context.ItemsCarrito.Where(i => i.ProductoId == prodPrueba.Id).ToListAsync();
                if (itemsCarrito.Count > 0)
                    context.ItemsCarrito.RemoveRange(itemsCarrito);

                var detallesOrden = await context.DetallesOrden.Where(d => d.ProductoId == prodPrueba.Id).ToListAsync();
                if (detallesOrden.Count > 0)
                {
                    // Si una orden histórica lo referencia, solo desactivamos o eliminamos el detalle de prueba
                    context.DetallesOrden.RemoveRange(detallesOrden);
                }

                if (prodPrueba.Imagenes.Count > 0)
                    context.ImagenesProducto.RemoveRange(prodPrueba.Imagenes);

                context.Productos.Remove(prodPrueba);
            }
            await context.SaveChangesAsync();
        }

        // Desactivar marcas de prueba que no pertenecen al stock real de El Cairo
        var marcasPrueba = await context.Marcas
            .Where(m => new[] { "Trek", "Specialized", "Giant", "SRAM", "Fox" }.Contains(m.Nombre))
            .ToListAsync();

        foreach (var mp in marcasPrueba)
        {
            var tieneProductos = await context.Productos.AnyAsync(p => p.MarcaId == mp.Id);
            if (!tieneProductos)
                context.Marcas.Remove(mp);
            else
                mp.Activa = false;
        }
        await context.SaveChangesAsync();

        // 4. Cargar catálogo real desde catalogo_el_cairo.json (923 artículos de las 7 listas de Excel)
        var rutaJson = Path.Combine(AppContext.BaseDirectory, "Data", "catalogo_el_cairo.json");
        if (!File.Exists(rutaJson))
        {
            rutaJson = Path.Combine(Directory.GetCurrentDirectory(), "Data", "catalogo_el_cairo.json");
        }

        if (File.Exists(rutaJson))
        {
            var jsonContent = await File.ReadAllTextAsync(rutaJson);
            var itemsCatalogo = JsonSerializer.Deserialize<List<ProductoCatalogoSeedDto>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<ProductoCatalogoSeedDto>();

            if (await context.Productos.CountAsync() >= 100)
            {
                // Sincronizar las fotos reales y descripciones actualizadas en los productos ya existentes
                var mapaJsonPorSku = itemsCatalogo.ToDictionary(x => x.SKU, StringComparer.OrdinalIgnoreCase);
                var productosDb = await context.Productos.Include(p => p.Imagenes).ToListAsync();
                var huboCambios = false;

                foreach (var prodDb in productosDb)
                {
                    if (mapaJsonPorSku.TryGetValue(prodDb.SKU, out var itemJson))
                    {
                        if (!string.IsNullOrWhiteSpace(itemJson.Descripcion) && prodDb.Descripcion != itemJson.Descripcion)
                        {
                            prodDb.Descripcion = itemJson.Descripcion;
                            huboCambios = true;
                        }

                        if (!string.IsNullOrWhiteSpace(itemJson.ImagenUrl))
                        {
                            var imgPrincipal = prodDb.Imagenes.FirstOrDefault(i => i.EsPrincipal) ?? prodDb.Imagenes.FirstOrDefault();
                            if (imgPrincipal == null)
                            {
                                context.ImagenesProducto.Add(new ImagenProducto
                                {
                                    ProductoId = prodDb.Id,
                                    ImagenUrl = itemJson.ImagenUrl,
                                    PublicId = $"bicicleteria/elcairo/{prodDb.SKU}",
                                    EsPrincipal = true,
                                    OrdenVisualizacion = 0
                                });
                                huboCambios = true;
                            }
                            else if (imgPrincipal.ImagenUrl != itemJson.ImagenUrl &&
                                     (imgPrincipal.PublicId == null || imgPrincipal.PublicId.StartsWith("bicicleteria/elcairo/") || imgPrincipal.PublicId.StartsWith("bicicleteria/seed/")))
                            {
                                imgPrincipal.ImagenUrl = itemJson.ImagenUrl;
                                huboCambios = true;
                            }
                        }
                    }
                }

                if (huboCambios)
                {
                    await context.SaveChangesAsync();
                }
            }
            else
            {

            // Asegurar Categorías Padre
            var padresNombres = new Dictionary<string, (string Slug, string Desc)>
            {
                ["Bicicletas"] = ("bicicletas", "Bicicletas importadas y nacionales listas para rodar"),
                ["Repuestos"] = ("repuestos", "Repuestos, cámaras, cubiertas y componentes originales"),
                ["Accesorios"] = ("accesorios", "Cascos, indumentaria, herramientas, infladores y accesorios")
            };

            var mapaPadres = new Dictionary<string, Categoria>();
            foreach (var kvp in padresNombres)
            {
                var catPadre = await context.Categorias.FirstOrDefaultAsync(c => c.Slug == kvp.Value.Slug);
                if (catPadre == null)
                {
                    catPadre = new Categoria
                    {
                        Nombre = kvp.Key,
                        Slug = kvp.Value.Slug,
                        Descripcion = kvp.Value.Desc,
                        Activa = true
                    };
                    context.Categorias.Add(catPadre);
                    await context.SaveChangesAsync();
                }
                mapaPadres[kvp.Key] = catPadre;
            }

            // Asegurar Subcategorías
            var subCatsUnicas = itemsCatalogo
                .GroupBy(x => x.SubCategoriaSlug)
                .Select(g => g.First())
                .ToList();

            var mapaSubCategorias = new Dictionary<string, Categoria>();
            foreach (var sc in subCatsUnicas)
            {
                var catExistente = await context.Categorias.FirstOrDefaultAsync(c => c.Slug == sc.SubCategoriaSlug);
                var padre = mapaPadres.TryGetValue(sc.CategoriaPadre, out var p) ? p : mapaPadres["Repuestos"];

                if (catExistente == null)
                {
                    catExistente = new Categoria
                    {
                        CategoriaPadreId = padre.Id,
                        Nombre = sc.SubCategoria,
                        Slug = sc.SubCategoriaSlug,
                        Descripcion = $"{sc.SubCategoria} - Catálogo oficial Bicicleterías El Cairo",
                        Activa = true
                    };
                    context.Categorias.Add(catExistente);
                    await context.SaveChangesAsync();
                }
                else
                {
                    catExistente.CategoriaPadreId = padre.Id;
                    catExistente.Nombre = sc.SubCategoria;
                    catExistente.Activa = true;
                }
                mapaSubCategorias[sc.SubCategoriaSlug] = catExistente;
            }
            await context.SaveChangesAsync();

            // Asegurar Marcas
            var marcasUnicas = itemsCatalogo.Select(x => x.Marca).Distinct().ToList();
            var mapaMarcas = new Dictionary<string, Marca>(StringComparer.OrdinalIgnoreCase);
            var marcasExistentes = await context.Marcas.ToListAsync();
            foreach (var m in marcasExistentes)
            {
                mapaMarcas[m.Nombre] = m;
            }

            foreach (var nombreMarca in marcasUnicas)
            {
                if (!mapaMarcas.ContainsKey(nombreMarca))
                {
                    var nuevaMarca = new Marca
                    {
                        Nombre = nombreMarca,
                        Activa = true
                    };
                    context.Marcas.Add(nuevaMarca);
                    mapaMarcas[nombreMarca] = nuevaMarca;
                }
            }
            await context.SaveChangesAsync();

            // Insertar los 923 Productos
            var skusExistentes = (await context.Productos.Select(p => p.SKU).ToListAsync())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var nuevosProductos = new List<Producto>();
            foreach (var item in itemsCatalogo)
            {
                if (skusExistentes.Contains(item.SKU))
                    continue;

                var slugBase = Regex.Replace(item.Nombre.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
                if (slugBase.Length > 150)
                    slugBase = slugBase[..150].Trim('-');
                var slugUnico = $"{slugBase}-{item.SKU.ToLowerInvariant()}";

                var categoria = mapaSubCategorias[item.SubCategoriaSlug];
                var marca = mapaMarcas[item.Marca];

                var prod = new Producto
                {
                    CategoriaId = categoria.Id,
                    MarcaId = marca.Id,
                    SKU = item.SKU,
                    Nombre = item.Nombre,
                    Slug = slugUnico,
                    Descripcion = item.Descripcion,
                    TipoProducto = item.TipoProducto,
                    Precio = item.Precio,
                    Stock = item.Stock,
                    StockMinimoAlerta = item.TipoProducto == "Bicicleta" ? 2 : 5,
                    Rodado = item.Rodado,
                    TalleCuadro = item.TalleCuadro,
                    Material = item.Material,
                    Velocidades = item.Velocidades,
                    Destacado = item.Destacado,
                    Activo = true,
                    Imagenes = new List<ImagenProducto>
                    {
                        new ImagenProducto
                        {
                            ImagenUrl = item.ImagenUrl,
                            PublicId = $"bicicleteria/elcairo/{item.SKU}",
                            EsPrincipal = true,
                            OrdenVisualizacion = 0
                        }
                    }
                };

                nuevosProductos.Add(prod);
                skusExistentes.Add(item.SKU);
            }

            if (nuevosProductos.Count > 0)
            {
                context.Productos.AddRange(nuevosProductos);
                await context.SaveChangesAsync();
            }
            }
        }

        // 5. Servicios de Taller
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
                    Nombre = "Regulación de Cambios (Shimano / L-TWOO / Sensah)",
                    Descripcion = "Alineación de fusible, tensión de cable/indexado y ajuste de límites en transmisiones de 6 a 12 velocidades.",
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
