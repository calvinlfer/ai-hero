# Discord Provider Configuration Findings

## Current Configuration

Your project currently uses a minimal DiscordProvider setup in `src/server/auth/config.ts:41`:

```typescript
export const authConfig = {
  providers: [
    DiscordProvider,
    // ...
  ],
  // ...
}
```

## Required Environment Variables

The DiscordProvider requires these environment variables (defined in `.env.example:18-20`):
- `AUTH_DISCORD_ID`: Your Discord application's Client ID
- `AUTH_DISCORD_SECRET`: Your Discord application's Client Secret

## Full Configuration Options

You can configure the DiscordProvider with these options:

```typescript
DiscordProvider({
  clientId: process.env.AUTH_DISCORD_ID,
  clientSecret: process.env.AUTH_DISCORD_SECRET,
  // Optional configurations:
  authorization: {
    params: {
      scope: "identify email", // Default Discord scopes
    }
  },
  profile(profile) {
    // Custom profile mapping
    return {
      id: profile.id,
      name: profile.username,
      email: profile.email,
      image: profile.avatar 
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null,
    }
  }
})
```

## Default Values

The Discord provider defaults include:
- **Scopes**: `"identify email"` - gets basic user info and email
- **Authorization URL**: Discord's OAuth2 endpoint
- **Token URL**: Discord's token exchange endpoint
- **User Info URL**: Discord's user API endpoint

## Key Insights

- **NextAuth v5 Beta**: Your project uses NextAuth v5 beta which has a simpler configuration syntax - the provider automatically uses `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET` environment variables without explicit configuration
- **Image Handling**: Your Next.js config already allows Discord CDN images (`cdn.discordapp.com`) in the image domains, showing this setup is Discord-ready
- **T3 Stack Pattern**: The environment variables are validated through the T3 env schema, but Discord vars aren't currently included in the validation - you'd need to add them to `src/env.js` for type safety

## Setup Steps

To get Discord OAuth working, you need to:

1. Create a Discord application at https://discord.com/developers/applications
2. Set your environment variables in `.env`
3. Configure your Discord app's redirect URI to `http://localhost:3000/api/auth/callback/discord` (or your production domain)

## Additional Configuration Options

The Discord provider supports additional customization options:
- Custom authorization parameters
- Custom profile data mapping
- Custom scopes beyond the defaults
- Custom token handling and validation

For advanced configurations, refer to the NextAuth.js documentation and Discord OAuth2 documentation.