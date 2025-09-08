// backend/src/services/posts.service.js
// Business / domain layer for "posts".
// - Validates and sanitizes input
// - Checks existence of related records (post, author)
// - Calls the repo (DB) functions to perform writes/reads
// - Translates common Prisma errors into domain errors

import { 
    topFiveAuthorsByPublishedCount, 
    getActiveUsersWithRecentPosts_v2 
} from "../db/queries/posts/posts.repo";

import prisma from '../db/prismaClient';

// Domain error types so callers can react appropriately
export class BadRequestError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ServiceError extends Error {}

const toCleanString = (value) => (value == null ? '' : String(value)).trim();



