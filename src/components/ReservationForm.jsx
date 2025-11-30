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
    estadoReserva: 'Confirmada',
    metodoPago: 'Tarjeta',
    servicios: [],
    montoTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoadingHabitaciones(true);
      
      try {
        const [habResponse, servResponse] = await Promise.all([
          api.list('/habitaciones'),
          api.list('/servicios-adicionales'),
        ]);
        
        const allHabitaciones = toArray(habResponse);
        const filtered = allHabitaciones.filter(
          (hab) => hab.idHotel === hotel._id && hab.estado !== 'Inactivo'
        );
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
      setFormData((prev) => {
        const updates = { [name]: value };
        
        // Si cambia el método de pago, actualizar el estado de reserva
        if (name === 'metodoPago') {
          updates.estadoReserva = value === 'Efectivo' ? 'Pendiente' : 'Confirmada';
        }
        
        return { ...prev, ...updates };
      });
    }
  };

  const calculateTotal = () => {
    const habitacion = habitaciones.find((h) => h._id === formData.idHabitacion);
    if (!habitacion) return 0;

    const serviciosTotal = formData.servicios.reduce((sum, servicioId) => {
      const servicio = servicios.find((s) => s._id === servicioId);
      return sum + (servicio?.precioAdicional || 0);
    }, 0);

    const cantidadDias = formData.fechaEntrada && formData.fechaSalida
      ? (new Date(formData.fechaSalida) - new Date(formData.fechaEntrada)) / (1000 * 60 * 60 * 24)
      : 1;

    return (habitacion.precioNoche * cantidadDias) + serviciosTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const total = calculateTotal();
      
      // Si es Tarjeta: fecha actual, si es Efectivo: fecha de entrada
      const fechaPago = formData.metodoPago === 'Tarjeta' 
        ? new Date().toISOString()
        : new Date(formData.fechaEntrada).toISOString();
      
      const payload = {
        idCliente: user._id,
        idHabitacion: formData.idHabitacion,
        fechaEntrada: new Date(formData.fechaEntrada).toISOString(),
        fechaSalida: new Date(formData.fechaSalida).toISOString(),
        estadoReserva: formData.estadoReserva,
        servicios: formData.servicios,
        factura: {
          numeroFactura: `FAC-${Date.now()}`,
          fechaPago: fechaPago,
          montoTotal: total,
          metodoPago: formData.metodoPago,
        },
      };

      const response = await api.create('/reservas', payload);
      
      // Si es pago con tarjeta, mostrar factura
      if (formData.metodoPago === 'Tarjeta') {
        const habitacion = habitaciones.find((h) => h._id === formData.idHabitacion);
        const serviciosSeleccionados = servicios.filter((s) => formData.servicios.includes(s._id));
        
        setInvoiceData({
          ...payload,
          hotel,
          habitacion,
          serviciosSeleccionados,
          reservaId: response._id,
        });
        setShowInvoice(true);
      } else {
        setMessage('¡Reserva creada exitosamente!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.idHabitacion && formData.fechaEntrada && formData.fechaSalida;

  const handleCloseInvoice = () => {
    setShowInvoice(false);
    onSuccess?.();
    onClose();
  };

  if (showInvoice && invoiceData) {
    return (
      <div className="modal-overlay" onClick={handleCloseInvoice}>
        <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2><span className="material-symbols-outlined">check_circle</span> ¡Pago Confirmado!</h2>
            <button type="button" className="modal-close" onClick={handleCloseInvoice}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="invoice-container">
              <div className="invoice-header">
                <h3>{hotel.nombreHotel}</h3>
                <p className="invoice-number">Factura: {invoiceData.factura.numeroFactura}</p>
                <p className="invoice-date">
                  Fecha: {new Date(invoiceData.factura.fechaPago).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="invoice-section">
                <h4>Información del Cliente</h4>
                <p><strong>Nombre:</strong> {user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</p>
                <p><strong>Email:</strong> {user.correo}</p>
                <p><strong>Teléfono:</strong> {user.telefono || 'N/D'}</p>
              </div>

              <div className="invoice-section">
                <h4>Detalles de la Reserva</h4>
                <p><strong>Habitación:</strong> {invoiceData.habitacion.tipoHabitacion} - Hab. {invoiceData.habitacion.numeroHabitacion}</p>
                <p><strong>Capacidad:</strong> {invoiceData.habitacion.capacidad} personas</p>
                <p><strong>Check-in:</strong> {new Date(invoiceData.fechaEntrada).toLocaleDateString('es-PE')}</p>
                <p><strong>Check-out:</strong> {new Date(invoiceData.fechaSalida).toLocaleDateString('es-PE')}</p>
                <p><strong>Noches:</strong> {Math.ceil((new Date(invoiceData.fechaSalida) - new Date(invoiceData.fechaEntrada)) / (1000 * 60 * 60 * 24))}</p>
              </div>

              <div className="invoice-section">
                <h4>Detalle de Costos</h4>
                <div className="invoice-items">
                  <div className="invoice-item">
                    <span>Habitación ({invoiceData.habitacion.precioNoche} x {Math.ceil((new Date(invoiceData.fechaSalida) - new Date(invoiceData.fechaEntrada)) / (1000 * 60 * 60 * 24))} noches)</span>
                    <span className="invoice-amount">
                      S/ {invoiceData.habitacion.precioNoche * Math.ceil((new Date(invoiceData.fechaSalida) - new Date(invoiceData.fechaEntrada)) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  {invoiceData.serviciosSeleccionados.map((servicio) => (
                    <div key={servicio._id} className="invoice-item">
                      <span>{servicio.nombre}</span>
                      <span className="invoice-amount">S/ {servicio.precioAdicional}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="invoice-total">
                <div className="total-row">
                  <span>TOTAL PAGADO</span>
                  <span className="total-amount">S/ {invoiceData.factura.montoTotal}</span>
                </div>
                <p className="payment-method">Método de pago: {invoiceData.factura.metodoPago}</p>
                <p className="payment-status">Estado: <span className="status-badge status-confirmada">Confirmada</span></p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleCloseInvoice}>
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva Reserva</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
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
                      {hab.tipoHabitacion} - ${hab.precioNoche} / Noche ({hab.capacidad} personas)
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

            <div className="form-group">
              <label>
                Método de pago *
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleChange}
                  required
                >
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </label>
              {formData.metodoPago === 'Efectivo' && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--warning)' }}>
                  ⚠️ Reserva quedará como <strong>Pendiente</strong> hasta confirmar el pago
                </p>
              )}
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
                        {servicio.nombre} - ${servicio.precioAdicional}
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
