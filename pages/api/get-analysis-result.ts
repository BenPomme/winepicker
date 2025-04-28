import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

// Define the expected structure of the data stored in KV
interface JobResult {
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'trigger_failed';
  error?: string;
  imageUrl?: string;
  result?: {
    wines?: any[];
    status?: string;
    imageUrl?: string;
    completedAt?: string;
  };
  // For partial results during processing of multiple wines
  partialResult?: {
    wines?: any[];
    status?: string;
    imageUrl?: string;
    partialResult?: boolean;
    processedCount?: number;
    totalCount?: number;
  };
  wines?: any[]; // For backward compatibility
  updatedAt?: string;
  createdAt?: string;
  completedAt?: string;
  failedAt?: string;
}

// Define the response type for this API route
type StatusApiResponse = {
  success: boolean;
  status: JobResult['status'] | 'not_found';
  message?: string;
  data?: any; // Return all data 
  details?: string; // Add details property for error responses
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusApiResponse>
) {
  const { jobId } = req.query;
  const requestId = uuidv4();

  if (!jobId || typeof jobId !== 'string') {
    console.error(`[${requestId}] Missing or invalid jobId in query parameters`);
    return res.status(400).json({ 
      success: false,
      message: 'Missing or invalid jobId parameter',
      status: 'not_found',
      details: 'No jobId provided in query parameters'
    });
  }

  try {
    console.log(`[${requestId}] Checking status for Job ID: ${jobId}`);
    
    // Verify KV connection
    try {
      await kv.ping();
      console.log(`[${requestId}] KV connection successful`);
    } catch (error) {
      console.error(`[${requestId}] KV connection failed:`, error);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to connect to KV store',
        status: 'failed',
        details: 'KV connection error'
      });
    }

    // Fetch job data from KV
    const jobData = await kv.hgetall(`job:${jobId}`);
    console.log(`[${requestId}] Raw KV data for job ${jobId}:`, JSON.stringify(jobData, null, 2));

    if (!jobData) {
      console.error(`[${requestId}] No data found for job ${jobId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Job not found',
        status: 'not_found',
        details: 'No data found in KV store'
      });
    }

    // Handle the case where jobData doesn't have a status property
    if (!jobData.status) {
      console.error(`[${requestId}] Job data missing status for job ${jobId}`);
      return res.status(200).json({
        success: true,
        status: 'processing', // Default to processing if status is missing
        data: {
          error: jobData.error,
          imageUrl: jobData.imageUrl || (jobData.result as any)?.imageUrl,
          wines: (jobData.result as any)?.wines || jobData.wines || [],
          updatedAt: jobData.updatedAt,
          createdAt: jobData.createdAt,
          completedAt: jobData.completedAt || (jobData.result as any)?.completedAt
        }
      });
    }

    // Type assertion for jobData
    const job = jobData as unknown as JobResult;
    console.log(`[${requestId}] Job status:`, job.status);
    console.log(`[${requestId}] Job details:`, JSON.stringify(job, null, 2));

    // Extract wines from the result, partialResult, or direct wines property
    let wines = [];
    let partialInfo = null;
    
    if (job.status === 'processing' && job.partialResult?.wines?.length > 0) {
      // If we have partial results during processing, use those
      wines = job.partialResult.wines || [];
      partialInfo = {
        processedCount: job.partialResult.processedCount || wines.length,
        totalCount: job.partialResult.totalCount || wines.length,
        partialResult: true
      };
      console.log(`[${requestId}] Using partial results (${partialInfo.processedCount}/${partialInfo.totalCount} wines processed)`);
    } else {
      // Otherwise use the final result or whatever is available
      wines = job.result?.wines || job.wines || [];
    }

    // Return the current status and any available data
    return res.status(200).json({
      success: true,
      status: job.status,
      data: {
        error: job.error,
        imageUrl: job.imageUrl || job.result?.imageUrl || job.partialResult?.imageUrl,
        wines: wines,
        updatedAt: job.updatedAt,
        createdAt: job.createdAt,
        completedAt: job.completedAt || job.result?.completedAt,
        partialInfo: partialInfo
      }
    });

  } catch (error: any) {
    console.error(`[${requestId}] Error fetching job status:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch job status',
      status: 'failed',
      details: error.message
    });
  }
} 