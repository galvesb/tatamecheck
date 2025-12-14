import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import CheckInMap from '../../components/CheckInMap';
import '../../index.css';

const PresencaPage = () => {
    const { user } = useAuth();
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);

    // Função para mostrar toast
    const showToast = (message, type = 'success') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        
        setToast({ message, type });
        
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 2000);
    };

    // Cleanup do timer ao desmontar
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    // Se não for aluno, mostrar painel de professor/admin
    if (user?.role !== 'aluno') {
        return (
            <div>
                <div className="card" style={{ marginBottom: '16px' }}>
                    <h2>Painel de Presença e Progressão</h2>
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                        Visualize o progresso dos alunos e identifique quem está elegível para graduação.
                    </p>
                    <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.9rem' }}>
                        Acesse o módulo "Alunos" para gerenciar os cadastros e visualizar detalhes.
                    </p>
                </div>
            </div>
        );
    }

    const handleCheckInClick = () => {
        setMapKey(prev => prev + 1); // Força remontagem do mapa
        setShowMap(true);
        setCheckInStatus(null);
    };

    const handleCheckInSuccess = (data) => {
        // Mostrar toast de sucesso
        let message = data.message || 'Check-in realizado com sucesso!';
        if (data.progresso) {
            message += ` Progresso: ${data.progresso.diasPresenca}/${data.progresso.diasNecessarios} dias`;
            if (data.progresso.diasRestantes > 0) {
                message += ` • Faltam ${data.progresso.diasRestantes} dias`;
            }
        }
        showToast(message, 'success');
        setShowMap(false);
    };

    const handleMapClose = () => {
        setShowMap(false);
        // Forçar remontagem do mapa na próxima abertura
        setTimeout(() => {
            // Pequeno delay para garantir que o componente seja desmontado
        }, 100);
    };

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div className={`toast-notification ${toast.type} show`}>
                    <div className="toast-content">
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Modal do Mapa */}
            {showMap && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1rem'
                }} key={`modal-${mapKey}`}>
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} key={`map-wrapper-${mapKey}`}>
                        <CheckInMap 
                            key={`checkin-map-${mapKey}-${Date.now()}`}
                            onCheckIn={handleCheckInSuccess}
                            onClose={handleMapClose}
                        />
                    </div>
                </div>
            )}

            {/* Card de Check-in para Alunos */}
            {user?.role === 'aluno' && (
                <div className="card">
                    <h2>Check-in de Presença</h2>
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                        Faça check-in quando estiver na academia. O sistema verifica sua localização via GPS.
                    </p>
                    <button 
                        className="btn primary" 
                        onClick={handleCheckInClick}
                        style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                    >
                        📍 Fazer Check-in
                    </button>
                </div>
            )}

        </div>
    );
};

export default PresencaPage;

