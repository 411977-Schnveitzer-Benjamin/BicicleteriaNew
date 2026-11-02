// Devuelve siempre la foto real del producto almacenada en la base de datos (o subida a Cloudinary).
export function obtenerImagenProducto(producto) {
  const imgObj = producto?.imagenes?.find((i) => i.esPrincipal) || producto?.imagenes?.[0];
  if (imgObj?.imagenUrl) {
    return imgObj.imagenUrl;
  }
  return 'https://ts4.mm.bing.net/th?id=OIP.60xyxdUZPBYHHbb7tdzC2wHaEt&w=680&h=510&c=7&pid=15.1';
}
