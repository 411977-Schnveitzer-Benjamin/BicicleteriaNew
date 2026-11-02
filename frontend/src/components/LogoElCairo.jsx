export default function LogoElCairo({ height = 48 }) {
  return (
    <svg
      height={height}
      viewBox="0 0 360 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bicicleterías El Cairo"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Tres arcos superiores limpios (sin fondo blanco) */}
      {/* Arco Amarillo (Derecha) */}
      <path
        d="M 206 54 A 64 46 0 0 1 312 54"
        stroke="#FACC15"
        strokeWidth="9.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Arco Naranja (Centro) */}
      <path
        d="M 142 54 A 66 48 0 0 1 254 54"
        stroke="#F97316"
        strokeWidth="9.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Arco Rojo (Izquierda) */}
      <path
        d="M 56 54 A 72 50 0 0 1 190 54"
        stroke="#DC2626"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Texto principal: EL CAIRO (borde oscuro metálico + relleno rojo intenso) */}
      <text
        x="182"
        y="78"
        textAnchor="middle"
        fill="#090D16"
        stroke="#27272A"
        strokeWidth="8"
        strokeLinejoin="round"
        fontFamily="'Inter', 'Arial Black', sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="38"
        letterSpacing="2.5"
        transform="skewX(-10)"
      >
        EL CAIRO
      </text>
      <text
        x="182"
        y="78"
        textAnchor="middle"
        fill="#DC2626"
        stroke="#7F1D1D"
        strokeWidth="1"
        fontFamily="'Inter', 'Arial Black', sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="38"
        letterSpacing="2.5"
        transform="skewX(-10)"
      >
        EL CAIRO
      </text>

      {/* Subtítulo inferior limpio: BICICLETAS */}
      <text
        x="186"
        y="102"
        textAnchor="middle"
        fill="#71717A"
        fontFamily="'Inter', 'Arial Black', sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="15.5"
        letterSpacing="5.5"
        transform="skewX(-10)"
      >
        BICICLETAS
      </text>
    </svg>
  );
}
