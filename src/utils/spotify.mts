import 'dotenv/config';
import pc from 'picocolors';
import { Command } from 'commander';

// Get Spotify API credentials from environment variables
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken: string = '';

export async function initSpotifyApi() {
  if (!clientId || !clientSecret) {
    console.error(
      pc.red(
        'Spotify API credentials not found. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.'
      )
    );
    process.exit(1);
  }

  accessToken = await getAccessToken();
}

function ensureAccessToken() {
  if (!accessToken || accessToken === '') {
    const msg = 'Access token not found. Run initSpotifyApi() first.';
    console.error(pc.red(msg));
    throw new Error(msg);
  }
}

// Function to get an access token (Client Credentials Flow)
async function getAccessToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  const accessToken = data.access_token;
  console.log(pc.gray('Connected to Spotify API.'));
  // console.log('Access token:', accessToken);
  return accessToken;
}

// Function to search for an artist
export async function searchArtist(artistName: string): Promise<string | null> {
  ensureAccessToken();
  console.log(pc.gray(`Searching for artist '${artistName}'...`));
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(
      artistName
    )}&type=artist`,
    {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );

  const data = await response.json();
  const artists = data.artists.items;
  if (artists.length > 0) {
    return artists[0].id;
  } else {
    console.log(pc.red(`Artist '${artistName}' not found.`));
    return null;
  }
}

// Function to get albums by an artist
export async function getAlbumsByArtist(artistId: string): Promise<any[]> {
  ensureAccessToken();
  let albums: any[] = [];
  let url = `https://api.spotify.com/v1/artists/${artistId}/albums?album_type=album&limit=50`;
  let batch = 0;

  while (url) {
    batch++;
    console.log(
      pc.gray(`Fetching albums for artist ${artistId} (${batch})...`)
    );
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });
    const data = await response.json();
    albums = albums.concat(data.items);
    url = data.next;
    if (batch >= 3) {
      console.log(pc.yellow('Reached maximum number of album batches.'));
      url = '';
      break;
    }
  }
  console.log(pc.gray(`Found ${albums.length} albums for artist ${artistId}.`));
  return albums;
}

// Function to get album tracks
export async function getAlbumTracks(albumId: string): Promise<any[]> {
  ensureAccessToken();
  let tracks: any[] = [];
  let url = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;
  let batch = 0;

  while (url) {
    batch++;
    console.log(pc.gray(`Fetching tracks for album ${albumId} (${batch})...`));
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });

    const data = await response.json();
    tracks = tracks.concat(data.items);
    url = data.next;
    if (batch >= 2) {
      console.log(pc.yellow('Reached maximum number of tracks batches.'));
      url = '';
      break;
    }
  }

  console.log(pc.gray(`Found ${tracks.length} tracks for album ${albumId}.`));
  return tracks;
}

// Function to get track details including popularity
export async function getTrackDetails(trackIds: string[]): Promise<any[]> {
  ensureAccessToken();
  const trackDetails: any[] = [];
  // Spotify API allows a maximum of 50 track IDs per request
  for (let i = 0; i < trackIds.length; i += 50) {
    const idsChunk = trackIds.slice(i, i + 50).join(',');
    console.log(pc.gray(`Fetching track details for track IDs...`));
    const response = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${idsChunk}`,
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      }
    );
    const data = await response.json();
    trackDetails.push(...data.tracks);
  }
  return trackDetails;
}

// Function to find a specific album (case-insensitive and fuzzy matching)
// LOL at "fuzzy matching" added by the chatbot. It's pretty lame matching.
// We could use a search library like Fuse.js for better fuzzy matching.
function findAlbum(albums: any[], albumName: string): string | null {
  console.log(pc.gray(`Trying to match album '${albumName}'...`));
  let albumId: string | null = null;
  for (const album of albums) {
    if (album.name.toLowerCase() === albumName.toLowerCase()) {
      albumId = album.id;
      break;
    }
  }

  if (!albumId) {
    // Fuzzy matching
    for (const album of albums) {
      if (album.name.toLowerCase().includes(albumName.toLowerCase())) {
        albumId = album.id;
        console.log(
          pc.yellow(
            `Exact album name not found. Using closest match: ${album.name}`
          )
        );
        break;
      }
    }
  }
  if (!albumId) {
    console.log(pc.red(`Album '${albumName}' not found.`));
    // Dump all albums for debugging
    console.table(
      albums.map((album) => {
        return { name: album.name, id: album.id };
      })
    );
  } else {
    console.log(pc.gray(`Matched album ID: ${albumId}`));
  }
  return albumId;
}

// Function to get top tracks from an album
export async function getTopTracksFromAlbum(
  artistName: string,
  albumName: string,
  numTracks: number = 5
): Promise<string[] | null> {
  try {
    // 1. Search for the artist
    const artistId = await searchArtist(artistName);
    if (!artistId) {
      return null;
    }

    // 2. Get albums by artist
    const albums = await getAlbumsByArtist(artistId);

    // 3. Find the specific album
    const albumId = findAlbum(albums, albumName);
    if (!albumId) {
      console.log(
        pc.red(`Album '${albumName}' not found for artist '${artistName}'.`)
      );
      return null;
    }

    // 4. Get album tracks
    const tracks = await getAlbumTracks(albumId);

    // 5. Get track details with popularity (in batches of 50)
    const trackIds = tracks.map((track) => track.id);
    const trackDetails = await getTrackDetails(trackIds);

    // Add a check to ensure trackDetails is not undefined
    if (!trackDetails) {
      console.error(pc.red('Failed to retrieve track details.'));
      return null;
    }

    // 6. Sort by popularity
    console.log(pc.gray('Sorting tracks by popularity...'));
    trackDetails.sort((a, b) => b.popularity - a.popularity);

    // 7. Extract top tracks
    console.log(pc.gray(`Extracting top ${numTracks} tracks...`));
    const topTrackNames = trackDetails
      .slice(0, numTracks)
      .map((track) => track.name);

    return topTrackNames;
  } catch (error) {
    console.error(pc.red('An error occurred:'), error);
    return null;
  }
}
