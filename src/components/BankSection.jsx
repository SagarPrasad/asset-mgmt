import React from 'react';
import { Landmark, Eye, Edit2, Trash2, PlusCircle, KeyRound, Shield } from 'lucide-react';
import { formatINR, maskSensitive, matchesMember } from '../utils/formatters';

export const BankSection = ({
  data,
  activeFy,
  activeMemberId,
  privacyMode,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset,
  onViewCredentials
}) => {
  const filteredAccounts = (data.bankAccounts || []).filter(b => {
    return matchesMember(b.member_id, activeMemberId, data.members || []);
  });

  const totalBalance = filteredAccounts.reduce((acc, b) => {
    return acc + Number(b.snapshots?.[activeFy.id]?.balance || 0);
  }, 0);

  const totalInterest = filteredAccounts.reduce((acc, b) => {
    return acc + Number(b.snapshots?.[activeFy.id]?.interest_acquired || 0);
  }, 0);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Landmark size={20} color="#10b981" />
            Bank Balances & Term Deposits ({activeFy.label})
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Year-end balance as of March 31st, interest acquired, and protected netbanking credentials.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total Bank Balance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalBalance, privacyMode)}
            </div>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total FY Interest</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              +{formatINR(totalInterest, privacyMode)}
            </div>
          </div>
          <button
            onClick={() => onOpenAddModal('bank')}
            className="btn-primary"
          >
            <PlusCircle size={15} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Bank & Branch</th>
              <th>Account Type</th>
              <th>Account Number</th>
              <th>Netbanking & Credentials</th>
              <th>Balance on 31st March</th>
              <th>Interest Acquired</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => {
              const snapshot = account.snapshots?.[activeFy.id] || { balance: 0, interest_acquired: 0, investments_linked: 0 };
              const member = data.members?.find(m => m.id === account.member_id || matchesMember(account.member_id, m.id, data.members));

              return (
                <tr key={account.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: member?.avatar_color || '#38bdf8' }}></div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{account.bank_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{account.branch || 'Main Branch'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-blue" style={{ fontSize: '11px' }}>
                      {account.account_type}
                    </span>
                  </td>
                  <td className="mono-text">
                    {maskSensitive(account.account_number, privacyMode)}
                  </td>

                  {/* Netbanking Credentials with Protected Eye Icon */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500 }}>
                          {account.netbanking_user || account.customer_id || 'User'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', letterSpacing: '0.1em' }}>
                          ••••••••
                        </div>
                      </div>
                      <button
                        onClick={() => onViewCredentials({
                          title: account.bank_name,
                          type: 'Bank Account',
                          username: account.netbanking_user,
                          customer_id: account.customer_id,
                          account_number: account.account_number,
                          password: account.netbanking_password,
                          pin_hint: account.pin_hint
                        })}
                        className="btn-icon"
                        style={{ width: 28, height: 28, borderColor: 'rgba(192, 132, 252, 0.3)' }}
                        title="View credentials with Master Password"
                      >
                        <Eye size={13} color="#c084fc" />
                      </button>
                    </div>
                  </td>

                  <td className="mono-text" style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9375rem' }}>
                    {formatINR(snapshot.balance, privacyMode)}
                  </td>
                  <td className="mono-text" style={{ color: '#fbbf24' }}>
                    +{formatINR(snapshot.interest_acquired, privacyMode)}
                  </td>

                  {/* Edit & Delete Action Buttons */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => onEditAsset(account, 'bank')}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Edit account details and FY balance"
                      >
                        <Edit2 size={13} color="#38bdf8" />
                      </button>
                      <button
                        onClick={() => onDeleteAsset(account.bank_name, 'Bank Account', () => {
                          const updated = {
                            ...data,
                            bankAccounts: data.bankAccounts.filter(b => b.id !== account.id)
                          };
                          return updated;
                        })}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Delete account (Requires Master Password)"
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
