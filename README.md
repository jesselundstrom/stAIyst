# stAIyst

Next.js app for outfit recommendations, product matching, and virtual try-on.

## Getting started

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Recommendation provider

Recommendation generation is selected on the server with root-level env vars such as `.env.local`.

```env
RECOMMENDATION_AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_RECOMMENDATION_MODEL=claude-sonnet-4-6
```

To use OpenAI instead:

```env
RECOMMENDATION_AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_RECOMMENDATION_MODEL=gpt-4.1-mini
```

Optional:

```env
USE_MOCK_RECOMMENDATIONS=true
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

Notes:

- `RECOMMENDATION_AI_PROVIDER` defaults to `anthropic`.
- These variables are server-only; do not prefix them with `NEXT_PUBLIC_`.
- If the selected provider is missing credentials, the app falls back to mock recommendations.

## Dialogue recommendations

- `POST /api/recommend` remains the existing structured recommendation endpoint.
- `POST /api/recommend-dialogue` returns a visible stylist conversation plus the same structured recommendation payload.
- If both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are configured, the dialogue can show two turns.
- If only one dialogue provider is available, the UI shows a single stylist turn before the recommendations.
- If `USE_MOCK_RECOMMENDATIONS=true`, the dialogue uses canned mock turns and the recommendation flow stays mocked.
