import axios from 'axios'
const baseUrl = '/api/itineraries'

let token = null

const setToken = newToken => {
  token = `bearer ${newToken}`
}

const getAll = async () => {
  const response = await axios.get(baseUrl)
  return response.data
}

const getItinerariesOf = async (city) => {
  const response = await axios.get(`${baseUrl}/${city}`)
  return response.data
}

const favItinerary = async itineraryId => {
  const config = {
    headers: { Authorization: token }
  }

  const response = await axios.put(`${baseUrl}/${itineraryId}`, null, config)
  return response.data
}

const itineraryServices = {
  getAll,
  getItinerariesOf,
  favItinerary,
  setToken
}

export default itineraryServices
