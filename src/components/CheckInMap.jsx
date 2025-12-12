import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../index.css';

// Função auxiliar para calcular distância (Haversine)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Função para criar um GeoJSON de círculo (usando fórmula precisa)
const criarCirculoGeoJSON = (center, radiusInMeters) => {
    const points = 64; // Número de pontos para formar o círculo
    const coords = [];
    const R = 6371000; // Raio da Terra em metros
    
    for (let i = 0; i <= points; i++) {
        const angle = (i * 360) / points;
        const angleRad = angle * Math.PI / 180;
        
        // Fórmula precisa para calcular ponto em um círculo
        const lat1Rad = center.lat * Math.PI / 180;
        const lon1Rad = center.lng * Math.PI / 180;
        const d = radiusInMeters / R;
        
        const lat2Rad = Math.asin(
            Math.sin(lat1Rad) * Math.cos(d) +
            Math.cos(lat1Rad) * Math.sin(d) * Math.cos(angleRad)
        );
        
        const lon2Rad = lon1Rad + Math.atan2(
            Math.sin(angleRad) * Math.sin(d) * Math.cos(lat1Rad),
            Math.cos(d) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
        );
        
        coords.push([lon2Rad * 180 / Math.PI, lat2Rad * 180 / Math.PI]);
    }
    
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [coords]
        }
    };
};

const CheckInMap = ({ onCheckIn, onClose }) => {
    const [academiaLocation, setAcademiaLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [mapViewState, setMapViewState] = useState({
        longitude: -45.4211,
        latitude: -23.6183,
        zoom: 16
    });
    const [showUserPopup, setShowUserPopup] = useState(false);
    const watchPositionIdRef = useRef(null);

    // Buscar dados da academia e localização do usuário
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar Academia
                const academiaRes = await axios.get('/api/aluno/academia');
                
                if (academiaRes.data?.localizacao) {
                    const locAcademia = {
                        lat: academiaRes.data.localizacao.latitude,
                        lng: academiaRes.data.localizacao.longitude,
                        raio: academiaRes.data.localizacao.raioMetros || 100
                    };
                    setAcademiaLocation(locAcademia);
                    setMapViewState({
                        longitude: locAcademia.lng,
                        latitude: locAcademia.lat,
                        zoom: 16
                    });
                } else {
                    setError('Localização da academia não encontrada.');
                }

                // Buscar Localização do Usuário
                if (!navigator.geolocation) {
                    setError('Geolocalização não suportada neste dispositivo.');
                } else {
                    const geoOptions = {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    };

                    // Primeira localização rápida
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const newLocation = {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude,
                                accuracy: pos.coords.accuracy
                            };
                            setUserLocation(newLocation);
                            setMapViewState(prev => ({
                                ...prev,
                                longitude: newLocation.lng,
                                latitude: newLocation.lat
                            }));
                        },
                        (err) => {
                            console.error('Erro ao obter localização:', err);
                        },
                        geoOptions
                    );

                    // Monitoramento contínuo para melhor precisão
                    watchPositionIdRef.current = navigator.geolocation.watchPosition(
                        (pos) => {
                            const newLocation = {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude,
                                accuracy: pos.coords.accuracy
                            };
                            
                            setUserLocation(prev => {
                                if (!prev || !prev.accuracy || newLocation.accuracy < prev.accuracy) {
                                    return newLocation;
                                }
                                if (prev.lat && prev.lng) {
                                    const dist = calcularDistancia(
                                        prev.lat, prev.lng,
                                        newLocation.lat, newLocation.lng
                                    );
                                    if (dist > 10) {
                                        return newLocation;
                                    }
                                }
                                return prev;
                            });
                            
                            setMapViewState(prev => ({
                                ...prev,
                                longitude: newLocation.lng,
                                latitude: newLocation.lat
                            }));
                            
                            setError(null);
                        },
                        (err) => {
                            let errorMsg = 'Erro ao obter localização.';
                            switch(err.code) {
                                case err.PERMISSION_DENIED:
                                    errorMsg = 'Permissão de localização negada.';
                                    break;
                                case err.POSITION_UNAVAILABLE:
                                    errorMsg = 'Localização indisponível. Verifique o GPS.';
                                    break;
                                case err.TIMEOUT:
                                    errorMsg = 'Tempo esgotado. Verifique se está em área aberta.';
                                    break;
                            }
                            setError(errorMsg);
                        },
                        geoOptions
                    );
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                setError(err.response?.data?.message || 'Erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Cleanup
        return () => {
            if (watchPositionIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchPositionIdRef.current);
            }
        };
    }, []);

    const atualizarLocalizacao = () => {
        if (!navigator.geolocation) {
            setError('Geolocalização não suportada.');
            return;
        }

        setError(null);
        setUserLocation(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                };
                setUserLocation(newLocation);
                setMapViewState(prev => ({
                    ...prev,
                    longitude: newLocation.lng,
                    latitude: newLocation.lat
                }));
            },
            (err) => {
                let errorMsg = 'Erro ao atualizar localização.';
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMsg = 'Permissão de localização negada.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMsg = 'Localização indisponível. Verifique o GPS.';
                        break;
                    case err.TIMEOUT:
                        errorMsg = 'Tempo esgotado. Tente novamente.';
                        break;
                }
                setError(errorMsg);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    };

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

    const dentroDoRaio = academiaLocation && userLocation
        ? calcularDistancia(userLocation.lat, userLocation.lng, academiaLocation.lat, academiaLocation.lng) <= academiaLocation.raio
        : false;

    if (loading) {
        return (
            <div className="card" style={{padding: '3rem', textAlign: 'center', color: '#ccc'}}>
                Carregando mapa...
            </div>
        );
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
                <Map
                    {...mapViewState}
                    onMove={evt => setMapViewState(evt.viewState)}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    style={{ width: '100%', height: '100%' }}
                    reuseMaps={true}
                >
                    {/* Círculo da área permitida da academia */}
                    {academiaLocation && (() => {
                        const circleGeoJSON = criarCirculoGeoJSON(
                            { lat: academiaLocation.lat, lng: academiaLocation.lng },
                            academiaLocation.raio
                        );
                        return (
                            <Source id="academia-circle" type="geojson" data={circleGeoJSON}>
                                <Layer
                                    id="academia-circle-fill"
                                    type="fill"
                                    paint={{
                                        'fill-color': '#22c55e',
                                        'fill-opacity': 0.2
                                    }}
                                />
                                <Layer
                                    id="academia-circle-stroke"
                                    type="line"
                                    paint={{
                                        'line-color': '#22c55e',
                                        'line-width': 2
                                    }}
                                />
                            </Source>
                        );
                    })()}

                    {/* Marcador da Academia */}
                    {academiaLocation && (
                        <Marker
                            longitude={academiaLocation.lng}
                            latitude={academiaLocation.lat}
                            anchor="bottom"
                        >
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: '#22c55e',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                            onClick={() => {}}
                            />
                        </Marker>
                    )}

                    {/* Marcador do Usuário */}
                    {userLocation && (
                        <Marker
                            longitude={userLocation.lng}
                            latitude={userLocation.lat}
                            anchor="bottom"
                        >
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: dentroDoRaio ? '#3b82f6' : '#ef4444',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowUserPopup(true)}
                            />
                        </Marker>
                    )}

                    {/* Popup do Usuário */}
                    {userLocation && showUserPopup && (
                        <Popup
                            longitude={userLocation.lng}
                            latitude={userLocation.lat}
                            anchor="bottom"
                            onClose={() => setShowUserPopup(false)}
                            closeButton={true}
                            closeOnClick={false}
                        >
                            <div style={{ color: '#030a12', padding: '8px' }}>
                                <strong>📍 Sua Localização</strong>
                                <br />
                                {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                                <br />
                                {academiaLocation && (
                                    <>
                                        Distância: {Math.round(calcularDistancia(userLocation.lat, userLocation.lng, academiaLocation.lat, academiaLocation.lng))}m
                                        <br />
                                        {dentroDoRaio ? '✅ Dentro do raio' : '❌ Fora do raio'}
                                    </>
                                )}
                                {userLocation.accuracy && (
                                    <>
                                        <br />
                                        Precisão: ±{Math.round(userLocation.accuracy)}m
                                    </>
                                )}
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            <div style={{ padding: '1rem' }}>
                {error && <div style={{ color: '#f87171', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(248,113,113,0.1)', borderRadius: '4px' }}>{error}</div>}
                
                {!userLocation && (
                    <div style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        textAlign: 'center',
                        marginBottom: '1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#60a5fa',
                        border: '1px solid #60a5fa'
                    }}>
                        📍 Obtendo sua localização GPS... Aguarde um momento para melhor precisão.
                        <br />
                        <button 
                            onClick={atualizarLocalizacao}
                            style={{
                                marginTop: '8px',
                                padding: '6px 12px',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            🔄 Atualizar Localização
                        </button>
                    </div>
                )}

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
                        {userLocation.accuracy && (
                            <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                                Precisão GPS: ±{Math.round(userLocation.accuracy)}m
                                {userLocation.accuracy > 50 && (
                                    <span style={{ color: '#fbbf24', marginLeft: '8px' }}>
                                        ⚠️ Precisão baixa - saia para área aberta
                                    </span>
                                )}
                            </div>
                        )}
                        <button 
                            onClick={atualizarLocalizacao}
                            style={{
                                marginTop: '8px',
                                padding: '6px 12px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                border: '1px solid #60a5fa',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                width: '100%'
                            }}
                        >
                            🔄 Atualizar Minha Localização
                        </button>
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
