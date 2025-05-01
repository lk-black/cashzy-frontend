// Este arquivo é mantido apenas para compatibilidade
// Não contém tipos reais de banco de dados

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Definições vazias para compatibilidade
    }
    Functions: {
      // Definições vazias para compatibilidade
    }
  }
}