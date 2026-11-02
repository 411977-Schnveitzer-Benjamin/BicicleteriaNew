export default function LogoElCairo({ height = 52 }) {
  return (
    <svg
      height={height}
      viewBox="0 0 340 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bicicleterías El Cairo"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Contorno exterior blanco tipo sticker */}
      <g filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.45))">
        {/* Arco Amarillo (Derecha) */}
        <path
          d="M 185 56 A 64 52 0 0 1 308 56"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 192 56 A 56 45 0 0 1 300 56"
          fill="#FFFFFF"
          stroke="#FACC15"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Arco Naranja (Centro) */}
        <path
          d="M 118 56 A 66 54 0 0 1 246 56"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 125 56 A 58 47 0 0 1 238 56"
          fill="#FFFFFF"
          stroke="#F97316"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Arco Rojo (Izquierda) */}
        <path
          d="M 34 56 A 72 56 0 0 1 178 56"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 42 56 A 64 48 0 0 1 170 56"
          fill="#FFFFFF"
          stroke="#DC2626"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Base blanca detrás de EL CAIRO y BICICLETAS */}
        <rect x="6" y="44" width="328" height="39" rx="12" fill="#FFFFFF" />
        <rect x="10" y="48" width="320" height="31" rx="9" fill="#090D16" />

        {/* Texto principal: EL CAIRO */}
        <text
          x="170"
          y="73"
          textAnchor="middle"
          fill="#E11D48"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          fontFamily="'Inter', 'Arial Black', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="33"
          letterSpacing="2"
        >
          EL CAIRO
        </text>

        {/* Pastilla inferior blanca para BICICLETAS */}
        <rect x="52" y="80" width="236" height="25" rx="8" fill="#FFFFFF" />
        <text
          x="170"
          y="98"
          textAnchor="middle"
          fill="#090D16"
          fontFamily="'Inter', 'Arial Black', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="16"
          letterSpacing="4.5"
        >
          BICICLETAS
        </text>
      </g>
    </svg>
  );
}

