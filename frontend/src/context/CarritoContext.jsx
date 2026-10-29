import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const { usuario } = useAuth();
  const [items, setItems] = useState(() => {
    const local = localStorage.getItem('bicicleteria_carrito_local');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('bicicleteria_carrito_local', JSON.stringify(items));
  }, [items]);

  const agregarAlCarrito = async (producto, cantidad = 1) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.productoId === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      const precioUnitario = producto.precioDescuento ?? producto.precio;
      const imagenPrincipal =
        producto.imagenes?.find((img) => img.esPrincipal)?.imagenUrl ||
        producto.imagenes?.[0]?.imagenUrl ||
        null;

      return [
        ...prev,
        {
          productoId: producto.id,
          nombreProducto: producto.nombre,
          marcaNombre: producto.marcaNombre,
          precioUnitario,
          cantidad,
          imagenPrincipal
        }
      ];
    });

    if (usuario) {
      try {
        await axiosClient.post('/ordenes/carrito/items', {
          productoId: producto.id,
          cantidad
        });
      } catch (err) {
        console.warn('Sincronización con servidor pendiente:', err.message);
      }
    }
  };

  const quitarDelCarrito = (productoId) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      quitarDelCarrito(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i))
    );
  };

  const vaciarCarrito = () => {
    setItems([]);
    localStorage.removeItem('bicicleteria_carrito_local');
  };

  const totalCarrito = items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  const cantidadTotalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{
        items,
        totalCarrito,
        cantidadTotalItems,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        vaciarCarrito
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);

