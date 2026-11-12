import Avatar from "@/components/Avatar";
import Poster from "@/components/Poster";
import { kindOf } from "@/lib/kinds";
import { caseFor } from "@/lib/platforms";

// One item on the shelf, inside a case that matches what it is. Hovering or
// focusing swings the front cover open on its hinge to show what is inside:
// a disc printed with the cover art (movies, games, albums) or the first
// page (books).
export default function MovieCard({ movie, kind = "movie", onOpen }) {
  const recommender = movie.recommendedBy;
  const art = movie.posterPath ? kindOf(kind).image(movie.posterPath) : null;
  // games ship in their platform case (PlayStation blue, Switch red, Xbox
  // green) labelled the way that console labels it; movies sit in a plain
  // black case with the whole poster
  const platform = kind === "game" ? caseFor(movie.platform) : kind === "movie" ? { family: "black" } : null;
  const plastic =
    (platform ? ` plastic-${platform.family}` : "") + (platform?.logo ? ` label-${platform.label}` : "");
  const label = recommender ? `${movie.title}, recommended by ${recommender.name}` : movie.title;

  return (
    <button
      type="button"
      className={`movie${recommender ? " movie-recommended" : ""}`}
      onClick={() => onOpen(movie)}
      aria-label={label}
    >
      <span className={`case case-${kind}${plastic}`}>
        <span className="case-inside" aria-hidden="true">
          {kind === "book" ? (
            <span className="book-page" />
          ) : platform?.family === "switch" ? (
            // Switch games come on a cartridge, not a disc
            <span className="cartridge" style={art ? { "--art": `url("${art}")` } : undefined} />
          ) : movie.discArt ? (
            // real printed disc from fanart.tv (movies, and albums when known)
            <img className="disc disc-art" src={movie.discArt} alt="" loading="lazy" />
          ) : (
            <span className="disc" style={art ? { "--art": `url("${art}")` } : undefined} />
          )}
        </span>
        <span className="cover">
          {platform?.logo && platform.label === "band" && (
            <span className={`cover-platform band-${platform.mark}`} aria-hidden="true">
              <img src={platform.logo} alt="" />
            </span>
          )}
          {platform?.logo && platform.label === "corner" && (
            <img className={`cover-corner corner-${platform.mark}`} src={platform.logo} alt="" aria-hidden="true" />
          )}
          <Poster title={movie.title} posterPath={movie.posterPath} kind={kind} />
          {recommender && (
            <span className="cover-band" aria-hidden="true">
              <span>Recommended</span>
              <Avatar name={recommender.name} size="xs" />
            </span>
          )}
        </span>
      </span>
      <span className="shelf-ledge" aria-hidden="true" />
    </button>
  );
}
