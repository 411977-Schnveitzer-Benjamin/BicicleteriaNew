import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCarrito } from '../context/CarritoContext';
import { obtenerImagenProducto } from '../utils/productVisuals';

export default function HomePage() {
  const { agregarAlCarrito } = useCarrito();
  const [destacados, setDestacados] = useState([]);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [enTransicion, setEnTransicion] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [touchInicioX, setTouchInicioX] = useState(null);

  useEffect(() => {
    axiosClient
      .get('/productos', { params: { soloDestacados: true } })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDestacados(res.data);
        }
      })
      .catch(() => setDestacados([]));
  }, []);

  const cambiarSlide = (nuevoIndice) => {
    if (destacados.length <= 1) return;
    setEnTransicion(true);
    setIndiceActivo((nuevoIndice + destacados.length) % destacados.length);
    setTimeout(() => setEnTransicion(false), 680);
  };

  useEffect(() => {
    if (pausado || destacados.length <= 1) return;
    const timer = setInterval(() => {
      cambiarSlide(indiceActivo + 1);
    }, 4200);
    return () => clearInterval(timer);
  }, [indiceActivo, pausado, destacados.length]);

  const obtenerPosicionSlide = (index) => {
    const total = destacados.length;
    if (total === 0) return 'hidden';
    if (index === indiceActivo) return 'active';
    if (index === (indiceActivo - 1 + total) % total) return 'prev';
    if (index === (indiceActivo + 1) % total) return 'next';
    return 'hidden';
  };

  return (
    <div className="container home-page">
      {/* 1. Intro Minimalista */}
      <section className="home-intro">
        <span className="home-eyebrow">TIENDA OFICIAL & SERVICE MECÁNICO</span>
        <h1>Pasión por rodar al máximo nivel</h1>
        <p>
          En <strong>Bicicleterías El Cairo</strong> encontrás toda la línea de bicicletas <strong>Venzo</strong>, <strong>Oxea</strong>, <strong>SLP</strong> y Nacionales, junto con repuestos originales <strong>Shimano</strong>, cámaras, cubiertas y accesorios.
        </p>
        <div className="home-cta-group">
          <Link to="/bicicletas" className="btn-primary">
            Ver Bicicletas
          </Link>
          <Link to="/repuestos" className="btn-outline">
            Explorar Repuestos
          </Link>
        </div>
      </section>

      {/* 2. Carrusel de Artículos Destacados con Difuminado en Movimiento */}
      {destacados.length > 0 && (
        <section
          className="carousel-section"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          <div className="carousel-header">
            <div>
              <span className="section-tag">SELECCIÓN DESTACADA</span>
              <h2>Los mejores artículos de la temporada</h2>
            </div>
            <div className="carousel-arrows">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => cambiarSlide(indiceActivo - 1)}
                aria-label="Anterior"
              >
                ←
              </button>
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => cambiarSlide(indiceActivo + 1)}
                aria-label="Siguiente"
              >
                →
              </button>
            </div>
          </div>

          <div
            className={`carousel-stage ${enTransicion ? 'is-moving' : ''}`}
            onTouchStart={(e) => setTouchInicioX(e.touches[0]?.clientX ?? null)}
            onTouchEnd={(e) => {
              if (touchInicioX === null) return;
              const finX = e.changedTouches[0]?.clientX ?? touchInicioX;
              const delta = touchInicioX - finX;
              if (Math.abs(delta) > 40) {
                cambiarSlide(delta > 0 ? indiceActivo + 1 : indiceActivo - 1);
              }
              setTouchInicioX(null);
            }}
          >
            {destacados.map((item, idx) => {
              const pos = obtenerPosicionSlide(idx);
              const imgUrl = obtenerImagenProducto(item);
              const precioFinal = item.precioDescuento ?? item.precio;

              return (
                <article
                  key={item.id}
                  className={`carousel-slide slide-${pos}`}
                  onClick={() => pos !== 'active' && cambiarSlide(idx)}
                >
                  <div className="carousel-image-container">
                    <img src={imgUrl} alt={item.nombre} />
                    <span className="carousel-brand-pill">{item.marcaNombre}</span>
                  </div>

                  <div className="carousel-info">
                    <small className="carousel-category">{item.categoriaNombre}</small>
                    <h3>
                      <Link to={`/producto/${item.id}`} className="product-title-link">
                        {item.nombre}
                      </Link>
                    </h3>

                    <div className="carousel-bottom">
                      <div>
                        {item.precioDescuento && (
                          <span className="old-price">${item.precio.toLocaleString('es-AR')}</span>
                        )}
                        <div className="carousel-price">
                          ${precioFinal.toLocaleString('es-AR')}
                        </div>
                      </div>

                      {pos === 'active' && (
                        <div className="demo-btns" style={{ marginTop: 0 }}>
                          <Link
                            to={`/producto/${item.id}`}
                            className="btn-outline btn-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver Ficha
                          </Link>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              agregarAlCarrito(item, 1);
                            }}
                          >
                            + Agregar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="carousel-dots">
            {destacados.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`carousel-dot ${idx === indiceActivo ? 'dot-active' : ''}`}
                onClick={() => cambiarSlide(idx)}
                aria-label={`Ir a ${item.nombre}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Secciones Separadas (Navegación Limpia) */}
      <section className="home-sections-grid">
        <Link to="/bicicletas" className="section-portal-card">
          <span className="portal-badge">SECCIÓN 01</span>
          <h3>Bicicletas</h3>
          <p>MTB Rodado 29, Ruta y Gravel listas para rodar.</p>
          <span className="portal-link">Entrar a Bicicletas →</span>
        </Link>

        <Link to="/repuestos" className="section-portal-card">
          <span className="portal-badge">SECCIÓN 02</span>
          <h3>Repuestos & Accesorios</h3>
          <p>Transmisiones Shimano y SRAM, frenos hidráulicos y equipamiento.</p>
          <span className="portal-link">Entrar a Repuestos →</span>
        </Link>

        <Link to="/taller" className="section-portal-card">
          <span className="portal-badge">SECCIÓN 03</span>
          <h3>Taller Mecánico</h3>
          <p>Service integral, centrado de ruedas y purgado de frenos con turno online.</p>
          <span className="portal-link">Agendar Turno →</span>
        </Link>
      </section>
    </div>
  );
}

