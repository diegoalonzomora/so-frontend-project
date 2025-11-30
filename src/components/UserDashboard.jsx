import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, toArray } from '../services/api.js';
import ReservationForm from './ReservationForm.jsx';

const formatDate = (date) => {
  if (!date) return 'Sin fecha';
  try {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
};

const UserDashboard = ({ user }) => {
  const [hoteles, setHoteles] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loadingHoteles, setLoadingHoteles] = useState(false);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentariosLoading, setComentariosLoading] = useState(false);
  const [comentarioError, setComentarioError] = useState('');
  const [comentarioMensaje, setComentarioMensaje] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationHotel, setReservationHotel] = useState(null);

  const loadHoteles = useCallback(async () => {
    setLoadingHoteles(true);
    setGeneralError('');
    try {
      const response = await api.list('/hoteles');
      setHoteles(toArray(response));
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setLoadingHoteles(false);
    }
  }, []);

  const loadReservas = useCallback(async () => {
    if (!user?._id) return;
    setLoadingReservas(true);
    setGeneralError('');
    try {
      const response = await api.list('/reservas');
      const data = toArray(response);
      const filtered = data.filter((reservation) => reservation.idCliente === user._id);
      setReservas(filtered);
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setLoadingReservas(false);
    }
  }, [user]);

  const loadComentarios = useCallback(async (hotelId) => {
    if (!hotelId) return;
    setComentariosLoading(true);
    setComentarioError('');
    setComentarioMensaje('');
    try {
      const response = await api.list('/comentarios');
      const data = toArray(response);
      const filtered = data.filter((comment) => comment.idHotel === hotelId);
      setComentarios(filtered);
    } catch (err) {
      setComentarioError(err.message);
    } finally {
      setComentariosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHoteles();
    loadReservas();
  }, [loadHoteles, loadReservas]);

  useEffect(() => {
    if (hoteles.length > 0 && !selectedHotelId) {
      const firstHotel = hoteles[0];
      setSelectedHotelId(firstHotel._id);
      loadComentarios(firstHotel._id);
    }
  }, [hoteles, selectedHotelId, loadComentarios]);

  const selectedHotel = useMemo(
    () => hoteles.find((hotel) => hotel._id === selectedHotelId),
    [hoteles, selectedHotelId],
  );

  const handleHotelClick = (hotel) => {
    setSelectedHotelId(hotel._id);
    loadComentarios(hotel._id);
  };

  const handleAddComment = async () => {
    if (!comentarioTexto.trim() || !selectedHotel) {
      setComentarioError('Selecciona un hotel e ingresa un comentario.');
      return;
    }
    setComentariosLoading(true);
    setComentarioError('');
    setComentarioMensaje('');
    try {
      const payload = {
        idCliente: user._id,
        idHotel: selectedHotel._id,
        texto: comentarioTexto.trim(),
        fecha: new Date().toISOString(),
        reacciones: { likes: 0, dislikes: 0 },
      };
      await api.create('/comentarios', payload);
      setComentarioMensaje('Comentario agregado correctamente.');
      setComentarioTexto('');
      await loadComentarios(selectedHotel._id);
    } catch (err) {
      setComentarioError(err.message);
    } finally {
      setComentariosLoading(false);
    }
  };

  return (
    <section className="user-dashboard">
      <div className="dashboard-summary">
        <h2>¡Hola, {user.nombres}!</h2>
        <p>Explora hoteles, revisa tus reservas y comparte tu experiencia.</p>
      </div>

      {generalError && <p className="status error">{generalError}</p>}

      <div className="hotel-section">
        <div className="section-header">
          <div>
            <h3>Hoteles disponibles</h3>
          </div>
          <button type="button" onClick={loadHoteles} disabled={loadingHoteles}>
            {loadingHoteles ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
        <div className="hotel-cards">
          {loadingHoteles ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando hoteles...</p>
          ) : hoteles.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay hoteles registrados.</p>
          ) : (
            hoteles.map((hotel) => (
              <article
                key={hotel._id}
                className={`hotel-card ${hotel._id === selectedHotelId ? 'active' : ''}`}
                onClick={() => handleHotelClick(hotel)}
              >
                <h4>{hotel.nombreHotel}</h4>
                <p>{hotel.descripcion}</p>
                <ul>
                  <li>Ciudad: {hotel.ciudad}</li>
                  <li>Calificación: {hotel.calificacion ?? 'N/D'}</li>
                  <li>Habitaciones: {hotel.numeroHabitaciones}</li>
                </ul>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setReservationHotel(hotel);
                    setShowReservationForm(true);
                  }}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Reservar
                </button>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="comments-panel">
        <div className="section-header">
          <div>
            <h3>Comentarios</h3>
            {selectedHotel && <p>{selectedHotel.nombreHotel}</p>}
          </div>
          {selectedHotel && (
            <button type="button" onClick={() => loadComentarios(selectedHotel._id)} disabled={comentariosLoading}>
              {comentariosLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          )}
        </div>
        {comentarioError && <p className="status error">{comentarioError}</p>}
        {comentarioMensaje && <p className="status success">{comentarioMensaje}</p>}

        <div className="comment-list">
          {comentariosLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando comentarios...</p>
          ) : comentarios.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay comentarios. ¡Sé el primero en comentar!</p>
          ) : (
            comentarios.map((comentario) => (
              <article key={comentario._id} className="comment-item">
                <p>{comentario.texto}</p>
                <div>
                  <span>👍 {comentario?.reacciones?.likes ?? 0}</span>
                  <span>👎 {comentario?.reacciones?.dislikes ?? 0}</span>
                  <span>{formatDate(comentario.fecha)}</span>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="comment-form">
          <textarea
            placeholder="Escribe tu comentario sobre este hotel..."
            value={comentarioTexto}
            onChange={(event) => setComentarioTexto(event.target.value)}
            rows={3}
          />
          <button type="button" onClick={handleAddComment} disabled={comentariosLoading || !selectedHotel}>
            {comentariosLoading ? 'Enviando...' : 'Publicar comentario'}
          </button>
        </div>
      </div>

      <div className="reservations">
        <div className="section-header">
          <div>
            <h3>Mis reservas</h3>
          </div>
          <button type="button" onClick={loadReservas} disabled={loadingReservas}>
            {loadingReservas ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
        {loadingReservas ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando reservas...</p>
        ) : reservas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No tienes reservas registradas.</p>
        ) : (
          <div className="crud-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Habitación</th>
                  <th>Estado</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr key={reserva._id}>
                    <td>{reserva.idHabitacion}</td>
                    <td>{reserva.estadoReserva}</td>
                    <td>{formatDate(reserva.fechaEntrada)}</td>
                    <td>{formatDate(reserva.fechaSalida)}</td>
                    <td>{reserva?.factura?.montoTotal ?? 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReservationForm && reservationHotel && (
        <ReservationForm
          user={user}
          hotel={reservationHotel}
          onClose={() => {
            setShowReservationForm(false);
            setReservationHotel(null);
          }}
          onSuccess={() => {
            loadReservas();
          }}
        />
      )}
    </section>
  );
};

export default UserDashboard;

