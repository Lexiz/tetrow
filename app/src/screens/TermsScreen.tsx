import { C } from '../../../shared/theme';

interface Props {
  onBack: () => void;
}

export default function TermsScreen({ onBack }: Props) {
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
          borderRadius: 4, padding: '8px 18px', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 12, letterSpacing: 2,
          color: C.white, marginBottom: 24,
        }}>← BACK</button>

        <h1 style={{
          fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 900,
          letterSpacing: 3, marginBottom: 24,
        }}>TERMS OF SERVICE</h1>

        <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, color: C.white, opacity: 0.85 }}>
          <p style={{ marginBottom: 16, opacity: 0.5 }}>Last updated: March 15, 2026</p>

          <Section title="1. Acceptance of Terms">
            By accessing or using TETROW ("the Game"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Game.
          </Section>

          <Section title="2. Description of Service">
            TETROW is a free-to-play competitive puzzle game where two players share one board. The Game is provided on an "as is" basis for entertainment purposes.
          </Section>

          <Section title="3. User Accounts">
            You may sign in using Google Authentication. You are responsible for maintaining the security of your account. You must not share your account or use another person's account without permission.
          </Section>

          <Section title="4. User Conduct">
            You agree not to: (a) use the Game for any unlawful purpose; (b) attempt to exploit, hack, or disrupt the Game or its servers; (c) harass, abuse, or harm other players; (d) use automated tools or bots to play the Game.
          </Section>

          <Section title="5. Intellectual Property">
            All content, graphics, and code in the Game are owned by the developer. You may not copy, modify, distribute, or create derivative works without prior written consent.
          </Section>

          <Section title="6. Termination">
            We may suspend or terminate your access to the Game at any time, for any reason, without notice. You may stop using the Game at any time.
          </Section>

          <Section title="7. Disclaimer of Warranties">
            The Game is provided "as is" without warranties of any kind, either express or implied. We do not guarantee the Game will be uninterrupted, error-free, or free of harmful components.
          </Section>

          <Section title="8. Limitation of Liability">
            To the maximum extent permitted by law, the developer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Game.
          </Section>

          <Section title="9. Changes to Terms">
            We may update these Terms at any time. Continued use of the Game after changes constitutes acceptance of the updated Terms.
          </Section>

          <Section title="10. Contact">
            For questions about these Terms, contact us through the Game's GitHub repository.
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
