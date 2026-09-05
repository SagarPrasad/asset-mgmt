import React from 'react';
import { Building2, MapPin, Edit2, Trash2, PlusCircle, UserCheck } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const PropertySection = ({
  data,
  privacyMode,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset
}) => {
  const properties = data.immovableProperties || [];
  const totalCost = properties.reduce((acc, p) => acc + Number(p.cost_amount || 0), 0);
  const totalValuation = properties.reduce((acc, p) => acc + Number(p.current_valuation || p.cost_amount || 0), 0);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="#f59e0b" />
            Immovable Properties (Land & Buildings)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Real estate holdings matching Indian Income Tax Return Schedule AL Part A requirements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total Acquisition Cost</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalCost, privacyMode)}
            </div>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Est. Market Valuation</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalValuation, privacyMode)}
            </div>
          </div>
          <button
            onClick={() => onOpenAddModal('property')}
            className="btn-primary"
          >
            <PlusCircle size={15} />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {properties.map((prop) => (
          <div
            key={prop.id}
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              {/* Header Tags & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge-amber" style={{ fontSize: '11px' }}>
                    {prop.description}
                  </span>
                  <span className="badge-purple" style={{ fontSize: '11px' }}>
                    <UserCheck size={11} /> {prop.co_ownership}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => onEditAsset(prop, 'property')}
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    title="Edit property details"
                  >
                    <Edit2 size={13} color="#38bdf8" />
                  </button>
                  <button
                    onClick={() => onDeleteAsset(prop.title || prop.premises || 'Property', 'Property', () => {
                      const updated = {
                        ...data,
                        immovableProperties: (data.immovableProperties || []).filter(p => p.id !== prop.id)
                      };
                      return updated;
                    })}
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    title="Delete property (Requires Master Password)"
                  >
                    <Trash2 size={13} color="#f87171" />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {prop.title || prop.premises}
              </h3>

              {/* Address details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                <MapPin size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div>{prop.door_no ? `${prop.door_no}, ` : ''}{prop.premises}</div>
                  <div>{prop.road}, {prop.area}</div>
                  <div>{prop.city}, {prop.state} - {prop.pincode}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Country: {prop.country}</div>
                </div>
              </div>
            </div>

            {/* Financial summary bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)'
            }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>ITR Cost Amount</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(prop.cost_amount, privacyMode)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Est. Valuation</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(prop.current_valuation, privacyMode)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
