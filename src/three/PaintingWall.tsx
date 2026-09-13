import { artworks } from '../data/artworks';
import Painting from './Painting';

export default function PaintingWall() {
  return (
    <>
      {artworks.map((artwork) => (
        <Painting key={artwork.id} artwork={artwork} />
      ))}
    </>
  );
}
