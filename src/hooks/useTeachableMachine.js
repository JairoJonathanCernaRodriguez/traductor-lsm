// src/hooks/useTeachableMachine.js

import { useState, useEffect, useRef } from 'react';
import * as tmPose from '@teachablemachine/pose'; 

// ⚠️ AJUSTA ESTA VARIABLE CON LA RUTA DE TU MODELO
const URL = "/my_model/"; 
const THRESHOLD = 0.9; // Confianza mínima requerida (puedes ajustarla)

let model, webcam, maxPredictions;
const size = 200; // Dimensiones de la cámara/canvas

export default function useTeachableMachine() {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [signPrediction, setSignPrediction] = useState(null);
  const [labels, setLabels] = useState([]); // 👈 ESTADO PARA LAS ETIQUETAS
  const rafRef = useRef(null); 
  const modelLoadedRef = useRef(false);

  // 1. Cargar el Modelo y las Etiquetas
  useEffect(() => {
    async function loadModel() {
      if (modelLoadedRef.current) return;
      
      try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Carga el modelo
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        
        // 🚨 LECTURA DE METADATOS PARA OBTENER LAS ETIQUETAS
        const response = await fetch(metadataURL);
        const metadata = await response.json();
        
        // Almacena las etiquetas (clases)
        setLabels(metadata.labels); 
        
        modelLoadedRef.current = true;
        
        console.log("Modelo y etiquetas de Teachable Machine cargados con éxito.");
        setIsModelLoading(false);
      } catch (error) {
        console.error("Error al cargar el modelo o metadatos. Revisa la ruta '/my_model/'", error);
        setIsModelLoading(false);
      }
    }
    loadModel();
    
    return () => { modelLoadedRef.current = false; };
  }, []);

  // 2. Inicializar la Webcam
  const startCamera = async () => {
    if (isModelLoading || isCameraLoading) return;

    try {
      const videoElement = document.getElementById("webcam");
      const flip = true; 
      
      webcam = new tmPose.Webcam(size, size, flip); 
      await webcam.setup({ videoElement }); 
      await webcam.play();

      setIsCameraLoading(true);
      setSignPrediction(null);
      
      // Iniciar el bucle de predicción continuo
      predictLoop();
      
    } catch (error) {
      console.error("No se pudo iniciar la cámara. ¿Permitiste el acceso?", error);
      setIsCameraLoading(false);
    }
  };

  // 3. El Bucle de Predicción (CONTINUO)
  const predictLoop = async () => {
    if (!webcam || !model) {
        rafRef.current = window.requestAnimationFrame(predictLoop);
        return;
    }
    
    webcam.update(); 
    
    const { posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let maxProb = 0;
    let predictionClass = null;

    for (let i = 0; i < maxPredictions; i++) {
        const prob = prediction[i].probability;
        if (prob > maxProb) {
            maxProb = prob;
            predictionClass = prediction[i].className;
        }
    }
    
    // Si la confianza es alta, ACTUALIZA la predicción, pero NO DETIENE LA CÁMARA.
    if (maxProb > THRESHOLD) {
      setSignPrediction(predictionClass);
    } else {
      setSignPrediction("...");
    }
    
    // Continúa el bucle SIEMPRE
    rafRef.current = window.requestAnimationFrame(predictLoop);
  };
  
  // 4. Detener la cámara y el bucle
  const stopCamera = () => {
    if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }
    if (webcam && webcam.webcam) { 
      webcam.stop();
    }
    setIsCameraLoading(false);
    setSignPrediction(null);
  };
  
  // 5. Limpieza al desmontar el componente
  useEffect(() => {
    return () => stopCamera();
  }, []);


  return {
    signPrediction,
    startCamera,
    stopCamera,
    isCameraLoading,
    isModelLoading,
    labels, // 👈 DEVOLVEMOS LAS ETIQUETAS
  };
}