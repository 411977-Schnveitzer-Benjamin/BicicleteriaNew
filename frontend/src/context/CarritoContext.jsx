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
    let nuevaCantidadTotal = cantidad;

    setItems((prev) => {
      const existe = prev.find((i) => i.productoId === producto.id);
      if (existe) {
        nuevaCantidadTotal = existe.cantidad + cantidad;
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: nuevaCantidadTotal } : i
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
          cantidad: nuevaCantidadTotal
        });
      } catch (err) {
        console.warn('Sincronización con servidor pendiente:', err.message);
      }
    }
  };

  const quitarDelCarrito = async (productoId) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
    if (usuario) {
      try {
        await axiosClient.delete(`/ordenes/carrito/items/${productoId}`);
      } catch {
        // Ignorar si ya no estaba en servidor
      }
    }
  };

  const cambiarCantidad = async (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      await quitarDelCarrito(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i))
    );
    if (usuario) {
      try {
        await axiosClient.post('/ordenes/carrito/items', {
          productoId,
          cantidad: nuevaCantidad
        });
      } catch {
        // Ignorar
      }
    }
  };

  const vaciarCarrito = async () => {
    setItems([]);
    localStorage.removeItem('bicicleteria_carrito_local');
    if (usuario) {
      try {
        await axiosClient.delete('/ordenes/carrito');
      } catch {
        // Ignorar
      }
    }
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
