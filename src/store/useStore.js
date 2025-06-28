import {create} from 'zustand';

const useStore = create((set) => ({
    defaultCenter: [-90.3, 38.64], // Default map center
    mapCenter: [-90.3, 38.64], // Default map center
    setMapCenter: (newCenter) => set({mapCenter: newCenter}),

    userLocation: null,
    setUserLocation: (location) => {
        set(() => ({userLocation: location ? [...location] : null})); // Ensure a new array reference
    },

    currentView: 'map',
    toggleView: () =>
        set((state) => ({
            currentView: state.currentView === 'map' ? 'dashboard' : 'map',
        })),

    isTableCollapsed: true,
    toggleTable: () => set((state) => ({isTableCollapsed: !state.isTableCollapsed})),

    aboutOpen: false, // State for dialog

    geojsonData: null,
    isDataLoaded: false,
    bounds: null,
    setBounds: (bounds) => set({bounds}),

    snackbar: {
        open: false,
        message: '',
        severity: 'success',
    },
    showSnackbar: (message, severity = 'success') =>
        set({
            snackbar: {open: true, message, severity},
        }),
    hideSnackbar: () =>
        set((state) => ({
            snackbar: {...state.snackbar, open: false},
        })),
    fetchMissions: async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/missions/`);
            const data = await response.json();
            set({
                missionsGeoJSON: data,
                isDataLoaded: true,
            });

            // Optionally auto-calculate bounds
            if (data && data.features.length > 0) {
                const coords = data.features.flatMap((f) =>
                    f.geometry.type === 'Point' ? [f.geometry.coordinates] :
                        f.geometry.type === 'LineString' || f.geometry.type === 'Polygon'
                            ? f.geometry.coordinates.flat()
                            : []
                );
                const lats = coords.map((c) => c[1]);
                const lngs = coords.map((c) => c[0]);
                const bounds = [
                    [Math.min(...lngs), Math.min(...lats)],
                    [Math.max(...lngs), Math.max(...lats)],
                ];
                set({bounds});
            }
        } catch (err) {
            console.error('Failed to fetch missions:', err);
        }
    },
}));

export default useStore;
