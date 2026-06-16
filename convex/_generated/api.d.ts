/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as blogFunctions from "../blogFunctions.js";
import type * as changelogFunctions from "../changelogFunctions.js";
import type * as constants from "../constants.js";
import type * as cronTasks from "../cronTasks.js";
import type * as crons from "../crons.js";
import type * as errorLog from "../errorLog.js";
import type * as http from "../http.js";
import type * as lib_adminGuard from "../lib/adminGuard.js";
import type * as lib_validate from "../lib/validate.js";
import type * as migrations from "../migrations.js";
import type * as modelAliases from "../modelAliases.js";
import type * as notifications from "../notifications.js";
import type * as oauthActions from "../oauthActions.js";
import type * as oauthConstants from "../oauthConstants.js";
import type * as oauthPkce from "../oauthPkce.js";
import type * as oauthProviders from "../oauthProviders.js";
import type * as payments from "../payments.js";
import type * as pricing from "../pricing.js";
import type * as profiles from "../profiles.js";
import type * as providerAuth from "../providerAuth.js";
import type * as providerConnections from "../providerConnections.js";
import type * as providerMeta from "../providerMeta.js";
import type * as providerOAuth from "../providerOAuth.js";
import type * as providers from "../providers.js";
import type * as proxy from "../proxy.js";
import type * as proxyAudio from "../proxyAudio.js";
import type * as proxyConnections from "../proxyConnections.js";
import type * as proxyEmbeddings from "../proxyEmbeddings.js";
import type * as proxyImages from "../proxyImages.js";
import type * as proxyInternal from "../proxyInternal.js";
import type * as proxyModerations from "../proxyModerations.js";
import type * as publicModels from "../publicModels.js";
import type * as referralFunctions from "../referralFunctions.js";
import type * as seed from "../seed.js";
import type * as seedNewProviders from "../seedNewProviders.js";
import type * as seedPayments from "../seedPayments.js";
import type * as seedPhase2 from "../seedPhase2.js";
import type * as seedPhase3 from "../seedPhase3.js";
import type * as seedProviders from "../seedProviders.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as spendingLimits from "../spendingLimits.js";
import type * as statusFunctions from "../statusFunctions.js";
import type * as subscriptionEngine from "../subscriptionEngine.js";
import type * as supportFunctions from "../supportFunctions.js";
import type * as teamFunctions from "../teamFunctions.js";
import type * as testAuth from "../testAuth.js";
import type * as testConnection from "../testConnection.js";
import type * as testProvider from "../testProvider.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";
import type * as viktorTools from "../viktorTools.js";
import type * as webhookDispatch from "../webhookDispatch.js";
import type * as webhookFunctions from "../webhookFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  admin: typeof admin;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  auditLog: typeof auditLog;
  auth: typeof auth;
  billing: typeof billing;
  blogFunctions: typeof blogFunctions;
  changelogFunctions: typeof changelogFunctions;
  constants: typeof constants;
  cronTasks: typeof cronTasks;
  crons: typeof crons;
  errorLog: typeof errorLog;
  http: typeof http;
  "lib/adminGuard": typeof lib_adminGuard;
  "lib/validate": typeof lib_validate;
  migrations: typeof migrations;
  modelAliases: typeof modelAliases;
  notifications: typeof notifications;
  oauthActions: typeof oauthActions;
  oauthConstants: typeof oauthConstants;
  oauthPkce: typeof oauthPkce;
  oauthProviders: typeof oauthProviders;
  payments: typeof payments;
  pricing: typeof pricing;
  profiles: typeof profiles;
  providerAuth: typeof providerAuth;
  providerConnections: typeof providerConnections;
  providerMeta: typeof providerMeta;
  providerOAuth: typeof providerOAuth;
  providers: typeof providers;
  proxy: typeof proxy;
  proxyAudio: typeof proxyAudio;
  proxyConnections: typeof proxyConnections;
  proxyEmbeddings: typeof proxyEmbeddings;
  proxyImages: typeof proxyImages;
  proxyInternal: typeof proxyInternal;
  proxyModerations: typeof proxyModerations;
  publicModels: typeof publicModels;
  referralFunctions: typeof referralFunctions;
  seed: typeof seed;
  seedNewProviders: typeof seedNewProviders;
  seedPayments: typeof seedPayments;
  seedPhase2: typeof seedPhase2;
  seedPhase3: typeof seedPhase3;
  seedProviders: typeof seedProviders;
  seedTestUser: typeof seedTestUser;
  spendingLimits: typeof spendingLimits;
  statusFunctions: typeof statusFunctions;
  subscriptionEngine: typeof subscriptionEngine;
  supportFunctions: typeof supportFunctions;
  teamFunctions: typeof teamFunctions;
  testAuth: typeof testAuth;
  testConnection: typeof testConnection;
  testProvider: typeof testProvider;
  usage: typeof usage;
  users: typeof users;
  viktorTools: typeof viktorTools;
  webhookDispatch: typeof webhookDispatch;
  webhookFunctions: typeof webhookFunctions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
