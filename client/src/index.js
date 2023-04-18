import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './configs/reportWebVitals';
import Application from './views/Application';

const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(
    <React.StrictMode>
        <Application />
    </React.StrictMode>
);
reportWebVitals();
