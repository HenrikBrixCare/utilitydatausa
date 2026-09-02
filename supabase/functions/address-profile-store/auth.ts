import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTVerifyGetKey } from "jose";

const TEAM = "tilbudstjek";
const AUDIENCE = `https://vercel.com/${TEAM}`;
const ISSUERS = [`https://oidc.vercel.com/${TEAM}`, "https://oidc.vercel.com"] as const;
const keys = new Map<string, JWTVerifyGetKey>();

export async function verifyIdentity(token: string, suppliedKeys?: JWTVerifyGetKey) {
  // Decode only to choose between fixed trusted issuers; this grants no access.
  const issuer = decodeJwt(token).iss;
  if (!ISSUERS.some(allowed => issuer === allowed)) throw new Error("unauthorized");
  let jwks = suppliedKeys ?? keys.get(issuer!);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`), { timeoutDuration: 3000, cooldownDuration: 30_000 });
    keys.set(issuer!, jwks);
  }
  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ["RS256"], issuer: issuer!, audience: AUDIENCE,
    subject: `owner:${TEAM}:project:utilitydatausa:environment:production`,
    requiredClaims: ["exp", "iat", "sub", "iss", "aud", "owner_id", "project_id", "environment"],
    clockTolerance: 5, maxTokenAge: "2h"
  });
  if (payload.owner_id !== "team_9cKMaAkrIGKLnDaVoytUxCyJ"
      || payload.project_id !== "prj_Pn6jfLnaLwiWKENAC4IcxukqfIUq"
      || payload.environment !== "production" || payload.owner !== TEAM || payload.project !== "utilitydatausa") throw new Error("unauthorized");
}
