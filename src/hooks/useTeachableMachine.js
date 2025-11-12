import { useState, useRef, useEffect } from "react";
import * as tmPose from "@teachablemachine/pose";
import * as tf from "@tensorflow/tfjs";

const MODEL_URL = "/model/"; // Asegúrate que tu modelo esté en public/model/
const THRESHOLD = 0.8; // Sensibilidad mínima para aceptar una seña

export default function useTeachableMachine() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [signPrediction, setSignPrediction] = useState("...");
  const [labels, setLabels] = useState([]);

  const webcamRef = useRef(null);
  const rafRef = useRef(null);

  let model = useRef(null);
  let webcam = useRef(null);

  // 📦 Cargar modelo Teachable Machine
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("📦 Cargando modelo...");
        const loadedModel = await tmPose.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
        );
        model.current = loadedModel;
        setLabels(loadedModel.getClassLabels());
        setIsModelLoading(false);
        console.log(
          "✅ Modelo cargado correctamente:",
          loadedModel.getClassLabels()
        );
      } catch (error) {
        console.error("❌ Error al cargar el modelo:", error);
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => {
      stopCamera();
      model.current = null;
      webcam.current = null;
    };
  }, []);

  // 🎥 Iniciar cámara
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400 },
      });

      videoElement.srcObject = stream;
      webcamRef.current = videoElement;

      webcam.current = new tmPose.Webcam(400, 400, true); // ancho, alto, flip horizontal
      await webcam.current.setup();
      await webcam.current.play();

      videoElement.srcObject = webcam.current.webcam.srcObject;

      console.log("✅ Cámara lista, iniciando predicciones...");
      predictLoop();
    } catch (err) {
      console.error("❌ Error al iniciar la cámara:", err);
      setIsCameraLoading(false);
    }
  };

  // 🔁 Bucle de predicciones
  const predictLoop = async () => {
    if (!model.current || !webcam.current) return;

    try {
      webcam.current.update();

      const { posenetOutput } = await model.current.estimatePose(
        webcam.current.canvas
      );
      const prediction = await model.current.predict(posenetOutput);

      let maxProb = 0;
      let predictionClass = null;

      for (let i = 0; i < prediction.length; i++) {
        const prob = prediction[i].probability;
        if (prob > maxProb) {
          maxProb = prob;
          predictionClass = prediction[i].className;
        }
      }

      if (maxProb > THRESHOLD) {
        setSignPrediction(predictionClass);
        console.log(
          "🧠 Señal detectada:",
          predictionClass,
          "(",
          maxProb.toFixed(2),
          ")"
        );
      } else {
        setSignPrediction("...");
      }

      rafRef.current = requestAnimationFrame(predictLoop);
    } catch (err) {
      console.warn("⚠️ Error en el ciclo de predicción:", err);
      stopCamera();
    }
  };

  // 🛑 Detener cámara y limpiar recursos
  const stopCamera = () => {
    try {
      console.log("🛑 Deteniendo cámara...");
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (webcam.current?.webcam?.srcObject) {
        webcam.current.webcam.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (webcam.current) {
        webcam.current.stop();
      }

      webcam.current = null;
      setIsCameraLoading(false);
      console.log("✅ Cámara detenida completamente.");
    } catch (err) {
      console.error("❌ Error al detener la cámara:", err);
    }
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
