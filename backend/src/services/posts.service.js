import { 
    createUser, 
    findAllUsers,
    deleteUserByEmail, 
    updateUserEmail, 
    addPost, 
    newUsersByDateRange, 
    topFiveAuthorsByPublishedCount, getActiveUsersWithRecentPosts_v2 
} from "../db/queries/posts/posts.repo";

import prisma from '../db/prismaClient';

// Domain error types so callers can react appropriately
export class BadRequestError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ServiceError extends Error {}

const toCleanString = (value) => (value == null ? '' : String(value)).trim();

export async function createUser (input) {
    // --- 1. Basic validation & sanitization (whitelist)
    const email = toCleanString(input.email);
    const name = toCleanString(input.name);
    const city = toCleanString(input.city);

    if (!email) {
        throw new BadRequestError('email is required.');
    }
    
    if (!name) {
        throw new BadRequestError('name is required');
    }

    if (!city) {
        throw new BadRequestError('city is required');
    }
}

