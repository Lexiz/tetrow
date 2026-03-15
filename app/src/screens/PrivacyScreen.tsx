import { C } from '../../../shared/theme';

interface Props {
  onBack: () => void;
}

export default function PrivacyScreen({ onBack }: Props) {
  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: C.bg, color: C.white,
      overflow: 'auto',
      padding: '40px 24px 60px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '6px 16px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 10, letterSpacing: 2,
          color: C.white, marginBottom: 24,
        }}>← BACK</button>

        <h1 style={{
          fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 900,
          letterSpacing: 3, marginBottom: 24,
        }}>PRIVACY POLICY</h1>

        <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, color: C.white, opacity: 0.85 }}>
          <p style={{ marginBottom: 16, opacity: 0.5 }}>Last updated: March 15, 2026</p>

          <Section title="1. Information We Collect">
            When you sign in with Google, we receive your display name, email address, and profile photo. We also collect gameplay data including match results, scores, and ELO ratings.
          </Section>

          <Section title="2. How We Use Your Information">
            Your information is used solely to: (a) authenticate your account; (b) display your name and profile to other players; (c) maintain leaderboards and match history; (d) calculate your ELO rating.
          </Section>

          <Section title="3. Data Storage">
            Your data is stored using Google Firebase (Firestore and Authentication). Data is processed in accordance with Google's security standards. We do not store payment information as the Game is free.
          </Section>

          <Section title="4. Data Sharing">
            We do not sell, trade, or share your personal information with third parties. Your display name and ELO rating are visible to other players on leaderboards and during matches.
          </Section>

          <Section title="5. Third-Party Services">
            The Game uses Google Firebase for authentication and data storage. Google's privacy policy applies to the data they process on our behalf. No other third-party analytics or advertising services are used.
          </Section>

          <Section title="6. Children's Privacy">
            The Game is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.
          </Section>

          <Section title="7. Data Retention and Deletion">
            Your data is retained as long as your account is active. You may request deletion of your account and associated data by contacting us through the Game's GitHub repository. Upon request, we will delete your data within 30 days.
          </Section>

          <Section title="8. Security">
            We implement reasonable security measures to protect your data. However, no method of electronic transmission or storage is 100% secure.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy at any time. Changes will be reflected by the "Last updated" date. Continued use of the Game constitutes acceptance of the updated policy.
          </Section>

          <Section title="10. Contact">
            For questions about this Privacy Policy or to request data deletion, contact us through the Game's GitHub repository.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700,
        letterSpacing: 2, marginBottom: 8, color: '#ffffff',
      }}>{title}</h2>
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  );
}
