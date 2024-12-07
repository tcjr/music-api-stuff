Command-line hackery to use the music APIs.

For the Spotify API, you need a `.env` file in the root with these two values. Get them at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

```
SPOTIFY_CLIENT_ID="xxxxxx"
SPOTIFY_CLIENT_SECRET="xxxxxx"
```

## Running the scripts

Either build or watch before running.

### Build

```sh
pnpm build
```

### Watch

In one terminal, run the watcher:

```sh
pnpm watch
```

### Run

Run the scripts like this:

```sh
node dist/say-hi.mjs
```
