import { useState } from 'react';
import { api } from '../services/api.js';

const ReplyForm = ({ comment, user, onSuccess, onCancel }) => {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!texto.trim()) {
      setError('Escribe una respuesta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.create('/respuestas', {
        idComentario: comment._id,
        idCliente: user._id,
        texto: texto.trim(),
        fecha: new Date().toISOString(),
      });

      setTexto('');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Error al crear respuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reply-form-container">
      <form onSubmit={handleSubmit} className="reply-form">
        <div className="reply-form-header">
          <div className="reply-user-avatar">
            {user.nombres[0].toUpperCase()}
          </div>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe una respuesta..."
            maxLength="300"
            className="reply-input"
          />
        </div>
        
        {error && <span className="reply-error">{error}</span>}
        
        <div className="reply-form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="secondary small"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading || !texto.trim()}
            className="small"
          >
            {loading ? 'Enviando...' : 'Responder'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;
