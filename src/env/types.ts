export interface Environment {
  name: string;
  variables: ReadonlyMap<string, string>;
  filePath?: string;
}

export type ParseEnvironmentResult =
  | {
      success: true;
      environment: Environment;
    }
  | {
      success: false;
      errors: EnvironmentError[];
    };

export interface EnvironmentError {
  line: number;
  message: string;
}