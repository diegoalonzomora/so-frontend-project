import { useCallback, useEffect, useState } from 'react';
import { api, toArray } from '../services/api.js';
import ReservationForm from './ReservationForm.jsx';
import HotelDetail from './HotelDetail.jsx';

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
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationHotel, setReservationHotel] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const [habitaciones, setHabitaciones] = useState([]);

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
      const [reservasRes, habRes] = await Promise.all([
        api.list('/reservas'),
        api.list('/habitaciones'),
      ]);
      
      const data = toArray(reservasRes);
      const filtered = data.filter((reservation) => reservation.idCliente === user._id);
      setReservas(filtered);
      setHabitaciones(toArray(habRes));
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setLoadingReservas(false);
    }
  }, [user]);

  useEffect(() => {
    loadHoteles();
    loadReservas();
  }, [loadHoteles, loadReservas]);

  const handleHotelClick = (hotel) => {
    setSelectedHotel(hotel);
  };

  const handleBackToHotels = () => {
    setSelectedHotel(null);
  };

  const getHabitacionNombre = (idHabitacion) => {
    const hab = habitaciones.find((h) => h._id === idHabitacion);
    return hab ? `Hab. ${hab.codigoHabitacion} - ${hab.tipoHabitacion}` : 'N/D';
  };

  const canCancelReserva = (estadoReserva) => {
    return estadoReserva !== 'Confirmada' && estadoReserva !== 'Cancelada';
  };

  const handleCancelReserva = async (reservaId) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

    try {
      const reserva = reservas.find((r) => r._id === reservaId);
      await api.update('/reservas', reservaId, {
        ...reserva,
        estadoReserva: 'Cancelada',
      });
      await loadReservas();
    } catch (err) {
      alert('Error al cancelar la reserva: ' + err.message);
    }
  };

  // Si hay un hotel seleccionado, mostrar vista de detalle
  if (selectedHotel) {
    return (
      <HotelDetail
        hotel={selectedHotel}
        user={user}
        onBack={handleBackToHotels}
        onReservationSuccess={loadReservas}
      />
    );
  }

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
                className="hotel-card"
                onClick={() => handleHotelClick(hotel)}
              >
                <h4>{hotel.nombreHotel}</h4>
                <p>{hotel.descripcion}</p>
                <ul>
                  <li><span className="material-symbols-outlined">location_on</span> {hotel.ciudad}</li>
                  <li><span className="material-symbols-outlined">star</span> Calificación: {hotel.calificacion ?? 'N/D'}</li>
                  <li><span className="material-symbols-outlined">hotel</span> {hotel.numeroHabitaciones} habitaciones</li>
                </ul>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button 
                    type="button"
                    onClick={() => handleHotelClick(hotel)}
                    style={{ width: '100%' }}
                  >
                    Ver detalles →
                  </button>
                </div>
              </article>
            ))
          )}
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr key={reserva._id}>
                    <td>{getHabitacionNombre(reserva.idHabitacion)}</td>
                    <td>
                      <span className={`status-badge status-${reserva.estadoReserva?.toLowerCase()}`}>
                        {reserva.estadoReserva}
                      </span>
                    </td>
                    <td>{formatDate(reserva.fechaEntrada)}</td>
                    <td>{formatDate(reserva.fechaSalida)}</td>
                    <td>{reserva?.factura?.montoTotal ?? 'N/D'}</td>
                    <td>
                      {canCancelReserva(reserva.estadoReserva) ? (
                        <button
                          type="button"
                          onClick={() => handleCancelReserva(reserva._id)}
                          className="action-btn delete-btn"
                          title="Cancelar reserva"
                        >
                          <span className="material-symbols-outlined">cancel</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</span>
                      )}
                    </td>
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

