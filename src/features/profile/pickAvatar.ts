import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const AVATAR_SIZE = 512;

/**
 * Lets the user pick and square-crop a photo, then downsizes it to a 512px JPEG so it stays
 * well under the avatars bucket's 2 MB limit. Returns null if the user cancels.
 */
export async function pickAvatar(): Promise<{ uri: string; mimeType: string } | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  const rendered = await ImageManipulator.manipulate(asset.uri)
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
    .renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return { uri: saved.uri, mimeType: 'image/jpeg' };
}
