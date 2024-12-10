# Making playlists

At the end of the year, lots of people publish their top albums of the year lists (like [this](https://soundopinions.org/show/993) and [this](https://www.stereogum.com/2288841/best-albums-2024/lists/album-list/)). I like to use these to discover new music to listen to. So, I created a couple tools that will make playlists of a couple songs from each album on one of these lists.

The first task is to create a JSON file from the published lists. I hand-edited the lists (or had an LLM help me extract the values).

When you have the album and artist, you have to get the tracks from somewhere. This repo has some code that hits Spotify's API to get the tracks. Spotify assigns a _popularity_ value to each track, so I use that to get the top tracks.

It's pretty brute-force, but it works well enough for my needs. There are a few cases where it can't find the album or artist; I just ignore those (or tweak the input).

There's a script to take this JSON file as input and makes a CSV as output. The CSV is in the format preferred by [Soundiiz](https://soundiiz.com/) using their import tool.

## Setup

For the Spotify API, you need a `.env` file in the root with these two values. Get them at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

```
SPOTIFY_CLIENT_ID="xxxxxx"
SPOTIFY_CLIENT_SECRET="xxxxxx"
```

## Building the scripts

Either build or watch before running.

```sh
pnpm build
```

## Running the scripts

### Get tracks for an artist/album

```sh
node dist/get-tracks.mjs --artist "Radiohead" --album "Kid A"
```

That will go to Spotify and sort the top 5 tracks by popularity:

```
Top tracks on 'Kid A' by 'Radiohead':
1. Everything In Its Right Place
2. How to Disappear Completely
3. Motion Picture Soundtrack
4. Idioteque
5. The National Anthem
```

Control the number of tracks like this:

```sh
node dist/get-tracks.mjs --artist "Sonic Youth" --album "Washing Machine" --num-tracks 2
```

```
Top tracks on 'Washing Machine' by 'Sonic Youth':
1. Little Trouble Girl
2. The Diamond Sea
```

### Build playlist CSV from album list

This will create a CSV file containing tracks from a JSON file containing artists/albums.

Given a JSON file like this (sample.json):

```json
{
  "title": "TC Sample Albums Of 2024",
  "source": "https://tcjr.org",
  "albums": [
    { "artist": "Wussy", "album": "Cincinnati Ohio" },
    { "artist": "Waxahatchee", "album": "Tigers Blood" },
    { "artist": "Hurray for the Riff Raff", "album": "The Past is Still Alive" }
  ]
}
```

Run it like this:

```sh
node dist/build-playlist.mjs --list sample.json --output sample.csv --num-tracks 3
```

It will produce a file, `sample.csv` with these contents:

```csv
title,artist,album
The Great Divide - Album Mix,Wussy,Cincinnati Ohio
The Ghosts Keep Me Alive,Wussy,Cincinnati Ohio
Inhaler,Wussy,Cincinnati Ohio
Much Ado About Nothing,Waxahatchee,Tigers Blood
Right Back to It,Waxahatchee,Tigers Blood
3 Sisters,Waxahatchee,Tigers Blood
Alibi,Hurray for the Riff Raff,The Past is Still Alive
Buffalo,Hurray for the Riff Raff,The Past is Still Alive
Hawkmoon,Hurray for the Riff Raff,The Past is Still Alive
```

## Examples

I put a couple input and output files in the `examples` directory.
