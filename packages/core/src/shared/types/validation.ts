export type ValidationMode = 'error' | 'warn' | 'off'

export type ValidationOptions = {
  mode?: ValidationMode
  onWarning?: (message: string) => void
}
