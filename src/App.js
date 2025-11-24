import { useState, useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import useTeachableMachine from "./hooks/useTeachableMachine";

// 🚨 PALABRAS MANUALES 🚨
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
  "emergencia",
  "escribir",
  "gracias",
  "internet",
  "jabon",
  "jardin",
  "maestro",
  "no",
  "pizarron",
  "si",
  "tarea",
  "semana",
  "hola como estas",
  "buenas tardes",
  "salon de clases",
  "buenos dias",
  "donde esta",
  "entendi la informacion",
  "necesito ir a la cafeteria",
  "necesito ir al baño",
  "necesito un libro",
  "no tengo clara la informacion",
];

// Generar ruta del video
const getAssetPath = (label) => {
  const cleanLabel = label.toLowerCase().trim().replace(/\s/g, "");
  return `/videos/${cleanLabel}.mp4`;
};

export default function App() {
  const [spanishText, setSpanishText] = useState("");
  const [videoSource, setVideoSource] = useState(null);
  const [isSwapped, setIsSwapped] = useState(false);

  // 📌 Estado que guarda tamaño REAL del video
  const [videoSize, setVideoSize] = useState({ width: 16, height: 9 });

  const {
    signPrediction,
    startCamera,
    stopCamera,
    isCameraLoading,
    isModelLoading,
    labels,
  } = useTeachableMachine();

  const MASTER_LABELS = [...new Set([...labels, ...MANUAL_LABELS])];

  // Actualiza texto cuando hay predicción
  useEffect(() => {
    if (signPrediction && signPrediction !== "..." && isSwapped) {
      setSpanishText(signPrediction);
    }
  }, [signPrediction, isSwapped]);

  const handleSwap = () => {
    stopCamera();
    setSpanishText("");
    setVideoSource(null);
    setIsSwapped(!isSwapped);
  };

  const handleTranslate = () => {
    if (!isSwapped) {
      const textToMatch = spanishText.toLowerCase().trim();
      const matchingLabel = MASTER_LABELS.find(
        (label) => label.toLowerCase().trim() === textToMatch
      );

      if (matchingLabel) {
        setVideoSource(getAssetPath(matchingLabel));
      } else {
        alert(`Seña no encontrada para: ${spanishText}.`);
        setVideoSource(null);
      }
    } else {
      if (!isCameraLoading && !isModelLoading) {
        startCamera();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const getButtonText = () => {
    if (isModelLoading) return "Cargando Modelo...";
    if (isCameraLoading) return "Reconociendo Señales...";
    if (isSwapped) return "Comenzar Reconocimiento (Cámara)";
    return "Traducir";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="relative flex flex-col md:flex-row items-center gap-6 w-full max-w-6xl">
        {/* ESPAÑOL */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-2 bg-white" : "order-1 bg-blue-50"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">Español</h2>
          <textarea
            placeholder="Escribe aquí... (Presiona Enter para traducir)"
            className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            value={spanishText}
            disabled={isSwapped && isCameraLoading}
            onChange={(e) => setSpanishText(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>

        {/* BOTÓN CENTRAL */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 md:-translate-y-0 md:top-auto md:translate-y-0">
          <button
            onClick={handleSwap}
            className="bg-blue-500 text-white p-4 rounded-full shadow-lg transform transition-transform hover:rotate-180"
          >
            <FiRefreshCw size={28} />
          </button>
        </div>

        {/* SEÑAS */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-1 bg-blue-50" : "order-2 bg-white"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">
            Lengua de Señas
          </h2>

          {isSwapped ? (
            // 📹 Cámara
            <div className="w-full h-80 flex flex-col items-center justify-center border border-gray-300 rounded-lg bg-black overflow-hidden">
              <video
                id="webcam"
                autoPlay
                playsInline
                muted
                className="mx-auto rounded-lg"
                style={{
                  objectFit: "cover",
                  backgroundColor: "black",
                  border: "2px solid #444",
                  transform: "scaleX(-1)",
                }}
              ></video>

              {isCameraLoading && (
                <p className="mt-2 text-white text-sm">
                  Reconociendo:{" "}
                  <strong>{signPrediction || "Iniciando..."}</strong>
                </p>
              )}
            </div>
          ) : (
            // 📼 VIDEO DINÁMICO
            <div
              className="w-full border border-gray-300 rounded-lg bg-white flex items-center justify-center"
              style={{
                aspectRatio: `${videoSize.width} / ${videoSize.height}`,
              }}
            >
              {videoSource ? (
                <video
                  key={videoSource}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                  onLoadedMetadata={(e) => {
                    const { videoWidth, videoHeight } = e.target;
                    setVideoSize({ width: videoWidth, height: videoHeight });
                  }}
                >
                  <source src={videoSource} type="video/mp4" />
                </video>
              ) : (
                <span className="text-base text-gray-400">
                  Aquí aparecerá la seña
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN TRADUCIR / RECONOCER */}
      <button
        onClick={handleTranslate}
        disabled={
          isModelLoading || isCameraLoading || (!isSwapped && !spanishText)
        }
        className={`mt-6 w-80 text-white py-2 rounded-lg transition-colors ${
          isModelLoading || isCameraLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {getButtonText()}
      </button>

      {isSwapped && isCameraLoading && (
        <button
          onClick={stopCamera}
          className="mt-2 text-red-500 font-bold hover:underline"
        >
          Detener Reconocimiento
        </button>
      )}
    </div>
  );
}
