import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, toArray } from '../services/api.js';

const getValueByPath = (source, path) => {
  if (!source || !path) return undefined;
  return path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, source);
};

const setValueByPath = (target, path, value) => {
  const keys = path.split('.');
  let cursor = target;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }

    if (!cursor[key] || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });
};

const formatForInput = (value, field) => {
  if (value === undefined || value === null) {
    return '';
  }

  switch (field.type) {
    case 'array':
      return Array.isArray(value) ? value.join(', ') : value;
    case 'date':
      try {
        return value ? new Date(value).toISOString().slice(0, 10) : '';
      } catch {
        return '';
      }
    default:
      return value;
  }
};

const parseForPayload = (value, field) => {
  if (value === '' || value === undefined || value === null) return undefined;

  switch (field.type) {
    case 'number':
      return Number(value);
    case 'int':
      return parseInt(value, 10);
    case 'array':
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    case 'date':
      return new Date(value).toISOString();
    default:
      return value;
  }
};

const buildInitialState = (fields, source = {}) => {
  return fields.reduce((acc, field) => {
    acc[field.name] = formatForInput(getValueByPath(source, field.name), field);
    return acc;
  }, {});
};

const buildPayload = (fields, formState) => {
  return fields.reduce((payload, field) => {
    const rawValue = formState[field.name];
    const parsedValue = parseForPayload(rawValue, field);

    if (parsedValue === undefined) {
      return payload;
    }

    setValueByPath(payload, field.name, parsedValue);
    return payload;
  }, {});
};

const ResourceCrud = ({ config }) => {
  const { title, endpoint, description, fields, columns } = config;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formState, setFormState] = useState(() => buildInitialState(fields));
  const [editingId, setEditingId] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const refreshFormState = useCallback(
    (source = {}) => {
      setFormState(buildInitialState(fields, source));
    },
    [fields],
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await api.list(endpoint);
      setItems(toArray(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = useCallback((event, field) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: field.type === 'number' || field.type === 'int' ? value.replace(/[^0-9.]/g, '') : value,
    }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const payload = buildPayload(fields, formState);

    // Si es un hotel nuevo, agregar numeroHabitaciones: 0
    if (endpoint === '/hoteles' && !editingId) {
      payload.numeroHabitaciones = 0;
    }

    try {
      if (editingId) {
        await api.update(endpoint, editingId, payload);
        setMessage('Registro actualizado correctamente');
      } else {
        const createdItem = await api.create(endpoint, payload);
        setMessage('Registro creado correctamente');
        
        // Si es una habitación nueva, incrementar numeroHabitaciones del hotel
        if (endpoint === '/habitaciones' && createdItem && payload.idHotel) {
          try {
            const hotel = await api.retrieve('/hoteles', payload.idHotel);
            if (hotel) {
              await api.update('/hoteles', payload.idHotel, {
                ...hotel,
                numeroHabitaciones: (hotel.numeroHabitaciones || 0) + 1,
              });
            }
          } catch (err) {
            console.error('Error actualizando contador de habitaciones:', err);
          }
        }
      }
      await fetchItems();
      refreshFormState();
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    refreshFormState(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    refreshFormState();
  };

  const handleDelete = async (id) => {
    setError('');
    setMessage('');
    
    try {
      // Si es una habitación, cambiar estado a "Inactivo" en lugar de eliminar
      if (endpoint === '/habitaciones') {
        const habitacion = await api.retrieve(endpoint, id);
        if (habitacion) {
          await api.update(endpoint, id, {
            ...habitacion,
            estado: 'Inactivo',
          });
          setMessage('Habitación marcada como inactiva');
          
          // Decrementar numeroHabitaciones del hotel
          try {
            const hotel = await api.retrieve('/hoteles', habitacion.idHotel);
            if (hotel && hotel.numeroHabitaciones > 0) {
              await api.update('/hoteles', habitacion.idHotel, {
                ...hotel,
                numeroHabitaciones: hotel.numeroHabitaciones - 1,
              });
            }
          } catch (err) {
            console.error('Error actualizando contador de habitaciones:', err);
          }
        }
      } else {
        // Para otros recursos, eliminar normalmente
        await api.remove(endpoint, id);
        setMessage('Registro eliminado');
      }
      await fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchId) return;
    setError('');
    setMessage('');
    try {
      const data = await api.retrieve(endpoint, searchId);
      setSearchResult(data);
    } catch (err) {
      setError(err.message);
      setSearchResult(null);
    }
  };

  const renderCell = useCallback(
    (item, column) => {
      const value = getValueByPath(item, column.path);
      if (value === null || value === undefined) return '—';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    },
    [],
  );

  const formFields = useMemo(
    () =>
      fields.map((field) => (
        <label key={field.name} className="crud-field">
          <span>
            {field.label}
            {field.required ? ' *' : ''}
          </span>
          {field.type === 'select' ? (
            <select name={field.name} value={formState[field.name] || ''} onChange={(event) => handleInputChange(event, field)}>
              <option value="">Selecciona una opción</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea name={field.name} value={formState[field.name] || ''} onChange={(event) => handleInputChange(event, field)} rows={3} />
          ) : (
            <input
              name={field.name}
              type={
                field.type === 'int'
                  ? 'number'
                  : field.type === 'array'
                  ? 'text'
                  : field.type
              }
              value={formState[field.name] || ''}
              onChange={(event) => handleInputChange(event, field)}
            />
          )}
        </label>
      )),
    [fields, formState, handleInputChange],
  );

  return (
    <section className="crud-card">
      <div className="crud-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="crud-grid">
        <form className="crud-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar' : 'Nuevo'}</h3>
          <div className="crud-fields">{formFields}</div>
          {message && <p className="status success">{message}</p>}
          {error && <p className="status error">{error}</p>}
          <div className="crud-actions">
            <button type="submit">{editingId ? 'Guardar' : 'Crear'}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={handleCancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="crud-data">
          <div className="crud-tools">
            <button onClick={fetchItems} disabled={loading}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <div className="id-search">
              <input type="text" placeholder="ID del registro" value={searchId} onChange={(event) => setSearchId(event.target.value)} />
              <button type="button" onClick={handleSearch}>
                Buscar
              </button>
            </div>
          </div>

          <div className="crud-table-wrapper">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.path}>{column.label}</th>
                  ))}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id}>
                      {columns.map((column) => (
                        <td key={column.path}>{renderCell(item, column)}</td>
                      ))}
                      <td className="table-actions">
                        <button type="button" onClick={() => handleEdit(item)}>
                          Editar
                        </button>
                        <button type="button" className="danger" onClick={() => handleDelete(item._id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {searchResult && (
            <div className="crud-detail">
              <h4>Detalle del registro</h4>
              <pre>{JSON.stringify(searchResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResourceCrud;
