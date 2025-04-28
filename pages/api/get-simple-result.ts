import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobStatus } from './analyze-simple';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { jobId } = req.query;
    
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job ID is required'
      });
    }
    
    console.log(`Fetching result for job ID: ${jobId}`);
    
    // Get job status from memory
    const jobData = await getJobStatus(jobId);
    
    return res.status(200).json(jobData);
  } catch (error: any) {
    console.error('Error fetching job result:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch job result'
    });
  }
}