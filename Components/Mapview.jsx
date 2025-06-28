import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import useStore from '../src/store/useStore';
import CollapsibleTable from './CollapsableTable.jsx';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const gpsMarkerHTML = '<div class="gps-marker"></div>';

function MapView() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    const mapCenter = useStore((state) => state.mapCenter);
    const userLocation = useStore((state) => state.userLocation);
    const isDataLoaded = useStore((state) => state.isDataLoaded);
    const fetchMissions = useStore((state) => state.fetchMissions);
    const missionsGeoJSON = useStore((state) => state.missionsGeoJSON);
    const setUserLocation = useStore((state) => state.setUserLocation);
    const defaultCenter = useStore((state) => state.defaultCenter);
    const bounds = useStore((state) => state.bounds);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    useEffect(() => {
        if (mapRef.current) return;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/light-v10',
            center: mapCenter,
            zoom: 11,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        mapRef.current.on('load', () => {
            setMapReady(true);
        });
    }, []);

    useEffect(() => {
        if (mapRef.current && mapCenter) {
            mapRef.current.setCenter(mapCenter);
        }
    }, [mapCenter]);

    useEffect(() => {
        if (mapRef.current && bounds) {
            mapRef.current.fitBounds(bounds, { padding: 20 });
        }
    }, [bounds]);

    useEffect(() => {
        if (!mapRef.current || !userLocation) return;

        const el = document.createElement('div');
        el.className = 'gps-marker';
        el.innerHTML = gpsMarkerHTML;

        new mapboxgl.Marker(el)
            .setLngLat(userLocation)
            .addTo(mapRef.current);
    }, [userLocation]);

    useEffect(() => {
        if (!mapReady || !missionsGeoJSON || !mapRef.current) return;

        const map = mapRef.current;

        if (map.getSource('missions')) {
            map.removeLayer('missions-fill');
            map.removeLayer('missions-line');
            map.removeLayer('missions-point');
            map.removeSource('missions');
        }

        map.addSource('missions', {
            type: 'geojson',
            data: missionsGeoJSON
        });

        map.addLayer({
            id: 'missions-fill',
            type: 'fill',
            source: 'missions',
            paint: {
                'fill-color': '#088',
                'fill-opacity': 0.4
            },
            filter: ['==', '$type', 'Polygon']
        });

        map.addLayer({
            id: 'missions-line',
            type: 'line',
            source: 'missions',
            paint: {
                'line-color': '#088',
                'line-width': 2
            },
            filter: ['==', '$type', 'LineString']
        });

        map.addLayer({
            id: 'missions-point',
            type: 'circle',
            source: 'missions',
            paint: {
                'circle-radius': 6,
                'circle-color': '#f30'
            },
            filter: ['==', '$type', 'Point']
        });

        map.on('click', 'missions-point', (e) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${props.name}</strong><br/>Depth: ${props.depth}m`)
                .addTo(map);
        });
    }, [mapReady, missionsGeoJSON]);

    const handleHomeClick = () => {
        mapRef.current?.setCenter(defaultCenter);
        mapRef.current?.setZoom(11);
    };

    const handleGpsClick = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const coords = [longitude, latitude];
                    mapRef.current?.setCenter(coords);
                    mapRef.current?.setZoom(14);
                    setUserLocation(coords);
                },
                (error) => {
                    console.error('Error fetching GPS location:', error);
                    alert('Unable to retrieve your location.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    return (
        <Box sx={{ flex: 1, position: 'relative' }}>
            <div ref={mapContainerRef} style={{ height: '100vh', width: '100%' }} />
            <IconButton onClick={handleHomeClick} sx={{ position: 'absolute', top: 85, left: 9, zIndex: 1000, backgroundColor: 'white', border: 'grey 1px solid' }}>
                <HomeIcon />
            </IconButton>
            <IconButton onClick={handleGpsClick} sx={{ position: 'absolute', top: 130, left: 9, zIndex: 1000, backgroundColor: 'white', border: 'grey 1px solid' }}>
                <GpsFixedIcon />
            </IconButton>
            {isDataLoaded && <CollapsibleTable />}
        </Box>
    );
}

export default MapView;
