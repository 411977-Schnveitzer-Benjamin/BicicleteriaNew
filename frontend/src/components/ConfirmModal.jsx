export default function ConfirmModal({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Sí, eliminar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar
}) {
  if (!abierto) return null;

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">⚠️</div>
        <h3>{titulo}</h3>
        <p>{mensaje}</p>
        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

