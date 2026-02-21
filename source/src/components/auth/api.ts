// Re-export API utilities with auth-specific base
import { api as baseApi, AUTH_BASE } from '../../api'

export const BASE = AUTH_BASE
export const api = baseApi
