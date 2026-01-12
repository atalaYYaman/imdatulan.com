
import { PrismaClient } from '@prisma/client';
import { list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Helper to load local .env if available (since we are running standalone)
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        console.log('Loading .env file...');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line: string) => { // Explicitly typed as string
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv();

const prisma = new PrismaClient();

async function cleanBlobs() {
    console.log('--- Cleaning Vercel Blobs ---');
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        console.warn('WARNING: BLOB_READ_WRITE_TOKEN is missing. Skipping Blob cleanup.');
        return;
    }

    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
        const result = await list({
            token,
            cursor,
            limit: 1000,
        });

        if (result.blobs.length > 0) {
            console.log(`Found ${result.blobs.length} blobs. Deleting...`);
            const urls = result.blobs.map((b: { url: string }) => b.url); // Explicitly typed 'b'
            // Delete in batches if needed, but del accepts array
            await del(urls, { token });
            console.log(`Deleted ${result.blobs.length} blobs.`);
        } else {
            console.log('No blobs found.');
        }

        hasMore = result.hasMore;
        cursor = result.cursor;
    }
    console.log('--- Blob Cleanup Complete ---');
}

async function cleanDatabase() {
    console.log('--- Cleaning Database ---');

    // DELETION ORDER MATTERS (Children first)

    console.log('Deleting TwoFactor/Verification tokens...');
    await prisma.twoFactorConfirmation.deleteMany();
    await prisma.twoFactorToken.deleteMany();
    await prisma.verificationToken.deleteMany();

    console.log('Deleting Feedback & Reports...');
    await prisma.feedback.deleteMany();
    await prisma.report.deleteMany();

    console.log('Deleting Analytics & Interactions (View, Like, Comment, UnlockedNote)...');
    await prisma.view.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.unlockedNote.deleteMany();

    console.log('Deleting Notes...');
    // Note deletion might be blocked if we didn't delete relations first, but we did.
    // Note also relates to User (uploader).
    await prisma.note.deleteMany();

    console.log('Deleting Purchases...');
    await prisma.productPurchase.deleteMany();

    console.log('Deleting Users...');
    // This is the final step for user data.
    await prisma.user.deleteMany();

    // OPTIONAL: RateLimits
    await prisma.rateLimit.deleteMany();

    console.log('--- Database Cleanup Complete ---');
    console.log('Active Universities/Faculties/Departments were PRESAVED.');
}

async function main() {
    try {
        await cleanDatabase();
        await cleanBlobs();
        console.log('✅ SYSTEM CLEANUP SUCCESSFUL');
    } catch (error) {
        console.error('❌ CLEANUP FAILED:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
