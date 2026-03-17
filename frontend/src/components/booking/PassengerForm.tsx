import { Passenger } from '../../types';
import './PassengerForm.css';

interface Props {
  passengers: Passenger[];
  onChange: (index: number, field: keyof Passenger, value: string | number) => void;
  errors: Record<string, string>;
}

export default function PassengerForm({ passengers, onChange, errors }: Props) {
  return (
    <div className="passenger-form">
      {passengers.map((p, idx) => (
        <div key={idx} className="passenger-block">
          <h4 className="passenger-title">Passenger {idx + 1}</h4>
          <div className="passenger-fields">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className={`form-input ${errors[`${idx}-name`] ? 'input-error' : ''}`}
                type="text"
                placeholder="Full name"
                value={p.name}
                onChange={(e) => onChange(idx, 'name', e.target.value)}
              />
              {errors[`${idx}-name`] && <span className="error-text">{errors[`${idx}-name`]}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                className={`form-input ${errors[`${idx}-age`] ? 'input-error' : ''}`}
                type="number"
                placeholder="Age"
                min={1}
                max={120}
                value={p.age}
                onChange={(e) => onChange(idx, 'age', parseInt(e.target.value) || '')}
              />
              {errors[`${idx}-age`] && <span className="error-text">{errors[`${idx}-age`]}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <div className="gender-options">
              {(['male', 'female', 'other'] as const).map((g) => (
                <label key={g} className="gender-option">
                  <input
                    type="radio"
                    name={`gender-${idx}`}
                    value={g}
                    checked={p.gender === g}
                    onChange={() => onChange(idx, 'gender', g)}
                  />
                  <span>{g.charAt(0).toUpperCase() + g.slice(1)}</span>
                </label>
              ))}
            </div>
            {errors[`${idx}-gender`] && <span className="error-text">{errors[`${idx}-gender`]}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
