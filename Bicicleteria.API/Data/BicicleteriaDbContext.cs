using Bicicleteria.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bicicleteria.API.Data;

public class BicicleteriaDbContext : DbContext
{
    public BicicleteriaDbContext(DbContextOptions<BicicleteriaDbContext> options) : base(options)
    {
    }

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ImagenProducto> ImagenesProducto => Set<ImagenProducto>();
    public DbSet<Carrito> Carritos => Set<Carrito>();
    public DbSet<ItemCarrito> ItemsCarrito => Set<ItemCarrito>();
    public DbSet<Orden> Ordenes => Set<Orden>();
    public DbSet<DetalleOrden> DetallesOrden => Set<DetalleOrden>();
    public DbSet<ServicioTaller> ServiciosTaller => Set<ServicioTaller>();
    public DbSet<TurnoTaller> TurnosTaller => Set<TurnoTaller>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Roles
        modelBuilder.Entity<Rol>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.Nombre).IsUnique();
            e.Property(r => r.Nombre).HasMaxLength(50).IsRequired();
            e.Property(r => r.Descripcion).HasMaxLength(200);
        });

        // 2. Usuarios
        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuarios");
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Nombre).HasMaxLength(100).IsRequired();
            e.Property(u => u.Apellido).HasMaxLength(100).IsRequired();
            e.Property(u => u.Email).HasMaxLength(150).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(u => u.Telefono).HasMaxLength(30);
            e.Property(u => u.Direccion).HasMaxLength(250);
            e.Property(u => u.Ciudad).HasMaxLength(100);
            e.Property(u => u.CodigoPostal).HasMaxLength(20);

            e.HasOne(u => u.Rol)
             .WithMany(r => r.Usuarios)
             .HasForeignKey(u => u.RolId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // 3. Categorias (jerarquía recursiva)
        modelBuilder.Entity<Categoria>(e =>
        {
            e.ToTable("Categorias");
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Slug).IsUnique();
            e.HasIndex(c => c.CategoriaPadreId);
            e.Property(c => c.Nombre).HasMaxLength(100).IsRequired();
            e.Property(c => c.Slug).HasMaxLength(120).IsRequired();
            e.Property(c => c.Descripcion).HasMaxLength(300);

            e.HasOne(c => c.CategoriaPadre)
             .WithMany(c => c.SubCategorias)
             .HasForeignKey(c => c.CategoriaPadreId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. Marcas
        modelBuilder.Entity<Marca>(e =>
        {
            e.ToTable("Marcas");
            e.HasKey(m => m.Id);
            e.HasIndex(m => m.Nombre).IsUnique();
            e.Property(m => m.Nombre).HasMaxLength(100).IsRequired();
            e.Property(m => m.LogoUrl).HasMaxLength(500);
            e.Property(m => m.LogoPublicId).HasMaxLength(150);
        });

        // 5. Productos
        modelBuilder.Entity<Producto>(e =>
        {
            e.ToTable("Productos");
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.SKU).IsUnique();
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasIndex(p => p.CategoriaId);
            e.HasIndex(p => p.MarcaId);
            e.HasIndex(p => new { p.TipoProducto, p.Activo });

            e.Property(p => p.SKU).HasMaxLength(50).IsRequired();
            e.Property(p => p.Nombre).HasMaxLength(200).IsRequired();
            e.Property(p => p.Slug).HasMaxLength(220).IsRequired();
            e.Property(p => p.TipoProducto).HasMaxLength(30).IsRequired();
            e.Property(p => p.Precio).HasColumnType("decimal(18,2)");
            e.Property(p => p.PrecioDescuento).HasColumnType("decimal(18,2)");
            e.Property(p => p.Rodado).HasMaxLength(20);
            e.Property(p => p.TalleCuadro).HasMaxLength(20);
            e.Property(p => p.Material).HasMaxLength(50);

            e.HasOne(p => p.Categoria)
             .WithMany(c => c.Productos)
             .HasForeignKey(p => p.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(p => p.Marca)
             .WithMany(m => m.Productos)
             .HasForeignKey(p => p.MarcaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. ImagenesProducto (Cloudinary)
        modelBuilder.Entity<ImagenProducto>(e =>
        {
            e.ToTable("ImagenesProducto");
            e.HasKey(ip => ip.Id);
            e.Property(ip => ip.ImagenUrl).HasMaxLength(500).IsRequired();
            e.Property(ip => ip.PublicId).HasMaxLength(200).IsRequired();

            e.HasOne(ip => ip.Producto)
             .WithMany(p => p.Imagenes)
             .HasForeignKey(ip => ip.ProductoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Carritos & ItemsCarrito
        modelBuilder.Entity<Carrito>(e =>
        {
            e.ToTable("Carritos");
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.UsuarioId).IsUnique();

            e.HasOne(c => c.Usuario)
             .WithOne(u => u.Carrito)
             .HasForeignKey<Carrito>(c => c.UsuarioId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItemCarrito>(e =>
        {
            e.ToTable("ItemsCarrito");
            e.HasKey(ic => ic.Id);
            e.HasIndex(ic => new { ic.CarritoId, ic.ProductoId }).IsUnique();

            e.HasOne(ic => ic.Carrito)
             .WithMany(c => c.Items)
             .HasForeignKey(ic => ic.CarritoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ic => ic.Producto)
             .WithMany()
             .HasForeignKey(ic => ic.ProductoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // 8. Ordenes & DetallesOrden
        modelBuilder.Entity<Orden>(e =>
        {
            e.ToTable("Ordenes");
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.NumeroOrden).IsUnique();
            e.HasIndex(o => new { o.UsuarioId, o.FechaCreacion });

            e.Property(o => o.NumeroOrden).HasMaxLength(30).IsRequired();
            e.Property(o => o.EstadoOrden).HasMaxLength(30).IsRequired();
            e.Property(o => o.MetodoPago).HasMaxLength(50).IsRequired();
            e.Property(o => o.EstadoPago).HasMaxLength(30).IsRequired();
            e.Property(o => o.Subtotal).HasColumnType("decimal(18,2)");
            e.Property(o => o.CostoEnvio).HasColumnType("decimal(18,2)");
            e.Property(o => o.MontoTotal).HasColumnType("decimal(18,2)");
            e.Property(o => o.DireccionEnvio).HasMaxLength(250).IsRequired();
            e.Property(o => o.CiudadEnvio).HasMaxLength(100).IsRequired();
            e.Property(o => o.CodigoPostalEnvio).HasMaxLength(20).IsRequired();
            e.Property(o => o.Notas).HasMaxLength(500);

            e.HasOne(o => o.Usuario)
             .WithMany(u => u.Ordenes)
             .HasForeignKey(o => o.UsuarioId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DetalleOrden>(e =>
        {
            e.ToTable("DetallesOrden");
            e.HasKey(d => d.Id);
            e.Property(d => d.NombreProductoHistorico).HasMaxLength(200).IsRequired();
            e.Property(d => d.PrecioUnitario).HasColumnType("decimal(18,2)");
            e.Property(d => d.Subtotal)
             .HasColumnType("decimal(18,2)")
             .HasComputedColumnSql("([PrecioUnitario] * [Cantidad])", stored: true);

            e.HasOne(d => d.Orden)
             .WithMany(o => o.DetallesOrden)
             .HasForeignKey(d => d.OrdenId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(d => d.Producto)
             .WithMany()
             .HasForeignKey(d => d.ProductoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // 9. ServiciosTaller & TurnosTaller
        modelBuilder.Entity<ServicioTaller>(e =>
        {
            e.ToTable("ServiciosTaller");
            e.HasKey(st => st.Id);
            e.Property(st => st.Nombre).HasMaxLength(150).IsRequired();
            e.Property(st => st.Descripcion).HasMaxLength(500);
            e.Property(st => st.PrecioBase).HasColumnType("decimal(18,2)");
            e.Property(st => st.ImagenUrl).HasMaxLength(500);
            e.Property(st => st.ImagenPublicId).HasMaxLength(200);
        });

        modelBuilder.Entity<TurnoTaller>(e =>
        {
            e.ToTable("TurnosTaller");
            e.HasKey(tt => tt.Id);
            e.HasIndex(tt => new { tt.FechaProgramada, tt.Estado });

            e.Property(tt => tt.DetallesBicicleta).HasMaxLength(250).IsRequired();
            e.Property(tt => tt.NotasCliente).HasMaxLength(500);
            e.Property(tt => tt.DiagnosticoMecanico).HasMaxLength(1000);
            e.Property(tt => tt.Estado).HasMaxLength(30).IsRequired();
            e.Property(tt => tt.PrecioFinal).HasColumnType("decimal(18,2)");

            e.HasOne(tt => tt.Usuario)
             .WithMany(u => u.TurnosTaller)
             .HasForeignKey(tt => tt.UsuarioId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(tt => tt.ServicioTaller)
             .WithMany(st => st.Turnos)
             .HasForeignKey(tt => tt.ServicioTallerId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
