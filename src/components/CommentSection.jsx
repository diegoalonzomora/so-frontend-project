import { useState, useEffect } from 'react';
import { api, toArray } from '../services/api.js';
import CommentItem from './CommentItem.jsx';
import CommentForm from './CommentForm.jsx';

const CommentSection = ({ hotel, user }) => {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await api.list('/comentarios');
      const allComments = toArray(response);
      
      // Filtrar comentarios de este hotel
      const hotelComments = allComments.filter(
        (comment) => comment.idHotel === hotel._id
      );
      
      // Ordenar por fecha más reciente
      hotelComments.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      setComentarios(hotelComments);
    } catch (err) {
      console.error('Error cargando comentarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotel) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel]);

  const handleCommentCreated = () => {
    loadComments();
    setShowCommentForm(false);
  };

  const handleReactionUpdate = (commentId, newReactions) => {
    setComentarios((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? { ...comment, reacciones: newReactions }
          : comment
      )
    );
  };

  return (
    <section className="comment-section">
      <div className="comment-section-header">
        <h3><span className="material-symbols-outlined">chat_bubble</span> Comentarios ({comentarios.length})</h3>
        <button 
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="comment-toggle-btn"
        >
          {showCommentForm ? <><span className="material-symbols-outlined">close</span> Cancelar</> : <><span className="material-symbols-outlined">edit</span> Escribir comentario</>}
        </button>
      </div>

      {showCommentForm && (
        <CommentForm
          hotel={hotel}
          user={user}
          onSuccess={handleCommentCreated}
          onCancel={() => setShowCommentForm(false)}
        />
      )}

      <div className="comments-list">
        {loading ? (
          <div className="loading-comments">Cargando comentarios...</div>
        ) : comentarios.length > 0 ? (
          comentarios.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              user={user}
              onReactionUpdate={handleReactionUpdate}
            />
          ))
        ) : (
          <div className="no-comments">
            <p>😊 Sé el primero en comentar sobre este hotel</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentSection;
