/**
 * Drizzle ORM Exports Wrapper
 * Ensures ESM compatibility for drizzle-orm imports using CommonJS require
 * This fixes tsx ESM import issues with drizzle-orm
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use CommonJS require to get drizzle-orm exports (works with tsx)
const drizzle = require("drizzle-orm");

// Re-export all drizzle-orm functions
export const and = drizzle.and;
export const desc = drizzle.desc;
export const eq = drizzle.eq;
export const sql = drizzle.sql;
export const inArray = drizzle.inArray;
export const or = drizzle.or;
export const not = drizzle.not;
export const count = drizzle.count;
export const sum = drizzle.sum;
export const avg = drizzle.avg;
export const max = drizzle.max;
export const min = drizzle.min;
export const gte = drizzle.gte;
export const gt = drizzle.gt;
export const lte = drizzle.lte;
export const lt = drizzle.lt;
export const like = drizzle.like;
export const ilike = drizzle.ilike;
export const isNull = drizzle.isNull;
export const isNotNull = drizzle.isNotNull;
export const arrayContained = drizzle.arrayContained;
export const arrayContains = drizzle.arrayContains;
export const between = drizzle.between;
export const notBetween = drizzle.notBetween;
export const exists = drizzle.exists;
export const notExists = drizzle.notExists;

