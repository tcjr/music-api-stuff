import 'dotenv/config';
import pc from 'picocolors';
import { Command } from 'commander';
import { initSpotifyApi, getTopTracksFromAlbum } from './utils/spotify.mjs';
import { z } from 'zod';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';

export const ListSchema = z.object({
  title: z.string(),
  source: z.string(),
  albums: z.array(z.object({ artist: z.string(), album: z.string() })),
});

export const PlaylistSchema = z.object({
  album: z.string(),
  artist: z.string(),
  title: z.string(),
});
type Playlist = z.infer<typeof PlaylistSchema>;

const program = new Command();
program
  .requiredOption('--list <filename>', 'JSON file with the Top X albums list')
  .requiredOption('--output <filename>', 'Name of the CSV file to output')
  .option(
    '--num-tracks <numTracks>',
    'Number of tracks per album to add to playlist',
    '3'
  )
  .parse(process.argv);

const options = program.opts();

async function main() {
  await initSpotifyApi();

  const numTracks = parseInt(options.numTracks);
  const listFilename = options.list;
  // Load top albums list json from file
  const fileContents = JSON.parse(fs.readFileSync(listFilename, 'utf-8'));
  const list = ListSchema.parse(fileContents);
  console.log(pc.green(`Loaded ${list.title}`));

  // const dataToOutput = [{ album: 'Album', artist: 'Artist', title: 'Song' }];
  const dataToOutput: Playlist[] = [];
  for (const album of list.albums) {
    const artist = album.artist;
    const albumName = album.album;
    console.log(
      pc.green(
        `Getting top ${options.numTracks} tracks from album '${albumName}' by ${artist}`
      )
    );
    const tracks = await getTopTracksFromAlbum(artist, albumName, numTracks);
    if (tracks) {
      for (const track of tracks) {
        dataToOutput.push({ album: albumName, artist, title: track });
      }
    }
  }

  // Save output
  const outputFilename = options.output;
  const csvOutput = stringify(dataToOutput, {
    header: true,
    columns: ['title', 'artist', 'album'],
  });
  fs.writeFileSync(outputFilename, csvOutput);
  console.log(
    pc.green(
      `Saved playlist for ${pc.yellow(list.title)} to ${pc.blue(
        outputFilename
      )}`
    )
  );
}

await main();
