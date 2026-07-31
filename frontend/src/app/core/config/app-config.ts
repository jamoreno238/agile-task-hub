import { environment } from '../../../environments/environment';

export interface AppConfig {
  production: boolean;
  apiUrl: string;
  boardHubUrl: string;
}

export const appConfig = environment satisfies AppConfig;
