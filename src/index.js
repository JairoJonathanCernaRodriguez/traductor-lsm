// src/index.js (Código modificado)

import React from 'react';
import ReactDOM from 'react-dom/client';
// 🚨 AÑADE ESTA LÍNEA DE IMPORTACIÓN 🚨
import * as tf from '@tensorflow/tfjs'; 
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 🚨 Lógica para asegurar que tfjs esté listo 🚨
tf.ready().then(() => {
    console.log("TensorFlow.js inicializado y listo.");

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
});

// If you want to start measuring performance in your app...
reportWebVitals();