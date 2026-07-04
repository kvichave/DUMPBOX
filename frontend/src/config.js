const config = {
  API_BASE: (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, ''),
}

export default config
