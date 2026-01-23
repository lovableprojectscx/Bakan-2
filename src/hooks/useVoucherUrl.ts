import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to open a voucher URL, generating a signed URL if needed
 * Handles both old public URLs and new file path format
 */
export const openVoucherUrl = async (urlOrPath: string): Promise<void> => {
  try {
    // Check if it's already a full URL
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      // Try to extract file path from URL and create signed URL
      const parsed = new URL(urlOrPath);
      const marker = '/vouchers/';
      const idx = parsed.pathname.indexOf(marker);
      
      if (idx !== -1) {
        const filePath = parsed.pathname.substring(idx + marker.length);
        const { data, error } = await supabase.storage
          .from('vouchers')
          .createSignedUrl(filePath, 60 * 60); // 1 hour
        
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }
      
      // Fallback to original URL
      window.open(urlOrPath, '_blank');
      return;
    }
    
    // It's a file path, create signed URL
    const { data, error } = await supabase.storage
      .from('vouchers')
      .createSignedUrl(urlOrPath, 60 * 60); // 1 hour
    
    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      throw new Error('No se pudo acceder al archivo');
    }
    
    window.open(data.signedUrl, '_blank');
  } catch (error) {
    console.error('Error opening voucher:', error);
    // Last resort fallback
    window.open(urlOrPath, '_blank');
  }
};

/**
 * Get a signed URL for displaying a voucher image
 */
export const getSignedVoucherUrl = async (urlOrPath: string): Promise<string | null> => {
  try {
    // Check if it's already a full URL
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const parsed = new URL(urlOrPath);
      const marker = '/vouchers/';
      const idx = parsed.pathname.indexOf(marker);
      
      if (idx !== -1) {
        const filePath = parsed.pathname.substring(idx + marker.length);
        const { data, error } = await supabase.storage
          .from('vouchers')
          .createSignedUrl(filePath, 60 * 60);
        
        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      }
      
      return urlOrPath;
    }
    
    // It's a file path
    const { data, error } = await supabase.storage
      .from('vouchers')
      .createSignedUrl(urlOrPath, 60 * 60);
    
    if (error || !data?.signedUrl) {
      return null;
    }
    
    return data.signedUrl;
  } catch {
    return null;
  }
};
