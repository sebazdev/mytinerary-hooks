const jwt = require('jsonwebtoken')
const itinerariesRouter = require('express').Router()
const Itinerary = require('../models/itinerary')
const City = require('../models/city')
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

itinerariesRouter.get('/', async (request, response) => {
  const itineraries = await Itinerary
    .find({}).populate('city', { name: 1, id: 1, country: 1 }).populate('activities')

  response.json(itineraries)
})

itinerariesRouter.get('/:city', async (request, response) => {
  const cityName = request.params.city
  const city = await City.findOne({ name: cityName })
  const itinerariesOf = await Itinerary
    .find({ city: city._id })
    .populate('activities')
    .populate({
      path: 'comments',
      populate: {
        path: 'user'
      }
    })
    .populate({
      path: 'comments',
      populate: {
        path: 'itinerary',
        populate: 'city'
      }
    })

  response.json(itinerariesOf)
})

itinerariesRouter.post('/', async (request, response) => {
  const body = request.body
  const city = await City.findOne({ name: body.city })

  if (!city) {
    response.status(400).json({ error: 'city not exist' })
  }

  const itinerary = new Itinerary({
    name: body.name,
    city: city._id,
    user: body.user,
    imgUrl: body.imgUrl,
    userPhotosUrls: body.userPhotosUrls,
    rating: body.rating,
    duration: body.duration,
    price: body.price,
    hashtags: body.hashtags,
    activities: [],
    comments: [],
    favs: []
  })

  const savedItinerary = await itinerary.save()
  response.json(savedItinerary)
})

itinerariesRouter.put('/:id', async (request, response) => {
  const id = request.params.id
  const itinerary = await Itinerary.findById(id)
  
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  if (!itinerary || !user) {
    response.status(400).json({ error: 'itineraries or user not exist' })
  }

  const isFav = itinerary.favs.find(u => String(u) === String(user._id))

  if(isFav) {
    itinerary.favs = itinerary.favs.filter(u => String(u) !== String(user._id))
    const favedItinerary = await itinerary.save()

    user.favs = user.favs.filter(a => String(a) !== String(favedItinerary._id))
    await user.save()

    response.json(favedItinerary)
  } else {
    itinerary.favs = itinerary.favs.concat(user._id)
    const favedItinerary = await itinerary.save()

    user.favs = user.favs.concat(favedItinerary._id)
    await user.save()
    response.json(favedItinerary)
  }
})

module.exports = itinerariesRouter
