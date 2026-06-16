import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(file, key) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanKey = key.replace(/^\//, "");

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const base = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/${cleanKey}`;
}

export async function deleteFromR2(url) {
  if (!url) return;
  try {
    // Extract the key from the full public URL
    const key = url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (err) {
    console.error("Failed to delete from R2:", err);
  }
}
