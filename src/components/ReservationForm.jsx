import { useState, useEffect } from 'react';
import { api, toArray } from '../services/api.js';

const ReservationForm = ({ user, hotel, onClose, onSuccess }) => {
  const [habitaciones, setHabitaciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loadingHabitaciones, setLoadingHabitaciones] = useState(false);
  const [formData, setFormData] = useState({
    idHabitacion: '',
    fechaEntrada: '',
    fechaSalida: '',
    estadoReserva: 'confirmada',
    servicios: [],
    montoTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoadingHabitaciones(true);
      
      try {
        const [habResponse, servResponse] = await Promise.all([
          api.list('/habitaciones'),
          api.list('/servicios'),
        ]);
        
        const allHabitaciones = toArray(habResponse);
        const filtered = allHabitaciones.filter((hab) => hab.idHotel === hotel._id);
        setHabitaciones(filtered);
        setServicios(toArray(servResponse));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingHabitaciones(false);
      }
    };

    if (hotel) {
      loadData();
    }
  }, [hotel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        servicios: checked
          ? [...prev.servicios, value]
          : prev.servicios.filter((s) => s !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotal = () => {
    const habitacion = habitaciones.find((h) => h._id === formData.idHabitacion);
    if (!habitacion) return 0;

    const serviciosTotal = formData.servicios.reduce((sum, servicioId) => {
      const servicio = servicios.find((s) => s._id === servicioId);
      return sum + (servicio?.precio || 0);
    }, 0);

    return habitacion.precio + serviciosTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const total = calculateTotal();
      
      const payload = {
        idCliente: user._id,
        idHabitacion: formData.idHabitacion,
        fechaEntrada: new Date(formData.fechaEntrada).toISOString(),
        fechaSalida: new Date(formData.fechaSalida).toISOString(),
        estadoReserva: formData.estadoReserva,
        servicios: formData.servicios,
        factura: {
          numeroFactura: `FAC-${Date.now()}`,
          fechaEmision: new Date().toISOString(),
          montoTotal: total,
          metodoPago: 'pendiente',
        },
      };

      await api.create('/reservas', payload);
      setMessage('¡Reserva creada exitosamente!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.idHabitacion && formData.fechaEntrada && formData.fechaSalida;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva Reserva</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="reservation-hotel-info">
            <h3>{hotel.nombreHotel}</h3>
            <p>{hotel.ciudad}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                Habitación *
                <select
                  name="idHabitacion"
                  value={formData.idHabitacion}
                  onChange={handleChange}
                  disabled={loadingHabitaciones}
                  required
                >
                  <option value="">Selecciona una habitación</option>
                  {habitaciones.map((hab) => (
                    <option key={hab._id} value={hab._id}>
                      {hab.tipo} - ${hab.precio} ({hab.capacidad} personas)
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Fecha de entrada *
                <input
                  type="date"
                  name="fechaEntrada"
                  value={formData.fechaEntrada}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </label>
              <label>
                Fecha de salida *
                <input
                  type="date"
                  name="fechaSalida"
                  value={formData.fechaSalida}
                  onChange={handleChange}
                  min={formData.fechaEntrada || new Date().toISOString().split('T')[0]}
                  required
                />
              </label>
            </div>

            {servicios.length > 0 && (
              <div className="form-group">
                <label>Servicios adicionales</label>
                <div className="checkbox-group">
                  {servicios.map((servicio) => (
                    <label key={servicio._id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={servicio._id}
                        checked={formData.servicios.includes(servicio._id)}
                        onChange={handleChange}
                      />
                      <span>
                        {servicio.nombre} - ${servicio.precio}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.idHabitacion && (
              <div className="reservation-total">
                <strong>Total estimado:</strong> ${calculateTotal()}
              </div>
            )}

            {message && <p className="status success">{message}</p>}
            {error && <p className="status error">{error}</p>}

            <div className="form-actions">
              <button type="submit" disabled={!isValid || loading}>
                {loading ? 'Creando...' : 'Confirmar Reserva'}
              </button>
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReservationForm;
