import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Environment } from '../env/types';
import { envParser } from '../env/envParser';
import { logger } from '../utils/logger';

export class EnvironmentManager {
  private currentEnvironment: Environment | null = null;
  private availableEnvironments: Map<string, Environment> = new Map();

  async loadEnvironments(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn('No workspace folder found');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    // Look for .env files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
    ];

    for (const filename of envFiles) {
      const filePath = path.join(rootPath, filename);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const result = envParser.parse(content, filePath);

          if (result.success) {
            this.availableEnvironments.set(result.environment.name, result.environment);
            logger.info(`Loaded environment: ${result.environment.name} from ${filename}`);
          } else {
            logger.error(`Failed to parse ${filename}: ${result.errors.map(e => e.message).join(', ')}`);
          }
        } catch (error) {
          logger.error(`Error reading ${filename}: ${error}`);
        }
      }
    }

    // Set default environment
    if (this.availableEnvironments.size > 0) {
      this.currentEnvironment = 
        this.availableEnvironments.get('default') || 
        Array.from(this.availableEnvironments.values())[0];
      logger.info(`Current environment: ${this.currentEnvironment.name}`);
    }
  }

  getCurrentEnvironment(): Environment | null {
    return this.currentEnvironment;
  }

  getAvailableEnvironments(): string[] {
    return Array.from(this.availableEnvironments.keys());
  }

  setCurrentEnvironment(name: string): boolean {
    const env = this.availableEnvironments.get(name);
    if (env) {
      this.currentEnvironment = env;
      logger.info(`Switched to environment: ${name}`);
      return true;
    }
    return false;
  }

  getVariable(key: string): string | undefined {
    return this.currentEnvironment?.variables.get(key);
  }

  getAllVariables(): ReadonlyMap<string, string> {
    return this.currentEnvironment?.variables || new Map();
  }
}

export const environmentManager = new EnvironmentManager();