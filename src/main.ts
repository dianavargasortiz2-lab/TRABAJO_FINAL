import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error('No se pudo iniciar la aplicación Angular.', error);
});

if (!isDevMode() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('No se pudo registrar el Service Worker.', error);
    });
  });
}
