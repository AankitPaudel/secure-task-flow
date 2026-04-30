import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

console.log('Angular app is starting...');
bootstrapApplication(AppComponent, appConfig)
  .then(() => console.log('Angular app bootstrapped successfully'))
  .catch((err) => {
    console.error('Error bootstrapping Angular app:', err);
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Application Error</h1>
        <p>Failed to start the application. Please check the browser console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${err.message || err}</pre>
      </div>
    `;
  });