// WhatsApp messaging abstraction.
//
// TODAY: `DeepLinkWhatsApp` builds a wa.me link with a prefilled message --
// exactly what the original prototype did (the "Book This Service" and
// quote-form buttons). No API keys, no webhook, nothing to configure.
//
// ADD-ON PHASE (per the project roadmap -- build after the main system is
// complete): WhatsApp Business API. Implement `BusinessApiWhatsApp` below
// against the same `WhatsAppProvider` interface, set
// WHATSAPP_BUSINESS_API_TOKEN + WHATSAPP_BUSINESS_PHONE_NUMBER_ID in .env,
// and flip `getWhatsAppProvider()` to construct it instead. Nothing else in
// the app needs to change -- every call site only depends on this
// interface, never on wa.me links directly.

export interface WhatsAppProvider {
  /** Build a link the browser can open to start a chat with a prefilled message. */
  getChatLink(message: string): string;
  /** Server-side notification hook for a new lead. No-op in deep-link mode. */
  notifyNewLead(lead: { name: string; phone: string; serviceTitle?: string | null }): Promise<void>;
}

class DeepLinkWhatsApp implements WhatsAppProvider {
  constructor(private readonly businessNumber: string) {}

  getChatLink(message: string): string {
    const digits = this.businessNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  async notifyNewLead(): Promise<void> {
    // Deep-link mode has no server-to-WhatsApp channel -- the customer's own
    // browser opens the chat, so there is nothing for the server to send.
  }
}

/*
// --- Phase 2 sketch: WhatsApp Business API (Meta Cloud API) ---
// Do not enable until a Business API account + phone number are provisioned.
// Required .env vars: WHATSAPP_BUSINESS_API_TOKEN, WHATSAPP_BUSINESS_PHONE_NUMBER_ID.
// You will also need at least one pre-approved message template (e.g.
// "new_quote_ack") from the WhatsApp Manager before this can send anything.
class BusinessApiWhatsApp implements WhatsAppProvider {
  constructor(private readonly token: string, private readonly phoneNumberId: string) {}

  getChatLink(message: string): string {
    // Keep a deep-link fallback for UI buttons even in Business API mode.
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  async notifyNewLead(lead: { name: string; phone: string; serviceTitle?: string | null }): Promise<void> {
    const res = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: lead.phone.replace(/[^0-9]/g, ''),
        type: 'template',
        template: {
          name: 'new_quote_ack',
          language: { code: 'en' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: lead.name }] }],
        },
      }),
    });
    if (!res.ok) {
      console.error('[whatsapp] Business API send failed', res.status, await res.text());
    }
  }
}
*/

let cachedProvider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (cachedProvider) return cachedProvider;
  const businessNumber = process.env.BUSINESS_WHATSAPP_NUMBER || '919910503232';
  // Phase 2: return `new BusinessApiWhatsApp(token, phoneNumberId)` here once
  // WHATSAPP_BUSINESS_API_TOKEN + WHATSAPP_BUSINESS_PHONE_NUMBER_ID are set.
  cachedProvider = new DeepLinkWhatsApp(businessNumber);
  return cachedProvider;
}
