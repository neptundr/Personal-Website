import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, SUPABASE_BUCKET } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel serverless has a ~4.5MB body limit on Hobby; videos larger than that
// will fail and need to be uploaded directly to Supabase Storage via the
// dashboard, then pasted as a URL.

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.avi']);
const DOCUMENT_EXTS = new Set(['.pdf', '.doc', '.docx']);

function folderFor(ext: string): 'images' | 'videos' | 'documents' | null {
    if (IMAGE_EXTS.has(ext)) return 'images';
    if (VIDEO_EXTS.has(ext)) return 'videos';
    if (DOCUMENT_EXTS.has(ext)) return 'documents';
    return null;
}

function extOf(filename: string): string {
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

export async function POST(request: NextRequest) {
    const unauth = await requireAdmin(request);
    if (unauth) return unauth;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !(file instanceof File)) {
        return NextResponse.json(
            { detail: 'No file uploaded' },
            { status: 400 }
        );
    }

    if (!file.name) {
        return NextResponse.json(
            { detail: 'No file uploaded' },
            { status: 400 }
        );
    }

    const ext = extOf(file.name);
    const folder = folderFor(ext);
    if (!folder) {
        return NextResponse.json(
            { detail: `Unsupported file type: ${ext}` },
            { status: 400 }
        );
    }

    const filename = `${crypto.randomUUID()}${ext}`;
    const pathInBucket = `${folder}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        const uploadOptions: { contentType?: string; upsert: boolean } = {
            upsert: false,
        };
        if (file.type) uploadOptions.contentType = file.type;

        const { error: uploadError } = await supabaseAdmin()
            .storage.from(SUPABASE_BUCKET)
            .upload(pathInBucket, buffer, uploadOptions);

        if (uploadError) {
            return NextResponse.json(
                { detail: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            );
        }

        const { data: urlData } = supabaseAdmin()
            .storage.from(SUPABASE_BUCKET)
            .getPublicUrl(pathInBucket);

        return NextResponse.json({
            file_url: urlData.publicUrl,
            file_type: folder,
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json(
            { detail: `Upload failed: ${msg}` },
            { status: 500 }
        );
    }
}
