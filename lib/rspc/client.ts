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
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
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
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error in mutation ${procedure}:`, error)
      throw error
    }
  },
}
