import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
// Asegúrate de que la ruta a tu hook sea correcta
import useTeachableMachine from "./hooks/useTeachableMachine";

// --- DATOS DEL EQUIPO DE VIDEOS (Español -> LSM) ---
// Lista de palabras que tienen video disponible en la carpeta /public/videos/
const MANUAL_LABELS = [
  "agua",
  "ayudame",
  "basura",
  "biblioteca",
  "clases",
  "classroom",
  "cocinar",
  "compañero",
  "computadora",
  "cuaderno",
  "edificio",
  "emergenncia",
  "escribir",
  "gracias",
  "internet",
  "jabon",
  "jardin",
  "maestro",
  "no",
  "pizarron",
  "salon de clases",
  "si",
  "tarea",
];

// Función auxiliar para limpiar texto y buscar el archivo
const getAssetPath = (label) => {
  const cleanLabel = label.toLowerCase().trim().replace(/\s/g, "");
  return `/videos/${cleanLabel}.mp4`;
};

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [spanishText, setSpanishText] = useState(""); // Texto input del usuario
  const [videoSource, setVideoSource] = useState(null); // Ruta del video a reproducir
  const [isSwapped, setIsSwapped] = useState(false); // FALSE = Texto->Seña | TRUE = Seña->Texto
  const [errorMessage, setErrorMessage] = useState(null); // Para mensajes de error

  // --- INTEGRACIÓN DEL EQUIPO DE IA (LSM -> Español) ---
  const {
    signPrediction, // Predicción actual (ej: "AGUA")
    startCamera, // Función para prender cámara
    stopCamera, // Función para apagar cámara
    isCameraLoading, // Estado de carga de cámara
    isModelLoading, // Estado de carga del modelo
    labels, // Etiquetas que conoce el modelo
  } = useTeachableMachine();

  // Combinamos las etiquetas del modelo con las manuales para búsqueda robusta
  const MASTER_LABELS = [...new Set([...labels, ...MANUAL_LABELS])];

  // --- LÓGICA DE CONTROL ---

  // 1. Cambiar de Modo (El botón del centro)
  const handleSwap = () => {
    stopCamera(); // Importante: Apagar cámara al cambiar de modo
    setSpanishText(""); // Limpiar texto
    setVideoSource(null); // Limpiar video
    setErrorMessage(null); // Limpiar errores
    setIsSwapped(!isSwapped);
  };

  // 2. Botón Principal de Acción
  const handleTranslate = () => {
    if (!isSwapped) {
      // MODO A: Español -> LSM (Texto a Video)
      const textToMatch = spanishText.toLowerCase().trim();

      // Buscamos si la palabra existe en nuestra lista
      const matchingLabel = MASTER_LABELS.find(
        (label) => label.toLowerCase().trim() === textToMatch
      );

      if (matchingLabel) {
        setVideoSource(getAssetPath(matchingLabel));
        setErrorMessage(null);
      } else {
        setErrorMessage(`No tenemos video para la seña: "${spanishText}"`);
        setVideoSource(null);
      }
    } else {
      // MODO B: LSM -> Español (Cámara a Texto)
      // Solo iniciamos si no está cargando ya
      if (!isCameraLoading && !isModelLoading) {
        setErrorMessage(null);
        startCamera();
      }
    }
  };

  // Permite usar la tecla Enter para activar
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  // Texto dinámico del botón según el estado
  const getButtonText = () => {
    if (isModelLoading) return "Cargando Inteligencia Artificial...";
    if (isCameraLoading && isSwapped) return "Escaneando Señas...";
    if (isSwapped) return "Iniciar Cámara";
    return "Traducir Texto";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-gray-800 bg-cover bg-center"
      style={{ backgroundImage: "url('/itsurentrada.jpg')" }}
    >
      {/* Título Principal */}
      <h1 className="text-3xl font-bold mb-8 text-black-600">
        Traductor LSM Bidireccional
      </h1>

      {/* --- CONTENEDOR PRINCIPAL (Dos Paneles) --- */}
      <div className="relative flex flex-col md:flex-row items-center gap-6 w-full max-w-5xl">
        {/* === PANEL IZQUIERDO: TEXTO / RESULTADO === */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 w-full h-64 flex flex-col ${
            isSwapped
              ? "order-2 bg-yellow-300/80" //  AQUÍ cambias el gris
              : "order-1 bg-green-300/80" // AQUÍ cambias el verde
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">Español</h2>

          {isSwapped ? (
            // VISTA RESULTADO (Modo Cámara)
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-4xl font-extrabold text-green-600 animate-pulse text-center">
                {/* Aquí mostramos lo que dice la IA */}
                {signPrediction === "..."
                  ? isCameraLoading
                    ? "Analizando..."
                    : "Presiona Iniciar"
                  : signPrediction.toUpperCase()}
              </p>
            </div>
          ) : (
            // VISTA INPUT (Modo Texto)
            <textarea
              placeholder="Escribe una palabra (ej: agua, gracias)..."
              className="flex-1 w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-lg"
              value={spanishText}
              onChange={(e) => setSpanishText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          )}
        </div>

        {/* === BOTÓN CENTRAL (SWAP) === */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
          <button
            onClick={handleSwap}
            className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 hover:rotate-180 transition-all duration-300"
            title="Cambiar modo"
          >
            <FiRefreshCw size={30} />
          </button>
        </div>
        {/* Botón swap para móvil (posición relativa) */}
        <div className="md:hidden">
          <button
            onClick={handleSwap}
            className="bg-blue-600 text-white p-3 rounded-full mb-4"
          >
            <FiRefreshCw size={24} />
          </button>
        </div>

        {/* === PANEL DERECHO: VISUAL (VIDEO / CÁMARA) === */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 w-full h-80 flex flex-col ${
            isSwapped
              ? "order-1 bg-green-300/80" //  AQUÍ cambias el verde
              : "order-2 bg-yellow-300/80" //  AQUÍ cambias el gris
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">
            Lengua de Señas
          </h2>

          {isSwapped ? (
            // VISTA CÁMARA (IA)
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
              <video
                id="webcam"
                autoPlay
                playsInline
                muted
                className="absolute w-full h-full object-cover transform scale-x-[-1]" // Espejo
              ></video>
              {!isCameraLoading && (
                <span className="text-gray-500">Cámara apagada</span>
              )}
            </div>
          ) : (
            // VISTA REPRODUCTOR VIDEO
            <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
              {videoSource ? (
                <video
                  key={videoSource} // Key fuerza recarga si cambia el video
                  src={videoSource}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-center px-4">
                  <p className="text-4xl mb-2">👋</p>
                  <p>El video aparecerá aquí</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- MENSAJES Y CONTROLES INFERIORES --- */}

      {/* Mensaje de Error */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Botón de Acción Principal */}
      <button
        onClick={handleTranslate}
        disabled={isModelLoading || (isCameraLoading && isSwapped)}
        className={`mt-8 px-10 py-3 rounded-full font-bold text-lg shadow-md transition-transform transform active:scale-95 ${
          isModelLoading
            ? "bg-gray-400 cursor-not-allowed text-gray-200"
            : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
        }`}
      >
        {getButtonText()}
      </button>

      {/* Botón para detener (solo en modo cámara) */}
      {isSwapped && isCameraLoading && (
        <button
          onClick={stopCamera}
          className="mt-4 text-red-500 hover:text-red-700 font-semibold underline text-sm"
        >
          Detener Cámara
        </button>
      )}
    </div>
  );
}
