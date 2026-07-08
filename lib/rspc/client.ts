export const rspc = {
  query: async (key: [string, any?]): Promise<any> => {
    const [procedure, input] = key

    try {
      const queryParam = input ? `?query=${encodeURIComponent(JSON.stringify(input))}` : ""
      const response = await fetch(`/api/rspc/${procedure}${queryParam}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || errorData.message || `HTTP ${response.status}`
        const err = new Error(message) as any
        err.plaid_error_code = errorData.plaid_error_code ?? null
        err.plaid_error_type = errorData.plaid_error_type ?? null
        throw err
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error in query ${procedure}:`, error)
      throw error
    }
  },

  mutation: async (args: [string, any]): Promise<any> => {
    const [procedure, input] = args

    try {
      const response = await fetch(`/api/rspc/${procedure}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || errorData.message || `HTTP ${response.status}`
        const err = new Error(message) as any
        err.plaid_error_code = errorData.plaid_error_code ?? null
        err.plaid_error_type = errorData.plaid_error_type ?? null
        throw err
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error in mutation ${procedure}:`, error)
      throw error
    }
  },
}
