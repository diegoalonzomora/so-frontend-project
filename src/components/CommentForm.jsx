import { useState } from 'react';
import { api } from '../services/api.js';

const CommentForm = ({ hotel, user, onSuccess, onCancel }) => {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!texto.trim()) {
      setError('Por favor escribe un comentario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.create('/comentarios', {
        idCliente: user._id,
        idHotel: hotel._id,
        texto: texto.trim(),
        fecha: new Date().toISOString(),
        reacciones: {
          likes: 0,
          dislikes: 0,
        },
      });

      setTexto('');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Error al crear comentario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-form-card">
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="form-user-info">
          <div className="user-avatar">
            {user.nombres[0].toUpperCase()}
          </div>
          <span className="user-name">{user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</span>
        </div>
        
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Qué te pareció este hotel? Comparte tu experiencia..."
          rows="4"
          maxLength="500"
          className="comment-textarea"
        />
        
        <div className="comment-form-footer">
          <span className="char-count">{texto.length}/500</span>
          {error && <span className="form-error">{error}</span>}
          <div className="comment-form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || !texto.trim()}
            >
              {loading ? 'Publicando...' : 'Publicar comentario'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;
