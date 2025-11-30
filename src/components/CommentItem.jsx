import { useState, useEffect, useCallback } from 'react';
import { api, toArray } from '../services/api.js';
import ReplyForm from './ReplyForm.jsx';

const CommentItem = ({ comment, user, onReactionUpdate }) => {
  const [cliente, setCliente] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    const loadClienteData = async () => {
      try {
        const response = await api.retrieve('/clientes', comment.idCliente);
        setCliente(response);
      } catch (err) {
        console.error('Error cargando datos del cliente:', err);
      }
    };

    if (comment.idCliente) {
      loadClienteData();
    }
  }, [comment.idCliente]);

  const loadReplies = useCallback(async () => {
    setLoadingReplies(true);
    try {
      const response = await api.list('/respuestas');
      const allReplies = toArray(response);
      
      console.log('All Replies:', allReplies);
      const commentReplies = allReplies.filter(
        (reply) => reply.idComentario === comment._id
      );

      
      // Cargar datos de clientes para cada respuesta
      const repliesWithClients = await Promise.all(
        commentReplies.map(async (reply) => {
          try {
            const clienteData = await api.retrieve('/clientes', reply.idCliente);
            return { ...reply, cliente: clienteData };
          } catch {
            return reply;
          }
        })
      );
      
      repliesWithClients.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setRespuestas(repliesWithClients);
    } catch (err) {
      console.error('Error cargando respuestas:', err);
    } finally {
      setLoadingReplies(false);
    }
  }, [comment._id]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleToggleReplies = () => {
    if (!showReplies && respuestas.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleLike = async () => {
    try {
      const updatedReacciones = {
        likes: comment.reacciones.likes + 1,
        dislikes: comment.reacciones.dislikes,
      };

      await api.update('/comentarios', comment._id, {
        ...comment,
        reacciones: updatedReacciones,
      });

      onReactionUpdate(comment._id, updatedReacciones);
    } catch (err) {
      console.error('Error actualizando likes:', err);
    }
  };

  const handleDislike = async () => {
    try {
      const updatedReacciones = {
        likes: comment.reacciones.likes,
        dislikes: comment.reacciones.dislikes + 1,
      };

      await api.update('/comentarios', comment._id, {
        ...comment,
        reacciones: updatedReacciones,
      });

      onReactionUpdate(comment._id, updatedReacciones);
    } catch (err) {
      console.error('Error actualizando dislikes:', err);
    }
  };

  const handleReplyCreated = () => {
    loadReplies();
    setShowReplyForm(false);
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            {cliente?.nombres?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="author-info">
            <span className="author-name">
              {cliente ? `${cliente.nombres} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}` : 'Cargando...'}
            </span>
            <span className="comment-date">{formatFecha(comment.fecha)}</span>
          </div>
        </div>
      </div>

      <div className="comment-body">
        <p>{comment.texto}</p>
      </div>

      <div className="comment-actions">
        <button onClick={handleLike} className="reaction-btn like-btn">
          <span className="material-symbols-outlined">thumb_up</span> {comment.reacciones.likes}
        </button>
        <button onClick={handleDislike} className="reaction-btn dislike-btn">
          <span className="material-symbols-outlined">thumb_down</span> {comment.reacciones.dislikes}
        </button>
        <button 
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="reply-btn"
        >
          <span className="material-symbols-outlined">reply</span> Responder
        </button>
        {respuestas.length > 0 && (
          <button 
            onClick={handleToggleReplies}
            className="show-replies-btn"
          >
            <span className="material-symbols-outlined">{showReplies ? 'expand_more' : 'chevron_right'}</span> {respuestas.length} {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
          </button>
        )}
      </div>

      {showReplyForm && (
        <ReplyForm
          comment={comment}
          user={user}
          onSuccess={handleReplyCreated}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {showReplies && (
        <div className="replies-section">
          {loadingReplies ? (
            <p className="loading-replies">Cargando respuestas...</p>
          ) : (
            respuestas.map((reply) => (
              <div key={reply._id} className="reply-item">
                <div className="reply-header">
                  <div className="reply-avatar">
                    {reply.cliente?.nombres?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="reply-info">
                    <span className="reply-author">
                      {reply.cliente 
                        ? `${reply.cliente.nombres} ${reply.cliente.apellidoPaterno} ${reply.cliente.apellidoMaterno}` 
                        : 'Usuario'}
                    </span>
                    <span className="reply-date">{formatFecha(reply.fecha)}</span>
                  </div>
                </div>
                <p className="reply-text">{reply.texto}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
