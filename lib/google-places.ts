import 'server-only'

export type ExternalPlace = {
  placeId: string
  name: string
  address: string
  phone?: string
  rating?: number
  ratingCount?: number
  mapsUri?: string
}

type GooglePlace = {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
}

export type PlacesSearchResult =
  | { status: 'success'; places: ExternalPlace[] }
  | { status: 'unconfigured' | 'error'; places: [] }

export async function searchGooglePlaces(trade: string, town: string): Promise<PlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return { status: 'unconfigured', places: [] }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery: `${trade} ${town}, Magyarország`,
        languageCode: 'hu',
        regionCode: 'HU',
        maxResultCount: 10,
      }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return { status: 'error', places: [] }
    const data = await response.json() as { places?: GooglePlace[] }
    const places = (data.places ?? []).flatMap((place) => {
      if (!place.id || !place.displayName?.text || !place.formattedAddress) return []
      return [{
        placeId: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        mapsUri: place.googleMapsUri,
      } satisfies ExternalPlace]
    })
    return { status: 'success', places }
  } catch {
    return { status: 'error', places: [] }
  } finally {
    clearTimeout(timeout)
  }
}
