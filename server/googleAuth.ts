import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET が未設定です。Google認証は機能しません。");
  } else {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/callback";
    console.log(`[auth] Google OAuth callback URL: ${callbackURL}`);
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? "";
            const firstName = profile.name?.givenName ?? "";
            const lastName = profile.name?.familyName ?? "";
            const profileImageUrl = profile.photos?.[0]?.value ?? "";

            await storage.upsertUser({
              id: profile.id,
              email,
              firstName,
              lastName,
              profileImageUrl,
            });

            const user = {
              claims: {
                sub: profile.id,
                email,
                first_name: firstName,
                last_name: lastName,
                profile_image_url: profileImageUrl,
              },
            };
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).send("Google認証が設定されていません。GOOGLE_CLIENT_ID を設定してください。");
    }
    passport.authenticate("google", {
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("[auth] callback query:", JSON.stringify(req.query));
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/api/login",
      failureMessage: true,
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
