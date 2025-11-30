import { useState, useEffect } from 'react';
import { api, toArray } from '../services/api.js';
import CommentSection from './CommentSection.jsx';
import ReservationForm from './ReservationForm.jsx';

const HotelDetail = ({ hotel, user, onBack, onReservationSuccess }) => {
  const [habitaciones, setHabitaciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReservationForm, setShowReservationForm] = useState(false);

  useEffect(() => {
    const loadHotelData = async () => {
      setLoading(true);
      try {
        const [habResponse, servResponse] = await Promise.all([
          api.list('/habitaciones'),
          api.list('/servicios-adicionales'),
        ]);

        const allHabitaciones = toArray(habResponse);
        // Filtrar solo habitaciones activas (no Inactivo) del hotel
        const filtered = allHabitaciones.filter(
          (hab) => hab.idHotel === hotel._id && hab.estado !== 'Inactivo'
        );
        
        const allServicios = toArray(servResponse);
        const serviciosHotel = allServicios.filter((serv) => serv.idHotel === hotel._id);

        setHabitaciones(filtered);
        setServicios(serviciosHotel);
      } catch (err) {
        console.error('Error cargando datos del hotel:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hotel) {
      loadHotelData();
    }
  }, [hotel]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="material-symbols-outlined" style={{color: '#fbbf24'}}>star</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="material-symbols-outlined" style={{color: '#fbbf24'}}>star_half</span>);
    }
    return stars;
  };

  return (
    <div className="hotel-detail">
      <div className="hotel-detail-header">
        <button onClick={onBack} className="back-button">
          ← Volver a hoteles
        </button>
        <h2>{hotel.nombreHotel}</h2>
        <div className="hotel-rating">
          {renderStars(hotel.calificacion)} <span>{hotel.calificacion}/5</span>
        </div>
      </div>

      <div className="hotel-detail-content">
        {/* Información del hotel */}
        <section className="hotel-info-section">
          <div className="info-card">
            <h3>Información General</h3>
            <p className="hotel-description">{hotel.descripcion}</p>
            
            <div className="info-grid">
              <div className="info-card">
                <span className="info-label"><span className="material-symbols-outlined">location_on</span> Ubicación</span>
                <span className="info-value">
                  {hotel.calle}, {hotel.ciudad}, {hotel.pais?.nombre || 'N/A'}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">📮 Código Postal</span>
                <span className="info-value">{hotel.codigoPostal}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">📞 Teléfono</span>
                <span className="info-value">{hotel.telefonoContacto}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label"><span className="material-symbols-outlined">mail</span> Correo</span>
                <span className="info-value">{hotel.correo}</span>
              </div>
              
              <div className="info-card">
                <span className="info-label"><span className="material-symbols-outlined">hotel</span> Habitaciones</span>
                <span className="info-value">{hotel.numeroHabitaciones} disponibles</span>
              </div>
            </div>
          </div>
        </section>

        {/* Habitaciones disponibles */}
        <section className="rooms-section">
          <h3>Habitaciones Disponibles</h3>
          {loading ? (
            <p>Cargando habitaciones...</p>
          ) : habitaciones.length > 0 ? (
            <div className="rooms-grid">
              {habitaciones.map((hab) => (
                <div key={hab._id} className="room-card">
                  <div className="room-header">
                    <h4>{hab.tipoHabitacion}</h4>
                    <span className={`room-status status-${hab.estado.toLowerCase()}`}>
                      {hab.estado}
                    </span>
                  </div>
                  <p className="room-description">{hab.descripcion}</p>
                  <div className="room-details">
                    <span><span className="material-symbols-outlined">door_front</span> {hab.codigoHabitacion}</span>
                    <span><span className="material-symbols-outlined">stairs</span> Piso {hab.pisoHabitacion}</span>
                    <span><span className="material-symbols-outlined">group</span> {hab.capacidad} personas</span>
                  </div>
                  <div className="room-price">
                    <strong>${hab.precioNoche}</strong> / noche
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No hay habitaciones disponibles actualmente</p>
          )}
        </section>

        {/* Servicios adicionales */}
        {servicios.length > 0 && (
          <section className="services-section">
            <h3>Servicios Adicionales</h3>
            <div className="services-grid">
              {servicios.map((serv) => (
                <div key={serv._id} className="service-card">
                  <h4>{serv.nombre}</h4>
                  <p>{serv.descripcion}</p>
                  <span className="service-price">+${serv.precioAdicional}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Botón de reserva */}
        <div className="reservation-action">
          <button 
            onClick={() => setShowReservationForm(true)} 
            className="reserve-button"
          >
            🏨 Hacer una Reserva
          </button>
        </div>

        {/* Sección de comentarios */}
        <CommentSection hotel={hotel} user={user} />
      </div>

      {/* Modal de reserva */}
      {showReservationForm && (
        <ReservationForm
          user={user}
          hotel={hotel}
          onClose={() => setShowReservationForm(false)}
          onSuccess={() => {
            setShowReservationForm(false);
            onReservationSuccess?.();
          }}
        />
      )}
    </div>
  );
};

export default HotelDetail;
