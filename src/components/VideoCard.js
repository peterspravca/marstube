import Link from "next/link";
import styles from "./VideoCard.module.css";

export default function VideoCard({ video }) {
  // Piped API vráti objekt, z ktorého zoberieme potrebné údaje
  const { url, title, thumbnail, uploaderName, views, uploadedDate } = video;
  
  // Z URL vydolujeme video ID (URL začína /watch?v=...)
  const videoId = url.split("v=")[1];

  return (
    <Link href={`/watch?v=${videoId}`} className={styles.card}>
      <div className={styles.thumbnailContainer}>
        {/* Použijeme štandardný img element kvôli externým URL */}
        <img 
          src={thumbnail || "/logo.svg"} 
          alt={title} 
          className={styles.thumbnail} 
          loading="lazy"
        />
        <div className={styles.playOverlay}>
          <div className={styles.playButton}>▶</div>
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title} title={title}>{title}</h3>
        <p className={styles.uploader}>{uploaderName}</p>
        <p className={styles.meta}>
          {views ? `${views.toLocaleString()} zobrazení` : ""} 
          {uploadedDate ? ` • ${uploadedDate}` : ""}
        </p>
      </div>
    </Link>
  );
}
