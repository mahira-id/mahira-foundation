# Technical Spikes Index

Technical spikes are experiments with a question, hypothesis, fixed scope, pinned versions, evidence, and exit criteria. They are time-boxed and should not become unreviewed production architecture. Results must feed an ADR or explicit decision record.

| Spike | Question | Required outcome |
|---|---|---|
| SPIKE-001 Payload + Postgres | Can chosen Payload version/adapter run reliably against selected Supabase Postgres setup with controlled migrations? | Build, CRUD, migrations, connection/pooling evidence, ownership decision. |
| SPIKE-002 Identity boundaries | Can public Supabase auth and staff Payload auth coexist without role/session confusion? | Positive and negative auth tests, route protection, session boundary. |
| SPIKE-003 Storage + gating | Can private assets be uploaded and delivered only after correct server-side authorization? | Bucket policy, signed URL behavior, test matrix, revocation/TTL findings. |

Complete `SPIKE-TEMPLATE.md` for each experiment. Do not mark an ADR accepted solely because a happy-path demo works.
