// src/App.js

import { useState, useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import useTeachableMachine from "./hooks/useTeachableMachine"; 

// 🚨 PALABRAS MANUALES 🚨
// Agrega aquí las palabras que tienes en videos pero NO están en tu modelo de ML.
const MANUAL_LABELS = ["gracias", "por favor"];

// Función para generar la ruta del video basándose en la etiqueta de la clase
const getAssetPath = (label) => {
    // Limpia y estandariza la etiqueta (ej: "Clase 1" -> "clase1", "Por Favor" -> "porfavor")
    const cleanLabel = label.toLowerCase().trim().replace(/\s/g, ''); 
    // Construye la ruta al archivo MP4 (asume que los videos están en /public/videos/)
    return `/videos/${cleanLabel}.mp4`;
};


export default function App() {
  const [spanishText, setSpanishText] = useState("");
  const [videoSource, setVideoSource] = useState(null); 
  const [isSwapped, setIsSwapped] = useState(false);
  
  // 1. Extraemos 'labels' del Custom Hook
  const { 
    signPrediction, 
    startCamera, 
    stopCamera, 
    isCameraLoading,
    isModelLoading,
    labels // 👈 RECIBIMOS LAS ETIQUETAS DEL MODELO
  } = useTeachableMachine();
  
  // Lista Maestra: Une las etiquetas del modelo con las palabras manuales
  const MASTER_LABELS = [...new Set([...labels, ...MANUAL_LABELS])];

  // Lógica de Sincronización Continua: Seña -> Español
  useEffect(() => {
    // Si hay una predicción válida y estamos en modo Seña -> Español, actualiza el texto.
    if (signPrediction && signPrediction !== "..." && isSwapped) {
      setSpanishText(signPrediction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signPrediction, isSwapped]);


  // --- Lógica de Intercambio (Swap) ---
  const handleSwap = () => {
    stopCamera(); 
    setSpanishText("");
    setVideoSource(null); // Limpiamos la fuente del video al cambiar
    setIsSwapped(!isSwapped);
  };

  // --- Lógica de Traducción (Botón) ---
  const handleTranslate = () => {
    if (!isSwapped) {
      // 🚨 MODO: ESPAÑOL -> SEÑAS (Usa la lista MASTER_LABELS) 🚨
      const textToMatch = spanishText.toLowerCase().trim();
      
      // Busca la coincidencia en la lista MAESTRA
      const matchingLabel = MASTER_LABELS.find(label => 
          label.toLowerCase().trim() === textToMatch
      );

      if (matchingLabel) {
        // Construimos la ruta del video dinámicamente
        setVideoSource(getAssetPath(matchingLabel));
      } else {
        alert(`Seña no encontrada para: ${spanishText}.`);
        setVideoSource(null);
      }
    } else {
      // MODO: SEÑAS -> ESPAÑOL (Iniciar la Cámara)
      if (!isCameraLoading && !isModelLoading) {
        startCamera(); 
      }
    }
  };

  const getButtonText = () => {
    if (isModelLoading) return "Cargando Modelo...";
    if (isCameraLoading) return "Reconociendo Señales..."; 
    if (isSwapped) return "Comenzar Reconocimiento (Cámara)";
    return "Traducir";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Contenedor principal */}
      <div className="relative flex flex-col md:flex-row items-center gap-6 w-full max-w-6xl">
        
        {/* Cuadro Español (Source) */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-2 bg-white" : "order-1 bg-blue-50"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">Español</h2>
          <textarea
            placeholder="Escribe aquí..."
            className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            value={spanishText}
            disabled={isSwapped && isCameraLoading} 
            onChange={(e) => setSpanishText(e.target.value)}
          />
        </div>

        {/* Botón central SWAP */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 md:-translate-y-0 md:top-auto md:translate-y-0">
          <button
            onClick={handleSwap}
            className="bg-blue-500 text-white p-4 rounded-full shadow-lg transform transition-transform hover:rotate-180"
          >
            <FiRefreshCw size={28} />
          </button>
        </div>

        {/* Cuadro Lengua de Señas (Target) */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-1 bg-blue-50" : "order-2 bg-white"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">
            Lengua de Señas
          </h2>
          {isSwapped ? (
            // MODO SEÑA -> ESPAÑOL (Muestra la Cámara)
            <div className="w-full h-80 flex flex-col items-center justify-center border border-gray-300 rounded-lg bg-black overflow-hidden">
              <video 
                  id="webcam" 
                  autoPlay 
                  playsInline 
                  muted 
                  width="200" 
                  height="200" 
                  className="mx-auto" 
              ></video>
              
              {isCameraLoading && (
                  <p className="mt-2 text-white text-sm">
                      Reconociendo: **{signPrediction || 'Iniciando...'}**
                  </p>
              )}
            </div>
          ) : (
            // MODO ESPAÑOL -> SEÑA (Muestra el Video o Placeholder)
            <div className="w-full h-32 flex items-center justify-center border border-gray-300 rounded-lg bg-white text-4xl text-gray-400">
                {videoSource ? (
                    // ⭐️ VIDEO PLAYER ⭐️
                    <video 
                        key={videoSource} 
                        width="100%" 
                        height="100%"
                        autoPlay 
                        loop
                        muted 
                        className="object-contain"
                    >
                        <source src={videoSource} type="video/mp4" />
                        Tu navegador no soporta el tag de video.
                    </video>
                ) : (
                    // PLACEHOLDER
                    <span className="text-base text-gray-400">Aquí aparecerá la seña</span>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Botón Traducir / Reconocimiento */}
      <button
        onClick={handleTranslate}
        disabled={isModelLoading || isCameraLoading || (!isSwapped && !spanishText)} 
        className={`mt-6 w-80 text-white py-2 rounded-lg transition-colors ${
          isModelLoading || isCameraLoading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {getButtonText()}
      </button>

      {/* Botón DETENER CÁMARA */}
      {isSwapped && isCameraLoading && (
         <button onClick={stopCamera} className="mt-2 text-red-500 font-bold hover:underline">
            Detener Reconocimiento
         </button>
      )}

    </div>
  );
}