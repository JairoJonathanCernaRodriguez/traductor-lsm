import { useState, useRef, useEffect } from "react";
import * as tmPose from "@teachablemachine/pose";

// 🚨 RUTA CORREGIDA: Cambiado a /my_model/ para que coincida con tu estructura de archivos.
const MODEL_URL = "/my_model/"; 
const THRESHOLD = 0.35; // Umbral de confianza reducido para aumentar la sensibilidad
const CONFIRMATION_TIME_MS = 500; // TIEMPO DE ESTABILIZACIÓN: 500 milisegundos

export default function useTeachableMachine() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [signPrediction, setSignPrediction] = useState("...");
  const [labels, setLabels] = useState([]);

  // Estados internos para la lógica de estabilización
  const lastSign = useRef(null);
  const lastSignTime = useRef(0);

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
        console.log("✅ Modelo cargado exitosamente. Etiquetas:", loadedModel.getClassLabels());

      } catch (err) {
        console.error("❌ ERROR CRÍTICO AL CARGAR EL MODELO:", err.message);
        console.warn("=======================================================================");
        console.warn("⚠️ VERIFICA LA UBICACIÓN DE TUS ARCHIVOS DE TEAHABLE MACHINE ⚠️");
        console.warn(`Asegúrate de tener la carpeta 'public/my_model/' con los archivos:`);
        console.warn(`- model.json`);
        console.warn(`- metadata.json`);
        console.warn(`- weights.bin`);
        console.warn("=======================================================================");
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => {
        stopCamera();
    }; 
  }, []);

  // 🎥 Iniciar cámara y predicción
  const startCamera = async () => {
    if (isModelLoading || !model.current) {
        console.warn("Model is still loading or failed to load. Cannot start camera.");
        return;
    }
    
    try {
      console.log("🎥 Iniciando cámara...");
      setIsCameraLoading(true);

      const videoElement = document.getElementById("webcam");
      if (!videoElement) {
        console.warn("⚠️ No se encontró el elemento <video id='webcam'>");
        setIsCameraLoading(false);
        return;
      }

      // Configurar la webcam (true = flip horizontal. Esto debe coincidir con el entrenamiento de TM)
      webcam.current = new tmPose.Webcam(400, 400, true); 
      await webcam.current.setup();
      await webcam.current.play();

      // Mostrar el stream real en el elemento video
      videoElement.srcObject = webcam.current.webcam.srcObject;

      // Reiniciar variables de confirmación
      lastSign.current = null;
      lastSignTime.current = 0;
      setSignPrediction("...");

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

      let bestPrediction = "..."
      let maxProb = 0;

      predictions.forEach((p) => {
        if (p.probability > maxProb) {
          maxProb = p.probability;
          bestPrediction = p.className;
        }
      });

      // =========================================================
      // LÓGICA DE ESTABILIZACIÓN
      // =========================================================
      
      const currentTime = Date.now();
      
      if (maxProb > THRESHOLD && bestPrediction !== '...') {
          
          if (bestPrediction === lastSign.current) {
              // Si la predicción es la misma que la anterior
              const timeElapsed = currentTime - lastSignTime.current;
              
              if (timeElapsed >= CONFIRMATION_TIME_MS) {
                  // Si ha pasado el tiempo de confirmación, actualiza la predicción final
                  if (signPrediction !== bestPrediction) {
                      setSignPrediction(bestPrediction);
                      console.log(
                          `🧠 Señal CONFIRMADA: ${bestPrediction} (${maxProb.toFixed(2)}).`
                      );
                  }
              }
          } else {
              // Si la predicción cambia (o es nueva), reinicia el contador
              // y borra la predicción mostrada para evitar que se quede atascada.
              if (signPrediction !== '...') {
                  setSignPrediction("..."); 
              }
              lastSign.current = bestPrediction;
              lastSignTime.current = currentTime;
              
              console.log(
                  `✨ Nueva posible señal: ${bestPrediction}. Esperando ${CONFIRMATION_TIME_MS}ms...`
              );
          }

      } else {
          // Si no hay seña o la confianza es baja, reinicia todo
          if (lastSign.current !== null) {
              lastSign.current = null;
              lastSignTime.current = 0;
              setSignPrediction("...");
              console.log("🛑 Detección perdida o baja confianza. Reiniciando.");
          }
      }
      
      // =========================================================
      
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

    // Reiniciar estados de control
    lastSign.current = null;
    lastSignTime.current = 0;
    setSignPrediction("...");

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