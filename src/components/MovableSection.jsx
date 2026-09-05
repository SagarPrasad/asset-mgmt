import React, { useState } from 'react';
import { Car, Gem, Palette, Banknote, PlusCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { formatINR, matchesMember } from '../utils/formatters';

export const MovableSection = ({
  data,
  activeMemberId,
  privacyMode,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredAssets = (data.movableAssets || []).filter(item => {
    if (!matchesMember(item.member_id, activeMemberId, data.members || [])) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const totalValue = filteredAssets
    .filter(i => i.status !== 'Sold')
    .reduce((acc, item) => acc + Number(item.current_value || 0), 0);

  const categories = [
    { id: 'all', label: 'All Movables' },
    { id: 'Vehicles / Boats etc.', label: 'Vehicles', icon: Car },
    { id: 'Jewellery, bullion etc.', label: 'Jewellery & Bullion', icon: Gem },
    { id: 'Paintings / Artwork etc.', label: 'Paintings & Art', icon: Palette },
    { id: 'Cash in hand', label: 'Cash in Hand', icon: Banknote }
  ];

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={20} color="#ec4899" />
            Movable Physical Assets & Valuables
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Vehicles, precious bullion, diamond jewelry, fine artwork, and vault cash reserves.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Active Movables Valuation</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f472b6', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalValue, privacyMode)}
            </div>
          </div>
          <button
            onClick={() => onOpenAddModal('movable')}
            className="btn-primary"
          >
            <PlusCircle size={15} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`member-btn ${selectedCategory === c.id ? 'active' : ''}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {c.icon && <c.icon size={13} />}
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Item / Valuables</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Year</th>
              <th>Original Cost</th>
              <th>Current Valuation</th>
              <th>Status / Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => {
              const member = data.members.find(m => m.id === asset.member_id);
              const isSold = asset.status === 'Sold';

              return (
                <tr key={asset.id} style={{ opacity: isSold ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: isSold ? '#94a3b8' : '#f8fafc' }}>
                      {asset.item_name}
                    </div>
                  </td>
                  <td>
                    <span className="badge-purple" style={{ fontSize: '11px' }}>
                      {asset.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: member?.avatar_color || '#94a3b8', fontWeight: 600 }}>
                      {member?.name || 'Family Asset'}
                    </span>
                  </td>
                  <td className="mono-text">{asset.year_of_purchase || '-'}</td>
                  <td className="mono-text">
                    {formatINR(asset.original_cost, privacyMode)}
                  </td>
                  <td className="mono-text" style={{ fontWeight: 700, color: isSold ? '#94a3b8' : '#f472b6' }}>
                    {formatINR(asset.current_value, privacyMode)}
                  </td>
                  <td>
                    {isSold ? (
                      <span className="badge-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                        SOLD
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        {asset.notes || 'In active possession'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => onEditAsset(asset, 'movable')}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Edit movable asset"
                      >
                        <Edit2 size={13} color="#38bdf8" />
                      </button>
                      <button
                        onClick={() => onDeleteAsset(asset.item_name, 'Physical Asset', () => {
                          const updated = {
                            ...data,
                            movableAssets: data.movableAssets.filter(m => m.id !== asset.id)
                          };
                          return updated;
                        })}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Delete asset (Requires Master Password)"
                      >
                        <Trash2 size={13} color="#f87171" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
