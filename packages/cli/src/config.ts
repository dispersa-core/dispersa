import type { BuildConfig, ValidationOptions } from 'dispersa'

export type CliConfig = BuildConfig & {
  validation?: ValidationOptions
}

export function defineConfig(config: CliConfig): CliConfig {
  return config
}
