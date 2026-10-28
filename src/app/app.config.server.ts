import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { HttpBackend } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_ORIGIN } from './services/api';
import { ApiOriginBackend } from './services/api-origin.backend';
import { API_BACKEND_ORIGIN } from '../api-backend';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Both only set here: in the browser the `/api` paths must stay relative so
    // the proxy can pick them up. See `ApiOriginBackend`.
    { provide: API_ORIGIN, useValue: API_BACKEND_ORIGIN },
    { provide: HttpBackend, useClass: ApiOriginBackend },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
