import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
config({ path: '.env.local' });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_KEY_PREFIX = 'doodee-future-darun/';

async function cleanupR2() {
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    console.error('R2_BUCKET_NAME is not set');
    process.exit(1);
  }

  console.log(`Listing objects in bucket: ${bucketName}`);

  let continuationToken: string | undefined;
  let totalDeleted = 0;

  do {
    // List objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: R2_KEY_PREFIX,
      ContinuationToken: continuationToken,
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('No objects found to delete.');
      break;
    }

    console.log(`Found ${listResult.Contents.length} objects to delete...`);

    // Prepare objects for deletion
    const objectsToDelete = listResult.Contents.map(obj => ({
      Key: obj.Key!,
    }));

    // List what we're about to delete
    objectsToDelete.forEach(obj => {
      console.log(`  - ${obj.Key}`);
    });

    // Delete objects in batch
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });

    const deleteResult = await s3Client.send(deleteCommand);

    if (deleteResult.Deleted) {
      totalDeleted += deleteResult.Deleted.length;
      console.log(`Deleted ${deleteResult.Deleted.length} objects`);
    }

    if (deleteResult.Errors && deleteResult.Errors.length > 0) {
      console.error('Some objects failed to delete:');
      deleteResult.Errors.forEach(err => {
        console.error(`  - ${err.Key}: ${err.Message}`);
      });
    }

    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);

  console.log(`\nTotal deleted: ${totalDeleted} objects`);
  console.log('R2 cleanup completed!');
}

cleanupR2().catch(console.error);
