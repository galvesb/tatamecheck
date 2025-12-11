import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../index.css';

// Variável global para armazenar a biblioteca Leaflet carregada
let L = null;

const CheckInMap = ({ onCheckIn, onClose }) => {
    const [academiaLocation, setAcademiaLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [libLoaded, setLibLoaded] = useState(false);
    
    // Refs para manipular o DOM e a instância do mapa diretamente
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const circleRef = useRef(null);

    // 1. Carregar Leaflet e CSS dinamicamente
    useEffect(() => {
        const loadLeaflet = async () => {
            if (typeof window === 'undefined') return;

            try {
                if (!L) {
                    const leafletModule = await import('leaflet');
                    await import('leaflet/dist/leaflet.css');
                    L = leafletModule.default;

                    // Corrigir ícones padrão do Leaflet
                    delete L.Icon.Default.prototype._getIconUrl;
                    L.Icon.Default.mergeOptions({
                        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    });
                }
                setLibLoaded(true);
            } catch (err) {
                console.error("Erro ao carregar Leaflet:", err);
                setError("Falha ao carregar biblioteca de mapas.");
            }
        };
        loadLeaflet();
    }, []);

    // 2. Buscar Dados (Academia e Usuário)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar Academia
                const academiaRes = await axios.get('/api/aluno/academia');
                let locAcademia = null;
                
                if (academiaRes.data?.localizacao) {
                    locAcademia = {
                        lat: academiaRes.data.localizacao.latitude,
                        lng: academiaRes.data.localizacao.longitude,
                        raio: academiaRes.data.localizacao.raioMetros || 100
                    };
                    setAcademiaLocation(locAcademia);
                } else {
                    // Fallback
                    locAcademia = { lat: -23.5505, lng: -46.6333, raio: 100 };
                    setAcademiaLocation(locAcademia);
                }

                // Buscar Usuário
                if (!navigator.geolocation) {
                    setError('Geolocalização não suportada.');
                } else {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            setUserLocation({
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            });
                        },
                        (err) => {
                            console.error(err);
                            setError('Permissão de localização negada ou indisponível.');
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Erro ao carregar dados.');
                // Define um fallback para não travar a tela
                setAcademiaLocation({ lat: -23.5505, lng: -46.6333, raio: 100 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 3. Inicializar e Controlar o Mapa (A Lógica "Manual" que resolve o erro)
    useEffect(() => {
        // Só roda se a lib carregou, se temos o container HTML e a localização da academia
        if (!libLoaded || !mapContainerRef.current || !academiaLocation || !L) return;

        // Se o mapa já existe, não recria, apenas atualiza
        if (!mapInstanceRef.current) {
            try {
                // Criação do Mapa
                const map = L.map(mapContainerRef.current).setView(
                    [academiaLocation.lat, academiaLocation.lng], 
                    16
                );

                // Camada de Tiles (OpenStreetMap)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                // Marcador da Academia
                const greenIcon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
                });

                L.marker([academiaLocation.lat, academiaLocation.lng], { icon: greenIcon })
                    .addTo(map)
                    .bindPopup(`<b>Academia</b><br>Raio: ${academiaLocation.raio}m`);

                // Círculo da Academia
                circleRef.current = L.circle([academiaLocation.lat, academiaLocation.lng], {
                    color: '#22c55e',
                    fillColor: '#22c55e',
                    fillOpacity: 0.2,
                    radius: academiaLocation.raio
                }).addTo(map);

                mapInstanceRef.current = map;
            } catch (e) {
                console.error("Erro ao inicializar mapa", e);
            }
        }

        // Cleanup: remove o mapa quando o componente desmonta
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                userMarkerRef.current = null;
                circleRef.current = null;
            }
        };
    }, [libLoaded, academiaLocation]); // Dependências controladas

    // 4. Atualizar marcador do usuário quando a localização muda
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation || !L || !academiaLocation) return;

        const isInside = calcularDistancia(
            userLocation.lat, userLocation.lng,
            academiaLocation.lat, academiaLocation.lng
        ) <= academiaLocation.raio;

        const iconUrl = isInside 
            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
            : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';

        const userIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });

        // Se já existe marcador, remove ou atualiza
        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
            userMarkerRef.current.setIcon(userIcon);
        } else {
            // Cria novo marcador
            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('Você está aqui');
        }

        // Centraliza no usuário
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);

    }, [userLocation, academiaLocation]);

    // Funções auxiliares
    const handleCheckIn = async () => {
        if (!userLocation) return;
        setCheckingIn(true);
        try {
            const res = await axios.post('/api/aluno/checkin', {
                latitude: userLocation.lat,
                longitude: userLocation.lng
            });
            if (onCheckIn) onCheckIn(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao realizar check-in');
        } finally {
            setCheckingIn(false);
        }
    };

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const dentroDoRaio = academiaLocation && userLocation
        ? calcularDistancia(userLocation.lat, userLocation.lng, academiaLocation.lat, academiaLocation.lng) <= academiaLocation.raio
        : false;

    // --- RENDERIZAÇÃO ---
    if (loading) {
        return <div className="card" style={{padding: '3rem', textAlign: 'center', color: '#ccc'}}>Carregando...</div>;
    }

    if (error && !academiaLocation) {
        return (
            <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
                <h3 style={{color: '#f87171'}}>{error}</h3>
                <button className="btn secondary" onClick={onClose}>Fechar</button>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Check-in</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Container do Mapa */}
            <div style={{ height: '400px', width: '100%', background: '#1e293b', position: 'relative' }}>
                {!libLoaded && (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b'}}>
                        Carregando biblioteca de mapas...
                    </div>
                )}
                {/* A div onde o Leaflet será injetado */}
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
            </div>

            <div style={{ padding: '1rem' }}>
                {error && <div style={{ color: '#f87171', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(248,113,113,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                {userLocation && academiaLocation && (
                    <div style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        textAlign: 'center',
                        marginBottom: '1rem',
                        background: dentroDoRaio ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        color: dentroDoRaio ? '#22c55e' : '#fbbf24',
                        border: `1px solid ${dentroDoRaio ? '#22c55e' : '#fbbf24'}`
                    }}>
                        {dentroDoRaio 
                            ? "✅ Você está na área permitida!" 
                            : `⚠️ Você está longe (${Math.round(calcularDistancia(userLocation.lat, userLocation.lng, academiaLocation.lat, academiaLocation.lng))}m)`}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn primary" onClick={handleCheckIn} disabled={!dentroDoRaio || checkingIn} style={{flex: 1}}>
                        {checkingIn ? 'Enviando...' : '📍 Fazer Check-in'}
                    </button>
                    <button className="btn secondary" onClick={onClose} style={{flex: 1}}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default CheckInMap;