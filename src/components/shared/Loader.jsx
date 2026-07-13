export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" aria-label={label} />
    </div>
  );
}
