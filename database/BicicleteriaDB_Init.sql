-- =========================================================================
-- CREACIÓN DE LA BASE DE DATOS: BicicleteriaDB (100% en Español)
-- Motor: Microsoft SQL Server
-- Optimizado para: .NET 8 + Entity Framework Core
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BicicleteriaDB')
BEGIN
    CREATE DATABASE BicicleteriaDB;
END
GO

USE BicicleteriaDB;
GO

-- =========================================================================
-- 1. MÓDULO DE USUARIOS Y AUTENTICACIÓN (JWT + Roles)
-- =========================================================================

CREATE TABLE Roles (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(50) NOT NULL, -- 'Administrador', 'Cliente'
    Descripcion NVARCHAR(200) NULL,
    CONSTRAINT PK_Roles PRIMARY KEY (Id),
    CONSTRAINT UQ_Roles_Nombre UNIQUE (Nombre)
);

CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) NOT NULL,
    RolId INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Telefono NVARCHAR(30) NULL,
    Direccion NVARCHAR(250) NULL,
    Ciudad NVARCHAR(100) NULL,
    CodigoPostal NVARCHAR(20) NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT (SYSUTCDATETIME()),
    FechaActualizacion DATETIME2 NULL,
    CONSTRAINT PK_Usuarios PRIMARY KEY (Id),
    CONSTRAINT UQ_Usuarios_Email UNIQUE (Email),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolId) REFERENCES Roles(Id) ON DELETE NO ACTION
);

-- =========================================================================
-- 2. MÓDULO DE CATÁLOGO Y CLASIFICACIÓN PROFUNDA DE PRODUCTOS
-- =========================================================================

-- Soporta subcategorías multinivel (Ej: Repuestos -> Transmisión -> Cassettes)
CREATE TABLE Categorias (
    Id INT IDENTITY(1,1) NOT NULL,
    CategoriaPadreId INT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Slug NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(300) NULL,
    Activa BIT NOT NULL CONSTRAINT DF_Categorias_Activa DEFAULT (1),
    CONSTRAINT PK_Categorias PRIMARY KEY (Id),
    CONSTRAINT UQ_Categorias_Slug UNIQUE (Slug),
    CONSTRAINT FK_Categorias_CategoriaPadre FOREIGN KEY (CategoriaPadreId) REFERENCES Categorias(Id) ON DELETE NO ACTION
);

-- Marcas clave del rubro (Ej: Shimano, SRAM, Trek, Specialized, Fox)
CREATE TABLE Marcas (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    LogoUrl NVARCHAR(500) NULL,
    LogoPublicId NVARCHAR(150) NULL, -- Cloudinary PublicId
    Activa BIT NOT NULL CONSTRAINT DF_Marcas_Activa DEFAULT (1),
    CONSTRAINT PK_Marcas PRIMARY KEY (Id),
    CONSTRAINT UQ_Marcas_Nombre UNIQUE (Nombre)
);

CREATE TABLE Productos (
    Id INT IDENTITY(1,1) NOT NULL,
    CategoriaId INT NOT NULL,
    MarcaId INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    Nombre NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(220) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    -- Tipo general para filtros rápidos: 'Bicicleta', 'Repuesto', 'Accesorio'
    TipoProducto NVARCHAR(30) NOT NULL,
    Precio DECIMAL(18,2) NOT NULL,
    PrecioDescuento DECIMAL(18,2) NULL,
    Stock INT NOT NULL CONSTRAINT DF_Productos_Stock DEFAULT (0),
    StockMinimoAlerta INT NOT NULL CONSTRAINT DF_Productos_StockMinimoAlerta DEFAULT (3),
    -- Atributos específicos de ciclismo (opcionales según el tipo de producto)
    Rodado NVARCHAR(20) NULL,               -- Ej: '29"', '27.5"', '700c'
    TalleCuadro NVARCHAR(20) NULL,          -- Ej: 'S', 'M', 'L', 'XL', '54cm'
    Material NVARCHAR(50) NULL,             -- Ej: 'Aluminio', 'Carbono', 'Chromoly'
    Velocidades INT NULL,                   -- Ej: 11, 12 (para transmisiones Shimano/SRAM)
    PesoGramos INT NULL,                    -- Peso en gramos
    EspecificacionesJson NVARCHAR(MAX) NULL,-- Atributos extra en formato JSON
    Destacado BIT NOT NULL CONSTRAINT DF_Productos_Destacado DEFAULT (0),
    Activo BIT NOT NULL CONSTRAINT DF_Productos_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Productos_FechaCreacion DEFAULT (SYSUTCDATETIME()),
    FechaActualizacion DATETIME2 NULL,
    CONSTRAINT PK_Productos PRIMARY KEY (Id),
    CONSTRAINT UQ_Productos_SKU UNIQUE (SKU),
    CONSTRAINT UQ_Productos_Slug UNIQUE (Slug),
    CONSTRAINT CK_Productos_Precio CHECK (Precio >= 0),
    CONSTRAINT CK_Productos_Stock CHECK (Stock >= 0),
    CONSTRAINT FK_Productos_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Productos_Marcas FOREIGN KEY (MarcaId) REFERENCES Marcas(Id) ON DELETE NO ACTION
);

-- Integración con Cloudinary (soporta múltiples fotos por producto)
CREATE TABLE ImagenesProducto (
    Id INT IDENTITY(1,1) NOT NULL,
    ProductoId INT NOT NULL,
    ImagenUrl NVARCHAR(500) NOT NULL,       -- URL segura devuelta por Cloudinary
    PublicId NVARCHAR(200) NOT NULL,        -- ID en Cloudinary para borrar/actualizar desde .NET
    EsPrincipal BIT NOT NULL CONSTRAINT DF_ImagenesProducto_EsPrincipal DEFAULT (0),
    OrdenVisualizacion INT NOT NULL CONSTRAINT DF_ImagenesProducto_OrdenVisualizacion DEFAULT (0),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_ImagenesProducto_FechaCreacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ImagenesProducto PRIMARY KEY (Id),
    CONSTRAINT FK_ImagenesProducto_Productos FOREIGN KEY (ProductoId) REFERENCES Productos(Id) ON DELETE CASCADE
);

-- =========================================================================
-- 3. MÓDULO DE GESTIÓN DE VENTAS (Carritos y Órdenes)
-- =========================================================================

CREATE TABLE Carritos (
    Id INT IDENTITY(1,1) NOT NULL,
    UsuarioId INT NOT NULL,
    FechaActualizacion DATETIME2 NOT NULL CONSTRAINT DF_Carritos_FechaActualizacion DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Carritos PRIMARY KEY (Id),
    CONSTRAINT UQ_Carritos_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT FK_Carritos_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE
);

CREATE TABLE ItemsCarrito (
    Id INT IDENTITY(1,1) NOT NULL,
    CarritoId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL,
    FechaAgregado DATETIME2 NOT NULL CONSTRAINT DF_ItemsCarrito_FechaAgregado DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ItemsCarrito PRIMARY KEY (Id),
    CONSTRAINT UQ_ItemsCarrito_Carrito_Producto UNIQUE (CarritoId, ProductoId),
    CONSTRAINT CK_ItemsCarrito_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT FK_ItemsCarrito_Carritos FOREIGN KEY (CarritoId) REFERENCES Carritos(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ItemsCarrito_Productos FOREIGN KEY (ProductoId) REFERENCES Productos(Id) ON DELETE CASCADE
);

CREATE TABLE Ordenes (
    Id INT IDENTITY(1,1) NOT NULL,
    NumeroOrden NVARCHAR(30) NOT NULL,      -- Ej: 'ORD-2026-0001'
    UsuarioId INT NOT NULL,
    EstadoOrden NVARCHAR(30) NOT NULL CONSTRAINT DF_Ordenes_EstadoOrden DEFAULT ('Pendiente'), -- 'Pendiente', 'Pagada', 'Enviada', 'Entregada', 'Cancelada'
    MetodoPago NVARCHAR(50) NOT NULL,       -- 'MercadoPago', 'TarjetaCredito', 'Transferencia'
    EstadoPago NVARCHAR(30) NOT NULL CONSTRAINT DF_Ordenes_EstadoPago DEFAULT ('Pendiente'),
    Subtotal DECIMAL(18,2) NOT NULL,
    CostoEnvio DECIMAL(18,2) NOT NULL CONSTRAINT DF_Ordenes_CostoEnvio DEFAULT (0),
    MontoTotal DECIMAL(18,2) NOT NULL,
    DireccionEnvio NVARCHAR(250) NOT NULL,
    CiudadEnvio NVARCHAR(100) NOT NULL,
    CodigoPostalEnvio NVARCHAR(20) NOT NULL,
    Notas NVARCHAR(500) NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Ordenes_FechaCreacion DEFAULT (SYSUTCDATETIME()),
    FechaActualizacion DATETIME2 NULL,
    CONSTRAINT PK_Ordenes PRIMARY KEY (Id),
    CONSTRAINT UQ_Ordenes_NumeroOrden UNIQUE (NumeroOrden),
    CONSTRAINT CK_Ordenes_MontoTotal CHECK (MontoTotal >= 0),
    CONSTRAINT FK_Ordenes_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE NO ACTION
);

CREATE TABLE DetallesOrden (
    Id INT IDENTITY(1,1) NOT NULL,
    OrdenId INT NOT NULL,
    ProductoId INT NOT NULL,
    NombreProductoHistorico NVARCHAR(200) NOT NULL, -- Nombre congelado al momento de la venta
    PrecioUnitario DECIMAL(18,2) NOT NULL,          -- Precio congelado al momento de la venta
    Cantidad INT NOT NULL,
    Subtotal AS (PrecioUnitario * Cantidad) PERSISTED,
    CONSTRAINT PK_DetallesOrden PRIMARY KEY (Id),
    CONSTRAINT CK_DetallesOrden_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_DetallesOrden_PrecioUnitario CHECK (PrecioUnitario >= 0),
    CONSTRAINT FK_DetallesOrden_Ordenes FOREIGN KEY (OrdenId) REFERENCES Ordenes(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DetallesOrden_Productos FOREIGN KEY (ProductoId) REFERENCES Productos(Id) ON DELETE NO ACTION
);

-- =========================================================================
-- 4. MÓDULO DE SERVICIOS DE TALLER Y MANTENIMIENTO MECÁNICO
-- =========================================================================

CREATE TABLE ServiciosTaller (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    PrecioBase DECIMAL(18,2) NOT NULL,
    DuracionEstimadaMinutos INT NOT NULL,
    ImagenUrl NVARCHAR(500) NULL,
    ImagenPublicId NVARCHAR(200) NULL,
    Activo BIT NOT NULL CONSTRAINT DF_ServiciosTaller_Activo DEFAULT (1),
    CONSTRAINT PK_ServiciosTaller PRIMARY KEY (Id),
    CONSTRAINT CK_ServiciosTaller_PrecioBase CHECK (PrecioBase >= 0)
);

CREATE TABLE TurnosTaller (
    Id INT IDENTITY(1,1) NOT NULL,
    UsuarioId INT NOT NULL,
    ServicioTallerId INT NOT NULL,
    DetallesBicicleta NVARCHAR(250) NOT NULL, -- Ej: 'MTB Venzo R29 - Transmisión Shimano Deore'
    NotasCliente NVARCHAR(500) NULL,
    DiagnosticoMecanico NVARCHAR(1000) NULL,
    FechaProgramada DATETIME2 NOT NULL,
    Estado NVARCHAR(30) NOT NULL CONSTRAINT DF_TurnosTaller_Estado DEFAULT ('Programado'), -- 'Programado', 'EnProceso', 'EsperandoRepuestos', 'Listo', 'Entregado', 'Cancelado'
    PrecioFinal DECIMAL(18,2) NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_TurnosTaller_FechaCreacion DEFAULT (SYSUTCDATETIME()),
    FechaCompletado DATETIME2 NULL,
    CONSTRAINT PK_TurnosTaller PRIMARY KEY (Id),
    CONSTRAINT FK_TurnosTaller_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_TurnosTaller_ServiciosTaller FOREIGN KEY (ServicioTallerId) REFERENCES ServiciosTaller(Id) ON DELETE NO ACTION
);

-- =========================================================================
-- 5. ÍNDICES DE RENDIMIENTO PARA CONSULTAS FRECUENTES EN EF CORE
-- =========================================================================

CREATE INDEX IX_Productos_CategoriaId ON Productos(CategoriaId);
CREATE INDEX IX_Productos_MarcaId ON Productos(MarcaId);
CREATE INDEX IX_Productos_TipoProducto_Activo ON Productos(TipoProducto, Activo);
CREATE INDEX IX_Categorias_CategoriaPadreId ON Categorias(CategoriaPadreId);
CREATE INDEX IX_Ordenes_UsuarioId_FechaCreacion ON Ordenes(UsuarioId, FechaCreacion DESC);
CREATE INDEX IX_TurnosTaller_FechaProgramada_Estado ON TurnosTaller(FechaProgramada, Estado);
GO

-- =========================================================================
-- 6. SEED DATA INICIAL (Roles, Marcas, Categorías y Servicios de Taller)
-- =========================================================================

INSERT INTO Roles (Nombre, Descripcion) VALUES
('Administrador', 'Acceso total al backoffice para cargar productos, actualizar stock y ver ganancias'),
('Cliente', 'Cliente que navega el catálogo, realiza compras y agenda turnos de taller');

INSERT INTO Marcas (Nombre) VALUES
('Shimano'), ('SRAM'), ('Trek'), ('Specialized'), ('Giant'), ('Venzo'), ('Maxxis'), ('Fox');

INSERT INTO Categorias (CategoriaPadreId, Nombre, Slug, Descripcion) VALUES
(NULL, 'Bicicletas', 'bicicletas', 'Bicicletas completas listas para rodar'),
(NULL, 'Repuestos', 'repuestos', 'Componentes y piezas de recambio'),
(NULL, 'Accesorios', 'accesorios', 'Equipamiento e indumentaria para el ciclista');

DECLARE @BicisId INT = (SELECT Id FROM Categorias WHERE Slug = 'bicicletas');
DECLARE @RepuestosId INT = (SELECT Id FROM Categorias WHERE Slug = 'repuestos');
DECLARE @AccesoriosId INT = (SELECT Id FROM Categorias WHERE Slug = 'accesorios');

INSERT INTO Categorias (CategoriaPadreId, Nombre, Slug, Descripcion) VALUES
(@BicisId, 'Mountain Bike (MTB)', 'mtb', 'Bicicletas todo terreno rodado 29 y 27.5'),
(@BicisId, 'Ruta y Gravel', 'ruta-gravel', 'Bicicletas de alta velocidad y largas distancias'),
(@RepuestosId, 'Transmisión', 'transmision', 'Cassettes, cadenas, descarriladores, shifters y palancas'),
(@RepuestosId, 'Frenos', 'frenos', 'Calipers hidráulicos, discos, pastillas y manijas'),
(@RepuestosId, 'Suspensión y Horquillas', 'suspension', 'Horquillas con suspensión y shocks traseros'),
(@AccesoriosId, 'Cascos e Indumentaria', 'cascos-indumentaria', 'Protección y vestimenta técnica para ciclismo');

INSERT INTO ServiciosTaller (Nombre, Descripcion, PrecioBase, DuracionEstimadaMinutos) VALUES
('Service Completo General', 'Desarme íntegro, lavado por ultrasonido de transmisión, centrado de ruedas, lubricación y ajuste de cambios y frenos.', 45000.00, 180),
('Regulación de Cambios (Shimano / SRAM)', 'Alineación de fusible, tensión de cable/indexado y ajuste de límites en transmisiones de 8 a 12 velocidades.', 15000.00, 45),
('Purgado de Frenos Hidráulicos', 'Recambio de líquido mineral o DOT, limpieza de pistones y descontaminación de pastillas (por freno).', 18000.00, 60),
('Centrado de Rueda y Tensión de Rayos', 'Alineación lateral y radial en centrador profesional.', 12000.00, 45);
GO
