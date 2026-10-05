export default function PhonePreview() {
  return (
    <main className="phone-preview-page">
      <div className="phone-preview-copy">
        <span>BiteMatch mobile view</span>
        <h1>Phone preview</h1>
        <p>
          This shows the actual app inside a phone-sized viewport, so mobile
          layout decisions are easier to judge.
        </p>
      </div>
      <div className="phone-preview-shell" aria-label="BiteMatch phone preview">
        <div className="phone-preview-notch" />
        <iframe
          className="phone-preview-frame"
          src="/"
          title="BiteMatch mobile app preview"
        />
      </div>
    </main>
  );
}
