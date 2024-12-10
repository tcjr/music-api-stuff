import 'dotenv/config';
import pc from 'picocolors';
import { Command } from 'commander';
import { initSpotifyApi, getTopTracksFromAlbum } from './utils/spotify.mjs';

const program = new Command();
program
  .requiredOption('--artist <artist>', 'Artist name')
  .requiredOption('--album <album>', 'Album name')
  .option('--num-tracks <numTracks>', 'Number of top tracks to display', '5')
  .parse(process.argv);

const options = program.opts();

async function main() {
  await initSpotifyApi();

  const artistName = options.artist;
  const albumName = options.album;
  const numTracks = parseInt(options.numTracks);

  console.log(
    pc.white(
      `Getting top tracks for album '${albumName}' by '${artistName}'...`
    )
  );

  const topTracks = await getTopTracksFromAlbum(
    artistName,
    albumName,
    numTracks
  );

  if (topTracks) {
    console.log(pc.white(`Top tracks on '${albumName}' by '${artistName}':`));
    topTracks.forEach((track, index) => {
      console.log(pc.white(`${index + 1}. ${track}`));
    });
  } else {
    console.log(pc.red('Could not retrieve top tracks.'));
  }
}

await main();
