export const APP_CONFIG = {
    // URL de Producción Real
    PRODUCTION_URL: 'https://bakan.vercel.app',

    // URL dinámica: usa la de producción si está en móvil, o la actual si está en web
    getShareUrl: () => {
        // Si estamos en un entorno nativo (Capacitor), usamos la URL de producción
        // window.location.origin en Capacitor suele ser http://localhost o capacitor://localhost
        const isCapacitor = window.location.origin.includes('localhost') || window.location.protocol === 'capacitor:';

        // Si estamos en desarrollo local (pero no en app), mantenemos localhost para pruebas
        const isDev = window.location.hostname === 'localhost' && !isCapacitor;

        if (isCapacitor) {
            return APP_CONFIG.PRODUCTION_URL;
        }

        return window.location.origin;
    }
};
