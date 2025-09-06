import { createClient } from '@supabase/supabase-js'

// Define Image type interface
interface Image {
  url: string;
  timestamp: string;
  smileCount: number;
  smileScore: number;
  hasWon: boolean;
  isLoading: boolean;
  isNounish: boolean;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmmiqlflfguqimxejeyf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlxbGZsZmd1cWlteGVqZXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjk5OTUsImV4cCI6MjA3MjUwNTk5NX0.LPvZKIv3vPv--x19ybIXEUWHdYs_VDuyAXacZqv3WPg';

const supabase = createClient(supabaseUrl, supabaseKey);

export const initCamera = async (videoRef: React.RefObject<HTMLVideoElement>) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 480 },
        height: { ideal: 360 }
      }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.style.transform = 'scaleX(-1)';
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Unable to access camera. Please ensure you have granted camera permissions.");
  }
};

export const uploadImage = async (blob: Blob, userId: string, isNounish: boolean) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('smiles')
    .upload(fileName, blob);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('smiles')
    .getPublicUrl(fileName);

  return { url: publicUrl, isNounish };
};

export const compressImage = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 480;
      const MAX_HEIGHT = 360;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/jpeg',
        0.9
      );
    };
    img.onerror = reject;
  });
};

export const loadExistingPhotos = async (): Promise<Image[]> => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading photos:', error);
    return [];
  }

  return data.map(photo => ({
    url: photo.image_url,
    timestamp: photo.created_at,
    smileCount: photo.smile_count || 0,
    smileScore: photo.smile_score,
    hasWon: photo.smile_score > 3,
    isLoading: false,
    isNounish: photo.is_nounish || false
  }));
};

export const handleSmileBack = async (imageUrl: string) => {
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('photos')
      .select('smile_count')
      .eq('image_url', imageUrl)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('photos')
      .update({ smile_count: (currentData.smile_count || 0) + 1 })
      .eq('image_url', imageUrl);

    if (updateError) throw updateError;

    return (currentData.smile_count || 0) + 1;
  } catch (error) {
    console.error('Error updating smile count:', error);
    throw error;
  }
};

export const deletePhoto = async (imageUrl: string, userId: string) => {
  try {
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .match({ user_id: userId, image_url: imageUrl });

    if (dbError) throw dbError;

    const fileName = imageUrl.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('smiles')
      .remove([`${userId}/${fileName}`]);

    if (storageError) throw storageError;
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};