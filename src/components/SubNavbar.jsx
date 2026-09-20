import React from 'react';
import { Calendar, Users, PlusCircle, Trash2 } from 'lucide-react';

export const SubNavbar = ({
  financialYears,
  activeFyId,
  onSelectFy,
  members,
  activeMemberId,
  onSelectMember,
  onOpenAddModal,
  onOpenAddFyModal,
  onDeleteFinancialYear
}) => {
  const canDelete = financialYears && financialYears.length > 1;

  return (
    <div className="sub-bar">
      {/* Financial Year Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>
          <Calendar size={15} color="#38bdf8" />
          <span>FINANCIAL YEAR:</span>
        </div>
        <div className="fy-pills">
          {financialYears.map((fy) => {
            const isActive = activeFyId === fy.id;

            return (
              <div
                key={fy.id}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                className="fy-pill-wrapper"
              >
                <button
                  onClick={() => onSelectFy(fy.id)}
                  className={`fy-pill ${isActive ? 'active' : ''}`}
                  style={{
                    paddingRight: (canDelete && onDeleteFinancialYear) ? '1.75rem' : undefined,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{fy.label}</span>
                  {fy.is_current && (
                    <span style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399'
                    }}>
                      Latest
                    </span>
                  )}
                </button>

                {canDelete && onDeleteFinancialYear && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFinancialYear(fy);
                    }}
                    title={`Delete ${fy.label} and purge recorded balances`}
                    className="fy-delete-btn"
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: isActive ? '#f87171' : '#64748b',
                      padding: '2px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 0.85 : 0.45,
                      transition: 'opacity 0.2s, color 0.2s',
                      zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = isActive ? '0.85' : '0.45';
                      e.currentTarget.style.color = isActive ? '#f87171' : '#64748b';
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
          {/* Add Next FY Button */}
          {onOpenAddFyModal && (
            <button
              onClick={onOpenAddFyModal}
              className="fy-pill"
              style={{
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px dashed rgba(56, 189, 248, 0.4)'
              }}
              title="Add New Financial Year & Copy Balances"
            >
              <PlusCircle size={13} />
              <span>+ Next FY</span>
            </button>
          )}
        </div>
      </div>

      {/* Family Member Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>
          <Users size={15} color="#a855f7" />
          <span>FAMILY ENTITY:</span>
        </div>
        <div className="member-pills">
          <button
            onClick={() => onSelectMember('all')}
            className={`member-btn ${activeMemberId === 'all' ? 'active' : ''}`}
          >
            <span className="member-dot" style={{ background: '#38bdf8' }}></span>
            <span>All Family (Consolidated)</span>
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMember(m.id)}
              className={`member-btn ${activeMemberId === m.id ? 'active' : ''}`}
            >
              <span className="member-dot" style={{ background: m.avatar_color || '#94a3b8' }}></span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Add Asset Quick Button */}
        <button
          onClick={onOpenAddModal}
          className="btn-primary"
          style={{ marginLeft: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.8125rem' }}
        >
          <PlusCircle size={15} />
          <span>Add Asset / Account</span>
        </button>
      </div>
    </div>
  );
};
