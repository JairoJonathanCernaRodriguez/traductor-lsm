import { useState, useRef, useEffect } from "react";
import * as tmPose from "@teachablemachine/pose";

const MODEL_URL = "/model/"; // Carpeta pública donde está tu modelo
const THRESHOLD = 0.5; // Nivel mínimo de confianza

export default function useTeachableMachine() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [signPrediction, setSignPrediction] = useState("...");
  const [labels, setLabels] = useState([]);

  const webcam = useRef(null);
  const model = useRef(null);
  const rafRef = useRef(null);

  // 🧠 Cargar modelo Teachable Machine
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("📦 Cargando modelo desde", MODEL_URL);
        const loadedModel = await tmPose.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );
        model.current = loadedModel;
        setLabels(loadedModel.getClassLabels());
        console.log("✅ Modelo cargado:", loadedModel.getClassLabels());
      } catch (err) {
        console.error("❌ Error al cargar modelo:", err);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => stopCamera(); // limpiar al desmontar
  }, []);

  // 🎥 Iniciar cámara y predicción
  const startCamera = async () => {
    try {
      console.log("🎥 Iniciando cámara...");
      setIsCameraLoading(true);

      const videoElement = document.getElementById("webcam");
      if (!videoElement) {
        console.warn("⚠️ No se encontró el elemento <video id='webcam'>");
        setIsCameraLoading(false);
        return;
      }

      // Configurar la webcam (no volteada para el modelo, solo espejo visual)
      webcam.current = new tmPose.Webcam(400, 400, true); // true = flip horizontal (modelo entrenado así)
      await webcam.current.setup();
      await webcam.current.play();

      // Mostrar el stream real en el elemento video
      videoElement.srcObject = webcam.current.webcam.srcObject;

      console.log("✅ Cámara lista. Iniciando predicciones...");
      predictLoop();
    } catch (err) {
      console.error("❌ Error al iniciar la cámara:", err);
      setIsCameraLoading(false);
    }
  };

  // 🔁 Ciclo continuo de predicciones
  const predictLoop = async () => {
    if (!model.current || !webcam.current) return;

    try {
      webcam.current.update();
      const { posenetOutput } = await model.current.estimatePose(
        webcam.current.canvas
      );
      const predictions = await model.current.predict(posenetOutput);

      let bestPrediction = "...";
      let maxProb = 0;

      predictions.forEach((p) => {
        if (p.probability > maxProb) {
          maxProb = p.probability;
          bestPrediction = p.className;
        }
      });

      if (maxProb > THRESHOLD) {
        setSignPrediction(bestPrediction);
        console.log(
          `🧠 Señal detectada: ${bestPrediction} (${maxProb.toFixed(2)})`
        );
      } else {
        setSignPrediction("...");
      }

      rafRef.current = requestAnimationFrame(predictLoop);
    } catch (err) {
      console.warn("⚠️ Error en predicción:", err);
      stopCamera();
    }
  };

  // 🛑 Detener cámara
  const stopCamera = () => {
    console.log("🛑 Deteniendo cámara...");
    cancelAnimationFrame(rafRef.current);

    try {
      if (webcam.current?.webcam?.srcObject) {
        webcam.current.webcam.srcObject.getTracks().forEach((t) => t.stop());
      }
      webcam.current?.stop();
    } catch (err) {
      console.error("Error al detener la cámara:", err);
    }

    webcam.current = null;
    setIsCameraLoading(false);
  };

  return {
    isModelLoading,
    isCameraLoading,
    signPrediction,
    labels,
    startCamera,
    stopCamera,
  };
}
