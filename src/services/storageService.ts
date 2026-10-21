import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export class StorageService {
  private readonly BUCKET_NAME = 'election-assets';
  private readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * Uploads an asset (candidate photo or event logo) to Supabase Storage.
   */
  async uploadAsset(file: File, folder: 'candidates' | 'logos', identifier: string): Promise<{ url: string | null; error: string | null }> {
    // 1. Validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { url: null, error: 'Format berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau SVG.' };
    }

    if (file.size > this.MAX_SIZE_BYTES) {
      return { url: null, error: 'Ukuran berkas melebihi batas maksimum 5MB.' };
    }

    const readAsDataUrl = (f: File): Promise<{ url: string | null; error: string | null }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result as string, error: null });
        reader.onerror = () => resolve({ url: null, error: 'Gagal memproses berkas lokal.' });
        reader.readAsDataURL(f);
      });
    };

    // 2. Jika Supabase aktif, coba unggah ke cloud storage
    if (isSupabaseConfigured && supabase) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const cleanId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = `${folder}/${cleanId}_${Date.now()}.${ext}`;

        const { data, error: uploadError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError && data) {
          const { data: publicData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(data.path);

          return { url: publicData.publicUrl, error: null };
        }

        console.warn('Supabase storage RLS dibatasi, beralih ke penyimpanan foto lokal:', uploadError?.message);
      } catch (err) {
        console.warn('Kendala jaringan Supabase storage, beralih ke lokal:', err);
      }
    }

    // 3. Fallback Mandiri: Selalu berhasil dengan mengubah berkas menjadi Data URL
    return readAsDataUrl(file);
  }
}

export const storageService = new StorageService();
