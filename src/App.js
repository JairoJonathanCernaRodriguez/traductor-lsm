import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

export default function App() {
  const [spanishText, setSpanishText] = useState("");
  const [signText, setSignText] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);

  const handleSwap = () => setIsSwapped(!isSwapped);

  const handleTranslate = () => {
    if (!isSwapped) {
      if (spanishText.toLowerCase() === "hola") setSignText("👋");
      else setSignText("Seña no disponible");
    } else {
      if (signText === "👋") setSpanishText("Hola");
      else setSpanishText("Palabra no disponible");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Contenedor relativo para poder usar absolute en el botón */}
      <div className="relative flex flex-col md:flex-row items-center gap-6 w-full max-w-6xl">
        {/* Cuadro Español */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-2 bg-white" : "order-1 bg-blue-50"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">Español</h2>
          <textarea
            placeholder="Escribe aquí para traducir"
            className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            value={spanishText}
            onChange={(e) => setSpanishText(e.target.value)}
          />
        </div>

        {/* Botón central absoluto */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 md:-translate-y-0 md:top-auto md:translate-y-0">
          <button
            onClick={handleSwap}
            className="bg-blue-500 text-white p-4 rounded-full shadow-lg transform transition-transform hover:rotate-180"
          >
            <FiRefreshCw size={28} />
          </button>
        </div>

        {/* Cuadro Lengua de Señas */}
        <div
          className={`flex-1 p-6 rounded-xl shadow-lg transition-all duration-500 ${
            isSwapped ? "order-1 bg-blue-50" : "order-2 bg-white"
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-center">
            Lengua de Señas
          </h2>
          <div className="w-full h-32 flex items-center justify-center border border-gray-300 rounded-lg bg-white text-4xl">
            {signText || "Aquí aparecerá la seña"}
          </div>
        </div>
      </div>

      {/* Botón Traducir */}
      <button
        onClick={handleTranslate}
        className="mt-6 w-48 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
      >
        Traducir
      </button>
    </div>
  );
}
